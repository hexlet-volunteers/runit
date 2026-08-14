import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';

import { useTRPCClient } from '../../../shared/api';
import { useSession } from '../../../entities/user';
import { useAuthModal } from '../../../features/auth';
import {
  createSnippet,
  updateSnippet,
  toSnippetLanguage,
} from '../../../entities/snippet';
import { type SaveStatus } from '../types';
import {
  MAX_CODE_LENGTH,
  MAX_NAME_LENGTH,
  validateSnippetDraft,
} from './draftValidation';

// Реэкспорт для вызывающего кода: правила живут в draftValidation.ts.
export { MAX_CODE_LENGTH, MAX_NAME_LENGTH, validateSnippetDraft };

/** Код ошибки tRPC, если он есть. Формат ответа сервера, а не гадание по тексту. */
function trpcErrorCode(error: unknown): string | undefined {
  const data = (error as { data?: { code?: unknown } } | null)?.data;
  return typeof data?.code === 'string' ? data.code : undefined;
}

/**
 * Текст ошибки сохранения и признак «повторять смысла нет».
 *
 * Раньше на любую ошибку показывалось «Проверьте соединение», и это вводило в
 * заблуждение в самом частом случае: сниппет чужой или удалён (NOT_FOUND), либо
 * сессия истекла (UNAUTHORIZED) — соединение при этом работает, а повторные
 * попытки заведомо бесполезны.
 */
function describeSaveError(error: unknown): {
  message: string;
  retryable: boolean;
} {
  switch (trpcErrorCode(error)) {
    case 'UNAUTHORIZED':
      return {
        message: 'Сессия истекла — войдите заново, чтобы сохранить изменения.',
        retryable: false,
      };
    case 'FORBIDDEN':
    case 'NOT_FOUND':
      return {
        message:
          'Этот сниппет вам не принадлежит или был удалён — сохранить его нельзя. Создайте копию.',
        retryable: false,
      };
    case 'BAD_REQUEST':
    case 'PAYLOAD_TOO_LARGE':
      return {
        message:
          'Сервер отклонил сниппет: проверьте имя (до 30 символов) и размер кода.',
        retryable: false,
      };
    default:
      return {
        message:
          'Не удалось сохранить сниппет. Проверьте соединение — попробуем ещё раз автоматически.',
        retryable: true,
      };
  }
}

/** Хук сохранения сниппета: создаёт новый или обновляет существующий, управляет статусом и автосохранением. */
export default function useSnippetSave(
  snippetId: number | null,
  nameRef: { current: string },
  codeRef: { current: string },
  languageRef: { current: string },
  options: { readOnly?: boolean } = {},
) {
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const { user, isGuest } = useSession();
  const auth = useAuthModal();
  const readOnly = options.readOnly ?? false;

  const [slug, setSlug] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');

  // --- Сохранение ---------------------------------------------------------
  // TODO(#826): разрешение конфликтов и оффлайн-черновики.
  const savingRef = useRef(false);
  const snippetIdRef = useRef(snippetId);
  snippetIdRef.current = snippetId;

  /**
   * Сниппет создан в этой сессии редактора.
   *
   * После создания хук делает navigate на /editor/:id, страница подгружает
   * сниппет с сервера и инициализирует им своё состояние. Всё, что человек
   * набрал за время запроса, при этом затиралось серверной копией. Флаг говорит
   * странице: состояние уже актуально, повторно его заполнять не нужно.
   */
  const createdHereRef = useRef(false);

  /**
   * Сохранение, отложенное до входа.
   *
   * Гость нажимает «Сохранить» — открывается регистрация. Раньше на этом всё и
   * заканчивалось: человек регистрировался и возвращался в редактор с
   * несохранённым сниппетом, о чём узнавал, только заметив статус.
   */
  const pendingAfterAuthRef = useRef(false);

  /**
   * Состояние неудачных попыток автосохранения (#875).
   *
   * Автосохранение запускалось по факту «статус = unsaved», а неудачная попытка
   * возвращала ровно этот статус — получался цикл: каждые 1,5 секунды новый
   * запрос и новый тост «Не удалось сохранить». При недоступном сервере это
   * бесконечный поток запросов и заваленный тостами экран.
   *
   * Теперь: пауза между попытками растёт (1,5 → 3 → 6 → 12 с), попыток не
   * больше четырёх, тост показывается один раз на серию, а не на каждую
   * попытку. Правка кода или нажатие «Сохранить» сбрасывают счётчик — значит
   * восстановившийся сервер подхватится с первого же изменения.
   */
  const AUTOSAVE_BASE_DELAY_MS = 1500;
  const AUTOSAVE_MAX_ATTEMPTS = 4;
  const failedAttemptsRef = useRef(0);
  const notifiedRef = useRef(false);
  /**
   * Ошибка, которую повтор не исправит (слишком длинное имя, чужой сниппет).
   * Автосохранение останавливается до следующей правки — иначе редактор раз в
   * полторы секунды отправлял бы запрос, заведомо получая тот же отказ.
   */
  const blockedRef = useRef(false);
  const [autosaveDelay, setAutosaveDelay] = useState(AUTOSAVE_BASE_DELAY_MS);

  const resetFailures = useCallback(() => {
    failedAttemptsRef.current = 0;
    notifiedRef.current = false;
    blockedRef.current = false;
    setAutosaveDelay(AUTOSAVE_BASE_DELAY_MS);
  }, []);

  /** Сообщает об ошибке один раз на серию и переводит статус в «не сохранено». */
  const reportFailure = useCallback(
    (message: string, retryable: boolean) => {
      if (!retryable) blockedRef.current = true;
      setSaveStatus('unsaved');
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      notifications.show({
        message,
        color: 'red',
        autoClose: retryable ? 5000 : 8000,
      });
    },
    [],
  );

  /**
   * Сохраняет сниппет (создаёт или обновляет) через API.
   *
   * `manual` — вызов кнопкой «Сохранить». Такой вызов означает «попробуй сейчас»:
   * счётчик неудач сбрасывается, поэтому попытка происходит даже после серии
   * сбоев, и об очередной неудаче пользователю снова сообщают — он ведь только
   * что нажал кнопку и ждёт ответа.
   */
  const saveNow = useCallback(
    async (manual = false) => {
      if (isGuest || !user) {
        // Продолжим сохранение сами, как только появится сессия.
        pendingAfterAuthRef.current = true;
        auth.open('register');
        return;
      }
      // Чужой сниппет доступен только для чтения: сервер всё равно ответит
      // NOT_FOUND, а тост про неудачное сохранение только пугал бы.
      if (readOnly) return;
      if (savingRef.current) return;
      if (manual) resetFailures();

      const name = nameRef.current;
      const code = codeRef.current;
      const language = toSnippetLanguage(languageRef.current);

      const invalid = validateSnippetDraft(name, code);
      if (invalid) {
        reportFailure(invalid, false);
        return;
      }

      savingRef.current = true;
      setSaveStatus('saving');
      try {
        if (snippetIdRef.current == null) {
          const created = await createSnippet(trpc, {
            name: name.trim(),
            code,
            language,
            // Черновик из редактора без модалки: самый закрытый уровень.
            // Видимость меняется кнопкой «Поделиться».
            visibility: 'private',
          });
          createdHereRef.current = true;
          setSlug(created.slug);
          navigate(`/editor/${created.id}`, { replace: true });
        } else {
          await updateSnippet(trpc, {
            id: snippetIdRef.current,
            name: name.trim(),
            code,
            language,
          });
        }
        resetFailures();
        /**
         * Статус «сохранено» — только если с момента отправки ничего не
         * изменилось. Пока сравнения не было, набранное во время запроса
         * помечалось сохранённым: редактор показывал зелёный статус, автосейв
         * не запускался, и последние правки терялись при закрытии вкладки.
         */
        const changedWhileSaving =
          nameRef.current !== name || codeRef.current !== code;
        setSaveStatus(changedWhileSaving ? 'unsaved' : 'saved');
      } catch (error) {
        failedAttemptsRef.current += 1;
        // Пауза удваивается: сервер, который лежит, не нужно опрашивать каждые
        // 1,5 секунды.
        setAutosaveDelay(
          AUTOSAVE_BASE_DELAY_MS * 2 ** (failedAttemptsRef.current - 1),
        );
        const { message, retryable } = describeSaveError(error);
        reportFailure(message, retryable);
      } finally {
        savingRef.current = false;
      }
    },
    [
      isGuest,
      user,
      auth,
      trpc,
      navigate,
      nameRef,
      codeRef,
      languageRef,
      readOnly,
      resetFailures,
      reportFailure,
    ],
  );

  /**
   * Автосохранение сохранённого сниппета. Пауза растёт после каждой неудачи,
   * а после AUTOSAVE_MAX_ATTEMPTS попыток автосохранение останавливается: дальше
   * либо пользователь правит код (сброс счётчика), либо нажимает «Сохранить».
   */
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    if (isGuest || snippetId == null || readOnly) return;
    if (blockedRef.current) return;
    if (failedAttemptsRef.current >= AUTOSAVE_MAX_ATTEMPTS) return;

    const timer = setTimeout(() => {
      void saveNow();
    }, autosaveDelay);
    return () => clearTimeout(timer);
  }, [
    saveStatus,
    autosaveDelay,
    nameRef,
    codeRef,
    languageRef,
    isGuest,
    snippetId,
    readOnly,
    saveNow,
  ]);

  /**
   * Появилась сессия, а сохранение ждало входа — доводим начатое до конца.
   * Иначе результат регистрации, начатой кнопкой «Сохранить», — несохранённый
   * сниппет.
   */
  useEffect(() => {
    if (!pendingAfterAuthRef.current) return;
    if (isGuest || !user) return;
    pendingAfterAuthRef.current = false;
    void saveNow(true);
  }, [isGuest, user, saveNow]);

  /**
   * Помечает сниппет как несохранённый — запускает автосохранение.
   * Правка означает новую попытку: счётчик неудач и пауза сбрасываются, иначе
   * после серии сбоев редактор перестал бы сохранять до перезагрузки страницы.
   */
  const markDirty = useCallback(() => {
    resetFailures();
    setSaveStatus('unsaved');
  }, [resetFailures]);

  /** Обёртка для кнопки «Сохранить»: явное действие пользователя. */
  const saveManually = useCallback(() => {
    void saveNow(true);
  }, [saveNow]);

  return {
    saveNow,
    saveManually,
    markDirty,
    saveStatus,
    setSaveStatus,
    slug,
    setSlug,
    snippetIdRef,
    createdHereRef,
  };
}

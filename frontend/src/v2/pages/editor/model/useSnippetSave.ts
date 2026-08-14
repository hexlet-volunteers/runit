import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';

import { useTRPCClient } from '../../../shared/api';
import { useSession } from '../../../entities/user';
import { useAuthModal } from '../../../features/auth';
import { createSnippet, updateSnippet,
    toSnippetLanguage,
} from '../../../entities/snippet';
import { type SaveStatus } from '../types';

/** Хук сохранения сниппета: создаёт новый или обновляет существующий, управляет статусом и автосохранением. */
export default function useSnippetSave(
  snippetId: number | null,
  nameRef: { current: string },
  codeRef: { current: string },
  languageRef: { current: string },
) {
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const { user, isGuest } = useSession();
  const auth = useAuthModal();

  const [slug, setSlug] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');

  // --- Сохранение ---------------------------------------------------------
  // TODO(#826): разрешение конфликтов и оффлайн-черновики.
  const savingRef = useRef(false);
  const snippetIdRef = useRef(snippetId);
  snippetIdRef.current = snippetId;

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
  const [autosaveDelay, setAutosaveDelay] = useState(AUTOSAVE_BASE_DELAY_MS);

  const resetFailures = useCallback(() => {
    failedAttemptsRef.current = 0;
    notifiedRef.current = false;
    setAutosaveDelay(AUTOSAVE_BASE_DELAY_MS);
  }, []);

  /**
   * Сохраняет сниппет (создаёт или обновляет) через API.
   *
   * `manual` — вызов кнопкой «Сохранить». Такой вызов означает «попробуй сейчас»:
   * счётчик неудач сбрасывается, поэтому попытка происходит даже после серии
   * сбоев, и об очередной неудаче пользователю снова сообщают — он ведь только
   * что нажал кнопку и ждёт ответа.
   */
  const saveNow = useCallback(async (manual = false) => {
    if (isGuest || !user) {
      auth.open('register');
      return;
    }
    if (savingRef.current) return;
    if (manual) resetFailures();
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      if (snippetIdRef.current == null) {
        const created = await createSnippet(trpc, {
          name: nameRef.current,
          code: codeRef.current,
          language: toSnippetLanguage(languageRef.current),
        });
        setSlug(created.slug);
        setSaveStatus('saved');
        navigate(`/editor/${created.id}`, { replace: true });
      } else {
        await updateSnippet(trpc, {
          id: snippetIdRef.current,
          name: nameRef.current,
          code: codeRef.current,
          language: toSnippetLanguage(languageRef.current),
        });
        setSaveStatus('saved');
      }
      resetFailures();
    } catch {
      failedAttemptsRef.current += 1;
      // Пауза удваивается: сервер, который лежит, не нужно опрашивать каждые
      // 1,5 секунды.
      setAutosaveDelay(
        AUTOSAVE_BASE_DELAY_MS * 2 ** (failedAttemptsRef.current - 1),
      );
      setSaveStatus('unsaved');

      if (!notifiedRef.current) {
        notifiedRef.current = true;
        notifications.show({
          message:
            'Не удалось сохранить сниппет. Проверьте соединение — попробуем ещё раз автоматически.',
          color: 'red',
        });
      }
    } finally {
      savingRef.current = false;
    }
  }, [
    isGuest,
    user,
    auth,
    trpc,
    navigate,
    nameRef,
    codeRef,
    languageRef,
    resetFailures,
  ]);

  /**
   * Автосохранение сохранённого сниппета. Пауза растёт после каждой неудачи,
   * а после AUTOSAVE_MAX_ATTEMPTS попыток автосохранение останавливается: дальше
   * либо пользователь правит код (сброс счётчика), либо нажимает «Сохранить».
   */
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    if (isGuest || snippetId == null) return;
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
    saveNow,
  ]);

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
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

import { useTRPCClient } from '../../../shared/api';
import { useSession } from '../../../entities/user';
import { useAuthModal } from '../../../features/auth';
import { createSnippet, updateSnippet } from '../../../entities/snippet';
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

  /** Сохраняет сниппет (создаёт или обновляет) через API. */
  const saveNow = useCallback(async () => {
    if (isGuest || !user) {
      auth.open('register');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      if (snippetIdRef.current == null) {
        const created = await createSnippet(trpc, {
          name: nameRef.current,
          code: codeRef.current,
          language: languageRef.current,
          userId: user.id,
        });
        setSlug(created.slug);
        setSaveStatus('saved');
        navigate(`/editor/${created.id}`, { replace: true });
      } else {
        await updateSnippet(trpc, {
          id: snippetIdRef.current,
          name: nameRef.current,
          code: codeRef.current,
          language: languageRef.current,
        });
        setSaveStatus('saved');
      }
    } catch {
      setSaveStatus('unsaved');
      notifications.show({
        message: 'Не удалось сохранить сниппет',
        color: 'red',
      });
    } finally {
      savingRef.current = false;
    }
  }, [isGuest, user, auth, trpc, navigate, nameRef, codeRef, languageRef]);

  // Автосохранение с debounce 1.5 c — только для сохранённого сниппета юзера.
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    if (isGuest || snippetId == null) return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 1500);
    return () => clearTimeout(timer);
  }, [saveStatus, nameRef, codeRef, languageRef, isGuest, snippetId, saveNow]);

  /** Помечает сниппет как несохранённый — триггерит автосохранение через 1.5 с. */
  const markDirty = useCallback(() => setSaveStatus('unsaved'), []);

  return {
    saveNow,
    markDirty,
    saveStatus,
    setSaveStatus,
    slug,
    setSlug,
    snippetIdRef,
  };
}

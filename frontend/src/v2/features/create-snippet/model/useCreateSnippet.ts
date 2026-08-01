import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useSession } from '../../../entities/user';
import { useTRPCClient } from '../../../shared/api';
import {
  SNIPPETS_QUERY_KEY,
  sampleCode,
  generateSnippetName,
  createSnippet,
} from '../../../entities/snippet';
import { type Props } from '..';

/**
 * Хук управления состоянием и логикой создания сниппета.
 *
 * При открытии модалки сбрасывает форму и генерирует случайное название.
 *
 * @param opened — открыта ли модалка
 * @param onClose — колбэк закрытия модалки
 *
 * @returns стейты формы, `rollName`, `createMutation`
 */
export default function useCreateSnippet({ opened, onClose }: Props) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useSession();

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [visibility, setVisibility] = useState('link');
  const [withExample, setWithExample] = useState(true);
  const [rolling, setRolling] = useState(false);

  const rollName = async () => {
    setRolling(true);
    try {
      const generated = await generateSnippetName(trpc);
      setName(generated.name);
    } catch {
      notifications.show({
        message: 'Не удалось сгенерировать имя',
        color: 'red',
      });
    } finally {
      setRolling(false);
    }
  };

  // При открытии — сброс формы и сразу сгенерированное имя, как в макете.
  useEffect(() => {
    if (!opened) return;
    setLanguage('javascript');
    setVisibility('link');
    setWithExample(true);
    setName('');
    rollName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const createMutation = useMutation({
    mutationFn: () =>
      createSnippet(trpc, {
        name: name.trim(),
        code: withExample ? (sampleCode[language] ?? '') : '',
        // TODO: typescript есть в langMeta на фронте, но не в createSnippetSchema — добавить туда 'typescript'.
        language,
        userId: user!.id,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      onClose();
      navigate(`/editor/${created.id}`);
    },
    onError: () => {
      notifications.show({
        message: 'Не удалось создать сниппет',
        color: 'red',
      });
    },
  });

  return {
    name,
    setName,
    language,
    setLanguage,
    visibility,
    setVisibility,
    withExample,
    setWithExample,
    rolling,
    rollName,
    createMutation,
  };
}

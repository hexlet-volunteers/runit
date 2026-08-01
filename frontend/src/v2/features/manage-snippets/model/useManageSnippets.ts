import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { useTRPCClient } from '../../../shared/api';
import { deleteSnippet, createExampleSnippet } from '..';
import { SNIPPETS_QUERY_KEY } from '../../../entities/snippet';

/** Хук управления выделением, удалением и созданием сниппетов через пример. */
export default function useManageSnippets(userId: number) {
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSnippet(trpc, id),
    onSuccess: (_data, id) => {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      notifications.show({ message: 'Сниппет удалён', color: 'blue' });
    },
    onError: () => {
      notifications.show({ message: 'Не удалось удалить сниппет', color: 'red' });
    },
  });

  const createExampleMutation = useMutation({
    mutationFn: (language: string) => createExampleSnippet(trpc, language, userId),
    onSuccess: (created: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      navigate(`/editor/${created.id}`);
    },
    onError: () => {
      notifications.show({ message: 'Не удалось создать сниппет', color: 'red' });
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  return { 
    deleteMutation,
    createExampleMutation,
    selectedIds,
    clearSelection,
    toggleSelect,
  };
}
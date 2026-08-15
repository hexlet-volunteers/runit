import { useQuery } from '@tanstack/react-query';
import { SERVER_LANGUAGES } from '.';

/**
 * Доступно ли серверное исполнение на этом стенде.
 *
 * Нужно, чтобы сказать человеку правду заранее, а не после нажатия «Выполнить».
 * Ровно на этом обожглись: сайт развёрнут на PaaS, где docker недоступен в
 * принципе, поэтому все девять серверных языков отвечают «Серверное исполнение
 * сейчас недоступно» — но узнать это можно было только написав код и запустив
 * его. Выглядит как поломка, хотя это свойство площадки.
 *
 * Статус спрашиваем один раз на сессию: он меняется не чаще, чем разворачивают
 * стенд, а лишний запрос на каждой странице редактора ни к чему.
 */

export interface RunnerStatus {
  languages: string[];
  available: boolean;
  message: string | null;
}

export interface RunnerStatusClient {
  runner: { status: { query: () => Promise<RunnerStatus> } };
}

export const RUNNER_STATUS_QUERY_KEY = ['runner-status'] as const;

export function useRunnerStatus(client: RunnerStatusClient) {
  const { data } = useQuery({
    queryKey: RUNNER_STATUS_QUERY_KEY,
    queryFn: () => client.runner.status.query(),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  return data ?? null;
}

/**
 * Почему этот язык нельзя запустить здесь, или null, если можно.
 *
 * Пока статус не получен, молчим: пустая подсказка лучше, чем предупреждение,
 * которое через секунду исчезнет.
 */
export function unavailableReason(
  language: string,
  status: RunnerStatus | null,
): string | null {
  if (!status) return null;
  if (!SERVER_LANGUAGES.has(language)) return null;

  if (!status.available) {
    return (
      status.message ??
      'Серверное исполнение на этом стенде недоступно — код не запустится.'
    );
  }
  if (!status.languages.includes(language)) {
    return `Язык ${language} на этом стенде отключён — код не запустится.`;
  }
  return null;
}

import { describe, expect, test } from 'vitest';
import { type RunnerStatus, unavailableReason } from './useRunnerStatus';

/**
 * Предупреждение о недоступном серверном исполнении.
 *
 * Случай, ради которого это появилось: боевой стенд развёрнут на PaaS, где
 * docker недоступен в принципе. Девять серверных языков там не запускаются
 * никогда, но узнать об этом можно было только написав код и нажав «Выполнить»
 * — то есть свойство площадки выглядело как поломка сайта.
 */

const status = (over: Partial<RunnerStatus> = {}): RunnerStatus => ({
  languages: ['python', 'php', 'ruby', 'java', 'typescript', 'go', 'cpp', 'sql', 'bash'],
  available: true,
  message: null,
  ...over,
});

describe('когда предупреждать', () => {
  test('серверный язык на стенде без раннера — предупреждаем словами сервера', () => {
    const reason = unavailableReason(
      'php',
      status({ available: false, message: 'Серверное исполнение сейчас недоступно.' }),
    );

    expect(reason).toBe('Серверное исполнение сейчас недоступно.');
  });

  test('сервер молчит о причине — объясняем сами', () => {
    const reason = unavailableReason('python', status({ available: false, message: null }));

    expect(reason).toContain('не запустится');
  });

  test('язык выключен на этом стенде — называем язык', () => {
    const reason = unavailableReason(
      'go',
      status({ languages: ['python', 'php'] }),
    );

    expect(reason).toContain('go');
  });
});

describe('когда молчать', () => {
  test('раннер работает — предупреждать не о чем', () => {
    expect(unavailableReason('python', status())).toBeNull();
  });

  test('JavaScript и разметка не зависят от сервера', () => {
    // Они исполняются в браузере, поэтому недоступный раннер им не помеха —
    // предупреждение было бы ложной тревогой.
    const dead = status({ available: false, message: 'нет docker' });
    expect(unavailableReason('javascript', dead)).toBeNull();
    expect(unavailableReason('html', dead)).toBeNull();
    expect(unavailableReason('css', dead)).toBeNull();
  });

  test('пока статус не пришёл — молчим', () => {
    // Иначе предупреждение мигало бы на каждой загрузке редактора.
    expect(unavailableReason('php', null)).toBeNull();
  });
});

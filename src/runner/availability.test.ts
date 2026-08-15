import assert from 'node:assert/strict';
import { test } from 'node:test';
import { looksLikeDaemonProblem } from './availability';

/**
 * Разбор ошибок docker при проверке образа.
 *
 * Случай из практики: во время обновления Docker Desktop `docker image inspect`
 * отвечал «No such image» на существующий образ — `docker images` его показывал,
 * а `docker run` с ним работал. Приложение объявляло, что образ не собран, и
 * советовало пересобрать все девять. Совет был бесполезным: нужно было
 * подождать, пока демон вернётся.
 *
 * Отличить эти два состояния можно только по тексту ошибки самого docker,
 * поэтому набор строк зафиксирован тестом.
 */

test('сбой демона узнаётся по типичным сообщениям docker', () => {
  const daemonErrors = [
    'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?',
    'error during connect: Get "http://docker/v1.47/version": EOF',
    'dial unix /var/run/docker.sock: connect: connection refused',
    'context deadline exceeded',
    'The docker daemon is not running',
  ];

  for (const message of daemonErrors) {
    assert.equal(
      looksLikeDaemonProblem(message),
      true,
      `не распознано как сбой демона: ${message}`,
    );
  }
});

test('отсутствие образа остаётся отсутствием образа', () => {
  // Здесь совет «соберите образы» уместен, и подменять его нельзя.
  assert.equal(
    looksLikeDaemonProblem(
      'Error response from daemon: No such image: runit-runner-python:1',
    ),
    false,
  );
  assert.equal(
    looksLikeDaemonProblem('Error: No such object: runit-runner-go:1'),
    false,
  );
  assert.equal(looksLikeDaemonProblem(''), false);
});

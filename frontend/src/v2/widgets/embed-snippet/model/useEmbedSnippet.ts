import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  type Snippet,
  useSnippetBySlug,
  useSnippetByShortCode,
} from '../../../entities/snippet';
import { useTRPCClient } from '../../../shared/api';
import { langMeta } from '../../../shared/theme';
import {
  runCode,
  unsupportedLanguage,
  type RunResult,
} from '../../../shared/runner';
import { isPreviewLanguage } from '../../../shared/runner/preview';

export function useEmbedSnippet() {
  const { username = '', slug = '', shortCode } = useParams();
  const [searchParams] = useSearchParams();

  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';

  const heightParam = Number(searchParams.get('height'));
  const widgetHeight =
    Number.isFinite(heightParam) && heightParam > 0 ? heightParam : null;

  const showOutput = searchParams.get('output') !== '0';
  const readOnly = searchParams.get('readonly') === '1';
  const autorun = searchParams.get('autorun') === '1';

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  // Счётчик запусков превью вёрстки: инкремент форсирует перерисовку iframe.
  const [runKey, setRunKey] = useState(0);
  const [code, setCode] = useState('');

  // Автозапуск один раз на загрузку: без флага повторный приход данных
  // из кеша react-query снова отправлял бы код в раннер.
  const autoRunRef = useRef(false);

  const trpc = useTRPCClient();

  // Источник данных зависит от вида ссылки: короткая /s/:code или /s/:user/:slug.
  const byShortCode = useSnippetByShortCode(shortCode);
  const bySlug = useSnippetBySlug(
    shortCode ? '' : username,
    shortCode ? '' : slug,
  );

  const {
    data: snippet,
    isLoading,
    isError,
  } = shortCode ? byShortCode : bySlug;

  useEffect(() => {
    if (snippet) {
      setCode(snippet.code);
    }
  }, [snippet]);

  const run = async (s: Snippet, codeToRun = code) => {
    // html/css показываем как страницу, а не как вывод в консоль (#853).
    if (isPreviewLanguage(s.language)) {
      setRunKey((key) => key + 1);
      return;
    }

    const meta = langMeta[s.language];

    if (!meta?.runnable) {
      setResult(unsupportedLanguage(meta?.label ?? s.language));
      return;
    }

    setRunning(true);

    try {
      setResult(
        await runCode({
          language: s.language,
          code: codeToRun,
          client: trpc,
        }),
      );
    } catch (error) {
      console.error('Не удалось выполнить сниппет:', error);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (autorun && snippet && !autoRunRef.current) {
      autoRunRef.current = true;
      void run(snippet as Snippet, snippet.code);
    }
  }, [autorun, snippet]);

  return {
    shortCode,
    username,
    slug,
    theme,
    isDark,
    widgetHeight,
    showOutput,
    readOnly,
    snippet,
    isLoading,
    isError,
    result,
    running,
    runKey,
    code,
    setCode,
    run,
  };
}

import { Box, Loader } from '@mantine/core';
import MonacoEditor from '@monaco-editor/react';
import { monacoLanguage } from '../../../shared/lib';

type Props = {
  code: string;
  language: string;
  isDark: boolean;
  readOnly: boolean;
  accentColor: string;
  onChange: (value: string) => void;
};

export default function EmbedEditor({
  code,
  language,
  isDark,
  readOnly,
  accentColor,
  onChange,
}: Props) {
  return (
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        background: isDark ? '#1e1e1e' : '#ffffff',
      }}
    >
      <MonacoEditor
        height="100%"
        theme={isDark ? 'vs-dark' : 'vs'}
        language={monacoLanguage(language)}
        value={code}
        onChange={(value) => onChange(value ?? '')}
        loading={<Loader color={accentColor} />}
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          minimap: { enabled: false },
          tabSize: 2,
          insertSpaces: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12 },
          renderLineHighlight: 'line',
        }}
      />
    </Box>
  );
}

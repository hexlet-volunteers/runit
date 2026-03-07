import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Group,
  Button,
  Input,
  Divider,
  ThemeIcon,
  Card,
  Code,
  Text,
  Stack,
  Accordion,
  Paper,
  CopyButton,
  useMantineTheme,
  Loader,
} from '@mantine/core';
import '@mantine/core/styles.css';
import MonacoEditor from '@monaco-editor/react';
import { actions as codeActions } from '../../newSlices/editorSlice';
import { RootState } from '../../slices/index';
import PlayIcon from '../../assets/images/icons/snippetIcons/Play.svg?react';
import SaveIcon from '../../assets/images/icons/snippetIcons/DocumentPlus.svg?react';
import LinkIcon from '../../assets/images/icons/snippetIcons/Link.svg?react';


function ItemButtons() {
  const items = [
    { id: 1, icon: null, label: 'Мои сниппеты', variant: 'default' },
    { id: 2, icon: PlayIcon, label: 'Запустить', variant: 'filled' },
    { id: 3, icon: SaveIcon, label: 'Сохранить', variant: 'default' },
  ];

  const ButtonItem = items.map((item) => {
    return (
      <Button
        key={item.id}
        color="dark"
        leftSection={item.icon ? <item.icon /> : undefined}
        radius="md"
        variant={item.variant}
      >
        {item.label}
      </Button>
    );
  });
  return (
    <Group gap="xs" justify="flex-start">
      {ButtonItem}
    </Group>
  );
}

export function Editor() {
  const dispatch = useDispatch();
  const { editorCode, language, scriptValue, iframeValue } = useSelector(
    (state: RootState) => state.code,
  );
  const theme = useMantineTheme();

  return (
    <Stack justify="center">
      <header>
        <Grid align="center" columns={24} grow gutter="sm" justify="center">
          <Grid.Col offset={1}>
            <Input placeholder="Новый сниппет" radius="md" />
          </Grid.Col>

          <Grid.Col span={9}>
            <ItemButtons />
          </Grid.Col>
        </Grid>
        <Divider my="sm" />
      </header>

      <Group grow>
        <Card radius="md" withBorder>
          <Group gap="xs" justify="space-between" pl="xs" pr="xs">
            <Group gap="xs" justify="space-between" p={5}>
              <ThemeIcon color="gray" radius="xl" size={10} />
              <ThemeIcon color="gray" radius="xl" size={10} />
              <ThemeIcon color="gray" radius="xl" size={10} />
            </Group>
          </Group>

          <div
            style={{
              border: `1px solid ${theme.colors.gray[3]}`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.xs,
              resize: 'vertical',
              overflow: 'auto',
              minHeight: 400,
              maxHeight: 600,
              height: 400,
            }}
          >
            <MonacoEditor
              height="100%"
              language={language}
              loading={<Loader color="gray" type="dots" />}
              onChange={(value) =>
                dispatch(codeActions.setEditorCode(value || ''))
              }
              options={{
                lineNumbers: 'off',
                renderLineHighlight: 'none',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                overviewRulerLanes: 0,
                scrollbar: {
                  useShadows: false,
                },
              }}
              theme="vs-light"
              value={editorCode}
            />
          </div>
        </Card>

        <Card pl={0} pr={0} radius="md" withBorder>
          <Stack gap={0} justify="center">
            <Text c="gray" pl={5} size="sm" variant="white">
              Консоль
            </Text>

            <Code block c="white" color="#1a1b1e" h={400}>
              заглушка
            </Code>
          </Stack>
        </Card>
      </Group>
      <Accordion radius="md" variant="contained">
        <Accordion.Item value="code">
          <Accordion.Control color="dark" icon={<LinkIcon />} variant="default">
            <Group justify="space-between">
              <Text>Код для вставки</Text>
              <Text c="gray" size="xs">
                показать
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Group align="stretch" grow>
              {/* JS виджет */}
              <Paper mih="150px" p="md" radius="md" withBorder>
                <Text c="gray" fw={500} mb="xs" size="xs">
                  JS-виджет
                </Text>
                <Text bg="gray.0" component="pre" p="xs" size="xs">
                  {scriptValue}
                </Text>
                <CopyButton value={scriptValue}>
                  {({ copied, copy }) => (
                    <Button onClick={copy} size="xs" variant="subtle">
                      {copied ? 'Скопировано' : 'Копировать'}
                    </Button>
                  )}
                </CopyButton>
              </Paper>

              {/* Iframe — код вставки */}
              <Paper mih="150px" p="md" radius="md" withBorder>
                <Text c="gray" fw={500} mb="xs" size="xs">
                  Iframe
                </Text>
                <Code block>{iframeValue}</Code>
                <CopyButton value={iframeValue}>
                  {({ copied, copy }) => (
                    <Button onClick={copy} size="xs" variant="subtle">
                      {copied ? 'Скопировано' : 'Копировать'}
                    </Button>
                  )}
                </CopyButton>
              </Paper>
            </Group>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}

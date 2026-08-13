import { Alert, Box, Container, Paper, Stack, Tabs, Text, Title } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { AppFooter } from '../../../widgets/footer';
import { AppHeader } from '../../../widgets/header';
import {
  consentDocument,
  type LegalDocument,
  missingOperatorFields,
  privacyPolicy,
  termsOfUse,
} from '../content';
import LegalSection from './LegalSection';

/**
 * Правовая страница: соглашение, политика обработки ПДн и согласие.
 *
 * Три отдельные вкладки, а не две: согласие обязано быть отдельным документом
 * (152-ФЗ, ст. 9 ч. 1), поэтому у него собственный адрес — на него ссылается
 * форма регистрации, и по нему же согласие можно перечитать позже.
 *
 * Политика должна быть доступна без регистрации и без каких-либо условий:
 * оператор обязан обеспечить к ней неограниченный доступ (ст. 18.1 ч. 2).
 */
type LegalTab = 'terms' | 'privacy' | 'consent';

const documents: Record<LegalTab, LegalDocument> = {
  terms: termsOfUse,
  privacy: privacyPolicy,
  consent: consentDocument,
};

const isLegalTab = (value: string | null): value is LegalTab =>
  value === 'terms' || value === 'privacy' || value === 'consent';

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: LegalTab = isLegalTab(rawTab) ? rawTab : 'terms';

  const handleTabChange = (value: string | null) => {
    const next: LegalTab = isLegalTab(value) ? value : 'terms';
    setSearchParams(next === 'terms' ? {} : { tab: next }, { replace: true });
  };

  const document = documents[tab];
  const missing = missingOperatorFields();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Container size="lg" py={40} style={{ flex: 1, width: '100%' }}>
        <Box maw={900} mx="auto">
          <Title order={1}>Правовая информация</Title>

          {missing.length > 0 && (
            /**
             * Видно и разработчику, и проверяющему. Документы с незаполненными
             * реквизитами оператора не годятся: согласие без адреса оператора
             * недействительно (ст. 9 ч. 4 п. 3), а Политика без реквизитов не
             * выполняет требования ст. 18.1 ч. 2. Прятать это в TODO нельзя —
             * незаполненное поле уедет в прод незамеченным.
             */
            <Alert color="red" radius="md" mt="lg" title="Документы не готовы к публикации">
              <Text size="sm">
                Не заполнены реквизиты оператора: {missing.join(', ')}. Укажите их
                в файле{' '}
                <Text span ff="monospace" size="sm">
                  frontend/src/v2/pages/legal/content/operator.ts
                </Text>{' '}
                — до этого документы нельзя считать опубликованными по смыслу
                части 2 статьи 18.1 Федерального закона № 152-ФЗ.
              </Text>
            </Alert>
          )}

          <Tabs value={tab} onChange={handleTabChange} mt="xl">
            <Tabs.List>
              <Tabs.Tab value="terms">Условия использования</Tabs.Tab>
              <Tabs.Tab value="privacy">Обработка персональных данных</Tabs.Tab>
              <Tabs.Tab value="consent">Согласие на обработку</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Paper withBorder radius="lg" p={{ base: 'lg', sm: 36 }} mt="lg">
            <Stack gap="xl">
              <Box>
                <Title order={2} fz={26}>
                  {document.title}
                </Title>
                <Text c="dimmed" size="sm" mt={6}>
                  Версия {document.version} · редакция от {document.revisionDate}
                </Text>
                {document.lead && (
                  <Text c="dark.6" mt="md" style={{ lineHeight: 1.65 }}>
                    {document.lead}
                  </Text>
                )}
              </Box>

              {document.clauses.map((clause) => (
                <LegalSection key={clause.title} clause={clause} />
              ))}
            </Stack>
          </Paper>
        </Box>
      </Container>
      <AppFooter />
    </div>
  );
}

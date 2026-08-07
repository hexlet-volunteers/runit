import { Navigate, useParams } from 'react-router';
import { Center, Loader } from '@mantine/core';
import { useSnippetBySlug } from '../../../entities/snippet';
import { embedPath, snippetPath } from '../../../shared/lib';
import EmbedPage from '../../embed/ui/EmbedPage';
import SharePage from './SharePage';

/**
 * Старые ссылки вида /s/:username/:slug и /embed/:username/:slug.
 *
 * Основной адрес сниппета — короткая ссылка (#343), но заменить ею уже
 * разосланные старые нельзя, поэтому старый путь остаётся входом и переводит на
 * короткий: один канонический адрес вместо двух равноправных.
 *
 * Проверка приватности при этом не дублируется: сервер по паре username+slug
 * приватные не отдаёт, и до редиректа дело просто не доходит.
 *
 * У сниппетов, созданных до появления shortCode, короткого адреса нет — для них
 * показываем страницу как раньше, без редиректа.
 */
export default function LegacyLinkRedirect({
  target,
}: {
  /** Куда ведём: на страницу сниппета или на виджет встраивания. */
  target: 'share' | 'embed';
}) {
  const { username = '', slug = '' } = useParams();
  const { data, isLoading, isError } = useSnippetBySlug(username, slug);

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  const shortCode = isError ? null : (data?.shortCode ?? null);

  if (shortCode) {
    const path =
      target === 'embed' ? embedPath({ shortCode }) : snippetPath({ shortCode });
    // replace: кнопка «назад» не должна возвращать на страницу-переходник.
    return <Navigate to={path} replace />;
  }

  // Короткого кода нет либо сниппет недоступен — отдаём обычную страницу,
  // она сама покажет содержимое или «не найдено».
  return target === 'embed' ? <EmbedPage /> : <SharePage />;
}

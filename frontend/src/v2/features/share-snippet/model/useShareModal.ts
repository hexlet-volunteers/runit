import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { copyToClipboard, embedUrl, snippetUrl } from '../../../shared/lib';
import { useTRPCClient } from '../../../shared/api';
import type { Props } from '../types';

type ShareModalOptions = Pick<
  Props,
  'username' | 'slug' | 'snippetId' | 'shortCode' | 'visibility'
>;

export function useShareModal({
  username,
  slug,
  snippetId,
  shortCode,
  visibility,
}: ShareModalOptions) {
  const trpc = useTRPCClient();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [height, setHeight] = useState('380');
  const [showOutput, setShowOutput] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [autorun, setAutorun] = useState(false);
  const [shared, setShared] = useState((visibility ?? 'private') !== 'private');
  const [saving, setSaving] = useState(false);

  const linkSource = { shortCode, username, slug };
  const pagePath = shortCode ? `/s/${shortCode}` : `/s/${username}/${slug}`;
  const shareUrl = snippetUrl(linkSource);

  const embedSrc = embedUrl(linkSource, {
    theme,
    height: Number(height),
    output: showOutput,
    readonly: readOnly,
    autorun,
  });

  const embedCode = `<iframe src="${embedSrc}" width="100%" height="${height}" style="border:0;border-radius:12px" title="Runit"></iframe>`;

  const toggleShared = async (next: boolean) => {
    if (snippetId == null) return;

    setShared(next);
    setSaving(true);

    try {
      await trpc.snippets.setVisibility.mutate({
        id: snippetId,
        visibility: next ? 'link' : 'private',
      });

      notifications.show({
        message: next
          ? 'Сниппет доступен по ссылке'
          : 'Сниппет снова приватный',
      });
    } catch {
      setShared(!next);

      notifications.show({
        message: 'Не удалось изменить доступ',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    theme,
    setTheme,
    height,
    setHeight,
    showOutput,
    setShowOutput,
    readOnly,
    setReadOnly,
    autorun,
    setAutorun,
    shared,
    saving,
    pagePath,
    shareUrl,
    embedCode,
    toggleShared,
    copyToClipboard,
  };
}
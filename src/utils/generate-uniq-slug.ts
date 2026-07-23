export function generateUniqSlug(
  existingSnippets: { slug?: string }[],
): string {
  const existingSlugs = new Set(
    existingSnippets
      .map((s) => s?.slug)
      .filter((slug): slug is string => !!slug),
  );

  let slug: string;
  let attempt = 0;

  do {
    const randomStr = Math.random().toString(36).substring(2, 8);
    slug = attempt === 0 ? randomStr : `${randomStr}-${attempt}`;
    attempt++;

    if (attempt > 100) {
      throw new Error('Failed to generate unique slug after 100 attempts');
    }
  } while (existingSlugs.has(slug));

  return slug;
}

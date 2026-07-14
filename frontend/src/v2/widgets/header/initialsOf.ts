/** Возвращает инициалы из имени, разбивая его по пробелам, точкам, подчёркиваниям, дефисам. */
export function initialsOf(name: string): string {
  // TODO(#530, #536): единый компонент аватара-инициалов вместо base64-загрузок.
  const parts = name.split(/[\s_.-]+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
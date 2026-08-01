/** Склонение существительных после числительных по правилам русского языка. */
export const plural = (n: number, forms: [string, string, string]): string => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
};

// Относительная дата по-русски: «2 часа назад», «вчера», «месяц назад».
export function relativeDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) {
    return `${minutes} ${plural(minutes, ['минуту', 'минуты', 'минут'])} назад`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${plural(hours, ['час', 'часа', 'часов'])} назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} ${plural(days, ['день', 'дня', 'дней'])} назад`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1
      ? 'неделю назад'
      : `${weeks} ${plural(weeks, ['неделю', 'недели', 'недель'])} назад`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1
      ? 'месяц назад'
      : `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])} назад`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? 'год назад' : `${years} ${plural(years, ['год', 'года', 'лет'])} назад`;
}
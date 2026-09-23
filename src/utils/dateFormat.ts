/**
 * Formata uma data/hora de jogo (timestamptz vindo do Supabase) para
 * algo legível em português de Portugal: "Hoje, 20:30", "Amanhã,
 * 15:00" ou "Sáb, 15:00". Tudo calculado no fuso de Lisboa.
 */
export function formatMatchDate(iso: string | null | undefined): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;

  const timeZone = 'Europe/Lisbon';
  const now = new Date();

  const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone });
  const timeFmt = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone });
  const weekdayFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', timeZone });

  const time = timeFmt.format(date);

  if (dayKeyFmt.format(date) === dayKeyFmt.format(now)) {
    return `Hoje, ${time}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dayKeyFmt.format(date) === dayKeyFmt.format(tomorrow)) {
    return `Amanhã, ${time}`;
  }

  const weekday = weekdayFmt.format(date).replace('.', '');
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized}, ${time}`;
}

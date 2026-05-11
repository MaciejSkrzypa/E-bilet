export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateValue: string): string {
  const [year, month, day] = dateValue.split('-');

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}.${month}.${year}`;
}

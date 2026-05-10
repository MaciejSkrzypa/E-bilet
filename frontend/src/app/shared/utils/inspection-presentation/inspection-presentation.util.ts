const INSPECTION_REASON_MAP: Record<string, string> = {
  'Inspection date outside [validFrom, validTo]': 'Data kontroli jest poza okresem waznosci biletu okresowego.',
  'Period ticket within validity range': 'Bilet okresowy jest wazny w dniu kontroli.',
  'Single ticket expired: validation day has passed': 'Bilet jednorazowy jest wazny tylko w dniu skasowania.',
  'Single ticket valid in this vehicle': 'Bilet jednorazowy jest wazny w tym pojezdzie.',
  'Ticket has not been validated (kasowanie missing)': 'Bilet nie zostal skasowany.',
  'Ticket not found': 'Nie znaleziono biletu.',
  'Unknown ticket type': 'Nieznany typ biletu.',
};

export function getInspectionReasonLabel(reason: string): string {
  const trimmedReason = reason.trim();

  if (trimmedReason.length === 0) {
    return 'Brak informacji o wyniku kontroli.';
  }

  const exactMatch = INSPECTION_REASON_MAP[trimmedReason];
  if (exactMatch) {
    return exactMatch;
  }

  if (trimmedReason.startsWith('Single ticket validated in a different vehicle (')) {
    const label = trimmedReason.slice(
      'Single ticket validated in a different vehicle ('.length,
      trimmedReason.lastIndexOf(')'),
    );

    return label.length > 0
      ? `Bilet jednorazowy zostal skasowany w innym pojezdzie (${label}).`
      : 'Bilet jednorazowy zostal skasowany w innym pojezdzie.';
  }

  if (trimmedReason.startsWith('Time ticket expired at ')) {
    return `Bilet czasowy wygasl o ${formatLocalDateTimeLabel(trimmedReason.slice('Time ticket expired at '.length))}.`;
  }

  if (trimmedReason.startsWith('Time ticket valid until ')) {
    return `Bilet czasowy jest wazny do ${formatLocalDateTimeLabel(trimmedReason.slice('Time ticket valid until '.length))}.`;
  }

  return appendPeriodIfNeeded(trimmedReason);
}

function formatLocalDateTimeLabel(value: string): string {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);

  if (!match) {
    return value.trim();
  }

  const [, year, month, day, hours, minutes] = match;
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

function appendPeriodIfNeeded(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

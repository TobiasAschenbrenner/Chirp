import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    const diffMs = date.getTime() - Date.now(); // negative if in the past
    const diffSec = Math.round(diffMs / 1000);

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    const absSec = Math.abs(diffSec);
    if (absSec < 60) return rtf.format(diffSec, 'second');

    const diffMin = Math.round(diffSec / 60);
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return rtf.format(diffMin, 'minute');

    const diffHr = Math.round(diffMin / 60);
    const absHr = Math.abs(diffHr);
    if (absHr < 24) return rtf.format(diffHr, 'hour');

    const diffDay = Math.round(diffHr / 24);
    const absDay = Math.abs(diffDay);
    if (absDay < 7) return rtf.format(diffDay, 'day');

    const diffWeek = Math.round(diffDay / 7);
    const absWeek = Math.abs(diffWeek);
    if (absWeek < 4) return rtf.format(diffWeek, 'week');

    const diffMonth = Math.round(diffDay / 30);
    const absMonth = Math.abs(diffMonth);
    if (absMonth < 12) return rtf.format(diffMonth, 'month');

    const diffYear = Math.round(diffDay / 365);
    return rtf.format(diffYear, 'year');
  }
}

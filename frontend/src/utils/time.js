/**
 * Converts 12-hour picker values to 24-hour "HH:mm" format.
 * @param {string|number} hour
 * @param {string|number} minute
 * @param {string} ampm
 * @returns {string} e.g. "14:30"
 */
export function to24Hour(hour, minute, ampm) {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Parses 24-hour "HH:mm" or 12-hour string into { hour, minute, ampm }.
 * @param {string} timeStr
 * @returns {{ hour: string, minute: string, ampm: string }}
 */
export function from24Hour(timeStr) {
  if (!timeStr) return { hour: '12', minute: '00', ampm: 'PM' };
  if (timeStr.includes(' ')) {
    const [t, ampm] = timeStr.split(' ');
    const [h, m] = t.split(':');
    return { hour: String(parseInt(h, 10) || 12), minute: m || '00', ampm: ampm || 'AM' };
  }
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: String(h), minute: mStr || '00', ampm };
}

/**
 * Formats "HH:mm" time string into human-friendly 12-hour "h:mm AM/PM".
 * @param {string} timeStr
 * @returns {string} e.g. "2:30 PM"
 */
export function formatTime12(timeStr) {
  if (!timeStr) return '';
  const { hour, minute, ampm } = from24Hour(timeStr);
  return `${hour}:${minute} ${ampm}`;
}

/**
 * Remembers the series descriptions that were last used to store something, so
 * that storing the next one can offer them again.  The descriptions are kept per
 * type of item being stored (`SEG`, `RTSTRUCT`, `SR`, ...), most recently used
 * first, in local storage so that they survive a reload.
 *
 * A `maxCount` of 0 disables this entirely - nothing is remembered and nothing
 * is offered.
 */

const STORAGE_KEY = 'ohif.seriesDescriptionHistory';

type History = Record<string, string[]>;

/**
 * Local storage is unavailable in some browser configurations, and can contain
 * anything at all, so every read is defensive and a failure just means there is
 * no history.
 */
function readHistory(): History {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.debug('Unable to read the series description history', error);
    return {};
  }
}

function isSameDescription(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * The descriptions last used for `itemType`, most recent first, at most
 * `maxCount` of them.
 */
export function getSeriesDescriptionHistory(itemType: string, maxCount: number): string[] {
  if (!itemType || !(maxCount > 0)) {
    return [];
  }

  const descriptions = readHistory()[itemType];
  if (!Array.isArray(descriptions)) {
    return [];
  }

  return descriptions
    .filter(description => typeof description === 'string' && !!description.trim())
    .slice(0, maxCount);
}

/**
 * Records `description` as the most recently used one for `itemType`, dropping
 * any earlier use of it and any entry past `maxCount`.
 */
export function rememberSeriesDescription(
  itemType: string,
  description: string,
  maxCount: number
): void {
  const trimmed = description?.trim();
  if (!itemType || !trimmed || !(maxCount > 0)) {
    return;
  }

  const history = readHistory();
  const previous = Array.isArray(history[itemType]) ? history[itemType] : [];

  history[itemType] = [
    trimmed,
    ...previous.filter(
      entry => typeof entry === 'string' && !!entry.trim() && !isSameDescription(entry, trimmed)
    ),
  ].slice(0, maxCount);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.debug('Unable to store the series description history', error);
  }
}

import { utils } from '@ohif/core';

const { formatValue } = utils;

export type ThumbnailDetail = {
  id: string;
  label: string;
  title: string;
  value: string;
  iconName?: string;
};

type ResolveOptions = {
  /** `studyBrowser.thumbnailDetails` - the items to include. */
  items;
  displaySet;
  /** `studyBrowser.thumbnailDetailSources` - named value sources. */
  sources?: Record<string, (props) => unknown>;
  /** `studyBrowser.thumbnailDetailTests` - named `condition` tests. */
  tests?: Record<string, (props) => boolean>;
  formatters;
};

/**
 * Builds the detail line of a study browser thumbnail from the
 * `studyBrowser.thumbnailDetails` items, in the order they are declared.
 *
 * Each item contributes its value, taken from its own `contentF`, from a named
 * `source`, or from an `attribute` of the instance the display set shows - the
 * same three ways the viewport overlay items get theirs. An item whose
 * `condition` says no, or which has no value to show, is left out.
 *
 * Returns `undefined` when there are no items to resolve at all, which leaves
 * the thumbnail showing the default detail line it stands alone with. An empty
 * `items` is a customization asking for an empty line, and is honoured as one.
 *
 * A line that came out empty only because the names it used could not be
 * resolved is a broken customization rather than a request for an empty line -
 * an override of `studyBrowser.thumbnailDetailSources` written with `$set`
 * removes the sources the default items name - so that too is returned as
 * `undefined`, leaving every thumbnail its default detail line instead of
 * blanking the series number and instance count on all of them.
 */
export function resolveThumbnailDetails({
  items,
  displaySet,
  sources,
  tests,
  formatters,
}: ResolveOptions): ThumbnailDetail[] | undefined {
  if (!Array.isArray(items)) {
    return undefined;
  }

  const props = { displaySet, instance: displaySet?.instance, formatters };
  const details: ThumbnailDetail[] = [];
  let hasUnresolvedName = false;

  /** A `condition` / `source` that is a name resolves against a registry. */
  const resolveNamed = (value, registry, kind: string, id: string) => {
    if (typeof value !== 'string') {
      return value;
    }
    const named = registry?.[value];
    if (!named) {
      console.warn(`Thumbnail detail item "${id}" names an unknown ${kind} "${value}"`);
      hasUnresolvedName = true;
    }
    return named;
  };

  for (const item of items) {
    if (!item) {
      continue;
    }
    const { id, condition, contentF, source, attribute, iconName } = item;

    if (condition !== undefined) {
      const test = resolveNamed(condition, tests, 'condition', id);
      if (typeof test !== 'function' || !test(props)) {
        continue;
      }
    }

    let value;
    if (typeof contentF === 'function') {
      value = contentF(props);
    } else if (source !== undefined) {
      const sourceF = resolveNamed(source, sources, 'source', id);
      value = typeof sourceF === 'function' ? sourceF(props) : undefined;
    } else if (attribute) {
      value = props.instance?.[attribute];
    }

    const displayValue = formatValue(value);
    if (!displayValue) {
      continue;
    }

    const icon = typeof iconName === 'function' ? iconName(props) : iconName;

    details.push({
      id,
      label: item.label ?? '',
      title: item.title ?? '',
      value: displayValue,
      iconName: icon || undefined,
    });
  }

  if (!details.length && hasUnresolvedName) {
    return undefined;
  }

  return details;
}

export default resolveThumbnailDetails;

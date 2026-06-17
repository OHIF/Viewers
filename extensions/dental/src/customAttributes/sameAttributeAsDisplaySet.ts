type DisplaySetLike = Record<string, unknown> & {
  displaySetInstanceUID?: string;
};

type MatchOptions = {
  displaySetMatchDetails?: Map<string, { displaySetInstanceUID?: string }>;
  displaySets?: DisplaySetLike[];
};

type AttributeContext = {
  attributeName?: string;
  displaySetSelectorId?: string;
  id?: string;
};

export default function sameAttributeAsDisplaySet(
  this: AttributeContext,
  displaySet: DisplaySetLike,
  options: MatchOptions = {}
): boolean {
  const { attributeName, displaySetSelectorId } = this;

  if (!attributeName || !displaySetSelectorId) {
    return false;
  }

  const matchedDisplaySetUID = options.displaySetMatchDetails?.get(displaySetSelectorId)
    ?.displaySetInstanceUID;

  if (!matchedDisplaySetUID) {
    return false;
  }

  const matchedDisplaySet = options.displaySets?.find(
    candidate => candidate.displaySetInstanceUID === matchedDisplaySetUID
  );

  return matchedDisplaySet?.[attributeName] === displaySet[attributeName];
}

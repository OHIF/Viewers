import type { Types } from '@ohif/core';

type CodeSequenceItem = { CodingSchemeDesignator?: string; CodeValue?: string };

export default (displaySet: Types.DisplaySet) => {
  const ViewCodeSequence = (
    displaySet?.instance?.ViewCodeSequence as CodeSequenceItem[] | undefined
  )?.[0];
  if (!ViewCodeSequence) {
    return undefined;
  }
  const { CodingSchemeDesignator, CodeValue } = ViewCodeSequence;
  if (!CodingSchemeDesignator || !CodeValue) {
    return undefined;
  }
  return `${CodingSchemeDesignator}:${CodeValue}`;
};

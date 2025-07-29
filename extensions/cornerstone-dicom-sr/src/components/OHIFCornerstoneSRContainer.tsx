import React from 'react';
import { OHIFCornerstoneSRContentItem } from './OHIFCornerstoneSRContentItem';

interface OHIFCornerstoneSRContainerProps {
  /**
   * A tree node that may contain another container or one or more content items
   * (text, code, uidref, pname, etc.)
   */
  container?: object;
  /**
   * A 0-based index list
   */
  nodeIndexesTree?: number[];
  /**
   * A 1-based index list that represents a container in a multi-level numbered
   * list (tree).
   *
   * Example:
   *  1. History
   *    1.1. Chief Complaint
   *    1.2. Present Illness
   *    1.3. Past History
   *    1.4. Family History
   *  2. Findings
   * */
  containerNumberedTree?: number[];
}

export function OHIFCornerstoneSRContainer(props: OHIFCornerstoneSRContainerProps) {
  const { container, nodeIndexesTree = [0], containerNumberedTree = [1] } = props;
  const { ContinuityOfContent, ConceptNameCodeSequence } = container;
  const { CodeMeaning } = ConceptNameCodeSequence ?? {};
  let childContainerIndex = 1;
  const contentItems = container.ContentSequence?.map((contentItem, i) => {
    const { ValueType } = contentItem;
    const childNodeLevel = [...nodeIndexesTree, i];
    const key = childNodeLevel.join('.');

    let Component;
    let componentProps;

    if (ValueType === 'CONTAINER') {
      const childContainerNumberedTree = [...containerNumberedTree, childContainerIndex++];

      Component = OHIFCornerstoneSRContainer;
      componentProps = {
        container: contentItem,
        nodeIndexesTree: childNodeLevel,
        containerNumberedTree: childContainerNumberedTree,
      };
    } else {
      Component = OHIFCornerstoneSRContentItem;
      componentProps = {
        contentItem,
        nodeIndexesTree: childNodeLevel,
        continuityOfContent: ContinuityOfContent,
      };
    }

    return (
      <Component
        key={key}
        {...componentProps}
      />
    );
  });

  return (
    <div>
      <div className="font-bold">
        {containerNumberedTree.join('.')}.&nbsp;
        {CodeMeaning}
      </div>
      <div className="ml-4 mb-2">{contentItems}</div>
    </div>
  );
}

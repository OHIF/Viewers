import React from 'react';
import { OHIFCornerstoneSRContentItem } from './OHIFCornerstoneSRContentItem';

export function OHIFCornerstoneSRContainer(props) {
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



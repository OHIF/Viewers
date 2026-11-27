import React from 'react';
import { OHIFCornerstoneSRContentItem } from './OHIFCornerstoneSRContentItem';

/**
 * Builds the rendered children of a container's content sequence. Container
 * children are numbered 1, 2, 3... in order; everything else renders as a
 * content item. Lives at module scope so the running counter is not a variable
 * captured by a lambda, which the compiler cannot lower.
 */
function renderContentItems(container, nodeIndexesTree, containerNumberedTree) {
  const { ContinuityOfContent } = container;
  const contentSequence = container.ContentSequence;

  if (!contentSequence) {
    return undefined;
  }

  let childContainerIndex = 1;

  return contentSequence.map((contentItem, i) => {
    const { ValueType } = contentItem;
    const childNodeLevel = [...nodeIndexesTree, i];
    const key = childNodeLevel.join('.');

    if (ValueType === 'CONTAINER') {
      return (
        <OHIFCornerstoneSRContainer
          key={key}
          container={contentItem}
          nodeIndexesTree={childNodeLevel}
          containerNumberedTree={[...containerNumberedTree, childContainerIndex++]}
        />
      );
    }

    return (
      <OHIFCornerstoneSRContentItem
        key={key}
        contentItem={contentItem}
        nodeIndexesTree={childNodeLevel}
        continuityOfContent={ContinuityOfContent}
      />
    );
  });
}

export function OHIFCornerstoneSRContainer(props) {
  const { container, nodeIndexesTree = [0], containerNumberedTree = [1] } = props;
  const { ConceptNameCodeSequence } = container;
  const { CodeMeaning } = ConceptNameCodeSequence ?? {};
  const contentItems = renderContentItems(container, nodeIndexesTree, containerNumberedTree);

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

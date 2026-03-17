import PropTypes from 'prop-types';
import React from 'react';
import { OHIFCornerstoneSRContainerItem } from './OHIFCornerstoneSRContainerItem';
import {
  getCodeMeaningFromConceptNameCodeSequence,
  getContentSequenceFromSR,
  asStandardReport,
} from '../utils/srInspection';

/**
 * Let's explain this logic a bit since I was briefly confused and almost broke a real feature.
 * OHIFCornerstoneSRContainer will render the contents in the SR content container. For a well formed
 * SR this could take the form of a tree outlining report contents like you would typically see from
 * a physician report.
 *
 * Example:
 *  1. History
 *    1.1. Chief Complaint
 *    1.2. Present Illness
 *    1.3. Past History
 *    1.4. Family History
 *  2. Findings
 *
 *  However, SR adoption has not been uniform across the board, which I understand as a developer.
 *  Many enterprise solutions opted for encapsulation of report.
 *  CareStream (now Philips) opted for embedding an HTML or PDF version of the reports at the findings
 *  level. For such cases, we now have a more versatile React component that will handle the correct
 *  rendering automatically.
 *
 * @param props
 * @constructor
 */
export function OHIFCornerstoneSRContainer(props) {
  const { nodeIndexesTree = [0], containerNumberedTree = [1] } = props;
  const container = asStandardReport(props.container);
  const { ContinuityOfContent, ConceptNameCodeSequence } = container;
  const codeMeaning = getCodeMeaningFromConceptNameCodeSequence(ConceptNameCodeSequence);
  const contentSequence = getContentSequenceFromSR(container);
  let childContainerIndex = 1;

  const contentItems = contentSequence.map((contentItem, i) => {
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
      Component = OHIFCornerstoneSRContainerItem;
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
          {codeMeaning}
        </div>
        <div className="ml-4 mb-2">{contentItems}</div>
      </div>
    );
}

OHIFCornerstoneSRContainer.propTypes = {
  /**
   * A tree node that may contain another container or one or more content items
   * (text, code, uidref, pname, etc.)
   */
  container: PropTypes.object,
  /**
   * A 0-based index list
   */
  nodeIndexesTree: PropTypes.arrayOf(PropTypes.number),
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
  containerNumberedTree: PropTypes.arrayOf(PropTypes.number),
};

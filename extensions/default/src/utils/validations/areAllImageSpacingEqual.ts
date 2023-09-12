import {
  _getPerpendicularDistance,
  _getSpacingIssue,
  reconstructionIssues,
} from '@ohif/core/src/utils/isDisplaySetReconstructable';
import { DisplaySetMessage } from '@ohif/core';
import toNumber from '@ohif/core/src/utils/toNumber';
import { DisplaySetMessageList } from '@ohif/core';

/**
 * Checks if series has spacing issues
 * @param {*} instances
 * @param {*} warnings
 */
export default function areAllImageSpacingEqual(
  instances: Array<any>,
  messages: DisplaySetMessageList
): void {
  if (!instances?.length) {
    return;
  }
  const firstImagePositionPatient = toNumber(instances[0].ImagePositionPatient);
  if (!firstImagePositionPatient) {
    return;
  }
  const lastIpp = toNumber(instances[instances.length - 1].ImagePositionPatient);

  const averageSpacingBetweenFrames =
    _getPerpendicularDistance(firstImagePositionPatient, lastIpp) / (instances.length - 1);

  let previousImagePositionPatient = firstImagePositionPatient;

  const issuesFound = [];
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const imagePositionPatient = toNumber(instance.ImagePositionPatient);

    const spacingBetweenFrames = _getPerpendicularDistance(
      imagePositionPatient,
      previousImagePositionPatient
    );

    const spacingIssue = _getSpacingIssue(spacingBetweenFrames, averageSpacingBetweenFrames);

    if (spacingIssue) {
      const issue = spacingIssue.issue;

      // avoid multiple warning of the same thing
      if (!issuesFound.includes(issue)) {
        issuesFound.push(issue);
        if (issue === reconstructionIssues.MISSING_FRAMES) {
          messages.addMessage(DisplaySetMessage.CODES.MISSING_FRAMES);
        } else if (issue === reconstructionIssues.IRREGULAR_SPACING) {
          messages.addMessage(DisplaySetMessage.CODES.IRREGULAR_SPACING);
        }
      }
      // we just want to find issues not how many
      if (issuesFound.length > 1) {
        break;
      }
    }
    previousImagePositionPatient = imagePositionPatient;
  }
}

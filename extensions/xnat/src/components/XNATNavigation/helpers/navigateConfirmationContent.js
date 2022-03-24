import sessionMap from '../../../utils/sessionMap';

export default function(unsavedRegions) {
  let body = '';

  if (unsavedRegions.contours.length) {
    const contours = unsavedRegions.contours;

    body += 'You have unsaved contours on:</br>';

    for (let i = 0; i < contours.length; i++) {
      body += `${sessionMap.getScan(contours[i], 'seriesDescription')}</br>`;
    }
  }

  if (unsavedRegions.masks.length) {
    const masks = unsavedRegions.masks;

    body += 'You have unsaved masks on:</br>';

    for (let i = 0; i < masks.length; i++) {
      body += ` ${sessionMap.getScan(masks[i], 'seriesDescription')}</br>`;
    }
  }

  body += 'Do you wish to exit without saving?';

  const content = {
    title: 'Unsaved Regions',
    body,
  };

  return content;
}

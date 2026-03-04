import { ViewportPageObject } from '../pages/ViewportPageObject';

const navigateWithViewportArrow = async (
  viewportPageObject: ViewportPageObject,
  direction: 'next' | 'prev',
  viewportId = 'default'
) => {
  const viewport = viewportPageObject.getById(viewportId);
  await viewport.navigationArrows[direction].click();
};

export { navigateWithViewportArrow };


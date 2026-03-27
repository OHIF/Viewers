import { ViewportPageObject } from '../pages/ViewportPageObject';

const getSvgPath = async (viewportPageObject: ViewportPageObject, viewportId = 'default') => {
  return (await viewportPageObject.getById(viewportId)).svg('path').first().getAttribute('d');
};

export { getSvgPath };

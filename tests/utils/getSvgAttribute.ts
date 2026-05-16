import { SvgInnerElement, ViewportPageObject } from '../pages/ViewportPageObject';

const getSvgAttribute = async (
  viewportPageObject: ViewportPageObject,
  svgInnerElement: SvgInnerElement,
  attributeName: string,
  viewportId = 'default',
  nth: number = 0
) => {
  return (await viewportPageObject.getById(viewportId))
    .svg(svgInnerElement)
    .nth(nth)
    .getAttribute(attributeName);
};


export { getSvgAttribute };

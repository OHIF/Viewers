import { SvgInnerElement, ViewportPageObject } from '../pages/ViewportPageObject';

const getSvgAttribute = async ({
  viewportPageObject,
  svgInnerElement,
  attributeName,
  viewportId = 'default',
  nth = 0,
}: {
  viewportPageObject: ViewportPageObject;
  svgInnerElement: SvgInnerElement;
  attributeName: string;
  viewportId?: string;
  nth?: number;
}) => {
  return (await viewportPageObject.getById(viewportId))
    .svg(svgInnerElement)
    .nth(nth)
    .getAttribute(attributeName);
};


export { getSvgAttribute };

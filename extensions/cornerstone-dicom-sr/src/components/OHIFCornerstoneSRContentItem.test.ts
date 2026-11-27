import { createElement } from 'react';
import { render } from '@testing-library/react';
import { OHIFCornerstoneSRContentItem } from './OHIFCornerstoneSRContentItem';

it('renders a content item without a Concept Name', () => {
  const { container } = render(
    createElement(OHIFCornerstoneSRContentItem, {
      contentItem: { ValueType: 'IMAGE' },
      nodeIndexesTree: [0, 1],
      continuityOfContent: 'SEPARATE',
    })
  );

  expect(container.textContent).toContain('[IMAGE is not supported]');
  expect(container.querySelector('.font-bold')).toBeNull();
});

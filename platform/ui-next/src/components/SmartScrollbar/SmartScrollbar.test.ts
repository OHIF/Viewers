import { createElement } from 'react';
import { render } from '@testing-library/react';

import { SmartScrollbar } from './SmartScrollbar';
import { SmartScrollbarIndicator } from './SmartScrollbarIndicator';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof global.ResizeObserver;
});

const renderScrollbar = (overrides = {}) => {
  const result = render(
    createElement(
      SmartScrollbar,
      {
        value: 3,
        total: 10,
        onValueChange: jest.fn(),
        ...overrides,
      },
      createElement(SmartScrollbarIndicator)
    )
  );

  const slider = result.getByRole('slider');
  return { ...result, slider };
};

describe('SmartScrollbar focus', () => {
  it('does not take focus when keyboard navigation is disabled', () => {
    const { slider } = renderScrollbar({ enableKeyboardNavigation: false });

    slider.focus();

    // A focused scrollbar that ignores keys keeps its focus ring after the
    // user moves to another viewport with the arrow keys (#6026).
    expect(slider.hasAttribute('tabindex')).toBe(false);
    expect(document.activeElement).not.toBe(slider);
  });

  it('is focusable when keyboard navigation is enabled', () => {
    const { slider } = renderScrollbar({ enableKeyboardNavigation: true });

    slider.focus();

    expect(slider.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(slider);
  });
});

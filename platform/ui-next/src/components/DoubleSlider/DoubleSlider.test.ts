import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';

import { DoubleSlider } from './DoubleSlider';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof global.ResizeObserver;
});

const renderDoubleSlider = (overrides = {}) => {
  const onValueChange = jest.fn();
  const result = render(
    createElement(DoubleSlider, {
      min: 0,
      max: 1000,
      defaultValue: [50, 600],
      showNumberInputs: true,
      onValueChange,
      ...overrides,
    })
  );

  const inputs = Array.from(result.container.querySelectorAll('input')) as HTMLInputElement[];
  const thumbs = Array.from(result.container.querySelectorAll('[role="slider"]')) as HTMLElement[];

  return { ...result, inputs, thumbs, onValueChange };
};

describe('DoubleSlider', () => {
  it('expands its effective limits when committed values exceed the initial range', () => {
    const { inputs, thumbs, onValueChange } = renderDoubleSlider();
    const [lowerInput, upperInput] = inputs;

    fireEvent.change(lowerInput, { target: { value: '-1500' } });

    expect(lowerInput.value).toBe('-1500');
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.keyDown(lowerInput, { key: 'Enter' });

    expect(onValueChange).toHaveBeenLastCalledWith([-1500, 600]);
    expect(thumbs[0].getAttribute('aria-valuemin')).toBe('-1500');
    expect(thumbs[0].getAttribute('aria-valuemax')).toBe('1000');

    fireEvent.change(upperInput, { target: { value: '3000' } });
    fireEvent.keyDown(upperInput, { key: 'Enter' });

    expect(onValueChange).toHaveBeenLastCalledWith([-1500, 3000]);
    expect(thumbs[1].getAttribute('aria-valuemin')).toBe('-1500');
    expect(thumbs[1].getAttribute('aria-valuemax')).toBe('3000');
  });

  it('keeps intermediate text without committing on each keystroke', () => {
    const { inputs, onValueChange } = renderDoubleSlider();
    const upperInput = inputs[1];

    for (const value of ['1', '15', '150', '1500']) {
      fireEvent.change(upperInput, { target: { value } });
      expect(upperInput.value).toBe(value);
    }

    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.keyDown(upperInput, { key: 'Enter' });

    expect(onValueChange).toHaveBeenLastCalledWith([50, 1500]);
  });

  it('allows editing through empty, minus, and decimal-point drafts', () => {
    const { inputs, onValueChange } = renderDoubleSlider({ defaultValue: [-1, 600] });
    const lowerInput = inputs[0];

    for (const value of ['-', '', '.', '30']) {
      fireEvent.change(lowerInput, { target: { value } });
      expect(lowerInput.value).toBe(value);
    }

    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.blur(lowerInput);

    expect(lowerInput.value).toBe('30');
    expect(onValueChange).toHaveBeenLastCalledWith([30, 600]);
  });

  it('restores the last valid value when an invalid draft loses focus', () => {
    const { inputs, onValueChange } = renderDoubleSlider();
    const lowerInput = inputs[0];

    fireEvent.change(lowerInput, { target: { value: '-' } });
    fireEvent.blur(lowerInput);

    expect(lowerInput.value).toBe('50');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('restores the last valid value when Enter is pressed on an invalid draft', () => {
    const { inputs, onValueChange } = renderDoubleSlider();
    const lowerInput = inputs[0];

    fireEvent.change(lowerInput, { target: { value: '.' } });
    fireEvent.keyDown(lowerInput, { key: 'Enter' });

    expect(lowerInput.value).toBe('50');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('honors optional hard limits', () => {
    const { inputs, thumbs, onValueChange } = renderDoubleSlider({
      hardMin: 0,
      hardMax: 1000,
    });

    fireEvent.change(inputs[0], { target: { value: '-1500' } });
    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith([0, 600]);

    fireEvent.change(inputs[1], { target: { value: '3000' } });
    fireEvent.keyDown(inputs[1], { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith([0, 1000]);

    expect(thumbs[0].getAttribute('aria-valuemin')).toBe('0');
    expect(thumbs[1].getAttribute('aria-valuemax')).toBe('1000');
  });

  it('keeps the lower value at or below the upper value', () => {
    const { inputs, onValueChange } = renderDoubleSlider();

    fireEvent.change(inputs[0], { target: { value: '700' } });
    fireEvent.keyDown(inputs[0], { key: 'Enter' });

    expect(onValueChange).toHaveBeenLastCalledWith([700, 700]);
    expect(inputs[1].value).toBe('700');
  });
});

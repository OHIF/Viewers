import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';

import Numeric from './Numeric';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof global.ResizeObserver;
});

const numericInputs = [
  {
    name: 'NumberInput',
    mode: 'number',
    child: () => createElement(Numeric.NumberInput),
  },
  {
    name: 'SingleRange',
    mode: 'singleRange',
    child: () => createElement(Numeric.SingleRange, { showNumberInput: true }),
  },
  {
    name: 'NumberStepper',
    mode: 'stepper',
    child: () => createElement(Numeric.NumberStepper),
  },
] as const;

const renderNumericInput = ({ mode, child }) => {
  const onChange = jest.fn();
  const result = render(
    createElement(
      Numeric.Container,
      {
        mode,
        min: 0,
        max: 100,
        defaultValue: 50,
        onChange,
      },
      child()
    )
  );
  const input = result.container.querySelector('input') as HTMLInputElement;

  return { ...result, input, onChange };
};

describe.each(numericInputs)('Numeric.$name', numericInput => {
  it('keeps draft text and commits only on Enter', () => {
    const { input, onChange } = renderNumericInput(numericInput);

    for (const value of ['', '-', '.', '1', '15', '150']) {
      fireEvent.change(input, { target: { value } });
      expect(input.value).toBe(value);
      expect(onChange).not.toHaveBeenCalled();
    }

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('100');
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('restores the last valid value when an invalid draft loses focus', () => {
    const { input, onChange } = renderNumericInput(numericInput);

    fireEvent.change(input, { target: { value: '-' } });
    fireEvent.blur(input);

    expect(input.value).toBe('50');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not commit Enter while an IME composition is active', () => {
    const { input, onChange } = renderNumericInput(numericInput);

    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(input.value).toBe('30');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it('updates the displayed input when the controlled value changes', () => {
    const onChange = jest.fn();
    const renderControlledInput = value =>
      createElement(
        Numeric.Container,
        {
          mode: numericInput.mode,
          min: 0,
          max: 100,
          value,
          onChange,
        },
        numericInput.child()
      );
    const result = render(renderControlledInput(50));
    const input = result.container.querySelector('input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'draft' } });
    result.rerender(renderControlledInput(75));

    expect(input.value).toBe('75');
  });
});

it('commits a valid Numeric.NumberInput draft on blur', () => {
  const { input, onChange } = renderNumericInput(numericInputs[0]);

  fireEvent.change(input, { target: { value: '30' } });
  fireEvent.blur(input);

  expect(input.value).toBe('30');
  expect(onChange).toHaveBeenLastCalledWith(30);
});

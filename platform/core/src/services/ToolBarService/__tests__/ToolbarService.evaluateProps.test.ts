import ToolbarService from '../ToolbarService';

/**
 * `hideWhenDisabled` is read off `props.evaluateProps` in refreshToolbarState.
 * When `evaluate` is an array, `evaluateProps` used to be the array itself, so
 * `evaluateProps.hideWhenDisabled` was always undefined and the flag was ignored
 * for every multi-evaluator button (OHIF#5587).
 */
describe('ToolbarService.handleEvaluate — evaluateProps', () => {
  const createService = (evaluators: Record<string, (args) => unknown>) => {
    // handleEvaluate only touches the evaluator registry, so the managers can be
    // omitted; _getButtonUITypes is reached only when `options` is a string.
    const service = new ToolbarService(undefined as never, undefined as never, undefined as never);
    // @ts-expect-error reaching into the private registry keeps the test free of
    // an extension manager.
    service._evaluateFunction = evaluators;
    return service;
  };

  it('merges evaluator options so hideWhenDisabled survives an array', () => {
    const service = createService({
      'evaluate.cornerstoneTool': () => ({ disabled: false }),
      'evaluate.modality.supported': () => ({ disabled: true }),
    });

    const props = {
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.modality.supported',
          supportedModalities: ['US'],
          hideWhenDisabled: true,
        },
      ],
    };

    service.handleEvaluate(props);

    expect(props.evaluateProps.hideWhenDisabled).toBe(true);
    expect(props.evaluateProps.supportedModalities).toEqual(['US']);
  });

  it('drops name, which identifies the evaluator rather than configuring it', () => {
    const service = createService({ a: () => ({}), b: () => ({}) });
    const props = {
      evaluate: [
        { name: 'a', hideWhenDisabled: true },
        { name: 'b', disabledText: 'nope' },
      ],
    };

    service.handleEvaluate(props);

    expect(props.evaluateProps).toEqual({ hideWhenDisabled: true, disabledText: 'nope' });
    expect(props.evaluateProps).not.toHaveProperty('name');
  });

  it('yields an empty object when every entry is a bare evaluator name', () => {
    const service = createService({ a: () => ({}), b: () => ({}) });
    const props = { evaluate: ['a', 'b'] };

    service.handleEvaluate(props);

    expect(props.evaluateProps).toEqual({});
    expect(props.evaluateProps.hideWhenDisabled).toBeUndefined();
  });

  it('still runs every evaluator and disables when any one disables', () => {
    const service = createService({
      a: () => ({ disabled: false, className: 'from-a' }),
      b: () => ({ disabled: true }),
    });
    const props = { evaluate: ['a', { name: 'b', hideWhenDisabled: true }] };

    service.handleEvaluate(props);
    const result = props.evaluate({});

    expect(result.disabled).toBe(true);
    expect(result.className).toBe('from-a');
  });

  it('keeps working for the single-object form, which was never broken', () => {
    const service = createService({ a: () => ({ disabled: true }) });
    const props = { evaluate: { name: 'a', hideWhenDisabled: true } };

    service.handleEvaluate(props);

    expect(props.evaluateProps.hideWhenDisabled).toBe(true);
  });
});

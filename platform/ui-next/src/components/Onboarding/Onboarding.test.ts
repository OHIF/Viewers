import React from 'react';
import { act, render } from '@testing-library/react';
import { Onboarding } from './Onboarding';

type Handler = () => void;
const created: Array<{ start: jest.Mock; addStep: jest.Mock; show: () => void }> = [];

jest.mock('shepherd.js', () => {
  class Tour {
    handlers: Record<string, Handler[]> = {};
    addStep = jest.fn();
    start = jest.fn();
    constructor() {
      created.push({
        start: this.start,
        addStep: this.addStep,
        show: () => (this.handlers.show || []).splice(0).forEach(handler => handler()),
      });
    }
    once(event: string, handler: Handler) {
      (this.handlers[event] = this.handlers[event] || []).push(handler);
    }
  }
  return { __esModule: true, default: { Tour } };
});
jest.mock('shepherd.js/dist/css/shepherd.css', () => ({}), { virtual: true });
jest.mock('react-router', () => ({ useLocation: () => ({ pathname: '/viewer' }) }));

const tours = [
  { id: 'viewerTour', route: '/viewer', tourOptions: {}, steps: [{ id: 'one', text: 'One' }] },
];

const flush = () => act(async () => {});

describe('Onboarding persistence', () => {
  beforeEach(() => {
    created.length = 0;
    localStorage.clear();
  });

  it('defaults to localStorage and records the tour when its first step shows', async () => {
    const view = render(React.createElement(Onboarding, { tours }));
    await flush();
    expect(created).toHaveLength(1);
    expect(created[0].start).toHaveBeenCalled();
    expect(localStorage.getItem('shownTours')).toBeNull();

    created[0].show();
    await flush();
    expect(JSON.parse(localStorage.getItem('shownTours'))).toEqual(['viewerTour']);

    view.unmount();
    render(React.createElement(Onboarding, { tours }));
    await flush();
    expect(created).toHaveLength(1);
  });

  it('uses an async persistence: starts when not shown and marks on first show', async () => {
    const persistence = {
      hasBeenShown: jest.fn().mockResolvedValue(false),
      markShown: jest.fn().mockResolvedValue(undefined),
    };
    render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    expect(persistence.hasBeenShown).toHaveBeenCalledWith('viewerTour');
    expect(created).toHaveLength(1);
    expect(persistence.markShown).not.toHaveBeenCalled();

    created[0].show();
    await flush();
    expect(persistence.markShown).toHaveBeenCalledWith('viewerTour');
    expect(localStorage.getItem('shownTours')).toBeNull();
  });

  it('does not start a tour the persistence reports as shown', async () => {
    const persistence = { hasBeenShown: jest.fn().mockResolvedValue(true), markShown: jest.fn() };
    render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    expect(created).toHaveLength(0);
  });

  it('does not start the tour when unmounted before the answer arrives', async () => {
    let answer: (shown: boolean) => void = () => undefined;
    const persistence = {
      hasBeenShown: jest.fn(() => new Promise<boolean>(resolve => (answer = resolve))),
      markShown: jest.fn(),
    };
    const view = render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    view.unmount();
    answer(false);
    await flush();
    expect(created).toHaveLength(0);
  });

  it('does not start a tour when reading the record fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const persistence = {
      hasBeenShown: jest.fn().mockRejectedValue(new Error('offline')),
      markShown: jest.fn(),
    };
    render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    expect(created).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

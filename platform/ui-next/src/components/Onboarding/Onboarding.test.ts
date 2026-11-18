import React from 'react';
import { act, render } from '@testing-library/react';
import { Onboarding } from './Onboarding';

type Handler = () => void;
const created: Array<{ start: jest.Mock; addStep: jest.Mock; show: () => void }> = [];

jest.mock('shepherd.js', () => {
  class Step {
    handlers: Handler[] = [];
    once(event: string, handler: Handler) {
      if (event === 'show') {
        this.handlers.push(handler);
      }
    }
  }
  class Tour {
    steps: Step[] = [];
    addStep = jest.fn(() => {
      this.steps.push(new Step());
    });
    start = jest.fn();
    constructor() {
      created.push({
        start: this.start,
        addStep: this.addStep,
        // The first step is displayed (after any beforeShowPromise).
        show: () => this.steps[0].handlers.splice(0).forEach(handler => handler()),
      });
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

  it('does not start the tour again in this session while the record is being saved', async () => {
    let saved: () => void = () => undefined;
    const persistence = {
      hasBeenShown: jest.fn().mockResolvedValue(false),
      markShown: jest.fn(() => new Promise<void>(resolve => (saved = resolve))),
    };
    const view = render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    created[0].show();
    await flush();
    view.unmount();

    render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    expect(created).toHaveLength(1);
    saved();
  });

  it('records nothing when the tour starts but no step is displayed', async () => {
    const persistence = {
      hasBeenShown: jest.fn().mockResolvedValue(false),
      markShown: jest.fn(),
    };
    render(React.createElement(Onboarding, { tours, persistence }));
    await flush();
    expect(created[0].start).toHaveBeenCalled();
    expect(persistence.markShown).not.toHaveBeenCalled();
  });
});

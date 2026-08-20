import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';

const mockDisplaySetCache = new Map();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('@ohif/core', () => ({
  useSystem: () => ({
    servicesManager: {
      services: {
        displaySetService: {
          getDisplaySetCache: () => mockDisplaySetCache,
        },
      },
    },
  }),
}));

// Lightweight stand ins for the design system components - the dialog is being
// tested for what it says about the destination series, not for how ui-next
// renders a select, an input or a tooltip.
jest.mock('@ohif/ui-next', () => {
  const ReactMock = require('react');
  const SelectContext = ReactMock.createContext(null);
  const InputContext = ReactMock.createContext(null);
  // Only renders the tooltip content while the tooltip is open, so that the
  // dialog can be tested for when it shows a tooltip.
  const TooltipContext = ReactMock.createContext(false);

  const InputDialog = ({ value = '', onChange, children }) =>
    ReactMock.createElement(InputContext.Provider, { value: { value, onChange } }, children);
  InputDialog.Field = ({ children }) => ReactMock.createElement('div', null, children);
  InputDialog.Input = ({ placeholder, ...props }) => {
    const context = ReactMock.useContext(InputContext);
    return ReactMock.createElement('input', {
      'aria-label': placeholder,
      value: context.value,
      onChange: event => context.onChange(event.target.value),
      ...props,
    });
  };
  InputDialog.Actions = ({ children }) => ReactMock.createElement('div', null, children);
  InputDialog.ActionsPrimary = ({ onClick, children }) =>
    ReactMock.createElement('button', { onClick: () => onClick('') }, children);
  InputDialog.ActionsSecondary = ({ onClick, children }) =>
    ReactMock.createElement('button', { onClick: () => onClick('') }, children);

  return {
    cn: (...classes) => classes.filter(Boolean).join(' '),
    Icons: {
      Add: () => null,
      Info: () => null,
      ArrowRight: () => null,
      ChevronOpen: () => null,
    },
    Label: ({ children, htmlFor }) => ReactMock.createElement('label', { htmlFor }, children),
    Button: ({ dataCY, variant, size, className, children, ...props }) =>
      ReactMock.createElement('button', { 'data-cy': dataCY, ...props }, children),
    Input: ({ className, ...props }) => ReactMock.createElement('input', props),
    InputDialog,
    Tooltip: ({ open, children }) =>
      ReactMock.createElement(TooltipContext.Provider, { value: !!open }, children),
    TooltipProvider: ({ children }) => ReactMock.createElement('div', null, children),
    TooltipTrigger: ({ children }) => children,
    TooltipContent: ({ children }) =>
      ReactMock.useContext(TooltipContext) ? ReactMock.createElement('span', null, children) : null,
    Select: ({ value, onValueChange, children }) =>
      ReactMock.createElement(
        SelectContext.Provider,
        { value: { value, onValueChange } },
        children
      ),
    SelectTrigger: ({ children }) => ReactMock.createElement('div', null, children),
    SelectContent: ({ children }) => ReactMock.createElement('div', null, children),
    SelectValue: () => null,
    SelectItem: ({ value, children }) => {
      const context = ReactMock.useContext(SelectContext);
      return ReactMock.createElement(
        'button',
        { onClick: () => context.onValueChange(value) },
        children
      );
    },
  };
});

import { ReportDialog } from './reportDialogCustomization';

configure({ testIdAttribute: 'data-cy' });

const PREDECESSOR_IMAGE_ID = 'wadors:/seg-instance-1';

function setDisplaySets(displaySets) {
  mockDisplaySetCache.clear();
  displaySets.forEach(ds => mockDisplaySetCache.set(ds.displaySetInstanceUID, ds));
}

function renderDialog(props = {}) {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  render(
    React.createElement(ReportDialog as any, {
      dataSources: [],
      modality: 'SEG',
      minSeriesNumber: 3100,
      defaultSeriesDescription: 'Segmentation 1',
      hide: jest.fn(),
      onSave,
      onCancel,
      ...props,
    })
  );
  return { onSave, onCancel };
}

const HISTORY_STORAGE_KEY = 'ohif.seriesDescriptionHistory';

const destinationTitle = () => screen.getByTestId('report-destination-title').textContent;
const seriesNumberField = () => screen.getByTestId('report-series-number') as HTMLInputElement;
const seriesDescriptionField = () =>
  screen.getByLabelText('Series description') as HTMLInputElement;
const descriptionOptionsButton = () => screen.getByTestId('report-series-description-options');
const shownDescriptions = () =>
  Array.from(screen.getByTestId('report-series-description-list').querySelectorAll('button')).map(
    option => option.textContent
  );
const storedHistory = () => JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || '{}');
const setStoredHistory = (history: Record<string, string[]>) =>
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

describe('ReportDialog', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setDisplaySets([
      {
        displaySetInstanceUID: 'ds-1',
        Modality: 'SEG',
        SeriesInstanceUID: '1.2.3',
        SeriesNumber: 3105,
        SeriesDescription: 'Liver',
        SeriesDate: '20260101',
        SeriesTime: '120000',
        predecessorImageId: PREDECESSOR_IMAGE_ID,
      },
      // Another modality, so it is not a valid destination for a SEG.
      {
        displaySetInstanceUID: 'ds-2',
        Modality: 'CT',
        SeriesInstanceUID: '1.2.4',
        SeriesNumber: 1,
        SeriesDescription: 'Axial',
      },
    ]);
  });

  describe('new series', () => {
    it('offers the next series number and the default description', () => {
      const { onSave } = renderDialog();

      expect(destinationTitle()).toBe('New Series');
      // One past the highest existing series number of this modality.
      expect(seriesNumberField().value).toBe('3106');
      expect(seriesDescriptionField().value).toBe('Segmentation 1');

      fireEvent.click(screen.getByText('Save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          reportName: 'Segmentation 1',
          series: null,
          seriesNumber: 3106,
          priorSeriesNumber: 3105,
        })
      );
    });

    it('uses the minimum series number when no series of the modality exists', () => {
      setDisplaySets([]);
      renderDialog();

      expect(seriesNumberField().value).toBe('3101');
    });

    it('saves an edited series number and description', () => {
      const { onSave } = renderDialog();

      fireEvent.change(seriesNumberField(), { target: { value: '4321' } });
      fireEvent.change(seriesDescriptionField(), { target: { value: 'Left kidney' } });
      fireEvent.click(screen.getByText('Save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          reportName: 'Left kidney',
          series: null,
          seriesNumber: 4321,
          priorSeriesNumber: 4320,
        })
      );
    });

    it('falls back to the offered values when the fields are emptied', () => {
      const { onSave } = renderDialog();

      fireEvent.change(seriesNumberField(), { target: { value: '' } });
      fireEvent.change(seriesDescriptionField(), { target: { value: '  ' } });
      fireEvent.click(screen.getByText('Save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ reportName: 'Segmentation 1', seriesNumber: 3106 })
      );
    });

    it('is the only destination when the data has no series to extend', () => {
      renderDialog({ predecessorImageId: 'wadors:/not-loaded' });

      expect(destinationTitle()).toBe('New Series');
      expect(screen.queryByTestId('report-extend-existing')).toBeNull();
    });
  });

  describe('remembered series descriptions', () => {
    it('remembers the description that was used, per type of item', () => {
      const { onSave } = renderDialog();

      fireEvent.change(seriesDescriptionField(), { target: { value: 'Right kidney' } });
      fireEvent.click(screen.getByText('Save'));

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reportName: 'Right kidney' }));
      expect(storedHistory()).toEqual({ SEG: ['Right kidney'] });
    });

    it('offers the last used description, and keeps the older ones behind it', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      renderDialog();

      // The last used one is the most likely to be wanted again.
      expect(seriesDescriptionField().value).toBe('Right kidney');

      fireEvent.click(descriptionOptionsButton());
      // The provided description first, then the ones used before it.
      expect(shownDescriptions()).toEqual(['Segmentation 1', 'Right kidney', 'Left kidney']);
    });

    it('moves a reused description back to the front, without duplicating it', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      renderDialog();

      fireEvent.change(seriesDescriptionField(), { target: { value: 'left kidney' } });
      fireEvent.click(screen.getByText('Save'));

      expect(storedHistory()).toEqual({ SEG: ['left kidney', 'Right kidney'] });
    });

    it('remembers no more than the requested number of them', () => {
      setStoredHistory({ SEG: ['4', '3', '2', '1'] });
      renderDialog({ rememberedDescriptionCount: 3 });

      fireEvent.change(seriesDescriptionField(), { target: { value: '5' } });
      fireEvent.click(screen.getByText('Save'));

      expect(storedHistory()).toEqual({ SEG: ['5', '4', '3'] });
    });

    it('remembers nothing, and offers nothing, for a count of 0', () => {
      setStoredHistory({ SEG: ['Right kidney'] });
      renderDialog({ rememberedDescriptionCount: 0 });

      expect(seriesDescriptionField().value).toBe('Segmentation 1');
      expect(screen.queryByTestId('report-series-description-options')).toBeNull();

      fireEvent.click(screen.getByText('Save'));
      expect(storedHistory()).toEqual({ SEG: ['Right kidney'] });
    });

    it('keeps each type of item separate', () => {
      setStoredHistory({ SEG: ['Right kidney'] });
      renderDialog({ modality: 'RTSTRUCT', defaultSeriesDescription: 'Contours' });

      expect(seriesDescriptionField().value).toBe('Contours');

      fireEvent.click(screen.getByText('Save'));
      expect(storedHistory()).toEqual({ SEG: ['Right kidney'], RTSTRUCT: ['Contours'] });
    });

    it('narrows the offered descriptions to what is being typed', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney', 'Liver'] });
      renderDialog();

      fireEvent.change(seriesDescriptionField(), { target: { value: 'Li' } });

      expect(shownDescriptions()).toEqual(['Liver']);
    });

    it('completes the typed prefix on tab', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      renderDialog();

      fireEvent.change(seriesDescriptionField(), { target: { value: 'le' } });
      fireEvent.keyDown(seriesDescriptionField(), { key: 'Tab' });

      expect(seriesDescriptionField().value).toBe('Left kidney');
      expect(screen.queryByTestId('report-series-description-list')).toBeNull();
    });

    it('leaves the typed description alone when nothing completes it', () => {
      setStoredHistory({ SEG: ['Right kidney'] });
      renderDialog();

      fireEvent.change(seriesDescriptionField(), { target: { value: 'Spleen' } });
      fireEvent.keyDown(seriesDescriptionField(), { key: 'Tab' });

      expect(seriesDescriptionField().value).toBe('Spleen');
    });

    it('accepts a highlighted description with enter, and saves with the next one', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      const { onSave } = renderDialog();

      fireEvent.click(descriptionOptionsButton());
      fireEvent.keyDown(seriesDescriptionField(), { key: 'ArrowDown' });
      fireEvent.keyDown(seriesDescriptionField(), { key: 'ArrowDown' });
      fireEvent.keyDown(seriesDescriptionField(), { key: 'Enter' });

      expect(seriesDescriptionField().value).toBe('Right kidney');
      expect(onSave).not.toHaveBeenCalled();

      fireEvent.keyDown(seriesDescriptionField(), { key: 'Enter' });
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reportName: 'Right kidney' }));
    });
  });

  describe('extend existing', () => {
    it('shows the series number and description being extended, uneditable', () => {
      const { onSave } = renderDialog({ predecessorImageId: PREDECESSOR_IMAGE_ID });

      expect(destinationTitle()).toBe('Extend Existing');
      expect(seriesNumberField().textContent).toBe('3105');
      expect(screen.getByTestId('report-series-description').textContent).toBe('Liver');
      expect(screen.queryByLabelText('Series description')).toBeNull();

      fireEvent.click(screen.getByText('Save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          reportName: 'Liver',
          series: PREDECESSOR_IMAGE_ID,
          seriesNumber: 3105,
        })
      );
    });

    it('describes the switch only while the pointer is over it', () => {
      renderDialog({ predecessorImageId: PREDECESSOR_IMAGE_ID });
      const switchButton = screen.getByTestId('report-use-new-series');

      // The dialog focuses its first control on open, which must not be enough
      // to show the tooltip.
      expect(screen.queryByText('Save to a new series')).toBeNull();

      fireEvent.mouseEnter(switchButton);
      expect(screen.getByText('Save to a new series')).toBeTruthy();

      fireEvent.mouseLeave(switchButton);
      expect(screen.queryByText('Save to a new series')).toBeNull();
    });

    it('switches to and from creating a new series', () => {
      const { onSave } = renderDialog({ predecessorImageId: PREDECESSOR_IMAGE_ID });

      fireEvent.click(screen.getByTestId('report-use-new-series'));
      expect(destinationTitle()).toBe('New Series');
      expect(seriesNumberField().value).toBe('3106');

      fireEvent.click(screen.getByTestId('report-extend-existing'));
      expect(destinationTitle()).toBe('Extend Existing');

      fireEvent.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ series: PREDECESSOR_IMAGE_ID })
      );
    });
  });
});

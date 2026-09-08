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
// renders tabs, a select or an input.
jest.mock('@ohif/ui-next', () => {
  const ReactMock = require('react');
  const TabsContext = ReactMock.createContext(null);
  const SelectContext = ReactMock.createContext(null);

  const FooterAction = ({ children }) => ReactMock.createElement('div', null, children);
  FooterAction.Left = ({ children }) => ReactMock.createElement('div', null, children);
  FooterAction.Right = ({ children }) => ReactMock.createElement('div', null, children);
  const footerButton = ({ dataCY, onClick, disabled, children }) =>
    ReactMock.createElement('button', { 'data-cy': dataCY, onClick, disabled }, children);
  FooterAction.Primary = footerButton;
  FooterAction.Secondary = footerButton;

  return {
    cn: (...classes) => classes.filter(Boolean).join(' '),
    Icons: { ChevronOpen: () => null },
    Label: ({ children, htmlFor }) => ReactMock.createElement('label', { htmlFor }, children),
    Input: ({ className, ...props }) => ReactMock.createElement('input', props),
    FooterAction,
    Tabs: ({ value, onValueChange, children }) =>
      ReactMock.createElement(TabsContext.Provider, { value: { value, onValueChange } }, children),
    TabsList: ({ children }) => ReactMock.createElement('div', null, children),
    TabsTrigger: ({ value, children, ...props }) => {
      const context = ReactMock.useContext(TabsContext);
      return ReactMock.createElement(
        'button',
        {
          ...props,
          'aria-selected': context.value === value,
          onClick: () => context.onValueChange(value),
        },
        children
      );
    },
    Select: ({ value, onValueChange, children }) =>
      ReactMock.createElement(
        SelectContext.Provider,
        { value: { value, onValueChange } },
        children
      ),
    SelectTrigger: ({ children, ...props }) => ReactMock.createElement('div', props, children),
    SelectContent: ({ children }) => ReactMock.createElement('div', null, children),
    // Radix shows the placeholder until an item is chosen, then the item's text.
    SelectValue: ({ placeholder }) => {
      const context = ReactMock.useContext(SelectContext);
      return context?.value ? null : placeholder;
    },
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

const CURRENT_SERIES_IMAGE_ID = 'wadors:/seg-instance-1';
const OTHER_SERIES_IMAGE_ID = 'wadors:/seg-instance-2';

const CURRENT_SERIES = {
  displaySetInstanceUID: 'ds-current',
  Modality: 'SEG',
  SeriesInstanceUID: '1.2.3',
  SeriesNumber: 3105,
  SeriesDescription: 'Liver',
  predecessorImageId: CURRENT_SERIES_IMAGE_ID,
};

const OTHER_SERIES = {
  displaySetInstanceUID: 'ds-other',
  Modality: 'SEG',
  SeriesInstanceUID: '1.2.5',
  SeriesNumber: 3103,
  SeriesDescription: 'Spleen',
  predecessorImageId: OTHER_SERIES_IMAGE_ID,
};

// Another modality, so it is never a destination for a SEG.
const UNRELATED_SERIES = {
  displaySetInstanceUID: 'ds-ct',
  Modality: 'CT',
  SeriesInstanceUID: '1.2.4',
  SeriesNumber: 1,
  SeriesDescription: 'Axial',
};

const HISTORY_STORAGE_KEY = 'ohif.seriesDescriptionHistory';

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
      enableDownload: true,
      hide: jest.fn(),
      onSave,
      onCancel,
      ...props,
    })
  );
  return { onSave, onCancel };
}

const tab = (destination: string) => screen.getByTestId(`report-destination-${destination}`);
const selectedTab = () =>
  ['current', 'new', 'replace'].find(
    destination => tab(destination).getAttribute('aria-selected') === 'true'
  );
const helpText = () => screen.getByTestId('report-destination-help').textContent;
const seriesNumberField = () => screen.getByTestId('report-series-number') as HTMLInputElement;
const descriptionField = () => screen.getByTestId('dialog-input') as HTMLInputElement;
const saveButton = () => screen.getByTestId('input-dialog-save-button') as HTMLButtonElement;
const isDisabled = (element: HTMLElement) => (element as HTMLButtonElement).disabled;
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
    setDisplaySets([CURRENT_SERIES, OTHER_SERIES, UNRELATED_SERIES]);
  });

  describe('destinations', () => {
    it('saves to the series the data was loaded from by default', () => {
      renderDialog({ predecessorImageId: CURRENT_SERIES_IMAGE_ID });

      expect(selectedTab()).toBe('current');
      expect(helpText()).toContain('Adds a new version to this series');
      expect(saveButton().textContent).toBe('Save to current');
    });

    it('creates a series by default when the data has never been saved', () => {
      renderDialog();

      expect(selectedTab()).toBe('new');
      expect(helpText()).toBe('Creates a separate series.');
      expect(saveButton().textContent).toBe('Save as new');
      // There is no series it was loaded from to save to.
      expect(isDisabled(tab('current'))).toBe(true);
      expect(tab('current').getAttribute('title')).toBe(
        'This data has not been saved to a series yet'
      );
    });

    it('cannot replace a series when no other series of the type is loaded', () => {
      setDisplaySets([CURRENT_SERIES, UNRELATED_SERIES]);
      renderDialog({ predecessorImageId: CURRENT_SERIES_IMAGE_ID });

      expect(isDisabled(tab('replace'))).toBe(true);
      expect(tab('replace').getAttribute('title')).toBe('No other series of this type is loaded');
    });
  });

  describe('save to current', () => {
    it('shows the series number and description, uneditable, and stores into it', () => {
      const { onSave } = renderDialog({ predecessorImageId: CURRENT_SERIES_IMAGE_ID });

      expect(screen.getByTestId('report-series-description').textContent).toBe('Liver');
      expect(seriesNumberField().textContent).toBe('3105');
      expect(screen.queryByTestId('dialog-input')).toBeNull();

      fireEvent.click(saveButton());

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          reportName: 'Liver',
          series: CURRENT_SERIES_IMAGE_ID,
          seriesNumber: 3105,
        })
      );
    });
  });

  describe('save as new', () => {
    it('offers the next series number and the default description', () => {
      const { onSave } = renderDialog();

      // One past the highest existing series number of this modality.
      expect(seriesNumberField().value).toBe('3106');
      expect(descriptionField().value).toBe('Segmentation 1');

      fireEvent.click(saveButton());

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
      setDisplaySets([UNRELATED_SERIES]);
      renderDialog();

      expect(seriesNumberField().value).toBe('3101');
    });

    it('saves an edited series number and description', () => {
      const { onSave } = renderDialog();

      fireEvent.change(seriesNumberField(), { target: { value: '4321' } });
      fireEvent.change(descriptionField(), { target: { value: 'Left kidney' } });
      fireEvent.click(saveButton());

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
      fireEvent.change(descriptionField(), { target: { value: '  ' } });
      fireEvent.click(saveButton());

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ reportName: 'Segmentation 1', seriesNumber: 3106 })
      );
    });
  });

  describe('replace existing', () => {
    it('waits for a series to be chosen, then stores into it', () => {
      const { onSave } = renderDialog({ predecessorImageId: CURRENT_SERIES_IMAGE_ID });

      fireEvent.click(tab('replace'));

      expect(helpText()).toContain('Choose a series to replace');
      expect(isDisabled(saveButton())).toBe(true);
      expect(isDisabled(screen.getByTestId('report-download-button'))).toBe(true);
      expect(seriesNumberField().textContent).toBe('');
      // The row is labelled `Series Description`, so the control asks for the
      // choice it needs rather than repeating the label.
      expect(screen.getByTestId('report-replaced-series-select').textContent).toBe(
        'Select a series'
      );

      // The series the data was loaded from is not offered again here.
      fireEvent.click(screen.getByText('Spleen'));

      expect(screen.queryByText('Liver')).toBeNull();
      expect(seriesNumberField().textContent).toBe('3103');
      expect(isDisabled(saveButton())).toBe(false);

      fireEvent.click(saveButton());

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          reportName: 'Spleen',
          series: OTHER_SERIES_IMAGE_ID,
          seriesNumber: 3103,
        })
      );
    });

    it('names a series without a description by its number', () => {
      setDisplaySets([{ ...OTHER_SERIES, SeriesDescription: undefined }]);
      renderDialog();

      fireEvent.click(tab('replace'));

      expect(screen.getByText('Series 3103')).toBeTruthy();
    });
  });

  describe('remembered series descriptions', () => {
    it('remembers the description that was used, per type of item', () => {
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: 'Right kidney' } });
      fireEvent.click(saveButton());

      expect(storedHistory()).toEqual({ SEG: ['Right kidney'] });
    });

    it('remembers nothing when an existing series is stored into', () => {
      renderDialog({ predecessorImageId: CURRENT_SERIES_IMAGE_ID });

      fireEvent.click(saveButton());

      expect(storedHistory()).toEqual({});
    });

    it('offers the last used description, and keeps the older ones behind it', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      renderDialog();

      // The last used one is the most likely to be wanted again.
      expect(descriptionField().value).toBe('Right kidney');

      fireEvent.click(screen.getByTestId('report-series-description-options'));
      // The provided description first, then the ones used before it.
      expect(shownDescriptions()).toEqual(['Segmentation 1', 'Right kidney', 'Left kidney']);
    });

    it('moves a reused description back to the front, without duplicating it', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: 'left kidney' } });
      fireEvent.click(saveButton());

      expect(storedHistory()).toEqual({ SEG: ['left kidney', 'Right kidney'] });
    });

    it('remembers no more than the requested number of them', () => {
      setStoredHistory({ SEG: ['4', '3', '2', '1'] });
      renderDialog({ rememberedDescriptionCount: 3 });

      fireEvent.change(descriptionField(), { target: { value: '5' } });
      fireEvent.click(saveButton());

      expect(storedHistory()).toEqual({ SEG: ['5', '4', '3'] });
    });

    it('remembers nothing, and offers nothing, for a count of 0', () => {
      setStoredHistory({ SEG: ['Right kidney'] });
      renderDialog({ rememberedDescriptionCount: 0 });

      expect(descriptionField().value).toBe('Segmentation 1');
      expect(screen.queryByTestId('report-series-description-options')).toBeNull();

      fireEvent.click(saveButton());
      expect(storedHistory()).toEqual({ SEG: ['Right kidney'] });
    });

    it('keeps each type of item separate', () => {
      setStoredHistory({ SEG: ['Right kidney'] });
      renderDialog({ modality: 'RTSTRUCT', defaultSeriesDescription: 'Contours' });

      expect(descriptionField().value).toBe('Contours');

      fireEvent.click(saveButton());
      expect(storedHistory()).toEqual({ SEG: ['Right kidney'], RTSTRUCT: ['Contours'] });
    });

    it('narrows the offered descriptions to what is being typed', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney', 'Liver'] });
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: 'Li' } });

      expect(shownDescriptions()).toEqual(['Liver']);
    });

    it('completes the typed prefix on tab', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: 'le' } });
      fireEvent.keyDown(descriptionField(), { key: 'Tab' });

      expect(descriptionField().value).toBe('Left kidney');
      expect(screen.queryByTestId('report-series-description-list')).toBeNull();
    });

    it('leaves the typed description alone when nothing completes it', () => {
      setStoredHistory({ SEG: ['Right kidney'] });
      renderDialog();

      fireEvent.change(descriptionField(), { target: { value: 'Spleen' } });
      fireEvent.keyDown(descriptionField(), { key: 'Tab' });

      expect(descriptionField().value).toBe('Spleen');
    });

    it('accepts a highlighted description with enter, and saves with the next one', () => {
      setStoredHistory({ SEG: ['Right kidney', 'Left kidney'] });
      const { onSave } = renderDialog();

      fireEvent.click(screen.getByTestId('report-series-description-options'));
      fireEvent.keyDown(descriptionField(), { key: 'ArrowDown' });
      fireEvent.keyDown(descriptionField(), { key: 'ArrowDown' });
      fireEvent.keyDown(descriptionField(), { key: 'Enter' });

      expect(descriptionField().value).toBe('Right kidney');
      expect(onSave).not.toHaveBeenCalled();

      fireEvent.keyDown(descriptionField(), { key: 'Enter' });
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reportName: 'Right kidney' }));
    });
  });

  describe('actions', () => {
    it('downloads through the same destination', () => {
      const { onSave } = renderDialog();

      fireEvent.click(screen.getByTestId('report-download-button'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ dataSource: 'download', series: null })
      );
    });

    it('cancels without saving', () => {
      const { onSave, onCancel } = renderDialog();

      fireEvent.click(screen.getByTestId('input-dialog-cancel-button'));

      expect(onCancel).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});

/**
 * The study summary reads the study date and description from an instance in the metadata store.
 * A series can sit in the store with no instances (its summary arrives before its instances, and a
 * series whose metadata comes back empty never gets any), so the summary must not depend on the
 * first series having one.
 */

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';

const mockStudy = { current: null };

jest.mock('@ohif/core', () => ({
  DicomMetadataStore: { getStudy: () => mockStudy.current },
  utils: { formatDate: (date: string) => `formatted ${date}` },
}));
jest.mock('@ohif/ui-next', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    StudySummary: ({ date, description }) =>
      React.createElement('div', { 'data-testid': 'summary' }, `${date} | ${description}`),
  };
});

import { StudySummaryFromMetadata } from './StudySummaryFromMetadata';

const instance = { StudyDate: '20000102', StudyDescription: 'NLST-ACRIN' };

const renderSummary = series => {
  mockStudy.current = { series };
  return render(createElement(StudySummaryFromMetadata, { StudyInstanceUID: '1.2.3' }));
};

describe('StudySummaryFromMetadata', () => {
  it('reads the summary from the first series that has an instance', () => {
    renderSummary([{ instances: [] }, { instances: [instance] }]);

    expect(screen.getByTestId('summary').textContent).toBe('formatted 20000102 | NLST-ACRIN');
  });

  it('renders nothing while no series has an instance yet', () => {
    const { container } = renderSummary([{ instances: [] }, {}]);

    expect(container.innerHTML).toBe('');
  });
});

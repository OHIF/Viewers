import fs from 'fs';
import path from 'path';
import HangingProtocolService from '@ohif/core/src/services/HangingProtocolService/HangingProtocolService';
import isNewestOfModality from './utils/isNewestOfModality';

const ecgFile = path.resolve(
  __dirname,
  '../../../../platform/app/public/customizations/hangingProtocols/ecg.jsonc'
);
// shortcut: removes whole-line comments only; use JSON5 if the file gets inline comments.
const ecgProtocol = JSON.parse(fs.readFileSync(ecgFile, 'utf8').replace(/^\s*\/\/.*$/gm, ''))
  .global['hangingProtocols.@ohif/ecg'];

const current = { StudyInstanceUID: 'current' };
const prior = { StudyInstanceUID: 'prior' };
const displaySet = (study, uid: string, attributes: Record<string, unknown>) => ({
  StudyInstanceUID: study.StudyInstanceUID,
  SeriesInstanceUID: uid,
  displaySetInstanceUID: uid,
  ...attributes,
});

function serviceWith(customizations: Record<string, unknown>) {
  const customizationService = { getCustomization: id => customizations[id] };
  return new HangingProtocolService(
    { run: jest.fn() } as never,
    { services: { customizationService } } as never
  );
}

function hang(studies, displaySets) {
  const service = serviceWith({ 'hangingProtocols.@ohif/ecg': ecgProtocol });
  service.addCustomAttribute('isNewestOfModality', 'newest', isNewestOfModality);
  service.setActiveProtocolIds('@ohif/ecg');
  service.run({ studies, displaySets, activeStudy: studies[0] }, '@ohif/ecg', {});
  const { stage, viewportMatchDetails } = service.getActiveProtocol();
  const shown = [...viewportMatchDetails.values()].map(
    details => details.displaySetsInfo[0]?.displaySetInstanceUID
  );
  return { stage: stage.id, shown };
}

describe('hangingProtocols.<id> customization', () => {
  it('takes precedence over a protocol that addProtocol registered', () => {
    const service = serviceWith({ 'hangingProtocols.@ohif/ecg': ecgProtocol });
    service.addProtocol('@ohif/ecg', { ...ecgProtocol, name: 'registered' });
    expect(service.getProtocolById('@ohif/ecg').name).toBe('ECG');
  });
});

describe('the hangingProtocols/ecg customization', () => {
  const ct = displaySet(current, 'ct', { Modality: 'CT', numImageFrames: 100 });

  it('shows the ECG of a study with one ECG in one viewport', () => {
    const ecg = displaySet(current, 'ecg', { Modality: 'ECG', numImageFrames: 0 });

    expect(hang([current], [ct, ecg])).toEqual({ stage: 'ecg', shown: ['ecg'] });
  });

  it('shows the newest of two ECGs above the older one', () => {
    const older = displaySet(current, 'older', {
      Modality: 'ECG',
      SeriesNumber: 1,
      SeriesDate: '20250101',
    });
    const newer = displaySet(current, 'newer', {
      Modality: 'ECG',
      SeriesNumber: 2,
      SeriesDate: '20260101',
    });

    expect(hang([current], [older, newer])).toEqual({
      stage: 'ecgTwo',
      shown: ['newer', 'older'],
    });
  });

  it('shows the current ECG above the prior ECG first, and a PDF with Modality ECG is an ECG', () => {
    const ecgPdf = displaySet(current, 'ecgPdf', { Modality: 'ECG', numImageFrames: 0 });
    const otherEcg = displaySet(current, 'otherEcg', { Modality: 'ECG', numImageFrames: 0 });
    const priorEcg = displaySet(prior, 'priorEcg', { Modality: 'ECG', numImageFrames: 0 });

    const { stage, shown } = hang([current, prior], [ct, ecgPdf, otherEcg, priorEcg]);
    expect(stage).toBe('ecgPrior');
    expect(shown[1]).toBe('priorEcg');
    expect(['ecgPdf', 'otherEcg']).toContain(shown[0]);
  });
});

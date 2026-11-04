import HangingProtocolService from '@ohif/core/src/services/HangingProtocolService/HangingProtocolService';
import { hpMN } from './hpMNGrid';

const study = { StudyInstanceUID: 'study' };
const displaySet = (displaySetInstanceUID: string, attributes: Record<string, unknown>) => ({
  ...study,
  SeriesInstanceUID: displaySetInstanceUID,
  displaySetInstanceUID,
  ...attributes,
});

// Runs mnGrid with no stage, as the URL route does without a stageid.
function hang(displaySets: Record<string, unknown>[]) {
  const service = new HangingProtocolService(
    { run: jest.fn() } as never,
    { services: { customizationService: { getCustomization: () => undefined } } } as never
  );
  service.addProtocol(hpMN.id, hpMN);
  service.setActiveProtocolIds(hpMN.id);
  service.run({ studies: [study], displaySets, activeStudy: study }, hpMN.id, {
    stageIndex: undefined,
  });
  const { stage, viewportMatchDetails } = service.getActiveProtocol();
  const shown = [...viewportMatchDetails.values()].map(
    details => details.displaySetsInfo[0]?.displaySetInstanceUID
  );
  return { stage: stage.name, shown };
}

const ecg = displaySet('ecg', { Modality: 'ECG', numImageFrames: 0 });

describe('hpMN', () => {
  it('shows an ECG, whole slide or PDF study in one viewport', () => {
    const slide = displaySet('slide', { Modality: 'SM', numImageFrames: 0 });
    const pdf = displaySet('pdf', { Modality: 'OT', numImageFrames: 0 });

    expect(hang([ecg])).toEqual({ stage: '1x1', shown: ['ecg'] });
    expect(hang([slide])).toEqual({ stage: '1x1', shown: ['slide'] });
    expect(hang([pdf])).toEqual({ stage: '1x1', shown: ['pdf'] });
  });

  it('shows a single-frame image', () => {
    const cr = displaySet('cr', { Modality: 'CR', numImageFrames: 1 });

    expect(hang([cr])).toEqual({ stage: '1x1', shown: ['cr'] });
  });

  it('fills the 2x1 with the image first and then the ECG, and never a SEG, PR or SR', () => {
    const ct = displaySet('ct', { Modality: 'CT', numImageFrames: 100 });
    // A segmentation that the viewer creates has numImageFrames.
    const seg = displaySet('seg', { Modality: 'SEG', numImageFrames: 100 });
    const pr = displaySet('pr', { Modality: 'PR' });
    const sr = displaySet('sr', { Modality: 'SR' });

    expect(hang([seg, pr, ecg, sr, ct])).toEqual({ stage: '2x1', shown: ['ct', 'ecg'] });
  });

  it('does not show the ECG when the images fill the 3x1', () => {
    const images = ['ct1', 'ct2', 'ct3'].map(id =>
      displaySet(id, { Modality: 'CT', numImageFrames: 100 })
    );

    expect(hang([ecg, ...images])).toEqual({ stage: '3x1', shown: ['ct1', 'ct2', 'ct3'] });
  });
});

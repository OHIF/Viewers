import HangingProtocolService from '@ohif/core/src/services/HangingProtocolService/HangingProtocolService';
import { hpMN } from './hpMNGrid';

const study = { StudyInstanceUID: 'study' };
const displaySet = (displaySetInstanceUID: string, attributes: Record<string, unknown>) => ({
  ...study,
  SeriesInstanceUID: displaySetInstanceUID,
  displaySetInstanceUID,
  ...attributes,
});

function hang(displaySets: Record<string, unknown>[]) {
  const service = new HangingProtocolService(
    { run: jest.fn() } as never,
    { services: {} } as never
  );
  service.addProtocol(hpMN.id, hpMN);
  service.setActiveProtocolIds(hpMN.id);
  service.run({ studies: [study], displaySets, activeStudy: study }, hpMN.id);
  const { stage, viewportMatchDetails } = service.getActiveProtocol();
  const shown = [...viewportMatchDetails.values()].map(
    details => details.displaySetsInfo[0]?.displaySetInstanceUID
  );
  return { stage: stage.name, shown };
}

describe('hpMN', () => {
  it('shows an ECG, whole slide or PDF study in one viewport', () => {
    const ecg = displaySet('ecg', { Modality: 'ECG', numImageFrames: 0 });
    const slide = displaySet('slide', { Modality: 'SM', numImageFrames: 0 });
    const pdf = displaySet('pdf', { Modality: 'DOC', numImageFrames: 0 });

    expect(hang([ecg])).toEqual({ stage: '1x1 shown alone', shown: ['ecg'] });
    expect(hang([slide])).toEqual({ stage: '1x1 shown alone', shown: ['slide'] });
    expect(hang([pdf])).toEqual({ stage: '1x1 shown alone', shown: ['pdf'] });
  });

  it('gives no viewport to the SEG, PR and DOC display sets of an image study', () => {
    const ct = displaySet('ct', { Modality: 'CT', numImageFrames: 100 });
    // A segmentation that the viewer creates has numImageFrames.
    const seg = displaySet('seg', { Modality: 'SEG', numImageFrames: 100 });
    const pr = displaySet('pr', { Modality: 'PR' });
    const doc = displaySet('doc', { Modality: 'DOC', numImageFrames: 0 });

    expect(hang([seg, pr, ct, doc])).toEqual({ stage: '1x1', shown: ['ct'] });
  });
});

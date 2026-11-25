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
function run(displaySets: Record<string, unknown>[]) {
  const service = new HangingProtocolService(
    { run: jest.fn() } as never,
    {
      services: {
        customizationService: { hasCustomization: () => false, getCustomization: () => undefined },
        displaySetService: {
          getDisplaySetByUID: uid => displaySets.find(it => it.displaySetInstanceUID === uid),
        },
      },
    } as never
  );
  service.addProtocol(hpMN.id, hpMN);
  service.setActiveProtocolIds(hpMN.id);
  service.run({ studies: [study], displaySets, activeStudy: study }, hpMN.id, {
    stageIndex: undefined,
  });
  return service;
}

function hang(displaySets: Record<string, unknown>[]) {
  const { stage, viewportMatchDetails } = run(displaySets).getActiveProtocol();
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

  it('opens the first applicable stage when a command gives no stage, and disables the image-only stages', () => {
    const service = run([ecg]);
    // As setHangingProtocol does for a protocol with no stored or given stage
    service.setProtocol(hpMN.id, { stageIndex: service.getStageIndex(hpMN.id, {}) });

    const { stage, protocol } = service.getActiveProtocol();
    expect(stage.name).toBe('1x1');
    expect(protocol.stages.map(it => it.status)).toEqual([
      'disabled',
      'disabled',
      'passive',
      'enabled',
    ]);
  });

  it('opens the first applicable stage when the URL gives a stage that is disabled', () => {
    const service = run([ecg]);
    // As the URL route does for &stageid=2x2
    service.setProtocol(hpMN.id, {
      stageIndex: service.getStageIndex(hpMN.id, { stageId: '2x2' }),
    });

    expect(service.getActiveProtocol().stage.id).toBe('1x1');
  });

  it('keeps the display set that the user chose in 3x1 when the stage changes to 2x1', () => {
    const images = ['ct1', 'ct2', 'ct3'].map(id =>
      displaySet(id, { Modality: 'CT', numImageFrames: 100 })
    );
    const service = run(images);
    // reuseCachedLayouts stores the user's ct3 in viewport 0 of the 3x1 under this key
    const [viewport0] = service.getActiveProtocol().stage.viewports;
    const key = service.getDisplaySetSelectorMapKey('study', viewport0.displaySets[0]);

    service.setProtocol(hpMN.id, { stageId: '2x1', displaySetSelectorMap: { [key]: ['ct3'] } });

    const { stage, viewportMatchDetails } = service.getActiveProtocol();
    expect(stage.id).toBe('2x1');
    expect(
      viewportMatchDetails.get(stage.viewports[0].viewportOptions.viewportId)?.displaySetsInfo[0]
        .displaySetInstanceUID
    ).toBe('ct3');
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

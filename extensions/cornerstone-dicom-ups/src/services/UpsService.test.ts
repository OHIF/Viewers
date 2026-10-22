import { UpsClient } from './UpsClient';
import { UpsService } from './UpsService';
import { DicomJsonDataset, ProcedureStepState, TAG, WorkitemCode } from './types';

const CODE: WorkitemCode = { codeValue: 'CT-ORGAN-SEG', codingSchemeDesignator: '99CLARUS' };

function makeClient(overrides: Partial<UpsClient> = {}): jest.Mocked<UpsClient> {
  return {
    createWorkitem: jest.fn(async () => '1.2.3'),
    searchWorkitems: jest.fn(async () => []),
    retrieveWorkitem: jest.fn(async () => ({})),
    cancelWorkitem: jest.fn(async () => {}),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(async () => {}),
    ...overrides,
  } as unknown as jest.Mocked<UpsClient>;
}

const study = (): DicomJsonDataset => ({
  [TAG.StudyInstanceUID]: { vr: 'UI', Value: ['1.2.3'] },
});

describe('UpsService', () => {
  it('reuses an existing non-terminal workitem instead of creating one', async () => {
    const client = makeClient({
      searchWorkitems: jest.fn(async () => [
        {
          [TAG.SOPInstanceUID]: { vr: 'UI', Value: ['9.9.9'] },
          [TAG.ProcedureStepState]: { vr: 'CS', Value: [ProcedureStepState.SCHEDULED] },
          [TAG.ScheduledWorkitemCodeSequence]: {
            vr: 'SQ',
            Value: [
              {
                [TAG.CodeValue]: { vr: 'SH', Value: [CODE.codeValue] },
                [TAG.CodingSchemeDesignator]: { vr: 'SH', Value: [CODE.codingSchemeDesignator] },
              },
            ],
          },
        },
      ]),
    });
    const service = new UpsService(client);

    const uid = await service.run(CODE, study(), []);

    expect(uid).toBe('9.9.9');
    expect(client.createWorkitem).not.toHaveBeenCalled();
  });

  it('creates a workitem when the study has none for the code', async () => {
    const client = makeClient();
    const service = new UpsService(client);

    const uid = await service.run(CODE, study(), []);

    expect(client.createWorkitem).toHaveBeenCalledTimes(1);
    expect(typeof uid).toBe('string');
  });

  it('reads outputs from inside the performed procedure sequence', async () => {
    const client = makeClient({
      retrieveWorkitem: jest.fn(async () => ({
        [TAG.UnifiedProcedureStepPerformedProcedureSequence]: {
          vr: 'SQ',
          Value: [
            {
              [TAG.OutputInformationSequence]: {
                vr: 'SQ',
                Value: [
                  {
                    [TAG.ReferencedSOPInstanceUID]: { vr: 'UI', Value: ['1.1'] },
                    [TAG.SeriesInstanceUID]: { vr: 'UI', Value: ['1.2'] },
                  },
                ],
              },
            },
          ],
        },
      })),
    });
    const service = new UpsService(client);

    const outputs = await service.loadOutputs('9.9.9');

    expect([...outputs.keys()]).toEqual(['1.2']);
    expect(await service.outputInstanceUids('9.9.9')).toEqual(['1.1']);
  });

  it('classifies states and outputs', () => {
    expect(UpsService.isNonTerminal(ProcedureStepState.SCHEDULED)).toBe(true);
    expect(UpsService.isNonTerminal(ProcedureStepState.IN_PROGRESS)).toBe(true);
    expect(UpsService.isNonTerminal(ProcedureStepState.COMPLETED)).toBe(false);

    expect(
      UpsService.stateOf({
        [TAG.ProcedureStepState]: { vr: 'CS', Value: [ProcedureStepState.IN_PROGRESS] },
      })
    ).toBe(ProcedureStepState.IN_PROGRESS);
    expect(UpsService.stateOf({})).toBeNull();

    expect(
      UpsService.hasOutputs({
        [TAG.UnifiedProcedureStepPerformedProcedureSequence]: {
          vr: 'SQ',
          Value: [{ [TAG.OutputInformationSequence]: { vr: 'SQ', Value: [{}] } }],
        },
      })
    ).toBe(true);
  });

  it('falls back to polling when the notification channel never opens', async () => {
    jest.useFakeTimers();
    try {
      const client = makeClient();
      const workitem = {
        [TAG.ProcedureStepState]: { vr: 'CS', Value: [ProcedureStepState.COMPLETED] },
      } as DicomJsonDataset;
      (client.retrieveWorkitem as jest.Mock).mockResolvedValue(workitem);
      (client.subscribe as jest.Mock).mockImplementation(
        (_uid: string, _ae: string, _onEvent: unknown, onError?: () => void) => {
          onError?.();
          return { close: jest.fn() };
        }
      );

      const service = new UpsService(client, 'OHIF');
      const events: number[] = [];
      const handle = service.watch('9.9.9', event => events.push(event.eventTypeId));

      await jest.advanceTimersByTimeAsync(0);

      expect(client.retrieveWorkitem).toHaveBeenCalledTimes(1);
      expect(events).toEqual([1]);
      handle.close();
    } finally {
      jest.useRealTimers();
    }
  });
});

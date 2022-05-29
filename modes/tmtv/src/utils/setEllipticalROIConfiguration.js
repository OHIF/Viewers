import { toolGroupIds } from '../initToolGroups';

export default function setEllipticalROIConfiguration(
  matches,
  toolNames,
  ToolGroupService,
  DisplaySetService
) {
  const { SeriesInstanceUID } = matches.get('ptDisplaySet');
  const displaySets = DisplaySetService.getDisplaySetsForSeries(
    SeriesInstanceUID
  );

  const toolConfig = ToolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI
  );

  const ellipticalROIConfig = {
    ...toolConfig,
    volumeId: displaySets[0].displaySetInstanceUID,
  };
  debugger;
  ToolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI,
    ellipticalROIConfig
  );
}

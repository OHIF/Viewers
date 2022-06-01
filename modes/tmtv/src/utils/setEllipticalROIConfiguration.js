import { toolGroupIds } from '../initToolGroups';

export default function setEllipticalROIConfiguration(
  matches,
  toolNames,
  ToolGroupService,
  DisplaySetService
) {
  const matchDetails = matches.get('ptDisplaySet');

  if (!matchDetails) {
    return;
  }

  const { SeriesInstanceUID } = matchDetails;

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

  ToolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI,
    ellipticalROIConfig
  );
}

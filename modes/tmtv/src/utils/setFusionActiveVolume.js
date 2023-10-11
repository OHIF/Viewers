import { toolGroupIds } from '../initToolGroups';

export default function setFusionActiveVolume(
  matches,
  toolNames,
  toolGroupService,
  displaySetService
) {
  const matchDetails = matches.get('ptDisplaySet');

  if (!matchDetails) {
    return;
  }

  const { SeriesInstanceUID } = matchDetails;

  const displaySets = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID);

  if (!displaySets || displaySets.length === 0) {
    return;
  }

  const wlToolConfig = toolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.WindowLevel
  );

  const ellipticalToolConfig = toolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI
  );

  // Todo: this should not take into account the loader id
  const volumeId = `cornerstoneStreamingImageVolume:${displaySets[0].displaySetInstanceUID}`;

  const windowLevelConfig = {
    ...wlToolConfig,
    volumeId,
  };

  const ellipticalROIConfig = {
    ...ellipticalToolConfig,
    volumeId,
  };

  toolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.WindowLevel,
    windowLevelConfig
  );

  toolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI,
    ellipticalROIConfig
  );
}

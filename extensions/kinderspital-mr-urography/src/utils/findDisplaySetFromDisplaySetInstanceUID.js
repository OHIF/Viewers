export default function findDisplaySetFromDisplaySetInstanceUID(
  studies,
  displaySetInstanceUID
) {
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.displaySets;

    for (let j = 0; j < displaySets.length; j++) {
      if (displaySets[j].displaySetInstanceUID === displaySetInstanceUID) {
        return displaySets[j];
      }
    }
  }
}

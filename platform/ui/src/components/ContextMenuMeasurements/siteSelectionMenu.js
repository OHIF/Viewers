import ConfigPoint from 'config-point';

export default ConfigPoint.createConfiguration("siteSelectionMenu",
  {
    items: [
      { label: 'Head', actionType: 'SiteSelection', colour: "red" },
      { label: 'Neck', actionType: 'SiteSelection', colour: "green" },
      { label: 'Chest', actionType: 'SiteSelection', colour: "blue" },
      { label: 'Heart', actionType: 'SiteSelection', colour: "cyan" },
      { label: 'Legs', actionType: 'SiteSelection', colour: "magenta" },
    ],
  });

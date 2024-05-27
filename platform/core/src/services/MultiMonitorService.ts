/**
 * This service manages multiple monitors or windows.
 */
export class MultiMonitorService {
  public readonly numberOfScreens: number;
  private screenConfig;
  private screenInfo;
  private launchWindows = [];

  public readonly screenNumber: number;
  public readonly isMultimonitor: boolean;

  public static REGISTRATION = {
    name: 'multiMonitorService',
    create: ({ configuration }): MultiMonitorService => {
      return new MultiMonitorService(configuration);
    },
  };

  constructor(configuration) {
    const params = new URLSearchParams(window.location.search);
    const screenNumber = params.get('screenNumber');
    const multimonitor = params.get('multimonitor');
    const testParams = { params, screenNumber, multimonitor };
    this.screenNumber = screenNumber ? Number(screenNumber) : 0;
    for (const screenConfig of configuration || []) {
      if (screenConfig.test(testParams)) {
        this.isMultimonitor = true;
        this.screenConfig = screenConfig;
        this.numberOfScreens = screenConfig.screens.length;
        this.screenInfo = this.screenConfig.screens[this.screenNumber];
        if (!this.screenInfo) {
          throw new Error(`Screen ${screenNumber} not configured in ${this.screenConfig}`);
        }
        return;
      }
    }
    this.numberOfScreens = 1;
    this.isMultimonitor = false;
  }

  public launchStudy(studyUid: string, screenDelta = 1) {
    const forScreen = (this.screenNumber + screenDelta) % this.numberOfScreens;
    const url = this.createUrlForStudy(studyUid);
    const forWindow = this.getOrCreateWindow(forScreen, url);
    console.log('Launched to', forWindow, url);
    forWindow.location = url;
  }

  createUrlForStudy(studyUid) {
    const { pathname, origin } = window.location;
    return `${origin}${pathname}?StudyInstanceUIDs=${studyUid}`;
  }

  public getOrCreateWindow(screenNumber, url = window.location.href) {
    if (screenNumber === this.screenNumber) {
      return window;
    }
    if (!this.launchWindows[screenNumber]) {
      const width = 1024;
      const height = 1024;
      this.launchWindows[screenNumber] = window.open(
        `${url}&multimonitor=secondary&screenNumber=${screenNumber}`,
        `${this.screenConfig.screens[screenNumber].id}`,
        `screenX=${width + 1},top=0,width=${width},height=${height}`
      );
    }
    return this.launchWindows[screenNumber];
  }
}

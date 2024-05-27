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
        console.log(
          '*** Multimonitor',
          screenConfig,
          this.numberOfScreens,
          this.screenNumber,
          this.screenInfo
        );
        return;
      }
    }
    console.log('*** Single monitor', screenNumber, this.screenNumber);
    this.numberOfScreens = 1;
    this.isMultimonitor = false;
  }

  public launchStudy(studyUid: string, screenDelta = 1) {
    const forScreen = (this.screenNumber + screenDelta) % this.numberOfScreens;
    const forWindow = this.getOrCreateWindow(forScreen, studyUid);
    console.log('Launched to', forWindow);
  }

  public getOrCreateWindow(screenNumber, studyUid: string) {
    if (screenNumber === this.screenNumber) {
      return window;
    }
    if (!this.launchWindows[screenNumber]) {
      const { pathname, search, origin } = window.location;
      if (search.indexOf('multimonitor=secondary') !== -1) {
        throw new Error('Launch from secondary not supported');
      }

      const width = 1024;
      const height = 1024;
      this.launchWindows[screenNumber] = window.open(
        `${origin}${pathname}?multimonitor=secondary&screenNumber=${screenNumber}&StudyInstanceUIDs=${studyUid}`,
        `${this.screenConfig.screens[screenNumber].id}`,
        `screenX=${width + 1},top=0,width=${width},height=${height}`
      );
    }
    return this.launchWindows[screenNumber];
  }
}

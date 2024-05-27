/**
 * This service manages multiple monitors or windows.
 */
export class MultiMonitorService {
  public readonly numberOfScreens: number;
  private windowsConfig;
  private screenConfig;
  private launchWindows = [];

  public readonly screenNumber: number;
  public readonly isMultimonitor: boolean;

  public static REGISTRATION = {
    name: 'multiMonitorService',
    create: ({ configuration }): MultiMonitorService => {
      const service = new MultiMonitorService(configuration);
      console.log('global multimonitor setup', (window as any).multimonitor);
      return service;
    },
  };

  constructor(configuration) {
    const params = new URLSearchParams(window.location.search);
    const screenNumber = params.get('screenNumber');
    const multimonitor = params.get('multimonitor');
    const testParams = { params, screenNumber, multimonitor };
    this.screenNumber = screenNumber ? Number(screenNumber) : 0;
    (window as any).multimonitor ||= {
      setLaunchWindows: this.setLaunchWindows,
      launchWindows: this.launchWindows,
    };
    this.launchWindows = (window as any).multimonitor?.launchWindows || this.launchWindows;
    if (!this.screenNumber) {
      this.launchWindows[0] = window;
    }
    for (const windowsConfig of Array.isArray(configuration) ? configuration : []) {
      if (windowsConfig.test(testParams)) {
        this.isMultimonitor = true;
        this.numberOfScreens = windowsConfig.screens.length;
        this.windowsConfig = windowsConfig;
        this.screenConfig = windowsConfig.screens[this.screenNumber];
        if (!this.screenConfig) {
          throw new Error(`Screen ${screenNumber} not configured in ${this.windowsConfig}`);
        }
        window.name = this.screenConfig.id;
        return;
      }
    }
    this.numberOfScreens = 1;
    this.isMultimonitor = false;
  }

  /**
   * Calls append ont he query with the multimonitor mode as appropriate.
   */
  public appendQuery(query) {
    if (!this.isMultimonitor) {
      return;
    }
    query.append('multimonitor', this.windowsConfig.id);
    if (this.screenNumber) {
      query.append('screenNumber', String(this.screenNumber));
    }
  }

  /** Sets the launch windows for later use, shared amongst all windows. */
  public setLaunchWindows = launchWindows => {
    this.launchWindows = launchWindows;
    (window as any).multimonitor.launchWindows = launchWindows;
  };

  public async launchStudy(studyUid: string, screenDelta = 1) {
    const forScreen = (this.screenNumber + screenDelta) % this.numberOfScreens;
    const url = this.createUrlForStudy(studyUid, forScreen);
    const forWindow = await this.getOrCreateWindow(forScreen, url);
    forWindow.location = url;
    forWindow.onload = () => {
      if ((forWindow as any).multimonitor.setLaunchWindows) {
        (forWindow as any).multimonitor.setLaunchWindows(this.launchWindows);
      } else {
        console.warn('At end of load, no launch windows array');
      }
      forWindow.onload = null;
    };
    forWindow.multimonitor?.setLaunchWindows?.(this.launchWindows);
  }

  createUrlForStudy(studyUid, screenNumber) {
    const { pathname, origin } = window.location;
    return `${origin}${pathname}?StudyInstanceUIDs=${studyUid}&multimonitor=${this.windowsConfig.id}&screenNumber=${screenNumber}`;
  }

  /**
   * Creates a new window showing the given url by default, or gets an existing
   * window.
   */
  public async getOrCreateWindow(screenNumber, url) {
    if (screenNumber === this.screenNumber) {
      return window;
    }
    const screenInfo = this.windowsConfig.screens[screenNumber];
    if (!this.launchWindows[screenNumber] || this.launchWindows[screenNumber].closed) {
      const screenDetails = await window.getScreenDetails?.();
      console.log('screenDetails=', screenDetails);
      const screen =
        (screenInfo.screen >= 0 && screenDetails.screens[screenInfo.screen]) ||
        screenDetails.currentScreen ||
        window.screen;
      console.log('Chosen screen', screen);
      const { width = 1024, height = 1024, availLeft = 0, availTop = 0 } = screen || {};
      const newScreen = this.windowsConfig.screens[screenNumber];
      const {
        width: widthPercent = 1,
        height: heightPercent = 1,
        top: topPercent = 0,
        left: leftPercent = 0,
      } = newScreen.location || {};

      const useLeft = Math.round(availLeft + leftPercent * width);
      const useTop = Math.round(availTop + topPercent * height);
      const useWidth = Math.round(width * widthPercent);
      const useHeight = Math.round(height * heightPercent);

      const newWindow = (this.launchWindows[screenNumber] = window.open(
        `${url}&multimonitor=secondary&screenNumber=${screenNumber}`,
        `${newScreen.id}`,
        `screenX=${useLeft},screenY=${useTop},width=${useWidth},height=${useHeight}`
      ));
      (newWindow as any).multimonitor = {
        launchWindows: this.launchWindows,
      };
    }
    return this.launchWindows[screenNumber];
  }
}

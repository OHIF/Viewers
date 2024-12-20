/**
 * This service manages multiple monitors or windows.
 */
export class MultiMonitorService {
  public readonly numberOfScreens: number;
  private windowsConfig;
  private screenConfig;
  private launchWindows = [];
  private commandsManager;
  private basePath: string;

  public readonly screenNumber: number;
  public readonly isMultimonitor: boolean;

  public static readonly SOURCE_SCREEN = {
    id: 'source',
    // This is the primary screen, so don't launch is separately, but use primary
    launch: 'source',
    screen: null,
    location: {
      screen: null,
      width: 1,
      height: 1,
      left: 0,
      top: 0,
    },
  };

  public static REGISTRATION = {
    name: 'multiMonitorService',
    create: ({ configuration, commandsManager }): MultiMonitorService => {
      const service = new MultiMonitorService(configuration, commandsManager);
      return service;
    },
  };

  constructor(configuration, commandsManager) {
    const params = new URLSearchParams(window.location.search);
    const screenNumber = params.get('screenNumber');
    const multimonitor = params.get('multimonitor');
    const testParams = { params, screenNumber, multimonitor };
    this.screenNumber = screenNumber ? Number(screenNumber) : -1;
    this.commandsManager = commandsManager;
    const windowAny = window as any;
    windowAny.multimonitor ||= {
      setLaunchWindows: this.setLaunchWindows,
      launchWindows: this.launchWindows,
      commandsManager,
    };
    windowAny.multimonitor.commandsManager = commandsManager;
    this.launchWindows = (window as any).multimonitor?.launchWindows || this.launchWindows;
    if (this.screenNumber !== -1) {
      this.launchWindows[this.screenNumber] = window;
    }
    windowAny.commandsManager = (...args) => configuration.commandsManager;
    for (const windowsConfig of Array.isArray(configuration) ? configuration : []) {
      if (windowsConfig.test(testParams)) {
        this.isMultimonitor = true;
        this.numberOfScreens = windowsConfig.screens.length;
        this.windowsConfig = windowsConfig;
        if (this.screenNumber === -1 || this.screenNumber === null) {
          this.screenConfig = MultiMonitorService.SOURCE_SCREEN;
        } else {
          this.screenConfig = windowsConfig.screens[this.screenNumber];
          if (!this.screenConfig) {
            throw new Error(`Screen ${screenNumber} not configured in ${this.windowsConfig}`);
          }
          window.name = this.screenConfig.id;
        }
        return;
      }
      this.numberOfScreens = 1;
      this.isMultimonitor = false;
    }
  }

  public run(screenDelta = 1, commands, options) {
    const screenNumber = (this.screenNumber + (screenDelta ?? 1)) % this.numberOfScreens;
    const otherWindow = this.getWindow(screenNumber);
    if (!otherWindow) {
      console.warn('No multimonitor found for screen', screenNumber, commands);
      return;
    }
    if (!otherWindow.multimonitor?.commandsManager) {
      console.warn("Didn't find a commands manager to run in the other window", otherWindow);
      return;
    }
    console.log('Running commands in other window', commands, options);
    const result = otherWindow.multimonitor.commandsManager.runAsync(commands, options);
    console.log('Got result', result);
  }

  /** Sets the launch windows for later use, shared amongst all windows. */
  public setLaunchWindows = launchWindows => {
    this.launchWindows = launchWindows;
    (window as any).multimonitor.launchWindows = launchWindows;
  };

  public async launchWindow(studyUid: string, screenDelta = 1) {
    const forScreen = (this.screenNumber + screenDelta) % this.numberOfScreens;
    return this.getWindow(forScreen);
  }

  public getWindow(screenNumber) {
    if (screenNumber === this.screenNumber) {
      return window;
    }
    if (this.launchWindows[screenNumber] && !this.launchWindows[screenNumber].closed) {
      return this.launchWindows[screenNumber];
    }
    return this.createWindow(screenNumber);
  }

  /**
   * Creates a new window showing the given url by default, or gets an existing
   * window.
   */
  public async createWindow(screenNumber) {
    if (screenNumber === this.screenNumber) {
      return window;
    }
    const screenInfo = this.windowsConfig.screens[screenNumber];
    const screenDetails = await window.getScreenDetails?.();
    const screen =
      (screenInfo.screen >= 0 && screenDetails.screens[screenInfo.screen]) ||
      screenDetails.currentScreen ||
      window.screen;
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
    const url = `${this.basePath}&screenNumber=${screenNumber}`;
    const newId = newScreen.id;
    const options = newScreen.options || '';
    const position = `screenX=${useLeft},screenY=${useTop},width=${useWidth},height=${useHeight},${options}`;

    let newWindow = window.open('', newId, position);
    if (newWindow?.location.href !== url) {
      newWindow = window.open(url, newId, position);
    }
    if (!newWindow) {
      console.warn('Unable to launch window', url, 'called', newId, 'at', position);
      return;
    }
    console.info('Launching', screenNumber, newId, url, position);
    this.launchWindows[screenNumber] = newWindow;
    return newWindow;
  }

  /** Launches all the windows using the initial configuration */
  public launchAll() {
    for (let i = 0; i < this.numberOfScreens; i++) {
      this.createWindow(i);
    }
  }

  public setBasePath() {
    const url = new URL(window.location.href);
    url.searchParams.delete('screenNumber');
    url.searchParams.delete('protocolId');
    url.searchParams.delete('launchAll');
    url.searchParams.set('multimonitor', url.searchParams.get('multimonitor') || 'split');
    this.basePath = url.toString();
  }

  /**
   * Try moving the screen to the correct location - this will only work with
   * screens opened with openWindow containing no more than 1 tab.
   */
  public async onModeEnter() {
    this.setBasePath();

    if (
      (this.isMultimonitor && this.screenNumber === -1) ||
      window.location.href.indexOf('launchAll') !== -1
    ) {
      this.launchAll();
    }
  }
}

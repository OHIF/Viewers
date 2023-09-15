import { PubSubService } from '../_shared/pubSubServiceInterface';
import { ExtensionManager } from '../../extensions';

const EVENTS = {};

type Obj = Record<string, unknown>;

type StateConfig = {
  /** clearOnModeExit defines state configuration that is cleared automatically on
   * exiting a mode.  This clearing occurs after the mode onModeExit,
   * so it is possible to preserve desired state during exit to be restored
   * later.
   */
  clearOnModeExit?: boolean;
};

type States = {
  [key: string]: Obj;
};

/**
 */
export default class StateSyncService extends PubSubService {
  public static REGISTRATION = {
    name: 'stateSyncService',
    create: ({ configuration = {}, commandsManager }) => {
      return new StateSyncService({ configuration, commandsManager });
    },
  };

  extensionManager: ExtensionManager;
  configuration: Obj;
  registeredStateSets: {
    [id: string]: StateConfig;
  } = {};
  state: States = {};

  constructor({ configuration }) {
    super(EVENTS);
    this.configuration = configuration || {};
  }

  public init(extensionManager: ExtensionManager): void {}

  /** Registers a new sync store called `id`.  The state
   * defines how the state is stored, and any default clearing of the
   * state.
   * A default store has the lifetime of the application.
   * The other available store is cleared `onModeExit`
   */
  public register(id: string, config: StateConfig): void {
    this.registeredStateSets[id] = config;
    this.store({ [id]: {} });
  }

  public getState(): Record<string, Obj> {
    // TODO - return a proxy to this which is not writable in dev mode
    return this.state;
  }

  /**
   * Stores all the new state values contained in states.
   *
   * @param states - is an object containing replacement values to store
   * @returns
   */
  public store(states: States): States {
    Object.keys(states).forEach(stateKey => {
      if (!this.registeredStateSets[stateKey]) {
        throw new Error(`No state ${stateKey} registered`);
      }
    });
    this.state = { ...this.state, ...states };
    return states;
  }

  public onModeExit(): void {
    const toReduce = {};
    for (const [key, value] of Object.entries(this.registeredStateSets)) {
      if (value.clearOnModeExit) {
        toReduce[key] = {};
      }
    }
    this.store(toReduce);
  }
}

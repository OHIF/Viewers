/**
 * Class to define inheritance of load retrieve strategy.
 * The process can be async load (lazy) or sync load
 *
 * There are methods that must be implemented at consumer level
 * To retrieve study call execLoad
 */
export default class RetrieveMetadataLoader {
  /**
   * @constructor
   * @param {Object} server Object with server configuration parameters
   * @param {Array} studyInstanceUID Study instance ui to be retrieved
   * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
   * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
   */
  constructor(server, studyInstanceUID, filters = {}) {
    this.server = server;
    this.studyInstanceUID = studyInstanceUID;
    this.filters = filters;
  }

  async execLoad() {
    await this.configLoad();
    const preLoadData = await this.preLoad();
    const loadData = await this.load(preLoadData);
    const postLoadData = await this.posLoad(loadData);

    return postLoadData;
  }

  // Methods to be overwrite
  async configLoad() { }
  async preLoad() { }
  async load(preLoadData) { }
  async posLoad(loadData) { }
}

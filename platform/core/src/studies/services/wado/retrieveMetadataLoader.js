export default class RetrieveMetadataLoader {
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

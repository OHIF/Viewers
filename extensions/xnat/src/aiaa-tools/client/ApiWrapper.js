import { api_get, api_post_file, api_put } from './restApi.js';

const fixUrl = (urlStr) => {
  const pattern = /^((http|https):\/\/)/;
  let str = urlStr.endsWith('/') ? urlStr.slice(0, -1) : urlStr;
  if (!pattern.test(urlStr)) {
    str = 'http://' + str;
  }
  return str;
};

export default class ApiWrapper {
  constructor(url) {
    this._server_url = fixUrl(url);
  }

  setServerURL(url) {
    this._server_url = fixUrl(url);
  }

  getServerURL() {
    return this._server_url;
  }

  getModelsURL() {
    return new URL('/v1/models', this._server_url);
  }

  getLogsURL(lines = 100) {
    const log_url = new URL('logs', this._server_url);
    log_url.searchParams.append('lines', lines);
    return log_url;
  }

  /**
   * Use either model name or label to query available models in AIAA
   * @param {string} model_name
   * @param {string} label
   */
  async getModels(model_name = undefined, label = undefined) {
    console.info('AIAA fetching models');
    let model_url = new URL(this.getModelsURL().toString());

    if (model_name !== undefined) {
      model_url.searchParams.append('model', model_name);
    } else if (label !== undefined) {
      model_url.searchParams.append('label', label);
    }

    return api_get(model_url.toString());
  }

  /**
   * Get AIAA session API
   *
   * @param session_id
   * @param {boolean} update_ts: Update Last Access time for session
   *
   * @return {string} session_id
   *
   */
  async getSession(session_id, update_ts = false) {
    console.info('AIAAClient - get session');
    let session_url = new URL(`/session/${session_id}`, this._server_url);
    if (update_ts) {
      session_url.searchParams.append('update_ts', update_ts);
    }
    return api_get(session_url.toString());
  }

  /**
   * Calls AIAA create session API
   *
   * @param image_in
   * @param params
   * @param {int} expiry: expiry in seconds.
   *
   * @return {string} session_id
   *
   */
  async createSession(image_in, params, expiry = 0) {
    console.info('AIAAClient - create session');
    let session_url = new URL('/session/', this._server_url);
    session_url.searchParams.append('expiry', expiry);
    return api_put(session_url.toString(), params, image_in);
  }

  async runModel(api, params, model_name, session_id) {
    console.info('AIAAClient - calling ' + api);
    let url = new URL(`/v1/${api}`, this._server_url);

    url.searchParams.append('model', model_name);
    url.searchParams.append('session_id', session_id);
    url.searchParams.append('output', 'image');

    console.info(params);
    return await api_post_file(url.toString(), params, null);
  }
}

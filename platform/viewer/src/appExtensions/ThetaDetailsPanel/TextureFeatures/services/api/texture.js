import Http from './../Http';

export class TextureApi {
  base = '/texture';

  async checkTexture(id) {
    try {
      const { data } = await Http.get(`${this.base}/${id}`);
      return data;
    } catch (e) {
      console.log(e);
    } 
  }

  async TriggerJob(body) {
    try {
      const { data } = await Http.post(`${this.base}`, body);
      return data;
    } catch (e) {
      console.log(e);
    }
  }
}

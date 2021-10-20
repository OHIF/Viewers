import Http from './../Http';

export class JobsApi {
  base = '/jobs';

  async jobs(body) {
    try {
      const { data } = await Http.get(`${this.base}/${body}`);
      return data;
    } catch (e) {
      console.log(e);
    }
  }
}

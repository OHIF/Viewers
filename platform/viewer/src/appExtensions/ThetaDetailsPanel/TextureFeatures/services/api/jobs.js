import Http from './../Http';
import cornerstone from 'cornerstone-core';
import { getEnabledElement } from '../../../../../../../../extensions/cornerstone/src/state';

export class JobsApi {
  base = '/jobs';

  async jobs() {
    try {
      // const { data } = await Http.get(`${this.base}/${body}`);

      const view_ports = cornerstone.getEnabledElements();
      const viewports = view_ports[0];

      // setting active viewport reference to element variable
      const element = getEnabledElement(view_ports.indexOf(viewports));
      if (!element) {
        return;
      }

      // retrieving cornerstone enable element object
      const enabled_element = cornerstone.getEnabledElement(element);
      if (!enabled_element || !enabled_element.image) {
        return;
      }

      console.log({ view_ports, viewports });

      const data = 'Geting all jobs api call';
      return data;
    } catch (e) {
      console.log(e);
    }
  }
}

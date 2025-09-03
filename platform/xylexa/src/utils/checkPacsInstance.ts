import axios, { AxiosResponse } from 'axios';
import { ServerConfigs } from './../types';

export type Props = {
  serverConfigsData: AxiosResponse<ServerConfigs>;
  setServerConfigs: (serverConfigsData: ServerConfigs) => void;
};

/**
 * checkPacsInstance sends a GET request to get the qidoRoot url coming from the configurations.
 * Only in case of success (status, 200) current configuration of app will be updated to new
 * configurations. Otherwise, error modal will pop up.
 *
 *
 * @param {object} serverConfigsData // ServerConfig response coming from API
 * @param {function} setServerConfigs // state update function coming from userAuthenticationContext
 */

export async function checkPacsInstance({ serverConfigsData, setServerConfigs }: Props) {
  try {
    const url = `${serverConfigsData?.data?.qidoRoot}/studies`;

    const res = await axios(url, {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + btoa(serverConfigsData?.data?.requestOptions?.auth),
      },
    });

    if (res.status === 200) {
      setServerConfigs(serverConfigsData?.data);
    }
  } catch (error) {
    //TODO show toast
  }
}

export default checkPacsInstance;

import { ExtensionManager, Types } from '@ohif/core';

/**
 * This file contains the implementations of BaseDataSourceConfigurationAPIItem
 * and BaseDataSourceConfigurationAPI for the Google cloud healthcare API. To
 * better understand this implementation and/or to implement custom implementations,
 * see the platform\core\src\types\DataSourceConfigurationAPI.ts and its JS doc
 * comments as a guide.
 */

/**
 * The various Google Cloud Healthcare path item types.
 */
enum ItemType {
  projects = 0,
  locations = 1,
  datasets = 2,
  dicomStores = 3,
}

interface NamedItem {
  name: string;
}
interface Project extends NamedItem {
  projectId: string;
}

const initialUrl = 'https://cloudresourcemanager.googleapis.com/v1';
const baseHealthcareUrl = 'https://healthcare.googleapis.com/v1';

class GoogleCloudDataSourceConfigurationAPIItem
  implements Types.BaseDataSourceConfigurationAPIItem
{
  id: string;
  name: string;
  url: string;
  itemType: ItemType;
}

class GoogleCloudDataSourceConfigurationAPI implements Types.BaseDataSourceConfigurationAPI {
  private _extensionManager: ExtensionManager;
  private _fetchOptions: { method: string; headers: unknown };
  private _dataSourceName: string;

  constructor(dataSourceName, servicesManager: AppTypes.ServicesManager, extensionManager) {
    this._dataSourceName = dataSourceName;
    this._extensionManager = extensionManager;
    const userAuthenticationService = servicesManager.services.userAuthenticationService;
    this._fetchOptions = {
      method: 'GET',
      headers: userAuthenticationService.getAuthorizationHeader(),
    };
  }

  getItemLabels = () => ['Project', 'Location', 'Data set', 'DICOM store'];

  async initialize(): Promise<Types.BaseDataSourceConfigurationAPIItem[]> {
    const url = `${initialUrl}/projects`;

    const projects = (await GoogleCloudDataSourceConfigurationAPI._doFetch(
      url,
      ItemType.projects,
      this._fetchOptions
    )) as Array<Project>;

    if (!projects?.length) {
      return [];
    }

    const projectItems = projects.map(project => {
      return {
        id: project.projectId,
        name: project.name,
        itemType: ItemType.projects,
        url: `${baseHealthcareUrl}/projects/${project.projectId}`,
      };
    });

    return projectItems;
  }

  async setCurrentItem(
    anItem: Types.BaseDataSourceConfigurationAPIItem
  ): Promise<Types.BaseDataSourceConfigurationAPIItem[]> {
    const googleCloudItem = anItem as GoogleCloudDataSourceConfigurationAPIItem;

    if (googleCloudItem.itemType === ItemType.dicomStores) {
      // Last configurable item, so update the data source configuration.
      const url = `${googleCloudItem.url}/dicomWeb`;
      const dataSourceDefCopy = JSON.parse(
        JSON.stringify(this._extensionManager.getDataSourceDefinition(this._dataSourceName))
      );
      dataSourceDefCopy.configuration = {
        ...dataSourceDefCopy.configuration,
        wadoUriRoot: url,
        qidoRoot: url,
        wadoRoot: url,
      };

      this._extensionManager.updateDataSourceConfiguration(
        dataSourceDefCopy.sourceName,
        dataSourceDefCopy.configuration
      );

      return [];
    }

    const subItemType = googleCloudItem.itemType + 1;
    const subItemField = `${ItemType[subItemType]}`;

    const url = `${googleCloudItem.url}/${subItemField}`;

    const fetchedSubItems = await GoogleCloudDataSourceConfigurationAPI._doFetch(
      url,
      subItemType,
      this._fetchOptions
    );

    if (!fetchedSubItems?.length) {
      return [];
    }

    const subItems = fetchedSubItems.map(subItem => {
      const nameSplit = subItem.name.split('/');
      return {
        id: subItem.name,
        name: nameSplit[nameSplit.length - 1],
        itemType: subItemType,
        url: `${baseHealthcareUrl}/${subItem.name}`,
      };
    });

    return subItems;
  }

  async getConfiguredItems(): Promise<Array<GoogleCloudDataSourceConfigurationAPIItem>> {
    const dataSourceDefinition = this._extensionManager.getDataSourceDefinition(
      this._dataSourceName
    );

    const url = dataSourceDefinition.configuration.wadoUriRoot;
    const projectsIndex = url.indexOf('projects');
    // Split the configured URL into (essentially) pairs (i.e. item type followed by item)
    // Explicitly: ['projects','aProject','locations','aLocation','datasets','aDataSet','dicomStores','aDicomStore']
    // Note that a partial configuration will have a subset of the above.
    const urlSplit = url.substring(projectsIndex).split('/');

    const configuredItems = [];

    for (
      let itemType = 0;
      // the number of configured items is either the max (4) or the number extracted from the url split
      itemType < 4 && (itemType + 1) * 2 < urlSplit.length;
      itemType += 1
    ) {
      if (itemType === ItemType.projects) {
        const projectId = urlSplit[1];
        const projectUrl = `${initialUrl}/projects/${projectId}`;
        const data = await GoogleCloudDataSourceConfigurationAPI._doFetch(
          projectUrl,
          ItemType.projects,
          this._fetchOptions
        );
        const project = data[0] as Project;
        configuredItems.push({
          id: project.projectId,
          name: project.name,
          itemType: itemType,
          url: `${baseHealthcareUrl}/projects/${project.projectId}`,
        });
      } else {
        const relativePath = urlSplit.slice(0, itemType * 2 + 2).join('/');
        configuredItems.push({
          id: relativePath,
          name: urlSplit[itemType * 2 + 1],
          itemType: itemType,
          url: `${baseHealthcareUrl}/${relativePath}`,
        });
      }
    }

    return configuredItems;
  }

  /**
   * Fetches an array of items the specified item type.
   * @param urlStr the fetch url
   * @param fetchItemType the type to fetch
   * @param fetchOptions the header options for the fetch (e.g. authorization header)
   * @param fetchSearchParams any search query params; currently only used for paging results
   * @returns an array of items of the specified type
   */
  private static async _doFetch(
    urlStr: string,
    fetchItemType: ItemType,
    fetchOptions = {},
    fetchSearchParams: Record<string, string> = {}
  ): Promise<Array<Project> | Array<NamedItem>> {
    try {
      const url = new URL(urlStr);
      url.search = new URLSearchParams(fetchSearchParams).toString();

      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      if (response.status >= 200 && response.status < 300 && data != null) {
        if (data.nextPageToken != null) {
          fetchSearchParams.pageToken = data.nextPageToken;
          const subPageData = await this._doFetch(
            urlStr,
            fetchItemType,
            fetchOptions,
            fetchSearchParams
          );
          data[ItemType[fetchItemType]] = data[ItemType[fetchItemType]].concat(subPageData);
        }
        if (data[ItemType[fetchItemType]]) {
          return data[ItemType[fetchItemType]];
        } else if (data.name) {
          return [data];
        } else {
          return [];
        }
      } else {
        const message =
          data?.error?.message ||
          `Error returned from Google Cloud Healthcare: ${response.status} - ${response.statusText}`;
        throw new Error(message);
      }
    } catch (err) {
      const message = err?.message || 'Error occurred during fetch request.';
      throw new Error(message);
    }
  }
}

export { GoogleCloudDataSourceConfigurationAPI };

// PVR-447 show option to change data source from ui
import { ExtensionManager, Types } from '@ohif/core';
class DataSourceConfigurationAPIItem implements Types.BaseDataSourceConfigurationAPIItem {
  id: string;
  name: string;
}

class DataSourceConfigurationAPI implements Types.BaseDataSourceConfigurationAPI {
  private _extensionManager: ExtensionManager;

  constructor(extensionManager) {
    this._extensionManager = extensionManager;
  }

  getItemLabels = () => ['Data Sources'];

  async initialize(): Promise<Types.BaseDataSourceConfigurationAPIItem[]> {
    const datasources = this._extensionManager.appConfig.dataSources.map(ds => {
      return {
        id: ds.sourceName,
        name: ds.sourceName,
      };
    });

    return new Promise(resolve => resolve(datasources));
  }

  async setCurrentItem(
    anItem: Types.BaseDataSourceConfigurationAPIItem
  ): Promise<Types.BaseDataSourceConfigurationAPIItem[]> {
    return new Promise(resolve => {
      if (anItem) {
        this._extensionManager.setActiveDataSource(anItem.name);
      }
      this.initialize().then(items => resolve(items));
    });
  }

  async getConfiguredItems(): Promise<Array<DataSourceConfigurationAPIItem>> {
    const activeDatasource = this._extensionManager.getActiveDataSourceDefinition();
    return [
      {
        id: activeDatasource.sourceName,
        name: activeDatasource.sourceName,
      },
    ];
  }
}

export { DataSourceConfigurationAPI };

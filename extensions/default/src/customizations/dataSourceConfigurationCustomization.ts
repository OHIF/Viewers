import DataSourceConfigurationComponent from '../Components/DataSourceConfigurationComponent';
import { GoogleCloudDataSourceConfigurationAPI } from '../DataSourceConfigurationAPI/GoogleCloudDataSourceConfigurationAPI';

export default function getDataSourceConfigurationCustomization({
  servicesManager,
  extensionManager,
}) {
  return {
    // the generic GUI component to configure a data source using an instance of a BaseDataSourceConfigurationAPI
    'ohif.dataSourceConfigurationComponent': DataSourceConfigurationComponent.bind(null, {
      servicesManager,
      extensionManager,
    }),

    // The factory for creating an instance of a BaseDataSourceConfigurationAPI for Google Cloud Healthcare
    'ohif.dataSourceConfigurationAPI.google': (dataSourceName: string) =>
      new GoogleCloudDataSourceConfigurationAPI(dataSourceName, servicesManager, extensionManager),
  };
}

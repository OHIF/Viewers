## Data Source Selection

The worklist page displays the selected datasource at the top. Users can easily switch between available data sources configured in the configuration file by clicking the icon next to the data source name.

### UI Configuration

You can customize the datasource selection UI through two configuration options:

#### Datasource Selection API
- **Customization Module Key**: `ohif.dataSourceSelectionAPI`
- **Purpose**: Defines the API used for datasource selection. This is an implementation of the interface `BaseDataSourceConfigurationAPI`
- **Usage**: Provide a custom implementation to control what datasources are retrieved and managed

#### Datasource Selector Component
- **Customization Module Key**: `ohif.dataSourceSelectorComponent`
- **Purpose**: Specifies the component used for displaying and interacting with datasource selection
- **Usage**: UI component that shows the selected data source and the list of selectable data sources

Example configuration:
```javascript
{
  id: 'ohif.dataSourceSelectionAPI',
  factory: () => new DataSourceConfigurationAPI(extensionManager),
},
{
  id: 'ohif.dataSourceSelectorComponent',
  component: DataSourceConfigurationComponent.bind(null, {
    servicesManager,
    extensionManager,
    type: 'sourceSelector',
  }),
}

export interface BaseDataSourceConfigurationAPIItem {
  id: string;
  name: string;
}

/**
 * The interface to use to configure an associated data source. Typically an
 * instance of this interface is associated with a data source that the instance
 * understands and can alter the data source's configuration.
 */
export interface BaseDataSourceConfigurationAPI {
  /**
   * Gets the i18n labels (i.e. the i18n lookup keys) for each of the configurable items
   * of the data source configuration API.
   * For example, for the Google Cloud Healthcare API, this would be
   * ['Project', 'Location', 'Data set', 'DICOM store'].
   * Besides the configurable item labels themselves, several other string look ups
   * are used base on EACH of the labels returned by this method.
   * For instance, for the label {itemLabel}, the following strings are fetched for
   * translation...
   * 1. `No {itemLabel} available`
   *    - used to indicate no such items are available
   *    - for example, for Google, `No Project available` would be 'No projects available'
   * 2. `Select {itemLabel}`
   *    - used to direct selection of the item
   *    - for example, for Google, `Select Project` would be 'Select a project'
   * 3. `Error fetching {itemLabel} list`
   *    - used to indicate an error occurred fetching the list of items
   *    - usually accompanied by the error itself
   *    - for example, for Google, `Error fetching Project list` would be 'Error fetching projects'
   * 4. `Search {itemLabel} list`
   *    - used as the placeholder text for filtering a list of items
   *    - for example, for Google, `Search Project list` would be 'Search projects'
   */
  getItemLabels(): Array<string>;

  /**
   * Initializes the data source configuration API and returns the top-level sub-items
   * that can be chosen to begin the process of configuring the data source.
   * For example, for the Google Cloud Healthcare API, this would perform the initial request
   * to fetch the top level projects for the logged in user account.
   */
  initialize(): Promise<Array<BaseDataSourceConfigurationAPIItem>>;

  /**
   * Sets the current path item and returns the sub-items of that item
   * that can be further chosen to configure a data source.
   * When setting the last configurable item of the data source (path), this method
   * returns an empty list AND configures the active data source with the selected
   * items path.
   * For example, for the Google Cloud Healthcare API, this would take the current item
   * (say a data set) and queries and returns its sub-items (i.e. all of the DICOM stores
   * contained in that data set). Furthermore, whenever the item to set is a DICOM store,
   * the Google Cloud Healthcare API implementation would update the OHIF data source
   * associated with this instance to point to that DICOM store.
   * @param item the item to set as current
   */
  setCurrentItem(
    item: BaseDataSourceConfigurationAPIItem
  ): Promise<Array<BaseDataSourceConfigurationAPIItem>>;

  /**
   * Gets the list of items currently configured for the data source associated with
   * this API instance. The resultant array must be the same length as the result of
   * `getItemLabels`.
   */
  getConfiguredItems(): Promise<Array<BaseDataSourceConfigurationAPIItem>>;
}

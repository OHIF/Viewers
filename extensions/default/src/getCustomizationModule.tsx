import { CustomizationService } from '@ohif/core';
import React from 'react';
import DataSourceSelector from './Panels/DataSourceSelector';
import { ProgressDropdownWithService } from './Components/ProgressDropdownWithService';
import DataSourceConfigurationComponent from './Components/DataSourceConfigurationComponent';
import { GoogleCloudDataSourceConfigurationAPI } from './DataSourceConfigurationAPI/GoogleCloudDataSourceConfigurationAPI';
import { utils } from '@ohif/core';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
  Icons,
} from '@ohif/ui-next';

const { sortingCriteria } = utils;
const formatDate = utils.formatDate;

/**
 *
 * Note: this is an example of how the customization module can be used
 * using the customization module. Below, we are adding a new custom route
 * to the application at the path /custom and rendering a custom component
 * Real world use cases of the having a custom route would be to add a
 * custom page for the user to view their profile, or to add a custom
 * page for login etc.
 */
export default function getCustomizationModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'helloPage',
      value: {
        customRoutes: {
          routes: {
            $push: [
              {
                path: '/custom',
                children: () => <h1 style={{ color: 'white' }}>Hello Custom Route</h1>,
              },
            ],
          },
        },
      },
    },
    // Example customization to list a set of datasources
    {
      name: 'datasources',
      value: {
        customRoutes: {
          routes: {
            $push: [
              {
                path: '/datasources',
                children: DataSourceSelector,
              },
            ],
          },
        },
      },
    },
    {
      name: 'multimonitor',
      value: {
        'studyBrowser.studyMenuItems': {
          $push: [
            {
              id: 'applyHangingProtocol',
              label: 'Apply Hanging Protocol',
              iconName: 'ViewportViews',
              items: [
                {
                  id: 'applyDefaultProtocol',
                  label: 'Default',
                  commands: [
                    'loadStudy',
                    {
                      commandName: 'setHangingProtocol',
                      commandOptions: {
                        protocolId: 'default',
                      },
                    },
                  ],
                },
                {
                  id: 'applyMPRProtocol',
                  label: '2x2 Grid',
                  commands: [
                    'loadStudy',
                    {
                      commandName: 'setHangingProtocol',
                      commandOptions: {
                        protocolId: '@ohif/mnGrid',
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: 'showInOtherMonitor',
              label: 'Launch On Second Monitor',
              iconName: 'DicomTagBrowser',
              // we should use evaluator for this, as these are basically toolbar buttons
              selector: ({ servicesManager }) => {
                const { multiMonitorService } = servicesManager.services;
                return multiMonitorService.isMultimonitor;
              },
              commands: {
                commandName: 'multimonitor',
                commandOptions: {
                  hashParams: '&hangingProtocolId=@ohif/mnGrid8',
                  commands: [
                    'loadStudy',
                    {
                      commandName: 'setHangingProtocol',
                      commandOptions: {
                        protocolId: '@ohif/mnGrid8',
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
    {
      name: 'default',
      value: {
        customRoutes: {
          routes: [],
          notFoundRoute: null,
        },
        'studyBrowser.studyMenuItems': [],
        'studyBrowser.thumbnailMenuItems': [
          {
            id: 'tagBrowser',
            label: 'Tag Browser',
            iconName: 'DicomTagBrowser',
            commands: 'openDICOMTagViewer',
          },
        ],
        measurementLabels: [],
        'ohif.overlayItem': function (props) {
          if (this.condition && !this.condition(props)) {
            return null;
          }

          const { instance } = props;
          const value =
            instance && this.attribute
              ? instance[this.attribute]
              : this.contentF && typeof this.contentF === 'function'
                ? this.contentF(props)
                : null;
          if (!value) {
            return null;
          }

          return (
            <span
              className="overlay-item flex flex-row"
              style={{ color: this.color || undefined }}
              title={this.title || ''}
            >
              {this.label && <span className="mr-1 shrink-0">{this.label}</span>}
              <span className="font-light">{value}</span>
            </span>
          );
        },

        'ohif.contextMenu': function (customizationService: CustomizationService) {
          /**
           * Applies the inheritsFrom to all the menu items.
           * This function clones the object and child objects to prevent
           * changes to the original customization object.
           */
          // Don't modify the children, as those are copied by reference
          const clonedObject = { ...this };
          clonedObject.menus = this.menus.map(menu => ({ ...menu }));

          for (const menu of clonedObject.menus) {
            const { items: originalItems } = menu;
            menu.items = [];
            for (const item of originalItems) {
              menu.items.push(customizationService.transform(item));
            }
          }
          return clonedObject;
        },
        'PanelStudyBrowser.studyMode': 'all',
        // the generic GUI component to configure a data source using an instance of a BaseDataSourceConfigurationAPI
        'ohif.dataSourceConfigurationComponent': DataSourceConfigurationComponent.bind(null, {
          servicesManager,
          extensionManager,
        }),

        // The factory for creating an instance of a BaseDataSourceConfigurationAPI for Google Cloud Healthcare
        'ohif.dataSourceConfigurationAPI.google': (dataSourceName: string) =>
          new GoogleCloudDataSourceConfigurationAPI(
            dataSourceName,
            servicesManager,
            extensionManager
          ),

        progressDropdownWithServiceComponent: ProgressDropdownWithService,
        'studyBrowser.sortFunctions': [
          {
            label: 'Series Number',
            sortFunction: (a, b) => {
              return a?.SeriesNumber - b?.SeriesNumber;
            },
          },
          {
            label: 'Series Date',
            sortFunction: (a, b) => {
              const dateA = new Date(formatDate(a?.SeriesDate));
              const dateB = new Date(formatDate(b?.SeriesDate));
              return dateB.getTime() - dateA.getTime();
            },
          },
        ],
        'studyBrowser.viewPresets': [
          {
            id: 'list',
            iconName: 'ListView',
            selected: false,
          },
          {
            id: 'thumbnails',
            iconName: 'ThumbnailView',
            selected: true,
          },
        ],
        sortingCriteria: sortingCriteria.seriesSortCriteria.seriesInfoSortingCriteria,
        'ohif.menuContent': function (props) {
          const { item: topLevelItem, commandsManager, servicesManager, ...rest } = props;

          const content = function (subProps) {
            const { item: subItem } = subProps;

            // Regular menu item
            const isDisabled = subItem.selector && !subItem.selector({ servicesManager });

            return (
              <DropdownMenuItem
                disabled={isDisabled}
                onSelect={() => {
                  commandsManager.runAsync(subItem.commands, {
                    ...subItem.commandOptions,
                    ...rest,
                  });
                }}
                className="gap-[6px]"
              >
                {subItem.iconName && (
                  <Icons.ByName
                    name={subItem.iconName}
                    className="-ml-1"
                  />
                )}
                {subItem.label}
              </DropdownMenuItem>
            );
          };

          // If item has sub-items, render a submenu
          if (topLevelItem.items) {
            return (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-[6px]">
                  {topLevelItem.iconName && (
                    <Icons.ByName
                      name={topLevelItem.iconName}
                      className="-ml-1"
                    />
                  )}
                  {topLevelItem.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {topLevelItem.items.map(subItem => content({ ...props, item: subItem }))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            );
          }

          return content({ ...props, item: topLevelItem });
        },
      },
    },
  ];
}

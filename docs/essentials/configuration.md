# Configurations

There are a few pre-defined settings files that you can find in [config](https://github.com/OHIF/Viewers/tree/master/config) folder. These are Meteor files and all settings can be accessed as showed on [Meteor Website](https://docs.meteor.com/api/core.html#Meteor-settings). UI settings are also available as OHIF.uiSettings. See the [schema](https://github.com/OHIF/Viewers/blob/131d64854cb2eceff056a15ccb12c34b9e2baaa7/Packages/ohif-servers/both/schema/servers.js) for more information.

## Server settings

* `dropCollections (boolean)`: the server will drop all Mongo collections when it's set to `true` as soon as it has finished starting. This is useful for demo and development environments.

## UI Settings

* `studyListDateFilterNumDays (integer)`: define the default date filter (range) on study list. If it's 02/15/2017 and this config is set to 5 then it will search for studies between `02/10/2017` and `02/15/2017`.

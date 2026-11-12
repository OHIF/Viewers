---
id: 2-renamings
title: Renamings
sidebar_position: 2
summary: Migration guide for renamed components in OHIF 3.9, including the Panel Measurements name change from 'measure' to 'panelMeasurement' and addIcon utility changes to support both UI packages.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


## Panel Measurements

The panel in the default extension is renamed from `measure` to `panelMeasurement` to be more consistent with the rest of the extensions.

**Action Needed**

Update any references to the `measure` panel to `panelMeasurement` in your code.

Find and replace

<Tabs>
  <TabItem value="Before" label="Before 🕰️" default>
    @ohif/extension-default.panelModule.measure
  </TabItem>
  <TabItem value="After" label="After 🚀" >
    @ohif/extension-cornerstone.panelModule.panelMeasurement
  </TabItem>
</Tabs>

## addIcon from ui

The addIcon from the ui package has had a version added in the default extension as
`utils.addIcon` which adds to both `ui` and `ui-next`.

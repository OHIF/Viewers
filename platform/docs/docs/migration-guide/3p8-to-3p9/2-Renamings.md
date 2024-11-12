---
id: 2-renamings
title: Renamings
sidebar_position: 2
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

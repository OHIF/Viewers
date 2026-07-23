---
id: 3-data-sources
title: Data Sources
sidebar_position: 3
summary: Migration guide for BulkDataURI configuration changes in OHIF 3.9, explaining the transition from a simple boolean flag to a more flexible configuration object with additional control options.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## BulkDataURI Configuration

We've updated the configuration for BulkDataURI to provide more flexibility and control. This guide will help you migrate from the old configuration to the new one.

### What's Changing?

<Tabs>
  <TabItem value="Before" label="Before 🕰️" default>

```javascript
useBulkDataURI: false,
```

  </TabItem>
  <TabItem value="After" label="After 🚀">

```javascript
bulkDataURI: {
  enabled: true,
  // Additional configuration **options**
},
```

  </TabItem>
</Tabs>


**Additional Notes:**
- The new configuration allows for more granular control over BulkDataURI behavior.
- You can now add custom URL prefixing logic using the startsWith and prefixWith properties.
- This change enables easier correction of retrieval URLs, especially in scenarios where URLs pass through multiple systems.

---
sidebar_position: 5
sidebar_label: Multi Monitor Service
---

# Multi Monitor Service

The multi-monitor service provides detection, launch and communication support
for multiple monitors or windows/screens within a single monitor.

## GUI Behaviour

### Initial behaviour

On launching any mode into multi-monitor, apply the window resize to fill the
specified area on the specified monitor.

On clicking view in second monitor, apply the default hanging protocol to that
display, and LINK the monitors rather than opening up entirely new monitors.
  * Make sure M0 can launch M1 and vice versa, and that existing annotations are
preserved.

### Secondary behaviour

Add communications bus from Mi to all to communicate changes

Add sender/listener for:
  * Viewed display sets
  * Annotations

Maybe add a simple "mode" with a worklist for a given patient that always launches
to secondary window (or maybe have selector for destination) to allow extending the launch.

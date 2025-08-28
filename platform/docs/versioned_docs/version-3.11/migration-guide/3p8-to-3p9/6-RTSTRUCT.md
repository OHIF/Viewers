---
id: 6-rtstruct
title: RTSTRUCT
sidebar_position: 6
summary: Migration guide for RT Structure Set rendering in OHIF 3.9, explaining the transition from VTK-based rendering to SVG-based rendering for improved stability and speed while maintaining stack viewports instead of converting to volume viewports.
---



# RTStructure Set has transitioned from VTK actors to SVG.

We have transitioned from VTK-based rendering to SVG-based rendering for RTStructure Set contours. This change should not require any modifications to your codebase. We anticipate improved stability and speed in our contour rendering.

As a result of this update, viewports rendering RTStructure Sets will no longer convert to volume viewports. Instead, they will remain as stack viewports.


Read more in Pull Requests:
- https://github.com/OHIF/Viewers/pull/4074
- https://github.com/OHIF/Viewers/pull/4157

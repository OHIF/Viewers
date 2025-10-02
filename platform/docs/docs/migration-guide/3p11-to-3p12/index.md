---
sidebar_position: 1
sidebar_label: 3.11 -> 3.12 beta
---

# Migration Guide

This guide provides information about migrating from OHIF version 3.11 to version 3.12 beta

## Optional: Migrate modes to extend `modes/basic`

There is a lot of support for the basic mode definition contained in the
`modes/basic` module.  Using this framework will allow your mode to avoid
creating a lot of boilerplate code that may not upgrade very well.

This is an OPTIONAL change - your existing mode definitions will continue to work,
but using the new basic mode as a basis will reduce the amount of effort when
there are changes unrelated to your custom mode.


## ui button with text size

Using the class text size with the ui-button is inconsistent as to whether
it will apply or not.  Instead, create a new size value to assign the desired size.
To support this, a new size enum is created, smallTall, which is used in the worklist
for an over-ride.

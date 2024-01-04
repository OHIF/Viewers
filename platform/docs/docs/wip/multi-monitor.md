# Multi Monitor Notes and Ideas
The multimonitor mode currently works by just starting a second window in the
right half of the active monitor.  This is easily extended to support additional
monitors, but some idea of how to arrange the layout is required.

To use the mode, launch the MultiMonitor mode from the `yarn test:e2e:serve` page,
and you should see a second window showing additional series pop up.  This is
very basic, but generally gives the idea of how to use this mode.

Required Changes for Full Functionality:

1. Change the hanging protocol service to actually be aware of how many monitors
there are, and automatically sub-select the views as appropriate.

2. Add a way to configure the desired windows so that they automatically launch
in the required configuration

3. Add a multi-monitor support setup for other modes, eg the TMTV mode should
also support multi-monitor

4. Add a communication layer for:
  * Activation of tools/modes
  * Tool changes - eg Rotate should work across the board
  * Annotation creation/updates - annotation on one view should affect hte others
  * Navigation to current annotation - should find the item in any window
  * Changes to segmentations
  * Loading of SR, SEG, other data

Basic idea is a communication service that listens for a raft of change types and
fires events when it hears about other changes.

5. Patient information page - to allow the first/launch page to show patient
info, and allow launch to this page or other pages of additional details about
the studies.  This could be a report page, or a patient list page etc.  Not sure
what all this should include.
   * Basic idea is very simple patient studies list, with the launched study being listed first/primary
   * Buttons to launch modes into the current view, and multi-select to add study as prior


Gut feel is this is about a month's effort, broken down into:

1 week - items 1,2

2 weeks - item #4  (this would be the basic communication layer, but it might not
work very well for segmentations, but I think basic annotation updates can be done, as well as
navigation)

1 week - item #5 and #3 (can make #3 a result of both 5 and 2 if we are clever about it)


Part of the goal of all of this is to allow two separate systems to also communicate application state.

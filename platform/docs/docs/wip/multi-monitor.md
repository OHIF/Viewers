# Multi Monitor Notes and Ideas

The current multi-monitor mode simply launches a child window with a hanging
protocol that renders the second part of the study.  This is just basic display
of a study in two browser windows.

There are a number of stages planned for multi monitor:

## Simple Screen 2 Changes and "Diagnostic Monitor 1" launch
1. Modify the multi-monitor mode so that instead of display part of a study it:
  * Does not have the study thumbnail selector on the left
  * Has an upper portion of the window showing primary study information
    * Allows the study to be launched in a child window in various ways
    * By default controls the "diagnostic monitor 1" child window

## Diagnostic Monitor 2 showing prior study
2. Add prior study selection
  * Has a lower portion that is a "priors" study list, allowing prior studies to be
    launched into the child window.
  * Lower portion can launch into the "prior study" child window in any available mode
  * Add launch page for priors on "Simple Screen 2"

## Diagnostic Monitor 1,2 showing single study
3. Modify the hanging protocol layouts to be able to consider "split screen" information
   * Allows using existing modes and hanging protocols in multi-window applications
   * Will be designed so that odd-splits (eg 3 wide in 2 monitor application) split to left
   * Modify the launch from #1 to allow launch to both monitors for either prior or current using new layout

4. Add colour/date information to clearly show which study is which on secondary monitors

## Stay up to date, don't lose your data
5. Add communication to keep all viewports up to date with:
   * Annotations added
   * Presentation (camera) state applied to viewports
   * Segmentations added/applied
   * Save state of annotations and/or segmentations

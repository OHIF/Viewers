# Measurement Tracking Mode

## Introduction
Measurement tracking mode allows you to:

- Draw annotations and have them shown in the measurement panel
- Create a report from the tracked measurement and export them as DICOM SR
- Use already exported DICOM SR to re-hydrate the measurements in the viewer

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/preview.png)

## Workflow


### Status Icon
Each viewport has a left icon indicating whether the series within the viewport contains:

- tracked measurement OR
- untracked measurement OR
- Structured Report OR
- Locked (uneditable) Structured Report

In the following, we will discuss each category.

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/tracked.png)

### Tracked vs Untracked Measurements

OHIF-v3 implements a workflow for measurement tracking that can be seen below.
In summary, when you create an annotation, a prompt will be shown whether to start tracking or not. If you start the tracking, the annotation style will change to a solid line, and annotation details get displayed on the measurement panel. On the other hand, if you decline the tracking prompt, the measurement will be considered "temporary," and annotation style remains as a dashed line and not shown on the right panel, and cannot be exported.

Below, you can see different icons that appear for a tracked vs. untracked series in OHIF-v3.

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/workflow.png)

### Overview video for starting the tracking for measurements:
[](https://user-images.githubusercontent.com/7490180/171058922-b3749d26-87f5-4bc7-ad87-e217fc1bd2e8.mp4)


### Reading and Writing DICOM SR
OHIF-v3 provides full support for reading, writing and mapping the DICOM Structured Report (SR) to interactable Cornerstone Tools. When you load an already exported DICOM SR into the viewer, you will be prompted whether to track the measurements for the series or not.

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/preview.png)

If you click Yes, DICOM SR measurements gets re-hydrated into the viewer and the series become a tracked series. However, If you say no and later decide to say track the measurements, you can always click on the SR button that will prompt you with the same message again.

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/restore.png)

The full workflow for saving measurements to SR and loading SR into the viewer is shown below.

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/sr-import.png)

[insert video]

### Loading DICOM SR into an Already Tracked Series

If you have an already tracked series and try to load a DICOM SR measurements, you will be shown the following lock icon. This means that, you can review the DICOM SR measurement, manipulate image and draw "temporary" measurements; however, you cannot edit the DICOM SR measurement.

![](https://raw.githubusercontent.com/OHIF/Viewers/fix/tracking-qa/modes/longitudinal/assets/locked.png)

[indert video]

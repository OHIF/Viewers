# Measurement Tracking Mode



## Introduction
Measurement tracking mode allows you to:

- Draw annotations and have them shown in the measurement panel
- Create a report from the tracked measurement and export them as DICOM SR
- Use already exported DICOM SR to re-hydrate the measurements in the viewer

![preview](https://user-images.githubusercontent.com/7490180/171255703-e6d46da8-8d12-4685-b358-0c8d4d5cb5fe.png)

## Workflow


### Status Icon
Each viewport has a left icon indicating whether the series within the viewport contains:

- tracked measurement OR
- untracked measurement OR
- Structured Report OR
- Locked (uneditable) Structured Report

In the following, we will discuss each category.

![tracked](https://user-images.githubusercontent.com/7490180/171255750-c6903338-c295-4553-b8aa-8cb6a8d63943.png)

### Tracked vs Untracked Measurements

OHIF-v3 implements a workflow for measurement tracking that can be seen below.
In summary, when you create an annotation, a prompt will be shown whether to start tracking or not. If you start the tracking, the annotation style will change to a solid line, and annotation details get displayed on the measurement panel. On the other hand, if you decline the tracking prompt, the measurement will be considered "temporary," and annotation style remains as a dashed line and not shown on the right panel, and cannot be exported.

Below, you can see different icons that appear for a tracked vs. untracked series in OHIF-v3.


![workflow](https://user-images.githubusercontent.com/7490180/171255780-dd249cbf-dd61-4e02-8d46-b91e01d53529.png)


### Reading and Writing DICOM SR
OHIF-v3 provides full support for reading, writing and mapping the DICOM Structured Report (SR) to interactable Cornerstone Tools. When you load an already exported DICOM SR into the viewer, you will be prompted whether to track the measurements for the series or not.


![preview](https://user-images.githubusercontent.com/7490180/171255797-6c374780-8e94-4a7f-a125-69b67c18c18c.png)

If you click Yes, DICOM SR measurements gets re-hydrated into the viewer and the series become a tracked series. However, If you say no and later decide to say track the measurements, you can always click on the SR button that will prompt you with the same message again.


![restore](https://user-images.githubusercontent.com/7490180/171255813-8d460bd7-e64d-4bce-9467-ad5cf2615c56.png)

The full workflow for saving measurements to SR and loading SR into the viewer is shown below.

![sr-import](https://user-images.githubusercontent.com/7490180/171255826-c308ead6-9dad-4e91-9411-df62658cc839.png)


### Loading DICOM SR into an Already Tracked Series

If you have an already tracked series and try to load a DICOM SR measurements, you will be shown the following lock icon. This means that, you can review the DICOM SR measurement, manipulate image and draw "temporary" measurements; however, you cannot edit the DICOM SR measurement.

![locked](https://user-images.githubusercontent.com/7490180/171255842-91b84f91-4e1c-4a20-b4a2-cf9653560c43.png)

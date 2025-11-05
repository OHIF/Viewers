import { Button } from '@ohif/core/src/types';

// Section headers for organizing toolbar buttons
export const sectionHeaders: Button[] = [
    // sections
    {
        id: 'MeasurementTools',
        uiType: 'ohif.toolButtonList',
        props: {
            buttonSection: true,
        },
    },
    {
        id: 'MoreTools',
        uiType: 'ohif.toolButtonList',
        props: {
            buttonSection: true,
        },
    },
    {
        id: 'SegmentationUtilities',
        uiType: 'ohif.toolButtonList',
        props: {
            buttonSection: 'SegmentationUtilities',
        },
    },
    {
        id: 'SegmentationTools',
        uiType: 'ohif.toolButtonList',
        props: {
            buttonSection: 'SegmentationTools',
        },
    },
];

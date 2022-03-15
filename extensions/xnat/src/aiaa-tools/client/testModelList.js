const testModelList = [
  {
    "name": "clara_ann_spleen",
    "labels": [
      "spleen"
    ],
    "description": "A pre-trained model for volumetric (3D) annotation of the spleen from CT image",
    "version": "3",
    "type": "annotation",
    "padding": 20,
    "roi": [
      128,
      128,
      128
    ]
  },
  {
    "name": "clara_deepgrow",
    "labels": [],
    "description": "2D DeepGrow model based on Unet",
    "version": "3",
    "type": "deepgrow"
  },
  {
    "name": "clara_seg_liver_amp",
    "labels": [
      "liver",
      "liver tumor"
    ],
    "description": "A pre-trained model for volumetric (3D) segmentation of the liver and lesion in portal venous phase CT image",
    "version": "3",
    "type": "segmentation"
  },
  {
    "name": "clara_seg_liver_no_amp",
    "labels": [
      "liver",
      "liver tumor"
    ],
    "description": "A pre-trained model for volumetric (3D) segmentation of the liver and lesion in portal venous phase CT image",
    "version": "3",
    "type": "segmentation"
  },
  {
    "name": "clara_seg_spleen",
    "labels": [
      "spleen"
    ],
    "description": "A pre-trained model for volumetric (3D) segmentation of the spleen from CT image",
    "version": "3",
    "type": "segmentation"
  }
];

export default testModelList;

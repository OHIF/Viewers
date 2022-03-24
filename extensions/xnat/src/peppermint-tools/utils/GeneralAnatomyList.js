const json = `{
  "SegmentationCategoryTypeContextName": "Segmentation category and type - 3D Slicer General Anatomy list",
  "@schema": "https://raw.githubusercontent.com/qiicr/dcmqi/master/doc/schemas/segment-context-schema.json#",
  "SegmentationCodes": {
    "Category": [
      {
        "CodeMeaning": "Tissue",
        "CodingSchemeDesignator": "SRT",
        "SNOMEDCTConceptID": "85756007",
        "cid": "7051",
        "UMLSConceptUID": "C0040300",
        "CodeValue": "T-D0050",
        "contextGroupName": "Segmentation Property Categories",
        "Type": [
          {
            "recommendedDisplayRGBValue": [
              128,
              174,
              128
            ],
            "CodeMeaning": "Tissue",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "tissue",
            "cid": "7166",
            "UMLSConceptUID": "C0040300",
            "CodeValue": "T-D0050",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "85756007"
          },
          {
            "recommendedDisplayRGBValue": [
              216,
              101,
              79
            ],
            "CodeMeaning": "Artery",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "artery",
            "cid": "7166",
            "UMLSConceptUID": "C0555806",
            "CodeValue": "T-41066",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "275989006"
          },
          {
            "recommendedDisplayRGBValue": [
              230,
              220,
              70
            ],
            "CodeMeaning": "Body fat",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "fat",
            "cid": "7166",
            "UMLSConceptUID": "C0344335",
            "CodeValue": "F-03D38",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "248300009"
          },
          {
            "recommendedDisplayRGBValue": [
              241,
              214,
              145
            ],
            "CodeMeaning": "Bone",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "bone",
            "cid": "7166",
            "UMLSConceptUID": "C0262950",
            "CodeValue": "T-D016E",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "272673000"
          },
          {
            "recommendedDisplayRGBValue": [
              183,
              156,
              220
            ],
            "CodeMeaning": "Capillary",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "capillary",
            "cid": "7166",
            "UMLSConceptUID": "C0006901",
            "CodeValue": "T-40050",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "20982000"
          },
          {
            "recommendedDisplayRGBValue": [
              111,
              184,
              210
            ],
            "CodeMeaning": "Cartilage",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cartilage",
            "cid": "7166",
            "UMLSConceptUID": "C0007301",
            "CodeValue": "T-D021B",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "309312004"
          },
          {
            "recommendedDisplayRGBValue": [
              111,
              184,
              210
            ],
            "CodeMeaning": "Connective tissue",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "connective tissue",
            "cid": "7166",
            "UMLSConceptUID": "C0009780",
            "CodeValue": "T-1A200",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "21793004"
          },
          {
            "recommendedDisplayRGBValue": [
              183,
              214,
              211
            ],
            "CodeMeaning": "Ligament",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "ligament",
            "cid": "7166",
            "UMLSConceptUID": "C0023685",
            "CodeValue": "T-18010",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "52082005"
          },
          {
            "recommendedDisplayRGBValue": [
              68,
              172,
              100
            ],
            "CodeMeaning": "Lymph node",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "lymph node",
            "cid": "7166",
            "UMLSConceptUID": "C0024204",
            "CodeValue": "T-C4000",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "59441001"
          },
          {
            "recommendedDisplayRGBValue": [
              111,
              197,
              131
            ],
            "CodeMeaning": "Lymphatic vessel",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "lymphatic vessel",
            "cid": "7166",
            "UMLSConceptUID": "C0229889",
            "CodeValue": "T-C6010",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "83555006"
          },
          {
            "recommendedDisplayRGBValue": [
              178,
              212,
              242
            ],
            "CodeMeaning": "Meniscus",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "meniscus",
            "cid": "7166",
            "UMLSConceptUID": "C0224498",
            "CodeValue": "T-15009",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "74135004"
          },
          {
            "recommendedDisplayRGBValue": [
              192,
              104,
              88
            ],
            "CodeMeaning": "Muscle",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "muscle",
            "cid": "7166",
            "UMLSConceptUID": "C0026845",
            "CodeValue": "T-13001",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "71616004"
          },
          {
            "recommendedDisplayRGBValue": [
              244,
              214,
              49
            ],
            "CodeMeaning": "Nerve",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "nerve",
            "cid": "7166",
            "UMLSConceptUID": "C1268169",
            "CodeValue": "T-D0598",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "119410002"
          },
          {
            "recommendedDisplayRGBValue": [
              221,
              130,
              101
            ],
            "CodeMeaning": "Organ",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "organ",
            "cid": "7166",
            "UMLSConceptUID": "C1285092",
            "CodeValue": "T-1A310",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "2861001"
          },
          {
            "recommendedDisplayRGBValue": [
              177,
              122,
              101
            ],
            "CodeMeaning": "Skin",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "skin",
            "cid": "7166",
            "UMLSConceptUID": "C1123023",
            "CodeValue": "T-01000",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "39937001"
          },
          {
            "recommendedDisplayRGBValue": [
              152,
              189,
              207
            ],
            "CodeMeaning": "Tendon",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "tendon",
            "cid": "7166",
            "UMLSConceptUID": "C0039508",
            "CodeValue": "T-17010",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "13024002"
          },
          {
            "recommendedDisplayRGBValue": [
              0,
              151,
              206
            ],
            "CodeMeaning": "Vein",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "vein",
            "cid": "7166",
            "UMLSConceptUID": "C0447146",
            "CodeValue": "T-4806E",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "181378009"
          }
        ],
        "showAnatomy": true
      },
      {
        "CodeMeaning": "Anatomical Structure",
        "CodingSchemeDesignator": "SRT",
        "SNOMEDCTConceptID": "123037004",
        "cid": "7051",
        "UMLSConceptUID": "C1268086",
        "CodeValue": "T-D000A",
        "contextGroupName": "Segmentation Property Categories",
        "Type": [
          {
            "recommendedDisplayRGBValue": [
              177,
              122,
              101
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "abdomen",
            "CodeValue": "T-D4000",
            "UMLSConceptUID": "C0000726",
            "CodeMeaning": "Abdomen",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "113345001"
          },
          {
            "recommendedDisplayRGBValue": [
              186,
              124,
              161
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "abdominal cavity",
            "CodeValue": "T-D4010",
            "UMLSConceptUID": "C0230168",
            "CodeMeaning": "Abdominal cavity",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "52731004"
          },
          {
            "recommendedDisplayRGBValue": [
              171,
              85,
              68
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "muscles of abdominal wall",
            "CodeValue": "T-14001",
            "UMLSConceptUID": "C1279385",
            "CodeMeaning": "Abdominal wall muscle",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "195879000"
          },
          {
            "recommendedDisplayRGBValue": [
              60,
              143,
              83
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "adenohypophysis",
            "CodeValue": "T-B1100",
            "UMLSConceptUID": "C0032008",
            "CodeMeaning": "Adenohypophysis",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "62818001"
          },
          {
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "cid": "7154",
            "CodeMeaning": "Adrenal gland",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0001625",
            "CodeValue": "T-B3000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  249,
                  186,
                  150
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right adrenal gland",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  249,
                  186,
                  150
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left adrenal gland",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "23451007"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Amygdala",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0002708",
            "CodeValue": "T-A3230",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  98,
                  153,
                  112
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right amygdaloid complex",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  98,
                  153,
                  112
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left amygdaloid complex",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "4958002"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              224,
              199
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "anus",
            "CodeValue": "T-59900",
            "UMLSConceptUID": "C0003461",
            "CodeMeaning": "Anus",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "53505006"
          },
          {
            "recommendedDisplayRGBValue": [
              224,
              97,
              76
            ],
            "cid": "7152",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "aorta",
            "CodeValue": "T-42000",
            "UMLSConceptUID": "C0003483",
            "CodeMeaning": "Aorta",
            "contextGroupName": "Cardiac Structure Segmentation Types",
            "SNOMEDCTConceptID": "15825003"
          },
          {
            "recommendedDisplayRGBValue": [
              218,
              123,
              97
            ],
            "cid": "6113",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "aortic valve",
            "CodeValue": "T-35400",
            "UMLSConceptUID": "C0003501",
            "CodeMeaning": "Aortic Valve",
            "contextGroupName": "Mediastinum Anatomy Finding or Feature",
            "SNOMEDCTConceptID": "34202007"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              244,
              209
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "arachnoid",
            "CodeValue": "T-A1220",
            "UMLSConceptUID": "C0003707",
            "CodeMeaning": "Arachnoid",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "75042008"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Arcuate Fasciculus",
            "CodingSchemeDesignator": "FMA",
            "UMLSConceptUID": "C2329633",
            "CodeValue": "276650",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  125,
                  102,
                  154
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right arcuate fasciculus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  125,
                  102,
                  154
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left arcuate fasciculus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": ""
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              226,
              77
            ],
            "cid": "7167",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "autonomic nerve",
            "CodeValue": "T-A9605",
            "UMLSConceptUID": "C0206250",
            "CodeMeaning": "Autonomic nerve",
            "contextGroupName": "Peripheral Nervous System Segmentation Types",
            "SNOMEDCTConceptID": "53520000"
          },
          {
            "recommendedDisplayRGBValue": [
              0,
              145,
              30
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "biliary tree",
            "CodeValue": "T-60610",
            "UMLSConceptUID": "C0005400",
            "CodeMeaning": "Bile Duct",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "28273000"
          },
          {
            "recommendedDisplayRGBValue": [
              222,
              154,
              132
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "urinary bladder",
            "CodeValue": "T-74000",
            "UMLSConceptUID": "C0005682",
            "CodeMeaning": "Bladder",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "89837001"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              239,
              172
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "skeleton of thorax",
            "CodeValue": "T-D0170",
            "UMLSConceptUID": "C0448157",
            "CodeMeaning": "Bone of thorax",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "272710004"
          },
          {
            "recommendedDisplayRGBValue": [
              242,
              206,
              142
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "skeleton of neck",
            "CodeValue": "T-D006D",
            "UMLSConceptUID": "C0730130",
            "CodeMeaning": "Bone structure of head and/or neck",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "312779009"
          },
          {
            "recommendedDisplayRGBValue": [
              250,
              250,
              225
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "brain",
            "CodeValue": "T-A0100",
            "UMLSConceptUID": "C0006104",
            "CodeMeaning": "Brain",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "12738006"
          },
          {
            "recommendedDisplayRGBValue": [
              85,
              188,
              255
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "CSF space",
            "CodeValue": "T-A0109",
            "UMLSConceptUID": "C0459387",
            "CodeMeaning": "Brain cerebrospinal fluid pathway",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "280371009"
          },
          {
            "recommendedDisplayRGBValue": [
              88,
              106,
              215
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "ventricles of brain",
            "CodeValue": "T-A1600",
            "UMLSConceptUID": "C0007799",
            "CodeMeaning": "Brain ventricle",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "35764002"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Caudate nucleus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0007461",
            "CodeValue": "T-A3200",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  30,
                  111,
                  85
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right caudate nucleus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  30,
                  111,
                  85
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left caudate nucleus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "11000004"
          },
          {
            "recommendedDisplayRGBValue": [
              244,
              214,
              49
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "central nervous system",
            "CodeValue": "T-A0090",
            "UMLSConceptUID": "C0927232",
            "CodeMeaning": "Central nervous system",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "21483005"
          },
          {
            "recommendedDisplayRGBValue": [
              194,
              195,
              164
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cerebellar white matter",
            "CodeValue": "T-A6080",
            "UMLSConceptUID": "C0152381",
            "CodeMeaning": "Cerebellar white matter",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "33060004"
          },
          {
            "recommendedDisplayRGBValue": [
              88,
              106,
              215
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cerebral aqueduct",
            "CodeValue": "T-A1800",
            "UMLSConceptUID": "C0007769",
            "CodeMeaning": "Cerebral aqueduct",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "80447000"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Cerebral fornix",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0152334",
            "CodeValue": "T-A2970",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  64,
                  123,
                  147
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right fornix",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  64,
                  123,
                  147
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left fornix",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "87463005"
          },
          {
            "recommendedDisplayRGBValue": [
              128,
              174,
              128
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cerebral cortex",
            "CodeValue": "T-A2020",
            "UMLSConceptUID": "C0007776",
            "CodeMeaning": "Cerebral Grey Matter",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "40146001"
          },
          {
            "recommendedDisplayRGBValue": [
              250,
              250,
              225
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cerebral white matter",
            "CodeValue": "T-A2030",
            "UMLSConceptUID": "C0152295",
            "CodeMeaning": "Cerebral White Matter",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "68523003"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              255,
              207
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cervical vertebral column",
            "CodeValue": "T-11501",
            "UMLSConceptUID": "C0728985",
            "CodeMeaning": "Cervical spine",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "122494005"
          },
          {
            "recommendedDisplayRGBValue": [
              188,
              95,
              76
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "muscles of thoracic wall",
            "CodeValue": "T-14122",
            "UMLSConceptUID": "C1269825",
            "CodeMeaning": "Chest wall muscle",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "372074006"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Cingulum",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0228272",
            "CodeValue": "T-A2840",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  154,
                  146,
                  83
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right cingulum bundle",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  154,
                  146,
                  83
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left cingulum bundle",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "37035000"
          },
          {
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "cid": "7155",
            "CodeMeaning": "Clavicle",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0008913",
            "CodeValue": "T-12310",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  205,
                  179,
                  108
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right clavicle",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  205,
                  179,
                  108
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left clavicle",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "51299004"
          },
          {
            "recommendedDisplayRGBValue": [
              204,
              168,
              143
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "colon",
            "CodeValue": "T-59300",
            "UMLSConceptUID": "C0009368",
            "CodeMeaning": "Colon",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "71854001"
          },
          {
            "recommendedDisplayRGBValue": [
              97,
              113,
              158
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "corpus callosum",
            "CodeValue": "T-A2700",
            "UMLSConceptUID": "C0010090",
            "CodeMeaning": "Corpus callosum",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "88442005"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Corpus striatum",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0010097",
            "CodeValue": "T-A3100",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  140,
                  190
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right striatum",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  140,
                  190
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left striatum",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "31428008"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              234,
              92
            ],
            "cid": "7167",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cranial nerves",
            "CodeValue": "T-A8000",
            "UMLSConceptUID": "C0010268",
            "CodeMeaning": "Cranial nerve",
            "contextGroupName": "Peripheral Nervous System Segmentation Types",
            "SNOMEDCTConceptID": "25238003"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Diencephalon",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0012144",
            "CodeValue": "T-A0102",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  69,
                  110,
                  53
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "diencephalon",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              }
            ],
            "SNOMEDCTConceptID": "87563008"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              253,
              229
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "duodenum",
            "CodeValue": "T-58200",
            "UMLSConceptUID": "C0013303",
            "CodeMeaning": "Duodenum",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "38848004"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              244,
              209
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "dura mater",
            "CodeValue": "T-A1120",
            "UMLSConceptUID": "C0013313",
            "CodeMeaning": "Dura mater",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "18545000"
          },
          {
            "recommendedDisplayRGBValue": [
              211,
              171,
              143
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "esophagus",
            "CodeValue": "T-56000",
            "UMLSConceptUID": "C0014876",
            "CodeMeaning": "Esophagus",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "32849002"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "External ear",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0013453",
            "CodeValue": "T-AB100",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  174,
                  122,
                  90
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right external ear",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  174,
                  122,
                  90
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left external ear",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "28347008"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Eyeball",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0229242",
            "CodeValue": "T-AA770",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  194,
                  142,
                  0
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right eyeball",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  194,
                  142,
                  0
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left eyeball",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "79652003"
          },
          {
            "recommendedDisplayRGBValue": [
              185,
              135,
              134
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "female external genitalia",
            "CodeValue": "T-80010",
            "UMLSConceptUID": "C0227747",
            "CodeMeaning": "Female external genitalia",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "86969008"
          },
          {
            "recommendedDisplayRGBValue": [
              244,
              170,
              147
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "female internal genitalia",
            "CodeValue": "T-80020",
            "UMLSConceptUID": "C0227748",
            "CodeMeaning": "Female internal genitalia",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "87759004"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Foot",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0016504",
            "CodeValue": "T-D9700",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right foot",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left foot",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "56459004"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Forearm",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0016536",
            "CodeValue": "T-D8500",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right forearm",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left forearm",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "14975008"
          },
          {
            "recommendedDisplayRGBValue": [
              88,
              106,
              215
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "fourth ventricle",
            "CodeValue": "T-A1820",
            "UMLSConceptUID": "C0149556",
            "CodeMeaning": "Fourth ventricle",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "35918002"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Frontal bone",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0016732",
            "CodeValue": "T-11110",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  203,
                  179,
                  77
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right frontal bone",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  203,
                  179,
                  77
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left frontal bone",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "74872008"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Frontal lobe",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0016733",
            "CodeValue": "T-A2200",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  83,
                  146,
                  164
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right frontal lobe",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  83,
                  146,
                  164
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left frontal lobe",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "83251001"
          },
          {
            "recommendedDisplayRGBValue": [
              139,
              150,
              98
            ],
            "cid": "4040",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "gallbladder",
            "CodeValue": "T-63000",
            "UMLSConceptUID": "C0016976",
            "CodeMeaning": "Gallbladder",
            "contextGroupName": "Endoscopy Anatomic Regions",
            "SNOMEDCTConceptID": "28231008"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Globus pallidus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0017651",
            "CodeValue": "T-A3500",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  48,
                  129,
                  126
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right pallidum",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  48,
                  129,
                  126
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left pallidum",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "14738005"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Hand",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0018563",
            "CodeValue": "T-D8700",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right hand",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left hand",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "85562004"
          },
          {
            "recommendedDisplayRGBValue": [
              177,
              122,
              101
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "head",
            "CodeValue": "T-D1100",
            "UMLSConceptUID": "C0018670",
            "CodeMeaning": "Head",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "69536005"
          },
          {
            "recommendedDisplayRGBValue": [
              206,
              110,
              84
            ],
            "cid": "7152",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "heart",
            "CodeValue": "T-32000",
            "UMLSConceptUID": "C0018787",
            "CodeMeaning": "Heart",
            "contextGroupName": "Cardiac Structure Segmentation Types",
            "SNOMEDCTConceptID": "80891009"
          },
          {
            "recommendedDisplayRGBValue": [
              250,
              210,
              139
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "hyoid bone",
            "CodeValue": "T-11190",
            "UMLSConceptUID": "C0020417",
            "CodeMeaning": "Hyoid bone",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "21387005"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Inferior cerebellar peduncle",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0152393",
            "CodeValue": "T-A6640",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  186,
                  135,
                  135
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right inferior cerebellar peduncle",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  186,
                  135,
                  135
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left inferior cerebellar peduncle",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "67701001"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Inferior longitudinal fasciculus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0228273",
            "CodeValue": "T-A2850",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  159,
                  116,
                  163
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right inferior longitudinal fasciculus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  159,
                  116,
                  163
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left inferior longitudinal fasciculus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "55233005"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Inner ear",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0022889",
            "CodeValue": "T-AB700",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  229,
                  147,
                  118
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right inner ear",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  229,
                  147,
                  118
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left inner ear",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "22945000"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Insula",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0021640",
            "CodeValue": "T-A2610",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  188,
                  135,
                  166
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right insular lobe",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  188,
                  135,
                  166
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left insular lobe",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "36169008"
          },
          {
            "recommendedDisplayRGBValue": [
              233,
              138,
              112
            ],
            "cid": "6116",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "atrial septum",
            "CodeValue": "T-32150",
            "UMLSConceptUID": "C0225836",
            "CodeMeaning": "Interatrial septum",
            "contextGroupName": "Muscular Anatomy",
            "SNOMEDCTConceptID": "58095006"
          },
          {
            "recommendedDisplayRGBValue": [
              195,
              100,
              73
            ],
            "cid": "6116",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "ventricular septum",
            "CodeValue": "T-32410",
            "UMLSConceptUID": "C0225870",
            "CodeMeaning": "Interventricular septum",
            "contextGroupName": "Muscular Anatomy",
            "SNOMEDCTConceptID": "589001"
          },
          {
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "cid": "7154",
            "CodeMeaning": "Kidney",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0022646",
            "CodeValue": "T-71000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  185,
                  102,
                  83
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right kidney",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  185,
                  102,
                  83
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left kidney",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "64033007"
          },
          {
            "contextGroupName": "Endoscopy Anatomic Regions",
            "cid": "4040",
            "CodeMeaning": "Knee",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C1456798",
            "CodeValue": "T-D9200",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right knee",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left knee",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "72696002"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Lacrimal bone",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0222733",
            "CodeValue": "T-1115A",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  255,
                  250,
                  160
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right lacrimal bone",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              }
            ],
            "SNOMEDCTConceptID": "6229007"
          },
          {
            "recommendedDisplayRGBValue": [
              150,
              208,
              243
            ],
            "cid": "4040",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "larynx",
            "CodeValue": "T-24100",
            "UMLSConceptUID": "C0023078",
            "CodeMeaning": "Larynx",
            "contextGroupName": "Endoscopy Anatomic Regions",
            "SNOMEDCTConceptID": "4596009"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Lateral corticospinal tract",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0152402",
            "CodeValue": "T-A7093",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  201,
                  160,
                  133
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right corticospinal tract",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  201,
                  160,
                  133
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left corticospinal tract",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "461002"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Lateral ventricle",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0152279",
            "CodeValue": "T-A1650",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  88,
                  106,
                  215
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right lateral ventricle",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  88,
                  106,
                  215
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left lateral ventricle",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "66720007"
          },
          {
            "recommendedDisplayRGBValue": [
              152,
              55,
              13
            ],
            "cid": "7152",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "left ventricle of heart",
            "CodeValue": "T-32600",
            "UMLSConceptUID": "C0225897",
            "CodeMeaning": "Left Ventricle",
            "contextGroupName": "Cardiac Structure Segmentation Types",
            "SNOMEDCTConceptID": "87878005"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Limbic lobe",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0458337",
            "CodeValue": "T-A0036",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  154,
                  150,
                  201
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right limbic lobe",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  154,
                  150,
                  201
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left limbic lobe",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "279215006"
          },
          {
            "recommendedDisplayRGBValue": [
              188,
              91,
              95
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "lips",
            "CodeValue": "T-52000",
            "UMLSConceptUID": "C0023759",
            "CodeMeaning": "Lip",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "48477009"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Lower leg",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C1140621",
            "CodeValue": "T-D9400",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right leg",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left leg",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "30021000"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Lower limb",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0023216",
            "CodeValue": "T-D9000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right lower limb",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left lower limb",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "61685007"
          },
          {
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "cid": "7155",
            "CodeMeaning": "Lower lobe of lung",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0225758",
            "CodeValue": "T-28830",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  224,
                  186,
                  162
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "inferior lobe of right lung",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  224,
                  186,
                  162
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "inferior lobe of left lung",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "90572001"
          },
          {
            "recommendedDisplayRGBValue": [
              212,
              188,
              102
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "lumbar vertebral column",
            "CodeValue": "T-11503",
            "UMLSConceptUID": "C0024091",
            "CodeMeaning": "Lumbar spine",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "122496007"
          },
          {
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "cid": "7155",
            "CodeMeaning": "Lung",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0024109",
            "CodeValue": "T-28000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  197,
                  165,
                  145
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right lung",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  197,
                  165,
                  145
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left lung",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "39607008"
          },
          {
            "recommendedDisplayRGBValue": [
              185,
              135,
              134
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "male external genitalia",
            "CodeValue": "T-90010",
            "UMLSConceptUID": "C0227922",
            "CodeMeaning": "Male external genitalia",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "90418005"
          },
          {
            "recommendedDisplayRGBValue": [
              216,
              146,
              127
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "male internal genitalia",
            "CodeValue": "T-90020",
            "UMLSConceptUID": "C0227923",
            "CodeMeaning": "Male internal genitalia",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "38242008"
          },
          {
            "recommendedDisplayRGBValue": [
              222,
              198,
              101
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "mandible",
            "CodeValue": "T-11180",
            "UMLSConceptUID": "C0024687",
            "CodeMeaning": "Mandible",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "91609006"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Medial Lemniscus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0228420",
            "CodeValue": "T-A5271",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  174,
                  140,
                  103
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right medial lemniscus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  174,
                  140,
                  103
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left medial lemniscus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "30114003"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              244,
              209
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "mediastinum",
            "CodeValue": "T-D3300",
            "UMLSConceptUID": "C0025066",
            "CodeMeaning": "Mediastinum",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "72410000"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              244,
              209
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "meninges",
            "CodeValue": "T-A1110",
            "UMLSConceptUID": "C0025285",
            "CodeMeaning": "Meninges",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "1231004"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Middle cerebellar peduncle",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0152392",
            "CodeValue": "T-A6630",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  148,
                  120,
                  72
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right middle cerebellar peduncle",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  148,
                  120,
                  72
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left middle cerebellar peduncle",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "33723005"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Middle ear",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0013455",
            "CodeValue": "T-AB300",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  201,
                  112,
                  73
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right middle ear",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  201,
                  112,
                  73
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left middle ear",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "25342003"
          },
          {
            "recommendedDisplayRGBValue": [
              202,
              164,
              140
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "middle lobe of right lung",
            "CodeValue": "T-28300",
            "UMLSConceptUID": "C0225757",
            "CodeMeaning": "Middle lobe of right lung",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "72481006"
          },
          {
            "recommendedDisplayRGBValue": [
              159,
              63,
              27
            ],
            "cid": "6113",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "mitral valve",
            "CodeValue": "T-35300",
            "UMLSConceptUID": "C0026264",
            "CodeMeaning": "Mitral Valve",
            "contextGroupName": "Mediastinum Anatomy Finding or Feature",
            "SNOMEDCTConceptID": "91134007"
          },
          {
            "recommendedDisplayRGBValue": [
              201,
              121,
              77
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "muscles of head",
            "CodeValue": "T-13100",
            "UMLSConceptUID": "C0224097",
            "CodeMeaning": "Muscle of head",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "22688005"
          },
          {
            "recommendedDisplayRGBValue": [
              213,
              124,
              109
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "muscles of neck",
            "CodeValue": "T-13300",
            "UMLSConceptUID": "C0027532",
            "CodeMeaning": "Muscle of neck",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "81727001"
          },
          {
            "recommendedDisplayRGBValue": [
              177,
              122,
              101
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "neck",
            "CodeValue": "T-D1600",
            "UMLSConceptUID": "C0027530",
            "CodeMeaning": "Neck",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "45048000"
          },
          {
            "recommendedDisplayRGBValue": [
              92,
              162,
              109
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "neurohypophysis",
            "CodeValue": "T-B1200",
            "UMLSConceptUID": "C0032009",
            "CodeMeaning": "Neurohypophysis",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "37512009"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Occipital lobe",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0028785",
            "CodeValue": "T-A2400",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  182,
                  166,
                  110
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right occipital lobe",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  182,
                  166,
                  110
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left occipital lobe",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "31065004"
          },
          {
            "recommendedDisplayRGBValue": [
              234,
              234,
              194
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "omentum",
            "CodeValue": "T-D4600",
            "UMLSConceptUID": "C0028977",
            "CodeMeaning": "Omentum",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "27398004"
          },
          {
            "recommendedDisplayRGBValue": [
              99,
              106,
              24
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "optic chiasm",
            "CodeValue": "T-A800B",
            "UMLSConceptUID": "C0029126",
            "CodeMeaning": "Optic chiasm",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "244453006"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Optic radiation",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0228277",
            "CodeValue": "T-A2880",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  78,
                  152,
                  141
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right optic radiation",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  78,
                  152,
                  141
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left optic radiation",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "70105001"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Optic tract",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0152405",
            "CodeValue": "T-A8060",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  156,
                  171,
                  108
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right optic tract",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  156,
                  171,
                  108
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left optic tract",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "53238003"
          },
          {
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "cid": "7160",
            "CodeMeaning": "Ovary",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0029939",
            "CodeValue": "T-87000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  213,
                  141,
                  113
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right ovary",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  213,
                  141,
                  113
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left ovary",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "15497006"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Palatine bone",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0222734",
            "CodeValue": "T-11160",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  242,
                  217,
                  123
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right palatine bone",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  242,
                  217,
                  123
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left palatine bone",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "51283005"
          },
          {
            "recommendedDisplayRGBValue": [
              249,
              180,
              111
            ],
            "cid": "4030",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pancreas",
            "CodeValue": "T-65000",
            "UMLSConceptUID": "C0030274",
            "CodeMeaning": "Pancreas",
            "contextGroupName": "CT, MR and PET Anatomy Imaged",
            "SNOMEDCTConceptID": "15776009"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Parietal bone",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0030558",
            "CodeValue": "T-11120",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  229,
                  204,
                  109
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right parietal bone",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  229,
                  204,
                  109
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left parietal bone",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "24924006"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Parietal lobe",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0030560",
            "CodeValue": "T-A2300",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  141,
                  93,
                  137
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right parietal lobe",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  141,
                  93,
                  137
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left parietal lobe",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "16630005"
          },
          {
            "recommendedDisplayRGBValue": [
              184,
              122,
              154
            ],
            "cid": "7152",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pericardial cavity",
            "CodeValue": "T-39050",
            "UMLSConceptUID": "C0225972",
            "CodeMeaning": "Pericardial cavity",
            "contextGroupName": "Cardiac Structure Segmentation Types",
            "SNOMEDCTConceptID": "25489000"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              244,
              209
            ],
            "cid": "7152",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pericardium",
            "CodeValue": "T-39000",
            "UMLSConceptUID": "C0031050",
            "CodeMeaning": "Pericardium",
            "contextGroupName": "Cardiac Structure Segmentation Types",
            "SNOMEDCTConceptID": "76848001"
          },
          {
            "recommendedDisplayRGBValue": [
              224,
              194,
              0
            ],
            "cid": "7167",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "peripheral nerve",
            "CodeValue": "T-A0500",
            "UMLSConceptUID": "C0031119",
            "CodeMeaning": "Peripheral nerve",
            "contextGroupName": "Peripheral Nervous System Segmentation Types",
            "SNOMEDCTConceptID": "84782009"
          },
          {
            "recommendedDisplayRGBValue": [
              216,
              186,
              0
            ],
            "cid": "7167",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "peripheral nervous system",
            "CodeValue": "T-A0140",
            "UMLSConceptUID": "C0206417",
            "CodeMeaning": "Peripheral nervous system",
            "contextGroupName": "Peripheral Nervous System Segmentation Types",
            "SNOMEDCTConceptID": "3058005"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              255,
              220
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "peritoneum",
            "CodeValue": "T-D4400",
            "UMLSConceptUID": "C0031153",
            "CodeMeaning": "Peritioneum",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "15425007"
          },
          {
            "recommendedDisplayRGBValue": [
              204,
              142,
              178
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "peritoneal cavity",
            "CodeValue": "T-D4425",
            "UMLSConceptUID": "C1704247",
            "CodeMeaning": "Peritoneal cavity",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "83670000"
          },
          {
            "recommendedDisplayRGBValue": [
              184,
              105,
              108
            ],
            "cid": "4040",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pharynx",
            "CodeValue": "T-55000",
            "UMLSConceptUID": "C0031354",
            "CodeMeaning": "Pharynx",
            "contextGroupName": "Endoscopy Anatomic Regions",
            "SNOMEDCTConceptID": "54066008"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              244,
              209
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pia mater",
            "CodeValue": "T-A1280",
            "UMLSConceptUID": "C0031869",
            "CodeMeaning": "Pia mater",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "23180006"
          },
          {
            "recommendedDisplayRGBValue": [
              253,
              135,
              192
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pineal gland",
            "CodeValue": "T-B2000",
            "UMLSConceptUID": "C0031939",
            "CodeMeaning": "Pineal Gland",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "45793000"
          },
          {
            "recommendedDisplayRGBValue": [
              57,
              157,
              110
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pituitary gland",
            "CodeValue": "T-B1000",
            "UMLSConceptUID": "C0032005",
            "CodeMeaning": "Pituitary",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "56329008"
          },
          {
            "recommendedDisplayRGBValue": [
              126,
              161,
              197
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "posterior commissure",
            "CodeValue": "T-A4904",
            "UMLSConceptUID": "C0152327",
            "CodeMeaning": "Posterior cerebral commissure",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "279336005"
          },
          {
            "recommendedDisplayRGBValue": [
              230,
              158,
              140
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "prostate",
            "CodeValue": "T-92000",
            "UMLSConceptUID": "C0033572",
            "CodeMeaning": "Prostate",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "41216001"
          },
          {
            "recommendedDisplayRGBValue": [
              225,
              130,
              104
            ],
            "cid": "6113",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "pulmonary valve",
            "CodeValue": "T-35200",
            "UMLSConceptUID": "C0034086",
            "CodeMeaning": "Pulmonary valve",
            "contextGroupName": "Mediastinum Anatomy Finding or Feature",
            "SNOMEDCTConceptID": "39057004"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Putamen",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0034169",
            "CodeValue": "T-A3400",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  210,
                  157,
                  166
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right putamen",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  210,
                  157,
                  166
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left putamen",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "89278009"
          },
          {
            "recommendedDisplayRGBValue": [
              180,
              119,
              153
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "retroperitoneal space",
            "CodeValue": "T-D4900",
            "UMLSConceptUID": "C0035359",
            "CodeMeaning": "Retroperitoneal space",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "82849001"
          },
          {
            "recommendedDisplayRGBValue": [
              181,
              85,
              57
            ],
            "cid": "7152",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "right ventricle of heart",
            "CodeValue": "T-32500",
            "UMLSConceptUID": "C0225883",
            "CodeMeaning": "Right Ventricle",
            "contextGroupName": "Cardiac Structure Segmentation Types",
            "SNOMEDCTConceptID": "53085002"
          },
          {
            "recommendedDisplayRGBValue": [
              70,
              163,
              117
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "salivary glands",
            "CodeValue": "T-61007",
            "UMLSConceptUID": "C0036098",
            "CodeMeaning": "Salivary gland",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "385294005"
          },
          {
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "cid": "7160",
            "CodeMeaning": "Seminal Vesicle",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0036628",
            "CodeValue": "T-93000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  245,
                  172,
                  147
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right seminal vesicle",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  245,
                  172,
                  147
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left seminal vesicle",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "64739004"
          },
          {
            "contextGroupName": "Endoscopy Anatomic Regions",
            "cid": "4040",
            "CodeMeaning": "Shoulder",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0037004",
            "CodeValue": "T-D2220",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right shoulder",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left shoulder",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "16982005"
          },
          {
            "recommendedDisplayRGBValue": [
              177,
              124,
              92
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "skin of abdominal wall",
            "CodeValue": "T-02480",
            "UMLSConceptUID": "C0222166",
            "CodeMeaning": "Skin of abdomen",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "75093004"
          },
          {
            "recommendedDisplayRGBValue": [
              173,
              121,
              88
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "skin of thoracic wall",
            "CodeValue": "T-02424",
            "UMLSConceptUID": "C0222149",
            "CodeMeaning": "Skin of chest",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "74160004"
          },
          {
            "recommendedDisplayRGBValue": [
              241,
              213,
              144
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "skull",
            "CodeValue": "T-11100",
            "UMLSConceptUID": "C0037303",
            "CodeMeaning": "Skull",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "89546000"
          },
          {
            "recommendedDisplayRGBValue": [
              205,
              167,
              142
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "small bowel",
            "CodeValue": "T-58000",
            "UMLSConceptUID": "C0021852",
            "CodeMeaning": "Small Intestine",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "30315005"
          },
          {
            "recommendedDisplayRGBValue": [
              182,
              105,
              107
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "soft palate",
            "CodeValue": "T-51120",
            "UMLSConceptUID": "C0030219",
            "CodeMeaning": "Soft palate",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "49460000"
          },
          {
            "recommendedDisplayRGBValue": [
              244,
              214,
              49
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "spinal cord",
            "CodeValue": "T-A7010",
            "UMLSConceptUID": "C0037925",
            "CodeMeaning": "Spinal cord",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "2748008"
          },
          {
            "recommendedDisplayRGBValue": [
              200,
              200,
              215
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "gray matter of spinal cord",
            "CodeValue": "T-A7020",
            "UMLSConceptUID": "C0475853",
            "CodeMeaning": "Spinal cord gray matter",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "12958003"
          },
          {
            "recommendedDisplayRGBValue": [
              250,
              250,
              225
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "white matter of spinal cord",
            "CodeValue": "T-A7070",
            "UMLSConceptUID": "C0458457",
            "CodeMeaning": "Spinal cord white matter",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "27088001"
          },
          {
            "recommendedDisplayRGBValue": [
              244,
              217,
              154
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "sternum",
            "CodeValue": "T-11210",
            "UMLSConceptUID": "C0038293",
            "CodeMeaning": "Sternum",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "56873002"
          },
          {
            "recommendedDisplayRGBValue": [
              216,
              132,
              105
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "stomach",
            "CodeValue": "T-57000",
            "UMLSConceptUID": "C0038351",
            "CodeMeaning": "Stomach",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "69695003"
          },
          {
            "recommendedDisplayRGBValue": [
              88,
              106,
              215
            ],
            "cid": "7153",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "subarachnoid space",
            "CodeValue": "T-A1500",
            "UMLSConceptUID": "C0038527",
            "CodeMeaning": "Subarachnoid space",
            "contextGroupName": "CNS Tissue Segmentation Types",
            "SNOMEDCTConceptID": "35951006"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Substantia nigra",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0038590",
            "CodeValue": "T-A5160",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  0,
                  108,
                  112
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right substantia nigra",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  0,
                  108,
                  112
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left substantia nigra",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "70007007"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Superior longitudinal fasciculus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0228270",
            "CodeValue": "T-A2820",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  127,
                  150,
                  88
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right superior longitudinal fasciculus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  127,
                  150,
                  88
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left superior longitudinal fasciculus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "89202009"
          },
          {
            "contextGroupName": "Craniofacial Anatomic Regions",
            "cid": "4028",
            "CodeMeaning": "Temporal bone",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0039484",
            "CodeValue": "T-11130",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  255,
                  243,
                  152
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right temporal bone",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  255,
                  243,
                  152
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left temporal bone",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "60911003"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Temporal lobe",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0039485",
            "CodeValue": "T-A2500",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  162,
                  115,
                  105
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right temporal lobe",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  162,
                  115,
                  105
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left temporal lobe",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "78277001"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Thalamus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0458271",
            "CodeValue": "T-D0593",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  122,
                  101,
                  38
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right thalamus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  122,
                  101,
                  38
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left thalamus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "119406000"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Thigh",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0039866",
            "CodeValue": "T-D9100",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right thigh",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left thigh",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "68367000"
          },
          {
            "recommendedDisplayRGBValue": [
              226,
              202,
              134
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "thoracic vertebral column",
            "CodeValue": "T-11502",
            "UMLSConceptUID": "C0581269",
            "CodeMeaning": "Thoracic spine",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "122495006"
          },
          {
            "recommendedDisplayRGBValue": [
              177,
              122,
              101
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "thorax",
            "CodeValue": "T-D3000",
            "UMLSConceptUID": "C0817096",
            "CodeMeaning": "Thorax",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "51185008"
          },
          {
            "recommendedDisplayRGBValue": [
              47,
              150,
              103
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "thymus",
            "CodeValue": "T-C8000",
            "UMLSConceptUID": "C0040113",
            "CodeMeaning": "Thymus",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "9875009"
          },
          {
            "recommendedDisplayRGBValue": [
              62,
              162,
              114
            ],
            "cid": "6113",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "thyroid gland",
            "CodeValue": "T-B6000",
            "UMLSConceptUID": "C0040132",
            "CodeMeaning": "Thyroid",
            "contextGroupName": "Mediastinum Anatomy Finding or Feature",
            "SNOMEDCTConceptID": "69748006"
          },
          {
            "recommendedDisplayRGBValue": [
              166,
              84,
              94
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "tongue",
            "CodeValue": "T-53000",
            "UMLSConceptUID": "C0040408",
            "CodeMeaning": "Tongue",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "21974007"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              250,
              220
            ],
            "cid": "4028",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "teeth",
            "CodeValue": "T-54010",
            "UMLSConceptUID": "C0040426",
            "CodeMeaning": "Tooth",
            "contextGroupName": "Craniofacial Anatomic Regions",
            "SNOMEDCTConceptID": "38199008"
          },
          {
            "recommendedDisplayRGBValue": [
              182,
              228,
              255
            ],
            "cid": "7155",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "trachea",
            "CodeValue": "T-25000",
            "UMLSConceptUID": "C0040578",
            "CodeMeaning": "Trachea",
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "SNOMEDCTConceptID": "44567001"
          },
          {
            "recommendedDisplayRGBValue": [
              166,
              70,
              38
            ],
            "cid": "6113",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "tricuspid valve",
            "CodeValue": "T-35100",
            "UMLSConceptUID": "C0040960",
            "CodeMeaning": "Tricuspid Valve",
            "contextGroupName": "Mediastinum Anatomy Finding or Feature",
            "SNOMEDCTConceptID": "46030003"
          },
          {
            "contextGroupName": "CNS Tissue Segmentation Types",
            "cid": "7153",
            "CodeMeaning": "Uncinate fasciculus",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0228271",
            "CodeValue": "T-A2830",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  106,
                  174,
                  155
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right uncinate fasciculus",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  106,
                  174,
                  155
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left uncinate fasciculus",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "26230003"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Upper arm",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0446516",
            "CodeValue": "T-D8200",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right arm",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left arm",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "40983000"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Upper limb",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0016555",
            "CodeValue": "T-D8000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right upper limb",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  177,
                  122,
                  101
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left upper limb",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "53120007"
          },
          {
            "contextGroupName": "Thoracic Tissue Segmentation Types",
            "cid": "7155",
            "CodeMeaning": "Upper lobe of lung",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0225756",
            "CodeValue": "T-28820",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  172,
                  138,
                  115
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "superior lobe of right lung",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  172,
                  138,
                  115
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "superior lobe of left lung",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "45653009"
          },
          {
            "recommendedDisplayRGBValue": [
              124,
              186,
              223
            ],
            "cid": "4031",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "urethra",
            "CodeValue": "T-75000",
            "UMLSConceptUID": "C0041967",
            "CodeMeaning": "Urethra",
            "contextGroupName": "Common Anatomic Regions",
            "SNOMEDCTConceptID": "13648007"
          },
          {
            "recommendedDisplayRGBValue": [
              203,
              136,
              116
            ],
            "cid": "7154",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "urinary system",
            "CodeValue": "T-70001",
            "UMLSConceptUID": "C1508753",
            "CodeMeaning": "Urinary system",
            "contextGroupName": "Abdominal Organ Segmentation Types",
            "SNOMEDCTConceptID": "122489005"
          },
          {
            "recommendedDisplayRGBValue": [
              255,
              181,
              158
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "uterus",
            "CodeValue": "T-83000",
            "UMLSConceptUID": "C0042149",
            "CodeMeaning": "Uterus",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "35039007"
          },
          {
            "recommendedDisplayRGBValue": [
              193,
              123,
              103
            ],
            "cid": "7160",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "vagina",
            "CodeValue": "T-82000",
            "UMLSConceptUID": "C0042232",
            "CodeMeaning": "Vagina",
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "SNOMEDCTConceptID": "76784001"
          },
          {
            "contextGroupName": "Pelvic Organ Segmentation Types",
            "cid": "7160",
            "CodeMeaning": "Vas deferens",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0042360",
            "CodeValue": "T-96000",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  241,
                  172,
                  151
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right deferent duct",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              },
              {
                "recommendedDisplayRGBValue": [
                  241,
                  172,
                  151
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "left deferent duct",
                "CodeValue": "G-A101",
                "UMLSConceptUID": "C0205091",
                "CodeMeaning": "Left",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "7771000"
              }
            ],
            "SNOMEDCTConceptID": "57671007"
          },
          {
            "contextGroupName": "Common Anatomic Regions",
            "cid": "4031",
            "CodeMeaning": "Zygoma",
            "CodingSchemeDesignator": "SRT",
            "UMLSConceptUID": "C0043539",
            "CodeValue": "T-11166",
            "Modifier": [
              {
                "recommendedDisplayRGBValue": [
                  255,
                  255,
                  167
                ],
                "cid": "244",
                "CodingSchemeDesignator": "SRT",
                "3dSlicerLabel": "right zygomatic bone",
                "CodeValue": "G-A100",
                "UMLSConceptUID": "C0205090",
                "CodeMeaning": "Right",
                "contextGroupName": "Laterality",
                "SNOMEDCTConceptID": "24028007"
              }
            ],
            "SNOMEDCTConceptID": "13881006"
          }
        ],
        "showAnatomy": false
      },
      {
        "CodeMeaning": "Morphologically Altered Structure",
        "CodingSchemeDesignator": "SRT",
        "SNOMEDCTConceptID": "49755003",
        "cid": "7051",
        "UMLSConceptUID": "C0221198",
        "CodeValue": "M-01000",
        "contextGroupName": "Segmentation Property Categories",
        "Type": [
          {
            "recommendedDisplayRGBValue": [
              145,
              60,
              66
            ],
            "CodeMeaning": "Blood clot",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "clot",
            "cid": "7159",
            "UMLSConceptUID": "C0302148",
            "CodeValue": "M-35000",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "75753009"
          },
          {
            "recommendedDisplayRGBValue": [
              205,
              205,
              100
            ],
            "CodeMeaning": "Cyst",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "cyst",
            "cid": "7159",
            "UMLSConceptUID": "C0010709",
            "CodeValue": "M-3340A",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "367643001"
          },
          {
            "recommendedDisplayRGBValue": [
              140,
              224,
              228
            ],
            "CodeMeaning": "Edema",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "edema",
            "cid": "7159",
            "UMLSConceptUID": "C0013604",
            "CodeValue": "M-36300",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "79654002"
          },
          {
            "recommendedDisplayRGBValue": [
              150,
              98,
              83
            ],
            "CodeMeaning": "Embolus",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "embolism",
            "cid": "7159",
            "UMLSConceptUID": "C1704212",
            "CodeValue": "M-35300",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "55584005"
          },
          {
            "recommendedDisplayRGBValue": [
              188,
              65,
              28
            ],
            "CodeMeaning": "Hemorrhage",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "bleeding",
            "cid": "7159",
            "UMLSConceptUID": "C0019080",
            "CodeValue": "M-37000",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "50960005"
          },
          {
            "recommendedDisplayRGBValue": [
              144,
              238,
              144
            ],
            "CodeMeaning": "Mass",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "mass",
            "cid": "7159",
            "UMLSConceptUID": "C0577559",
            "CodeValue": "M-03000",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "4147007"
          },
          {
            "recommendedDisplayRGBValue": [
              216,
              191,
              216
            ],
            "CodeMeaning": "Necrosis",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "necrosis",
            "cid": "7159",
            "UMLSConceptUID": "C0027540",
            "CodeValue": "M-54000",
            "contextGroupName": "Lesion Segmentation Types",
            "SNOMEDCTConceptID": "6574001"
          }
        ],
        "showAnatomy": true
      },
      {
        "CodeMeaning": "Body Substance",
        "CodingSchemeDesignator": "SRT",
        "SNOMEDCTConceptID": "91720002",
        "cid": "",
        "UMLSConceptUID": "C0504082",
        "CodeValue": "T-D0080",
        "contextGroupName": "",
        "Type": [
          {
            "recommendedDisplayRGBValue": [
              0,
              145,
              30
            ],
            "CodeMeaning": "Bile",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "bile",
            "cid": "7166",
            "UMLSConceptUID": "C0005388",
            "CodeValue": "T-60650",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "70150004"
          },
          {
            "recommendedDisplayRGBValue": [
              170,
              250,
              250
            ],
            "CodeMeaning": "Body fluid",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "fluid",
            "cid": "7166",
            "UMLSConceptUID": "C0005889",
            "CodeValue": "T-D0070",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "32457005"
          },
          {
            "recommendedDisplayRGBValue": [
              78,
              63,
              0
            ],
            "CodeMeaning": "Feces",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "feces",
            "cid": "7166",
            "UMLSConceptUID": "C0015733",
            "CodeValue": "T-59666",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "39477002"
          },
          {
            "recommendedDisplayRGBValue": [
              218,
              255,
              255
            ],
            "CodeMeaning": "Gas",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "gas",
            "cid": "7166",
            "UMLSConceptUID": "C0017110",
            "CodeValue": "C-10080",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "74947009"
          },
          {
            "recommendedDisplayRGBValue": [
              214,
              230,
              130
            ],
            "CodeMeaning": "Urine",
            "CodingSchemeDesignator": "SRT",
            "3dSlicerLabel": "urine",
            "cid": "7166",
            "UMLSConceptUID": "C0042036",
            "CodeValue": "T-70060",
            "contextGroupName": "Common Tissue Segmentation Types",
            "SNOMEDCTConceptID": "78014005"
          }
        ],
        "showAnatomy": false
      }
    ]
  }
}`;

const parsedJson = JSON.parse(json);

export default parsedJson;

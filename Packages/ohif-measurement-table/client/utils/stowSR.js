// This can be pasted into the wip-add-dcmjs branch of git@github.com:ohif/Viewers
// to store current length measurements back to the source DICOMweb server.

function parametersFromImageId(imageId) {
    const decodedImageId = decodeURIComponent(imageId);
    return(new URLSearchParams(decodedImageId));
  }
  
  function parametersFromToolState() {
    const imageToolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();
  
    const imageId0 = Object.keys(imageToolState)[0];
    return parametersFromImageId(imageId0);
  }
  
  function srFromToolState() {
  
    const parameters = parametersFromToolState();
  
    // TODO: figure out what is needed to make a dcmjs dataset from
    // information available in the viewer.  Apparently the raw dicom is not available
    // directly.
    const derivationSourceDataset = {
      StudyInstanceUID: parameters.get('studyUID'),
      SeriesInstanceUID: parameters.get('seriesUID'),
      SOPInstanceUID: parameters.get('objectUID'),
      SOPClassUID: dcmjs.data.DicomMetaDictionary.sopClassUIDsByName["CTImage"], // TODO: so everything is a CT for now...
    };
    report = new dcmjs.derivations.StructuredReport([derivationSourceDataset]);
    dataset = report.dataset;
  
    // TODO: what is the correct metaheader
    // http://dicom.nema.org/medical/Dicom/current/output/chtml/part10/chapter_7.html
    // TODO: move meta creation to dcmjs
    const fileMetaInformationVersionArray = new Uint16Array(1);
    fileMetaInformationVersionArray[0] = 1;
    report.dataset._meta = {
      FileMetaInformationVersion: fileMetaInformationVersionArray.buffer,
      MediaStorageSOPClassUID: dataset.SOPClassUID,
      MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
      TransferSyntaxUID: "1.2.840.10008.1.2.1", // Explicit little endian (always for dcmjs?)
      ImplementationClassUID: dcmjs.data.DicomMetaDictionary.uid(), // TODO: could be git hash or other valid id
      ImplementationVersionName: "OHIFViewer",
    };
  
    // TODO: factor out a lot of this back into dcmjs for use in both
    // the example and in the Viewer
    var measurementGroupContentSequence = [];
  
    // TODO: make a TID1550 derivation as an SR subclass
    dataset.ConceptNameCodeSequence = {
      CodeValue: '126000',
      CodingSchemeDesignator: 'DCM',
      CodeMeaning: 'Imaging Measurement Report',
    };
    dataset.ContinuityOfContent = 'SEPARATE';
    dataset.PerformedProcedureCodeSequence = [];
    dataset.CompletionFlag = 'COMPLETE';
    dataset.VerificationFlag = 'UNVERIFIED';
    dataset.ReferencedPerformedProcedureStepSequence = [];
    dataset.InstanceNumber = 1;
    dataset.CurrentRequestedProcedureEvidenceSequence = {
      StudyInstanceUID: dataset.StudyInstanceUID,
      ReferencedSeriesSequence: {
        SeriesInstanceUID: dataset.SeriesInstanceUID,
        ReferencedSOPSequence: {
          ReferencedSOPClassUID: derivationSourceDataset.SOPClassUID,
          ReferencedSOPInstanceUID: derivationSourceDataset.SOPInstanceUID,
        },
      },
    };
    dataset.CodingSchemeIdentificationSequence = {
      CodingSchemeDesignator: "99dcmjs",
      CodingSchemeName: "Codes used for dcmjs",
      CodingSchemeVersion: "0",
      CodingSchemeResponsibleOrganization: "https://github.com/pieper/dcmjs",
    };
  
    dataset.ContentTemplateSequence = {
      MappingResource: 'DCMR',
      TemplateIdentifier: '1500',
    };
  
    dataset.ContentSequence = [
      {
        RelationshipType: 'HAS CONCEPT MOD',
        ValueType: 'CODE',
        ConceptNameCodeSequence: {
          CodeValue: '121049',
          CodingSchemeDesignator: 'DCM',
          CodeMeaning: 'Language of Content Item and Descendants',
        },
        ConceptCodeSequence: {
          CodeValue: 'eng',
          CodingSchemeDesignator: 'RFC3066',
          CodeMeaning: 'English',
        },
        ContentSequence: {
          RelationshipType: 'HAS CONCEPT MOD',
          ValueType: 'CODE',
          ConceptNameCodeSequence: {
            CodeValue: '121046',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Country of Language',
          },
          ConceptCodeSequence: {
            CodeValue: 'US',
            CodingSchemeDesignator: 'ISO3166_1',
            CodeMeaning: 'United States',
          },
        },
      },
      {
        RelationshipType: 'HAS OBS CONTEXT',
        ValueType: 'PNAME',
        ConceptNameCodeSequence: {
          CodeValue: '121008',
          CodingSchemeDesignator: 'DCM',
          CodeMeaning: 'Person Observer Name',
        },
        PersonName: 'user^web', // TODO: these can be options argument for constructor
      },
      {
        RelationshipType: 'HAS OBS CONTEXT',
        ValueType: 'TEXT',
        ConceptNameCodeSequence: {
          CodeValue: 'RP-100006',
          CodingSchemeDesignator: '99dcmjs',
          CodeMeaning: "Person Observer's Login Name",
        },
        TextValue: 'user',
      },
      {
        RelationshipType: 'HAS CONCEPT MOD',
        ValueType: 'CODE',
        ConceptNameCodeSequence: {
          CodeValue: '121058',
          CodingSchemeDesignator: 'DCM',
          CodeMeaning: 'Procedure reported',
        },
        ConceptCodeSequence: {
          CodeValue: '1',
          CodingSchemeDesignator: '99dcmjs',
          CodeMeaning: 'Unknown procedure',
        },
      },
      {
        RelationshipType: 'CONTAINS',
        ValueType: 'CONTAINER',
        ConceptNameCodeSequence: {
          CodeValue: '111028',
          CodingSchemeDesignator: 'DCM',
          CodeMeaning: 'Image Library',
        },
        ContinuityOfContent: 'SEPARATE',
        ContentSequence: {
          RelationshipType: 'CONTAINS',
          ValueType: 'CONTAINER',
          ConceptNameCodeSequence: {
            CodeValue: '126200',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Image Library Group',
          },
          ContinuityOfContent: 'SEPARATE',
          ContentSequence: {
            RelationshipType: 'CONTAINS',
            ValueType: 'IMAGE',
            ReferencedSOPSequence: {
              // TODO: this should refer to the UIDs extracted from the toolState / instance info
              ReferencedSOPClassUID: dataset.SOPClassUID,
              ReferencedSOPInstanceUID: dataset.SOPInstanceUID,
            },
          },
        },
      },
      {
        RelationshipType: 'CONTAINS',
        ValueType: 'CONTAINER',
        ConceptNameCodeSequence: {
          CodeValue: '126010',
          CodingSchemeDesignator: 'DCM',
          CodeMeaning: 'Imaging Measurements',  // TODO: would be nice to abstract the code sequences (in a dictionary? a service?)
        },
        ContinuityOfContent: 'SEPARATE',
        ContentSequence: {
          RelationshipType: 'CONTAINS',
          ValueType: 'CONTAINER',
          ConceptNameCodeSequence: {
            CodeValue: '125007',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Measurement Group',
          },
          ContinuityOfContent: 'SEPARATE',
          ContentSequence: measurementGroupContentSequence,
        },
      },
    ];
  
    var measurementGroupContentItem = function(ReferencedSOPInstanceUID, handles, distance, frame) {
      return ([
        {
          RelationshipType: 'HAS OBS CONTEXT',
          ValueType: 'TEXT',
          ConceptNameCodeSequence: {
            CodeValue: '112039',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Tracking Identifier',
          },
          TextValue: 'web annotation',
        },
        {
          RelationshipType: 'HAS OBS CONTEXT',
          ValueType: 'UIDREF',
          ConceptNameCodeSequence: {
            CodeValue: '112040',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Tracking Unique Identifier',
          },
          UID: dcmjs.data.DicomMetaDictionary.uid(),
        },
        {
          RelationshipType: 'CONTAINS',
          ValueType: 'CODE',
          ConceptNameCodeSequence: {
            CodeValue: '121071',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Finding',
          },
          ConceptCodeSequence: {
            CodeValue: 'SAMPLEFINDING',
            CodingSchemeDesignator: '99dcmjs',
            CodeMeaning: 'Sample Finding',
          },
        },
        {
          RelationshipType: 'CONTAINS',
          ValueType: 'NUM',
          ConceptNameCodeSequence: {
            CodeValue: 'G-D7FE',
            CodingSchemeDesignator: 'SRT',
            CodeMeaning: 'Length',
          },
          MeasuredValueSequence: {
            MeasurementUnitsCodeSequence: {
              CodeValue: 'mm',
              CodingSchemeDesignator: 'UCUM',
              CodingSchemeVersion: '1.4',
              CodeMeaning: 'millimeter',
            },
            NumericValue: distance,
          },
          ContentSequence: {
            RelationshipType: 'INFERRED FROM',
            ValueType: 'SCOORD',
            GraphicType: 'POLYLINE',
            GraphicData: [ handles.start.x, handles.start.y, handles.end.x, handles.end.y ],
            ContentSequence: {
              RelationshipType: 'SELECTED FROM',
              ValueType: 'IMAGE',
              ReferencedSOPSequence: {
                ReferencedSOPClassUID: derivationSourceDataset.SOPClassUID,
                ReferencedSOPInstanceUID: ReferencedSOPInstanceUID,
                ReferencedFrameNumber: frame,
              }
            },
          },
        },
      ]);
    }
  
    const imageToolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();
    Object.keys(imageToolState).forEach(function(imageId) {
      if (imageToolState[imageId]) {
        imageToolState[imageId].length.data.forEach(function(length) {
  
          let handles = length.handles;
          //let frame = Number(imageId.slice(imageId.lastIndexOf('frame')).split('=')[1]); // TODO: frame is explicit somewhere?
  
          imageParameters = parametersFromImageId(imageId);
          let ReferencedInstanceUID = imageParameters.get('objectUID');
          let frame = imageParameters.get('frame');
  
          // extend list in place
          measurementGroupContentSequence.push.apply(measurementGroupContentSequence, measurementGroupContentItem(ReferencedInstanceUID, handles, length.length, frame));
        });
      }
    });
  
    return(dataset);
  }
  
  //
  // return a post-able multipart encoded dicom from the blob
  //
  function multipartEncode(dataset, boundary) {
  
    const denaturalizedMetaheader = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset._meta);
    const dicomDict = new dcmjs.data.DicomDict(denaturalizedMetaheader);
  
    dicomDict.dict = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);
  
    const part10Buffer = dicomDict.write();
  
    const header = `\r\n--${boundary}\r\nContent-Type: application/dicom\r\n\r\n`;
    const footer = `\r\n--${boundary}--`;
  
    const stringToArray = (string) => Uint8Array.from(Array.from(string).map(letter => letter.charCodeAt(0)));
  
    headerArray = stringToArray(header);
    contentArray = new Uint8Array(part10Buffer);
    footerArray = stringToArray(footer);
  
    const multipartArray = new Uint8Array(headerArray.length + contentArray.length + footerArray.length);
  
    multipartArray.set(headerArray, 0);
    multipartArray.set(contentArray, headerArray.length);
    multipartArray.set(footerArray, headerArray.length + contentArray.length);
  
    return(multipartArray.buffer);
  }
  
export function stowSR() {
    const reportDataset = srFromToolState();
    
    console.log(reportDataset);
  
    const parameters = parametersFromToolState();
  
    const wadoProxyURLPrefix = "dicomweb:/__wado_proxy?url";
    const wadoURL = parameters.get(wadoProxyURLPrefix);
    const serverId = parameters.get('serverId');
    const aetURLPrefix = wadoURL.slice(0, wadoURL.search('/wado'));
    const stowURL = `${aetURLPrefix}/rs/studies`;
  
    const boundary = dcmjs.data.DicomMetaDictionary.uid();
    const multipartBuffer = multipartEncode(reportDataset, boundary);
  
    const wadoProxyURL = `/__wado_proxy?url=${stowURL}&serverId=${serverId}`;
  
    const stowRequest = new XMLHttpRequest();
    stowRequest.open("POST", wadoProxyURL);
    stowRequest.onload = console.log;
    stowRequest.setRequestHeader(
                  'Content-Type',
                  `multipart/related; type=application/dicom; boundary=${boundary}`
    );
    stowRequest.send(multipartBuffer);
  }
  
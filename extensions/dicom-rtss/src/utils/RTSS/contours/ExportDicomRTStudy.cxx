std::string vtkSlicerDicomRtImportExportModuleLogic::ExportDicomRTStudy(vtkCollection* exportables)
{
  std::string error("");
  vtkMRMLScene* mrmlScene = this->GetMRMLScene();
  if (!mrmlScene)
  {
    error = "MRML scene not valid";
    vtkErrorMacro("ExportDicomRTStudy: " + error);
    return error;
  }
  vtkMRMLSubjectHierarchyNode* shNode = vtkMRMLSubjectHierarchyNode::GetSubjectHierarchyNode(this->GetMRMLScene());
  if (!shNode)
  {
    error = "Failed to access subject hierarchy node";
    vtkErrorMacro("ExportDicomRTStudy: " + error);
    return error;
  }

  if (exportables->GetNumberOfItems() < 1)
  {
    error = "Exportable list contains no exportables";
    vtkErrorMacro("ExportDicomRTStudy: " + error);
    return error;
  }

  // Get common export parameters from first exportable
  // These are the ones available through the DICOM Export widget
  vtkSlicerDICOMExportable* firstExportable = vtkSlicerDICOMExportable::SafeDownCast(exportables->GetItemAsObject(0));
  const char* patientName = firstExportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMPatientNameTagName().c_str());
  const char* patientID = firstExportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMPatientIDTagName().c_str());
  const char* patientSex = firstExportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMPatientSexTagName().c_str());
  const char* studyDate = firstExportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMStudyDateTagName().c_str());
  const char* studyTime = firstExportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMStudyTimeTagName().c_str());
  const char* studyDescription = firstExportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMStudyDescriptionTagName().c_str());
  if (studyDescription && !strcmp(studyDescription, "No study description"))
  {
    studyDescription = 0;
  }
  const char* imageSeriesDescription = 0;
  const char* imageSeriesNumber = 0;
  const char* imageSeriesModality = 0;
  const char* doseSeriesDescription = 0;
  const char* doseSeriesNumber = 0;
  const char* rtssSeriesDescription = 0;
  const char* rtssSeriesNumber = 0;

  // Get other common export parameters
  // These are the ones available in hierarchy
  std::string studyInstanceUid = "";
  std::string studyID = "";
  vtkIdType firstShItemID = firstExportable->GetSubjectHierarchyItemID();
  if (firstShItemID != vtkMRMLSubjectHierarchyNode::INVALID_ITEM_ID)
  {
    vtkIdType studyItemID = shNode->GetItemAncestorAtLevel(firstShItemID, vtkMRMLSubjectHierarchyConstants::GetDICOMLevelStudy());
    if (studyItemID != vtkMRMLSubjectHierarchyNode::INVALID_ITEM_ID)
    {
      studyInstanceUid = shNode->GetItemUID(studyItemID, vtkMRMLSubjectHierarchyConstants::GetDICOMUIDName());
      studyID = shNode->GetItemAttribute(studyItemID, vtkMRMLSubjectHierarchyConstants::GetDICOMStudyIDTagName());
    }
    else
    {
      vtkWarningMacro("ExportDicomRTStudy: Failed to get ancestor study from exportable with subject hierarchy item ID " + firstExportable->GetSubjectHierarchyItemID());
    }
  }
  else
  {
    vtkWarningMacro("ExportDicomRTStudy: Failed to get SH item from exportable with item ID " + firstExportable->GetSubjectHierarchyItemID());
  }

  const char* outputPath = firstExportable->GetDirectory();

  // Get nodes for the different roles from the exportable list
  vtkMRMLScalarVolumeNode* doseNode = nullptr;
  vtkMRMLSegmentationNode* segmentationNode = nullptr;
  vtkMRMLScalarVolumeNode* imageNode = nullptr;
  std::vector<std::string> imageSliceUIDs;
  for (int index=0; index<exportables->GetNumberOfItems(); ++index)
  {
    vtkSlicerDICOMExportable* exportable = vtkSlicerDICOMExportable::SafeDownCast(
      exportables->GetItemAsObject(index) );
    vtkIdType shItemID = exportable->GetSubjectHierarchyItemID();
    if (shItemID == vtkMRMLSubjectHierarchyNode::INVALID_ITEM_ID)
    {
      vtkWarningMacro("ExportDicomRTStudy: Failed to get item from exportable with item ID " + exportable->GetSubjectHierarchyItemID());
      // There might be enough exportables for a successful export, all roles are checked later
      continue;
    }
    vtkMRMLNode* associatedNode = shNode->GetItemDataNode(shItemID);

    // GCS FIX TODO: The below logic seems to allow only a single dose,
    // single image, and single segmentation per study.
    // However, there is no check to enforce this.

    // Check if dose volume and set it if found
    if (associatedNode && vtkSlicerRtCommon::IsDoseVolumeNode(associatedNode))
    {
      doseNode = vtkMRMLScalarVolumeNode::SafeDownCast(associatedNode);

      doseSeriesDescription = exportable->GetTag("SeriesDescription");
      if (doseSeriesDescription && !strcmp(doseSeriesDescription, "No series description"))
      {
        doseSeriesDescription = 0;
      }
      doseSeriesNumber = exportable->GetTag("SeriesNumber");
    }
    // Check if segmentation node and set if found
    else if (associatedNode && associatedNode->IsA("vtkMRMLSegmentationNode"))
    {
      segmentationNode = vtkMRMLSegmentationNode::SafeDownCast(associatedNode);

      rtssSeriesDescription = exportable->GetTag("SeriesDescription");
      if (rtssSeriesDescription && !strcmp(rtssSeriesDescription, "No series description"))
      {
        rtssSeriesDescription = 0;
      }
      rtssSeriesNumber = exportable->GetTag("SeriesNumber");
    }
    // Check if other volume (anatomical volume role) and set if found
    else if (associatedNode && associatedNode->IsA("vtkMRMLScalarVolumeNode"))
    {
      imageNode = vtkMRMLScalarVolumeNode::SafeDownCast(associatedNode);

      // Get series DICOM tags to export
      imageSeriesDescription = exportable->GetTag("SeriesDescription");
      if (imageSeriesDescription && !strcmp(imageSeriesDescription, "No series description"))
      {
        imageSeriesDescription = 0;
      }
      //TODO: Getter function adds "DICOM." prefix (which is for attribute names), while the exportable tags are without that
      // imageSeriesModality = exportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMSeriesModalityAttributeName());
      imageSeriesModality = exportable->GetTag("Modality");
      // imageSeriesNumber = exportable->GetTag(vtkMRMLSubjectHierarchyConstants::GetDICOMSeriesNumberAttributeName());
      imageSeriesNumber = exportable->GetTag("SeriesNumber");

      // Get slice instance UIDs
      std::string sliceInstanceUIDList = shNode->GetItemUID(shItemID, vtkMRMLSubjectHierarchyConstants::GetDICOMInstanceUIDName());
      vtkMRMLSubjectHierarchyNode::DeserializeUIDList(sliceInstanceUIDList, imageSliceUIDs);
    }
    // Report warning if a node cannot be assigned a role
    else
    {
      vtkWarningMacro("ExportDicomRTStudy: Unable to assign supported RT role to exported item " + shNode->GetItemName(shItemID));
    }
  }

  // Make sure there is an image node.  Don't check for struct / dose, as those are optional
  if (!imageNode)
  {
    error = "Must export the primary anatomical (CT/MR) image";
    vtkErrorMacro("ExportDicomRTStudy: " + error);
    return error;
  }

  // Create RT writer
  vtkSmartPointer<vtkSlicerDicomRtWriter> rtWriter = vtkSmartPointer<vtkSlicerDicomRtWriter>::New();

  // Set study-level metadata
  rtWriter->SetPatientName(patientName);
  rtWriter->SetPatientID(patientID);
  rtWriter->SetPatientSex(patientSex);
  rtWriter->SetStudyDate(studyDate);
  rtWriter->SetStudyTime(studyTime);
  rtWriter->SetStudyDescription(studyDescription);
  rtWriter->SetStudyInstanceUid(studyInstanceUid.c_str());
  rtWriter->SetStudyID(studyID.c_str());

  // Set image-level metadata
  rtWriter->SetImageSeriesDescription(imageSeriesDescription);
  rtWriter->SetImageSeriesNumber(imageSeriesNumber);
  rtWriter->SetImageSeriesModality(imageSeriesModality);
  rtWriter->SetDoseSeriesDescription(doseSeriesDescription);
  rtWriter->SetDoseSeriesNumber(doseSeriesNumber);
  rtWriter->SetRtssSeriesDescription(rtssSeriesDescription);
  rtWriter->SetRtssSeriesNumber(rtssSeriesNumber);

  // Convert input image (CT/MR/etc) to the format Plastimatch can use
  vtkSmartPointer<vtkOrientedImageData> imageOrientedImageData = vtkSmartPointer<vtkOrientedImageData>::New();
  if (!vtkSlicerRtCommon::ConvertVolumeNodeToVtkOrientedImageData(imageNode, imageOrientedImageData))
  {
    error = "Failed to convert anatomical image " + std::string(imageNode->GetName()) + " to oriented image data";
    vtkErrorMacro("ExportDicomRTStudy: " + error);
    return error;
  }
  // Need to resample image data if its transform contains shear
  vtkSmartPointer<vtkMatrix4x4> imageToWorldMatrix = vtkSmartPointer<vtkMatrix4x4>::New();
  imageOrientedImageData->GetImageToWorldMatrix(imageToWorldMatrix);
  if (vtkOrientedImageDataResample::DoesTransformMatrixContainShear(imageToWorldMatrix))
  {
    vtkSmartPointer<vtkTransform> imageToWorldTransform = vtkSmartPointer<vtkTransform>::New();
    imageToWorldTransform->SetMatrix(imageToWorldMatrix);
    vtkOrientedImageDataResample::TransformOrientedImage(imageOrientedImageData, imageToWorldTransform, false, true);
    // Set identity transform to image data so that it is at the same location
    vtkSmartPointer<vtkMatrix4x4> identityMatrix = vtkSmartPointer<vtkMatrix4x4>::New();
    identityMatrix->Identity();
    imageOrientedImageData->SetGeometryFromImageToWorldMatrix(identityMatrix);
  }
  // Set anatomical image to RT writer
  Plm_image::Pointer plm_img = PlmCommon::ConvertVtkOrientedImageDataToPlmImage(imageOrientedImageData);
  if (plm_img->dim(0) * plm_img->dim(1) * plm_img->dim(2) == 0)
  {
    error = "Failed to convert anatomical (CT/MR) image to Plastimatch format";
    vtkErrorMacro("ExportDicomRTStudy: " + error);
    return error;
  }
  rtWriter->SetImage(plm_img);

  // Convert input RTDose to the format Plastimatch can use
  if (doseNode)
  {
    vtkSmartPointer<vtkOrientedImageData> doseOrientedImageData = vtkSmartPointer<vtkOrientedImageData>::New();
    if (!vtkSlicerRtCommon::ConvertVolumeNodeToVtkOrientedImageData(doseNode, doseOrientedImageData))
    {
      error = "Failed to convert dose volume " + std::string(doseNode->GetName()) + " to oriented image data";
      vtkErrorMacro("ExportDicomRTStudy: " + error);
      return error;
    }
    // Need to resample image data if its transform contains shear
    vtkSmartPointer<vtkMatrix4x4> doseToWorldMatrix = vtkSmartPointer<vtkMatrix4x4>::New();
    doseOrientedImageData->GetImageToWorldMatrix(doseToWorldMatrix);
    if (vtkOrientedImageDataResample::DoesTransformMatrixContainShear(doseToWorldMatrix))
    {
      vtkSmartPointer<vtkTransform> doseToWorldTransform = vtkSmartPointer<vtkTransform>::New();
      doseToWorldTransform->SetMatrix(doseToWorldMatrix);
      vtkOrientedImageDataResample::TransformOrientedImage(doseOrientedImageData, doseToWorldTransform, false, true);
      // Set identity transform to image data so that it is at the same location
      vtkSmartPointer<vtkMatrix4x4> identityMatrix = vtkSmartPointer<vtkMatrix4x4>::New();
      identityMatrix->Identity();
      doseOrientedImageData->SetGeometryFromImageToWorldMatrix(identityMatrix);
    }
    // Set anatomical image to RT writer
    Plm_image::Pointer dose_img = PlmCommon::ConvertVtkOrientedImageDataToPlmImage(doseOrientedImageData);
    if (dose_img->dim(0) * dose_img->dim(1) * dose_img->dim(2) == 0)
    {
      error = "Failed to convert dose volume to Plastimatch format";
      vtkErrorMacro("ExportDicomRTStudy: " + error);
      return error;
    }
    rtWriter->SetDose(dose_img);
  }

  // Convert input segmentation to the format Plastimatch can use
  if (segmentationNode)
  {
    // If master representation is labelmap type, then export binary labelmap
    vtkSegmentation* segmentation = segmentationNode->GetSegmentation();
    if (segmentation->IsMasterRepresentationImageData())
    {
      // Make sure segmentation contains binary labelmap
      if ( !segmentationNode->GetSegmentation()->CreateRepresentation(
        vtkSegmentationConverter::GetSegmentationBinaryLabelmapRepresentationName() ) )
      {
        error = "Failed to get binary labelmap representation from segmentation " + std::string(segmentationNode->GetName());
        vtkErrorMacro("ExportDicomRTStudy: " + error);
        return error;
      }

      // Export each segment in segmentation
      std::vector< std::string > segmentIDs;
      segmentationNode->GetSegmentation()->GetSegmentIDs(segmentIDs);
      for (std::vector< std::string >::const_iterator segmentIdIt = segmentIDs.begin(); segmentIdIt != segmentIDs.end(); ++segmentIdIt)
      {
        std::string segmentID = *segmentIdIt;
        vtkSegment* segment = segmentationNode->GetSegmentation()->GetSegment(*segmentIdIt);

        // Get binary labelmap representation
#if Slicer_VERSION_MAJOR >= 5 || (Slicer_VERSION_MAJOR >= 4 && Slicer_VERSION_MINOR >= 11)
        vtkNew<vtkOrientedImageData> binaryLabelmap;
        segmentationNode->GetBinaryLabelmapRepresentation(segmentID, binaryLabelmap);
#else
        vtkOrientedImageData* binaryLabelmap = vtkOrientedImageData::SafeDownCast(
          segment->GetRepresentation(vtkSegmentationConverter::GetSegmentationBinaryLabelmapRepresentationName()) );
#endif
        if (!binaryLabelmap)
        {
          error = "Failed to get binary labelmap representation from segment " + segmentID;
          vtkErrorMacro("ExportDicomRTStudy: " + error);
          return error;
        }
        // Temporarily copy labelmap image data as it will be probably resampled
        vtkSmartPointer<vtkOrientedImageData> binaryLabelmapCopy = vtkSmartPointer<vtkOrientedImageData>::New();
        binaryLabelmapCopy->DeepCopy(binaryLabelmap);

        // Apply parent transformation nodes if necessary
        if (segmentationNode->GetParentTransformNode())
        {
          if (!vtkSlicerSegmentationsModuleLogic::ApplyParentTransformToOrientedImageData(segmentationNode, binaryLabelmapCopy))
          {
            std::string errorMessage("Failed to apply parent transformation to exported segment");
            vtkErrorMacro("ExportDicomRTStudy: " << errorMessage);
            return errorMessage;
          }
        }
        // Make sure the labelmap dimensions match the reference dimensions
        if ( !vtkOrientedImageDataResample::DoGeometriesMatch(imageOrientedImageData, binaryLabelmapCopy)
          || !vtkOrientedImageDataResample::DoExtentsMatch(imageOrientedImageData, binaryLabelmapCopy) )
        {
          if (!vtkOrientedImageDataResample::ResampleOrientedImageToReferenceOrientedImage(binaryLabelmapCopy, imageOrientedImageData, binaryLabelmapCopy))
          {
            error = "Failed to resample segment " + segmentID + " to match anatomical image geometry";
            vtkErrorMacro("ExportDicomRTStudy: " + error);
            return error;
          }
        }

        // Convert mask to Plm image
        Plm_image::Pointer plmStructure = PlmCommon::ConvertVtkOrientedImageDataToPlmImage(binaryLabelmapCopy);
        if (!plmStructure)
        {
          error = "Failed to convert segment labelmap " + segmentID + " to Plastimatch image";
          vtkErrorMacro("ExportDicomRTStudy: " + error);
          return error;
        }

        // Get segment properties
        std::string segmentName = segment->GetName();
        double* segmentColor = segment->GetColor();

        rtWriter->AddStructure(plmStructure->itk_uchar(), segmentName.c_str(), segmentColor);
      } // For each segment
    }
    // If master representation is poly data type, then export from closed surface
    else if (segmentation->IsMasterRepresentationPolyData())
    {
      // Make sure segmentation contains closed surface
      if ( !segmentationNode->GetSegmentation()->CreateRepresentation(
        vtkSegmentationConverter::GetSegmentationClosedSurfaceRepresentationName() ) )
      {
        error = "Failed to get closed surface representation from segmentation " + std::string(segmentationNode->GetName());
        vtkErrorMacro("ExportDicomRTStudy: " + error);
        return error;
      }

      // Get transform  from segmentation to world (RAS)
      vtkSmartPointer<vtkGeneralTransform> nodeToWorldTransform = vtkSmartPointer<vtkGeneralTransform>::New();
      nodeToWorldTransform->Identity();
      if (segmentationNode->GetParentTransformNode())
      {
        segmentationNode->GetParentTransformNode()->GetTransformToWorld(nodeToWorldTransform);
      }
      // Initialize poly data transformer
      vtkSmartPointer<vtkTransformPolyDataFilter> transformPolyData = vtkSmartPointer<vtkTransformPolyDataFilter>::New();
      transformPolyData->SetTransform(nodeToWorldTransform);

      // Initialize cutting plane with normal of the Z axis of the anatomical image
      vtkSmartPointer<vtkMatrix4x4> imageToWorldMatrix = vtkSmartPointer<vtkMatrix4x4>::New();
      imageOrientedImageData->GetImageToWorldMatrix(imageToWorldMatrix);
      double normal[3] = { imageToWorldMatrix->GetElement(0,2), imageToWorldMatrix->GetElement(1,2), imageToWorldMatrix->GetElement(2,2) };
      vtkSmartPointer<vtkPlane> slicePlane = vtkSmartPointer<vtkPlane>::New();
      slicePlane->SetNormal(normal);

      // Export each segment in segmentation
      std::vector< std::string > segmentIDs;
      segmentationNode->GetSegmentation()->GetSegmentIDs(segmentIDs);
      for (std::vector< std::string >::const_iterator segmentIdIt = segmentIDs.begin(); segmentIdIt != segmentIDs.end(); ++segmentIdIt)
      {
        std::string segmentID = *segmentIdIt;
        vtkSegment* segment = segmentationNode->GetSegmentation()->GetSegment(*segmentIdIt);

        // Get closed surface representation
        vtkPolyData* closedSurfacePolyData = vtkPolyData::SafeDownCast(
          segment->GetRepresentation(vtkSegmentationConverter::GetSegmentationClosedSurfaceRepresentationName()) );
        if (!closedSurfacePolyData)
        {
          error = "Failed to get closed surface representation from segment " + segmentID;
          vtkErrorMacro("ExportDicomRTStudy: " + error);
          return error;
        }

        // Initialize cutter pipeline for segment
        transformPolyData->SetInputData(closedSurfacePolyData);
        vtkSmartPointer<vtkCutter> cutter = vtkSmartPointer<vtkCutter>::New();
        cutter->SetInputConnection(transformPolyData->GetOutputPort());
        cutter->SetGenerateCutScalars(0);
        vtkSmartPointer<vtkStripper> stripper = vtkSmartPointer<vtkStripper>::New();
        stripper->SetInputConnection(cutter->GetOutputPort());

        // Get segment bounding box
        double bounds[6] = {0.0,0.0,0.0,0.0,0.0,0.0};
        transformPolyData->Update();
        transformPolyData->GetOutput()->GetBounds(bounds);

        // Containers to be passed to the writer
        std::vector<int> sliceNumbers;
        std::vector<std::string> sliceUIDs;
        std::vector<vtkPolyData*> sliceContours;

        // Create planar contours from closed surface based on each of the anatomical image slices
        int imageExtent[6] = {0,-1,0,-1,0,-1};
        imageOrientedImageData->GetExtent(imageExtent);
        for (int slice=imageExtent[4]; slice<imageExtent[5]; ++slice)
        {
          // Calculate slice origin
          double origin[3] = { imageToWorldMatrix->GetElement(0,3) + slice*normal[0],
                               imageToWorldMatrix->GetElement(1,3) + slice*normal[1],
                               imageToWorldMatrix->GetElement(2,3) + slice*normal[2] };
          slicePlane->SetOrigin(origin);
          if (origin[2] < bounds[4] || origin[2] > bounds[5])
          {
            // No contours outside surface bounds
            continue;
          }

          // Cut closed surface at slice
          cutter->SetCutFunction(slicePlane);

          // Get instance UID of corresponding slice
          int sliceNumber = slice-imageExtent[0];
          sliceNumbers.push_back(sliceNumber);
          std::string sliceInstanceUID = (imageSliceUIDs.size() > static_cast<size_t>(sliceNumber) ? imageSliceUIDs[sliceNumber] : "");
          sliceUIDs.push_back(sliceInstanceUID);

          // Save slice contour
          stripper->Update();
          vtkPolyData* sliceContour = vtkPolyData::New();
          sliceContour->SetPoints(stripper->GetOutput()->GetPoints());
          sliceContour->SetPolys(stripper->GetOutput()->GetLines());
          sliceContours.push_back(sliceContour);
        } // For each anatomical image slice

        // Get segment properties
        std::string segmentName = segment->GetName();
        double* segmentColor = segment->GetColor();

        // Add contours to writer
        rtWriter->AddStructure(segmentName.c_str(), segmentColor, sliceNumbers, sliceUIDs, sliceContours);

        // Clean up slice contours
        for (std::vector<vtkPolyData*>::iterator contourIt=sliceContours.begin(); contourIt!=sliceContours.end(); ++contourIt)
        {
          (*contourIt)->Delete();
        }
      } // For each segment
    }
    else
    {
      error = "Structure set contains unsupported master representation";
      vtkErrorMacro("ExportDicomRTStudy: " + error);
      return error;
    }
  }

  // Write files to disk
  rtWriter->SetFileName(outputPath);
  rtWriter->Write();

  // Success (error is empty string)
  return error;
}

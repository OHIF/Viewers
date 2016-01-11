'use strict';

/*
 * Copied from node-dicom
 * https://github.com/grmble/node-dicom
 */

TAG_DICT = {
    '(0000,0000)': {
        tag: '(0000,0000)',
        vr: 'UL',
        vm: '1',
        name: 'CommandGroupLength'
    },
    '(0000,0001)': {
        tag: '(0000,0001)',
        vr: 'UL',
        vm: '1',
        name: 'CommandLengthToEnd'
    },
    '(0000,0002)': {
        tag: '(0000,0002)',
        vr: 'UI',
        vm: '1',
        name: 'AffectedSOPClassUID'
    },
    '(0000,0003)': {
        tag: '(0000,0003)',
        vr: 'UI',
        vm: '1',
        name: 'RequestedSOPClassUID'
    },
    '(0000,0010)': {
        tag: '(0000,0010)',
        vr: 'SH',
        vm: '1',
        name: 'CommandRecognitionCode'
    },
    '(0000,0100)': {
        tag: '(0000,0100)',
        vr: 'US',
        vm: '1',
        name: 'CommandField'
    },
    '(0000,0110)': {
        tag: '(0000,0110)',
        vr: 'US',
        vm: '1',
        name: 'MessageID'
    },
    '(0000,0120)': {
        tag: '(0000,0120)',
        vr: 'US',
        vm: '1',
        name: 'MessageIDBeingRespondedTo'
    },
    '(0000,0200)': {
        tag: '(0000,0200)',
        vr: 'AE',
        vm: '1',
        name: 'Initiator'
    },
    '(0000,0300)': {
        tag: '(0000,0300)',
        vr: 'AE',
        vm: '1',
        name: 'Receiver'
    },
    '(0000,0400)': {
        tag: '(0000,0400)',
        vr: 'AE',
        vm: '1',
        name: 'FindLocation'
    },
    '(0000,0600)': {
        tag: '(0000,0600)',
        vr: 'AE',
        vm: '1',
        name: 'MoveDestination'
    },
    '(0000,0700)': {
        tag: '(0000,0700)',
        vr: 'US',
        vm: '1',
        name: 'Priority'
    },
    '(0000,0800)': {
        tag: '(0000,0800)',
        vr: 'US',
        vm: '1',
        name: 'CommandDataSetType'
    },
    '(0000,0850)': {
        tag: '(0000,0850)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfMatches'
    },
    '(0000,0860)': {
        tag: '(0000,0860)',
        vr: 'US',
        vm: '1',
        name: 'ResponseSequenceNumber'
    },
    '(0000,0900)': {
        tag: '(0000,0900)',
        vr: 'US',
        vm: '1',
        name: 'Status'
    },
    '(0000,0901)': {
        tag: '(0000,0901)',
        vr: 'AT',
        vm: '1-n',
        name: 'OffendingElement'
    },
    '(0000,0902)': {
        tag: '(0000,0902)',
        vr: 'LO',
        vm: '1',
        name: 'ErrorComment'
    },
    '(0000,0903)': {
        tag: '(0000,0903)',
        vr: 'US',
        vm: '1',
        name: 'ErrorID'
    },
    '(0000,1000)': {
        tag: '(0000,1000)',
        vr: 'UI',
        vm: '1',
        name: 'AffectedSOPInstanceUID'
    },
    '(0000,1001)': {
        tag: '(0000,1001)',
        vr: 'UI',
        vm: '1',
        name: 'RequestedSOPInstanceUID'
    },
    '(0000,1002)': {
        tag: '(0000,1002)',
        vr: 'US',
        vm: '1',
        name: 'EventTypeID'
    },
    '(0000,1005)': {
        tag: '(0000,1005)',
        vr: 'AT',
        vm: '1-n',
        name: 'AttributeIdentifierList'
    },
    '(0000,1008)': {
        tag: '(0000,1008)',
        vr: 'US',
        vm: '1',
        name: 'ActionTypeID'
    },
    '(0000,1020)': {
        tag: '(0000,1020)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfRemainingSuboperations'
    },
    '(0000,1021)': {
        tag: '(0000,1021)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfCompletedSuboperations'
    },
    '(0000,1022)': {
        tag: '(0000,1022)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfFailedSuboperations'
    },
    '(0000,1023)': {
        tag: '(0000,1023)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfWarningSuboperations'
    },
    '(0000,1030)': {
        tag: '(0000,1030)',
        vr: 'AE',
        vm: '1',
        name: 'MoveOriginatorApplicationEntityTitle'
    },
    '(0000,1031)': {
        tag: '(0000,1031)',
        vr: 'US',
        vm: '1',
        name: 'MoveOriginatorMessageID'
    },
    '(0000,4000)': {
        tag: '(0000,4000)',
        vr: 'LT',
        vm: '1',
        name: 'DialogReceiver'
    },
    '(0000,4010)': {
        tag: '(0000,4010)',
        vr: 'LT',
        vm: '1',
        name: 'TerminalType'
    },
    '(0000,5010)': {
        tag: '(0000,5010)',
        vr: 'SH',
        vm: '1',
        name: 'MessageSetID'
    },
    '(0000,5020)': {
        tag: '(0000,5020)',
        vr: 'SH',
        vm: '1',
        name: 'EndMessageID'
    },
    '(0000,5110)': {
        tag: '(0000,5110)',
        vr: 'LT',
        vm: '1',
        name: 'DisplayFormat'
    },
    '(0000,5120)': {
        tag: '(0000,5120)',
        vr: 'LT',
        vm: '1',
        name: 'PagePositionID'
    },
    '(0000,5130)': {
        tag: '(0000,5130)',
        vr: 'CS',
        vm: '1',
        name: 'TextFormatID'
    },
    '(0000,5140)': {
        tag: '(0000,5140)',
        vr: 'CS',
        vm: '1',
        name: 'NormalReverse'
    },
    '(0000,5150)': {
        tag: '(0000,5150)',
        vr: 'CS',
        vm: '1',
        name: 'AddGrayScale'
    },
    '(0000,5160)': {
        tag: '(0000,5160)',
        vr: 'CS',
        vm: '1',
        name: 'Borders'
    },
    '(0000,5170)': {
        tag: '(0000,5170)',
        vr: 'IS',
        vm: '1',
        name: 'Copies'
    },
    '(0000,5180)': {
        tag: '(0000,5180)',
        vr: 'CS',
        vm: '1',
        name: 'CommandMagnificationType'
    },
    '(0000,5190)': {
        tag: '(0000,5190)',
        vr: 'CS',
        vm: '1',
        name: 'Erase'
    },
    '(0000,51A0)': {
        tag: '(0000,51A0)',
        vr: 'CS',
        vm: '1',
        name: 'Print'
    },
    '(0000,51B0)': {
        tag: '(0000,51B0)',
        vr: 'US',
        vm: '1-n',
        name: 'Overlays'
    },
    '(0002,0000)': {
        tag: '(0002,0000)',
        vr: 'UL',
        vm: '1',
        name: 'FileMetaInformationGroupLength'
    },
    '(0002,0001)': {
        tag: '(0002,0001)',
        vr: 'OB',
        vm: '1',
        name: 'FileMetaInformationVersion'
    },
    '(0002,0002)': {
        tag: '(0002,0002)',
        vr: 'UI',
        vm: '1',
        name: 'MediaStorageSOPClassUID'
    },
    '(0002,0003)': {
        tag: '(0002,0003)',
        vr: 'UI',
        vm: '1',
        name: 'MediaStorageSOPInstanceUID'
    },
    '(0002,0010)': {
        tag: '(0002,0010)',
        vr: 'UI',
        vm: '1',
        name: 'TransferSyntaxUID'
    },
    '(0002,0012)': {
        tag: '(0002,0012)',
        vr: 'UI',
        vm: '1',
        name: 'ImplementationClassUID'
    },
    '(0002,0013)': {
        tag: '(0002,0013)',
        vr: 'SH',
        vm: '1',
        name: 'ImplementationVersionName'
    },
    '(0002,0016)': {
        tag: '(0002,0016)',
        vr: 'AE',
        vm: '1',
        name: 'SourceApplicationEntityTitle'
    },
    '(0002,0100)': {
        tag: '(0002,0100)',
        vr: 'UI',
        vm: '1',
        name: 'PrivateInformationCreatorUID'
    },
    '(0002,0102)': {
        tag: '(0002,0102)',
        vr: 'OB',
        vm: '1',
        name: 'PrivateInformation'
    },
    '(0004,1130)': {
        tag: '(0004,1130)',
        vr: 'CS',
        vm: '1',
        name: 'FileSetID'
    },
    '(0004,1141)': {
        tag: '(0004,1141)',
        vr: 'CS',
        vm: '1-8',
        name: 'FileSetDescriptorFileID'
    },
    '(0004,1142)': {
        tag: '(0004,1142)',
        vr: 'CS',
        vm: '1',
        name: 'SpecificCharacterSetOfFileSetDescriptorFile'
    },
    '(0004,1200)': {
        tag: '(0004,1200)',
        vr: 'UL',
        vm: '1',
        name: 'OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity'
    },
    '(0004,1202)': {
        tag: '(0004,1202)',
        vr: 'UL',
        vm: '1',
        name: 'OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity'
    },
    '(0004,1212)': {
        tag: '(0004,1212)',
        vr: 'US',
        vm: '1',
        name: 'FileSetConsistencyFlag'
    },
    '(0004,1220)': {
        tag: '(0004,1220)',
        vr: 'SQ',
        vm: '1',
        name: 'DirectoryRecordSequence'
    },
    '(0004,1400)': {
        tag: '(0004,1400)',
        vr: 'UL',
        vm: '1',
        name: 'OffsetOfTheNextDirectoryRecord'
    },
    '(0004,1410)': {
        tag: '(0004,1410)',
        vr: 'US',
        vm: '1',
        name: 'RecordInUseFlag'
    },
    '(0004,1420)': {
        tag: '(0004,1420)',
        vr: 'UL',
        vm: '1',
        name: 'OffsetOfReferencedLowerLevelDirectoryEntity'
    },
    '(0004,1430)': {
        tag: '(0004,1430)',
        vr: 'CS',
        vm: '1',
        name: 'DirectoryRecordType'
    },
    '(0004,1432)': {
        tag: '(0004,1432)',
        vr: 'UI',
        vm: '1',
        name: 'PrivateRecordUID'
    },
    '(0004,1500)': {
        tag: '(0004,1500)',
        vr: 'CS',
        vm: '1-8',
        name: 'ReferencedFileID'
    },
    '(0004,1504)': {
        tag: '(0004,1504)',
        vr: 'UL',
        vm: '1',
        name: 'MRDRDirectoryRecordOffset'
    },
    '(0004,1510)': {
        tag: '(0004,1510)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedSOPClassUIDInFile'
    },
    '(0004,1511)': {
        tag: '(0004,1511)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedSOPInstanceUIDInFile'
    },
    '(0004,1512)': {
        tag: '(0004,1512)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedTransferSyntaxUIDInFile'
    },
    '(0004,151A)': {
        tag: '(0004,151A)',
        vr: 'UI',
        vm: '1-n',
        name: 'ReferencedRelatedGeneralSOPClassUIDInFile'
    },
    '(0004,1600)': {
        tag: '(0004,1600)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfReferences'
    },
    '(0008,0001)': {
        tag: '(0008,0001)',
        vr: 'UL',
        vm: '1',
        name: 'LengthToEnd'
    },
    '(0008,0005)': {
        tag: '(0008,0005)',
        vr: 'CS',
        vm: '1-n',
        name: 'SpecificCharacterSet'
    },
    '(0008,0006)': {
        tag: '(0008,0006)',
        vr: 'SQ',
        vm: '1',
        name: 'LanguageCodeSequence'
    },
    '(0008,0008)': {
        tag: '(0008,0008)',
        vr: 'CS',
        vm: '2-n',
        name: 'ImageType'
    },
    '(0008,0010)': {
        tag: '(0008,0010)',
        vr: 'SH',
        vm: '1',
        name: 'RecognitionCode'
    },
    '(0008,0012)': {
        tag: '(0008,0012)',
        vr: 'DA',
        vm: '1',
        name: 'InstanceCreationDate'
    },
    '(0008,0013)': {
        tag: '(0008,0013)',
        vr: 'TM',
        vm: '1',
        name: 'InstanceCreationTime'
    },
    '(0008,0014)': {
        tag: '(0008,0014)',
        vr: 'UI',
        vm: '1',
        name: 'InstanceCreatorUID'
    },
    '(0008,0016)': {
        tag: '(0008,0016)',
        vr: 'UI',
        vm: '1',
        name: 'SOPClassUID'
    },
    '(0008,0018)': {
        tag: '(0008,0018)',
        vr: 'UI',
        vm: '1',
        name: 'SOPInstanceUID'
    },
    '(0008,001A)': {
        tag: '(0008,001A)',
        vr: 'UI',
        vm: '1-n',
        name: 'RelatedGeneralSOPClassUID'
    },
    '(0008,001B)': {
        tag: '(0008,001B)',
        vr: 'UI',
        vm: '1',
        name: 'OriginalSpecializedSOPClassUID'
    },
    '(0008,0020)': {
        tag: '(0008,0020)',
        vr: 'DA',
        vm: '1',
        name: 'StudyDate'
    },
    '(0008,0021)': {
        tag: '(0008,0021)',
        vr: 'DA',
        vm: '1',
        name: 'SeriesDate'
    },
    '(0008,0022)': {
        tag: '(0008,0022)',
        vr: 'DA',
        vm: '1',
        name: 'AcquisitionDate'
    },
    '(0008,0023)': {
        tag: '(0008,0023)',
        vr: 'DA',
        vm: '1',
        name: 'ContentDate'
    },
    '(0008,0024)': {
        tag: '(0008,0024)',
        vr: 'DA',
        vm: '1',
        name: 'OverlayDate'
    },
    '(0008,0025)': {
        tag: '(0008,0025)',
        vr: 'DA',
        vm: '1',
        name: 'CurveDate'
    },
    '(0008,002A)': {
        tag: '(0008,002A)',
        vr: 'DT',
        vm: '1',
        name: 'AcquisitionDateTime'
    },
    '(0008,0030)': {
        tag: '(0008,0030)',
        vr: 'TM',
        vm: '1',
        name: 'StudyTime'
    },
    '(0008,0031)': {
        tag: '(0008,0031)',
        vr: 'TM',
        vm: '1',
        name: 'SeriesTime'
    },
    '(0008,0032)': {
        tag: '(0008,0032)',
        vr: 'TM',
        vm: '1',
        name: 'AcquisitionTime'
    },
    '(0008,0033)': {
        tag: '(0008,0033)',
        vr: 'TM',
        vm: '1',
        name: 'ContentTime'
    },
    '(0008,0034)': {
        tag: '(0008,0034)',
        vr: 'TM',
        vm: '1',
        name: 'OverlayTime'
    },
    '(0008,0035)': {
        tag: '(0008,0035)',
        vr: 'TM',
        vm: '1',
        name: 'CurveTime'
    },
    '(0008,0040)': {
        tag: '(0008,0040)',
        vr: 'US',
        vm: '1',
        name: 'DataSetType'
    },
    '(0008,0041)': {
        tag: '(0008,0041)',
        vr: 'LO',
        vm: '1',
        name: 'DataSetSubtype'
    },
    '(0008,0042)': {
        tag: '(0008,0042)',
        vr: 'CS',
        vm: '1',
        name: 'NuclearMedicineSeriesType'
    },
    '(0008,0050)': {
        tag: '(0008,0050)',
        vr: 'SH',
        vm: '1',
        name: 'AccessionNumber'
    },
    '(0008,0051)': {
        tag: '(0008,0051)',
        vr: 'SQ',
        vm: '1',
        name: 'IssuerOfAccessionNumberSequence'
    },
    '(0008,0052)': {
        tag: '(0008,0052)',
        vr: 'CS',
        vm: '1',
        name: 'QueryRetrieveLevel'
    },
    '(0008,0054)': {
        tag: '(0008,0054)',
        vr: 'AE',
        vm: '1-n',
        name: 'RetrieveAETitle'
    },
    '(0008,0056)': {
        tag: '(0008,0056)',
        vr: 'CS',
        vm: '1',
        name: 'InstanceAvailability'
    },
    '(0008,0058)': {
        tag: '(0008,0058)',
        vr: 'UI',
        vm: '1-n',
        name: 'FailedSOPInstanceUIDList'
    },
    '(0008,0060)': {
        tag: '(0008,0060)',
        vr: 'CS',
        vm: '1',
        name: 'Modality'
    },
    '(0008,0061)': {
        tag: '(0008,0061)',
        vr: 'CS',
        vm: '1-n',
        name: 'ModalitiesInStudy'
    },
    '(0008,0062)': {
        tag: '(0008,0062)',
        vr: 'UI',
        vm: '1-n',
        name: 'SOPClassesInStudy'
    },
    '(0008,0064)': {
        tag: '(0008,0064)',
        vr: 'CS',
        vm: '1',
        name: 'ConversionType'
    },
    '(0008,0068)': {
        tag: '(0008,0068)',
        vr: 'CS',
        vm: '1',
        name: 'PresentationIntentType'
    },
    '(0008,0070)': {
        tag: '(0008,0070)',
        vr: 'LO',
        vm: '1',
        name: 'Manufacturer'
    },
    '(0008,0080)': {
        tag: '(0008,0080)',
        vr: 'LO',
        vm: '1',
        name: 'InstitutionName'
    },
    '(0008,0081)': {
        tag: '(0008,0081)',
        vr: 'ST',
        vm: '1',
        name: 'InstitutionAddress'
    },
    '(0008,0082)': {
        tag: '(0008,0082)',
        vr: 'SQ',
        vm: '1',
        name: 'InstitutionCodeSequence'
    },
    '(0008,0090)': {
        tag: '(0008,0090)',
        vr: 'PN',
        vm: '1',
        name: 'ReferringPhysicianName'
    },
    '(0008,0092)': {
        tag: '(0008,0092)',
        vr: 'ST',
        vm: '1',
        name: 'ReferringPhysicianAddress'
    },
    '(0008,0094)': {
        tag: '(0008,0094)',
        vr: 'SH',
        vm: '1-n',
        name: 'ReferringPhysicianTelephoneNumbers'
    },
    '(0008,0096)': {
        tag: '(0008,0096)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferringPhysicianIdentificationSequence'
    },
    '(0008,0100)': {
        tag: '(0008,0100)',
        vr: 'SH',
        vm: '1',
        name: 'CodeValue'
    },
    '(0008,0102)': {
        tag: '(0008,0102)',
        vr: 'SH',
        vm: '1',
        name: 'CodingSchemeDesignator'
    },
    '(0008,0103)': {
        tag: '(0008,0103)',
        vr: 'SH',
        vm: '1',
        name: 'CodingSchemeVersion'
    },
    '(0008,0104)': {
        tag: '(0008,0104)',
        vr: 'LO',
        vm: '1',
        name: 'CodeMeaning'
    },
    '(0008,0105)': {
        tag: '(0008,0105)',
        vr: 'CS',
        vm: '1',
        name: 'MappingResource'
    },
    '(0008,0106)': {
        tag: '(0008,0106)',
        vr: 'DT',
        vm: '1',
        name: 'ContextGroupVersion'
    },
    '(0008,0107)': {
        tag: '(0008,0107)',
        vr: 'DT',
        vm: '1',
        name: 'ContextGroupLocalVersion'
    },
    '(0008,010B)': {
        tag: '(0008,010B)',
        vr: 'CS',
        vm: '1',
        name: 'ContextGroupExtensionFlag'
    },
    '(0008,010C)': {
        tag: '(0008,010C)',
        vr: 'UI',
        vm: '1',
        name: 'CodingSchemeUID'
    },
    '(0008,010D)': {
        tag: '(0008,010D)',
        vr: 'UI',
        vm: '1',
        name: 'ContextGroupExtensionCreatorUID'
    },
    '(0008,010F)': {
        tag: '(0008,010F)',
        vr: 'CS',
        vm: '1',
        name: 'ContextIdentifier'
    },
    '(0008,0110)': {
        tag: '(0008,0110)',
        vr: 'SQ',
        vm: '1',
        name: 'CodingSchemeIdentificationSequence'
    },
    '(0008,0112)': {
        tag: '(0008,0112)',
        vr: 'LO',
        vm: '1',
        name: 'CodingSchemeRegistry'
    },
    '(0008,0114)': {
        tag: '(0008,0114)',
        vr: 'ST',
        vm: '1',
        name: 'CodingSchemeExternalID'
    },
    '(0008,0115)': {
        tag: '(0008,0115)',
        vr: 'ST',
        vm: '1',
        name: 'CodingSchemeName'
    },
    '(0008,0116)': {
        tag: '(0008,0116)',
        vr: 'ST',
        vm: '1',
        name: 'CodingSchemeResponsibleOrganization'
    },
    '(0008,0117)': {
        tag: '(0008,0117)',
        vr: 'UI',
        vm: '1',
        name: 'ContextUID'
    },
    '(0008,0201)': {
        tag: '(0008,0201)',
        vr: 'SH',
        vm: '1',
        name: 'TimezoneOffsetFromUTC'
    },
    '(0008,1000)': {
        tag: '(0008,1000)',
        vr: 'AE',
        vm: '1',
        name: 'NetworkID'
    },
    '(0008,1010)': {
        tag: '(0008,1010)',
        vr: 'SH',
        vm: '1',
        name: 'StationName'
    },
    '(0008,1030)': {
        tag: '(0008,1030)',
        vr: 'LO',
        vm: '1',
        name: 'StudyDescription'
    },
    '(0008,1032)': {
        tag: '(0008,1032)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureCodeSequence'
    },
    '(0008,103E)': {
        tag: '(0008,103E)',
        vr: 'LO',
        vm: '1',
        name: 'SeriesDescription'
    },
    '(0008,103F)': {
        tag: '(0008,103F)',
        vr: 'SQ',
        vm: '1',
        name: 'SeriesDescriptionCodeSequence'
    },
    '(0008,1040)': {
        tag: '(0008,1040)',
        vr: 'LO',
        vm: '1',
        name: 'InstitutionalDepartmentName'
    },
    '(0008,1048)': {
        tag: '(0008,1048)',
        vr: 'PN',
        vm: '1-n',
        name: 'PhysiciansOfRecord'
    },
    '(0008,1049)': {
        tag: '(0008,1049)',
        vr: 'SQ',
        vm: '1',
        name: 'PhysiciansOfRecordIdentificationSequence'
    },
    '(0008,1050)': {
        tag: '(0008,1050)',
        vr: 'PN',
        vm: '1-n',
        name: 'PerformingPhysicianName'
    },
    '(0008,1052)': {
        tag: '(0008,1052)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformingPhysicianIdentificationSequence'
    },
    '(0008,1060)': {
        tag: '(0008,1060)',
        vr: 'PN',
        vm: '1-n',
        name: 'NameOfPhysiciansReadingStudy'
    },
    '(0008,1062)': {
        tag: '(0008,1062)',
        vr: 'SQ',
        vm: '1',
        name: 'PhysiciansReadingStudyIdentificationSequence'
    },
    '(0008,1070)': {
        tag: '(0008,1070)',
        vr: 'PN',
        vm: '1-n',
        name: 'OperatorsName'
    },
    '(0008,1072)': {
        tag: '(0008,1072)',
        vr: 'SQ',
        vm: '1',
        name: 'OperatorIdentificationSequence'
    },
    '(0008,1080)': {
        tag: '(0008,1080)',
        vr: 'LO',
        vm: '1-n',
        name: 'AdmittingDiagnosesDescription'
    },
    '(0008,1084)': {
        tag: '(0008,1084)',
        vr: 'SQ',
        vm: '1',
        name: 'AdmittingDiagnosesCodeSequence'
    },
    '(0008,1090)': {
        tag: '(0008,1090)',
        vr: 'LO',
        vm: '1',
        name: 'ManufacturerModelName'
    },
    '(0008,1100)': {
        tag: '(0008,1100)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedResultsSequence'
    },
    '(0008,1110)': {
        tag: '(0008,1110)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedStudySequence'
    },
    '(0008,1111)': {
        tag: '(0008,1111)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPerformedProcedureStepSequence'
    },
    '(0008,1115)': {
        tag: '(0008,1115)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedSeriesSequence'
    },
    '(0008,1120)': {
        tag: '(0008,1120)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPatientSequence'
    },
    '(0008,1125)': {
        tag: '(0008,1125)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedVisitSequence'
    },
    '(0008,1130)': {
        tag: '(0008,1130)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedOverlaySequence'
    },
    '(0008,1134)': {
        tag: '(0008,1134)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedStereometricInstanceSequence'
    },
    '(0008,113A)': {
        tag: '(0008,113A)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedWaveformSequence'
    },
    '(0008,1140)': {
        tag: '(0008,1140)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageSequence'
    },
    '(0008,1145)': {
        tag: '(0008,1145)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedCurveSequence'
    },
    '(0008,114A)': {
        tag: '(0008,114A)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedInstanceSequence'
    },
    '(0008,114B)': {
        tag: '(0008,114B)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedRealWorldValueMappingInstanceSequence'
    },
    '(0008,1150)': {
        tag: '(0008,1150)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedSOPClassUID'
    },
    '(0008,1155)': {
        tag: '(0008,1155)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedSOPInstanceUID'
    },
    '(0008,115A)': {
        tag: '(0008,115A)',
        vr: 'UI',
        vm: '1-n',
        name: 'SOPClassesSupported'
    },
    '(0008,1160)': {
        tag: '(0008,1160)',
        vr: 'IS',
        vm: '1-n',
        name: 'ReferencedFrameNumber'
    },
    '(0008,1161)': {
        tag: '(0008,1161)',
        vr: 'UL',
        vm: '1-n',
        name: 'SimpleFrameList'
    },
    '(0008,1162)': {
        tag: '(0008,1162)',
        vr: 'UL',
        vm: '3-3n',
        name: 'CalculatedFrameList'
    },
    '(0008,1163)': {
        tag: '(0008,1163)',
        vr: 'FD',
        vm: '2',
        name: 'TimeRange'
    },
    '(0008,1164)': {
        tag: '(0008,1164)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameExtractionSequence'
    },
    '(0008,1167)': {
        tag: '(0008,1167)',
        vr: 'UI',
        vm: '1',
        name: 'MultiFrameSourceSOPInstanceUID'
    },
    '(0008,1195)': {
        tag: '(0008,1195)',
        vr: 'UI',
        vm: '1',
        name: 'TransactionUID'
    },
    '(0008,1197)': {
        tag: '(0008,1197)',
        vr: 'US',
        vm: '1',
        name: 'FailureReason'
    },
    '(0008,1198)': {
        tag: '(0008,1198)',
        vr: 'SQ',
        vm: '1',
        name: 'FailedSOPSequence'
    },
    '(0008,1199)': {
        tag: '(0008,1199)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedSOPSequence'
    },
    '(0008,1200)': {
        tag: '(0008,1200)',
        vr: 'SQ',
        vm: '1',
        name: 'StudiesContainingOtherReferencedInstancesSequence'
    },
    '(0008,1250)': {
        tag: '(0008,1250)',
        vr: 'SQ',
        vm: '1',
        name: 'RelatedSeriesSequence'
    },
    '(0008,2110)': {
        tag: '(0008,2110)',
        vr: 'CS',
        vm: '1',
        name: 'LossyImageCompressionRetired'
    },
    '(0008,2111)': {
        tag: '(0008,2111)',
        vr: 'ST',
        vm: '1',
        name: 'DerivationDescription'
    },
    '(0008,2112)': {
        tag: '(0008,2112)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceImageSequence'
    },
    '(0008,2120)': {
        tag: '(0008,2120)',
        vr: 'SH',
        vm: '1',
        name: 'StageName'
    },
    '(0008,2122)': {
        tag: '(0008,2122)',
        vr: 'IS',
        vm: '1',
        name: 'StageNumber'
    },
    '(0008,2124)': {
        tag: '(0008,2124)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfStages'
    },
    '(0008,2127)': {
        tag: '(0008,2127)',
        vr: 'SH',
        vm: '1',
        name: 'ViewName'
    },
    '(0008,2128)': {
        tag: '(0008,2128)',
        vr: 'IS',
        vm: '1',
        name: 'ViewNumber'
    },
    '(0008,2129)': {
        tag: '(0008,2129)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfEventTimers'
    },
    '(0008,212A)': {
        tag: '(0008,212A)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfViewsInStage'
    },
    '(0008,2130)': {
        tag: '(0008,2130)',
        vr: 'DS',
        vm: '1-n',
        name: 'EventElapsedTimes'
    },
    '(0008,2132)': {
        tag: '(0008,2132)',
        vr: 'LO',
        vm: '1-n',
        name: 'EventTimerNames'
    },
    '(0008,2133)': {
        tag: '(0008,2133)',
        vr: 'SQ',
        vm: '1',
        name: 'EventTimerSequence'
    },
    '(0008,2134)': {
        tag: '(0008,2134)',
        vr: 'FD',
        vm: '1',
        name: 'EventTimeOffset'
    },
    '(0008,2135)': {
        tag: '(0008,2135)',
        vr: 'SQ',
        vm: '1',
        name: 'EventCodeSequence'
    },
    '(0008,2142)': {
        tag: '(0008,2142)',
        vr: 'IS',
        vm: '1',
        name: 'StartTrim'
    },
    '(0008,2143)': {
        tag: '(0008,2143)',
        vr: 'IS',
        vm: '1',
        name: 'StopTrim'
    },
    '(0008,2144)': {
        tag: '(0008,2144)',
        vr: 'IS',
        vm: '1',
        name: 'RecommendedDisplayFrameRate'
    },
    '(0008,2200)': {
        tag: '(0008,2200)',
        vr: 'CS',
        vm: '1',
        name: 'TransducerPosition'
    },
    '(0008,2204)': {
        tag: '(0008,2204)',
        vr: 'CS',
        vm: '1',
        name: 'TransducerOrientation'
    },
    '(0008,2208)': {
        tag: '(0008,2208)',
        vr: 'CS',
        vm: '1',
        name: 'AnatomicStructure'
    },
    '(0008,2218)': {
        tag: '(0008,2218)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicRegionSequence'
    },
    '(0008,2220)': {
        tag: '(0008,2220)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicRegionModifierSequence'
    },
    '(0008,2228)': {
        tag: '(0008,2228)',
        vr: 'SQ',
        vm: '1',
        name: 'PrimaryAnatomicStructureSequence'
    },
    '(0008,2229)': {
        tag: '(0008,2229)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicStructureSpaceOrRegionSequence'
    },
    '(0008,2230)': {
        tag: '(0008,2230)',
        vr: 'SQ',
        vm: '1',
        name: 'PrimaryAnatomicStructureModifierSequence'
    },
    '(0008,2240)': {
        tag: '(0008,2240)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerPositionSequence'
    },
    '(0008,2242)': {
        tag: '(0008,2242)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerPositionModifierSequence'
    },
    '(0008,2244)': {
        tag: '(0008,2244)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerOrientationSequence'
    },
    '(0008,2246)': {
        tag: '(0008,2246)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerOrientationModifierSequence'
    },
    '(0008,2251)': {
        tag: '(0008,2251)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicStructureSpaceOrRegionCodeSequenceTrial'
    },
    '(0008,2253)': {
        tag: '(0008,2253)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicPortalOfEntranceCodeSequenceTrial'
    },
    '(0008,2255)': {
        tag: '(0008,2255)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicApproachDirectionCodeSequenceTrial'
    },
    '(0008,2256)': {
        tag: '(0008,2256)',
        vr: 'ST',
        vm: '1',
        name: 'AnatomicPerspectiveDescriptionTrial'
    },
    '(0008,2257)': {
        tag: '(0008,2257)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicPerspectiveCodeSequenceTrial'
    },
    '(0008,2258)': {
        tag: '(0008,2258)',
        vr: 'ST',
        vm: '1',
        name: 'AnatomicLocationOfExaminingInstrumentDescriptionTrial'
    },
    '(0008,2259)': {
        tag: '(0008,2259)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicLocationOfExaminingInstrumentCodeSequenceTrial'
    },
    '(0008,225A)': {
        tag: '(0008,225A)',
        vr: 'SQ',
        vm: '1',
        name: 'AnatomicStructureSpaceOrRegionModifierCodeSequenceTrial'
    },
    '(0008,225C)': {
        tag: '(0008,225C)',
        vr: 'SQ',
        vm: '1',
        name: 'OnAxisBackgroundAnatomicStructureCodeSequenceTrial'
    },
    '(0008,3001)': {
        tag: '(0008,3001)',
        vr: 'SQ',
        vm: '1',
        name: 'AlternateRepresentationSequence'
    },
    '(0008,3010)': {
        tag: '(0008,3010)',
        vr: 'UI',
        vm: '1',
        name: 'IrradiationEventUID'
    },
    '(0008,4000)': {
        tag: '(0008,4000)',
        vr: 'LT',
        vm: '1',
        name: 'IdentifyingComments'
    },
    '(0008,9007)': {
        tag: '(0008,9007)',
        vr: 'CS',
        vm: '4',
        name: 'FrameType'
    },
    '(0008,9092)': {
        tag: '(0008,9092)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageEvidenceSequence'
    },
    '(0008,9121)': {
        tag: '(0008,9121)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedRawDataSequence'
    },
    '(0008,9123)': {
        tag: '(0008,9123)',
        vr: 'UI',
        vm: '1',
        name: 'CreatorVersionUID'
    },
    '(0008,9124)': {
        tag: '(0008,9124)',
        vr: 'SQ',
        vm: '1',
        name: 'DerivationImageSequence'
    },
    '(0008,9154)': {
        tag: '(0008,9154)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceImageEvidenceSequence'
    },
    '(0008,9205)': {
        tag: '(0008,9205)',
        vr: 'CS',
        vm: '1',
        name: 'PixelPresentation'
    },
    '(0008,9206)': {
        tag: '(0008,9206)',
        vr: 'CS',
        vm: '1',
        name: 'VolumetricProperties'
    },
    '(0008,9207)': {
        tag: '(0008,9207)',
        vr: 'CS',
        vm: '1',
        name: 'VolumeBasedCalculationTechnique'
    },
    '(0008,9208)': {
        tag: '(0008,9208)',
        vr: 'CS',
        vm: '1',
        name: 'ComplexImageComponent'
    },
    '(0008,9209)': {
        tag: '(0008,9209)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionContrast'
    },
    '(0008,9215)': {
        tag: '(0008,9215)',
        vr: 'SQ',
        vm: '1',
        name: 'DerivationCodeSequence'
    },
    '(0008,9237)': {
        tag: '(0008,9237)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPresentationStateSequence'
    },
    '(0008,9410)': {
        tag: '(0008,9410)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedOtherPlaneSequence'
    },
    '(0008,9458)': {
        tag: '(0008,9458)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameDisplaySequence'
    },
    '(0008,9459)': {
        tag: '(0008,9459)',
        vr: 'FL',
        vm: '1',
        name: 'RecommendedDisplayFrameRateInFloat'
    },
    '(0008,9460)': {
        tag: '(0008,9460)',
        vr: 'CS',
        vm: '1',
        name: 'SkipFrameRangeFlag'
    },
    '(0010,0010)': {
        tag: '(0010,0010)',
        vr: 'PN',
        vm: '1',
        name: 'PatientName'
    },
    '(0010,0020)': {
        tag: '(0010,0020)',
        vr: 'LO',
        vm: '1',
        name: 'PatientID'
    },
    '(0010,0021)': {
        tag: '(0010,0021)',
        vr: 'LO',
        vm: '1',
        name: 'IssuerOfPatientID'
    },
    '(0010,0022)': {
        tag: '(0010,0022)',
        vr: 'CS',
        vm: '1',
        name: 'TypeOfPatientID'
    },
    '(0010,0024)': {
        tag: '(0010,0024)',
        vr: 'SQ',
        vm: '1',
        name: 'IssuerOfPatientIDQualifiersSequence'
    },
    '(0010,0030)': {
        tag: '(0010,0030)',
        vr: 'DA',
        vm: '1',
        name: 'PatientBirthDate'
    },
    '(0010,0032)': {
        tag: '(0010,0032)',
        vr: 'TM',
        vm: '1',
        name: 'PatientBirthTime'
    },
    '(0010,0040)': {
        tag: '(0010,0040)',
        vr: 'CS',
        vm: '1',
        name: 'PatientSex'
    },
    '(0010,0050)': {
        tag: '(0010,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientInsurancePlanCodeSequence'
    },
    '(0010,0101)': {
        tag: '(0010,0101)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientPrimaryLanguageCodeSequence'
    },
    '(0010,0102)': {
        tag: '(0010,0102)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientPrimaryLanguageModifierCodeSequence'
    },
    '(0010,1000)': {
        tag: '(0010,1000)',
        vr: 'LO',
        vm: '1-n',
        name: 'OtherPatientIDs'
    },
    '(0010,1001)': {
        tag: '(0010,1001)',
        vr: 'PN',
        vm: '1-n',
        name: 'OtherPatientNames'
    },
    '(0010,1002)': {
        tag: '(0010,1002)',
        vr: 'SQ',
        vm: '1',
        name: 'OtherPatientIDsSequence'
    },
    '(0010,1005)': {
        tag: '(0010,1005)',
        vr: 'PN',
        vm: '1',
        name: 'PatientBirthName'
    },
    '(0010,1010)': {
        tag: '(0010,1010)',
        vr: 'AS',
        vm: '1',
        name: 'PatientAge'
    },
    '(0010,1020)': {
        tag: '(0010,1020)',
        vr: 'DS',
        vm: '1',
        name: 'PatientSize'
    },
    '(0010,1021)': {
        tag: '(0010,1021)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientSizeCodeSequence'
    },
    '(0010,1030)': {
        tag: '(0010,1030)',
        vr: 'DS',
        vm: '1',
        name: 'PatientWeight'
    },
    '(0010,1040)': {
        tag: '(0010,1040)',
        vr: 'LO',
        vm: '1',
        name: 'PatientAddress'
    },
    '(0010,1050)': {
        tag: '(0010,1050)',
        vr: 'LO',
        vm: '1-n',
        name: 'InsurancePlanIdentification'
    },
    '(0010,1060)': {
        tag: '(0010,1060)',
        vr: 'PN',
        vm: '1',
        name: 'PatientMotherBirthName'
    },
    '(0010,1080)': {
        tag: '(0010,1080)',
        vr: 'LO',
        vm: '1',
        name: 'MilitaryRank'
    },
    '(0010,1081)': {
        tag: '(0010,1081)',
        vr: 'LO',
        vm: '1',
        name: 'BranchOfService'
    },
    '(0010,1090)': {
        tag: '(0010,1090)',
        vr: 'LO',
        vm: '1',
        name: 'MedicalRecordLocator'
    },
    '(0010,2000)': {
        tag: '(0010,2000)',
        vr: 'LO',
        vm: '1-n',
        name: 'MedicalAlerts'
    },
    '(0010,2110)': {
        tag: '(0010,2110)',
        vr: 'LO',
        vm: '1-n',
        name: 'Allergies'
    },
    '(0010,2150)': {
        tag: '(0010,2150)',
        vr: 'LO',
        vm: '1',
        name: 'CountryOfResidence'
    },
    '(0010,2152)': {
        tag: '(0010,2152)',
        vr: 'LO',
        vm: '1',
        name: 'RegionOfResidence'
    },
    '(0010,2154)': {
        tag: '(0010,2154)',
        vr: 'SH',
        vm: '1-n',
        name: 'PatientTelephoneNumbers'
    },
    '(0010,2160)': {
        tag: '(0010,2160)',
        vr: 'SH',
        vm: '1',
        name: 'EthnicGroup'
    },
    '(0010,2180)': {
        tag: '(0010,2180)',
        vr: 'SH',
        vm: '1',
        name: 'Occupation'
    },
    '(0010,21A0)': {
        tag: '(0010,21A0)',
        vr: 'CS',
        vm: '1',
        name: 'SmokingStatus'
    },
    '(0010,21B0)': {
        tag: '(0010,21B0)',
        vr: 'LT',
        vm: '1',
        name: 'AdditionalPatientHistory'
    },
    '(0010,21C0)': {
        tag: '(0010,21C0)',
        vr: 'US',
        vm: '1',
        name: 'PregnancyStatus'
    },
    '(0010,21D0)': {
        tag: '(0010,21D0)',
        vr: 'DA',
        vm: '1',
        name: 'LastMenstrualDate'
    },
    '(0010,21F0)': {
        tag: '(0010,21F0)',
        vr: 'LO',
        vm: '1',
        name: 'PatientReligiousPreference'
    },
    '(0010,2201)': {
        tag: '(0010,2201)',
        vr: 'LO',
        vm: '1',
        name: 'PatientSpeciesDescription'
    },
    '(0010,2202)': {
        tag: '(0010,2202)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientSpeciesCodeSequence'
    },
    '(0010,2203)': {
        tag: '(0010,2203)',
        vr: 'CS',
        vm: '1',
        name: 'PatientSexNeutered'
    },
    '(0010,2210)': {
        tag: '(0010,2210)',
        vr: 'CS',
        vm: '1',
        name: 'AnatomicalOrientationType'
    },
    '(0010,2292)': {
        tag: '(0010,2292)',
        vr: 'LO',
        vm: '1',
        name: 'PatientBreedDescription'
    },
    '(0010,2293)': {
        tag: '(0010,2293)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientBreedCodeSequence'
    },
    '(0010,2294)': {
        tag: '(0010,2294)',
        vr: 'SQ',
        vm: '1',
        name: 'BreedRegistrationSequence'
    },
    '(0010,2295)': {
        tag: '(0010,2295)',
        vr: 'LO',
        vm: '1',
        name: 'BreedRegistrationNumber'
    },
    '(0010,2296)': {
        tag: '(0010,2296)',
        vr: 'SQ',
        vm: '1',
        name: 'BreedRegistryCodeSequence'
    },
    '(0010,2297)': {
        tag: '(0010,2297)',
        vr: 'PN',
        vm: '1',
        name: 'ResponsiblePerson'
    },
    '(0010,2298)': {
        tag: '(0010,2298)',
        vr: 'CS',
        vm: '1',
        name: 'ResponsiblePersonRole'
    },
    '(0010,2299)': {
        tag: '(0010,2299)',
        vr: 'LO',
        vm: '1',
        name: 'ResponsibleOrganization'
    },
    '(0010,4000)': {
        tag: '(0010,4000)',
        vr: 'LT',
        vm: '1',
        name: 'PatientComments'
    },
    '(0010,9431)': {
        tag: '(0010,9431)',
        vr: 'FL',
        vm: '1',
        name: 'ExaminedBodyThickness'
    },
    '(0012,0010)': {
        tag: '(0012,0010)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSponsorName'
    },
    '(0012,0020)': {
        tag: '(0012,0020)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialProtocolID'
    },
    '(0012,0021)': {
        tag: '(0012,0021)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialProtocolName'
    },
    '(0012,0030)': {
        tag: '(0012,0030)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSiteID'
    },
    '(0012,0031)': {
        tag: '(0012,0031)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSiteName'
    },
    '(0012,0040)': {
        tag: '(0012,0040)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSubjectID'
    },
    '(0012,0042)': {
        tag: '(0012,0042)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSubjectReadingID'
    },
    '(0012,0050)': {
        tag: '(0012,0050)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialTimePointID'
    },
    '(0012,0051)': {
        tag: '(0012,0051)',
        vr: 'ST',
        vm: '1',
        name: 'ClinicalTrialTimePointDescription'
    },
    '(0012,0060)': {
        tag: '(0012,0060)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialCoordinatingCenterName'
    },
    '(0012,0062)': {
        tag: '(0012,0062)',
        vr: 'CS',
        vm: '1',
        name: 'PatientIdentityRemoved'
    },
    '(0012,0063)': {
        tag: '(0012,0063)',
        vr: 'LO',
        vm: '1-n',
        name: 'DeidentificationMethod'
    },
    '(0012,0064)': {
        tag: '(0012,0064)',
        vr: 'SQ',
        vm: '1',
        name: 'DeidentificationMethodCodeSequence'
    },
    '(0012,0071)': {
        tag: '(0012,0071)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSeriesID'
    },
    '(0012,0072)': {
        tag: '(0012,0072)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialSeriesDescription'
    },
    '(0012,0081)': {
        tag: '(0012,0081)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialProtocolEthicsCommitteeName'
    },
    '(0012,0082)': {
        tag: '(0012,0082)',
        vr: 'LO',
        vm: '1',
        name: 'ClinicalTrialProtocolEthicsCommitteeApprovalNumber'
    },
    '(0012,0083)': {
        tag: '(0012,0083)',
        vr: 'SQ',
        vm: '1',
        name: 'ConsentForClinicalTrialUseSequence'
    },
    '(0012,0084)': {
        tag: '(0012,0084)',
        vr: 'CS',
        vm: '1',
        name: 'DistributionType'
    },
    '(0012,0085)': {
        tag: '(0012,0085)',
        vr: 'CS',
        vm: '1',
        name: 'ConsentForDistributionFlag'
    },
    '(0014,0023)': {
        tag: '(0014,0023)',
        vr: 'ST',
        vm: '1-n',
        name: 'CADFileFormat'
    },
    '(0014,0024)': {
        tag: '(0014,0024)',
        vr: 'ST',
        vm: '1-n',
        name: 'ComponentReferenceSystem'
    },
    '(0014,0025)': {
        tag: '(0014,0025)',
        vr: 'ST',
        vm: '1-n',
        name: 'ComponentManufacturingProcedure'
    },
    '(0014,0028)': {
        tag: '(0014,0028)',
        vr: 'ST',
        vm: '1-n',
        name: 'ComponentManufacturer'
    },
    '(0014,0030)': {
        tag: '(0014,0030)',
        vr: 'DS',
        vm: '1-n',
        name: 'MaterialThickness'
    },
    '(0014,0032)': {
        tag: '(0014,0032)',
        vr: 'DS',
        vm: '1-n',
        name: 'MaterialPipeDiameter'
    },
    '(0014,0034)': {
        tag: '(0014,0034)',
        vr: 'DS',
        vm: '1-n',
        name: 'MaterialIsolationDiameter'
    },
    '(0014,0042)': {
        tag: '(0014,0042)',
        vr: 'ST',
        vm: '1-n',
        name: 'MaterialGrade'
    },
    '(0014,0044)': {
        tag: '(0014,0044)',
        vr: 'ST',
        vm: '1-n',
        name: 'MaterialPropertiesFileID'
    },
    '(0014,0045)': {
        tag: '(0014,0045)',
        vr: 'ST',
        vm: '1-n',
        name: 'MaterialPropertiesFileFormat'
    },
    '(0014,0046)': {
        tag: '(0014,0046)',
        vr: 'LT',
        vm: '1',
        name: 'MaterialNotes'
    },
    '(0014,0050)': {
        tag: '(0014,0050)',
        vr: 'CS',
        vm: '1',
        name: 'ComponentShape'
    },
    '(0014,0052)': {
        tag: '(0014,0052)',
        vr: 'CS',
        vm: '1',
        name: 'CurvatureType'
    },
    '(0014,0054)': {
        tag: '(0014,0054)',
        vr: 'DS',
        vm: '1',
        name: 'OuterDiameter'
    },
    '(0014,0056)': {
        tag: '(0014,0056)',
        vr: 'DS',
        vm: '1',
        name: 'InnerDiameter'
    },
    '(0014,1010)': {
        tag: '(0014,1010)',
        vr: 'ST',
        vm: '1',
        name: 'ActualEnvironmentalConditions'
    },
    '(0014,1020)': {
        tag: '(0014,1020)',
        vr: 'DA',
        vm: '1',
        name: 'ExpiryDate'
    },
    '(0014,1040)': {
        tag: '(0014,1040)',
        vr: 'ST',
        vm: '1',
        name: 'EnvironmentalConditions'
    },
    '(0014,2002)': {
        tag: '(0014,2002)',
        vr: 'SQ',
        vm: '1',
        name: 'EvaluatorSequence'
    },
    '(0014,2004)': {
        tag: '(0014,2004)',
        vr: 'IS',
        vm: '1',
        name: 'EvaluatorNumber'
    },
    '(0014,2006)': {
        tag: '(0014,2006)',
        vr: 'PN',
        vm: '1',
        name: 'EvaluatorName'
    },
    '(0014,2008)': {
        tag: '(0014,2008)',
        vr: 'IS',
        vm: '1',
        name: 'EvaluationAttempt'
    },
    '(0014,2012)': {
        tag: '(0014,2012)',
        vr: 'SQ',
        vm: '1',
        name: 'IndicationSequence'
    },
    '(0014,2014)': {
        tag: '(0014,2014)',
        vr: 'IS',
        vm: '1',
        name: 'IndicationNumber '
    },
    '(0014,2016)': {
        tag: '(0014,2016)',
        vr: 'SH',
        vm: '1',
        name: 'IndicationLabel'
    },
    '(0014,2018)': {
        tag: '(0014,2018)',
        vr: 'ST',
        vm: '1',
        name: 'IndicationDescription'
    },
    '(0014,201A)': {
        tag: '(0014,201A)',
        vr: 'CS',
        vm: '1-n',
        name: 'IndicationType'
    },
    '(0014,201C)': {
        tag: '(0014,201C)',
        vr: 'CS',
        vm: '1',
        name: 'IndicationDisposition'
    },
    '(0014,201E)': {
        tag: '(0014,201E)',
        vr: 'SQ',
        vm: '1',
        name: 'IndicationROISequence'
    },
    '(0014,2030)': {
        tag: '(0014,2030)',
        vr: 'SQ',
        vm: '1',
        name: 'IndicationPhysicalPropertySequence'
    },
    '(0014,2032)': {
        tag: '(0014,2032)',
        vr: 'SH',
        vm: '1',
        name: 'PropertyLabel'
    },
    '(0014,2202)': {
        tag: '(0014,2202)',
        vr: 'IS',
        vm: '1',
        name: 'CoordinateSystemNumberOfAxes '
    },
    '(0014,2204)': {
        tag: '(0014,2204)',
        vr: 'SQ',
        vm: '1',
        name: 'CoordinateSystemAxesSequence'
    },
    '(0014,2206)': {
        tag: '(0014,2206)',
        vr: 'ST',
        vm: '1',
        name: 'CoordinateSystemAxisDescription'
    },
    '(0014,2208)': {
        tag: '(0014,2208)',
        vr: 'CS',
        vm: '1',
        name: 'CoordinateSystemDataSetMapping'
    },
    '(0014,220A)': {
        tag: '(0014,220A)',
        vr: 'IS',
        vm: '1',
        name: 'CoordinateSystemAxisNumber'
    },
    '(0014,220C)': {
        tag: '(0014,220C)',
        vr: 'CS',
        vm: '1',
        name: 'CoordinateSystemAxisType'
    },
    '(0014,220E)': {
        tag: '(0014,220E)',
        vr: 'CS',
        vm: '1',
        name: 'CoordinateSystemAxisUnits'
    },
    '(0014,2210)': {
        tag: '(0014,2210)',
        vr: 'OB',
        vm: '1',
        name: 'CoordinateSystemAxisValues'
    },
    '(0014,2220)': {
        tag: '(0014,2220)',
        vr: 'SQ',
        vm: '1',
        name: 'CoordinateSystemTransformSequence'
    },
    '(0014,2222)': {
        tag: '(0014,2222)',
        vr: 'ST',
        vm: '1',
        name: 'TransformDescription'
    },
    '(0014,2224)': {
        tag: '(0014,2224)',
        vr: 'IS',
        vm: '1',
        name: 'TransformNumberOfAxes'
    },
    '(0014,2226)': {
        tag: '(0014,2226)',
        vr: 'IS',
        vm: '1-n',
        name: 'TransformOrderOfAxes'
    },
    '(0014,2228)': {
        tag: '(0014,2228)',
        vr: 'CS',
        vm: '1',
        name: 'TransformedAxisUnits'
    },
    '(0014,222A)': {
        tag: '(0014,222A)',
        vr: 'DS',
        vm: '1-n',
        name: 'CoordinateSystemTransformRotationAndScaleMatrix'
    },
    '(0014,222C)': {
        tag: '(0014,222C)',
        vr: 'DS',
        vm: '1-n',
        name: 'CoordinateSystemTransformTranslationMatrix'
    },
    '(0014,3011)': {
        tag: '(0014,3011)',
        vr: 'DS',
        vm: '1',
        name: 'InternalDetectorFrameTime'
    },
    '(0014,3012)': {
        tag: '(0014,3012)',
        vr: 'DS',
        vm: '1',
        name: 'NumberOfFramesIntegrated'
    },
    '(0014,3020)': {
        tag: '(0014,3020)',
        vr: 'SQ',
        vm: '1',
        name: 'DetectorTemperatureSequence'
    },
    '(0014,3022)': {
        tag: '(0014,3022)',
        vr: 'DS',
        vm: '1',
        name: 'SensorName'
    },
    '(0014,3024)': {
        tag: '(0014,3024)',
        vr: 'DS',
        vm: '1',
        name: 'HorizontalOffsetOfSensor'
    },
    '(0014,3026)': {
        tag: '(0014,3026)',
        vr: 'DS',
        vm: '1',
        name: 'VerticalOffsetOfSensor'
    },
    '(0014,3028)': {
        tag: '(0014,3028)',
        vr: 'DS',
        vm: '1',
        name: 'SensorTemperature'
    },
    '(0014,3040)': {
        tag: '(0014,3040)',
        vr: 'SQ',
        vm: '1',
        name: 'DarkCurrentSequence'
    },
    '(0014,3050)': {
        tag: '(0014,3050)',
        vr: 'OB|OW',
        vm: '1',
        name: 'DarkCurrentCounts'
    },
    '(0014,3060)': {
        tag: '(0014,3060)',
        vr: 'SQ',
        vm: '1',
        name: 'GainCorrectionReferenceSequence'
    },
    '(0014,3070)': {
        tag: '(0014,3070)',
        vr: 'OB|OW',
        vm: '1',
        name: 'AirCounts'
    },
    '(0014,3071)': {
        tag: '(0014,3071)',
        vr: 'DS',
        vm: '1',
        name: 'KVUsedInGainCalibration'
    },
    '(0014,3072)': {
        tag: '(0014,3072)',
        vr: 'DS',
        vm: '1',
        name: 'MAUsedInGainCalibration'
    },
    '(0014,3073)': {
        tag: '(0014,3073)',
        vr: 'DS',
        vm: '1',
        name: 'NumberOfFramesUsedForIntegration'
    },
    '(0014,3074)': {
        tag: '(0014,3074)',
        vr: 'LO',
        vm: '1',
        name: 'FilterMaterialUsedInGainCalibration'
    },
    '(0014,3075)': {
        tag: '(0014,3075)',
        vr: 'DS',
        vm: '1',
        name: 'FilterThicknessUsedInGainCalibration'
    },
    '(0014,3076)': {
        tag: '(0014,3076)',
        vr: 'DA',
        vm: '1',
        name: 'DateOfGainCalibration'
    },
    '(0014,3077)': {
        tag: '(0014,3077)',
        vr: 'TM',
        vm: '1',
        name: 'TimeOfGainCalibration'
    },
    '(0014,3080)': {
        tag: '(0014,3080)',
        vr: 'OB',
        vm: '1',
        name: 'BadPixelImage'
    },
    '(0014,3099)': {
        tag: '(0014,3099)',
        vr: 'LT',
        vm: '1',
        name: 'CalibrationNotes'
    },
    '(0014,4002)': {
        tag: '(0014,4002)',
        vr: 'SQ',
        vm: '1',
        name: 'PulserEquipmentSequence'
    },
    '(0014,4004)': {
        tag: '(0014,4004)',
        vr: 'CS',
        vm: '1',
        name: 'PulserType'
    },
    '(0014,4006)': {
        tag: '(0014,4006)',
        vr: 'LT',
        vm: '1',
        name: 'PulserNotes'
    },
    '(0014,4008)': {
        tag: '(0014,4008)',
        vr: 'SQ',
        vm: '1',
        name: 'ReceiverEquipmentSequence'
    },
    '(0014,400A)': {
        tag: '(0014,400A)',
        vr: 'CS',
        vm: '1',
        name: 'AmplifierType'
    },
    '(0014,400C)': {
        tag: '(0014,400C)',
        vr: 'LT',
        vm: '1',
        name: 'ReceiverNotes'
    },
    '(0014,400E)': {
        tag: '(0014,400E)',
        vr: 'SQ',
        vm: '1',
        name: 'PreAmplifierEquipmentSequence'
    },
    '(0014,400F)': {
        tag: '(0014,400F)',
        vr: 'LT',
        vm: '1',
        name: 'PreAmplifierNotes'
    },
    '(0014,4010)': {
        tag: '(0014,4010)',
        vr: 'SQ',
        vm: '1',
        name: 'TransmitTransducerSequence'
    },
    '(0014,4011)': {
        tag: '(0014,4011)',
        vr: 'SQ',
        vm: '1',
        name: 'ReceiveTransducerSequence'
    },
    '(0014,4012)': {
        tag: '(0014,4012)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfElements'
    },
    '(0014,4013)': {
        tag: '(0014,4013)',
        vr: 'CS',
        vm: '1',
        name: 'ElementShape'
    },
    '(0014,4014)': {
        tag: '(0014,4014)',
        vr: 'DS',
        vm: '1',
        name: 'ElementDimensionA'
    },
    '(0014,4015)': {
        tag: '(0014,4015)',
        vr: 'DS',
        vm: '1',
        name: 'ElementDimensionB'
    },
    '(0014,4016)': {
        tag: '(0014,4016)',
        vr: 'DS',
        vm: '1',
        name: 'ElementPitch'
    },
    '(0014,4017)': {
        tag: '(0014,4017)',
        vr: 'DS',
        vm: '1',
        name: 'MeasuredBeamDimensionA'
    },
    '(0014,4018)': {
        tag: '(0014,4018)',
        vr: 'DS',
        vm: '1',
        name: 'MeasuredBeamDimensionB'
    },
    '(0014,4019)': {
        tag: '(0014,4019)',
        vr: 'DS',
        vm: '1',
        name: 'LocationOfMeasuredBeamDiameter'
    },
    '(0014,401A)': {
        tag: '(0014,401A)',
        vr: 'DS',
        vm: '1',
        name: 'NominalFrequency'
    },
    '(0014,401B)': {
        tag: '(0014,401B)',
        vr: 'DS',
        vm: '1',
        name: 'MeasuredCenterFrequency'
    },
    '(0014,401C)': {
        tag: '(0014,401C)',
        vr: 'DS',
        vm: '1',
        name: 'MeasuredBandwidth'
    },
    '(0014,4020)': {
        tag: '(0014,4020)',
        vr: 'SQ',
        vm: '1',
        name: 'PulserSettingsSequence'
    },
    '(0014,4022)': {
        tag: '(0014,4022)',
        vr: 'DS',
        vm: '1',
        name: 'PulseWidth'
    },
    '(0014,4024)': {
        tag: '(0014,4024)',
        vr: 'DS',
        vm: '1',
        name: 'ExcitationFrequency'
    },
    '(0014,4026)': {
        tag: '(0014,4026)',
        vr: 'CS',
        vm: '1',
        name: 'ModulationType'
    },
    '(0014,4028)': {
        tag: '(0014,4028)',
        vr: 'DS',
        vm: '1',
        name: 'Damping'
    },
    '(0014,4030)': {
        tag: '(0014,4030)',
        vr: 'SQ',
        vm: '1',
        name: 'ReceiverSettingsSequence'
    },
    '(0014,4031)': {
        tag: '(0014,4031)',
        vr: 'DS',
        vm: '1',
        name: 'AcquiredSoundpathLength'
    },
    '(0014,4032)': {
        tag: '(0014,4032)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionCompressionType'
    },
    '(0014,4033)': {
        tag: '(0014,4033)',
        vr: 'IS',
        vm: '1',
        name: 'AcquisitionSampleSize'
    },
    '(0014,4034)': {
        tag: '(0014,4034)',
        vr: 'DS',
        vm: '1',
        name: 'RectifierSmoothing'
    },
    '(0014,4035)': {
        tag: '(0014,4035)',
        vr: 'SQ',
        vm: '1',
        name: 'DACSequence'
    },
    '(0014,4036)': {
        tag: '(0014,4036)',
        vr: 'CS',
        vm: '1',
        name: 'DACType'
    },
    '(0014,4038)': {
        tag: '(0014,4038)',
        vr: 'DS',
        vm: '1-n',
        name: 'DACGainPoints'
    },
    '(0014,403A)': {
        tag: '(0014,403A)',
        vr: 'DS',
        vm: '1-n',
        name: 'DACTimePoints'
    },
    '(0014,403C)': {
        tag: '(0014,403C)',
        vr: 'DS',
        vm: '1-n',
        name: 'DACAmplitude'
    },
    '(0014,4040)': {
        tag: '(0014,4040)',
        vr: 'SQ',
        vm: '1',
        name: 'PreAmplifierSettingsSequence'
    },
    '(0014,4050)': {
        tag: '(0014,4050)',
        vr: 'SQ',
        vm: '1',
        name: 'TransmitTransducerSettingsSequence'
    },
    '(0014,4051)': {
        tag: '(0014,4051)',
        vr: 'SQ',
        vm: '1',
        name: 'ReceiveTransducerSettingsSequence'
    },
    '(0014,4052)': {
        tag: '(0014,4052)',
        vr: 'DS',
        vm: '1',
        name: 'IncidentAngle'
    },
    '(0014,4054)': {
        tag: '(0014,4054)',
        vr: 'ST',
        vm: '1',
        name: 'CouplingTechnique'
    },
    '(0014,4056)': {
        tag: '(0014,4056)',
        vr: 'ST',
        vm: '1',
        name: 'CouplingMedium'
    },
    '(0014,4057)': {
        tag: '(0014,4057)',
        vr: 'DS',
        vm: '1',
        name: 'CouplingVelocity'
    },
    '(0014,4058)': {
        tag: '(0014,4058)',
        vr: 'DS',
        vm: '1',
        name: 'CrystalCenterLocationX'
    },
    '(0014,4059)': {
        tag: '(0014,4059)',
        vr: 'DS',
        vm: '1',
        name: 'CrystalCenterLocationZ'
    },
    '(0014,405A)': {
        tag: '(0014,405A)',
        vr: 'DS',
        vm: '1',
        name: 'SoundPathLength'
    },
    '(0014,405C)': {
        tag: '(0014,405C)',
        vr: 'ST',
        vm: '1',
        name: 'DelayLawIdentifier'
    },
    '(0014,4060)': {
        tag: '(0014,4060)',
        vr: 'SQ',
        vm: '1',
        name: 'GateSettingsSequence'
    },
    '(0014,4062)': {
        tag: '(0014,4062)',
        vr: 'DS',
        vm: '1',
        name: 'GateThreshold'
    },
    '(0014,4064)': {
        tag: '(0014,4064)',
        vr: 'DS',
        vm: '1',
        name: 'VelocityOfSound'
    },
    '(0014,4070)': {
        tag: '(0014,4070)',
        vr: 'SQ',
        vm: '1',
        name: 'CalibrationSettingsSequence'
    },
    '(0014,4072)': {
        tag: '(0014,4072)',
        vr: 'ST',
        vm: '1',
        name: 'CalibrationProcedure'
    },
    '(0014,4074)': {
        tag: '(0014,4074)',
        vr: 'SH',
        vm: '1',
        name: 'ProcedureVersion'
    },
    '(0014,4076)': {
        tag: '(0014,4076)',
        vr: 'DA',
        vm: '1',
        name: 'ProcedureCreationDate'
    },
    '(0014,4078)': {
        tag: '(0014,4078)',
        vr: 'DA',
        vm: '1',
        name: 'ProcedureExpirationDate'
    },
    '(0014,407A)': {
        tag: '(0014,407A)',
        vr: 'DA',
        vm: '1',
        name: 'ProcedureLastModifiedDate'
    },
    '(0014,407C)': {
        tag: '(0014,407C)',
        vr: 'TM',
        vm: '1-n',
        name: 'CalibrationTime'
    },
    '(0014,407E)': {
        tag: '(0014,407E)',
        vr: 'DA',
        vm: '1-n',
        name: 'CalibrationDate'
    },
    '(0014,5002)': {
        tag: '(0014,5002)',
        vr: 'IS',
        vm: '1',
        name: 'LINACEnergy'
    },
    '(0014,5004)': {
        tag: '(0014,5004)',
        vr: 'IS',
        vm: '1',
        name: 'LINACOutput'
    },
    '(0018,0010)': {
        tag: '(0018,0010)',
        vr: 'LO',
        vm: '1',
        name: 'ContrastBolusAgent'
    },
    '(0018,0012)': {
        tag: '(0018,0012)',
        vr: 'SQ',
        vm: '1',
        name: 'ContrastBolusAgentSequence'
    },
    '(0018,0014)': {
        tag: '(0018,0014)',
        vr: 'SQ',
        vm: '1',
        name: 'ContrastBolusAdministrationRouteSequence'
    },
    '(0018,0015)': {
        tag: '(0018,0015)',
        vr: 'CS',
        vm: '1',
        name: 'BodyPartExamined'
    },
    '(0018,0020)': {
        tag: '(0018,0020)',
        vr: 'CS',
        vm: '1-n',
        name: 'ScanningSequence'
    },
    '(0018,0021)': {
        tag: '(0018,0021)',
        vr: 'CS',
        vm: '1-n',
        name: 'SequenceVariant'
    },
    '(0018,0022)': {
        tag: '(0018,0022)',
        vr: 'CS',
        vm: '1-n',
        name: 'ScanOptions'
    },
    '(0018,0023)': {
        tag: '(0018,0023)',
        vr: 'CS',
        vm: '1',
        name: 'MRAcquisitionType'
    },
    '(0018,0024)': {
        tag: '(0018,0024)',
        vr: 'SH',
        vm: '1',
        name: 'SequenceName'
    },
    '(0018,0025)': {
        tag: '(0018,0025)',
        vr: 'CS',
        vm: '1',
        name: 'AngioFlag'
    },
    '(0018,0026)': {
        tag: '(0018,0026)',
        vr: 'SQ',
        vm: '1',
        name: 'InterventionDrugInformationSequence'
    },
    '(0018,0027)': {
        tag: '(0018,0027)',
        vr: 'TM',
        vm: '1',
        name: 'InterventionDrugStopTime'
    },
    '(0018,0028)': {
        tag: '(0018,0028)',
        vr: 'DS',
        vm: '1',
        name: 'InterventionDrugDose'
    },
    '(0018,0029)': {
        tag: '(0018,0029)',
        vr: 'SQ',
        vm: '1',
        name: 'InterventionDrugCodeSequence'
    },
    '(0018,002A)': {
        tag: '(0018,002A)',
        vr: 'SQ',
        vm: '1',
        name: 'AdditionalDrugSequence'
    },
    '(0018,0030)': {
        tag: '(0018,0030)',
        vr: 'LO',
        vm: '1-n',
        name: 'Radionuclide'
    },
    '(0018,0031)': {
        tag: '(0018,0031)',
        vr: 'LO',
        vm: '1',
        name: 'Radiopharmaceutical'
    },
    '(0018,0032)': {
        tag: '(0018,0032)',
        vr: 'DS',
        vm: '1',
        name: 'EnergyWindowCenterline'
    },
    '(0018,0033)': {
        tag: '(0018,0033)',
        vr: 'DS',
        vm: '1-n',
        name: 'EnergyWindowTotalWidth'
    },
    '(0018,0034)': {
        tag: '(0018,0034)',
        vr: 'LO',
        vm: '1',
        name: 'InterventionDrugName'
    },
    '(0018,0035)': {
        tag: '(0018,0035)',
        vr: 'TM',
        vm: '1',
        name: 'InterventionDrugStartTime'
    },
    '(0018,0036)': {
        tag: '(0018,0036)',
        vr: 'SQ',
        vm: '1',
        name: 'InterventionSequence'
    },
    '(0018,0037)': {
        tag: '(0018,0037)',
        vr: 'CS',
        vm: '1',
        name: 'TherapyType'
    },
    '(0018,0038)': {
        tag: '(0018,0038)',
        vr: 'CS',
        vm: '1',
        name: 'InterventionStatus'
    },
    '(0018,0039)': {
        tag: '(0018,0039)',
        vr: 'CS',
        vm: '1',
        name: 'TherapyDescription'
    },
    '(0018,003A)': {
        tag: '(0018,003A)',
        vr: 'ST',
        vm: '1',
        name: 'InterventionDescription'
    },
    '(0018,0040)': {
        tag: '(0018,0040)',
        vr: 'IS',
        vm: '1',
        name: 'CineRate'
    },
    '(0018,0042)': {
        tag: '(0018,0042)',
        vr: 'CS',
        vm: '1',
        name: 'InitialCineRunState'
    },
    '(0018,0050)': {
        tag: '(0018,0050)',
        vr: 'DS',
        vm: '1',
        name: 'SliceThickness'
    },
    '(0018,0060)': {
        tag: '(0018,0060)',
        vr: 'DS',
        vm: '1',
        name: 'KVP'
    },
    '(0018,0070)': {
        tag: '(0018,0070)',
        vr: 'IS',
        vm: '1',
        name: 'CountsAccumulated'
    },
    '(0018,0071)': {
        tag: '(0018,0071)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionTerminationCondition'
    },
    '(0018,0072)': {
        tag: '(0018,0072)',
        vr: 'DS',
        vm: '1',
        name: 'EffectiveDuration'
    },
    '(0018,0073)': {
        tag: '(0018,0073)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionStartCondition'
    },
    '(0018,0074)': {
        tag: '(0018,0074)',
        vr: 'IS',
        vm: '1',
        name: 'AcquisitionStartConditionData'
    },
    '(0018,0075)': {
        tag: '(0018,0075)',
        vr: 'IS',
        vm: '1',
        name: 'AcquisitionTerminationConditionData'
    },
    '(0018,0080)': {
        tag: '(0018,0080)',
        vr: 'DS',
        vm: '1',
        name: 'RepetitionTime'
    },
    '(0018,0081)': {
        tag: '(0018,0081)',
        vr: 'DS',
        vm: '1',
        name: 'EchoTime'
    },
    '(0018,0082)': {
        tag: '(0018,0082)',
        vr: 'DS',
        vm: '1',
        name: 'InversionTime'
    },
    '(0018,0083)': {
        tag: '(0018,0083)',
        vr: 'DS',
        vm: '1',
        name: 'NumberOfAverages'
    },
    '(0018,0084)': {
        tag: '(0018,0084)',
        vr: 'DS',
        vm: '1',
        name: 'ImagingFrequency'
    },
    '(0018,0085)': {
        tag: '(0018,0085)',
        vr: 'SH',
        vm: '1',
        name: 'ImagedNucleus'
    },
    '(0018,0086)': {
        tag: '(0018,0086)',
        vr: 'IS',
        vm: '1-n',
        name: 'EchoNumbers'
    },
    '(0018,0087)': {
        tag: '(0018,0087)',
        vr: 'DS',
        vm: '1',
        name: 'MagneticFieldStrength'
    },
    '(0018,0088)': {
        tag: '(0018,0088)',
        vr: 'DS',
        vm: '1',
        name: 'SpacingBetweenSlices'
    },
    '(0018,0089)': {
        tag: '(0018,0089)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfPhaseEncodingSteps'
    },
    '(0018,0090)': {
        tag: '(0018,0090)',
        vr: 'DS',
        vm: '1',
        name: 'DataCollectionDiameter'
    },
    '(0018,0091)': {
        tag: '(0018,0091)',
        vr: 'IS',
        vm: '1',
        name: 'EchoTrainLength'
    },
    '(0018,0093)': {
        tag: '(0018,0093)',
        vr: 'DS',
        vm: '1',
        name: 'PercentSampling'
    },
    '(0018,0094)': {
        tag: '(0018,0094)',
        vr: 'DS',
        vm: '1',
        name: 'PercentPhaseFieldOfView'
    },
    '(0018,0095)': {
        tag: '(0018,0095)',
        vr: 'DS',
        vm: '1',
        name: 'PixelBandwidth'
    },
    '(0018,1000)': {
        tag: '(0018,1000)',
        vr: 'LO',
        vm: '1',
        name: 'DeviceSerialNumber'
    },
    '(0018,1002)': {
        tag: '(0018,1002)',
        vr: 'UI',
        vm: '1',
        name: 'DeviceUID'
    },
    '(0018,1003)': {
        tag: '(0018,1003)',
        vr: 'LO',
        vm: '1',
        name: 'DeviceID'
    },
    '(0018,1004)': {
        tag: '(0018,1004)',
        vr: 'LO',
        vm: '1',
        name: 'PlateID'
    },
    '(0018,1005)': {
        tag: '(0018,1005)',
        vr: 'LO',
        vm: '1',
        name: 'GeneratorID'
    },
    '(0018,1006)': {
        tag: '(0018,1006)',
        vr: 'LO',
        vm: '1',
        name: 'GridID'
    },
    '(0018,1007)': {
        tag: '(0018,1007)',
        vr: 'LO',
        vm: '1',
        name: 'CassetteID'
    },
    '(0018,1008)': {
        tag: '(0018,1008)',
        vr: 'LO',
        vm: '1',
        name: 'GantryID'
    },
    '(0018,1010)': {
        tag: '(0018,1010)',
        vr: 'LO',
        vm: '1',
        name: 'SecondaryCaptureDeviceID'
    },
    '(0018,1011)': {
        tag: '(0018,1011)',
        vr: 'LO',
        vm: '1',
        name: 'HardcopyCreationDeviceID'
    },
    '(0018,1012)': {
        tag: '(0018,1012)',
        vr: 'DA',
        vm: '1',
        name: 'DateOfSecondaryCapture'
    },
    '(0018,1014)': {
        tag: '(0018,1014)',
        vr: 'TM',
        vm: '1',
        name: 'TimeOfSecondaryCapture'
    },
    '(0018,1016)': {
        tag: '(0018,1016)',
        vr: 'LO',
        vm: '1',
        name: 'SecondaryCaptureDeviceManufacturer'
    },
    '(0018,1017)': {
        tag: '(0018,1017)',
        vr: 'LO',
        vm: '1',
        name: 'HardcopyDeviceManufacturer'
    },
    '(0018,1018)': {
        tag: '(0018,1018)',
        vr: 'LO',
        vm: '1',
        name: 'SecondaryCaptureDeviceManufacturerModelName'
    },
    '(0018,1019)': {
        tag: '(0018,1019)',
        vr: 'LO',
        vm: '1-n',
        name: 'SecondaryCaptureDeviceSoftwareVersions'
    },
    '(0018,101A)': {
        tag: '(0018,101A)',
        vr: 'LO',
        vm: '1-n',
        name: 'HardcopyDeviceSoftwareVersion'
    },
    '(0018,101B)': {
        tag: '(0018,101B)',
        vr: 'LO',
        vm: '1',
        name: 'HardcopyDeviceManufacturerModelName'
    },
    '(0018,1020)': {
        tag: '(0018,1020)',
        vr: 'LO',
        vm: '1-n',
        name: 'SoftwareVersions'
    },
    '(0018,1022)': {
        tag: '(0018,1022)',
        vr: 'SH',
        vm: '1',
        name: 'VideoImageFormatAcquired'
    },
    '(0018,1023)': {
        tag: '(0018,1023)',
        vr: 'LO',
        vm: '1',
        name: 'DigitalImageFormatAcquired'
    },
    '(0018,1030)': {
        tag: '(0018,1030)',
        vr: 'LO',
        vm: '1',
        name: 'ProtocolName'
    },
    '(0018,1040)': {
        tag: '(0018,1040)',
        vr: 'LO',
        vm: '1',
        name: 'ContrastBolusRoute'
    },
    '(0018,1041)': {
        tag: '(0018,1041)',
        vr: 'DS',
        vm: '1',
        name: 'ContrastBolusVolume'
    },
    '(0018,1042)': {
        tag: '(0018,1042)',
        vr: 'TM',
        vm: '1',
        name: 'ContrastBolusStartTime'
    },
    '(0018,1043)': {
        tag: '(0018,1043)',
        vr: 'TM',
        vm: '1',
        name: 'ContrastBolusStopTime'
    },
    '(0018,1044)': {
        tag: '(0018,1044)',
        vr: 'DS',
        vm: '1',
        name: 'ContrastBolusTotalDose'
    },
    '(0018,1045)': {
        tag: '(0018,1045)',
        vr: 'IS',
        vm: '1',
        name: 'SyringeCounts'
    },
    '(0018,1046)': {
        tag: '(0018,1046)',
        vr: 'DS',
        vm: '1-n',
        name: 'ContrastFlowRate'
    },
    '(0018,1047)': {
        tag: '(0018,1047)',
        vr: 'DS',
        vm: '1-n',
        name: 'ContrastFlowDuration'
    },
    '(0018,1048)': {
        tag: '(0018,1048)',
        vr: 'CS',
        vm: '1',
        name: 'ContrastBolusIngredient'
    },
    '(0018,1049)': {
        tag: '(0018,1049)',
        vr: 'DS',
        vm: '1',
        name: 'ContrastBolusIngredientConcentration'
    },
    '(0018,1050)': {
        tag: '(0018,1050)',
        vr: 'DS',
        vm: '1',
        name: 'SpatialResolution'
    },
    '(0018,1060)': {
        tag: '(0018,1060)',
        vr: 'DS',
        vm: '1',
        name: 'TriggerTime'
    },
    '(0018,1061)': {
        tag: '(0018,1061)',
        vr: 'LO',
        vm: '1',
        name: 'TriggerSourceOrType'
    },
    '(0018,1062)': {
        tag: '(0018,1062)',
        vr: 'IS',
        vm: '1',
        name: 'NominalInterval'
    },
    '(0018,1063)': {
        tag: '(0018,1063)',
        vr: 'DS',
        vm: '1',
        name: 'FrameTime'
    },
    '(0018,1064)': {
        tag: '(0018,1064)',
        vr: 'LO',
        vm: '1',
        name: 'CardiacFramingType'
    },
    '(0018,1065)': {
        tag: '(0018,1065)',
        vr: 'DS',
        vm: '1-n',
        name: 'FrameTimeVector'
    },
    '(0018,1066)': {
        tag: '(0018,1066)',
        vr: 'DS',
        vm: '1',
        name: 'FrameDelay'
    },
    '(0018,1067)': {
        tag: '(0018,1067)',
        vr: 'DS',
        vm: '1',
        name: 'ImageTriggerDelay'
    },
    '(0018,1068)': {
        tag: '(0018,1068)',
        vr: 'DS',
        vm: '1',
        name: 'MultiplexGroupTimeOffset'
    },
    '(0018,1069)': {
        tag: '(0018,1069)',
        vr: 'DS',
        vm: '1',
        name: 'TriggerTimeOffset'
    },
    '(0018,106A)': {
        tag: '(0018,106A)',
        vr: 'CS',
        vm: '1',
        name: 'SynchronizationTrigger'
    },
    '(0018,106C)': {
        tag: '(0018,106C)',
        vr: 'US',
        vm: '2',
        name: 'SynchronizationChannel'
    },
    '(0018,106E)': {
        tag: '(0018,106E)',
        vr: 'UL',
        vm: '1',
        name: 'TriggerSamplePosition'
    },
    '(0018,1070)': {
        tag: '(0018,1070)',
        vr: 'LO',
        vm: '1',
        name: 'RadiopharmaceuticalRoute'
    },
    '(0018,1071)': {
        tag: '(0018,1071)',
        vr: 'DS',
        vm: '1',
        name: 'RadiopharmaceuticalVolume'
    },
    '(0018,1072)': {
        tag: '(0018,1072)',
        vr: 'TM',
        vm: '1',
        name: 'RadiopharmaceuticalStartTime'
    },
    '(0018,1073)': {
        tag: '(0018,1073)',
        vr: 'TM',
        vm: '1',
        name: 'RadiopharmaceuticalStopTime'
    },
    '(0018,1074)': {
        tag: '(0018,1074)',
        vr: 'DS',
        vm: '1',
        name: 'RadionuclideTotalDose'
    },
    '(0018,1075)': {
        tag: '(0018,1075)',
        vr: 'DS',
        vm: '1',
        name: 'RadionuclideHalfLife'
    },
    '(0018,1076)': {
        tag: '(0018,1076)',
        vr: 'DS',
        vm: '1',
        name: 'RadionuclidePositronFraction'
    },
    '(0018,1077)': {
        tag: '(0018,1077)',
        vr: 'DS',
        vm: '1',
        name: 'RadiopharmaceuticalSpecificActivity'
    },
    '(0018,1078)': {
        tag: '(0018,1078)',
        vr: 'DT',
        vm: '1',
        name: 'RadiopharmaceuticalStartDateTime'
    },
    '(0018,1079)': {
        tag: '(0018,1079)',
        vr: 'DT',
        vm: '1',
        name: 'RadiopharmaceuticalStopDateTime'
    },
    '(0018,1080)': {
        tag: '(0018,1080)',
        vr: 'CS',
        vm: '1',
        name: 'BeatRejectionFlag'
    },
    '(0018,1081)': {
        tag: '(0018,1081)',
        vr: 'IS',
        vm: '1',
        name: 'LowRRValue'
    },
    '(0018,1082)': {
        tag: '(0018,1082)',
        vr: 'IS',
        vm: '1',
        name: 'HighRRValue'
    },
    '(0018,1083)': {
        tag: '(0018,1083)',
        vr: 'IS',
        vm: '1',
        name: 'IntervalsAcquired'
    },
    '(0018,1084)': {
        tag: '(0018,1084)',
        vr: 'IS',
        vm: '1',
        name: 'IntervalsRejected'
    },
    '(0018,1085)': {
        tag: '(0018,1085)',
        vr: 'LO',
        vm: '1',
        name: 'PVCRejection'
    },
    '(0018,1086)': {
        tag: '(0018,1086)',
        vr: 'IS',
        vm: '1',
        name: 'SkipBeats'
    },
    '(0018,1088)': {
        tag: '(0018,1088)',
        vr: 'IS',
        vm: '1',
        name: 'HeartRate'
    },
    '(0018,1090)': {
        tag: '(0018,1090)',
        vr: 'IS',
        vm: '1',
        name: 'CardiacNumberOfImages'
    },
    '(0018,1094)': {
        tag: '(0018,1094)',
        vr: 'IS',
        vm: '1',
        name: 'TriggerWindow'
    },
    '(0018,1100)': {
        tag: '(0018,1100)',
        vr: 'DS',
        vm: '1',
        name: 'ReconstructionDiameter'
    },
    '(0018,1110)': {
        tag: '(0018,1110)',
        vr: 'DS',
        vm: '1',
        name: 'DistanceSourceToDetector'
    },
    '(0018,1111)': {
        tag: '(0018,1111)',
        vr: 'DS',
        vm: '1',
        name: 'DistanceSourceToPatient'
    },
    '(0018,1114)': {
        tag: '(0018,1114)',
        vr: 'DS',
        vm: '1',
        name: 'EstimatedRadiographicMagnificationFactor'
    },
    '(0018,1120)': {
        tag: '(0018,1120)',
        vr: 'DS',
        vm: '1',
        name: 'GantryDetectorTilt'
    },
    '(0018,1121)': {
        tag: '(0018,1121)',
        vr: 'DS',
        vm: '1',
        name: 'GantryDetectorSlew'
    },
    '(0018,1130)': {
        tag: '(0018,1130)',
        vr: 'DS',
        vm: '1',
        name: 'TableHeight'
    },
    '(0018,1131)': {
        tag: '(0018,1131)',
        vr: 'DS',
        vm: '1',
        name: 'TableTraverse'
    },
    '(0018,1134)': {
        tag: '(0018,1134)',
        vr: 'CS',
        vm: '1',
        name: 'TableMotion'
    },
    '(0018,1135)': {
        tag: '(0018,1135)',
        vr: 'DS',
        vm: '1-n',
        name: 'TableVerticalIncrement'
    },
    '(0018,1136)': {
        tag: '(0018,1136)',
        vr: 'DS',
        vm: '1-n',
        name: 'TableLateralIncrement'
    },
    '(0018,1137)': {
        tag: '(0018,1137)',
        vr: 'DS',
        vm: '1-n',
        name: 'TableLongitudinalIncrement'
    },
    '(0018,1138)': {
        tag: '(0018,1138)',
        vr: 'DS',
        vm: '1',
        name: 'TableAngle'
    },
    '(0018,113A)': {
        tag: '(0018,113A)',
        vr: 'CS',
        vm: '1',
        name: 'TableType'
    },
    '(0018,1140)': {
        tag: '(0018,1140)',
        vr: 'CS',
        vm: '1',
        name: 'RotationDirection'
    },
    '(0018,1141)': {
        tag: '(0018,1141)',
        vr: 'DS',
        vm: '1',
        name: 'AngularPosition'
    },
    '(0018,1142)': {
        tag: '(0018,1142)',
        vr: 'DS',
        vm: '1-n',
        name: 'RadialPosition'
    },
    '(0018,1143)': {
        tag: '(0018,1143)',
        vr: 'DS',
        vm: '1',
        name: 'ScanArc'
    },
    '(0018,1144)': {
        tag: '(0018,1144)',
        vr: 'DS',
        vm: '1',
        name: 'AngularStep'
    },
    '(0018,1145)': {
        tag: '(0018,1145)',
        vr: 'DS',
        vm: '1',
        name: 'CenterOfRotationOffset'
    },
    '(0018,1146)': {
        tag: '(0018,1146)',
        vr: 'DS',
        vm: '1-n',
        name: 'RotationOffset'
    },
    '(0018,1147)': {
        tag: '(0018,1147)',
        vr: 'CS',
        vm: '1',
        name: 'FieldOfViewShape'
    },
    '(0018,1149)': {
        tag: '(0018,1149)',
        vr: 'IS',
        vm: '1-2',
        name: 'FieldOfViewDimensions'
    },
    '(0018,1150)': {
        tag: '(0018,1150)',
        vr: 'IS',
        vm: '1',
        name: 'ExposureTime'
    },
    '(0018,1151)': {
        tag: '(0018,1151)',
        vr: 'IS',
        vm: '1',
        name: 'XRayTubeCurrent'
    },
    '(0018,1152)': {
        tag: '(0018,1152)',
        vr: 'IS',
        vm: '1',
        name: 'Exposure'
    },
    '(0018,1153)': {
        tag: '(0018,1153)',
        vr: 'IS',
        vm: '1',
        name: 'ExposureInuAs'
    },
    '(0018,1154)': {
        tag: '(0018,1154)',
        vr: 'DS',
        vm: '1',
        name: 'AveragePulseWidth'
    },
    '(0018,1155)': {
        tag: '(0018,1155)',
        vr: 'CS',
        vm: '1',
        name: 'RadiationSetting'
    },
    '(0018,1156)': {
        tag: '(0018,1156)',
        vr: 'CS',
        vm: '1',
        name: 'RectificationType'
    },
    '(0018,115A)': {
        tag: '(0018,115A)',
        vr: 'CS',
        vm: '1',
        name: 'RadiationMode'
    },
    '(0018,115E)': {
        tag: '(0018,115E)',
        vr: 'DS',
        vm: '1',
        name: 'ImageAndFluoroscopyAreaDoseProduct'
    },
    '(0018,1160)': {
        tag: '(0018,1160)',
        vr: 'SH',
        vm: '1',
        name: 'FilterType'
    },
    '(0018,1161)': {
        tag: '(0018,1161)',
        vr: 'LO',
        vm: '1-n',
        name: 'TypeOfFilters'
    },
    '(0018,1162)': {
        tag: '(0018,1162)',
        vr: 'DS',
        vm: '1',
        name: 'IntensifierSize'
    },
    '(0018,1164)': {
        tag: '(0018,1164)',
        vr: 'DS',
        vm: '2',
        name: 'ImagerPixelSpacing'
    },
    '(0018,1166)': {
        tag: '(0018,1166)',
        vr: 'CS',
        vm: '1-n',
        name: 'Grid'
    },
    '(0018,1170)': {
        tag: '(0018,1170)',
        vr: 'IS',
        vm: '1',
        name: 'GeneratorPower'
    },
    '(0018,1180)': {
        tag: '(0018,1180)',
        vr: 'SH',
        vm: '1',
        name: 'CollimatorGridName'
    },
    '(0018,1181)': {
        tag: '(0018,1181)',
        vr: 'CS',
        vm: '1',
        name: 'CollimatorType'
    },
    '(0018,1182)': {
        tag: '(0018,1182)',
        vr: 'IS',
        vm: '1-2',
        name: 'FocalDistance'
    },
    '(0018,1183)': {
        tag: '(0018,1183)',
        vr: 'DS',
        vm: '1-2',
        name: 'XFocusCenter'
    },
    '(0018,1184)': {
        tag: '(0018,1184)',
        vr: 'DS',
        vm: '1-2',
        name: 'YFocusCenter'
    },
    '(0018,1190)': {
        tag: '(0018,1190)',
        vr: 'DS',
        vm: '1-n',
        name: 'FocalSpots'
    },
    '(0018,1191)': {
        tag: '(0018,1191)',
        vr: 'CS',
        vm: '1',
        name: 'AnodeTargetMaterial'
    },
    '(0018,11A0)': {
        tag: '(0018,11A0)',
        vr: 'DS',
        vm: '1',
        name: 'BodyPartThickness'
    },
    '(0018,11A2)': {
        tag: '(0018,11A2)',
        vr: 'DS',
        vm: '1',
        name: 'CompressionForce'
    },
    '(0018,1200)': {
        tag: '(0018,1200)',
        vr: 'DA',
        vm: '1-n',
        name: 'DateOfLastCalibration'
    },
    '(0018,1201)': {
        tag: '(0018,1201)',
        vr: 'TM',
        vm: '1-n',
        name: 'TimeOfLastCalibration'
    },
    '(0018,1210)': {
        tag: '(0018,1210)',
        vr: 'SH',
        vm: '1-n',
        name: 'ConvolutionKernel'
    },
    '(0018,1240)': {
        tag: '(0018,1240)',
        vr: 'IS',
        vm: '1-n',
        name: 'UpperLowerPixelValues'
    },
    '(0018,1242)': {
        tag: '(0018,1242)',
        vr: 'IS',
        vm: '1',
        name: 'ActualFrameDuration'
    },
    '(0018,1243)': {
        tag: '(0018,1243)',
        vr: 'IS',
        vm: '1',
        name: 'CountRate'
    },
    '(0018,1244)': {
        tag: '(0018,1244)',
        vr: 'US',
        vm: '1',
        name: 'PreferredPlaybackSequencing'
    },
    '(0018,1250)': {
        tag: '(0018,1250)',
        vr: 'SH',
        vm: '1',
        name: 'ReceiveCoilName'
    },
    '(0018,1251)': {
        tag: '(0018,1251)',
        vr: 'SH',
        vm: '1',
        name: 'TransmitCoilName'
    },
    '(0018,1260)': {
        tag: '(0018,1260)',
        vr: 'SH',
        vm: '1',
        name: 'PlateType'
    },
    '(0018,1261)': {
        tag: '(0018,1261)',
        vr: 'LO',
        vm: '1',
        name: 'PhosphorType'
    },
    '(0018,1300)': {
        tag: '(0018,1300)',
        vr: 'DS',
        vm: '1',
        name: 'ScanVelocity'
    },
    '(0018,1301)': {
        tag: '(0018,1301)',
        vr: 'CS',
        vm: '1-n',
        name: 'WholeBodyTechnique'
    },
    '(0018,1302)': {
        tag: '(0018,1302)',
        vr: 'IS',
        vm: '1',
        name: 'ScanLength'
    },
    '(0018,1310)': {
        tag: '(0018,1310)',
        vr: 'US',
        vm: '4',
        name: 'AcquisitionMatrix'
    },
    '(0018,1312)': {
        tag: '(0018,1312)',
        vr: 'CS',
        vm: '1',
        name: 'InPlanePhaseEncodingDirection'
    },
    '(0018,1314)': {
        tag: '(0018,1314)',
        vr: 'DS',
        vm: '1',
        name: 'FlipAngle'
    },
    '(0018,1315)': {
        tag: '(0018,1315)',
        vr: 'CS',
        vm: '1',
        name: 'VariableFlipAngleFlag'
    },
    '(0018,1316)': {
        tag: '(0018,1316)',
        vr: 'DS',
        vm: '1',
        name: 'SAR'
    },
    '(0018,1318)': {
        tag: '(0018,1318)',
        vr: 'DS',
        vm: '1',
        name: 'dBdt'
    },
    '(0018,1400)': {
        tag: '(0018,1400)',
        vr: 'LO',
        vm: '1',
        name: 'AcquisitionDeviceProcessingDescription'
    },
    '(0018,1401)': {
        tag: '(0018,1401)',
        vr: 'LO',
        vm: '1',
        name: 'AcquisitionDeviceProcessingCode'
    },
    '(0018,1402)': {
        tag: '(0018,1402)',
        vr: 'CS',
        vm: '1',
        name: 'CassetteOrientation'
    },
    '(0018,1403)': {
        tag: '(0018,1403)',
        vr: 'CS',
        vm: '1',
        name: 'CassetteSize'
    },
    '(0018,1404)': {
        tag: '(0018,1404)',
        vr: 'US',
        vm: '1',
        name: 'ExposuresOnPlate'
    },
    '(0018,1405)': {
        tag: '(0018,1405)',
        vr: 'IS',
        vm: '1',
        name: 'RelativeXRayExposure'
    },
    '(0018,1411)': {
        tag: '(0018,1411)',
        vr: 'DS',
        vm: '1',
        name: 'ExposureIndex'
    },
    '(0018,1412)': {
        tag: '(0018,1412)',
        vr: 'DS',
        vm: '1',
        name: 'TargetExposureIndex'
    },
    '(0018,1413)': {
        tag: '(0018,1413)',
        vr: 'DS',
        vm: '1',
        name: 'DeviationIndex'
    },
    '(0018,1450)': {
        tag: '(0018,1450)',
        vr: 'DS',
        vm: '1',
        name: 'ColumnAngulation'
    },
    '(0018,1460)': {
        tag: '(0018,1460)',
        vr: 'DS',
        vm: '1',
        name: 'TomoLayerHeight'
    },
    '(0018,1470)': {
        tag: '(0018,1470)',
        vr: 'DS',
        vm: '1',
        name: 'TomoAngle'
    },
    '(0018,1480)': {
        tag: '(0018,1480)',
        vr: 'DS',
        vm: '1',
        name: 'TomoTime'
    },
    '(0018,1490)': {
        tag: '(0018,1490)',
        vr: 'CS',
        vm: '1',
        name: 'TomoType'
    },
    '(0018,1491)': {
        tag: '(0018,1491)',
        vr: 'CS',
        vm: '1',
        name: 'TomoClass'
    },
    '(0018,1495)': {
        tag: '(0018,1495)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfTomosynthesisSourceImages'
    },
    '(0018,1500)': {
        tag: '(0018,1500)',
        vr: 'CS',
        vm: '1',
        name: 'PositionerMotion'
    },
    '(0018,1508)': {
        tag: '(0018,1508)',
        vr: 'CS',
        vm: '1',
        name: 'PositionerType'
    },
    '(0018,1510)': {
        tag: '(0018,1510)',
        vr: 'DS',
        vm: '1',
        name: 'PositionerPrimaryAngle'
    },
    '(0018,1511)': {
        tag: '(0018,1511)',
        vr: 'DS',
        vm: '1',
        name: 'PositionerSecondaryAngle'
    },
    '(0018,1520)': {
        tag: '(0018,1520)',
        vr: 'DS',
        vm: '1-n',
        name: 'PositionerPrimaryAngleIncrement'
    },
    '(0018,1521)': {
        tag: '(0018,1521)',
        vr: 'DS',
        vm: '1-n',
        name: 'PositionerSecondaryAngleIncrement'
    },
    '(0018,1530)': {
        tag: '(0018,1530)',
        vr: 'DS',
        vm: '1',
        name: 'DetectorPrimaryAngle'
    },
    '(0018,1531)': {
        tag: '(0018,1531)',
        vr: 'DS',
        vm: '1',
        name: 'DetectorSecondaryAngle'
    },
    '(0018,1600)': {
        tag: '(0018,1600)',
        vr: 'CS',
        vm: '1-3',
        name: 'ShutterShape'
    },
    '(0018,1602)': {
        tag: '(0018,1602)',
        vr: 'IS',
        vm: '1',
        name: 'ShutterLeftVerticalEdge'
    },
    '(0018,1604)': {
        tag: '(0018,1604)',
        vr: 'IS',
        vm: '1',
        name: 'ShutterRightVerticalEdge'
    },
    '(0018,1606)': {
        tag: '(0018,1606)',
        vr: 'IS',
        vm: '1',
        name: 'ShutterUpperHorizontalEdge'
    },
    '(0018,1608)': {
        tag: '(0018,1608)',
        vr: 'IS',
        vm: '1',
        name: 'ShutterLowerHorizontalEdge'
    },
    '(0018,1610)': {
        tag: '(0018,1610)',
        vr: 'IS',
        vm: '2',
        name: 'CenterOfCircularShutter'
    },
    '(0018,1612)': {
        tag: '(0018,1612)',
        vr: 'IS',
        vm: '1',
        name: 'RadiusOfCircularShutter'
    },
    '(0018,1620)': {
        tag: '(0018,1620)',
        vr: 'IS',
        vm: '2-2n',
        name: 'VerticesOfThePolygonalShutter'
    },
    '(0018,1622)': {
        tag: '(0018,1622)',
        vr: 'US',
        vm: '1',
        name: 'ShutterPresentationValue'
    },
    '(0018,1623)': {
        tag: '(0018,1623)',
        vr: 'US',
        vm: '1',
        name: 'ShutterOverlayGroup'
    },
    '(0018,1624)': {
        tag: '(0018,1624)',
        vr: 'US',
        vm: '3',
        name: 'ShutterPresentationColorCIELabValue'
    },
    '(0018,1700)': {
        tag: '(0018,1700)',
        vr: 'CS',
        vm: '1-3',
        name: 'CollimatorShape'
    },
    '(0018,1702)': {
        tag: '(0018,1702)',
        vr: 'IS',
        vm: '1',
        name: 'CollimatorLeftVerticalEdge'
    },
    '(0018,1704)': {
        tag: '(0018,1704)',
        vr: 'IS',
        vm: '1',
        name: 'CollimatorRightVerticalEdge'
    },
    '(0018,1706)': {
        tag: '(0018,1706)',
        vr: 'IS',
        vm: '1',
        name: 'CollimatorUpperHorizontalEdge'
    },
    '(0018,1708)': {
        tag: '(0018,1708)',
        vr: 'IS',
        vm: '1',
        name: 'CollimatorLowerHorizontalEdge'
    },
    '(0018,1710)': {
        tag: '(0018,1710)',
        vr: 'IS',
        vm: '2',
        name: 'CenterOfCircularCollimator'
    },
    '(0018,1712)': {
        tag: '(0018,1712)',
        vr: 'IS',
        vm: '1',
        name: 'RadiusOfCircularCollimator'
    },
    '(0018,1720)': {
        tag: '(0018,1720)',
        vr: 'IS',
        vm: '2-2n',
        name: 'VerticesOfThePolygonalCollimator'
    },
    '(0018,1800)': {
        tag: '(0018,1800)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionTimeSynchronized'
    },
    '(0018,1801)': {
        tag: '(0018,1801)',
        vr: 'SH',
        vm: '1',
        name: 'TimeSource'
    },
    '(0018,1802)': {
        tag: '(0018,1802)',
        vr: 'CS',
        vm: '1',
        name: 'TimeDistributionProtocol'
    },
    '(0018,1803)': {
        tag: '(0018,1803)',
        vr: 'LO',
        vm: '1',
        name: 'NTPSourceAddress'
    },
    '(0018,2001)': {
        tag: '(0018,2001)',
        vr: 'IS',
        vm: '1-n',
        name: 'PageNumberVector'
    },
    '(0018,2002)': {
        tag: '(0018,2002)',
        vr: 'SH',
        vm: '1-n',
        name: 'FrameLabelVector'
    },
    '(0018,2003)': {
        tag: '(0018,2003)',
        vr: 'DS',
        vm: '1-n',
        name: 'FramePrimaryAngleVector'
    },
    '(0018,2004)': {
        tag: '(0018,2004)',
        vr: 'DS',
        vm: '1-n',
        name: 'FrameSecondaryAngleVector'
    },
    '(0018,2005)': {
        tag: '(0018,2005)',
        vr: 'DS',
        vm: '1-n',
        name: 'SliceLocationVector'
    },
    '(0018,2006)': {
        tag: '(0018,2006)',
        vr: 'SH',
        vm: '1-n',
        name: 'DisplayWindowLabelVector'
    },
    '(0018,2010)': {
        tag: '(0018,2010)',
        vr: 'DS',
        vm: '2',
        name: 'NominalScannedPixelSpacing'
    },
    '(0018,2020)': {
        tag: '(0018,2020)',
        vr: 'CS',
        vm: '1',
        name: 'DigitizingDeviceTransportDirection'
    },
    '(0018,2030)': {
        tag: '(0018,2030)',
        vr: 'DS',
        vm: '1',
        name: 'RotationOfScannedFilm'
    },
    '(0018,3100)': {
        tag: '(0018,3100)',
        vr: 'CS',
        vm: '1',
        name: 'IVUSAcquisition'
    },
    '(0018,3101)': {
        tag: '(0018,3101)',
        vr: 'DS',
        vm: '1',
        name: 'IVUSPullbackRate'
    },
    '(0018,3102)': {
        tag: '(0018,3102)',
        vr: 'DS',
        vm: '1',
        name: 'IVUSGatedRate'
    },
    '(0018,3103)': {
        tag: '(0018,3103)',
        vr: 'IS',
        vm: '1',
        name: 'IVUSPullbackStartFrameNumber'
    },
    '(0018,3104)': {
        tag: '(0018,3104)',
        vr: 'IS',
        vm: '1',
        name: 'IVUSPullbackStopFrameNumber'
    },
    '(0018,3105)': {
        tag: '(0018,3105)',
        vr: 'IS',
        vm: '1-n',
        name: 'LesionNumber'
    },
    '(0018,4000)': {
        tag: '(0018,4000)',
        vr: 'LT',
        vm: '1',
        name: 'AcquisitionComments'
    },
    '(0018,5000)': {
        tag: '(0018,5000)',
        vr: 'SH',
        vm: '1-n',
        name: 'OutputPower'
    },
    '(0018,5010)': {
        tag: '(0018,5010)',
        vr: 'LO',
        vm: '1-n',
        name: 'TransducerData'
    },
    '(0018,5012)': {
        tag: '(0018,5012)',
        vr: 'DS',
        vm: '1',
        name: 'FocusDepth'
    },
    '(0018,5020)': {
        tag: '(0018,5020)',
        vr: 'LO',
        vm: '1',
        name: 'ProcessingFunction'
    },
    '(0018,5021)': {
        tag: '(0018,5021)',
        vr: 'LO',
        vm: '1',
        name: 'PostprocessingFunction'
    },
    '(0018,5022)': {
        tag: '(0018,5022)',
        vr: 'DS',
        vm: '1',
        name: 'MechanicalIndex'
    },
    '(0018,5024)': {
        tag: '(0018,5024)',
        vr: 'DS',
        vm: '1',
        name: 'BoneThermalIndex'
    },
    '(0018,5026)': {
        tag: '(0018,5026)',
        vr: 'DS',
        vm: '1',
        name: 'CranialThermalIndex'
    },
    '(0018,5027)': {
        tag: '(0018,5027)',
        vr: 'DS',
        vm: '1',
        name: 'SoftTissueThermalIndex'
    },
    '(0018,5028)': {
        tag: '(0018,5028)',
        vr: 'DS',
        vm: '1',
        name: 'SoftTissueFocusThermalIndex'
    },
    '(0018,5029)': {
        tag: '(0018,5029)',
        vr: 'DS',
        vm: '1',
        name: 'SoftTissueSurfaceThermalIndex'
    },
    '(0018,5030)': {
        tag: '(0018,5030)',
        vr: 'DS',
        vm: '1',
        name: 'DynamicRange'
    },
    '(0018,5040)': {
        tag: '(0018,5040)',
        vr: 'DS',
        vm: '1',
        name: 'TotalGain'
    },
    '(0018,5050)': {
        tag: '(0018,5050)',
        vr: 'IS',
        vm: '1',
        name: 'DepthOfScanField'
    },
    '(0018,5100)': {
        tag: '(0018,5100)',
        vr: 'CS',
        vm: '1',
        name: 'PatientPosition'
    },
    '(0018,5101)': {
        tag: '(0018,5101)',
        vr: 'CS',
        vm: '1',
        name: 'ViewPosition'
    },
    '(0018,5104)': {
        tag: '(0018,5104)',
        vr: 'SQ',
        vm: '1',
        name: 'ProjectionEponymousNameCodeSequence'
    },
    '(0018,5210)': {
        tag: '(0018,5210)',
        vr: 'DS',
        vm: '6',
        name: 'ImageTransformationMatrix'
    },
    '(0018,5212)': {
        tag: '(0018,5212)',
        vr: 'DS',
        vm: '3',
        name: 'ImageTranslationVector'
    },
    '(0018,6000)': {
        tag: '(0018,6000)',
        vr: 'DS',
        vm: '1',
        name: 'Sensitivity'
    },
    '(0018,6011)': {
        tag: '(0018,6011)',
        vr: 'SQ',
        vm: '1',
        name: 'SequenceOfUltrasoundRegions'
    },
    '(0018,6012)': {
        tag: '(0018,6012)',
        vr: 'US',
        vm: '1',
        name: 'RegionSpatialFormat'
    },
    '(0018,6014)': {
        tag: '(0018,6014)',
        vr: 'US',
        vm: '1',
        name: 'RegionDataType'
    },
    '(0018,6016)': {
        tag: '(0018,6016)',
        vr: 'UL',
        vm: '1',
        name: 'RegionFlags'
    },
    '(0018,6018)': {
        tag: '(0018,6018)',
        vr: 'UL',
        vm: '1',
        name: 'RegionLocationMinX0'
    },
    '(0018,601A)': {
        tag: '(0018,601A)',
        vr: 'UL',
        vm: '1',
        name: 'RegionLocationMinY0'
    },
    '(0018,601C)': {
        tag: '(0018,601C)',
        vr: 'UL',
        vm: '1',
        name: 'RegionLocationMaxX1'
    },
    '(0018,601E)': {
        tag: '(0018,601E)',
        vr: 'UL',
        vm: '1',
        name: 'RegionLocationMaxY1'
    },
    '(0018,6020)': {
        tag: '(0018,6020)',
        vr: 'SL',
        vm: '1',
        name: 'ReferencePixelX0'
    },
    '(0018,6022)': {
        tag: '(0018,6022)',
        vr: 'SL',
        vm: '1',
        name: 'ReferencePixelY0'
    },
    '(0018,6024)': {
        tag: '(0018,6024)',
        vr: 'US',
        vm: '1',
        name: 'PhysicalUnitsXDirection'
    },
    '(0018,6026)': {
        tag: '(0018,6026)',
        vr: 'US',
        vm: '1',
        name: 'PhysicalUnitsYDirection'
    },
    '(0018,6028)': {
        tag: '(0018,6028)',
        vr: 'FD',
        vm: '1',
        name: 'ReferencePixelPhysicalValueX'
    },
    '(0018,602A)': {
        tag: '(0018,602A)',
        vr: 'FD',
        vm: '1',
        name: 'ReferencePixelPhysicalValueY'
    },
    '(0018,602C)': {
        tag: '(0018,602C)',
        vr: 'FD',
        vm: '1',
        name: 'PhysicalDeltaX'
    },
    '(0018,602E)': {
        tag: '(0018,602E)',
        vr: 'FD',
        vm: '1',
        name: 'PhysicalDeltaY'
    },
    '(0018,6030)': {
        tag: '(0018,6030)',
        vr: 'UL',
        vm: '1',
        name: 'TransducerFrequency'
    },
    '(0018,6031)': {
        tag: '(0018,6031)',
        vr: 'CS',
        vm: '1',
        name: 'TransducerType'
    },
    '(0018,6032)': {
        tag: '(0018,6032)',
        vr: 'UL',
        vm: '1',
        name: 'PulseRepetitionFrequency'
    },
    '(0018,6034)': {
        tag: '(0018,6034)',
        vr: 'FD',
        vm: '1',
        name: 'DopplerCorrectionAngle'
    },
    '(0018,6036)': {
        tag: '(0018,6036)',
        vr: 'FD',
        vm: '1',
        name: 'SteeringAngle'
    },
    '(0018,6038)': {
        tag: '(0018,6038)',
        vr: 'UL',
        vm: '1',
        name: 'DopplerSampleVolumeXPositionRetired'
    },
    '(0018,6039)': {
        tag: '(0018,6039)',
        vr: 'SL',
        vm: '1',
        name: 'DopplerSampleVolumeXPosition'
    },
    '(0018,603A)': {
        tag: '(0018,603A)',
        vr: 'UL',
        vm: '1',
        name: 'DopplerSampleVolumeYPositionRetired'
    },
    '(0018,603B)': {
        tag: '(0018,603B)',
        vr: 'SL',
        vm: '1',
        name: 'DopplerSampleVolumeYPosition'
    },
    '(0018,603C)': {
        tag: '(0018,603C)',
        vr: 'UL',
        vm: '1',
        name: 'TMLinePositionX0Retired'
    },
    '(0018,603D)': {
        tag: '(0018,603D)',
        vr: 'SL',
        vm: '1',
        name: 'TMLinePositionX0'
    },
    '(0018,603E)': {
        tag: '(0018,603E)',
        vr: 'UL',
        vm: '1',
        name: 'TMLinePositionY0Retired'
    },
    '(0018,603F)': {
        tag: '(0018,603F)',
        vr: 'SL',
        vm: '1',
        name: 'TMLinePositionY0'
    },
    '(0018,6040)': {
        tag: '(0018,6040)',
        vr: 'UL',
        vm: '1',
        name: 'TMLinePositionX1Retired'
    },
    '(0018,6041)': {
        tag: '(0018,6041)',
        vr: 'SL',
        vm: '1',
        name: 'TMLinePositionX1'
    },
    '(0018,6042)': {
        tag: '(0018,6042)',
        vr: 'UL',
        vm: '1',
        name: 'TMLinePositionY1Retired'
    },
    '(0018,6043)': {
        tag: '(0018,6043)',
        vr: 'SL',
        vm: '1',
        name: 'TMLinePositionY1'
    },
    '(0018,6044)': {
        tag: '(0018,6044)',
        vr: 'US',
        vm: '1',
        name: 'PixelComponentOrganization'
    },
    '(0018,6046)': {
        tag: '(0018,6046)',
        vr: 'UL',
        vm: '1',
        name: 'PixelComponentMask'
    },
    '(0018,6048)': {
        tag: '(0018,6048)',
        vr: 'UL',
        vm: '1',
        name: 'PixelComponentRangeStart'
    },
    '(0018,604A)': {
        tag: '(0018,604A)',
        vr: 'UL',
        vm: '1',
        name: 'PixelComponentRangeStop'
    },
    '(0018,604C)': {
        tag: '(0018,604C)',
        vr: 'US',
        vm: '1',
        name: 'PixelComponentPhysicalUnits'
    },
    '(0018,604E)': {
        tag: '(0018,604E)',
        vr: 'US',
        vm: '1',
        name: 'PixelComponentDataType'
    },
    '(0018,6050)': {
        tag: '(0018,6050)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfTableBreakPoints'
    },
    '(0018,6052)': {
        tag: '(0018,6052)',
        vr: 'UL',
        vm: '1-n',
        name: 'TableOfXBreakPoints'
    },
    '(0018,6054)': {
        tag: '(0018,6054)',
        vr: 'FD',
        vm: '1-n',
        name: 'TableOfYBreakPoints'
    },
    '(0018,6056)': {
        tag: '(0018,6056)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfTableEntries'
    },
    '(0018,6058)': {
        tag: '(0018,6058)',
        vr: 'UL',
        vm: '1-n',
        name: 'TableOfPixelValues'
    },
    '(0018,605A)': {
        tag: '(0018,605A)',
        vr: 'FL',
        vm: '1-n',
        name: 'TableOfParameterValues'
    },
    '(0018,6060)': {
        tag: '(0018,6060)',
        vr: 'FL',
        vm: '1-n',
        name: 'RWaveTimeVector'
    },
    '(0018,7000)': {
        tag: '(0018,7000)',
        vr: 'CS',
        vm: '1',
        name: 'DetectorConditionsNominalFlag'
    },
    '(0018,7001)': {
        tag: '(0018,7001)',
        vr: 'DS',
        vm: '1',
        name: 'DetectorTemperature'
    },
    '(0018,7004)': {
        tag: '(0018,7004)',
        vr: 'CS',
        vm: '1',
        name: 'DetectorType'
    },
    '(0018,7005)': {
        tag: '(0018,7005)',
        vr: 'CS',
        vm: '1',
        name: 'DetectorConfiguration'
    },
    '(0018,7006)': {
        tag: '(0018,7006)',
        vr: 'LT',
        vm: '1',
        name: 'DetectorDescription'
    },
    '(0018,7008)': {
        tag: '(0018,7008)',
        vr: 'LT',
        vm: '1',
        name: 'DetectorMode'
    },
    '(0018,700A)': {
        tag: '(0018,700A)',
        vr: 'SH',
        vm: '1',
        name: 'DetectorID'
    },
    '(0018,700C)': {
        tag: '(0018,700C)',
        vr: 'DA',
        vm: '1',
        name: 'DateOfLastDetectorCalibration'
    },
    '(0018,700E)': {
        tag: '(0018,700E)',
        vr: 'TM',
        vm: '1',
        name: 'TimeOfLastDetectorCalibration'
    },
    '(0018,7010)': {
        tag: '(0018,7010)',
        vr: 'IS',
        vm: '1',
        name: 'ExposuresOnDetectorSinceLastCalibration'
    },
    '(0018,7011)': {
        tag: '(0018,7011)',
        vr: 'IS',
        vm: '1',
        name: 'ExposuresOnDetectorSinceManufactured'
    },
    '(0018,7012)': {
        tag: '(0018,7012)',
        vr: 'DS',
        vm: '1',
        name: 'DetectorTimeSinceLastExposure'
    },
    '(0018,7014)': {
        tag: '(0018,7014)',
        vr: 'DS',
        vm: '1',
        name: 'DetectorActiveTime'
    },
    '(0018,7016)': {
        tag: '(0018,7016)',
        vr: 'DS',
        vm: '1',
        name: 'DetectorActivationOffsetFromExposure'
    },
    '(0018,701A)': {
        tag: '(0018,701A)',
        vr: 'DS',
        vm: '2',
        name: 'DetectorBinning'
    },
    '(0018,7020)': {
        tag: '(0018,7020)',
        vr: 'DS',
        vm: '2',
        name: 'DetectorElementPhysicalSize'
    },
    '(0018,7022)': {
        tag: '(0018,7022)',
        vr: 'DS',
        vm: '2',
        name: 'DetectorElementSpacing'
    },
    '(0018,7024)': {
        tag: '(0018,7024)',
        vr: 'CS',
        vm: '1',
        name: 'DetectorActiveShape'
    },
    '(0018,7026)': {
        tag: '(0018,7026)',
        vr: 'DS',
        vm: '1-2',
        name: 'DetectorActiveDimensions'
    },
    '(0018,7028)': {
        tag: '(0018,7028)',
        vr: 'DS',
        vm: '2',
        name: 'DetectorActiveOrigin'
    },
    '(0018,702A)': {
        tag: '(0018,702A)',
        vr: 'LO',
        vm: '1',
        name: 'DetectorManufacturerName'
    },
    '(0018,702B)': {
        tag: '(0018,702B)',
        vr: 'LO',
        vm: '1',
        name: 'DetectorManufacturerModelName'
    },
    '(0018,7030)': {
        tag: '(0018,7030)',
        vr: 'DS',
        vm: '2',
        name: 'FieldOfViewOrigin'
    },
    '(0018,7032)': {
        tag: '(0018,7032)',
        vr: 'DS',
        vm: '1',
        name: 'FieldOfViewRotation'
    },
    '(0018,7034)': {
        tag: '(0018,7034)',
        vr: 'CS',
        vm: '1',
        name: 'FieldOfViewHorizontalFlip'
    },
    '(0018,7036)': {
        tag: '(0018,7036)',
        vr: 'FL',
        vm: '2',
        name: 'PixelDataAreaOriginRelativeToFOV'
    },
    '(0018,7038)': {
        tag: '(0018,7038)',
        vr: 'FL',
        vm: '1',
        name: 'PixelDataAreaRotationAngleRelativeToFOV'
    },
    '(0018,7040)': {
        tag: '(0018,7040)',
        vr: 'LT',
        vm: '1',
        name: 'GridAbsorbingMaterial'
    },
    '(0018,7041)': {
        tag: '(0018,7041)',
        vr: 'LT',
        vm: '1',
        name: 'GridSpacingMaterial'
    },
    '(0018,7042)': {
        tag: '(0018,7042)',
        vr: 'DS',
        vm: '1',
        name: 'GridThickness'
    },
    '(0018,7044)': {
        tag: '(0018,7044)',
        vr: 'DS',
        vm: '1',
        name: 'GridPitch'
    },
    '(0018,7046)': {
        tag: '(0018,7046)',
        vr: 'IS',
        vm: '2',
        name: 'GridAspectRatio'
    },
    '(0018,7048)': {
        tag: '(0018,7048)',
        vr: 'DS',
        vm: '1',
        name: 'GridPeriod'
    },
    '(0018,704C)': {
        tag: '(0018,704C)',
        vr: 'DS',
        vm: '1',
        name: 'GridFocalDistance'
    },
    '(0018,7050)': {
        tag: '(0018,7050)',
        vr: 'CS',
        vm: '1-n',
        name: 'FilterMaterial'
    },
    '(0018,7052)': {
        tag: '(0018,7052)',
        vr: 'DS',
        vm: '1-n',
        name: 'FilterThicknessMinimum'
    },
    '(0018,7054)': {
        tag: '(0018,7054)',
        vr: 'DS',
        vm: '1-n',
        name: 'FilterThicknessMaximum'
    },
    '(0018,7056)': {
        tag: '(0018,7056)',
        vr: 'FL',
        vm: '1-n',
        name: 'FilterBeamPathLengthMinimum'
    },
    '(0018,7058)': {
        tag: '(0018,7058)',
        vr: 'FL',
        vm: '1-n',
        name: 'FilterBeamPathLengthMaximum'
    },
    '(0018,7060)': {
        tag: '(0018,7060)',
        vr: 'CS',
        vm: '1',
        name: 'ExposureControlMode'
    },
    '(0018,7062)': {
        tag: '(0018,7062)',
        vr: 'LT',
        vm: '1',
        name: 'ExposureControlModeDescription'
    },
    '(0018,7064)': {
        tag: '(0018,7064)',
        vr: 'CS',
        vm: '1',
        name: 'ExposureStatus'
    },
    '(0018,7065)': {
        tag: '(0018,7065)',
        vr: 'DS',
        vm: '1',
        name: 'PhototimerSetting'
    },
    '(0018,8150)': {
        tag: '(0018,8150)',
        vr: 'DS',
        vm: '1',
        name: 'ExposureTimeInuS'
    },
    '(0018,8151)': {
        tag: '(0018,8151)',
        vr: 'DS',
        vm: '1',
        name: 'XRayTubeCurrentInuA'
    },
    '(0018,9004)': {
        tag: '(0018,9004)',
        vr: 'CS',
        vm: '1',
        name: 'ContentQualification'
    },
    '(0018,9005)': {
        tag: '(0018,9005)',
        vr: 'SH',
        vm: '1',
        name: 'PulseSequenceName'
    },
    '(0018,9006)': {
        tag: '(0018,9006)',
        vr: 'SQ',
        vm: '1',
        name: 'MRImagingModifierSequence'
    },
    '(0018,9008)': {
        tag: '(0018,9008)',
        vr: 'CS',
        vm: '1',
        name: 'EchoPulseSequence'
    },
    '(0018,9009)': {
        tag: '(0018,9009)',
        vr: 'CS',
        vm: '1',
        name: 'InversionRecovery'
    },
    '(0018,9010)': {
        tag: '(0018,9010)',
        vr: 'CS',
        vm: '1',
        name: 'FlowCompensation'
    },
    '(0018,9011)': {
        tag: '(0018,9011)',
        vr: 'CS',
        vm: '1',
        name: 'MultipleSpinEcho'
    },
    '(0018,9012)': {
        tag: '(0018,9012)',
        vr: 'CS',
        vm: '1',
        name: 'MultiPlanarExcitation'
    },
    '(0018,9014)': {
        tag: '(0018,9014)',
        vr: 'CS',
        vm: '1',
        name: 'PhaseContrast'
    },
    '(0018,9015)': {
        tag: '(0018,9015)',
        vr: 'CS',
        vm: '1',
        name: 'TimeOfFlightContrast'
    },
    '(0018,9016)': {
        tag: '(0018,9016)',
        vr: 'CS',
        vm: '1',
        name: 'Spoiling'
    },
    '(0018,9017)': {
        tag: '(0018,9017)',
        vr: 'CS',
        vm: '1',
        name: 'SteadyStatePulseSequence'
    },
    '(0018,9018)': {
        tag: '(0018,9018)',
        vr: 'CS',
        vm: '1',
        name: 'EchoPlanarPulseSequence'
    },
    '(0018,9019)': {
        tag: '(0018,9019)',
        vr: 'FD',
        vm: '1',
        name: 'TagAngleFirstAxis'
    },
    '(0018,9020)': {
        tag: '(0018,9020)',
        vr: 'CS',
        vm: '1',
        name: 'MagnetizationTransfer'
    },
    '(0018,9021)': {
        tag: '(0018,9021)',
        vr: 'CS',
        vm: '1',
        name: 'T2Preparation'
    },
    '(0018,9022)': {
        tag: '(0018,9022)',
        vr: 'CS',
        vm: '1',
        name: 'BloodSignalNulling'
    },
    '(0018,9024)': {
        tag: '(0018,9024)',
        vr: 'CS',
        vm: '1',
        name: 'SaturationRecovery'
    },
    '(0018,9025)': {
        tag: '(0018,9025)',
        vr: 'CS',
        vm: '1',
        name: 'SpectrallySelectedSuppression'
    },
    '(0018,9026)': {
        tag: '(0018,9026)',
        vr: 'CS',
        vm: '1',
        name: 'SpectrallySelectedExcitation'
    },
    '(0018,9027)': {
        tag: '(0018,9027)',
        vr: 'CS',
        vm: '1',
        name: 'SpatialPresaturation'
    },
    '(0018,9028)': {
        tag: '(0018,9028)',
        vr: 'CS',
        vm: '1',
        name: 'Tagging'
    },
    '(0018,9029)': {
        tag: '(0018,9029)',
        vr: 'CS',
        vm: '1',
        name: 'OversamplingPhase'
    },
    '(0018,9030)': {
        tag: '(0018,9030)',
        vr: 'FD',
        vm: '1',
        name: 'TagSpacingFirstDimension'
    },
    '(0018,9032)': {
        tag: '(0018,9032)',
        vr: 'CS',
        vm: '1',
        name: 'GeometryOfKSpaceTraversal'
    },
    '(0018,9033)': {
        tag: '(0018,9033)',
        vr: 'CS',
        vm: '1',
        name: 'SegmentedKSpaceTraversal'
    },
    '(0018,9034)': {
        tag: '(0018,9034)',
        vr: 'CS',
        vm: '1',
        name: 'RectilinearPhaseEncodeReordering'
    },
    '(0018,9035)': {
        tag: '(0018,9035)',
        vr: 'FD',
        vm: '1',
        name: 'TagThickness'
    },
    '(0018,9036)': {
        tag: '(0018,9036)',
        vr: 'CS',
        vm: '1',
        name: 'PartialFourierDirection'
    },
    '(0018,9037)': {
        tag: '(0018,9037)',
        vr: 'CS',
        vm: '1',
        name: 'CardiacSynchronizationTechnique'
    },
    '(0018,9041)': {
        tag: '(0018,9041)',
        vr: 'LO',
        vm: '1',
        name: 'ReceiveCoilManufacturerName'
    },
    '(0018,9042)': {
        tag: '(0018,9042)',
        vr: 'SQ',
        vm: '1',
        name: 'MRReceiveCoilSequence'
    },
    '(0018,9043)': {
        tag: '(0018,9043)',
        vr: 'CS',
        vm: '1',
        name: 'ReceiveCoilType'
    },
    '(0018,9044)': {
        tag: '(0018,9044)',
        vr: 'CS',
        vm: '1',
        name: 'QuadratureReceiveCoil'
    },
    '(0018,9045)': {
        tag: '(0018,9045)',
        vr: 'SQ',
        vm: '1',
        name: 'MultiCoilDefinitionSequence'
    },
    '(0018,9046)': {
        tag: '(0018,9046)',
        vr: 'LO',
        vm: '1',
        name: 'MultiCoilConfiguration'
    },
    '(0018,9047)': {
        tag: '(0018,9047)',
        vr: 'SH',
        vm: '1',
        name: 'MultiCoilElementName'
    },
    '(0018,9048)': {
        tag: '(0018,9048)',
        vr: 'CS',
        vm: '1',
        name: 'MultiCoilElementUsed'
    },
    '(0018,9049)': {
        tag: '(0018,9049)',
        vr: 'SQ',
        vm: '1',
        name: 'MRTransmitCoilSequence'
    },
    '(0018,9050)': {
        tag: '(0018,9050)',
        vr: 'LO',
        vm: '1',
        name: 'TransmitCoilManufacturerName'
    },
    '(0018,9051)': {
        tag: '(0018,9051)',
        vr: 'CS',
        vm: '1',
        name: 'TransmitCoilType'
    },
    '(0018,9052)': {
        tag: '(0018,9052)',
        vr: 'FD',
        vm: '1-2',
        name: 'SpectralWidth'
    },
    '(0018,9053)': {
        tag: '(0018,9053)',
        vr: 'FD',
        vm: '1-2',
        name: 'ChemicalShiftReference'
    },
    '(0018,9054)': {
        tag: '(0018,9054)',
        vr: 'CS',
        vm: '1',
        name: 'VolumeLocalizationTechnique'
    },
    '(0018,9058)': {
        tag: '(0018,9058)',
        vr: 'US',
        vm: '1',
        name: 'MRAcquisitionFrequencyEncodingSteps'
    },
    '(0018,9059)': {
        tag: '(0018,9059)',
        vr: 'CS',
        vm: '1',
        name: 'Decoupling'
    },
    '(0018,9060)': {
        tag: '(0018,9060)',
        vr: 'CS',
        vm: '1-2',
        name: 'DecoupledNucleus'
    },
    '(0018,9061)': {
        tag: '(0018,9061)',
        vr: 'FD',
        vm: '1-2',
        name: 'DecouplingFrequency'
    },
    '(0018,9062)': {
        tag: '(0018,9062)',
        vr: 'CS',
        vm: '1',
        name: 'DecouplingMethod'
    },
    '(0018,9063)': {
        tag: '(0018,9063)',
        vr: 'FD',
        vm: '1-2',
        name: 'DecouplingChemicalShiftReference'
    },
    '(0018,9064)': {
        tag: '(0018,9064)',
        vr: 'CS',
        vm: '1',
        name: 'KSpaceFiltering'
    },
    '(0018,9065)': {
        tag: '(0018,9065)',
        vr: 'CS',
        vm: '1-2',
        name: 'TimeDomainFiltering'
    },
    '(0018,9066)': {
        tag: '(0018,9066)',
        vr: 'US',
        vm: '1-2',
        name: 'NumberOfZeroFills'
    },
    '(0018,9067)': {
        tag: '(0018,9067)',
        vr: 'CS',
        vm: '1',
        name: 'BaselineCorrection'
    },
    '(0018,9069)': {
        tag: '(0018,9069)',
        vr: 'FD',
        vm: '1',
        name: 'ParallelReductionFactorInPlane'
    },
    '(0018,9070)': {
        tag: '(0018,9070)',
        vr: 'FD',
        vm: '1',
        name: 'CardiacRRIntervalSpecified'
    },
    '(0018,9073)': {
        tag: '(0018,9073)',
        vr: 'FD',
        vm: '1',
        name: 'AcquisitionDuration'
    },
    '(0018,9074)': {
        tag: '(0018,9074)',
        vr: 'DT',
        vm: '1',
        name: 'FrameAcquisitionDateTime'
    },
    '(0018,9075)': {
        tag: '(0018,9075)',
        vr: 'CS',
        vm: '1',
        name: 'DiffusionDirectionality'
    },
    '(0018,9076)': {
        tag: '(0018,9076)',
        vr: 'SQ',
        vm: '1',
        name: 'DiffusionGradientDirectionSequence'
    },
    '(0018,9077)': {
        tag: '(0018,9077)',
        vr: 'CS',
        vm: '1',
        name: 'ParallelAcquisition'
    },
    '(0018,9078)': {
        tag: '(0018,9078)',
        vr: 'CS',
        vm: '1',
        name: 'ParallelAcquisitionTechnique'
    },
    '(0018,9079)': {
        tag: '(0018,9079)',
        vr: 'FD',
        vm: '1-n',
        name: 'InversionTimes'
    },
    '(0018,9080)': {
        tag: '(0018,9080)',
        vr: 'ST',
        vm: '1',
        name: 'MetaboliteMapDescription'
    },
    '(0018,9081)': {
        tag: '(0018,9081)',
        vr: 'CS',
        vm: '1',
        name: 'PartialFourier'
    },
    '(0018,9082)': {
        tag: '(0018,9082)',
        vr: 'FD',
        vm: '1',
        name: 'EffectiveEchoTime'
    },
    '(0018,9083)': {
        tag: '(0018,9083)',
        vr: 'SQ',
        vm: '1',
        name: 'MetaboliteMapCodeSequence'
    },
    '(0018,9084)': {
        tag: '(0018,9084)',
        vr: 'SQ',
        vm: '1',
        name: 'ChemicalShiftSequence'
    },
    '(0018,9085)': {
        tag: '(0018,9085)',
        vr: 'CS',
        vm: '1',
        name: 'CardiacSignalSource'
    },
    '(0018,9087)': {
        tag: '(0018,9087)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValue'
    },
    '(0018,9089)': {
        tag: '(0018,9089)',
        vr: 'FD',
        vm: '3',
        name: 'DiffusionGradientOrientation'
    },
    '(0018,9090)': {
        tag: '(0018,9090)',
        vr: 'FD',
        vm: '3',
        name: 'VelocityEncodingDirection'
    },
    '(0018,9091)': {
        tag: '(0018,9091)',
        vr: 'FD',
        vm: '1',
        name: 'VelocityEncodingMinimumValue'
    },
    '(0018,9092)': {
        tag: '(0018,9092)',
        vr: 'SQ',
        vm: '1',
        name: 'VelocityEncodingAcquisitionSequence'
    },
    '(0018,9093)': {
        tag: '(0018,9093)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfKSpaceTrajectories'
    },
    '(0018,9094)': {
        tag: '(0018,9094)',
        vr: 'CS',
        vm: '1',
        name: 'CoverageOfKSpace'
    },
    '(0018,9095)': {
        tag: '(0018,9095)',
        vr: 'UL',
        vm: '1',
        name: 'SpectroscopyAcquisitionPhaseRows'
    },
    '(0018,9096)': {
        tag: '(0018,9096)',
        vr: 'FD',
        vm: '1',
        name: 'ParallelReductionFactorInPlaneRetired'
    },
    '(0018,9098)': {
        tag: '(0018,9098)',
        vr: 'FD',
        vm: '1-2',
        name: 'TransmitterFrequency'
    },
    '(0018,9100)': {
        tag: '(0018,9100)',
        vr: 'CS',
        vm: '1-2',
        name: 'ResonantNucleus'
    },
    '(0018,9101)': {
        tag: '(0018,9101)',
        vr: 'CS',
        vm: '1',
        name: 'FrequencyCorrection'
    },
    '(0018,9103)': {
        tag: '(0018,9103)',
        vr: 'SQ',
        vm: '1',
        name: 'MRSpectroscopyFOVGeometrySequence'
    },
    '(0018,9104)': {
        tag: '(0018,9104)',
        vr: 'FD',
        vm: '1',
        name: 'SlabThickness'
    },
    '(0018,9105)': {
        tag: '(0018,9105)',
        vr: 'FD',
        vm: '3',
        name: 'SlabOrientation'
    },
    '(0018,9106)': {
        tag: '(0018,9106)',
        vr: 'FD',
        vm: '3',
        name: 'MidSlabPosition'
    },
    '(0018,9107)': {
        tag: '(0018,9107)',
        vr: 'SQ',
        vm: '1',
        name: 'MRSpatialSaturationSequence'
    },
    '(0018,9112)': {
        tag: '(0018,9112)',
        vr: 'SQ',
        vm: '1',
        name: 'MRTimingAndRelatedParametersSequence'
    },
    '(0018,9114)': {
        tag: '(0018,9114)',
        vr: 'SQ',
        vm: '1',
        name: 'MREchoSequence'
    },
    '(0018,9115)': {
        tag: '(0018,9115)',
        vr: 'SQ',
        vm: '1',
        name: 'MRModifierSequence'
    },
    '(0018,9117)': {
        tag: '(0018,9117)',
        vr: 'SQ',
        vm: '1',
        name: 'MRDiffusionSequence'
    },
    '(0018,9118)': {
        tag: '(0018,9118)',
        vr: 'SQ',
        vm: '1',
        name: 'CardiacSynchronizationSequence'
    },
    '(0018,9119)': {
        tag: '(0018,9119)',
        vr: 'SQ',
        vm: '1',
        name: 'MRAveragesSequence'
    },
    '(0018,9125)': {
        tag: '(0018,9125)',
        vr: 'SQ',
        vm: '1',
        name: 'MRFOVGeometrySequence'
    },
    '(0018,9126)': {
        tag: '(0018,9126)',
        vr: 'SQ',
        vm: '1',
        name: 'VolumeLocalizationSequence'
    },
    '(0018,9127)': {
        tag: '(0018,9127)',
        vr: 'UL',
        vm: '1',
        name: 'SpectroscopyAcquisitionDataColumns'
    },
    '(0018,9147)': {
        tag: '(0018,9147)',
        vr: 'CS',
        vm: '1',
        name: 'DiffusionAnisotropyType'
    },
    '(0018,9151)': {
        tag: '(0018,9151)',
        vr: 'DT',
        vm: '1',
        name: 'FrameReferenceDateTime'
    },
    '(0018,9152)': {
        tag: '(0018,9152)',
        vr: 'SQ',
        vm: '1',
        name: 'MRMetaboliteMapSequence'
    },
    '(0018,9155)': {
        tag: '(0018,9155)',
        vr: 'FD',
        vm: '1',
        name: 'ParallelReductionFactorOutOfPlane'
    },
    '(0018,9159)': {
        tag: '(0018,9159)',
        vr: 'UL',
        vm: '1',
        name: 'SpectroscopyAcquisitionOutOfPlanePhaseSteps'
    },
    '(0018,9166)': {
        tag: '(0018,9166)',
        vr: 'CS',
        vm: '1',
        name: 'BulkMotionStatus'
    },
    '(0018,9168)': {
        tag: '(0018,9168)',
        vr: 'FD',
        vm: '1',
        name: 'ParallelReductionFactorSecondInPlane'
    },
    '(0018,9169)': {
        tag: '(0018,9169)',
        vr: 'CS',
        vm: '1',
        name: 'CardiacBeatRejectionTechnique'
    },
    '(0018,9170)': {
        tag: '(0018,9170)',
        vr: 'CS',
        vm: '1',
        name: 'RespiratoryMotionCompensationTechnique'
    },
    '(0018,9171)': {
        tag: '(0018,9171)',
        vr: 'CS',
        vm: '1',
        name: 'RespiratorySignalSource'
    },
    '(0018,9172)': {
        tag: '(0018,9172)',
        vr: 'CS',
        vm: '1',
        name: 'BulkMotionCompensationTechnique'
    },
    '(0018,9173)': {
        tag: '(0018,9173)',
        vr: 'CS',
        vm: '1',
        name: 'BulkMotionSignalSource'
    },
    '(0018,9174)': {
        tag: '(0018,9174)',
        vr: 'CS',
        vm: '1',
        name: 'ApplicableSafetyStandardAgency'
    },
    '(0018,9175)': {
        tag: '(0018,9175)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicableSafetyStandardDescription'
    },
    '(0018,9176)': {
        tag: '(0018,9176)',
        vr: 'SQ',
        vm: '1',
        name: 'OperatingModeSequence'
    },
    '(0018,9177)': {
        tag: '(0018,9177)',
        vr: 'CS',
        vm: '1',
        name: 'OperatingModeType'
    },
    '(0018,9178)': {
        tag: '(0018,9178)',
        vr: 'CS',
        vm: '1',
        name: 'OperatingMode'
    },
    '(0018,9179)': {
        tag: '(0018,9179)',
        vr: 'CS',
        vm: '1',
        name: 'SpecificAbsorptionRateDefinition'
    },
    '(0018,9180)': {
        tag: '(0018,9180)',
        vr: 'CS',
        vm: '1',
        name: 'GradientOutputType'
    },
    '(0018,9181)': {
        tag: '(0018,9181)',
        vr: 'FD',
        vm: '1',
        name: 'SpecificAbsorptionRateValue'
    },
    '(0018,9182)': {
        tag: '(0018,9182)',
        vr: 'FD',
        vm: '1',
        name: 'GradientOutput'
    },
    '(0018,9183)': {
        tag: '(0018,9183)',
        vr: 'CS',
        vm: '1',
        name: 'FlowCompensationDirection'
    },
    '(0018,9184)': {
        tag: '(0018,9184)',
        vr: 'FD',
        vm: '1',
        name: 'TaggingDelay'
    },
    '(0018,9185)': {
        tag: '(0018,9185)',
        vr: 'ST',
        vm: '1',
        name: 'RespiratoryMotionCompensationTechniqueDescription'
    },
    '(0018,9186)': {
        tag: '(0018,9186)',
        vr: 'SH',
        vm: '1',
        name: 'RespiratorySignalSourceID'
    },
    '(0018,9195)': {
        tag: '(0018,9195)',
        vr: 'FD',
        vm: '1',
        name: 'ChemicalShiftMinimumIntegrationLimitInHz'
    },
    '(0018,9196)': {
        tag: '(0018,9196)',
        vr: 'FD',
        vm: '1',
        name: 'ChemicalShiftMaximumIntegrationLimitInHz'
    },
    '(0018,9197)': {
        tag: '(0018,9197)',
        vr: 'SQ',
        vm: '1',
        name: 'MRVelocityEncodingSequence'
    },
    '(0018,9198)': {
        tag: '(0018,9198)',
        vr: 'CS',
        vm: '1',
        name: 'FirstOrderPhaseCorrection'
    },
    '(0018,9199)': {
        tag: '(0018,9199)',
        vr: 'CS',
        vm: '1',
        name: 'WaterReferencedPhaseCorrection'
    },
    '(0018,9200)': {
        tag: '(0018,9200)',
        vr: 'CS',
        vm: '1',
        name: 'MRSpectroscopyAcquisitionType'
    },
    '(0018,9214)': {
        tag: '(0018,9214)',
        vr: 'CS',
        vm: '1',
        name: 'RespiratoryCyclePosition'
    },
    '(0018,9217)': {
        tag: '(0018,9217)',
        vr: 'FD',
        vm: '1',
        name: 'VelocityEncodingMaximumValue'
    },
    '(0018,9218)': {
        tag: '(0018,9218)',
        vr: 'FD',
        vm: '1',
        name: 'TagSpacingSecondDimension'
    },
    '(0018,9219)': {
        tag: '(0018,9219)',
        vr: 'SS',
        vm: '1',
        name: 'TagAngleSecondAxis'
    },
    '(0018,9220)': {
        tag: '(0018,9220)',
        vr: 'FD',
        vm: '1',
        name: 'FrameAcquisitionDuration'
    },
    '(0018,9226)': {
        tag: '(0018,9226)',
        vr: 'SQ',
        vm: '1',
        name: 'MRImageFrameTypeSequence'
    },
    '(0018,9227)': {
        tag: '(0018,9227)',
        vr: 'SQ',
        vm: '1',
        name: 'MRSpectroscopyFrameTypeSequence'
    },
    '(0018,9231)': {
        tag: '(0018,9231)',
        vr: 'US',
        vm: '1',
        name: 'MRAcquisitionPhaseEncodingStepsInPlane'
    },
    '(0018,9232)': {
        tag: '(0018,9232)',
        vr: 'US',
        vm: '1',
        name: 'MRAcquisitionPhaseEncodingStepsOutOfPlane'
    },
    '(0018,9234)': {
        tag: '(0018,9234)',
        vr: 'UL',
        vm: '1',
        name: 'SpectroscopyAcquisitionPhaseColumns'
    },
    '(0018,9236)': {
        tag: '(0018,9236)',
        vr: 'CS',
        vm: '1',
        name: 'CardiacCyclePosition'
    },
    '(0018,9239)': {
        tag: '(0018,9239)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecificAbsorptionRateSequence'
    },
    '(0018,9240)': {
        tag: '(0018,9240)',
        vr: 'US',
        vm: '1',
        name: 'RFEchoTrainLength'
    },
    '(0018,9241)': {
        tag: '(0018,9241)',
        vr: 'US',
        vm: '1',
        name: 'GradientEchoTrainLength'
    },
    '(0018,9250)': {
        tag: '(0018,9250)',
        vr: 'CS',
        vm: '1',
        name: 'ArterialSpinLabelingContrast'
    },
    '(0018,9251)': {
        tag: '(0018,9251)',
        vr: 'SQ',
        vm: '1',
        name: 'MRArterialSpinLabelingSequence'
    },
    '(0018,9252)': {
        tag: '(0018,9252)',
        vr: 'LO',
        vm: '1',
        name: 'ASLTechniqueDescription'
    },
    '(0018,9253)': {
        tag: '(0018,9253)',
        vr: 'US',
        vm: '1',
        name: 'ASLSlabNumber'
    },
    '(0018,9254)': {
        tag: '(0018,9254)',
        vr: 'FD',
        vm: '1 ',
        name: 'ASLSlabThickness'
    },
    '(0018,9255)': {
        tag: '(0018,9255)',
        vr: 'FD',
        vm: '3 ',
        name: 'ASLSlabOrientation'
    },
    '(0018,9256)': {
        tag: '(0018,9256)',
        vr: 'FD',
        vm: '3',
        name: 'ASLMidSlabPosition'
    },
    '(0018,9257)': {
        tag: '(0018,9257)',
        vr: 'CS',
        vm: '1 ',
        name: 'ASLContext'
    },
    '(0018,9258)': {
        tag: '(0018,9258)',
        vr: 'UL',
        vm: '1',
        name: 'ASLPulseTrainDuration'
    },
    '(0018,9259)': {
        tag: '(0018,9259)',
        vr: 'CS',
        vm: '1 ',
        name: 'ASLCrusherFlag'
    },
    '(0018,925A)': {
        tag: '(0018,925A)',
        vr: 'FD',
        vm: '1',
        name: 'ASLCrusherFlow'
    },
    '(0018,925B)': {
        tag: '(0018,925B)',
        vr: 'LO',
        vm: '1',
        name: 'ASLCrusherDescription'
    },
    '(0018,925C)': {
        tag: '(0018,925C)',
        vr: 'CS',
        vm: '1 ',
        name: 'ASLBolusCutoffFlag'
    },
    '(0018,925D)': {
        tag: '(0018,925D)',
        vr: 'SQ',
        vm: '1',
        name: 'ASLBolusCutoffTimingSequence'
    },
    '(0018,925E)': {
        tag: '(0018,925E)',
        vr: 'LO',
        vm: '1',
        name: 'ASLBolusCutoffTechnique'
    },
    '(0018,925F)': {
        tag: '(0018,925F)',
        vr: 'UL',
        vm: '1',
        name: 'ASLBolusCutoffDelayTime'
    },
    '(0018,9260)': {
        tag: '(0018,9260)',
        vr: 'SQ',
        vm: '1',
        name: 'ASLSlabSequence'
    },
    '(0018,9295)': {
        tag: '(0018,9295)',
        vr: 'FD',
        vm: '1',
        name: 'ChemicalShiftMinimumIntegrationLimitInppm'
    },
    '(0018,9296)': {
        tag: '(0018,9296)',
        vr: 'FD',
        vm: '1',
        name: 'ChemicalShiftMaximumIntegrationLimitInppm'
    },
    '(0018,9301)': {
        tag: '(0018,9301)',
        vr: 'SQ',
        vm: '1',
        name: 'CTAcquisitionTypeSequence'
    },
    '(0018,9302)': {
        tag: '(0018,9302)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionType'
    },
    '(0018,9303)': {
        tag: '(0018,9303)',
        vr: 'FD',
        vm: '1',
        name: 'TubeAngle'
    },
    '(0018,9304)': {
        tag: '(0018,9304)',
        vr: 'SQ',
        vm: '1',
        name: 'CTAcquisitionDetailsSequence'
    },
    '(0018,9305)': {
        tag: '(0018,9305)',
        vr: 'FD',
        vm: '1',
        name: 'RevolutionTime'
    },
    '(0018,9306)': {
        tag: '(0018,9306)',
        vr: 'FD',
        vm: '1',
        name: 'SingleCollimationWidth'
    },
    '(0018,9307)': {
        tag: '(0018,9307)',
        vr: 'FD',
        vm: '1',
        name: 'TotalCollimationWidth'
    },
    '(0018,9308)': {
        tag: '(0018,9308)',
        vr: 'SQ',
        vm: '1',
        name: 'CTTableDynamicsSequence'
    },
    '(0018,9309)': {
        tag: '(0018,9309)',
        vr: 'FD',
        vm: '1',
        name: 'TableSpeed'
    },
    '(0018,9310)': {
        tag: '(0018,9310)',
        vr: 'FD',
        vm: '1',
        name: 'TableFeedPerRotation'
    },
    '(0018,9311)': {
        tag: '(0018,9311)',
        vr: 'FD',
        vm: '1',
        name: 'SpiralPitchFactor'
    },
    '(0018,9312)': {
        tag: '(0018,9312)',
        vr: 'SQ',
        vm: '1',
        name: 'CTGeometrySequence'
    },
    '(0018,9313)': {
        tag: '(0018,9313)',
        vr: 'FD',
        vm: '3',
        name: 'DataCollectionCenterPatient'
    },
    '(0018,9314)': {
        tag: '(0018,9314)',
        vr: 'SQ',
        vm: '1',
        name: 'CTReconstructionSequence'
    },
    '(0018,9315)': {
        tag: '(0018,9315)',
        vr: 'CS',
        vm: '1',
        name: 'ReconstructionAlgorithm'
    },
    '(0018,9316)': {
        tag: '(0018,9316)',
        vr: 'CS',
        vm: '1',
        name: 'ConvolutionKernelGroup'
    },
    '(0018,9317)': {
        tag: '(0018,9317)',
        vr: 'FD',
        vm: '2',
        name: 'ReconstructionFieldOfView'
    },
    '(0018,9318)': {
        tag: '(0018,9318)',
        vr: 'FD',
        vm: '3',
        name: 'ReconstructionTargetCenterPatient'
    },
    '(0018,9319)': {
        tag: '(0018,9319)',
        vr: 'FD',
        vm: '1',
        name: 'ReconstructionAngle'
    },
    '(0018,9320)': {
        tag: '(0018,9320)',
        vr: 'SH',
        vm: '1',
        name: 'ImageFilter'
    },
    '(0018,9321)': {
        tag: '(0018,9321)',
        vr: 'SQ',
        vm: '1',
        name: 'CTExposureSequence'
    },
    '(0018,9322)': {
        tag: '(0018,9322)',
        vr: 'FD',
        vm: '2',
        name: 'ReconstructionPixelSpacing'
    },
    '(0018,9323)': {
        tag: '(0018,9323)',
        vr: 'CS',
        vm: '1',
        name: 'ExposureModulationType'
    },
    '(0018,9324)': {
        tag: '(0018,9324)',
        vr: 'FD',
        vm: '1',
        name: 'EstimatedDoseSaving'
    },
    '(0018,9325)': {
        tag: '(0018,9325)',
        vr: 'SQ',
        vm: '1',
        name: 'CTXRayDetailsSequence'
    },
    '(0018,9326)': {
        tag: '(0018,9326)',
        vr: 'SQ',
        vm: '1',
        name: 'CTPositionSequence'
    },
    '(0018,9327)': {
        tag: '(0018,9327)',
        vr: 'FD',
        vm: '1',
        name: 'TablePosition'
    },
    '(0018,9328)': {
        tag: '(0018,9328)',
        vr: 'FD',
        vm: '1',
        name: 'ExposureTimeInms'
    },
    '(0018,9329)': {
        tag: '(0018,9329)',
        vr: 'SQ',
        vm: '1',
        name: 'CTImageFrameTypeSequence'
    },
    '(0018,9330)': {
        tag: '(0018,9330)',
        vr: 'FD',
        vm: '1',
        name: 'XRayTubeCurrentInmA'
    },
    '(0018,9332)': {
        tag: '(0018,9332)',
        vr: 'FD',
        vm: '1',
        name: 'ExposureInmAs'
    },
    '(0018,9333)': {
        tag: '(0018,9333)',
        vr: 'CS',
        vm: '1',
        name: 'ConstantVolumeFlag'
    },
    '(0018,9334)': {
        tag: '(0018,9334)',
        vr: 'CS',
        vm: '1',
        name: 'FluoroscopyFlag'
    },
    '(0018,9335)': {
        tag: '(0018,9335)',
        vr: 'FD',
        vm: '1',
        name: 'DistanceSourceToDataCollectionCenter'
    },
    '(0018,9337)': {
        tag: '(0018,9337)',
        vr: 'US',
        vm: '1',
        name: 'ContrastBolusAgentNumber'
    },
    '(0018,9338)': {
        tag: '(0018,9338)',
        vr: 'SQ',
        vm: '1',
        name: 'ContrastBolusIngredientCodeSequence'
    },
    '(0018,9340)': {
        tag: '(0018,9340)',
        vr: 'SQ',
        vm: '1',
        name: 'ContrastAdministrationProfileSequence'
    },
    '(0018,9341)': {
        tag: '(0018,9341)',
        vr: 'SQ',
        vm: '1',
        name: 'ContrastBolusUsageSequence'
    },
    '(0018,9342)': {
        tag: '(0018,9342)',
        vr: 'CS',
        vm: '1',
        name: 'ContrastBolusAgentAdministered'
    },
    '(0018,9343)': {
        tag: '(0018,9343)',
        vr: 'CS',
        vm: '1',
        name: 'ContrastBolusAgentDetected'
    },
    '(0018,9344)': {
        tag: '(0018,9344)',
        vr: 'CS',
        vm: '1',
        name: 'ContrastBolusAgentPhase'
    },
    '(0018,9345)': {
        tag: '(0018,9345)',
        vr: 'FD',
        vm: '1',
        name: 'CTDIvol'
    },
    '(0018,9346)': {
        tag: '(0018,9346)',
        vr: 'SQ',
        vm: '1',
        name: 'CTDIPhantomTypeCodeSequence'
    },
    '(0018,9351)': {
        tag: '(0018,9351)',
        vr: 'FL',
        vm: '1',
        name: 'CalciumScoringMassFactorPatient'
    },
    '(0018,9352)': {
        tag: '(0018,9352)',
        vr: 'FL',
        vm: '3',
        name: 'CalciumScoringMassFactorDevice'
    },
    '(0018,9353)': {
        tag: '(0018,9353)',
        vr: 'FL',
        vm: '1',
        name: 'EnergyWeightingFactor'
    },
    '(0018,9360)': {
        tag: '(0018,9360)',
        vr: 'SQ',
        vm: '1',
        name: 'CTAdditionalXRaySourceSequence'
    },
    '(0018,9401)': {
        tag: '(0018,9401)',
        vr: 'SQ',
        vm: '1',
        name: 'ProjectionPixelCalibrationSequence'
    },
    '(0018,9402)': {
        tag: '(0018,9402)',
        vr: 'FL',
        vm: '1',
        name: 'DistanceSourceToIsocenter'
    },
    '(0018,9403)': {
        tag: '(0018,9403)',
        vr: 'FL',
        vm: '1',
        name: 'DistanceObjectToTableTop'
    },
    '(0018,9404)': {
        tag: '(0018,9404)',
        vr: 'FL',
        vm: '2',
        name: 'ObjectPixelSpacingInCenterOfBeam'
    },
    '(0018,9405)': {
        tag: '(0018,9405)',
        vr: 'SQ',
        vm: '1',
        name: 'PositionerPositionSequence'
    },
    '(0018,9406)': {
        tag: '(0018,9406)',
        vr: 'SQ',
        vm: '1',
        name: 'TablePositionSequence'
    },
    '(0018,9407)': {
        tag: '(0018,9407)',
        vr: 'SQ',
        vm: '1',
        name: 'CollimatorShapeSequence'
    },
    '(0018,9410)': {
        tag: '(0018,9410)',
        vr: 'CS',
        vm: '1',
        name: 'PlanesInAcquisition'
    },
    '(0018,9412)': {
        tag: '(0018,9412)',
        vr: 'SQ',
        vm: '1',
        name: 'XAXRFFrameCharacteristicsSequence'
    },
    '(0018,9417)': {
        tag: '(0018,9417)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameAcquisitionSequence'
    },
    '(0018,9420)': {
        tag: '(0018,9420)',
        vr: 'CS',
        vm: '1',
        name: 'XRayReceptorType'
    },
    '(0018,9423)': {
        tag: '(0018,9423)',
        vr: 'LO',
        vm: '1',
        name: 'AcquisitionProtocolName'
    },
    '(0018,9424)': {
        tag: '(0018,9424)',
        vr: 'LT',
        vm: '1',
        name: 'AcquisitionProtocolDescription'
    },
    '(0018,9425)': {
        tag: '(0018,9425)',
        vr: 'CS',
        vm: '1',
        name: 'ContrastBolusIngredientOpaque'
    },
    '(0018,9426)': {
        tag: '(0018,9426)',
        vr: 'FL',
        vm: '1',
        name: 'DistanceReceptorPlaneToDetectorHousing'
    },
    '(0018,9427)': {
        tag: '(0018,9427)',
        vr: 'CS',
        vm: '1',
        name: 'IntensifierActiveShape'
    },
    '(0018,9428)': {
        tag: '(0018,9428)',
        vr: 'FL',
        vm: '1-2',
        name: 'IntensifierActiveDimensions'
    },
    '(0018,9429)': {
        tag: '(0018,9429)',
        vr: 'FL',
        vm: '2',
        name: 'PhysicalDetectorSize'
    },
    '(0018,9430)': {
        tag: '(0018,9430)',
        vr: 'FL',
        vm: '2',
        name: 'PositionOfIsocenterProjection'
    },
    '(0018,9432)': {
        tag: '(0018,9432)',
        vr: 'SQ',
        vm: '1',
        name: 'FieldOfViewSequence'
    },
    '(0018,9433)': {
        tag: '(0018,9433)',
        vr: 'LO',
        vm: '1',
        name: 'FieldOfViewDescription'
    },
    '(0018,9434)': {
        tag: '(0018,9434)',
        vr: 'SQ',
        vm: '1',
        name: 'ExposureControlSensingRegionsSequence'
    },
    '(0018,9435)': {
        tag: '(0018,9435)',
        vr: 'CS',
        vm: '1',
        name: 'ExposureControlSensingRegionShape'
    },
    '(0018,9436)': {
        tag: '(0018,9436)',
        vr: 'SS',
        vm: '1',
        name: 'ExposureControlSensingRegionLeftVerticalEdge'
    },
    '(0018,9437)': {
        tag: '(0018,9437)',
        vr: 'SS',
        vm: '1',
        name: 'ExposureControlSensingRegionRightVerticalEdge'
    },
    '(0018,9438)': {
        tag: '(0018,9438)',
        vr: 'SS',
        vm: '1',
        name: 'ExposureControlSensingRegionUpperHorizontalEdge'
    },
    '(0018,9439)': {
        tag: '(0018,9439)',
        vr: 'SS',
        vm: '1',
        name: 'ExposureControlSensingRegionLowerHorizontalEdge'
    },
    '(0018,9440)': {
        tag: '(0018,9440)',
        vr: 'SS',
        vm: '2',
        name: 'CenterOfCircularExposureControlSensingRegion'
    },
    '(0018,9441)': {
        tag: '(0018,9441)',
        vr: 'US',
        vm: '1',
        name: 'RadiusOfCircularExposureControlSensingRegion'
    },
    '(0018,9442)': {
        tag: '(0018,9442)',
        vr: 'SS',
        vm: '2-n',
        name: 'VerticesOfThePolygonalExposureControlSensingRegion'
    },
    '(0018,9447)': {
        tag: '(0018,9447)',
        vr: 'FL',
        vm: '1',
        name: 'ColumnAngulationPatient'
    },
    '(0018,9449)': {
        tag: '(0018,9449)',
        vr: 'FL',
        vm: '1',
        name: 'BeamAngle'
    },
    '(0018,9451)': {
        tag: '(0018,9451)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameDetectorParametersSequence'
    },
    '(0018,9452)': {
        tag: '(0018,9452)',
        vr: 'FL',
        vm: '1',
        name: 'CalculatedAnatomyThickness'
    },
    '(0018,9455)': {
        tag: '(0018,9455)',
        vr: 'SQ',
        vm: '1',
        name: 'CalibrationSequence'
    },
    '(0018,9456)': {
        tag: '(0018,9456)',
        vr: 'SQ',
        vm: '1',
        name: 'ObjectThicknessSequence'
    },
    '(0018,9457)': {
        tag: '(0018,9457)',
        vr: 'CS',
        vm: '1',
        name: 'PlaneIdentification'
    },
    '(0018,9461)': {
        tag: '(0018,9461)',
        vr: 'FL',
        vm: '1-2',
        name: 'FieldOfViewDimensionsInFloat'
    },
    '(0018,9462)': {
        tag: '(0018,9462)',
        vr: 'SQ',
        vm: '1',
        name: 'IsocenterReferenceSystemSequence'
    },
    '(0018,9463)': {
        tag: '(0018,9463)',
        vr: 'FL',
        vm: '1',
        name: 'PositionerIsocenterPrimaryAngle'
    },
    '(0018,9464)': {
        tag: '(0018,9464)',
        vr: 'FL',
        vm: '1',
        name: 'PositionerIsocenterSecondaryAngle'
    },
    '(0018,9465)': {
        tag: '(0018,9465)',
        vr: 'FL',
        vm: '1',
        name: 'PositionerIsocenterDetectorRotationAngle'
    },
    '(0018,9466)': {
        tag: '(0018,9466)',
        vr: 'FL',
        vm: '1',
        name: 'TableXPositionToIsocenter'
    },
    '(0018,9467)': {
        tag: '(0018,9467)',
        vr: 'FL',
        vm: '1',
        name: 'TableYPositionToIsocenter'
    },
    '(0018,9468)': {
        tag: '(0018,9468)',
        vr: 'FL',
        vm: '1',
        name: 'TableZPositionToIsocenter'
    },
    '(0018,9469)': {
        tag: '(0018,9469)',
        vr: 'FL',
        vm: '1',
        name: 'TableHorizontalRotationAngle'
    },
    '(0018,9470)': {
        tag: '(0018,9470)',
        vr: 'FL',
        vm: '1',
        name: 'TableHeadTiltAngle'
    },
    '(0018,9471)': {
        tag: '(0018,9471)',
        vr: 'FL',
        vm: '1',
        name: 'TableCradleTiltAngle'
    },
    '(0018,9472)': {
        tag: '(0018,9472)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameDisplayShutterSequence'
    },
    '(0018,9473)': {
        tag: '(0018,9473)',
        vr: 'FL',
        vm: '1',
        name: 'AcquiredImageAreaDoseProduct'
    },
    '(0018,9474)': {
        tag: '(0018,9474)',
        vr: 'CS',
        vm: '1',
        name: 'CArmPositionerTabletopRelationship'
    },
    '(0018,9476)': {
        tag: '(0018,9476)',
        vr: 'SQ',
        vm: '1',
        name: 'XRayGeometrySequence'
    },
    '(0018,9477)': {
        tag: '(0018,9477)',
        vr: 'SQ',
        vm: '1',
        name: 'IrradiationEventIdentificationSequence'
    },
    '(0018,9504)': {
        tag: '(0018,9504)',
        vr: 'SQ',
        vm: '1',
        name: 'XRay3DFrameTypeSequence'
    },
    '(0018,9506)': {
        tag: '(0018,9506)',
        vr: 'SQ',
        vm: '1',
        name: 'ContributingSourcesSequence'
    },
    '(0018,9507)': {
        tag: '(0018,9507)',
        vr: 'SQ',
        vm: '1',
        name: 'XRay3DAcquisitionSequence'
    },
    '(0018,9508)': {
        tag: '(0018,9508)',
        vr: 'FL',
        vm: '1',
        name: 'PrimaryPositionerScanArc'
    },
    '(0018,9509)': {
        tag: '(0018,9509)',
        vr: 'FL',
        vm: '1',
        name: 'SecondaryPositionerScanArc'
    },
    '(0018,9510)': {
        tag: '(0018,9510)',
        vr: 'FL',
        vm: '1',
        name: 'PrimaryPositionerScanStartAngle'
    },
    '(0018,9511)': {
        tag: '(0018,9511)',
        vr: 'FL',
        vm: '1',
        name: 'SecondaryPositionerScanStartAngle'
    },
    '(0018,9514)': {
        tag: '(0018,9514)',
        vr: 'FL',
        vm: '1',
        name: 'PrimaryPositionerIncrement'
    },
    '(0018,9515)': {
        tag: '(0018,9515)',
        vr: 'FL',
        vm: '1',
        name: 'SecondaryPositionerIncrement'
    },
    '(0018,9516)': {
        tag: '(0018,9516)',
        vr: 'DT',
        vm: '1',
        name: 'StartAcquisitionDateTime'
    },
    '(0018,9517)': {
        tag: '(0018,9517)',
        vr: 'DT',
        vm: '1',
        name: 'EndAcquisitionDateTime'
    },
    '(0018,9524)': {
        tag: '(0018,9524)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicationName'
    },
    '(0018,9525)': {
        tag: '(0018,9525)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicationVersion'
    },
    '(0018,9526)': {
        tag: '(0018,9526)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicationManufacturer'
    },
    '(0018,9527)': {
        tag: '(0018,9527)',
        vr: 'CS',
        vm: '1',
        name: 'AlgorithmType'
    },
    '(0018,9528)': {
        tag: '(0018,9528)',
        vr: 'LO',
        vm: '1',
        name: 'AlgorithmDescription'
    },
    '(0018,9530)': {
        tag: '(0018,9530)',
        vr: 'SQ',
        vm: '1',
        name: 'XRay3DReconstructionSequence'
    },
    '(0018,9531)': {
        tag: '(0018,9531)',
        vr: 'LO',
        vm: '1',
        name: 'ReconstructionDescription'
    },
    '(0018,9538)': {
        tag: '(0018,9538)',
        vr: 'SQ',
        vm: '1',
        name: 'PerProjectionAcquisitionSequence'
    },
    '(0018,9601)': {
        tag: '(0018,9601)',
        vr: 'SQ',
        vm: '1',
        name: 'DiffusionBMatrixSequence'
    },
    '(0018,9602)': {
        tag: '(0018,9602)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValueXX'
    },
    '(0018,9603)': {
        tag: '(0018,9603)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValueXY'
    },
    '(0018,9604)': {
        tag: '(0018,9604)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValueXZ'
    },
    '(0018,9605)': {
        tag: '(0018,9605)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValueYY'
    },
    '(0018,9606)': {
        tag: '(0018,9606)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValueYZ'
    },
    '(0018,9607)': {
        tag: '(0018,9607)',
        vr: 'FD',
        vm: '1',
        name: 'DiffusionBValueZZ'
    },
    '(0018,9701)': {
        tag: '(0018,9701)',
        vr: 'DT',
        vm: '1',
        name: 'DecayCorrectionDateTime'
    },
    '(0018,9715)': {
        tag: '(0018,9715)',
        vr: 'FD',
        vm: '1',
        name: 'StartDensityThreshold'
    },
    '(0018,9716)': {
        tag: '(0018,9716)',
        vr: 'FD',
        vm: '1',
        name: 'StartRelativeDensityDifferenceThreshold'
    },
    '(0018,9717)': {
        tag: '(0018,9717)',
        vr: 'FD',
        vm: '1',
        name: 'StartCardiacTriggerCountThreshold'
    },
    '(0018,9718)': {
        tag: '(0018,9718)',
        vr: 'FD',
        vm: '1',
        name: 'StartRespiratoryTriggerCountThreshold'
    },
    '(0018,9719)': {
        tag: '(0018,9719)',
        vr: 'FD',
        vm: '1',
        name: 'TerminationCountsThreshold'
    },
    '(0018,9720)': {
        tag: '(0018,9720)',
        vr: 'FD',
        vm: '1',
        name: 'TerminationDensityThreshold'
    },
    '(0018,9721)': {
        tag: '(0018,9721)',
        vr: 'FD',
        vm: '1',
        name: 'TerminationRelativeDensityThreshold'
    },
    '(0018,9722)': {
        tag: '(0018,9722)',
        vr: 'FD',
        vm: '1',
        name: 'TerminationTimeThreshold'
    },
    '(0018,9723)': {
        tag: '(0018,9723)',
        vr: 'FD',
        vm: '1',
        name: 'TerminationCardiacTriggerCountThreshold'
    },
    '(0018,9724)': {
        tag: '(0018,9724)',
        vr: 'FD',
        vm: '1',
        name: 'TerminationRespiratoryTriggerCountThreshold'
    },
    '(0018,9725)': {
        tag: '(0018,9725)',
        vr: 'CS',
        vm: '1',
        name: 'DetectorGeometry'
    },
    '(0018,9726)': {
        tag: '(0018,9726)',
        vr: 'FD',
        vm: '1',
        name: 'TransverseDetectorSeparation'
    },
    '(0018,9727)': {
        tag: '(0018,9727)',
        vr: 'FD',
        vm: '1',
        name: 'AxialDetectorDimension'
    },
    '(0018,9729)': {
        tag: '(0018,9729)',
        vr: 'US',
        vm: '1',
        name: 'RadiopharmaceuticalAgentNumber'
    },
    '(0018,9732)': {
        tag: '(0018,9732)',
        vr: 'SQ',
        vm: '1',
        name: 'PETFrameAcquisitionSequence'
    },
    '(0018,9733)': {
        tag: '(0018,9733)',
        vr: 'SQ',
        vm: '1',
        name: 'PETDetectorMotionDetailsSequence'
    },
    '(0018,9734)': {
        tag: '(0018,9734)',
        vr: 'SQ',
        vm: '1',
        name: 'PETTableDynamicsSequence'
    },
    '(0018,9735)': {
        tag: '(0018,9735)',
        vr: 'SQ',
        vm: '1',
        name: 'PETPositionSequence'
    },
    '(0018,9736)': {
        tag: '(0018,9736)',
        vr: 'SQ',
        vm: '1',
        name: 'PETFrameCorrectionFactorsSequence'
    },
    '(0018,9737)': {
        tag: '(0018,9737)',
        vr: 'SQ',
        vm: '1',
        name: 'RadiopharmaceuticalUsageSequence'
    },
    '(0018,9738)': {
        tag: '(0018,9738)',
        vr: 'CS',
        vm: '1',
        name: 'AttenuationCorrectionSource'
    },
    '(0018,9739)': {
        tag: '(0018,9739)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfIterations'
    },
    '(0018,9740)': {
        tag: '(0018,9740)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfSubsets'
    },
    '(0018,9749)': {
        tag: '(0018,9749)',
        vr: 'SQ',
        vm: '1',
        name: 'PETReconstructionSequence'
    },
    '(0018,9751)': {
        tag: '(0018,9751)',
        vr: 'SQ',
        vm: '1',
        name: 'PETFrameTypeSequence'
    },
    '(0018,9755)': {
        tag: '(0018,9755)',
        vr: 'CS',
        vm: '1',
        name: 'TimeOfFlightInformationUsed'
    },
    '(0018,9756)': {
        tag: '(0018,9756)',
        vr: 'CS',
        vm: '1',
        name: 'ReconstructionType'
    },
    '(0018,9758)': {
        tag: '(0018,9758)',
        vr: 'CS',
        vm: '1',
        name: 'DecayCorrected'
    },
    '(0018,9759)': {
        tag: '(0018,9759)',
        vr: 'CS',
        vm: '1',
        name: 'AttenuationCorrected'
    },
    '(0018,9760)': {
        tag: '(0018,9760)',
        vr: 'CS',
        vm: '1',
        name: 'ScatterCorrected'
    },
    '(0018,9761)': {
        tag: '(0018,9761)',
        vr: 'CS',
        vm: '1',
        name: 'DeadTimeCorrected'
    },
    '(0018,9762)': {
        tag: '(0018,9762)',
        vr: 'CS',
        vm: '1',
        name: 'GantryMotionCorrected'
    },
    '(0018,9763)': {
        tag: '(0018,9763)',
        vr: 'CS',
        vm: '1',
        name: 'PatientMotionCorrected'
    },
    '(0018,9764)': {
        tag: '(0018,9764)',
        vr: 'CS',
        vm: '1',
        name: 'CountLossNormalizationCorrected'
    },
    '(0018,9765)': {
        tag: '(0018,9765)',
        vr: 'CS',
        vm: '1',
        name: 'RandomsCorrected'
    },
    '(0018,9766)': {
        tag: '(0018,9766)',
        vr: 'CS',
        vm: '1',
        name: 'NonUniformRadialSamplingCorrected'
    },
    '(0018,9767)': {
        tag: '(0018,9767)',
        vr: 'CS',
        vm: '1',
        name: 'SensitivityCalibrated'
    },
    '(0018,9768)': {
        tag: '(0018,9768)',
        vr: 'CS',
        vm: '1',
        name: 'DetectorNormalizationCorrection'
    },
    '(0018,9769)': {
        tag: '(0018,9769)',
        vr: 'CS',
        vm: '1',
        name: 'IterativeReconstructionMethod'
    },
    '(0018,9770)': {
        tag: '(0018,9770)',
        vr: 'CS',
        vm: '1',
        name: 'AttenuationCorrectionTemporalRelationship'
    },
    '(0018,9771)': {
        tag: '(0018,9771)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientPhysiologicalStateSequence'
    },
    '(0018,9772)': {
        tag: '(0018,9772)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientPhysiologicalStateCodeSequence'
    },
    '(0018,9801)': {
        tag: '(0018,9801)',
        vr: 'FD',
        vm: '1-n',
        name: 'DepthsOfFocus'
    },
    '(0018,9803)': {
        tag: '(0018,9803)',
        vr: 'SQ',
        vm: '1',
        name: 'ExcludedIntervalsSequence'
    },
    '(0018,9804)': {
        tag: '(0018,9804)',
        vr: 'DT',
        vm: '1',
        name: 'ExclusionStartDatetime'
    },
    '(0018,9805)': {
        tag: '(0018,9805)',
        vr: 'FD',
        vm: '1',
        name: 'ExclusionDuration'
    },
    '(0018,9806)': {
        tag: '(0018,9806)',
        vr: 'SQ',
        vm: '1',
        name: 'USImageDescriptionSequence'
    },
    '(0018,9807)': {
        tag: '(0018,9807)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageDataTypeSequence'
    },
    '(0018,9808)': {
        tag: '(0018,9808)',
        vr: 'CS',
        vm: '1',
        name: 'DataType'
    },
    '(0018,9809)': {
        tag: '(0018,9809)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerScanPatternCodeSequence'
    },
    '(0018,980B)': {
        tag: '(0018,980B)',
        vr: 'CS',
        vm: '1',
        name: 'AliasedDataType'
    },
    '(0018,980C)': {
        tag: '(0018,980C)',
        vr: 'CS',
        vm: '1',
        name: 'PositionMeasuringDeviceUsed'
    },
    '(0018,980D)': {
        tag: '(0018,980D)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerGeometryCodeSequence'
    },
    '(0018,980E)': {
        tag: '(0018,980E)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerBeamSteeringCodeSequence'
    },
    '(0018,980F)': {
        tag: '(0018,980F)',
        vr: 'SQ',
        vm: '1',
        name: 'TransducerApplicationCodeSequence'
    },
    '(0018,A001)': {
        tag: '(0018,A001)',
        vr: 'SQ',
        vm: '1',
        name: 'ContributingEquipmentSequence'
    },
    '(0018,A002)': {
        tag: '(0018,A002)',
        vr: 'DT',
        vm: '1',
        name: 'ContributionDateTime'
    },
    '(0018,A003)': {
        tag: '(0018,A003)',
        vr: 'ST',
        vm: '1',
        name: 'ContributionDescription'
    },
    '(0020,000D)': {
        tag: '(0020,000D)',
        vr: 'UI',
        vm: '1',
        name: 'StudyInstanceUID'
    },
    '(0020,000E)': {
        tag: '(0020,000E)',
        vr: 'UI',
        vm: '1',
        name: 'SeriesInstanceUID'
    },
    '(0020,0010)': {
        tag: '(0020,0010)',
        vr: 'SH',
        vm: '1',
        name: 'StudyID'
    },
    '(0020,0011)': {
        tag: '(0020,0011)',
        vr: 'IS',
        vm: '1',
        name: 'SeriesNumber'
    },
    '(0020,0012)': {
        tag: '(0020,0012)',
        vr: 'IS',
        vm: '1',
        name: 'AcquisitionNumber'
    },
    '(0020,0013)': {
        tag: '(0020,0013)',
        vr: 'IS',
        vm: '1',
        name: 'InstanceNumber'
    },
    '(0020,0014)': {
        tag: '(0020,0014)',
        vr: 'IS',
        vm: '1',
        name: 'IsotopeNumber'
    },
    '(0020,0015)': {
        tag: '(0020,0015)',
        vr: 'IS',
        vm: '1',
        name: 'PhaseNumber'
    },
    '(0020,0016)': {
        tag: '(0020,0016)',
        vr: 'IS',
        vm: '1',
        name: 'IntervalNumber'
    },
    '(0020,0017)': {
        tag: '(0020,0017)',
        vr: 'IS',
        vm: '1',
        name: 'TimeSlotNumber'
    },
    '(0020,0018)': {
        tag: '(0020,0018)',
        vr: 'IS',
        vm: '1',
        name: 'AngleNumber'
    },
    '(0020,0019)': {
        tag: '(0020,0019)',
        vr: 'IS',
        vm: '1',
        name: 'ItemNumber'
    },
    '(0020,0020)': {
        tag: '(0020,0020)',
        vr: 'CS',
        vm: '2',
        name: 'PatientOrientation'
    },
    '(0020,0022)': {
        tag: '(0020,0022)',
        vr: 'IS',
        vm: '1',
        name: 'OverlayNumber'
    },
    '(0020,0024)': {
        tag: '(0020,0024)',
        vr: 'IS',
        vm: '1',
        name: 'CurveNumber'
    },
    '(0020,0026)': {
        tag: '(0020,0026)',
        vr: 'IS',
        vm: '1',
        name: 'LUTNumber'
    },
    '(0020,0030)': {
        tag: '(0020,0030)',
        vr: 'DS',
        vm: '3',
        name: 'ImagePosition'
    },
    '(0020,0032)': {
        tag: '(0020,0032)',
        vr: 'DS',
        vm: '3',
        name: 'ImagePositionPatient'
    },
    '(0020,0035)': {
        tag: '(0020,0035)',
        vr: 'DS',
        vm: '6',
        name: 'ImageOrientation'
    },
    '(0020,0037)': {
        tag: '(0020,0037)',
        vr: 'DS',
        vm: '6',
        name: 'ImageOrientationPatient'
    },
    '(0020,0050)': {
        tag: '(0020,0050)',
        vr: 'DS',
        vm: '1',
        name: 'Location'
    },
    '(0020,0052)': {
        tag: '(0020,0052)',
        vr: 'UI',
        vm: '1',
        name: 'FrameOfReferenceUID'
    },
    '(0020,0060)': {
        tag: '(0020,0060)',
        vr: 'CS',
        vm: '1',
        name: 'Laterality'
    },
    '(0020,0062)': {
        tag: '(0020,0062)',
        vr: 'CS',
        vm: '1',
        name: 'ImageLaterality'
    },
    '(0020,0070)': {
        tag: '(0020,0070)',
        vr: 'LO',
        vm: '1',
        name: 'ImageGeometryType'
    },
    '(0020,0080)': {
        tag: '(0020,0080)',
        vr: 'CS',
        vm: '1-n',
        name: 'MaskingImage'
    },
    '(0020,00AA)': {
        tag: '(0020,00AA)',
        vr: 'IS',
        vm: '1',
        name: 'ReportNumber'
    },
    '(0020,0100)': {
        tag: '(0020,0100)',
        vr: 'IS',
        vm: '1',
        name: 'TemporalPositionIdentifier'
    },
    '(0020,0105)': {
        tag: '(0020,0105)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfTemporalPositions'
    },
    '(0020,0110)': {
        tag: '(0020,0110)',
        vr: 'DS',
        vm: '1',
        name: 'TemporalResolution'
    },
    '(0020,0200)': {
        tag: '(0020,0200)',
        vr: 'UI',
        vm: '1',
        name: 'SynchronizationFrameOfReferenceUID'
    },
    '(0020,0242)': {
        tag: '(0020,0242)',
        vr: 'UI',
        vm: '1',
        name: 'SOPInstanceUIDOfConcatenationSource'
    },
    '(0020,1000)': {
        tag: '(0020,1000)',
        vr: 'IS',
        vm: '1',
        name: 'SeriesInStudy'
    },
    '(0020,1001)': {
        tag: '(0020,1001)',
        vr: 'IS',
        vm: '1',
        name: 'AcquisitionsInSeries'
    },
    '(0020,1002)': {
        tag: '(0020,1002)',
        vr: 'IS',
        vm: '1',
        name: 'ImagesInAcquisition'
    },
    '(0020,1003)': {
        tag: '(0020,1003)',
        vr: 'IS',
        vm: '1',
        name: 'ImagesInSeries'
    },
    '(0020,1004)': {
        tag: '(0020,1004)',
        vr: 'IS',
        vm: '1',
        name: 'AcquisitionsInStudy'
    },
    '(0020,1005)': {
        tag: '(0020,1005)',
        vr: 'IS',
        vm: '1',
        name: 'ImagesInStudy'
    },
    '(0020,1020)': {
        tag: '(0020,1020)',
        vr: 'LO',
        vm: '1-n',
        name: 'Reference'
    },
    '(0020,1040)': {
        tag: '(0020,1040)',
        vr: 'LO',
        vm: '1',
        name: 'PositionReferenceIndicator'
    },
    '(0020,1041)': {
        tag: '(0020,1041)',
        vr: 'DS',
        vm: '1',
        name: 'SliceLocation'
    },
    '(0020,1070)': {
        tag: '(0020,1070)',
        vr: 'IS',
        vm: '1-n',
        name: 'OtherStudyNumbers'
    },
    '(0020,1200)': {
        tag: '(0020,1200)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfPatientRelatedStudies'
    },
    '(0020,1202)': {
        tag: '(0020,1202)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfPatientRelatedSeries'
    },
    '(0020,1204)': {
        tag: '(0020,1204)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfPatientRelatedInstances'
    },
    '(0020,1206)': {
        tag: '(0020,1206)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfStudyRelatedSeries'
    },
    '(0020,1208)': {
        tag: '(0020,1208)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfStudyRelatedInstances'
    },
    '(0020,1209)': {
        tag: '(0020,1209)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfSeriesRelatedInstances'
    },
    '(0020,31xx)': {
        tag: '(0020,31xx)',
        vr: 'CS',
        vm: '1-n',
        name: 'SourceImageIDs'
    },
    '(0020,3401)': {
        tag: '(0020,3401)',
        vr: 'CS',
        vm: '1',
        name: 'ModifyingDeviceID'
    },
    '(0020,3402)': {
        tag: '(0020,3402)',
        vr: 'CS',
        vm: '1',
        name: 'ModifiedImageID'
    },
    '(0020,3403)': {
        tag: '(0020,3403)',
        vr: 'DA',
        vm: '1',
        name: 'ModifiedImageDate'
    },
    '(0020,3404)': {
        tag: '(0020,3404)',
        vr: 'LO',
        vm: '1',
        name: 'ModifyingDeviceManufacturer'
    },
    '(0020,3405)': {
        tag: '(0020,3405)',
        vr: 'TM',
        vm: '1',
        name: 'ModifiedImageTime'
    },
    '(0020,3406)': {
        tag: '(0020,3406)',
        vr: 'LO',
        vm: '1',
        name: 'ModifiedImageDescription'
    },
    '(0020,4000)': {
        tag: '(0020,4000)',
        vr: 'LT',
        vm: '1',
        name: 'ImageComments'
    },
    '(0020,5000)': {
        tag: '(0020,5000)',
        vr: 'AT',
        vm: '1-n',
        name: 'OriginalImageIdentification'
    },
    '(0020,5002)': {
        tag: '(0020,5002)',
        vr: 'LO',
        vm: '1-n',
        name: 'OriginalImageIdentificationNomenclature'
    },
    '(0020,9056)': {
        tag: '(0020,9056)',
        vr: 'SH',
        vm: '1',
        name: 'StackID'
    },
    '(0020,9057)': {
        tag: '(0020,9057)',
        vr: 'UL',
        vm: '1',
        name: 'InStackPositionNumber'
    },
    '(0020,9071)': {
        tag: '(0020,9071)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameAnatomySequence'
    },
    '(0020,9072)': {
        tag: '(0020,9072)',
        vr: 'CS',
        vm: '1',
        name: 'FrameLaterality'
    },
    '(0020,9111)': {
        tag: '(0020,9111)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameContentSequence'
    },
    '(0020,9113)': {
        tag: '(0020,9113)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanePositionSequence'
    },
    '(0020,9116)': {
        tag: '(0020,9116)',
        vr: 'SQ',
        vm: '1',
        name: 'PlaneOrientationSequence'
    },
    '(0020,9128)': {
        tag: '(0020,9128)',
        vr: 'UL',
        vm: '1',
        name: 'TemporalPositionIndex'
    },
    '(0020,9153)': {
        tag: '(0020,9153)',
        vr: 'FD',
        vm: '1',
        name: 'NominalCardiacTriggerDelayTime'
    },
    '(0020,9154)': {
        tag: '(0020,9154)',
        vr: 'FL',
        vm: '1',
        name: 'NominalCardiacTriggerTimePriorToRPeak'
    },
    '(0020,9155)': {
        tag: '(0020,9155)',
        vr: 'FL',
        vm: '1',
        name: 'ActualCardiacTriggerTimePriorToRPeak'
    },
    '(0020,9156)': {
        tag: '(0020,9156)',
        vr: 'US',
        vm: '1',
        name: 'FrameAcquisitionNumber'
    },
    '(0020,9157)': {
        tag: '(0020,9157)',
        vr: 'UL',
        vm: '1-n',
        name: 'DimensionIndexValues'
    },
    '(0020,9158)': {
        tag: '(0020,9158)',
        vr: 'LT',
        vm: '1',
        name: 'FrameComments'
    },
    '(0020,9161)': {
        tag: '(0020,9161)',
        vr: 'UI',
        vm: '1',
        name: 'ConcatenationUID'
    },
    '(0020,9162)': {
        tag: '(0020,9162)',
        vr: 'US',
        vm: '1',
        name: 'InConcatenationNumber'
    },
    '(0020,9163)': {
        tag: '(0020,9163)',
        vr: 'US',
        vm: '1',
        name: 'InConcatenationTotalNumber'
    },
    '(0020,9164)': {
        tag: '(0020,9164)',
        vr: 'UI',
        vm: '1',
        name: 'DimensionOrganizationUID'
    },
    '(0020,9165)': {
        tag: '(0020,9165)',
        vr: 'AT',
        vm: '1',
        name: 'DimensionIndexPointer'
    },
    '(0020,9167)': {
        tag: '(0020,9167)',
        vr: 'AT',
        vm: '1',
        name: 'FunctionalGroupPointer'
    },
    '(0020,9213)': {
        tag: '(0020,9213)',
        vr: 'LO',
        vm: '1',
        name: 'DimensionIndexPrivateCreator'
    },
    '(0020,9221)': {
        tag: '(0020,9221)',
        vr: 'SQ',
        vm: '1',
        name: 'DimensionOrganizationSequence'
    },
    '(0020,9222)': {
        tag: '(0020,9222)',
        vr: 'SQ',
        vm: '1',
        name: 'DimensionIndexSequence'
    },
    '(0020,9228)': {
        tag: '(0020,9228)',
        vr: 'UL',
        vm: '1',
        name: 'ConcatenationFrameOffsetNumber'
    },
    '(0020,9238)': {
        tag: '(0020,9238)',
        vr: 'LO',
        vm: '1',
        name: 'FunctionalGroupPrivateCreator'
    },
    '(0020,9241)': {
        tag: '(0020,9241)',
        vr: 'FL',
        vm: '1',
        name: 'NominalPercentageOfCardiacPhase'
    },
    '(0020,9245)': {
        tag: '(0020,9245)',
        vr: 'FL',
        vm: '1',
        name: 'NominalPercentageOfRespiratoryPhase'
    },
    '(0020,9246)': {
        tag: '(0020,9246)',
        vr: 'FL',
        vm: '1',
        name: 'StartingRespiratoryAmplitude'
    },
    '(0020,9247)': {
        tag: '(0020,9247)',
        vr: 'CS',
        vm: '1',
        name: 'StartingRespiratoryPhase'
    },
    '(0020,9248)': {
        tag: '(0020,9248)',
        vr: 'FL',
        vm: '1',
        name: 'EndingRespiratoryAmplitude'
    },
    '(0020,9249)': {
        tag: '(0020,9249)',
        vr: 'CS',
        vm: '1',
        name: 'EndingRespiratoryPhase'
    },
    '(0020,9250)': {
        tag: '(0020,9250)',
        vr: 'CS',
        vm: '1',
        name: 'RespiratoryTriggerType'
    },
    '(0020,9251)': {
        tag: '(0020,9251)',
        vr: 'FD',
        vm: '1',
        name: 'RRIntervalTimeNominal'
    },
    '(0020,9252)': {
        tag: '(0020,9252)',
        vr: 'FD',
        vm: '1',
        name: 'ActualCardiacTriggerDelayTime'
    },
    '(0020,9253)': {
        tag: '(0020,9253)',
        vr: 'SQ',
        vm: '1',
        name: 'RespiratorySynchronizationSequence'
    },
    '(0020,9254)': {
        tag: '(0020,9254)',
        vr: 'FD',
        vm: '1',
        name: 'RespiratoryIntervalTime'
    },
    '(0020,9255)': {
        tag: '(0020,9255)',
        vr: 'FD',
        vm: '1',
        name: 'NominalRespiratoryTriggerDelayTime'
    },
    '(0020,9256)': {
        tag: '(0020,9256)',
        vr: 'FD',
        vm: '1',
        name: 'RespiratoryTriggerDelayThreshold'
    },
    '(0020,9257)': {
        tag: '(0020,9257)',
        vr: 'FD',
        vm: '1',
        name: 'ActualRespiratoryTriggerDelayTime'
    },
    '(0020,9301)': {
        tag: '(0020,9301)',
        vr: 'FD',
        vm: '3',
        name: 'ImagePositionVolume'
    },
    '(0020,9302)': {
        tag: '(0020,9302)',
        vr: 'FD',
        vm: '6',
        name: 'ImageOrientationVolume'
    },
    '(0020,9307)': {
        tag: '(0020,9307)',
        vr: 'CS',
        vm: '1',
        name: 'UltrasoundAcquisitionGeometry'
    },
    '(0020,9308)': {
        tag: '(0020,9308)',
        vr: 'FD',
        vm: '3',
        name: 'ApexPosition'
    },
    '(0020,9309)': {
        tag: '(0020,9309)',
        vr: 'FD',
        vm: '16',
        name: 'VolumeToTransducerMappingMatrix'
    },
    '(0020,930A)': {
        tag: '(0020,930A)',
        vr: 'FD',
        vm: '16',
        name: 'VolumeToTableMappingMatrix'
    },
    '(0020,930C)': {
        tag: '(0020,930C)',
        vr: 'CS',
        vm: '1',
        name: 'PatientFrameOfReferenceSource'
    },
    '(0020,930D)': {
        tag: '(0020,930D)',
        vr: 'FD',
        vm: '1',
        name: 'TemporalPositionTimeOffset'
    },
    '(0020,930E)': {
        tag: '(0020,930E)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanePositionVolumeSequence'
    },
    '(0020,930F)': {
        tag: '(0020,930F)',
        vr: 'SQ',
        vm: '1',
        name: 'PlaneOrientationVolumeSequence'
    },
    '(0020,9310)': {
        tag: '(0020,9310)',
        vr: 'SQ',
        vm: '1',
        name: 'TemporalPositionSequence'
    },
    '(0020,9311)': {
        tag: '(0020,9311)',
        vr: 'CS',
        vm: '1',
        name: 'DimensionOrganizationType'
    },
    '(0020,9312)': {
        tag: '(0020,9312)',
        vr: 'UI',
        vm: '1',
        name: 'VolumeFrameOfReferenceUID'
    },
    '(0020,9313)': {
        tag: '(0020,9313)',
        vr: 'UI',
        vm: '1',
        name: 'TableFrameOfReferenceUID'
    },
    '(0020,9421)': {
        tag: '(0020,9421)',
        vr: 'LO',
        vm: '1',
        name: 'DimensionDescriptionLabel'
    },
    '(0020,9450)': {
        tag: '(0020,9450)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientOrientationInFrameSequence'
    },
    '(0020,9453)': {
        tag: '(0020,9453)',
        vr: 'LO',
        vm: '1',
        name: 'FrameLabel'
    },
    '(0020,9518)': {
        tag: '(0020,9518)',
        vr: 'US',
        vm: '1-n',
        name: 'AcquisitionIndex'
    },
    '(0020,9529)': {
        tag: '(0020,9529)',
        vr: 'SQ',
        vm: '1',
        name: 'ContributingSOPInstancesReferenceSequence'
    },
    '(0020,9536)': {
        tag: '(0020,9536)',
        vr: 'US',
        vm: '1',
        name: 'ReconstructionIndex'
    },
    '(0022,0001)': {
        tag: '(0022,0001)',
        vr: 'US',
        vm: '1',
        name: 'LightPathFilterPassThroughWavelength'
    },
    '(0022,0002)': {
        tag: '(0022,0002)',
        vr: 'US',
        vm: '2',
        name: 'LightPathFilterPassBand'
    },
    '(0022,0003)': {
        tag: '(0022,0003)',
        vr: 'US',
        vm: '1',
        name: 'ImagePathFilterPassThroughWavelength'
    },
    '(0022,0004)': {
        tag: '(0022,0004)',
        vr: 'US',
        vm: '2',
        name: 'ImagePathFilterPassBand'
    },
    '(0022,0005)': {
        tag: '(0022,0005)',
        vr: 'CS',
        vm: '1',
        name: 'PatientEyeMovementCommanded'
    },
    '(0022,0006)': {
        tag: '(0022,0006)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientEyeMovementCommandCodeSequence'
    },
    '(0022,0007)': {
        tag: '(0022,0007)',
        vr: 'FL',
        vm: '1',
        name: 'SphericalLensPower'
    },
    '(0022,0008)': {
        tag: '(0022,0008)',
        vr: 'FL',
        vm: '1',
        name: 'CylinderLensPower'
    },
    '(0022,0009)': {
        tag: '(0022,0009)',
        vr: 'FL',
        vm: '1',
        name: 'CylinderAxis'
    },
    '(0022,000A)': {
        tag: '(0022,000A)',
        vr: 'FL',
        vm: '1',
        name: 'EmmetropicMagnification'
    },
    '(0022,000B)': {
        tag: '(0022,000B)',
        vr: 'FL',
        vm: '1',
        name: 'IntraOcularPressure'
    },
    '(0022,000C)': {
        tag: '(0022,000C)',
        vr: 'FL',
        vm: '1',
        name: 'HorizontalFieldOfView'
    },
    '(0022,000D)': {
        tag: '(0022,000D)',
        vr: 'CS',
        vm: '1',
        name: 'PupilDilated'
    },
    '(0022,000E)': {
        tag: '(0022,000E)',
        vr: 'FL',
        vm: '1',
        name: 'DegreeOfDilation'
    },
    '(0022,0010)': {
        tag: '(0022,0010)',
        vr: 'FL',
        vm: '1',
        name: 'StereoBaselineAngle'
    },
    '(0022,0011)': {
        tag: '(0022,0011)',
        vr: 'FL',
        vm: '1',
        name: 'StereoBaselineDisplacement'
    },
    '(0022,0012)': {
        tag: '(0022,0012)',
        vr: 'FL',
        vm: '1',
        name: 'StereoHorizontalPixelOffset'
    },
    '(0022,0013)': {
        tag: '(0022,0013)',
        vr: 'FL',
        vm: '1',
        name: 'StereoVerticalPixelOffset'
    },
    '(0022,0014)': {
        tag: '(0022,0014)',
        vr: 'FL',
        vm: '1',
        name: 'StereoRotation'
    },
    '(0022,0015)': {
        tag: '(0022,0015)',
        vr: 'SQ',
        vm: '1',
        name: 'AcquisitionDeviceTypeCodeSequence'
    },
    '(0022,0016)': {
        tag: '(0022,0016)',
        vr: 'SQ',
        vm: '1',
        name: 'IlluminationTypeCodeSequence'
    },
    '(0022,0017)': {
        tag: '(0022,0017)',
        vr: 'SQ',
        vm: '1',
        name: 'LightPathFilterTypeStackCodeSequence'
    },
    '(0022,0018)': {
        tag: '(0022,0018)',
        vr: 'SQ',
        vm: '1',
        name: 'ImagePathFilterTypeStackCodeSequence'
    },
    '(0022,0019)': {
        tag: '(0022,0019)',
        vr: 'SQ',
        vm: '1',
        name: 'LensesCodeSequence'
    },
    '(0022,001A)': {
        tag: '(0022,001A)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelDescriptionCodeSequence'
    },
    '(0022,001B)': {
        tag: '(0022,001B)',
        vr: 'SQ',
        vm: '1',
        name: 'RefractiveStateSequence'
    },
    '(0022,001C)': {
        tag: '(0022,001C)',
        vr: 'SQ',
        vm: '1',
        name: 'MydriaticAgentCodeSequence'
    },
    '(0022,001D)': {
        tag: '(0022,001D)',
        vr: 'SQ',
        vm: '1',
        name: 'RelativeImagePositionCodeSequence'
    },
    '(0022,001E)': {
        tag: '(0022,001E)',
        vr: 'FL',
        vm: '1',
        name: 'CameraAngleOfView'
    },
    '(0022,0020)': {
        tag: '(0022,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'StereoPairsSequence'
    },
    '(0022,0021)': {
        tag: '(0022,0021)',
        vr: 'SQ',
        vm: '1',
        name: 'LeftImageSequence'
    },
    '(0022,0022)': {
        tag: '(0022,0022)',
        vr: 'SQ',
        vm: '1',
        name: 'RightImageSequence'
    },
    '(0022,0030)': {
        tag: '(0022,0030)',
        vr: 'FL',
        vm: '1',
        name: 'AxialLengthOfTheEye'
    },
    '(0022,0031)': {
        tag: '(0022,0031)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicFrameLocationSequence'
    },
    '(0022,0032)': {
        tag: '(0022,0032)',
        vr: 'FL',
        vm: '2-2n',
        name: 'ReferenceCoordinates'
    },
    '(0022,0035)': {
        tag: '(0022,0035)',
        vr: 'FL',
        vm: '1',
        name: 'DepthSpatialResolution'
    },
    '(0022,0036)': {
        tag: '(0022,0036)',
        vr: 'FL',
        vm: '1',
        name: 'MaximumDepthDistortion'
    },
    '(0022,0037)': {
        tag: '(0022,0037)',
        vr: 'FL',
        vm: '1',
        name: 'AlongScanSpatialResolution'
    },
    '(0022,0038)': {
        tag: '(0022,0038)',
        vr: 'FL',
        vm: '1',
        name: 'MaximumAlongScanDistortion'
    },
    '(0022,0039)': {
        tag: '(0022,0039)',
        vr: 'CS',
        vm: '1',
        name: 'OphthalmicImageOrientation'
    },
    '(0022,0041)': {
        tag: '(0022,0041)',
        vr: 'FL',
        vm: '1',
        name: 'DepthOfTransverseImage'
    },
    '(0022,0042)': {
        tag: '(0022,0042)',
        vr: 'SQ',
        vm: '1',
        name: 'MydriaticAgentConcentrationUnitsSequence'
    },
    '(0022,0048)': {
        tag: '(0022,0048)',
        vr: 'FL',
        vm: '1',
        name: 'AcrossScanSpatialResolution'
    },
    '(0022,0049)': {
        tag: '(0022,0049)',
        vr: 'FL',
        vm: '1',
        name: 'MaximumAcrossScanDistortion'
    },
    '(0022,004E)': {
        tag: '(0022,004E)',
        vr: 'DS',
        vm: '1',
        name: 'MydriaticAgentConcentration'
    },
    '(0022,0055)': {
        tag: '(0022,0055)',
        vr: 'FL',
        vm: '1',
        name: 'IlluminationWaveLength'
    },
    '(0022,0056)': {
        tag: '(0022,0056)',
        vr: 'FL',
        vm: '1',
        name: 'IlluminationPower'
    },
    '(0022,0057)': {
        tag: '(0022,0057)',
        vr: 'FL',
        vm: '1',
        name: 'IlluminationBandwidth'
    },
    '(0022,0058)': {
        tag: '(0022,0058)',
        vr: 'SQ',
        vm: '1',
        name: 'MydriaticAgentSequence'
    },
    '(0022,1007)': {
        tag: '(0022,1007)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialMeasurementsRightEyeSequence'
    },
    '(0022,1008)': {
        tag: '(0022,1008)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialMeasurementsLeftEyeSequence'
    },
    '(0022,1010)': {
        tag: '(0022,1010)',
        vr: 'CS',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementsType'
    },
    '(0022,1019)': {
        tag: '(0022,1019)',
        vr: 'FL',
        vm: '1',
        name: 'OphthalmicAxialLength'
    },
    '(0022,1024)': {
        tag: '(0022,1024)',
        vr: 'SQ',
        vm: '1',
        name: 'LensStatusCodeSequence'
    },
    '(0022,1025)': {
        tag: '(0022,1025)',
        vr: 'SQ',
        vm: '1',
        name: 'VitreousStatusCodeSequence'
    },
    '(0022,1028)': {
        tag: '(0022,1028)',
        vr: 'SQ',
        vm: '1',
        name: 'IOLFormulaCodeSequence'
    },
    '(0022,1029)': {
        tag: '(0022,1029)',
        vr: 'LO',
        vm: '1',
        name: 'IOLFormulaDetail'
    },
    '(0022,1033)': {
        tag: '(0022,1033)',
        vr: 'FL',
        vm: '1',
        name: 'KeratometerIndex'
    },
    '(0022,1035)': {
        tag: '(0022,1035)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceOfOphthalmicAxialLengthCodeSequence'
    },
    '(0022,1037)': {
        tag: '(0022,1037)',
        vr: 'FL',
        vm: '1',
        name: 'TargetRefraction'
    },
    '(0022,1039)': {
        tag: '(0022,1039)',
        vr: 'CS',
        vm: '1',
        name: 'RefractiveProcedureOccurred'
    },
    '(0022,1040)': {
        tag: '(0022,1040)',
        vr: 'SQ',
        vm: '1',
        name: 'RefractiveSurgeryTypeCodeSequence'
    },
    '(0022,1044)': {
        tag: '(0022,1044)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicUltrasoundAxialMeasurementsTypeCodeSequence'
    },
    '(0022,1050)': {
        tag: '(0022,1050)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementsSequence'
    },
    '(0022,1053)': {
        tag: '(0022,1053)',
        vr: 'FL',
        vm: '1',
        name: 'IOLPower'
    },
    '(0022,1054)': {
        tag: '(0022,1054)',
        vr: 'FL',
        vm: '1',
        name: 'PredictedRefractiveError'
    },
    '(0022,1059)': {
        tag: '(0022,1059)',
        vr: 'FL',
        vm: '1',
        name: 'OphthalmicAxialLengthVelocity'
    },
    '(0022,1065)': {
        tag: '(0022,1065)',
        vr: 'LO',
        vm: '1',
        name: 'LensStatusDescription'
    },
    '(0022,1066)': {
        tag: '(0022,1066)',
        vr: 'LO',
        vm: '1',
        name: 'VitreousStatusDescription'
    },
    '(0022,1090)': {
        tag: '(0022,1090)',
        vr: 'SQ',
        vm: '1',
        name: 'IOLPowerSequence'
    },
    '(0022,1092)': {
        tag: '(0022,1092)',
        vr: 'SQ',
        vm: '1',
        name: 'LensConstantSequence'
    },
    '(0022,1093)': {
        tag: '(0022,1093)',
        vr: 'LO',
        vm: '1',
        name: 'IOLManufacturer'
    },
    '(0022,1094)': {
        tag: '(0022,1094)',
        vr: 'LO',
        vm: '1',
        name: 'LensConstantDescription'
    },
    '(0022,1096)': {
        tag: '(0022,1096)',
        vr: 'SQ',
        vm: '1',
        name: 'KeratometryMeasurementTypeCodeSequence'
    },
    '(0022,1100)': {
        tag: '(0022,1100)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedOphthalmicAxialMeasurementsSequence'
    },
    '(0022,1101)': {
        tag: '(0022,1101)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementsSegmentNameCodeSequence'
    },
    '(0022,1103)': {
        tag: '(0022,1103)',
        vr: 'SQ',
        vm: '1',
        name: 'RefractiveErrorBeforeRefractiveSurgeryCodeSequence'
    },
    '(0022,1121)': {
        tag: '(0022,1121)',
        vr: 'FL',
        vm: '1',
        name: 'IOLPowerForExactEmmetropia'
    },
    '(0022,1122)': {
        tag: '(0022,1122)',
        vr: 'FL',
        vm: '1',
        name: 'IOLPowerForExactTargetRefraction'
    },
    '(0022,1125)': {
        tag: '(0022,1125)',
        vr: 'SQ',
        vm: '1',
        name: 'AnteriorChamberDepthDefinitionCodeSequence'
    },
    '(0022,1130)': {
        tag: '(0022,1130)',
        vr: 'FL',
        vm: '1',
        name: 'LensThickness'
    },
    '(0022,1131)': {
        tag: '(0022,1131)',
        vr: 'FL',
        vm: '1',
        name: 'AnteriorChamberDepth'
    },
    '(0022,1132)': {
        tag: '(0022,1132)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceOfLensThicknessDataCodeSequence'
    },
    '(0022,1133)': {
        tag: '(0022,1133)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceOfAnteriorChamberDepthDataCodeSequence'
    },
    '(0022,1135)': {
        tag: '(0022,1135)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceOfRefractiveErrorDataCodeSequence'
    },
    '(0022,1140)': {
        tag: '(0022,1140)',
        vr: 'CS',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementModified'
    },
    '(0022,1150)': {
        tag: '(0022,1150)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthDataSourceCodeSequence'
    },
    '(0022,1153)': {
        tag: '(0022,1153)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthAcquisitionMethodCodeSequence'
    },
    '(0022,1155)': {
        tag: '(0022,1155)',
        vr: 'FL',
        vm: '1',
        name: 'SignalToNoiseRatio'
    },
    '(0022,1159)': {
        tag: '(0022,1159)',
        vr: 'LO',
        vm: '1',
        name: 'OphthalmicAxialLengthDataSourceDescription'
    },
    '(0022,1210)': {
        tag: '(0022,1210)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementsTotalLengthSequence'
    },
    '(0022,1211)': {
        tag: '(0022,1211)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementsSegmentalLengthSequence'
    },
    '(0022,1212)': {
        tag: '(0022,1212)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthMeasurementsLengthSummationSequence'
    },
    '(0022,1220)': {
        tag: '(0022,1220)',
        vr: 'SQ',
        vm: '1',
        name: 'UltrasoundOphthalmicAxialLengthMeasurementsSequence'
    },
    '(0022,1225)': {
        tag: '(0022,1225)',
        vr: 'SQ',
        vm: '1',
        name: 'OpticalOphthalmicAxialLengthMeasurementsSequence'
    },
    '(0022,1230)': {
        tag: '(0022,1230)',
        vr: 'SQ',
        vm: '1',
        name: 'UltrasoundSelectedOphthalmicAxialLengthSequence'
    },
    '(0022,1250)': {
        tag: '(0022,1250)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthSelectionMethodCodeSequence'
    },
    '(0022,1255)': {
        tag: '(0022,1255)',
        vr: 'SQ',
        vm: '1',
        name: 'OpticalSelectedOphthalmicAxialLengthSequence'
    },
    '(0022,1257)': {
        tag: '(0022,1257)',
        vr: 'SQ',
        vm: '1',
        name: 'SelectedSegmentalOphthalmicAxialLengthSequence'
    },
    '(0022,1260)': {
        tag: '(0022,1260)',
        vr: 'SQ',
        vm: '1',
        name: 'SelectedTotalOphthalmicAxialLengthSequence'
    },
    '(0022,1262)': {
        tag: '(0022,1262)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicAxialLengthQualityMetricSequence'
    },
    '(0022,1273)': {
        tag: '(0022,1273)',
        vr: 'LO',
        vm: '1',
        name: 'OphthalmicAxialLengthQualityMetricTypeDescription'
    },
    '(0022,1300)': {
        tag: '(0022,1300)',
        vr: 'SQ',
        vm: '1',
        name: 'IntraocularLensCalculationsRightEyeSequence'
    },
    '(0022,1310)': {
        tag: '(0022,1310)',
        vr: 'SQ',
        vm: '1',
        name: 'IntraocularLensCalculationsLeftEyeSequence'
    },
    '(0022,1330)': {
        tag: '(0022,1330)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedOphthalmicAxialLengthMeasurementQCImageSequence'
    },
    '(0024,0010)': {
        tag: '(0024,0010)',
        vr: 'FL',
        vm: '1',
        name: 'VisualFieldHorizontalExtent'
    },
    '(0024,0011)': {
        tag: '(0024,0011)',
        vr: 'FL',
        vm: '1',
        name: 'VisualFieldVerticalExtent'
    },
    '(0024,0012)': {
        tag: '(0024,0012)',
        vr: 'CS',
        vm: '1',
        name: 'VisualFieldShape'
    },
    '(0024,0016)': {
        tag: '(0024,0016)',
        vr: 'SQ',
        vm: '1',
        name: 'ScreeningTestModeCodeSequence'
    },
    '(0024,0018)': {
        tag: '(0024,0018)',
        vr: 'FL',
        vm: '1',
        name: 'MaximumStimulusLuminance'
    },
    '(0024,0020)': {
        tag: '(0024,0020)',
        vr: 'FL',
        vm: '1',
        name: 'BackgroundLuminance'
    },
    '(0024,0021)': {
        tag: '(0024,0021)',
        vr: 'SQ',
        vm: '1',
        name: 'StimulusColorCodeSequence'
    },
    '(0024,0024)': {
        tag: '(0024,0024)',
        vr: 'SQ',
        vm: '1',
        name: 'BackgroundIlluminationColorCodeSequence'
    },
    '(0024,0025)': {
        tag: '(0024,0025)',
        vr: 'FL',
        vm: '1',
        name: 'StimulusArea'
    },
    '(0024,0028)': {
        tag: '(0024,0028)',
        vr: 'FL',
        vm: '1',
        name: 'StimulusPresentationTime'
    },
    '(0024,0032)': {
        tag: '(0024,0032)',
        vr: 'SQ',
        vm: '1',
        name: 'FixationSequence'
    },
    '(0024,0033)': {
        tag: '(0024,0033)',
        vr: 'SQ',
        vm: '1',
        name: 'FixationMonitoringCodeSequence'
    },
    '(0024,0034)': {
        tag: '(0024,0034)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualFieldCatchTrialSequence'
    },
    '(0024,0035)': {
        tag: '(0024,0035)',
        vr: 'US',
        vm: '1',
        name: 'FixationCheckedQuantity'
    },
    '(0024,0036)': {
        tag: '(0024,0036)',
        vr: 'US',
        vm: '1',
        name: 'PatientNotProperlyFixatedQuantity'
    },
    '(0024,0037)': {
        tag: '(0024,0037)',
        vr: 'CS',
        vm: '1',
        name: 'PresentedVisualStimuliDataFlag'
    },
    '(0024,0038)': {
        tag: '(0024,0038)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfVisualStimuli'
    },
    '(0024,0039)': {
        tag: '(0024,0039)',
        vr: 'CS',
        vm: '1',
        name: 'ExcessiveFixationLossesDataFlag'
    },
    '(0024,0040)': {
        tag: '(0024,0040)',
        vr: 'CS',
        vm: '1',
        name: 'ExcessiveFixationLosses'
    },
    '(0024,0042)': {
        tag: '(0024,0042)',
        vr: 'US',
        vm: '1',
        name: 'StimuliRetestingQuantity'
    },
    '(0024,0044)': {
        tag: '(0024,0044)',
        vr: 'LT',
        vm: '1',
        name: 'CommentsOnPatientPerformanceOfVisualField'
    },
    '(0024,0045)': {
        tag: '(0024,0045)',
        vr: 'CS',
        vm: '1',
        name: 'FalseNegativesEstimateFlag'
    },
    '(0024,0046)': {
        tag: '(0024,0046)',
        vr: 'FL',
        vm: '1',
        name: 'FalseNegativesEstimate'
    },
    '(0024,0048)': {
        tag: '(0024,0048)',
        vr: 'US',
        vm: '1',
        name: 'NegativeCatchTrialsQuantity'
    },
    '(0024,0050)': {
        tag: '(0024,0050)',
        vr: 'US',
        vm: '1',
        name: 'FalseNegativesQuantity'
    },
    '(0024,0051)': {
        tag: '(0024,0051)',
        vr: 'CS',
        vm: '1',
        name: 'ExcessiveFalseNegativesDataFlag'
    },
    '(0024,0052)': {
        tag: '(0024,0052)',
        vr: 'CS',
        vm: '1',
        name: 'ExcessiveFalseNegatives'
    },
    '(0024,0053)': {
        tag: '(0024,0053)',
        vr: 'CS',
        vm: '1',
        name: 'FalsePositivesEstimateFlag'
    },
    '(0024,0054)': {
        tag: '(0024,0054)',
        vr: 'FL',
        vm: '1',
        name: 'FalsePositivesEstimate'
    },
    '(0024,0055)': {
        tag: '(0024,0055)',
        vr: 'CS',
        vm: '1',
        name: 'CatchTrialsDataFlag'
    },
    '(0024,0056)': {
        tag: '(0024,0056)',
        vr: 'US',
        vm: '1',
        name: 'PositiveCatchTrialsQuantity'
    },
    '(0024,0057)': {
        tag: '(0024,0057)',
        vr: 'CS',
        vm: '1',
        name: 'TestPointNormalsDataFlag'
    },
    '(0024,0058)': {
        tag: '(0024,0058)',
        vr: 'SQ',
        vm: '1',
        name: 'TestPointNormalsSequence'
    },
    '(0024,0059)': {
        tag: '(0024,0059)',
        vr: 'CS',
        vm: '1',
        name: 'GlobalDeviationProbabilityNormalsFlag'
    },
    '(0024,0060)': {
        tag: '(0024,0060)',
        vr: 'US',
        vm: '1',
        name: 'FalsePositivesQuantity'
    },
    '(0024,0061)': {
        tag: '(0024,0061)',
        vr: 'CS',
        vm: '1',
        name: 'ExcessiveFalsePositivesDataFlag'
    },
    '(0024,0062)': {
        tag: '(0024,0062)',
        vr: 'CS',
        vm: '1',
        name: 'ExcessiveFalsePositives'
    },
    '(0024,0063)': {
        tag: '(0024,0063)',
        vr: 'CS',
        vm: '1',
        name: 'VisualFieldTestNormalsFlag'
    },
    '(0024,0064)': {
        tag: '(0024,0064)',
        vr: 'SQ',
        vm: '1',
        name: 'ResultsNormalsSequence'
    },
    '(0024,0065)': {
        tag: '(0024,0065)',
        vr: 'SQ',
        vm: '1',
        name: 'AgeCorrectedSensitivityDeviationAlgorithmSequence'
    },
    '(0024,0066)': {
        tag: '(0024,0066)',
        vr: 'FL',
        vm: '1',
        name: 'GlobalDeviationFromNormal'
    },
    '(0024,0067)': {
        tag: '(0024,0067)',
        vr: 'SQ',
        vm: '1',
        name: 'GeneralizedDefectSensitivityDeviationAlgorithmSequence'
    },
    '(0024,0068)': {
        tag: '(0024,0068)',
        vr: 'FL',
        vm: '1',
        name: 'LocalizedDeviationfromNormal'
    },
    '(0024,0069)': {
        tag: '(0024,0069)',
        vr: 'LO',
        vm: '1',
        name: 'PatientReliabilityIndicator'
    },
    '(0024,0070)': {
        tag: '(0024,0070)',
        vr: 'FL',
        vm: '1',
        name: 'VisualFieldMeanSensitivity'
    },
    '(0024,0071)': {
        tag: '(0024,0071)',
        vr: 'FL',
        vm: '1',
        name: 'GlobalDeviationProbability'
    },
    '(0024,0072)': {
        tag: '(0024,0072)',
        vr: 'CS',
        vm: '1',
        name: 'LocalDeviationProbabilityNormalsFlag'
    },
    '(0024,0073)': {
        tag: '(0024,0073)',
        vr: 'FL',
        vm: '1',
        name: 'LocalizedDeviationProbability'
    },
    '(0024,0074)': {
        tag: '(0024,0074)',
        vr: 'CS',
        vm: '1',
        name: 'ShortTermFluctuationCalculated'
    },
    '(0024,0075)': {
        tag: '(0024,0075)',
        vr: 'FL',
        vm: '1',
        name: 'ShortTermFluctuation'
    },
    '(0024,0076)': {
        tag: '(0024,0076)',
        vr: 'CS',
        vm: '1',
        name: 'ShortTermFluctuationProbabilityCalculated'
    },
    '(0024,0077)': {
        tag: '(0024,0077)',
        vr: 'FL',
        vm: '1',
        name: 'ShortTermFluctuationProbability'
    },
    '(0024,0078)': {
        tag: '(0024,0078)',
        vr: 'CS',
        vm: '1',
        name: 'CorrectedLocalizedDeviationFromNormalCalculated'
    },
    '(0024,0079)': {
        tag: '(0024,0079)',
        vr: 'FL',
        vm: '1',
        name: 'CorrectedLocalizedDeviationFromNormal'
    },
    '(0024,0080)': {
        tag: '(0024,0080)',
        vr: 'CS',
        vm: '1',
        name: 'CorrectedLocalizedDeviationFromNormalProbabilityCalculated'
    },
    '(0024,0081)': {
        tag: '(0024,0081)',
        vr: 'FL',
        vm: '1',
        name: 'CorrectedLocalizedDeviationFromNormalProbability'
    },
    '(0024,0083)': {
        tag: '(0024,0083)',
        vr: 'SQ',
        vm: '1',
        name: 'GlobalDeviationProbabilitySequence'
    },
    '(0024,0085)': {
        tag: '(0024,0085)',
        vr: 'SQ',
        vm: '1',
        name: 'LocalizedDeviationProbabilitySequence'
    },
    '(0024,0086)': {
        tag: '(0024,0086)',
        vr: 'CS',
        vm: '1',
        name: 'FovealSensitivityMeasured'
    },
    '(0024,0087)': {
        tag: '(0024,0087)',
        vr: 'FL',
        vm: '1',
        name: 'FovealSensitivity'
    },
    '(0024,0088)': {
        tag: '(0024,0088)',
        vr: 'FL',
        vm: '1',
        name: 'VisualFieldTestDuration'
    },
    '(0024,0089)': {
        tag: '(0024,0089)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualFieldTestPointSequence'
    },
    '(0024,0090)': {
        tag: '(0024,0090)',
        vr: 'FL',
        vm: '1',
        name: 'VisualFieldTestPointXCoordinate'
    },
    '(0024,0091)': {
        tag: '(0024,0091)',
        vr: 'FL',
        vm: '1',
        name: 'VisualFieldTestPointYCoordinate'
    },
    '(0024,0092)': {
        tag: '(0024,0092)',
        vr: 'FL',
        vm: '1',
        name: 'AgeCorrectedSensitivityDeviationValue'
    },
    '(0024,0093)': {
        tag: '(0024,0093)',
        vr: 'CS',
        vm: '1',
        name: 'StimulusResults'
    },
    '(0024,0094)': {
        tag: '(0024,0094)',
        vr: 'FL',
        vm: '1',
        name: 'SensitivityValue'
    },
    '(0024,0095)': {
        tag: '(0024,0095)',
        vr: 'CS',
        vm: '1',
        name: 'RetestStimulusSeen'
    },
    '(0024,0096)': {
        tag: '(0024,0096)',
        vr: 'FL',
        vm: '1',
        name: 'RetestSensitivityValue'
    },
    '(0024,0097)': {
        tag: '(0024,0097)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualFieldTestPointNormalsSequence'
    },
    '(0024,0098)': {
        tag: '(0024,0098)',
        vr: 'FL',
        vm: '1',
        name: 'QuantifiedDefect'
    },
    '(0024,0100)': {
        tag: '(0024,0100)',
        vr: 'FL',
        vm: '1',
        name: 'AgeCorrectedSensitivityDeviationProbabilityValue'
    },
    '(0024,0102)': {
        tag: '(0024,0102)',
        vr: 'CS',
        vm: '1',
        name: 'GeneralizedDefectCorrectedSensitivityDeviationFlag '
    },
    '(0024,0103)': {
        tag: '(0024,0103)',
        vr: 'FL',
        vm: '1',
        name: 'GeneralizedDefectCorrectedSensitivityDeviationValue '
    },
    '(0024,0104)': {
        tag: '(0024,0104)',
        vr: 'FL',
        vm: '1',
        name: 'GeneralizedDefectCorrectedSensitivityDeviationProbabilityValue'
    },
    '(0024,0105)': {
        tag: '(0024,0105)',
        vr: 'FL',
        vm: '1',
        name: 'MinimumSensitivityValue'
    },
    '(0024,0106)': {
        tag: '(0024,0106)',
        vr: 'CS',
        vm: '1',
        name: 'BlindSpotLocalized'
    },
    '(0024,0107)': {
        tag: '(0024,0107)',
        vr: 'FL',
        vm: '1',
        name: 'BlindSpotXCoordinate'
    },
    '(0024,0108)': {
        tag: '(0024,0108)',
        vr: 'FL',
        vm: '1',
        name: 'BlindSpotYCoordinate '
    },
    '(0024,0110)': {
        tag: '(0024,0110)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualAcuityMeasurementSequence'
    },
    '(0024,0112)': {
        tag: '(0024,0112)',
        vr: 'SQ',
        vm: '1',
        name: 'RefractiveParametersUsedOnPatientSequence'
    },
    '(0024,0113)': {
        tag: '(0024,0113)',
        vr: 'CS',
        vm: '1',
        name: 'MeasurementLaterality'
    },
    '(0024,0114)': {
        tag: '(0024,0114)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicPatientClinicalInformationLeftEyeSequence'
    },
    '(0024,0115)': {
        tag: '(0024,0115)',
        vr: 'SQ',
        vm: '1',
        name: 'OphthalmicPatientClinicalInformationRightEyeSequence'
    },
    '(0024,0117)': {
        tag: '(0024,0117)',
        vr: 'CS',
        vm: '1',
        name: 'FovealPointNormativeDataFlag'
    },
    '(0024,0118)': {
        tag: '(0024,0118)',
        vr: 'FL',
        vm: '1',
        name: 'FovealPointProbabilityValue'
    },
    '(0024,0120)': {
        tag: '(0024,0120)',
        vr: 'CS',
        vm: '1',
        name: 'ScreeningBaselineMeasured'
    },
    '(0024,0122)': {
        tag: '(0024,0122)',
        vr: 'SQ',
        vm: '1',
        name: 'ScreeningBaselineMeasuredSequence'
    },
    '(0024,0124)': {
        tag: '(0024,0124)',
        vr: 'CS',
        vm: '1',
        name: 'ScreeningBaselineType'
    },
    '(0024,0126)': {
        tag: '(0024,0126)',
        vr: 'FL',
        vm: '1',
        name: 'ScreeningBaselineValue'
    },
    '(0024,0202)': {
        tag: '(0024,0202)',
        vr: 'LO',
        vm: '1',
        name: 'AlgorithmSource'
    },
    '(0024,0306)': {
        tag: '(0024,0306)',
        vr: 'LO',
        vm: '1',
        name: 'DataSetName'
    },
    '(0024,0307)': {
        tag: '(0024,0307)',
        vr: 'LO',
        vm: '1',
        name: 'DataSetVersion'
    },
    '(0024,0308)': {
        tag: '(0024,0308)',
        vr: 'LO',
        vm: '1',
        name: 'DataSetSource'
    },
    '(0024,0309)': {
        tag: '(0024,0309)',
        vr: 'LO',
        vm: '1',
        name: 'DataSetDescription'
    },
    '(0024,0317)': {
        tag: '(0024,0317)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualFieldTestReliabilityGlobalIndexSequence'
    },
    '(0024,0320)': {
        tag: '(0024,0320)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualFieldGlobalResultsIndexSequence'
    },
    '(0024,0325)': {
        tag: '(0024,0325)',
        vr: 'SQ',
        vm: '1',
        name: 'DataObservationSequence'
    },
    '(0024,0338)': {
        tag: '(0024,0338)',
        vr: 'CS',
        vm: '1',
        name: 'IndexNormalsFlag'
    },
    '(0024,0341)': {
        tag: '(0024,0341)',
        vr: 'FL',
        vm: '1',
        name: 'IndexProbability'
    },
    '(0024,0344)': {
        tag: '(0024,0344)',
        vr: 'SQ',
        vm: '1',
        name: 'IndexProbabilitySequence'
    },
    '(0028,0002)': {
        tag: '(0028,0002)',
        vr: 'US',
        vm: '1',
        name: 'SamplesPerPixel'
    },
    '(0028,0003)': {
        tag: '(0028,0003)',
        vr: 'US',
        vm: '1',
        name: 'SamplesPerPixelUsed'
    },
    '(0028,0004)': {
        tag: '(0028,0004)',
        vr: 'CS',
        vm: '1',
        name: 'PhotometricInterpretation'
    },
    '(0028,0005)': {
        tag: '(0028,0005)',
        vr: 'US',
        vm: '1',
        name: 'ImageDimensions'
    },
    '(0028,0006)': {
        tag: '(0028,0006)',
        vr: 'US',
        vm: '1',
        name: 'PlanarConfiguration'
    },
    '(0028,0008)': {
        tag: '(0028,0008)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfFrames'
    },
    '(0028,0009)': {
        tag: '(0028,0009)',
        vr: 'AT',
        vm: '1-n',
        name: 'FrameIncrementPointer'
    },
    '(0028,000A)': {
        tag: '(0028,000A)',
        vr: 'AT',
        vm: '1-n',
        name: 'FrameDimensionPointer'
    },
    '(0028,0010)': {
        tag: '(0028,0010)',
        vr: 'US',
        vm: '1',
        name: 'Rows'
    },
    '(0028,0011)': {
        tag: '(0028,0011)',
        vr: 'US',
        vm: '1',
        name: 'Columns'
    },
    '(0028,0012)': {
        tag: '(0028,0012)',
        vr: 'US',
        vm: '1',
        name: 'Planes'
    },
    '(0028,0014)': {
        tag: '(0028,0014)',
        vr: 'US',
        vm: '1',
        name: 'UltrasoundColorDataPresent'
    },
    '(0028,0030)': {
        tag: '(0028,0030)',
        vr: 'DS',
        vm: '2',
        name: 'PixelSpacing'
    },
    '(0028,0031)': {
        tag: '(0028,0031)',
        vr: 'DS',
        vm: '2',
        name: 'ZoomFactor'
    },
    '(0028,0032)': {
        tag: '(0028,0032)',
        vr: 'DS',
        vm: '2',
        name: 'ZoomCenter'
    },
    '(0028,0034)': {
        tag: '(0028,0034)',
        vr: 'IS',
        vm: '2',
        name: 'PixelAspectRatio'
    },
    '(0028,0040)': {
        tag: '(0028,0040)',
        vr: 'CS',
        vm: '1',
        name: 'ImageFormat'
    },
    '(0028,0050)': {
        tag: '(0028,0050)',
        vr: 'LO',
        vm: '1-n',
        name: 'ManipulatedImage'
    },
    '(0028,0051)': {
        tag: '(0028,0051)',
        vr: 'CS',
        vm: '1-n',
        name: 'CorrectedImage'
    },
    '(0028,005F)': {
        tag: '(0028,005F)',
        vr: 'LO',
        vm: '1',
        name: 'CompressionRecognitionCode'
    },
    '(0028,0060)': {
        tag: '(0028,0060)',
        vr: 'CS',
        vm: '1',
        name: 'CompressionCode'
    },
    '(0028,0061)': {
        tag: '(0028,0061)',
        vr: 'SH',
        vm: '1',
        name: 'CompressionOriginator'
    },
    '(0028,0062)': {
        tag: '(0028,0062)',
        vr: 'LO',
        vm: '1',
        name: 'CompressionLabel'
    },
    '(0028,0063)': {
        tag: '(0028,0063)',
        vr: 'SH',
        vm: '1',
        name: 'CompressionDescription'
    },
    '(0028,0065)': {
        tag: '(0028,0065)',
        vr: 'CS',
        vm: '1-n',
        name: 'CompressionSequence'
    },
    '(0028,0066)': {
        tag: '(0028,0066)',
        vr: 'AT',
        vm: '1-n',
        name: 'CompressionStepPointers'
    },
    '(0028,0068)': {
        tag: '(0028,0068)',
        vr: 'US',
        vm: '1',
        name: 'RepeatInterval'
    },
    '(0028,0069)': {
        tag: '(0028,0069)',
        vr: 'US',
        vm: '1',
        name: 'BitsGrouped'
    },
    '(0028,0070)': {
        tag: '(0028,0070)',
        vr: 'US',
        vm: '1-n',
        name: 'PerimeterTable'
    },
    '(0028,0071)': {
        tag: '(0028,0071)',
        vr: 'US|SS',
        vm: '1',
        name: 'PerimeterValue'
    },
    '(0028,0080)': {
        tag: '(0028,0080)',
        vr: 'US',
        vm: '1',
        name: 'PredictorRows'
    },
    '(0028,0081)': {
        tag: '(0028,0081)',
        vr: 'US',
        vm: '1',
        name: 'PredictorColumns'
    },
    '(0028,0082)': {
        tag: '(0028,0082)',
        vr: 'US',
        vm: '1-n',
        name: 'PredictorConstants'
    },
    '(0028,0090)': {
        tag: '(0028,0090)',
        vr: 'CS',
        vm: '1',
        name: 'BlockedPixels'
    },
    '(0028,0091)': {
        tag: '(0028,0091)',
        vr: 'US',
        vm: '1',
        name: 'BlockRows'
    },
    '(0028,0092)': {
        tag: '(0028,0092)',
        vr: 'US',
        vm: '1',
        name: 'BlockColumns'
    },
    '(0028,0093)': {
        tag: '(0028,0093)',
        vr: 'US',
        vm: '1',
        name: 'RowOverlap'
    },
    '(0028,0094)': {
        tag: '(0028,0094)',
        vr: 'US',
        vm: '1',
        name: 'ColumnOverlap'
    },
    '(0028,0100)': {
        tag: '(0028,0100)',
        vr: 'US',
        vm: '1',
        name: 'BitsAllocated'
    },
    '(0028,0101)': {
        tag: '(0028,0101)',
        vr: 'US',
        vm: '1',
        name: 'BitsStored'
    },
    '(0028,0102)': {
        tag: '(0028,0102)',
        vr: 'US',
        vm: '1',
        name: 'HighBit'
    },
    '(0028,0103)': {
        tag: '(0028,0103)',
        vr: 'US',
        vm: '1',
        name: 'PixelRepresentation'
    },
    '(0028,0104)': {
        tag: '(0028,0104)',
        vr: 'US|SS',
        vm: '1',
        name: 'SmallestValidPixelValue'
    },
    '(0028,0105)': {
        tag: '(0028,0105)',
        vr: 'US|SS',
        vm: '1',
        name: 'LargestValidPixelValue'
    },
    '(0028,0106)': {
        tag: '(0028,0106)',
        vr: 'US|SS',
        vm: '1',
        name: 'SmallestImagePixelValue'
    },
    '(0028,0107)': {
        tag: '(0028,0107)',
        vr: 'US|SS',
        vm: '1',
        name: 'LargestImagePixelValue'
    },
    '(0028,0108)': {
        tag: '(0028,0108)',
        vr: 'US|SS',
        vm: '1',
        name: 'SmallestPixelValueInSeries'
    },
    '(0028,0109)': {
        tag: '(0028,0109)',
        vr: 'US|SS',
        vm: '1',
        name: 'LargestPixelValueInSeries'
    },
    '(0028,0110)': {
        tag: '(0028,0110)',
        vr: 'US|SS',
        vm: '1',
        name: 'SmallestImagePixelValueInPlane'
    },
    '(0028,0111)': {
        tag: '(0028,0111)',
        vr: 'US|SS',
        vm: '1',
        name: 'LargestImagePixelValueInPlane'
    },
    '(0028,0120)': {
        tag: '(0028,0120)',
        vr: 'US|SS',
        vm: '1',
        name: 'PixelPaddingValue'
    },
    '(0028,0121)': {
        tag: '(0028,0121)',
        vr: 'US|SS',
        vm: '1',
        name: 'PixelPaddingRangeLimit'
    },
    '(0028,0200)': {
        tag: '(0028,0200)',
        vr: 'US',
        vm: '1',
        name: 'ImageLocation'
    },
    '(0028,0300)': {
        tag: '(0028,0300)',
        vr: 'CS',
        vm: '1',
        name: 'QualityControlImage'
    },
    '(0028,0301)': {
        tag: '(0028,0301)',
        vr: 'CS',
        vm: '1',
        name: 'BurnedInAnnotation'
    },
    '(0028,0302)': {
        tag: '(0028,0302)',
        vr: 'CS',
        vm: '1',
        name: 'RecognizableVisualFeatures'
    },
    '(0028,0303)': {
        tag: '(0028,0303)',
        vr: 'CS',
        vm: '1',
        name: 'LongitudinalTemporalInformationModified'
    },
    '(0028,0400)': {
        tag: '(0028,0400)',
        vr: 'LO',
        vm: '1',
        name: 'TransformLabel'
    },
    '(0028,0401)': {
        tag: '(0028,0401)',
        vr: 'LO',
        vm: '1',
        name: 'TransformVersionNumber'
    },
    '(0028,0402)': {
        tag: '(0028,0402)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfTransformSteps'
    },
    '(0028,0403)': {
        tag: '(0028,0403)',
        vr: 'LO',
        vm: '1-n',
        name: 'SequenceOfCompressedData'
    },
    '(0028,0404)': {
        tag: '(0028,0404)',
        vr: 'AT',
        vm: '1-n',
        name: 'DetailsOfCoefficients'
    },
    '(0028,04x0)': {
        tag: '(0028,04x0)',
        vr: 'US',
        vm: '1',
        name: 'RowsForNthOrderCoefficients'
    },
    '(0028,04x1)': {
        tag: '(0028,04x1)',
        vr: 'US',
        vm: '1',
        name: 'ColumnsForNthOrderCoefficients'
    },
    '(0028,04x2)': {
        tag: '(0028,04x2)',
        vr: 'LO',
        vm: '1-n',
        name: 'CoefficientCoding'
    },
    '(0028,04x3)': {
        tag: '(0028,04x3)',
        vr: 'AT',
        vm: '1-n',
        name: 'CoefficientCodingPointers'
    },
    '(0028,0700)': {
        tag: '(0028,0700)',
        vr: 'LO',
        vm: '1',
        name: 'DCTLabel'
    },
    '(0028,0701)': {
        tag: '(0028,0701)',
        vr: 'CS',
        vm: '1-n',
        name: 'DataBlockDescription'
    },
    '(0028,0702)': {
        tag: '(0028,0702)',
        vr: 'AT',
        vm: '1-n',
        name: 'DataBlock'
    },
    '(0028,0710)': {
        tag: '(0028,0710)',
        vr: 'US',
        vm: '1',
        name: 'NormalizationFactorFormat'
    },
    '(0028,0720)': {
        tag: '(0028,0720)',
        vr: 'US',
        vm: '1',
        name: 'ZonalMapNumberFormat'
    },
    '(0028,0721)': {
        tag: '(0028,0721)',
        vr: 'AT',
        vm: '1-n',
        name: 'ZonalMapLocation'
    },
    '(0028,0722)': {
        tag: '(0028,0722)',
        vr: 'US',
        vm: '1',
        name: 'ZonalMapFormat'
    },
    '(0028,0730)': {
        tag: '(0028,0730)',
        vr: 'US',
        vm: '1',
        name: 'AdaptiveMapFormat'
    },
    '(0028,0740)': {
        tag: '(0028,0740)',
        vr: 'US',
        vm: '1',
        name: 'CodeNumberFormat'
    },
    '(0028,08x0)': {
        tag: '(0028,08x0)',
        vr: 'CS',
        vm: '1-n',
        name: 'CodeLabel'
    },
    '(0028,08x2)': {
        tag: '(0028,08x2)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfTables'
    },
    '(0028,08x3)': {
        tag: '(0028,08x3)',
        vr: 'AT',
        vm: '1-n',
        name: 'CodeTableLocation'
    },
    '(0028,08x4)': {
        tag: '(0028,08x4)',
        vr: 'US',
        vm: '1',
        name: 'BitsForCodeWord'
    },
    '(0028,08x8)': {
        tag: '(0028,08x8)',
        vr: 'AT',
        vm: '1-n',
        name: 'ImageDataLocation'
    },
    '(0028,0A02)': {
        tag: '(0028,0A02)',
        vr: 'CS',
        vm: '1',
        name: 'PixelSpacingCalibrationType'
    },
    '(0028,0A04)': {
        tag: '(0028,0A04)',
        vr: 'LO',
        vm: '1',
        name: 'PixelSpacingCalibrationDescription'
    },
    '(0028,1040)': {
        tag: '(0028,1040)',
        vr: 'CS',
        vm: '1',
        name: 'PixelIntensityRelationship'
    },
    '(0028,1041)': {
        tag: '(0028,1041)',
        vr: 'SS',
        vm: '1',
        name: 'PixelIntensityRelationshipSign'
    },
    '(0028,1050)': {
        tag: '(0028,1050)',
        vr: 'DS',
        vm: '1-n',
        name: 'WindowCenter'
    },
    '(0028,1051)': {
        tag: '(0028,1051)',
        vr: 'DS',
        vm: '1-n',
        name: 'WindowWidth'
    },
    '(0028,1052)': {
        tag: '(0028,1052)',
        vr: 'DS',
        vm: '1',
        name: 'RescaleIntercept'
    },
    '(0028,1053)': {
        tag: '(0028,1053)',
        vr: 'DS',
        vm: '1',
        name: 'RescaleSlope'
    },
    '(0028,1054)': {
        tag: '(0028,1054)',
        vr: 'LO',
        vm: '1',
        name: 'RescaleType'
    },
    '(0028,1055)': {
        tag: '(0028,1055)',
        vr: 'LO',
        vm: '1-n',
        name: 'WindowCenterWidthExplanation'
    },
    '(0028,1056)': {
        tag: '(0028,1056)',
        vr: 'CS',
        vm: '1',
        name: 'VOILUTFunction'
    },
    '(0028,1080)': {
        tag: '(0028,1080)',
        vr: 'CS',
        vm: '1',
        name: 'GrayScale'
    },
    '(0028,1090)': {
        tag: '(0028,1090)',
        vr: 'CS',
        vm: '1',
        name: 'RecommendedViewingMode'
    },
    '(0028,1100)': {
        tag: '(0028,1100)',
        vr: 'US|SS',
        vm: '3',
        name: 'GrayLookupTableDescriptor'
    },
    '(0028,1101)': {
        tag: '(0028,1101)',
        vr: 'US|SS',
        vm: '3',
        name: 'RedPaletteColorLookupTableDescriptor'
    },
    '(0028,1102)': {
        tag: '(0028,1102)',
        vr: 'US|SS',
        vm: '3',
        name: 'GreenPaletteColorLookupTableDescriptor'
    },
    '(0028,1103)': {
        tag: '(0028,1103)',
        vr: 'US|SS',
        vm: '3',
        name: 'BluePaletteColorLookupTableDescriptor'
    },
    '(0028,1104)': {
        tag: '(0028,1104)',
        vr: 'US',
        vm: '3',
        name: 'AlphaPaletteColorLookupTableDescriptor'
    },
    '(0028,1111)': {
        tag: '(0028,1111)',
        vr: 'US|SS',
        vm: '4',
        name: 'LargeRedPaletteColorLookupTableDescriptor'
    },
    '(0028,1112)': {
        tag: '(0028,1112)',
        vr: 'US|SS',
        vm: '4',
        name: 'LargeGreenPaletteColorLookupTableDescriptor'
    },
    '(0028,1113)': {
        tag: '(0028,1113)',
        vr: 'US|SS',
        vm: '4',
        name: 'LargeBluePaletteColorLookupTableDescriptor'
    },
    '(0028,1199)': {
        tag: '(0028,1199)',
        vr: 'UI',
        vm: '1',
        name: 'PaletteColorLookupTableUID'
    },
    '(0028,1200)': {
        tag: '(0028,1200)',
        vr: 'US|SS|OW',
        vm: '1-n1',
        name: 'GrayLookupTableData'
    },
    '(0028,1201)': {
        tag: '(0028,1201)',
        vr: 'OW',
        vm: '1',
        name: 'RedPaletteColorLookupTableData'
    },
    '(0028,1202)': {
        tag: '(0028,1202)',
        vr: 'OW',
        vm: '1',
        name: 'GreenPaletteColorLookupTableData'
    },
    '(0028,1203)': {
        tag: '(0028,1203)',
        vr: 'OW',
        vm: '1',
        name: 'BluePaletteColorLookupTableData'
    },
    '(0028,1204)': {
        tag: '(0028,1204)',
        vr: 'OW',
        vm: '1',
        name: 'AlphaPaletteColorLookupTableData'
    },
    '(0028,1211)': {
        tag: '(0028,1211)',
        vr: 'OW',
        vm: '1',
        name: 'LargeRedPaletteColorLookupTableData'
    },
    '(0028,1212)': {
        tag: '(0028,1212)',
        vr: 'OW',
        vm: '1',
        name: 'LargeGreenPaletteColorLookupTableData'
    },
    '(0028,1213)': {
        tag: '(0028,1213)',
        vr: 'OW',
        vm: '1',
        name: 'LargeBluePaletteColorLookupTableData'
    },
    '(0028,1214)': {
        tag: '(0028,1214)',
        vr: 'UI',
        vm: '1',
        name: 'LargePaletteColorLookupTableUID'
    },
    '(0028,1221)': {
        tag: '(0028,1221)',
        vr: 'OW',
        vm: '1',
        name: 'SegmentedRedPaletteColorLookupTableData'
    },
    '(0028,1222)': {
        tag: '(0028,1222)',
        vr: 'OW',
        vm: '1',
        name: 'SegmentedGreenPaletteColorLookupTableData'
    },
    '(0028,1223)': {
        tag: '(0028,1223)',
        vr: 'OW',
        vm: '1',
        name: 'SegmentedBluePaletteColorLookupTableData'
    },
    '(0028,1300)': {
        tag: '(0028,1300)',
        vr: 'CS',
        vm: '1',
        name: 'BreastImplantPresent'
    },
    '(0028,1350)': {
        tag: '(0028,1350)',
        vr: 'CS',
        vm: '1',
        name: 'PartialView'
    },
    '(0028,1351)': {
        tag: '(0028,1351)',
        vr: 'ST',
        vm: '1',
        name: 'PartialViewDescription'
    },
    '(0028,1352)': {
        tag: '(0028,1352)',
        vr: 'SQ',
        vm: '1',
        name: 'PartialViewCodeSequence'
    },
    '(0028,135A)': {
        tag: '(0028,135A)',
        vr: 'CS',
        vm: '1',
        name: 'SpatialLocationsPreserved'
    },
    '(0028,1401)': {
        tag: '(0028,1401)',
        vr: 'SQ',
        vm: '1',
        name: 'DataFrameAssignmentSequence'
    },
    '(0028,1402)': {
        tag: '(0028,1402)',
        vr: 'CS',
        vm: '1',
        name: 'DataPathAssignment'
    },
    '(0028,1403)': {
        tag: '(0028,1403)',
        vr: 'US',
        vm: '1',
        name: 'BitsMappedToColorLookupTable'
    },
    '(0028,1404)': {
        tag: '(0028,1404)',
        vr: 'SQ',
        vm: '1',
        name: 'BlendingLUT1Sequence'
    },
    '(0028,1405)': {
        tag: '(0028,1405)',
        vr: 'CS',
        vm: '1',
        name: 'BlendingLUT1TransferFunction'
    },
    '(0028,1406)': {
        tag: '(0028,1406)',
        vr: 'FD',
        vm: '1',
        name: 'BlendingWeightConstant'
    },
    '(0028,1407)': {
        tag: '(0028,1407)',
        vr: 'US',
        vm: '3',
        name: 'BlendingLookupTableDescriptor'
    },
    '(0028,1408)': {
        tag: '(0028,1408)',
        vr: 'OW',
        vm: '1',
        name: 'BlendingLookupTableData'
    },
    '(0028,140B)': {
        tag: '(0028,140B)',
        vr: 'SQ',
        vm: '1',
        name: 'EnhancedPaletteColorLookupTableSequence'
    },
    '(0028,140C)': {
        tag: '(0028,140C)',
        vr: 'SQ',
        vm: '1',
        name: 'BlendingLUT2Sequence'
    },
    '(0028,140D)': {
        tag: '(0028,140D)',
        vr: 'CS',
        vm: '1',
        name: 'BlendingLUT2TransferFunction'
    },
    '(0028,140E)': {
        tag: '(0028,140E)',
        vr: 'CS',
        vm: '1',
        name: 'DataPathID'
    },
    '(0028,140F)': {
        tag: '(0028,140F)',
        vr: 'CS',
        vm: '1',
        name: 'RGBLUTTransferFunction'
    },
    '(0028,1410)': {
        tag: '(0028,1410)',
        vr: 'CS',
        vm: '1',
        name: 'AlphaLUTTransferFunction'
    },
    '(0028,2000)': {
        tag: '(0028,2000)',
        vr: 'OB',
        vm: '1',
        name: 'ICCProfile'
    },
    '(0028,2110)': {
        tag: '(0028,2110)',
        vr: 'CS',
        vm: '1',
        name: 'LossyImageCompression'
    },
    '(0028,2112)': {
        tag: '(0028,2112)',
        vr: 'DS',
        vm: '1-n',
        name: 'LossyImageCompressionRatio'
    },
    '(0028,2114)': {
        tag: '(0028,2114)',
        vr: 'CS',
        vm: '1-n',
        name: 'LossyImageCompressionMethod'
    },
    '(0028,3000)': {
        tag: '(0028,3000)',
        vr: 'SQ',
        vm: '1',
        name: 'ModalityLUTSequence'
    },
    '(0028,3002)': {
        tag: '(0028,3002)',
        vr: 'US|SS',
        vm: '3',
        name: 'LUTDescriptor'
    },
    '(0028,3003)': {
        tag: '(0028,3003)',
        vr: 'LO',
        vm: '1',
        name: 'LUTExplanation'
    },
    '(0028,3004)': {
        tag: '(0028,3004)',
        vr: 'LO',
        vm: '1',
        name: 'ModalityLUTType'
    },
    '(0028,3006)': {
        tag: '(0028,3006)',
        vr: 'US|OW',
        vm: '1-n1',
        name: 'LUTData'
    },
    '(0028,3010)': {
        tag: '(0028,3010)',
        vr: 'SQ',
        vm: '1',
        name: 'VOILUTSequence'
    },
    '(0028,3110)': {
        tag: '(0028,3110)',
        vr: 'SQ',
        vm: '1',
        name: 'SoftcopyVOILUTSequence'
    },
    '(0028,4000)': {
        tag: '(0028,4000)',
        vr: 'LT',
        vm: '1',
        name: 'ImagePresentationComments'
    },
    '(0028,5000)': {
        tag: '(0028,5000)',
        vr: 'SQ',
        vm: '1',
        name: 'BiPlaneAcquisitionSequence'
    },
    '(0028,6010)': {
        tag: '(0028,6010)',
        vr: 'US',
        vm: '1',
        name: 'RepresentativeFrameNumber'
    },
    '(0028,6020)': {
        tag: '(0028,6020)',
        vr: 'US',
        vm: '1-n',
        name: 'FrameNumbersOfInterest'
    },
    '(0028,6022)': {
        tag: '(0028,6022)',
        vr: 'LO',
        vm: '1-n',
        name: 'FrameOfInterestDescription'
    },
    '(0028,6023)': {
        tag: '(0028,6023)',
        vr: 'CS',
        vm: '1-n',
        name: 'FrameOfInterestType'
    },
    '(0028,6030)': {
        tag: '(0028,6030)',
        vr: 'US',
        vm: '1-n',
        name: 'MaskPointers'
    },
    '(0028,6040)': {
        tag: '(0028,6040)',
        vr: 'US',
        vm: '1-n',
        name: 'RWavePointer'
    },
    '(0028,6100)': {
        tag: '(0028,6100)',
        vr: 'SQ',
        vm: '1',
        name: 'MaskSubtractionSequence'
    },
    '(0028,6101)': {
        tag: '(0028,6101)',
        vr: 'CS',
        vm: '1',
        name: 'MaskOperation'
    },
    '(0028,6102)': {
        tag: '(0028,6102)',
        vr: 'US',
        vm: '2-2n',
        name: 'ApplicableFrameRange'
    },
    '(0028,6110)': {
        tag: '(0028,6110)',
        vr: 'US',
        vm: '1-n',
        name: 'MaskFrameNumbers'
    },
    '(0028,6112)': {
        tag: '(0028,6112)',
        vr: 'US',
        vm: '1',
        name: 'ContrastFrameAveraging'
    },
    '(0028,6114)': {
        tag: '(0028,6114)',
        vr: 'FL',
        vm: '2',
        name: 'MaskSubPixelShift'
    },
    '(0028,6120)': {
        tag: '(0028,6120)',
        vr: 'SS',
        vm: '1',
        name: 'TIDOffset'
    },
    '(0028,6190)': {
        tag: '(0028,6190)',
        vr: 'ST',
        vm: '1',
        name: 'MaskOperationExplanation'
    },
    '(0028,7FE0)': {
        tag: '(0028,7FE0)',
        vr: 'UT',
        vm: '1',
        name: 'PixelDataProviderURL'
    },
    '(0028,9001)': {
        tag: '(0028,9001)',
        vr: 'UL',
        vm: '1',
        name: 'DataPointRows'
    },
    '(0028,9002)': {
        tag: '(0028,9002)',
        vr: 'UL',
        vm: '1',
        name: 'DataPointColumns'
    },
    '(0028,9003)': {
        tag: '(0028,9003)',
        vr: 'CS',
        vm: '1',
        name: 'SignalDomainColumns'
    },
    '(0028,9099)': {
        tag: '(0028,9099)',
        vr: 'US',
        vm: '1',
        name: 'LargestMonochromePixelValue'
    },
    '(0028,9108)': {
        tag: '(0028,9108)',
        vr: 'CS',
        vm: '1',
        name: 'DataRepresentation'
    },
    '(0028,9110)': {
        tag: '(0028,9110)',
        vr: 'SQ',
        vm: '1',
        name: 'PixelMeasuresSequence'
    },
    '(0028,9132)': {
        tag: '(0028,9132)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameVOILUTSequence'
    },
    '(0028,9145)': {
        tag: '(0028,9145)',
        vr: 'SQ',
        vm: '1',
        name: 'PixelValueTransformationSequence'
    },
    '(0028,9235)': {
        tag: '(0028,9235)',
        vr: 'CS',
        vm: '1',
        name: 'SignalDomainRows'
    },
    '(0028,9411)': {
        tag: '(0028,9411)',
        vr: 'FL',
        vm: '1',
        name: 'DisplayFilterPercentage'
    },
    '(0028,9415)': {
        tag: '(0028,9415)',
        vr: 'SQ',
        vm: '1',
        name: 'FramePixelShiftSequence'
    },
    '(0028,9416)': {
        tag: '(0028,9416)',
        vr: 'US',
        vm: '1',
        name: 'SubtractionItemID'
    },
    '(0028,9422)': {
        tag: '(0028,9422)',
        vr: 'SQ',
        vm: '1',
        name: 'PixelIntensityRelationshipLUTSequence'
    },
    '(0028,9443)': {
        tag: '(0028,9443)',
        vr: 'SQ',
        vm: '1',
        name: 'FramePixelDataPropertiesSequence'
    },
    '(0028,9444)': {
        tag: '(0028,9444)',
        vr: 'CS',
        vm: '1',
        name: 'GeometricalProperties'
    },
    '(0028,9445)': {
        tag: '(0028,9445)',
        vr: 'FL',
        vm: '1',
        name: 'GeometricMaximumDistortion'
    },
    '(0028,9446)': {
        tag: '(0028,9446)',
        vr: 'CS',
        vm: '1-n',
        name: 'ImageProcessingApplied'
    },
    '(0028,9454)': {
        tag: '(0028,9454)',
        vr: 'CS',
        vm: '1',
        name: 'MaskSelectionMode'
    },
    '(0028,9474)': {
        tag: '(0028,9474)',
        vr: 'CS',
        vm: '1',
        name: 'LUTFunction'
    },
    '(0028,9478)': {
        tag: '(0028,9478)',
        vr: 'FL',
        vm: '1',
        name: 'MaskVisibilityPercentage'
    },
    '(0028,9501)': {
        tag: '(0028,9501)',
        vr: 'SQ',
        vm: '1',
        name: 'PixelShiftSequence'
    },
    '(0028,9502)': {
        tag: '(0028,9502)',
        vr: 'SQ',
        vm: '1',
        name: 'RegionPixelShiftSequence'
    },
    '(0028,9503)': {
        tag: '(0028,9503)',
        vr: 'SS',
        vm: '2-2n',
        name: 'VerticesOfTheRegion'
    },
    '(0028,9505)': {
        tag: '(0028,9505)',
        vr: 'SQ',
        vm: '1',
        name: 'MultiFramePresentationSequence'
    },
    '(0028,9506)': {
        tag: '(0028,9506)',
        vr: 'US',
        vm: '2-2n',
        name: 'PixelShiftFrameRange'
    },
    '(0028,9507)': {
        tag: '(0028,9507)',
        vr: 'US',
        vm: '2-2n',
        name: 'LUTFrameRange'
    },
    '(0028,9520)': {
        tag: '(0028,9520)',
        vr: 'DS',
        vm: '16',
        name: 'ImageToEquipmentMappingMatrix'
    },
    '(0028,9537)': {
        tag: '(0028,9537)',
        vr: 'CS',
        vm: '1',
        name: 'EquipmentCoordinateSystemIdentification'
    },
    '(0032,000A)': {
        tag: '(0032,000A)',
        vr: 'CS',
        vm: '1',
        name: 'StudyStatusID'
    },
    '(0032,000C)': {
        tag: '(0032,000C)',
        vr: 'CS',
        vm: '1',
        name: 'StudyPriorityID'
    },
    '(0032,0012)': {
        tag: '(0032,0012)',
        vr: 'LO',
        vm: '1',
        name: 'StudyIDIssuer'
    },
    '(0032,0032)': {
        tag: '(0032,0032)',
        vr: 'DA',
        vm: '1',
        name: 'StudyVerifiedDate'
    },
    '(0032,0033)': {
        tag: '(0032,0033)',
        vr: 'TM',
        vm: '1',
        name: 'StudyVerifiedTime'
    },
    '(0032,0034)': {
        tag: '(0032,0034)',
        vr: 'DA',
        vm: '1',
        name: 'StudyReadDate'
    },
    '(0032,0035)': {
        tag: '(0032,0035)',
        vr: 'TM',
        vm: '1',
        name: 'StudyReadTime'
    },
    '(0032,1000)': {
        tag: '(0032,1000)',
        vr: 'DA',
        vm: '1',
        name: 'ScheduledStudyStartDate'
    },
    '(0032,1001)': {
        tag: '(0032,1001)',
        vr: 'TM',
        vm: '1',
        name: 'ScheduledStudyStartTime'
    },
    '(0032,1010)': {
        tag: '(0032,1010)',
        vr: 'DA',
        vm: '1',
        name: 'ScheduledStudyStopDate'
    },
    '(0032,1011)': {
        tag: '(0032,1011)',
        vr: 'TM',
        vm: '1',
        name: 'ScheduledStudyStopTime'
    },
    '(0032,1020)': {
        tag: '(0032,1020)',
        vr: 'LO',
        vm: '1',
        name: 'ScheduledStudyLocation'
    },
    '(0032,1021)': {
        tag: '(0032,1021)',
        vr: 'AE',
        vm: '1-n',
        name: 'ScheduledStudyLocationAETitle'
    },
    '(0032,1030)': {
        tag: '(0032,1030)',
        vr: 'LO',
        vm: '1',
        name: 'ReasonForStudy'
    },
    '(0032,1031)': {
        tag: '(0032,1031)',
        vr: 'SQ',
        vm: '1',
        name: 'RequestingPhysicianIdentificationSequence'
    },
    '(0032,1032)': {
        tag: '(0032,1032)',
        vr: 'PN',
        vm: '1',
        name: 'RequestingPhysician'
    },
    '(0032,1033)': {
        tag: '(0032,1033)',
        vr: 'LO',
        vm: '1',
        name: 'RequestingService'
    },
    '(0032,1034)': {
        tag: '(0032,1034)',
        vr: 'SQ',
        vm: '1',
        name: 'RequestingServiceCodeSequence'
    },
    '(0032,1040)': {
        tag: '(0032,1040)',
        vr: 'DA',
        vm: '1',
        name: 'StudyArrivalDate'
    },
    '(0032,1041)': {
        tag: '(0032,1041)',
        vr: 'TM',
        vm: '1',
        name: 'StudyArrivalTime'
    },
    '(0032,1050)': {
        tag: '(0032,1050)',
        vr: 'DA',
        vm: '1',
        name: 'StudyCompletionDate'
    },
    '(0032,1051)': {
        tag: '(0032,1051)',
        vr: 'TM',
        vm: '1',
        name: 'StudyCompletionTime'
    },
    '(0032,1055)': {
        tag: '(0032,1055)',
        vr: 'CS',
        vm: '1',
        name: 'StudyComponentStatusID'
    },
    '(0032,1060)': {
        tag: '(0032,1060)',
        vr: 'LO',
        vm: '1',
        name: 'RequestedProcedureDescription'
    },
    '(0032,1064)': {
        tag: '(0032,1064)',
        vr: 'SQ',
        vm: '1',
        name: 'RequestedProcedureCodeSequence'
    },
    '(0032,1070)': {
        tag: '(0032,1070)',
        vr: 'LO',
        vm: '1',
        name: 'RequestedContrastAgent'
    },
    '(0032,4000)': {
        tag: '(0032,4000)',
        vr: 'LT',
        vm: '1',
        name: 'StudyComments'
    },
    '(0038,0004)': {
        tag: '(0038,0004)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPatientAliasSequence'
    },
    '(0038,0008)': {
        tag: '(0038,0008)',
        vr: 'CS',
        vm: '1',
        name: 'VisitStatusID'
    },
    '(0038,0010)': {
        tag: '(0038,0010)',
        vr: 'LO',
        vm: '1',
        name: 'AdmissionID'
    },
    '(0038,0011)': {
        tag: '(0038,0011)',
        vr: 'LO',
        vm: '1',
        name: 'IssuerOfAdmissionID'
    },
    '(0038,0014)': {
        tag: '(0038,0014)',
        vr: 'SQ',
        vm: '1',
        name: 'IssuerOfAdmissionIDSequence'
    },
    '(0038,0016)': {
        tag: '(0038,0016)',
        vr: 'LO',
        vm: '1',
        name: 'RouteOfAdmissions'
    },
    '(0038,001A)': {
        tag: '(0038,001A)',
        vr: 'DA',
        vm: '1',
        name: 'ScheduledAdmissionDate'
    },
    '(0038,001B)': {
        tag: '(0038,001B)',
        vr: 'TM',
        vm: '1',
        name: 'ScheduledAdmissionTime'
    },
    '(0038,001C)': {
        tag: '(0038,001C)',
        vr: 'DA',
        vm: '1',
        name: 'ScheduledDischargeDate'
    },
    '(0038,001D)': {
        tag: '(0038,001D)',
        vr: 'TM',
        vm: '1',
        name: 'ScheduledDischargeTime'
    },
    '(0038,001E)': {
        tag: '(0038,001E)',
        vr: 'LO',
        vm: '1',
        name: 'ScheduledPatientInstitutionResidence'
    },
    '(0038,0020)': {
        tag: '(0038,0020)',
        vr: 'DA',
        vm: '1',
        name: 'AdmittingDate'
    },
    '(0038,0021)': {
        tag: '(0038,0021)',
        vr: 'TM',
        vm: '1',
        name: 'AdmittingTime'
    },
    '(0038,0030)': {
        tag: '(0038,0030)',
        vr: 'DA',
        vm: '1',
        name: 'DischargeDate'
    },
    '(0038,0032)': {
        tag: '(0038,0032)',
        vr: 'TM',
        vm: '1',
        name: 'DischargeTime'
    },
    '(0038,0040)': {
        tag: '(0038,0040)',
        vr: 'LO',
        vm: '1',
        name: 'DischargeDiagnosisDescription'
    },
    '(0038,0044)': {
        tag: '(0038,0044)',
        vr: 'SQ',
        vm: '1',
        name: 'DischargeDiagnosisCodeSequence'
    },
    '(0038,0050)': {
        tag: '(0038,0050)',
        vr: 'LO',
        vm: '1',
        name: 'SpecialNeeds'
    },
    '(0038,0060)': {
        tag: '(0038,0060)',
        vr: 'LO',
        vm: '1',
        name: 'ServiceEpisodeID'
    },
    '(0038,0061)': {
        tag: '(0038,0061)',
        vr: 'LO',
        vm: '1',
        name: 'IssuerOfServiceEpisodeID'
    },
    '(0038,0062)': {
        tag: '(0038,0062)',
        vr: 'LO',
        vm: '1',
        name: 'ServiceEpisodeDescription'
    },
    '(0038,0064)': {
        tag: '(0038,0064)',
        vr: 'SQ',
        vm: '1',
        name: 'IssuerOfServiceEpisodeIDSequence'
    },
    '(0038,0100)': {
        tag: '(0038,0100)',
        vr: 'SQ',
        vm: '1',
        name: 'PertinentDocumentsSequence'
    },
    '(0038,0300)': {
        tag: '(0038,0300)',
        vr: 'LO',
        vm: '1',
        name: 'CurrentPatientLocation'
    },
    '(0038,0400)': {
        tag: '(0038,0400)',
        vr: 'LO',
        vm: '1',
        name: 'PatientInstitutionResidence'
    },
    '(0038,0500)': {
        tag: '(0038,0500)',
        vr: 'LO',
        vm: '1',
        name: 'PatientState'
    },
    '(0038,0502)': {
        tag: '(0038,0502)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientClinicalTrialParticipationSequence'
    },
    '(0038,4000)': {
        tag: '(0038,4000)',
        vr: 'LT',
        vm: '1',
        name: 'VisitComments'
    },
    '(003A,0004)': {
        tag: '(003A,0004)',
        vr: 'CS',
        vm: '1',
        name: 'WaveformOriginality'
    },
    '(003A,0005)': {
        tag: '(003A,0005)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfWaveformChannels'
    },
    '(003A,0010)': {
        tag: '(003A,0010)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfWaveformSamples'
    },
    '(003A,001A)': {
        tag: '(003A,001A)',
        vr: 'DS',
        vm: '1',
        name: 'SamplingFrequency'
    },
    '(003A,0020)': {
        tag: '(003A,0020)',
        vr: 'SH',
        vm: '1',
        name: 'MultiplexGroupLabel'
    },
    '(003A,0200)': {
        tag: '(003A,0200)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelDefinitionSequence'
    },
    '(003A,0202)': {
        tag: '(003A,0202)',
        vr: 'IS',
        vm: '1',
        name: 'WaveformChannelNumber'
    },
    '(003A,0203)': {
        tag: '(003A,0203)',
        vr: 'SH',
        vm: '1',
        name: 'ChannelLabel'
    },
    '(003A,0205)': {
        tag: '(003A,0205)',
        vr: 'CS',
        vm: '1-n',
        name: 'ChannelStatus'
    },
    '(003A,0208)': {
        tag: '(003A,0208)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelSourceSequence'
    },
    '(003A,0209)': {
        tag: '(003A,0209)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelSourceModifiersSequence'
    },
    '(003A,020A)': {
        tag: '(003A,020A)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceWaveformSequence'
    },
    '(003A,020C)': {
        tag: '(003A,020C)',
        vr: 'LO',
        vm: '1',
        name: 'ChannelDerivationDescription'
    },
    '(003A,0210)': {
        tag: '(003A,0210)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelSensitivity'
    },
    '(003A,0211)': {
        tag: '(003A,0211)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelSensitivityUnitsSequence'
    },
    '(003A,0212)': {
        tag: '(003A,0212)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelSensitivityCorrectionFactor'
    },
    '(003A,0213)': {
        tag: '(003A,0213)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelBaseline'
    },
    '(003A,0214)': {
        tag: '(003A,0214)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelTimeSkew'
    },
    '(003A,0215)': {
        tag: '(003A,0215)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelSampleSkew'
    },
    '(003A,0218)': {
        tag: '(003A,0218)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelOffset'
    },
    '(003A,021A)': {
        tag: '(003A,021A)',
        vr: 'US',
        vm: '1',
        name: 'WaveformBitsStored'
    },
    '(003A,0220)': {
        tag: '(003A,0220)',
        vr: 'DS',
        vm: '1',
        name: 'FilterLowFrequency'
    },
    '(003A,0221)': {
        tag: '(003A,0221)',
        vr: 'DS',
        vm: '1',
        name: 'FilterHighFrequency'
    },
    '(003A,0222)': {
        tag: '(003A,0222)',
        vr: 'DS',
        vm: '1',
        name: 'NotchFilterFrequency'
    },
    '(003A,0223)': {
        tag: '(003A,0223)',
        vr: 'DS',
        vm: '1',
        name: 'NotchFilterBandwidth'
    },
    '(003A,0230)': {
        tag: '(003A,0230)',
        vr: 'FL',
        vm: '1',
        name: 'WaveformDataDisplayScale'
    },
    '(003A,0231)': {
        tag: '(003A,0231)',
        vr: 'US',
        vm: '3',
        name: 'WaveformDisplayBackgroundCIELabValue'
    },
    '(003A,0240)': {
        tag: '(003A,0240)',
        vr: 'SQ',
        vm: '1',
        name: 'WaveformPresentationGroupSequence'
    },
    '(003A,0241)': {
        tag: '(003A,0241)',
        vr: 'US',
        vm: '1',
        name: 'PresentationGroupNumber'
    },
    '(003A,0242)': {
        tag: '(003A,0242)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelDisplaySequence'
    },
    '(003A,0244)': {
        tag: '(003A,0244)',
        vr: 'US',
        vm: '3',
        name: 'ChannelRecommendedDisplayCIELabValue'
    },
    '(003A,0245)': {
        tag: '(003A,0245)',
        vr: 'FL',
        vm: '1',
        name: 'ChannelPosition'
    },
    '(003A,0246)': {
        tag: '(003A,0246)',
        vr: 'CS',
        vm: '1',
        name: 'DisplayShadingFlag'
    },
    '(003A,0247)': {
        tag: '(003A,0247)',
        vr: 'FL',
        vm: '1',
        name: 'FractionalChannelDisplayScale'
    },
    '(003A,0248)': {
        tag: '(003A,0248)',
        vr: 'FL',
        vm: '1',
        name: 'AbsoluteChannelDisplayScale'
    },
    '(003A,0300)': {
        tag: '(003A,0300)',
        vr: 'SQ',
        vm: '1',
        name: 'MultiplexedAudioChannelsDescriptionCodeSequence'
    },
    '(003A,0301)': {
        tag: '(003A,0301)',
        vr: 'IS',
        vm: '1',
        name: 'ChannelIdentificationCode'
    },
    '(003A,0302)': {
        tag: '(003A,0302)',
        vr: 'CS',
        vm: '1',
        name: 'ChannelMode'
    },
    '(0040,0001)': {
        tag: '(0040,0001)',
        vr: 'AE',
        vm: '1-n',
        name: 'ScheduledStationAETitle'
    },
    '(0040,0002)': {
        tag: '(0040,0002)',
        vr: 'DA',
        vm: '1',
        name: 'ScheduledProcedureStepStartDate'
    },
    '(0040,0003)': {
        tag: '(0040,0003)',
        vr: 'TM',
        vm: '1',
        name: 'ScheduledProcedureStepStartTime'
    },
    '(0040,0004)': {
        tag: '(0040,0004)',
        vr: 'DA',
        vm: '1',
        name: 'ScheduledProcedureStepEndDate'
    },
    '(0040,0005)': {
        tag: '(0040,0005)',
        vr: 'TM',
        vm: '1',
        name: 'ScheduledProcedureStepEndTime'
    },
    '(0040,0006)': {
        tag: '(0040,0006)',
        vr: 'PN',
        vm: '1',
        name: 'ScheduledPerformingPhysicianName'
    },
    '(0040,0007)': {
        tag: '(0040,0007)',
        vr: 'LO',
        vm: '1',
        name: 'ScheduledProcedureStepDescription'
    },
    '(0040,0008)': {
        tag: '(0040,0008)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledProtocolCodeSequence'
    },
    '(0040,0009)': {
        tag: '(0040,0009)',
        vr: 'SH',
        vm: '1',
        name: 'ScheduledProcedureStepID'
    },
    '(0040,000A)': {
        tag: '(0040,000A)',
        vr: 'SQ',
        vm: '1',
        name: 'StageCodeSequence'
    },
    '(0040,000B)': {
        tag: '(0040,000B)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledPerformingPhysicianIdentificationSequence'
    },
    '(0040,0010)': {
        tag: '(0040,0010)',
        vr: 'SH',
        vm: '1-n',
        name: 'ScheduledStationName'
    },
    '(0040,0011)': {
        tag: '(0040,0011)',
        vr: 'SH',
        vm: '1',
        name: 'ScheduledProcedureStepLocation'
    },
    '(0040,0012)': {
        tag: '(0040,0012)',
        vr: 'LO',
        vm: '1',
        name: 'PreMedication'
    },
    '(0040,0020)': {
        tag: '(0040,0020)',
        vr: 'CS',
        vm: '1',
        name: 'ScheduledProcedureStepStatus'
    },
    '(0040,0026)': {
        tag: '(0040,0026)',
        vr: 'SQ',
        vm: '1',
        name: 'OrderPlacerIdentifierSequence'
    },
    '(0040,0027)': {
        tag: '(0040,0027)',
        vr: 'SQ',
        vm: '1',
        name: 'OrderFillerIdentifierSequence'
    },
    '(0040,0031)': {
        tag: '(0040,0031)',
        vr: 'UT',
        vm: '1',
        name: 'LocalNamespaceEntityID'
    },
    '(0040,0032)': {
        tag: '(0040,0032)',
        vr: 'UT',
        vm: '1',
        name: 'UniversalEntityID'
    },
    '(0040,0033)': {
        tag: '(0040,0033)',
        vr: 'CS',
        vm: '1',
        name: 'UniversalEntityIDType'
    },
    '(0040,0035)': {
        tag: '(0040,0035)',
        vr: 'CS',
        vm: '1',
        name: 'IdentifierTypeCode'
    },
    '(0040,0036)': {
        tag: '(0040,0036)',
        vr: 'SQ',
        vm: '1',
        name: 'AssigningFacilitySequence'
    },
    '(0040,0039)': {
        tag: '(0040,0039)',
        vr: 'SQ',
        vm: '1',
        name: 'AssigningJurisdictionCodeSequence'
    },
    '(0040,003A)': {
        tag: '(0040,003A)',
        vr: 'SQ',
        vm: '1',
        name: 'AssigningAgencyOrDepartmentCodeSequence'
    },
    '(0040,0100)': {
        tag: '(0040,0100)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledProcedureStepSequence'
    },
    '(0040,0220)': {
        tag: '(0040,0220)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedNonImageCompositeSOPInstanceSequence'
    },
    '(0040,0241)': {
        tag: '(0040,0241)',
        vr: 'AE',
        vm: '1',
        name: 'PerformedStationAETitle'
    },
    '(0040,0242)': {
        tag: '(0040,0242)',
        vr: 'SH',
        vm: '1',
        name: 'PerformedStationName'
    },
    '(0040,0243)': {
        tag: '(0040,0243)',
        vr: 'SH',
        vm: '1',
        name: 'PerformedLocation'
    },
    '(0040,0244)': {
        tag: '(0040,0244)',
        vr: 'DA',
        vm: '1',
        name: 'PerformedProcedureStepStartDate'
    },
    '(0040,0245)': {
        tag: '(0040,0245)',
        vr: 'TM',
        vm: '1',
        name: 'PerformedProcedureStepStartTime'
    },
    '(0040,0250)': {
        tag: '(0040,0250)',
        vr: 'DA',
        vm: '1',
        name: 'PerformedProcedureStepEndDate'
    },
    '(0040,0251)': {
        tag: '(0040,0251)',
        vr: 'TM',
        vm: '1',
        name: 'PerformedProcedureStepEndTime'
    },
    '(0040,0252)': {
        tag: '(0040,0252)',
        vr: 'CS',
        vm: '1',
        name: 'PerformedProcedureStepStatus'
    },
    '(0040,0253)': {
        tag: '(0040,0253)',
        vr: 'SH',
        vm: '1',
        name: 'PerformedProcedureStepID'
    },
    '(0040,0254)': {
        tag: '(0040,0254)',
        vr: 'LO',
        vm: '1',
        name: 'PerformedProcedureStepDescription'
    },
    '(0040,0255)': {
        tag: '(0040,0255)',
        vr: 'LO',
        vm: '1',
        name: 'PerformedProcedureTypeDescription'
    },
    '(0040,0260)': {
        tag: '(0040,0260)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedProtocolCodeSequence'
    },
    '(0040,0261)': {
        tag: '(0040,0261)',
        vr: 'CS',
        vm: '1',
        name: 'PerformedProtocolType'
    },
    '(0040,0270)': {
        tag: '(0040,0270)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledStepAttributesSequence'
    },
    '(0040,0275)': {
        tag: '(0040,0275)',
        vr: 'SQ',
        vm: '1',
        name: 'RequestAttributesSequence'
    },
    '(0040,0280)': {
        tag: '(0040,0280)',
        vr: 'ST',
        vm: '1',
        name: 'CommentsOnThePerformedProcedureStep'
    },
    '(0040,0281)': {
        tag: '(0040,0281)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedProcedureStepDiscontinuationReasonCodeSequence'
    },
    '(0040,0293)': {
        tag: '(0040,0293)',
        vr: 'SQ',
        vm: '1',
        name: 'QuantitySequence'
    },
    '(0040,0294)': {
        tag: '(0040,0294)',
        vr: 'DS',
        vm: '1',
        name: 'Quantity'
    },
    '(0040,0295)': {
        tag: '(0040,0295)',
        vr: 'SQ',
        vm: '1',
        name: 'MeasuringUnitsSequence'
    },
    '(0040,0296)': {
        tag: '(0040,0296)',
        vr: 'SQ',
        vm: '1',
        name: 'BillingItemSequence'
    },
    '(0040,0300)': {
        tag: '(0040,0300)',
        vr: 'US',
        vm: '1',
        name: 'TotalTimeOfFluoroscopy'
    },
    '(0040,0301)': {
        tag: '(0040,0301)',
        vr: 'US',
        vm: '1',
        name: 'TotalNumberOfExposures'
    },
    '(0040,0302)': {
        tag: '(0040,0302)',
        vr: 'US',
        vm: '1',
        name: 'EntranceDose'
    },
    '(0040,0303)': {
        tag: '(0040,0303)',
        vr: 'US',
        vm: '1-2',
        name: 'ExposedArea'
    },
    '(0040,0306)': {
        tag: '(0040,0306)',
        vr: 'DS',
        vm: '1',
        name: 'DistanceSourceToEntrance'
    },
    '(0040,0307)': {
        tag: '(0040,0307)',
        vr: 'DS',
        vm: '1',
        name: 'DistanceSourceToSupport'
    },
    '(0040,030E)': {
        tag: '(0040,030E)',
        vr: 'SQ',
        vm: '1',
        name: 'ExposureDoseSequence'
    },
    '(0040,0310)': {
        tag: '(0040,0310)',
        vr: 'ST',
        vm: '1',
        name: 'CommentsOnRadiationDose'
    },
    '(0040,0312)': {
        tag: '(0040,0312)',
        vr: 'DS',
        vm: '1',
        name: 'XRayOutput'
    },
    '(0040,0314)': {
        tag: '(0040,0314)',
        vr: 'DS',
        vm: '1',
        name: 'HalfValueLayer'
    },
    '(0040,0316)': {
        tag: '(0040,0316)',
        vr: 'DS',
        vm: '1',
        name: 'OrganDose'
    },
    '(0040,0318)': {
        tag: '(0040,0318)',
        vr: 'CS',
        vm: '1',
        name: 'OrganExposed'
    },
    '(0040,0320)': {
        tag: '(0040,0320)',
        vr: 'SQ',
        vm: '1',
        name: 'BillingProcedureStepSequence'
    },
    '(0040,0321)': {
        tag: '(0040,0321)',
        vr: 'SQ',
        vm: '1',
        name: 'FilmConsumptionSequence'
    },
    '(0040,0324)': {
        tag: '(0040,0324)',
        vr: 'SQ',
        vm: '1',
        name: 'BillingSuppliesAndDevicesSequence'
    },
    '(0040,0330)': {
        tag: '(0040,0330)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedProcedureStepSequence'
    },
    '(0040,0340)': {
        tag: '(0040,0340)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedSeriesSequence'
    },
    '(0040,0400)': {
        tag: '(0040,0400)',
        vr: 'LT',
        vm: '1',
        name: 'CommentsOnTheScheduledProcedureStep'
    },
    '(0040,0440)': {
        tag: '(0040,0440)',
        vr: 'SQ',
        vm: '1',
        name: 'ProtocolContextSequence'
    },
    '(0040,0441)': {
        tag: '(0040,0441)',
        vr: 'SQ',
        vm: '1',
        name: 'ContentItemModifierSequence'
    },
    '(0040,0500)': {
        tag: '(0040,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledSpecimenSequence'
    },
    '(0040,050A)': {
        tag: '(0040,050A)',
        vr: 'LO',
        vm: '1',
        name: 'SpecimenAccessionNumber'
    },
    '(0040,0512)': {
        tag: '(0040,0512)',
        vr: 'LO',
        vm: '1',
        name: 'ContainerIdentifier'
    },
    '(0040,0513)': {
        tag: '(0040,0513)',
        vr: 'SQ',
        vm: '1',
        name: 'IssuerOfTheContainerIdentifierSequence'
    },
    '(0040,0515)': {
        tag: '(0040,0515)',
        vr: 'SQ',
        vm: '1',
        name: 'AlternateContainerIdentifierSequence'
    },
    '(0040,0518)': {
        tag: '(0040,0518)',
        vr: 'SQ',
        vm: '1',
        name: 'ContainerTypeCodeSequence'
    },
    '(0040,051A)': {
        tag: '(0040,051A)',
        vr: 'LO',
        vm: '1',
        name: 'ContainerDescription'
    },
    '(0040,0520)': {
        tag: '(0040,0520)',
        vr: 'SQ',
        vm: '1',
        name: 'ContainerComponentSequence'
    },
    '(0040,0550)': {
        tag: '(0040,0550)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenSequence'
    },
    '(0040,0551)': {
        tag: '(0040,0551)',
        vr: 'LO',
        vm: '1',
        name: 'SpecimenIdentifier'
    },
    '(0040,0552)': {
        tag: '(0040,0552)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenDescriptionSequenceTrial'
    },
    '(0040,0553)': {
        tag: '(0040,0553)',
        vr: 'ST',
        vm: '1',
        name: 'SpecimenDescriptionTrial'
    },
    '(0040,0554)': {
        tag: '(0040,0554)',
        vr: 'UI',
        vm: '1',
        name: 'SpecimenUID'
    },
    '(0040,0555)': {
        tag: '(0040,0555)',
        vr: 'SQ',
        vm: '1',
        name: 'AcquisitionContextSequence'
    },
    '(0040,0556)': {
        tag: '(0040,0556)',
        vr: 'ST',
        vm: '1',
        name: 'AcquisitionContextDescription'
    },
    '(0040,0560)': {
        tag: '(0040,0560)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenDescriptionSequence'
    },
    '(0040,0562)': {
        tag: '(0040,0562)',
        vr: 'SQ',
        vm: '1',
        name: 'IssuerOfTheSpecimenIdentifierSequence'
    },
    '(0040,059A)': {
        tag: '(0040,059A)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenTypeCodeSequence'
    },
    '(0040,0600)': {
        tag: '(0040,0600)',
        vr: 'LO',
        vm: '1',
        name: 'SpecimenShortDescription'
    },
    '(0040,0602)': {
        tag: '(0040,0602)',
        vr: 'UT',
        vm: '1',
        name: 'SpecimenDetailedDescription'
    },
    '(0040,0610)': {
        tag: '(0040,0610)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenPreparationSequence'
    },
    '(0040,0612)': {
        tag: '(0040,0612)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenPreparationStepContentItemSequence'
    },
    '(0040,0620)': {
        tag: '(0040,0620)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenLocalizationContentItemSequence'
    },
    '(0040,06FA)': {
        tag: '(0040,06FA)',
        vr: 'LO',
        vm: '1',
        name: 'SlideIdentifier'
    },
    '(0040,071A)': {
        tag: '(0040,071A)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageCenterPointCoordinatesSequence'
    },
    '(0040,072A)': {
        tag: '(0040,072A)',
        vr: 'DS',
        vm: '1',
        name: 'XOffsetInSlideCoordinateSystem'
    },
    '(0040,073A)': {
        tag: '(0040,073A)',
        vr: 'DS',
        vm: '1',
        name: 'YOffsetInSlideCoordinateSystem'
    },
    '(0040,074A)': {
        tag: '(0040,074A)',
        vr: 'DS',
        vm: '1',
        name: 'ZOffsetInSlideCoordinateSystem'
    },
    '(0040,08D8)': {
        tag: '(0040,08D8)',
        vr: 'SQ',
        vm: '1',
        name: 'PixelSpacingSequence'
    },
    '(0040,08DA)': {
        tag: '(0040,08DA)',
        vr: 'SQ',
        vm: '1',
        name: 'CoordinateSystemAxisCodeSequence'
    },
    '(0040,08EA)': {
        tag: '(0040,08EA)',
        vr: 'SQ',
        vm: '1',
        name: 'MeasurementUnitsCodeSequence'
    },
    '(0040,09F8)': {
        tag: '(0040,09F8)',
        vr: 'SQ',
        vm: '1',
        name: 'VitalStainCodeSequenceTrial'
    },
    '(0040,1001)': {
        tag: '(0040,1001)',
        vr: 'SH',
        vm: '1',
        name: 'RequestedProcedureID'
    },
    '(0040,1002)': {
        tag: '(0040,1002)',
        vr: 'LO',
        vm: '1',
        name: 'ReasonForTheRequestedProcedure'
    },
    '(0040,1003)': {
        tag: '(0040,1003)',
        vr: 'SH',
        vm: '1',
        name: 'RequestedProcedurePriority'
    },
    '(0040,1004)': {
        tag: '(0040,1004)',
        vr: 'LO',
        vm: '1',
        name: 'PatientTransportArrangements'
    },
    '(0040,1005)': {
        tag: '(0040,1005)',
        vr: 'LO',
        vm: '1',
        name: 'RequestedProcedureLocation'
    },
    '(0040,1006)': {
        tag: '(0040,1006)',
        vr: 'SH',
        vm: '1',
        name: 'PlacerOrderNumberProcedure'
    },
    '(0040,1007)': {
        tag: '(0040,1007)',
        vr: 'SH',
        vm: '1',
        name: 'FillerOrderNumberProcedure'
    },
    '(0040,1008)': {
        tag: '(0040,1008)',
        vr: 'LO',
        vm: '1',
        name: 'ConfidentialityCode'
    },
    '(0040,1009)': {
        tag: '(0040,1009)',
        vr: 'SH',
        vm: '1',
        name: 'ReportingPriority'
    },
    '(0040,100A)': {
        tag: '(0040,100A)',
        vr: 'SQ',
        vm: '1',
        name: 'ReasonForRequestedProcedureCodeSequence'
    },
    '(0040,1010)': {
        tag: '(0040,1010)',
        vr: 'PN',
        vm: '1-n',
        name: 'NamesOfIntendedRecipientsOfResults'
    },
    '(0040,1011)': {
        tag: '(0040,1011)',
        vr: 'SQ',
        vm: '1',
        name: 'IntendedRecipientsOfResultsIdentificationSequence'
    },
    '(0040,1012)': {
        tag: '(0040,1012)',
        vr: 'SQ',
        vm: '1',
        name: 'ReasonForPerformedProcedureCodeSequence'
    },
    '(0040,1060)': {
        tag: '(0040,1060)',
        vr: 'LO',
        vm: '1',
        name: 'RequestedProcedureDescriptionTrial'
    },
    '(0040,1101)': {
        tag: '(0040,1101)',
        vr: 'SQ',
        vm: '1',
        name: 'PersonIdentificationCodeSequence'
    },
    '(0040,1102)': {
        tag: '(0040,1102)',
        vr: 'ST',
        vm: '1',
        name: 'PersonAddress'
    },
    '(0040,1103)': {
        tag: '(0040,1103)',
        vr: 'LO',
        vm: '1-n',
        name: 'PersonTelephoneNumbers'
    },
    '(0040,1400)': {
        tag: '(0040,1400)',
        vr: 'LT',
        vm: '1',
        name: 'RequestedProcedureComments'
    },
    '(0040,2001)': {
        tag: '(0040,2001)',
        vr: 'LO',
        vm: '1',
        name: 'ReasonForTheImagingServiceRequest'
    },
    '(0040,2004)': {
        tag: '(0040,2004)',
        vr: 'DA',
        vm: '1',
        name: 'IssueDateOfImagingServiceRequest'
    },
    '(0040,2005)': {
        tag: '(0040,2005)',
        vr: 'TM',
        vm: '1',
        name: 'IssueTimeOfImagingServiceRequest'
    },
    '(0040,2006)': {
        tag: '(0040,2006)',
        vr: 'SH',
        vm: '1',
        name: 'PlacerOrderNumberImagingServiceRequestRetired'
    },
    '(0040,2007)': {
        tag: '(0040,2007)',
        vr: 'SH',
        vm: '1',
        name: 'FillerOrderNumberImagingServiceRequestRetired'
    },
    '(0040,2008)': {
        tag: '(0040,2008)',
        vr: 'PN',
        vm: '1',
        name: 'OrderEnteredBy'
    },
    '(0040,2009)': {
        tag: '(0040,2009)',
        vr: 'SH',
        vm: '1',
        name: 'OrderEntererLocation'
    },
    '(0040,2010)': {
        tag: '(0040,2010)',
        vr: 'SH',
        vm: '1',
        name: 'OrderCallbackPhoneNumber'
    },
    '(0040,2016)': {
        tag: '(0040,2016)',
        vr: 'LO',
        vm: '1',
        name: 'PlacerOrderNumberImagingServiceRequest'
    },
    '(0040,2017)': {
        tag: '(0040,2017)',
        vr: 'LO',
        vm: '1',
        name: 'FillerOrderNumberImagingServiceRequest'
    },
    '(0040,2400)': {
        tag: '(0040,2400)',
        vr: 'LT',
        vm: '1',
        name: 'ImagingServiceRequestComments'
    },
    '(0040,3001)': {
        tag: '(0040,3001)',
        vr: 'LO',
        vm: '1',
        name: 'ConfidentialityConstraintOnPatientDataDescription'
    },
    '(0040,4001)': {
        tag: '(0040,4001)',
        vr: 'CS',
        vm: '1',
        name: 'GeneralPurposeScheduledProcedureStepStatus'
    },
    '(0040,4002)': {
        tag: '(0040,4002)',
        vr: 'CS',
        vm: '1',
        name: 'GeneralPurposePerformedProcedureStepStatus'
    },
    '(0040,4003)': {
        tag: '(0040,4003)',
        vr: 'CS',
        vm: '1',
        name: 'GeneralPurposeScheduledProcedureStepPriority'
    },
    '(0040,4004)': {
        tag: '(0040,4004)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledProcessingApplicationsCodeSequence'
    },
    '(0040,4005)': {
        tag: '(0040,4005)',
        vr: 'DT',
        vm: '1',
        name: 'ScheduledProcedureStepStartDateTime'
    },
    '(0040,4006)': {
        tag: '(0040,4006)',
        vr: 'CS',
        vm: '1',
        name: 'MultipleCopiesFlag'
    },
    '(0040,4007)': {
        tag: '(0040,4007)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedProcessingApplicationsCodeSequence'
    },
    '(0040,4009)': {
        tag: '(0040,4009)',
        vr: 'SQ',
        vm: '1',
        name: 'HumanPerformerCodeSequence'
    },
    '(0040,4010)': {
        tag: '(0040,4010)',
        vr: 'DT',
        vm: '1',
        name: 'ScheduledProcedureStepModificationDateTime'
    },
    '(0040,4011)': {
        tag: '(0040,4011)',
        vr: 'DT',
        vm: '1',
        name: 'ExpectedCompletionDateTime'
    },
    '(0040,4015)': {
        tag: '(0040,4015)',
        vr: 'SQ',
        vm: '1',
        name: 'ResultingGeneralPurposePerformedProcedureStepsSequence'
    },
    '(0040,4016)': {
        tag: '(0040,4016)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedGeneralPurposeScheduledProcedureStepSequence'
    },
    '(0040,4018)': {
        tag: '(0040,4018)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledWorkitemCodeSequence'
    },
    '(0040,4019)': {
        tag: '(0040,4019)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedWorkitemCodeSequence'
    },
    '(0040,4020)': {
        tag: '(0040,4020)',
        vr: 'CS',
        vm: '1',
        name: 'InputAvailabilityFlag'
    },
    '(0040,4021)': {
        tag: '(0040,4021)',
        vr: 'SQ',
        vm: '1',
        name: 'InputInformationSequence'
    },
    '(0040,4022)': {
        tag: '(0040,4022)',
        vr: 'SQ',
        vm: '1',
        name: 'RelevantInformationSequence'
    },
    '(0040,4023)': {
        tag: '(0040,4023)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedGeneralPurposeScheduledProcedureStepTransactionUID'
    },
    '(0040,4025)': {
        tag: '(0040,4025)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledStationNameCodeSequence'
    },
    '(0040,4026)': {
        tag: '(0040,4026)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledStationClassCodeSequence'
    },
    '(0040,4027)': {
        tag: '(0040,4027)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledStationGeographicLocationCodeSequence'
    },
    '(0040,4028)': {
        tag: '(0040,4028)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedStationNameCodeSequence'
    },
    '(0040,4029)': {
        tag: '(0040,4029)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedStationClassCodeSequence'
    },
    '(0040,4030)': {
        tag: '(0040,4030)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedStationGeographicLocationCodeSequence'
    },
    '(0040,4031)': {
        tag: '(0040,4031)',
        vr: 'SQ',
        vm: '1',
        name: 'RequestedSubsequentWorkitemCodeSequence'
    },
    '(0040,4032)': {
        tag: '(0040,4032)',
        vr: 'SQ',
        vm: '1',
        name: 'NonDICOMOutputCodeSequence'
    },
    '(0040,4033)': {
        tag: '(0040,4033)',
        vr: 'SQ',
        vm: '1',
        name: 'OutputInformationSequence'
    },
    '(0040,4034)': {
        tag: '(0040,4034)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledHumanPerformersSequence'
    },
    '(0040,4035)': {
        tag: '(0040,4035)',
        vr: 'SQ',
        vm: '1',
        name: 'ActualHumanPerformersSequence'
    },
    '(0040,4036)': {
        tag: '(0040,4036)',
        vr: 'LO',
        vm: '1',
        name: 'HumanPerformerOrganization'
    },
    '(0040,4037)': {
        tag: '(0040,4037)',
        vr: 'PN',
        vm: '1',
        name: 'HumanPerformerName'
    },
    '(0040,4040)': {
        tag: '(0040,4040)',
        vr: 'CS',
        vm: '1',
        name: 'RawDataHandling'
    },
    '(0040,4041)': {
        tag: '(0040,4041)',
        vr: 'CS',
        vm: '1',
        name: 'InputReadinessState'
    },
    '(0040,4050)': {
        tag: '(0040,4050)',
        vr: 'DT',
        vm: '1',
        name: 'PerformedProcedureStepStartDateTime'
    },
    '(0040,4051)': {
        tag: '(0040,4051)',
        vr: 'DT',
        vm: '1',
        name: 'PerformedProcedureStepEndDateTime'
    },
    '(0040,4052)': {
        tag: '(0040,4052)',
        vr: 'DT',
        vm: '1',
        name: 'ProcedureStepCancellationDateTime'
    },
    '(0040,8302)': {
        tag: '(0040,8302)',
        vr: 'DS',
        vm: '1',
        name: 'EntranceDoseInmGy'
    },
    '(0040,9094)': {
        tag: '(0040,9094)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageRealWorldValueMappingSequence'
    },
    '(0040,9096)': {
        tag: '(0040,9096)',
        vr: 'SQ',
        vm: '1',
        name: 'RealWorldValueMappingSequence'
    },
    '(0040,9098)': {
        tag: '(0040,9098)',
        vr: 'SQ',
        vm: '1',
        name: 'PixelValueMappingCodeSequence'
    },
    '(0040,9210)': {
        tag: '(0040,9210)',
        vr: 'SH',
        vm: '1',
        name: 'LUTLabel'
    },
    '(0040,9211)': {
        tag: '(0040,9211)',
        vr: 'US|SS',
        vm: '1',
        name: 'RealWorldValueLastValueMapped'
    },
    '(0040,9212)': {
        tag: '(0040,9212)',
        vr: 'FD',
        vm: '1-n',
        name: 'RealWorldValueLUTData'
    },
    '(0040,9216)': {
        tag: '(0040,9216)',
        vr: 'US|SS',
        vm: '1',
        name: 'RealWorldValueFirstValueMapped'
    },
    '(0040,9224)': {
        tag: '(0040,9224)',
        vr: 'FD',
        vm: '1',
        name: 'RealWorldValueIntercept'
    },
    '(0040,9225)': {
        tag: '(0040,9225)',
        vr: 'FD',
        vm: '1',
        name: 'RealWorldValueSlope'
    },
    '(0040,A007)': {
        tag: '(0040,A007)',
        vr: 'CS',
        vm: '1',
        name: 'FindingsFlagTrial'
    },
    '(0040,A010)': {
        tag: '(0040,A010)',
        vr: 'CS',
        vm: '1',
        name: 'RelationshipType'
    },
    '(0040,A020)': {
        tag: '(0040,A020)',
        vr: 'SQ',
        vm: '1',
        name: 'FindingsSequenceTrial'
    },
    '(0040,A021)': {
        tag: '(0040,A021)',
        vr: 'UI',
        vm: '1',
        name: 'FindingsGroupUIDTrial'
    },
    '(0040,A022)': {
        tag: '(0040,A022)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedFindingsGroupUIDTrial'
    },
    '(0040,A023)': {
        tag: '(0040,A023)',
        vr: 'DA',
        vm: '1',
        name: 'FindingsGroupRecordingDateTrial'
    },
    '(0040,A024)': {
        tag: '(0040,A024)',
        vr: 'TM',
        vm: '1',
        name: 'FindingsGroupRecordingTimeTrial'
    },
    '(0040,A026)': {
        tag: '(0040,A026)',
        vr: 'SQ',
        vm: '1',
        name: 'FindingsSourceCategoryCodeSequenceTrial'
    },
    '(0040,A027)': {
        tag: '(0040,A027)',
        vr: 'LO',
        vm: '1',
        name: 'VerifyingOrganization'
    },
    '(0040,A028)': {
        tag: '(0040,A028)',
        vr: 'SQ',
        vm: '1',
        name: 'DocumentingOrganizationIdentifierCodeSequenceTrial'
    },
    '(0040,A030)': {
        tag: '(0040,A030)',
        vr: 'DT',
        vm: '1',
        name: 'VerificationDateTime'
    },
    '(0040,A032)': {
        tag: '(0040,A032)',
        vr: 'DT',
        vm: '1',
        name: 'ObservationDateTime'
    },
    '(0040,A040)': {
        tag: '(0040,A040)',
        vr: 'CS',
        vm: '1',
        name: 'ValueType'
    },
    '(0040,A043)': {
        tag: '(0040,A043)',
        vr: 'SQ',
        vm: '1',
        name: 'ConceptNameCodeSequence'
    },
    '(0040,A047)': {
        tag: '(0040,A047)',
        vr: 'LO',
        vm: '1',
        name: 'MeasurementPrecisionDescriptionTrial'
    },
    '(0040,A050)': {
        tag: '(0040,A050)',
        vr: 'CS',
        vm: '1',
        name: 'ContinuityOfContent'
    },
    '(0040,A057)': {
        tag: '(0040,A057)',
        vr: 'CS',
        vm: '1-n',
        name: 'UrgencyOrPriorityAlertsTrial'
    },
    '(0040,A060)': {
        tag: '(0040,A060)',
        vr: 'LO',
        vm: '1',
        name: 'SequencingIndicatorTrial'
    },
    '(0040,A066)': {
        tag: '(0040,A066)',
        vr: 'SQ',
        vm: '1',
        name: 'DocumentIdentifierCodeSequenceTrial'
    },
    '(0040,A067)': {
        tag: '(0040,A067)',
        vr: 'PN',
        vm: '1',
        name: 'DocumentAuthorTrial'
    },
    '(0040,A068)': {
        tag: '(0040,A068)',
        vr: 'SQ',
        vm: '1',
        name: 'DocumentAuthorIdentifierCodeSequenceTrial'
    },
    '(0040,A070)': {
        tag: '(0040,A070)',
        vr: 'SQ',
        vm: '1',
        name: 'IdentifierCodeSequenceTrial'
    },
    '(0040,A073)': {
        tag: '(0040,A073)',
        vr: 'SQ',
        vm: '1',
        name: 'VerifyingObserverSequence'
    },
    '(0040,A074)': {
        tag: '(0040,A074)',
        vr: 'OB',
        vm: '1',
        name: 'ObjectBinaryIdentifierTrial'
    },
    '(0040,A075)': {
        tag: '(0040,A075)',
        vr: 'PN',
        vm: '1',
        name: 'VerifyingObserverName'
    },
    '(0040,A076)': {
        tag: '(0040,A076)',
        vr: 'SQ',
        vm: '1',
        name: 'DocumentingObserverIdentifierCodeSequenceTrial'
    },
    '(0040,A078)': {
        tag: '(0040,A078)',
        vr: 'SQ',
        vm: '1',
        name: 'AuthorObserverSequence'
    },
    '(0040,A07A)': {
        tag: '(0040,A07A)',
        vr: 'SQ',
        vm: '1',
        name: 'ParticipantSequence'
    },
    '(0040,A07C)': {
        tag: '(0040,A07C)',
        vr: 'SQ',
        vm: '1',
        name: 'CustodialOrganizationSequence'
    },
    '(0040,A080)': {
        tag: '(0040,A080)',
        vr: 'CS',
        vm: '1',
        name: 'ParticipationType'
    },
    '(0040,A082)': {
        tag: '(0040,A082)',
        vr: 'DT',
        vm: '1',
        name: 'ParticipationDateTime'
    },
    '(0040,A084)': {
        tag: '(0040,A084)',
        vr: 'CS',
        vm: '1',
        name: 'ObserverType'
    },
    '(0040,A085)': {
        tag: '(0040,A085)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureIdentifierCodeSequenceTrial'
    },
    '(0040,A088)': {
        tag: '(0040,A088)',
        vr: 'SQ',
        vm: '1',
        name: 'VerifyingObserverIdentificationCodeSequence'
    },
    '(0040,A089)': {
        tag: '(0040,A089)',
        vr: 'OB',
        vm: '1',
        name: 'ObjectDirectoryBinaryIdentifierTrial'
    },
    '(0040,A090)': {
        tag: '(0040,A090)',
        vr: 'SQ',
        vm: '1',
        name: 'EquivalentCDADocumentSequence'
    },
    '(0040,A0B0)': {
        tag: '(0040,A0B0)',
        vr: 'US',
        vm: '2-2n',
        name: 'ReferencedWaveformChannels'
    },
    '(0040,A110)': {
        tag: '(0040,A110)',
        vr: 'DA',
        vm: '1',
        name: 'DateOfDocumentOrVerbalTransactionTrial'
    },
    '(0040,A112)': {
        tag: '(0040,A112)',
        vr: 'TM',
        vm: '1',
        name: 'TimeOfDocumentCreationOrVerbalTransactionTrial'
    },
    '(0040,A120)': {
        tag: '(0040,A120)',
        vr: 'DT',
        vm: '1',
        name: 'DateTime'
    },
    '(0040,A121)': {
        tag: '(0040,A121)',
        vr: 'DA',
        vm: '1',
        name: 'Date'
    },
    '(0040,A122)': {
        tag: '(0040,A122)',
        vr: 'TM',
        vm: '1',
        name: 'Time'
    },
    '(0040,A123)': {
        tag: '(0040,A123)',
        vr: 'PN',
        vm: '1',
        name: 'PersonName'
    },
    '(0040,A124)': {
        tag: '(0040,A124)',
        vr: 'UI',
        vm: '1',
        name: 'UID'
    },
    '(0040,A125)': {
        tag: '(0040,A125)',
        vr: 'CS',
        vm: '2',
        name: 'ReportStatusIDTrial'
    },
    '(0040,A130)': {
        tag: '(0040,A130)',
        vr: 'CS',
        vm: '1',
        name: 'TemporalRangeType'
    },
    '(0040,A132)': {
        tag: '(0040,A132)',
        vr: 'UL',
        vm: '1-n',
        name: 'ReferencedSamplePositions'
    },
    '(0040,A136)': {
        tag: '(0040,A136)',
        vr: 'US',
        vm: '1-n',
        name: 'ReferencedFrameNumbers'
    },
    '(0040,A138)': {
        tag: '(0040,A138)',
        vr: 'DS',
        vm: '1-n',
        name: 'ReferencedTimeOffsets'
    },
    '(0040,A13A)': {
        tag: '(0040,A13A)',
        vr: 'DT',
        vm: '1-n',
        name: 'ReferencedDateTime'
    },
    '(0040,A160)': {
        tag: '(0040,A160)',
        vr: 'UT',
        vm: '1',
        name: 'TextValue'
    },
    '(0040,A167)': {
        tag: '(0040,A167)',
        vr: 'SQ',
        vm: '1',
        name: 'ObservationCategoryCodeSequenceTrial'
    },
    '(0040,A168)': {
        tag: '(0040,A168)',
        vr: 'SQ',
        vm: '1',
        name: 'ConceptCodeSequence'
    },
    '(0040,A16A)': {
        tag: '(0040,A16A)',
        vr: 'ST',
        vm: '1',
        name: 'BibliographicCitationTrial'
    },
    '(0040,A170)': {
        tag: '(0040,A170)',
        vr: 'SQ',
        vm: '1',
        name: 'PurposeOfReferenceCodeSequence'
    },
    '(0040,A171)': {
        tag: '(0040,A171)',
        vr: 'UI',
        vm: '1',
        name: 'ObservationUIDTrial'
    },
    '(0040,A172)': {
        tag: '(0040,A172)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedObservationUIDTrial'
    },
    '(0040,A173)': {
        tag: '(0040,A173)',
        vr: 'CS',
        vm: '1',
        name: 'ReferencedObservationClassTrial'
    },
    '(0040,A174)': {
        tag: '(0040,A174)',
        vr: 'CS',
        vm: '1',
        name: 'ReferencedObjectObservationClassTrial'
    },
    '(0040,A180)': {
        tag: '(0040,A180)',
        vr: 'US',
        vm: '1',
        name: 'AnnotationGroupNumber'
    },
    '(0040,A192)': {
        tag: '(0040,A192)',
        vr: 'DA',
        vm: '1',
        name: 'ObservationDateTrial'
    },
    '(0040,A193)': {
        tag: '(0040,A193)',
        vr: 'TM',
        vm: '1',
        name: 'ObservationTimeTrial'
    },
    '(0040,A194)': {
        tag: '(0040,A194)',
        vr: 'CS',
        vm: '1',
        name: 'MeasurementAutomationTrial'
    },
    '(0040,A195)': {
        tag: '(0040,A195)',
        vr: 'SQ',
        vm: '1',
        name: 'ModifierCodeSequence'
    },
    '(0040,A224)': {
        tag: '(0040,A224)',
        vr: 'ST',
        vm: '1',
        name: 'IdentificationDescriptionTrial'
    },
    '(0040,A290)': {
        tag: '(0040,A290)',
        vr: 'CS',
        vm: '1',
        name: 'CoordinatesSetGeometricTypeTrial'
    },
    '(0040,A296)': {
        tag: '(0040,A296)',
        vr: 'SQ',
        vm: '1',
        name: 'AlgorithmCodeSequenceTrial'
    },
    '(0040,A297)': {
        tag: '(0040,A297)',
        vr: 'ST',
        vm: '1',
        name: 'AlgorithmDescriptionTrial'
    },
    '(0040,A29A)': {
        tag: '(0040,A29A)',
        vr: 'SL',
        vm: '2-2n',
        name: 'PixelCoordinatesSetTrial'
    },
    '(0040,A300)': {
        tag: '(0040,A300)',
        vr: 'SQ',
        vm: '1',
        name: 'MeasuredValueSequence'
    },
    '(0040,A301)': {
        tag: '(0040,A301)',
        vr: 'SQ',
        vm: '1',
        name: 'NumericValueQualifierCodeSequence'
    },
    '(0040,A307)': {
        tag: '(0040,A307)',
        vr: 'PN',
        vm: '1',
        name: 'CurrentObserverTrial'
    },
    '(0040,A30A)': {
        tag: '(0040,A30A)',
        vr: 'DS',
        vm: '1-n',
        name: 'NumericValue'
    },
    '(0040,A313)': {
        tag: '(0040,A313)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedAccessionSequenceTrial'
    },
    '(0040,A33A)': {
        tag: '(0040,A33A)',
        vr: 'ST',
        vm: '1',
        name: 'ReportStatusCommentTrial'
    },
    '(0040,A340)': {
        tag: '(0040,A340)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureContextSequenceTrial'
    },
    '(0040,A352)': {
        tag: '(0040,A352)',
        vr: 'PN',
        vm: '1',
        name: 'VerbalSourceTrial'
    },
    '(0040,A353)': {
        tag: '(0040,A353)',
        vr: 'ST',
        vm: '1',
        name: 'AddressTrial'
    },
    '(0040,A354)': {
        tag: '(0040,A354)',
        vr: 'LO',
        vm: '1',
        name: 'TelephoneNumberTrial'
    },
    '(0040,A358)': {
        tag: '(0040,A358)',
        vr: 'SQ',
        vm: '1',
        name: 'VerbalSourceIdentifierCodeSequenceTrial'
    },
    '(0040,A360)': {
        tag: '(0040,A360)',
        vr: 'SQ',
        vm: '1',
        name: 'PredecessorDocumentsSequence'
    },
    '(0040,A370)': {
        tag: '(0040,A370)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedRequestSequence'
    },
    '(0040,A372)': {
        tag: '(0040,A372)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedProcedureCodeSequence'
    },
    '(0040,A375)': {
        tag: '(0040,A375)',
        vr: 'SQ',
        vm: '1',
        name: 'CurrentRequestedProcedureEvidenceSequence'
    },
    '(0040,A380)': {
        tag: '(0040,A380)',
        vr: 'SQ',
        vm: '1',
        name: 'ReportDetailSequenceTrial'
    },
    '(0040,A385)': {
        tag: '(0040,A385)',
        vr: 'SQ',
        vm: '1',
        name: 'PertinentOtherEvidenceSequence'
    },
    '(0040,A390)': {
        tag: '(0040,A390)',
        vr: 'SQ',
        vm: '1',
        name: 'HL7StructuredDocumentReferenceSequence'
    },
    '(0040,A402)': {
        tag: '(0040,A402)',
        vr: 'UI',
        vm: '1',
        name: 'ObservationSubjectUIDTrial'
    },
    '(0040,A403)': {
        tag: '(0040,A403)',
        vr: 'CS',
        vm: '1',
        name: 'ObservationSubjectClassTrial'
    },
    '(0040,A404)': {
        tag: '(0040,A404)',
        vr: 'SQ',
        vm: '1',
        name: 'ObservationSubjectTypeCodeSequenceTrial'
    },
    '(0040,A491)': {
        tag: '(0040,A491)',
        vr: 'CS',
        vm: '1',
        name: 'CompletionFlag'
    },
    '(0040,A492)': {
        tag: '(0040,A492)',
        vr: 'LO',
        vm: '1',
        name: 'CompletionFlagDescription'
    },
    '(0040,A493)': {
        tag: '(0040,A493)',
        vr: 'CS',
        vm: '1',
        name: 'VerificationFlag'
    },
    '(0040,A494)': {
        tag: '(0040,A494)',
        vr: 'CS',
        vm: '1',
        name: 'ArchiveRequested'
    },
    '(0040,A496)': {
        tag: '(0040,A496)',
        vr: 'CS',
        vm: '1',
        name: 'PreliminaryFlag'
    },
    '(0040,A504)': {
        tag: '(0040,A504)',
        vr: 'SQ',
        vm: '1',
        name: 'ContentTemplateSequence'
    },
    '(0040,A525)': {
        tag: '(0040,A525)',
        vr: 'SQ',
        vm: '1',
        name: 'IdenticalDocumentsSequence'
    },
    '(0040,A600)': {
        tag: '(0040,A600)',
        vr: 'CS',
        vm: '1',
        name: 'ObservationSubjectContextFlagTrial'
    },
    '(0040,A601)': {
        tag: '(0040,A601)',
        vr: 'CS',
        vm: '1',
        name: 'ObserverContextFlagTrial'
    },
    '(0040,A603)': {
        tag: '(0040,A603)',
        vr: 'CS',
        vm: '1',
        name: 'ProcedureContextFlagTrial'
    },
    '(0040,A730)': {
        tag: '(0040,A730)',
        vr: 'SQ',
        vm: '1',
        name: 'ContentSequence'
    },
    '(0040,A731)': {
        tag: '(0040,A731)',
        vr: 'SQ',
        vm: '1',
        name: 'RelationshipSequenceTrial'
    },
    '(0040,A732)': {
        tag: '(0040,A732)',
        vr: 'SQ',
        vm: '1',
        name: 'RelationshipTypeCodeSequenceTrial'
    },
    '(0040,A744)': {
        tag: '(0040,A744)',
        vr: 'SQ',
        vm: '1',
        name: 'LanguageCodeSequenceTrial'
    },
    '(0040,A992)': {
        tag: '(0040,A992)',
        vr: 'ST',
        vm: '1',
        name: 'UniformResourceLocatorTrial'
    },
    '(0040,B020)': {
        tag: '(0040,B020)',
        vr: 'SQ',
        vm: '1',
        name: 'WaveformAnnotationSequence'
    },
    '(0040,DB00)': {
        tag: '(0040,DB00)',
        vr: 'CS',
        vm: '1',
        name: 'TemplateIdentifier'
    },
    '(0040,DB06)': {
        tag: '(0040,DB06)',
        vr: 'DT',
        vm: '1',
        name: 'TemplateVersion'
    },
    '(0040,DB07)': {
        tag: '(0040,DB07)',
        vr: 'DT',
        vm: '1',
        name: 'TemplateLocalVersion'
    },
    '(0040,DB0B)': {
        tag: '(0040,DB0B)',
        vr: 'CS',
        vm: '1',
        name: 'TemplateExtensionFlag'
    },
    '(0040,DB0C)': {
        tag: '(0040,DB0C)',
        vr: 'UI',
        vm: '1',
        name: 'TemplateExtensionOrganizationUID'
    },
    '(0040,DB0D)': {
        tag: '(0040,DB0D)',
        vr: 'UI',
        vm: '1',
        name: 'TemplateExtensionCreatorUID'
    },
    '(0040,DB73)': {
        tag: '(0040,DB73)',
        vr: 'UL',
        vm: '1-n',
        name: 'ReferencedContentItemIdentifier'
    },
    '(0040,E001)': {
        tag: '(0040,E001)',
        vr: 'ST',
        vm: '1',
        name: 'HL7InstanceIdentifier'
    },
    '(0040,E004)': {
        tag: '(0040,E004)',
        vr: 'DT',
        vm: '1',
        name: 'HL7DocumentEffectiveTime'
    },
    '(0040,E006)': {
        tag: '(0040,E006)',
        vr: 'SQ',
        vm: '1',
        name: 'HL7DocumentTypeCodeSequence'
    },
    '(0040,E008)': {
        tag: '(0040,E008)',
        vr: 'SQ',
        vm: '1',
        name: 'DocumentClassCodeSequence'
    },
    '(0040,E010)': {
        tag: '(0040,E010)',
        vr: 'UT',
        vm: '1',
        name: 'RetrieveURI'
    },
    '(0040,E011)': {
        tag: '(0040,E011)',
        vr: 'UI',
        vm: '1',
        name: 'RetrieveLocationUID'
    },
    '(0040,E020)': {
        tag: '(0040,E020)',
        vr: 'CS',
        vm: '1',
        name: 'TypeOfInstances'
    },
    '(0040,E021)': {
        tag: '(0040,E021)',
        vr: 'SQ',
        vm: '1',
        name: 'DICOMRetrievalSequence'
    },
    '(0040,E022)': {
        tag: '(0040,E022)',
        vr: 'SQ',
        vm: '1',
        name: 'DICOMMediaRetrievalSequence'
    },
    '(0040,E023)': {
        tag: '(0040,E023)',
        vr: 'SQ',
        vm: '1',
        name: 'WADORetrievalSequence'
    },
    '(0040,E024)': {
        tag: '(0040,E024)',
        vr: 'SQ',
        vm: '1',
        name: 'XDSRetrievalSequence'
    },
    '(0040,E030)': {
        tag: '(0040,E030)',
        vr: 'UI',
        vm: '1',
        name: 'RepositoryUniqueID'
    },
    '(0040,E031)': {
        tag: '(0040,E031)',
        vr: 'UI',
        vm: '1',
        name: 'HomeCommunityID'
    },
    '(0042,0010)': {
        tag: '(0042,0010)',
        vr: 'ST',
        vm: '1',
        name: 'DocumentTitle'
    },
    '(0042,0011)': {
        tag: '(0042,0011)',
        vr: 'OB',
        vm: '1',
        name: 'EncapsulatedDocument'
    },
    '(0042,0012)': {
        tag: '(0042,0012)',
        vr: 'LO',
        vm: '1',
        name: 'MIMETypeOfEncapsulatedDocument'
    },
    '(0042,0013)': {
        tag: '(0042,0013)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceInstanceSequence'
    },
    '(0042,0014)': {
        tag: '(0042,0014)',
        vr: 'LO',
        vm: '1-n',
        name: 'ListOfMIMETypes'
    },
    '(0044,0001)': {
        tag: '(0044,0001)',
        vr: 'ST',
        vm: '1',
        name: 'ProductPackageIdentifier'
    },
    '(0044,0002)': {
        tag: '(0044,0002)',
        vr: 'CS',
        vm: '1',
        name: 'SubstanceAdministrationApproval'
    },
    '(0044,0003)': {
        tag: '(0044,0003)',
        vr: 'LT',
        vm: '1',
        name: 'ApprovalStatusFurtherDescription'
    },
    '(0044,0004)': {
        tag: '(0044,0004)',
        vr: 'DT',
        vm: '1',
        name: 'ApprovalStatusDateTime'
    },
    '(0044,0007)': {
        tag: '(0044,0007)',
        vr: 'SQ',
        vm: '1',
        name: 'ProductTypeCodeSequence'
    },
    '(0044,0008)': {
        tag: '(0044,0008)',
        vr: 'LO',
        vm: '1-n',
        name: 'ProductName'
    },
    '(0044,0009)': {
        tag: '(0044,0009)',
        vr: 'LT',
        vm: '1',
        name: 'ProductDescription'
    },
    '(0044,000A)': {
        tag: '(0044,000A)',
        vr: 'LO',
        vm: '1',
        name: 'ProductLotIdentifier'
    },
    '(0044,000B)': {
        tag: '(0044,000B)',
        vr: 'DT',
        vm: '1',
        name: 'ProductExpirationDateTime'
    },
    '(0044,0010)': {
        tag: '(0044,0010)',
        vr: 'DT',
        vm: '1',
        name: 'SubstanceAdministrationDateTime'
    },
    '(0044,0011)': {
        tag: '(0044,0011)',
        vr: 'LO',
        vm: '1',
        name: 'SubstanceAdministrationNotes'
    },
    '(0044,0012)': {
        tag: '(0044,0012)',
        vr: 'LO',
        vm: '1',
        name: 'SubstanceAdministrationDeviceID'
    },
    '(0044,0013)': {
        tag: '(0044,0013)',
        vr: 'SQ',
        vm: '1',
        name: 'ProductParameterSequence'
    },
    '(0044,0019)': {
        tag: '(0044,0019)',
        vr: 'SQ',
        vm: '1',
        name: 'SubstanceAdministrationParameterSequence'
    },
    '(0046,0012)': {
        tag: '(0046,0012)',
        vr: 'LO',
        vm: '1',
        name: 'LensDescription'
    },
    '(0046,0014)': {
        tag: '(0046,0014)',
        vr: 'SQ',
        vm: '1',
        name: 'RightLensSequence'
    },
    '(0046,0015)': {
        tag: '(0046,0015)',
        vr: 'SQ',
        vm: '1',
        name: 'LeftLensSequence'
    },
    '(0046,0016)': {
        tag: '(0046,0016)',
        vr: 'SQ',
        vm: '1',
        name: 'UnspecifiedLateralityLensSequence'
    },
    '(0046,0018)': {
        tag: '(0046,0018)',
        vr: 'SQ',
        vm: '1',
        name: 'CylinderSequence'
    },
    '(0046,0028)': {
        tag: '(0046,0028)',
        vr: 'SQ',
        vm: '1',
        name: 'PrismSequence'
    },
    '(0046,0030)': {
        tag: '(0046,0030)',
        vr: 'FD',
        vm: '1',
        name: 'HorizontalPrismPower'
    },
    '(0046,0032)': {
        tag: '(0046,0032)',
        vr: 'CS',
        vm: '1',
        name: 'HorizontalPrismBase'
    },
    '(0046,0034)': {
        tag: '(0046,0034)',
        vr: 'FD',
        vm: '1',
        name: 'VerticalPrismPower'
    },
    '(0046,0036)': {
        tag: '(0046,0036)',
        vr: 'CS',
        vm: '1',
        name: 'VerticalPrismBase'
    },
    '(0046,0038)': {
        tag: '(0046,0038)',
        vr: 'CS',
        vm: '1',
        name: 'LensSegmentType'
    },
    '(0046,0040)': {
        tag: '(0046,0040)',
        vr: 'FD',
        vm: '1',
        name: 'OpticalTransmittance'
    },
    '(0046,0042)': {
        tag: '(0046,0042)',
        vr: 'FD',
        vm: '1',
        name: 'ChannelWidth'
    },
    '(0046,0044)': {
        tag: '(0046,0044)',
        vr: 'FD',
        vm: '1',
        name: 'PupilSize'
    },
    '(0046,0046)': {
        tag: '(0046,0046)',
        vr: 'FD',
        vm: '1',
        name: 'CornealSize'
    },
    '(0046,0050)': {
        tag: '(0046,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'AutorefractionRightEyeSequence'
    },
    '(0046,0052)': {
        tag: '(0046,0052)',
        vr: 'SQ',
        vm: '1',
        name: 'AutorefractionLeftEyeSequence'
    },
    '(0046,0060)': {
        tag: '(0046,0060)',
        vr: 'FD',
        vm: '1',
        name: 'DistancePupillaryDistance'
    },
    '(0046,0062)': {
        tag: '(0046,0062)',
        vr: 'FD',
        vm: '1',
        name: 'NearPupillaryDistance'
    },
    '(0046,0063)': {
        tag: '(0046,0063)',
        vr: 'FD',
        vm: '1',
        name: 'IntermediatePupillaryDistance'
    },
    '(0046,0064)': {
        tag: '(0046,0064)',
        vr: 'FD',
        vm: '1',
        name: 'OtherPupillaryDistance'
    },
    '(0046,0070)': {
        tag: '(0046,0070)',
        vr: 'SQ',
        vm: '1',
        name: 'KeratometryRightEyeSequence'
    },
    '(0046,0071)': {
        tag: '(0046,0071)',
        vr: 'SQ',
        vm: '1',
        name: 'KeratometryLeftEyeSequence'
    },
    '(0046,0074)': {
        tag: '(0046,0074)',
        vr: 'SQ',
        vm: '1',
        name: 'SteepKeratometricAxisSequence'
    },
    '(0046,0075)': {
        tag: '(0046,0075)',
        vr: 'FD',
        vm: '1',
        name: 'RadiusOfCurvature'
    },
    '(0046,0076)': {
        tag: '(0046,0076)',
        vr: 'FD',
        vm: '1',
        name: 'KeratometricPower'
    },
    '(0046,0077)': {
        tag: '(0046,0077)',
        vr: 'FD',
        vm: '1',
        name: 'KeratometricAxis'
    },
    '(0046,0080)': {
        tag: '(0046,0080)',
        vr: 'SQ',
        vm: '1',
        name: 'FlatKeratometricAxisSequence'
    },
    '(0046,0092)': {
        tag: '(0046,0092)',
        vr: 'CS',
        vm: '1',
        name: 'BackgroundColor'
    },
    '(0046,0094)': {
        tag: '(0046,0094)',
        vr: 'CS',
        vm: '1',
        name: 'Optotype'
    },
    '(0046,0095)': {
        tag: '(0046,0095)',
        vr: 'CS',
        vm: '1',
        name: 'OptotypePresentation'
    },
    '(0046,0097)': {
        tag: '(0046,0097)',
        vr: 'SQ',
        vm: '1',
        name: 'SubjectiveRefractionRightEyeSequence'
    },
    '(0046,0098)': {
        tag: '(0046,0098)',
        vr: 'SQ',
        vm: '1',
        name: 'SubjectiveRefractionLeftEyeSequence'
    },
    '(0046,0100)': {
        tag: '(0046,0100)',
        vr: 'SQ',
        vm: '1',
        name: 'AddNearSequence'
    },
    '(0046,0101)': {
        tag: '(0046,0101)',
        vr: 'SQ',
        vm: '1',
        name: 'AddIntermediateSequence'
    },
    '(0046,0102)': {
        tag: '(0046,0102)',
        vr: 'SQ',
        vm: '1',
        name: 'AddOtherSequence'
    },
    '(0046,0104)': {
        tag: '(0046,0104)',
        vr: 'FD',
        vm: '1',
        name: 'AddPower'
    },
    '(0046,0106)': {
        tag: '(0046,0106)',
        vr: 'FD',
        vm: '1',
        name: 'ViewingDistance'
    },
    '(0046,0121)': {
        tag: '(0046,0121)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualAcuityTypeCodeSequence'
    },
    '(0046,0122)': {
        tag: '(0046,0122)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualAcuityRightEyeSequence'
    },
    '(0046,0123)': {
        tag: '(0046,0123)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualAcuityLeftEyeSequence'
    },
    '(0046,0124)': {
        tag: '(0046,0124)',
        vr: 'SQ',
        vm: '1',
        name: 'VisualAcuityBothEyesOpenSequence'
    },
    '(0046,0125)': {
        tag: '(0046,0125)',
        vr: 'CS',
        vm: '1',
        name: 'ViewingDistanceType'
    },
    '(0046,0135)': {
        tag: '(0046,0135)',
        vr: 'SS',
        vm: '2',
        name: 'VisualAcuityModifiers'
    },
    '(0046,0137)': {
        tag: '(0046,0137)',
        vr: 'FD',
        vm: '1',
        name: 'DecimalVisualAcuity'
    },
    '(0046,0139)': {
        tag: '(0046,0139)',
        vr: 'LO',
        vm: '1',
        name: 'OptotypeDetailedDefinition'
    },
    '(0046,0145)': {
        tag: '(0046,0145)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedRefractiveMeasurementsSequence'
    },
    '(0046,0146)': {
        tag: '(0046,0146)',
        vr: 'FD',
        vm: '1',
        name: 'SpherePower'
    },
    '(0046,0147)': {
        tag: '(0046,0147)',
        vr: 'FD',
        vm: '1',
        name: 'CylinderPower'
    },
    '(0048,0001)': {
        tag: '(0048,0001)',
        vr: 'FL',
        vm: '1',
        name: 'ImagedVolumeWidth'
    },
    '(0048,0002)': {
        tag: '(0048,0002)',
        vr: 'FL',
        vm: '1',
        name: 'ImagedVolumeHeight'
    },
    '(0048,0003)': {
        tag: '(0048,0003)',
        vr: 'FL',
        vm: '1',
        name: 'ImagedVolumeDepth'
    },
    '(0048,0006)': {
        tag: '(0048,0006)',
        vr: 'UL',
        vm: '1',
        name: 'TotalPixelMatrixColumns'
    },
    '(0048,0007)': {
        tag: '(0048,0007)',
        vr: 'UL',
        vm: '1',
        name: 'TotalPixelMatrixRows'
    },
    '(0048,0008)': {
        tag: '(0048,0008)',
        vr: 'SQ',
        vm: '1',
        name: 'TotalPixelMatrixOriginSequence'
    },
    '(0048,0010)': {
        tag: '(0048,0010)',
        vr: 'CS',
        vm: '1',
        name: 'SpecimenLabelInImage'
    },
    '(0048,0011)': {
        tag: '(0048,0011)',
        vr: 'CS',
        vm: '1',
        name: 'FocusMethod'
    },
    '(0048,0012)': {
        tag: '(0048,0012)',
        vr: 'CS',
        vm: '1',
        name: 'ExtendedDepthOfField'
    },
    '(0048,0013)': {
        tag: '(0048,0013)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfFocalPlanes'
    },
    '(0048,0014)': {
        tag: '(0048,0014)',
        vr: 'FL',
        vm: '1',
        name: 'DistanceBetweenFocalPlanes'
    },
    '(0048,0015)': {
        tag: '(0048,0015)',
        vr: 'US',
        vm: '3',
        name: 'RecommendedAbsentPixelCIELabValue'
    },
    '(0048,0100)': {
        tag: '(0048,0100)',
        vr: 'SQ',
        vm: '1',
        name: 'IlluminatorTypeCodeSequence'
    },
    '(0048,0102)': {
        tag: '(0048,0102)',
        vr: 'DS',
        vm: '6',
        name: 'ImageOrientationSlide'
    },
    '(0048,0105)': {
        tag: '(0048,0105)',
        vr: 'SQ',
        vm: '1',
        name: 'OpticalPathSequence'
    },
    '(0048,0106)': {
        tag: '(0048,0106)',
        vr: 'SH',
        vm: '1',
        name: 'OpticalPathIdentifier'
    },
    '(0048,0107)': {
        tag: '(0048,0107)',
        vr: 'ST',
        vm: '1',
        name: 'OpticalPathDescription'
    },
    '(0048,0108)': {
        tag: '(0048,0108)',
        vr: 'SQ',
        vm: '1',
        name: 'IlluminationColorCodeSequence'
    },
    '(0048,0110)': {
        tag: '(0048,0110)',
        vr: 'SQ',
        vm: '1',
        name: 'SpecimenReferenceSequence'
    },
    '(0048,0111)': {
        tag: '(0048,0111)',
        vr: 'DS',
        vm: '1',
        name: 'CondenserLensPower'
    },
    '(0048,0112)': {
        tag: '(0048,0112)',
        vr: 'DS',
        vm: '1',
        name: 'ObjectiveLensPower'
    },
    '(0048,0113)': {
        tag: '(0048,0113)',
        vr: 'DS',
        vm: '1',
        name: 'ObjectiveLensNumericalAperture'
    },
    '(0048,0120)': {
        tag: '(0048,0120)',
        vr: 'SQ',
        vm: '1',
        name: 'PaletteColorLookupTableSequence'
    },
    '(0048,0200)': {
        tag: '(0048,0200)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageNavigationSequence'
    },
    '(0048,0201)': {
        tag: '(0048,0201)',
        vr: 'US',
        vm: '2',
        name: 'TopLeftHandCornerOfLocalizerArea'
    },
    '(0048,0202)': {
        tag: '(0048,0202)',
        vr: 'US',
        vm: '2',
        name: 'BottomRightHandCornerOfLocalizerArea'
    },
    '(0048,0207)': {
        tag: '(0048,0207)',
        vr: 'SQ',
        vm: '1',
        name: 'OpticalPathIdentificationSequence'
    },
    '(0048,021A)': {
        tag: '(0048,021A)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanePositionSlideSequence'
    },
    '(0048,021E)': {
        tag: '(0048,021E)',
        vr: 'SL',
        vm: '1',
        name: 'RowPositionInTotalImagePixelMatrix'
    },
    '(0048,021F)': {
        tag: '(0048,021F)',
        vr: 'SL',
        vm: '1',
        name: 'ColumnPositionInTotalImagePixelMatrix'
    },
    '(0048,0301)': {
        tag: '(0048,0301)',
        vr: 'CS',
        vm: '1',
        name: 'PixelOriginInterpretation'
    },
    '(0050,0004)': {
        tag: '(0050,0004)',
        vr: 'CS',
        vm: '1',
        name: 'CalibrationImage'
    },
    '(0050,0010)': {
        tag: '(0050,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'DeviceSequence'
    },
    '(0050,0012)': {
        tag: '(0050,0012)',
        vr: 'SQ',
        vm: '1',
        name: 'ContainerComponentTypeCodeSequence'
    },
    '(0050,0013)': {
        tag: '(0050,0013)',
        vr: 'FD',
        vm: '1',
        name: 'ContainerComponentThickness'
    },
    '(0050,0014)': {
        tag: '(0050,0014)',
        vr: 'DS',
        vm: '1',
        name: 'DeviceLength'
    },
    '(0050,0015)': {
        tag: '(0050,0015)',
        vr: 'FD',
        vm: '1',
        name: 'ContainerComponentWidth'
    },
    '(0050,0016)': {
        tag: '(0050,0016)',
        vr: 'DS',
        vm: '1',
        name: 'DeviceDiameter'
    },
    '(0050,0017)': {
        tag: '(0050,0017)',
        vr: 'CS',
        vm: '1',
        name: 'DeviceDiameterUnits'
    },
    '(0050,0018)': {
        tag: '(0050,0018)',
        vr: 'DS',
        vm: '1',
        name: 'DeviceVolume'
    },
    '(0050,0019)': {
        tag: '(0050,0019)',
        vr: 'DS',
        vm: '1',
        name: 'InterMarkerDistance'
    },
    '(0050,001A)': {
        tag: '(0050,001A)',
        vr: 'CS',
        vm: '1',
        name: 'ContainerComponentMaterial'
    },
    '(0050,001B)': {
        tag: '(0050,001B)',
        vr: 'LO',
        vm: '1',
        name: 'ContainerComponentID'
    },
    '(0050,001C)': {
        tag: '(0050,001C)',
        vr: 'FD',
        vm: '1',
        name: 'ContainerComponentLength'
    },
    '(0050,001D)': {
        tag: '(0050,001D)',
        vr: 'FD',
        vm: '1',
        name: 'ContainerComponentDiameter'
    },
    '(0050,001E)': {
        tag: '(0050,001E)',
        vr: 'LO',
        vm: '1',
        name: 'ContainerComponentDescription'
    },
    '(0050,0020)': {
        tag: '(0050,0020)',
        vr: 'LO',
        vm: '1',
        name: 'DeviceDescription'
    },
    '(0052,0001)': {
        tag: '(0052,0001)',
        vr: 'FL',
        vm: '1',
        name: 'ContrastBolusIngredientPercentByVolume'
    },
    '(0052,0002)': {
        tag: '(0052,0002)',
        vr: 'FD',
        vm: '1',
        name: 'OCTFocalDistance'
    },
    '(0052,0003)': {
        tag: '(0052,0003)',
        vr: 'FD',
        vm: '1',
        name: 'BeamSpotSize'
    },
    '(0052,0004)': {
        tag: '(0052,0004)',
        vr: 'FD',
        vm: '1',
        name: 'EffectiveRefractiveIndex'
    },
    '(0052,0006)': {
        tag: '(0052,0006)',
        vr: 'CS',
        vm: '1',
        name: 'OCTAcquisitionDomain'
    },
    '(0052,0007)': {
        tag: '(0052,0007)',
        vr: 'FD',
        vm: '1',
        name: 'OCTOpticalCenterWavelength'
    },
    '(0052,0008)': {
        tag: '(0052,0008)',
        vr: 'FD',
        vm: '1',
        name: 'AxialResolution'
    },
    '(0052,0009)': {
        tag: '(0052,0009)',
        vr: 'FD',
        vm: '1',
        name: 'RangingDepth'
    },
    '(0052,0011)': {
        tag: '(0052,0011)',
        vr: 'FD',
        vm: '1',
        name: 'ALineRate'
    },
    '(0052,0012)': {
        tag: '(0052,0012)',
        vr: 'US',
        vm: '1',
        name: 'ALinesPerFrame'
    },
    '(0052,0013)': {
        tag: '(0052,0013)',
        vr: 'FD',
        vm: '1',
        name: 'CatheterRotationalRate'
    },
    '(0052,0014)': {
        tag: '(0052,0014)',
        vr: 'FD',
        vm: '1',
        name: 'ALinePixelSpacing'
    },
    '(0052,0016)': {
        tag: '(0052,0016)',
        vr: 'SQ',
        vm: '1',
        name: 'ModeOfPercutaneousAccessSequence'
    },
    '(0052,0025)': {
        tag: '(0052,0025)',
        vr: 'SQ',
        vm: '1',
        name: 'IntravascularOCTFrameTypeSequence'
    },
    '(0052,0026)': {
        tag: '(0052,0026)',
        vr: 'CS',
        vm: '1',
        name: 'OCTZOffsetApplied'
    },
    '(0052,0027)': {
        tag: '(0052,0027)',
        vr: 'SQ',
        vm: '1',
        name: 'IntravascularFrameContentSequence'
    },
    '(0052,0028)': {
        tag: '(0052,0028)',
        vr: 'FD',
        vm: '1',
        name: 'IntravascularLongitudinalDistance'
    },
    '(0052,0029)': {
        tag: '(0052,0029)',
        vr: 'SQ',
        vm: '1',
        name: 'IntravascularOCTFrameContentSequence'
    },
    '(0052,0030)': {
        tag: '(0052,0030)',
        vr: 'SS',
        vm: '1',
        name: 'OCTZOffsetCorrection'
    },
    '(0052,0031)': {
        tag: '(0052,0031)',
        vr: 'CS',
        vm: '1',
        name: 'CatheterDirectionOfRotation'
    },
    '(0052,0033)': {
        tag: '(0052,0033)',
        vr: 'FD',
        vm: '1',
        name: 'SeamLineLocation'
    },
    '(0052,0034)': {
        tag: '(0052,0034)',
        vr: 'FD',
        vm: '1',
        name: 'FirstALineLocation'
    },
    '(0052,0036)': {
        tag: '(0052,0036)',
        vr: 'US',
        vm: '1',
        name: 'SeamLineIndex'
    },
    '(0052,0038)': {
        tag: '(0052,0038)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfPaddedAlines'
    },
    '(0052,0039)': {
        tag: '(0052,0039)',
        vr: 'CS',
        vm: '1',
        name: 'InterpolationType'
    },
    '(0052,003A)': {
        tag: '(0052,003A)',
        vr: 'CS',
        vm: '1',
        name: 'RefractiveIndexApplied'
    },
    '(0054,0011)': {
        tag: '(0054,0011)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfEnergyWindows'
    },
    '(0054,0012)': {
        tag: '(0054,0012)',
        vr: 'SQ',
        vm: '1',
        name: 'EnergyWindowInformationSequence'
    },
    '(0054,0013)': {
        tag: '(0054,0013)',
        vr: 'SQ',
        vm: '1',
        name: 'EnergyWindowRangeSequence'
    },
    '(0054,0014)': {
        tag: '(0054,0014)',
        vr: 'DS',
        vm: '1',
        name: 'EnergyWindowLowerLimit'
    },
    '(0054,0015)': {
        tag: '(0054,0015)',
        vr: 'DS',
        vm: '1',
        name: 'EnergyWindowUpperLimit'
    },
    '(0054,0016)': {
        tag: '(0054,0016)',
        vr: 'SQ',
        vm: '1',
        name: 'RadiopharmaceuticalInformationSequence'
    },
    '(0054,0017)': {
        tag: '(0054,0017)',
        vr: 'IS',
        vm: '1',
        name: 'ResidualSyringeCounts'
    },
    '(0054,0018)': {
        tag: '(0054,0018)',
        vr: 'SH',
        vm: '1',
        name: 'EnergyWindowName'
    },
    '(0054,0020)': {
        tag: '(0054,0020)',
        vr: 'US',
        vm: '1-n',
        name: 'DetectorVector'
    },
    '(0054,0021)': {
        tag: '(0054,0021)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfDetectors'
    },
    '(0054,0022)': {
        tag: '(0054,0022)',
        vr: 'SQ',
        vm: '1',
        name: 'DetectorInformationSequence'
    },
    '(0054,0030)': {
        tag: '(0054,0030)',
        vr: 'US',
        vm: '1-n',
        name: 'PhaseVector'
    },
    '(0054,0031)': {
        tag: '(0054,0031)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfPhases'
    },
    '(0054,0032)': {
        tag: '(0054,0032)',
        vr: 'SQ',
        vm: '1',
        name: 'PhaseInformationSequence'
    },
    '(0054,0033)': {
        tag: '(0054,0033)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfFramesInPhase'
    },
    '(0054,0036)': {
        tag: '(0054,0036)',
        vr: 'IS',
        vm: '1',
        name: 'PhaseDelay'
    },
    '(0054,0038)': {
        tag: '(0054,0038)',
        vr: 'IS',
        vm: '1',
        name: 'PauseBetweenFrames'
    },
    '(0054,0039)': {
        tag: '(0054,0039)',
        vr: 'CS',
        vm: '1',
        name: 'PhaseDescription'
    },
    '(0054,0050)': {
        tag: '(0054,0050)',
        vr: 'US',
        vm: '1-n',
        name: 'RotationVector'
    },
    '(0054,0051)': {
        tag: '(0054,0051)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfRotations'
    },
    '(0054,0052)': {
        tag: '(0054,0052)',
        vr: 'SQ',
        vm: '1',
        name: 'RotationInformationSequence'
    },
    '(0054,0053)': {
        tag: '(0054,0053)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfFramesInRotation'
    },
    '(0054,0060)': {
        tag: '(0054,0060)',
        vr: 'US',
        vm: '1-n',
        name: 'RRIntervalVector'
    },
    '(0054,0061)': {
        tag: '(0054,0061)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfRRIntervals'
    },
    '(0054,0062)': {
        tag: '(0054,0062)',
        vr: 'SQ',
        vm: '1',
        name: 'GatedInformationSequence'
    },
    '(0054,0063)': {
        tag: '(0054,0063)',
        vr: 'SQ',
        vm: '1',
        name: 'DataInformationSequence'
    },
    '(0054,0070)': {
        tag: '(0054,0070)',
        vr: 'US',
        vm: '1-n',
        name: 'TimeSlotVector'
    },
    '(0054,0071)': {
        tag: '(0054,0071)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfTimeSlots'
    },
    '(0054,0072)': {
        tag: '(0054,0072)',
        vr: 'SQ',
        vm: '1',
        name: 'TimeSlotInformationSequence'
    },
    '(0054,0073)': {
        tag: '(0054,0073)',
        vr: 'DS',
        vm: '1',
        name: 'TimeSlotTime'
    },
    '(0054,0080)': {
        tag: '(0054,0080)',
        vr: 'US',
        vm: '1-n',
        name: 'SliceVector'
    },
    '(0054,0081)': {
        tag: '(0054,0081)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfSlices'
    },
    '(0054,0090)': {
        tag: '(0054,0090)',
        vr: 'US',
        vm: '1-n',
        name: 'AngularViewVector'
    },
    '(0054,0100)': {
        tag: '(0054,0100)',
        vr: 'US',
        vm: '1-n',
        name: 'TimeSliceVector'
    },
    '(0054,0101)': {
        tag: '(0054,0101)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfTimeSlices'
    },
    '(0054,0200)': {
        tag: '(0054,0200)',
        vr: 'DS',
        vm: '1',
        name: 'StartAngle'
    },
    '(0054,0202)': {
        tag: '(0054,0202)',
        vr: 'CS',
        vm: '1',
        name: 'TypeOfDetectorMotion'
    },
    '(0054,0210)': {
        tag: '(0054,0210)',
        vr: 'IS',
        vm: '1-n',
        name: 'TriggerVector'
    },
    '(0054,0211)': {
        tag: '(0054,0211)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfTriggersInPhase'
    },
    '(0054,0220)': {
        tag: '(0054,0220)',
        vr: 'SQ',
        vm: '1',
        name: 'ViewCodeSequence'
    },
    '(0054,0222)': {
        tag: '(0054,0222)',
        vr: 'SQ',
        vm: '1',
        name: 'ViewModifierCodeSequence'
    },
    '(0054,0300)': {
        tag: '(0054,0300)',
        vr: 'SQ',
        vm: '1',
        name: 'RadionuclideCodeSequence'
    },
    '(0054,0302)': {
        tag: '(0054,0302)',
        vr: 'SQ',
        vm: '1',
        name: 'AdministrationRouteCodeSequence'
    },
    '(0054,0304)': {
        tag: '(0054,0304)',
        vr: 'SQ',
        vm: '1',
        name: 'RadiopharmaceuticalCodeSequence'
    },
    '(0054,0306)': {
        tag: '(0054,0306)',
        vr: 'SQ',
        vm: '1',
        name: 'CalibrationDataSequence'
    },
    '(0054,0308)': {
        tag: '(0054,0308)',
        vr: 'US',
        vm: '1',
        name: 'EnergyWindowNumber'
    },
    '(0054,0400)': {
        tag: '(0054,0400)',
        vr: 'SH',
        vm: '1',
        name: 'ImageID'
    },
    '(0054,0410)': {
        tag: '(0054,0410)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientOrientationCodeSequence'
    },
    '(0054,0412)': {
        tag: '(0054,0412)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientOrientationModifierCodeSequence'
    },
    '(0054,0414)': {
        tag: '(0054,0414)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientGantryRelationshipCodeSequence'
    },
    '(0054,0500)': {
        tag: '(0054,0500)',
        vr: 'CS',
        vm: '1',
        name: 'SliceProgressionDirection'
    },
    '(0054,1000)': {
        tag: '(0054,1000)',
        vr: 'CS',
        vm: '2',
        name: 'SeriesType'
    },
    '(0054,1001)': {
        tag: '(0054,1001)',
        vr: 'CS',
        vm: '1',
        name: 'Units'
    },
    '(0054,1002)': {
        tag: '(0054,1002)',
        vr: 'CS',
        vm: '1',
        name: 'CountsSource'
    },
    '(0054,1004)': {
        tag: '(0054,1004)',
        vr: 'CS',
        vm: '1',
        name: 'ReprojectionMethod'
    },
    '(0054,1006)': {
        tag: '(0054,1006)',
        vr: 'CS',
        vm: '1',
        name: 'SUVType'
    },
    '(0054,1100)': {
        tag: '(0054,1100)',
        vr: 'CS',
        vm: '1',
        name: 'RandomsCorrectionMethod'
    },
    '(0054,1101)': {
        tag: '(0054,1101)',
        vr: 'LO',
        vm: '1',
        name: 'AttenuationCorrectionMethod'
    },
    '(0054,1102)': {
        tag: '(0054,1102)',
        vr: 'CS',
        vm: '1',
        name: 'DecayCorrection'
    },
    '(0054,1103)': {
        tag: '(0054,1103)',
        vr: 'LO',
        vm: '1',
        name: 'ReconstructionMethod'
    },
    '(0054,1104)': {
        tag: '(0054,1104)',
        vr: 'LO',
        vm: '1',
        name: 'DetectorLinesOfResponseUsed'
    },
    '(0054,1105)': {
        tag: '(0054,1105)',
        vr: 'LO',
        vm: '1',
        name: 'ScatterCorrectionMethod'
    },
    '(0054,1200)': {
        tag: '(0054,1200)',
        vr: 'DS',
        vm: '1',
        name: 'AxialAcceptance'
    },
    '(0054,1201)': {
        tag: '(0054,1201)',
        vr: 'IS',
        vm: '2',
        name: 'AxialMash'
    },
    '(0054,1202)': {
        tag: '(0054,1202)',
        vr: 'IS',
        vm: '1',
        name: 'TransverseMash'
    },
    '(0054,1203)': {
        tag: '(0054,1203)',
        vr: 'DS',
        vm: '2',
        name: 'DetectorElementSize'
    },
    '(0054,1210)': {
        tag: '(0054,1210)',
        vr: 'DS',
        vm: '1',
        name: 'CoincidenceWindowWidth'
    },
    '(0054,1220)': {
        tag: '(0054,1220)',
        vr: 'CS',
        vm: '1-n',
        name: 'SecondaryCountsType'
    },
    '(0054,1300)': {
        tag: '(0054,1300)',
        vr: 'DS',
        vm: '1',
        name: 'FrameReferenceTime'
    },
    '(0054,1310)': {
        tag: '(0054,1310)',
        vr: 'IS',
        vm: '1',
        name: 'PrimaryPromptsCountsAccumulated'
    },
    '(0054,1311)': {
        tag: '(0054,1311)',
        vr: 'IS',
        vm: '1-n',
        name: 'SecondaryCountsAccumulated'
    },
    '(0054,1320)': {
        tag: '(0054,1320)',
        vr: 'DS',
        vm: '1',
        name: 'SliceSensitivityFactor'
    },
    '(0054,1321)': {
        tag: '(0054,1321)',
        vr: 'DS',
        vm: '1',
        name: 'DecayFactor'
    },
    '(0054,1322)': {
        tag: '(0054,1322)',
        vr: 'DS',
        vm: '1',
        name: 'DoseCalibrationFactor'
    },
    '(0054,1323)': {
        tag: '(0054,1323)',
        vr: 'DS',
        vm: '1',
        name: 'ScatterFractionFactor'
    },
    '(0054,1324)': {
        tag: '(0054,1324)',
        vr: 'DS',
        vm: '1',
        name: 'DeadTimeFactor'
    },
    '(0054,1330)': {
        tag: '(0054,1330)',
        vr: 'US',
        vm: '1',
        name: 'ImageIndex'
    },
    '(0054,1400)': {
        tag: '(0054,1400)',
        vr: 'CS',
        vm: '1-n',
        name: 'CountsIncluded'
    },
    '(0054,1401)': {
        tag: '(0054,1401)',
        vr: 'CS',
        vm: '1',
        name: 'DeadTimeCorrectionFlag'
    },
    '(0060,3000)': {
        tag: '(0060,3000)',
        vr: 'SQ',
        vm: '1',
        name: 'HistogramSequence'
    },
    '(0060,3002)': {
        tag: '(0060,3002)',
        vr: 'US',
        vm: '1',
        name: 'HistogramNumberOfBins'
    },
    '(0060,3004)': {
        tag: '(0060,3004)',
        vr: 'US|SS',
        vm: '1',
        name: 'HistogramFirstBinValue'
    },
    '(0060,3006)': {
        tag: '(0060,3006)',
        vr: 'US|SS',
        vm: '1',
        name: 'HistogramLastBinValue'
    },
    '(0060,3008)': {
        tag: '(0060,3008)',
        vr: 'US',
        vm: '1',
        name: 'HistogramBinWidth'
    },
    '(0060,3010)': {
        tag: '(0060,3010)',
        vr: 'LO',
        vm: '1',
        name: 'HistogramExplanation'
    },
    '(0060,3020)': {
        tag: '(0060,3020)',
        vr: 'UL',
        vm: '1-n',
        name: 'HistogramData'
    },
    '(0062,0001)': {
        tag: '(0062,0001)',
        vr: 'CS',
        vm: '1',
        name: 'SegmentationType'
    },
    '(0062,0002)': {
        tag: '(0062,0002)',
        vr: 'SQ',
        vm: '1',
        name: 'SegmentSequence'
    },
    '(0062,0003)': {
        tag: '(0062,0003)',
        vr: 'SQ',
        vm: '1',
        name: 'SegmentedPropertyCategoryCodeSequence'
    },
    '(0062,0004)': {
        tag: '(0062,0004)',
        vr: 'US',
        vm: '1',
        name: 'SegmentNumber'
    },
    '(0062,0005)': {
        tag: '(0062,0005)',
        vr: 'LO',
        vm: '1',
        name: 'SegmentLabel'
    },
    '(0062,0006)': {
        tag: '(0062,0006)',
        vr: 'ST',
        vm: '1',
        name: 'SegmentDescription'
    },
    '(0062,0008)': {
        tag: '(0062,0008)',
        vr: 'CS',
        vm: '1',
        name: 'SegmentAlgorithmType'
    },
    '(0062,0009)': {
        tag: '(0062,0009)',
        vr: 'LO',
        vm: '1',
        name: 'SegmentAlgorithmName'
    },
    '(0062,000A)': {
        tag: '(0062,000A)',
        vr: 'SQ',
        vm: '1',
        name: 'SegmentIdentificationSequence'
    },
    '(0062,000B)': {
        tag: '(0062,000B)',
        vr: 'US',
        vm: '1-n',
        name: 'ReferencedSegmentNumber'
    },
    '(0062,000C)': {
        tag: '(0062,000C)',
        vr: 'US',
        vm: '1',
        name: 'RecommendedDisplayGrayscaleValue'
    },
    '(0062,000D)': {
        tag: '(0062,000D)',
        vr: 'US',
        vm: '3',
        name: 'RecommendedDisplayCIELabValue'
    },
    '(0062,000E)': {
        tag: '(0062,000E)',
        vr: 'US',
        vm: '1',
        name: 'MaximumFractionalValue'
    },
    '(0062,000F)': {
        tag: '(0062,000F)',
        vr: 'SQ',
        vm: '1',
        name: 'SegmentedPropertyTypeCodeSequence'
    },
    '(0062,0010)': {
        tag: '(0062,0010)',
        vr: 'CS',
        vm: '1',
        name: 'SegmentationFractionalType'
    },
    '(0064,0002)': {
        tag: '(0064,0002)',
        vr: 'SQ',
        vm: '1',
        name: 'DeformableRegistrationSequence'
    },
    '(0064,0003)': {
        tag: '(0064,0003)',
        vr: 'UI',
        vm: '1',
        name: 'SourceFrameOfReferenceUID'
    },
    '(0064,0005)': {
        tag: '(0064,0005)',
        vr: 'SQ',
        vm: '1',
        name: 'DeformableRegistrationGridSequence'
    },
    '(0064,0007)': {
        tag: '(0064,0007)',
        vr: 'UL',
        vm: '3',
        name: 'GridDimensions'
    },
    '(0064,0008)': {
        tag: '(0064,0008)',
        vr: 'FD',
        vm: '3',
        name: 'GridResolution'
    },
    '(0064,0009)': {
        tag: '(0064,0009)',
        vr: 'OF',
        vm: '1',
        name: 'VectorGridData'
    },
    '(0064,000F)': {
        tag: '(0064,000F)',
        vr: 'SQ',
        vm: '1',
        name: 'PreDeformationMatrixRegistrationSequence'
    },
    '(0064,0010)': {
        tag: '(0064,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'PostDeformationMatrixRegistrationSequence'
    },
    '(0066,0001)': {
        tag: '(0066,0001)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfSurfaces'
    },
    '(0066,0002)': {
        tag: '(0066,0002)',
        vr: 'SQ',
        vm: '1',
        name: 'SurfaceSequence'
    },
    '(0066,0003)': {
        tag: '(0066,0003)',
        vr: 'UL',
        vm: '1',
        name: 'SurfaceNumber'
    },
    '(0066,0004)': {
        tag: '(0066,0004)',
        vr: 'LT',
        vm: '1',
        name: 'SurfaceComments'
    },
    '(0066,0009)': {
        tag: '(0066,0009)',
        vr: 'CS',
        vm: '1',
        name: 'SurfaceProcessing'
    },
    '(0066,000A)': {
        tag: '(0066,000A)',
        vr: 'FL',
        vm: '1',
        name: 'SurfaceProcessingRatio'
    },
    '(0066,000B)': {
        tag: '(0066,000B)',
        vr: 'LO',
        vm: '1',
        name: 'SurfaceProcessingDescription'
    },
    '(0066,000C)': {
        tag: '(0066,000C)',
        vr: 'FL',
        vm: '1',
        name: 'RecommendedPresentationOpacity'
    },
    '(0066,000D)': {
        tag: '(0066,000D)',
        vr: 'CS',
        vm: '1',
        name: 'RecommendedPresentationType'
    },
    '(0066,000E)': {
        tag: '(0066,000E)',
        vr: 'CS',
        vm: '1',
        name: 'FiniteVolume'
    },
    '(0066,0010)': {
        tag: '(0066,0010)',
        vr: 'CS',
        vm: '1',
        name: 'Manifold'
    },
    '(0066,0011)': {
        tag: '(0066,0011)',
        vr: 'SQ',
        vm: '1',
        name: 'SurfacePointsSequence'
    },
    '(0066,0012)': {
        tag: '(0066,0012)',
        vr: 'SQ',
        vm: '1',
        name: 'SurfacePointsNormalsSequence'
    },
    '(0066,0013)': {
        tag: '(0066,0013)',
        vr: 'SQ',
        vm: '1',
        name: 'SurfaceMeshPrimitivesSequence'
    },
    '(0066,0015)': {
        tag: '(0066,0015)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfSurfacePoints'
    },
    '(0066,0016)': {
        tag: '(0066,0016)',
        vr: 'OF',
        vm: '1',
        name: 'PointCoordinatesData'
    },
    '(0066,0017)': {
        tag: '(0066,0017)',
        vr: 'FL',
        vm: '3',
        name: 'PointPositionAccuracy'
    },
    '(0066,0018)': {
        tag: '(0066,0018)',
        vr: 'FL',
        vm: '1',
        name: 'MeanPointDistance'
    },
    '(0066,0019)': {
        tag: '(0066,0019)',
        vr: 'FL',
        vm: '1',
        name: 'MaximumPointDistance'
    },
    '(0066,001A)': {
        tag: '(0066,001A)',
        vr: 'FL',
        vm: '6',
        name: 'PointsBoundingBoxCoordinates'
    },
    '(0066,001B)': {
        tag: '(0066,001B)',
        vr: 'FL',
        vm: '3',
        name: 'AxisOfRotation'
    },
    '(0066,001C)': {
        tag: '(0066,001C)',
        vr: 'FL',
        vm: '3',
        name: 'CenterOfRotation'
    },
    '(0066,001E)': {
        tag: '(0066,001E)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfVectors'
    },
    '(0066,001F)': {
        tag: '(0066,001F)',
        vr: 'US',
        vm: '1',
        name: 'VectorDimensionality'
    },
    '(0066,0020)': {
        tag: '(0066,0020)',
        vr: 'FL',
        vm: '1-n',
        name: 'VectorAccuracy'
    },
    '(0066,0021)': {
        tag: '(0066,0021)',
        vr: 'OF',
        vm: '1',
        name: 'VectorCoordinateData'
    },
    '(0066,0023)': {
        tag: '(0066,0023)',
        vr: 'OW',
        vm: '1',
        name: 'TrianglePointIndexList'
    },
    '(0066,0024)': {
        tag: '(0066,0024)',
        vr: 'OW',
        vm: '1',
        name: 'EdgePointIndexList'
    },
    '(0066,0025)': {
        tag: '(0066,0025)',
        vr: 'OW',
        vm: '1',
        name: 'VertexPointIndexList'
    },
    '(0066,0026)': {
        tag: '(0066,0026)',
        vr: 'SQ',
        vm: '1',
        name: 'TriangleStripSequence'
    },
    '(0066,0027)': {
        tag: '(0066,0027)',
        vr: 'SQ',
        vm: '1',
        name: 'TriangleFanSequence'
    },
    '(0066,0028)': {
        tag: '(0066,0028)',
        vr: 'SQ',
        vm: '1',
        name: 'LineSequence'
    },
    '(0066,0029)': {
        tag: '(0066,0029)',
        vr: 'OW',
        vm: '1',
        name: 'PrimitivePointIndexList'
    },
    '(0066,002A)': {
        tag: '(0066,002A)',
        vr: 'UL',
        vm: '1',
        name: 'SurfaceCount'
    },
    '(0066,002B)': {
        tag: '(0066,002B)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedSurfaceSequence'
    },
    '(0066,002C)': {
        tag: '(0066,002C)',
        vr: 'UL',
        vm: '1',
        name: 'ReferencedSurfaceNumber'
    },
    '(0066,002D)': {
        tag: '(0066,002D)',
        vr: 'SQ',
        vm: '1',
        name: 'SegmentSurfaceGenerationAlgorithmIdentificationSequence'
    },
    '(0066,002E)': {
        tag: '(0066,002E)',
        vr: 'SQ',
        vm: '1',
        name: 'SegmentSurfaceSourceInstanceSequence'
    },
    '(0066,002F)': {
        tag: '(0066,002F)',
        vr: 'SQ',
        vm: '1',
        name: 'AlgorithmFamilyCodeSequence'
    },
    '(0066,0030)': {
        tag: '(0066,0030)',
        vr: 'SQ',
        vm: '1',
        name: 'AlgorithmNameCodeSequence'
    },
    '(0066,0031)': {
        tag: '(0066,0031)',
        vr: 'LO',
        vm: '1',
        name: 'AlgorithmVersion'
    },
    '(0066,0032)': {
        tag: '(0066,0032)',
        vr: 'LT',
        vm: '1',
        name: 'AlgorithmParameters'
    },
    '(0066,0034)': {
        tag: '(0066,0034)',
        vr: 'SQ',
        vm: '1',
        name: 'FacetSequence'
    },
    '(0066,0035)': {
        tag: '(0066,0035)',
        vr: 'SQ',
        vm: '1',
        name: 'SurfaceProcessingAlgorithmIdentificationSequence'
    },
    '(0066,0036)': {
        tag: '(0066,0036)',
        vr: 'LO',
        vm: '1',
        name: 'AlgorithmName'
    },
    '(0068,6210)': {
        tag: '(0068,6210)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantSize'
    },
    '(0068,6221)': {
        tag: '(0068,6221)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantTemplateVersion'
    },
    '(0068,6222)': {
        tag: '(0068,6222)',
        vr: 'SQ',
        vm: '1',
        name: 'ReplacedImplantTemplateSequence'
    },
    '(0068,6223)': {
        tag: '(0068,6223)',
        vr: 'CS',
        vm: '1',
        name: 'ImplantType'
    },
    '(0068,6224)': {
        tag: '(0068,6224)',
        vr: 'SQ',
        vm: '1',
        name: 'DerivationImplantTemplateSequence'
    },
    '(0068,6225)': {
        tag: '(0068,6225)',
        vr: 'SQ',
        vm: '1',
        name: 'OriginalImplantTemplateSequence'
    },
    '(0068,6226)': {
        tag: '(0068,6226)',
        vr: 'DT',
        vm: '1',
        name: 'EffectiveDateTime'
    },
    '(0068,6230)': {
        tag: '(0068,6230)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTargetAnatomySequence'
    },
    '(0068,6260)': {
        tag: '(0068,6260)',
        vr: 'SQ',
        vm: '1',
        name: 'InformationFromManufacturerSequence'
    },
    '(0068,6265)': {
        tag: '(0068,6265)',
        vr: 'SQ',
        vm: '1',
        name: 'NotificationFromManufacturerSequence'
    },
    '(0068,6270)': {
        tag: '(0068,6270)',
        vr: 'DT',
        vm: '1',
        name: 'InformationIssueDateTime'
    },
    '(0068,6280)': {
        tag: '(0068,6280)',
        vr: 'ST',
        vm: '1',
        name: 'InformationSummary'
    },
    '(0068,62A0)': {
        tag: '(0068,62A0)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantRegulatoryDisapprovalCodeSequence'
    },
    '(0068,62A5)': {
        tag: '(0068,62A5)',
        vr: 'FD',
        vm: '1',
        name: 'OverallTemplateSpatialTolerance'
    },
    '(0068,62C0)': {
        tag: '(0068,62C0)',
        vr: 'SQ',
        vm: '1',
        name: 'HPGLDocumentSequence'
    },
    '(0068,62D0)': {
        tag: '(0068,62D0)',
        vr: 'US',
        vm: '1',
        name: 'HPGLDocumentID'
    },
    '(0068,62D5)': {
        tag: '(0068,62D5)',
        vr: 'LO',
        vm: '1',
        name: 'HPGLDocumentLabel'
    },
    '(0068,62E0)': {
        tag: '(0068,62E0)',
        vr: 'SQ',
        vm: '1',
        name: 'ViewOrientationCodeSequence'
    },
    '(0068,62F0)': {
        tag: '(0068,62F0)',
        vr: 'FD',
        vm: '9',
        name: 'ViewOrientationModifier'
    },
    '(0068,62F2)': {
        tag: '(0068,62F2)',
        vr: 'FD',
        vm: '1',
        name: 'HPGLDocumentScaling'
    },
    '(0068,6300)': {
        tag: '(0068,6300)',
        vr: 'OB',
        vm: '1',
        name: 'HPGLDocument'
    },
    '(0068,6310)': {
        tag: '(0068,6310)',
        vr: 'US',
        vm: '1',
        name: 'HPGLContourPenNumber'
    },
    '(0068,6320)': {
        tag: '(0068,6320)',
        vr: 'SQ',
        vm: '1',
        name: 'HPGLPenSequence'
    },
    '(0068,6330)': {
        tag: '(0068,6330)',
        vr: 'US',
        vm: '1',
        name: 'HPGLPenNumber'
    },
    '(0068,6340)': {
        tag: '(0068,6340)',
        vr: 'LO',
        vm: '1',
        name: 'HPGLPenLabel'
    },
    '(0068,6345)': {
        tag: '(0068,6345)',
        vr: 'ST',
        vm: '1',
        name: 'HPGLPenDescription'
    },
    '(0068,6346)': {
        tag: '(0068,6346)',
        vr: 'FD',
        vm: '2',
        name: 'RecommendedRotationPoint'
    },
    '(0068,6347)': {
        tag: '(0068,6347)',
        vr: 'FD',
        vm: '4',
        name: 'BoundingRectangle'
    },
    '(0068,6350)': {
        tag: '(0068,6350)',
        vr: 'US',
        vm: '1-n',
        name: 'ImplantTemplate3DModelSurfaceNumber'
    },
    '(0068,6360)': {
        tag: '(0068,6360)',
        vr: 'SQ',
        vm: '1',
        name: 'SurfaceModelDescriptionSequence'
    },
    '(0068,6380)': {
        tag: '(0068,6380)',
        vr: 'LO',
        vm: '1',
        name: 'SurfaceModelLabel'
    },
    '(0068,6390)': {
        tag: '(0068,6390)',
        vr: 'FD',
        vm: '1',
        name: 'SurfaceModelScalingFactor'
    },
    '(0068,63A0)': {
        tag: '(0068,63A0)',
        vr: 'SQ',
        vm: '1',
        name: 'MaterialsCodeSequence'
    },
    '(0068,63A4)': {
        tag: '(0068,63A4)',
        vr: 'SQ',
        vm: '1',
        name: 'CoatingMaterialsCodeSequence'
    },
    '(0068,63A8)': {
        tag: '(0068,63A8)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTypeCodeSequence'
    },
    '(0068,63AC)': {
        tag: '(0068,63AC)',
        vr: 'SQ',
        vm: '1',
        name: 'FixationMethodCodeSequence'
    },
    '(0068,63B0)': {
        tag: '(0068,63B0)',
        vr: 'SQ',
        vm: '1',
        name: 'MatingFeatureSetsSequence'
    },
    '(0068,63C0)': {
        tag: '(0068,63C0)',
        vr: 'US',
        vm: '1',
        name: 'MatingFeatureSetID'
    },
    '(0068,63D0)': {
        tag: '(0068,63D0)',
        vr: 'LO',
        vm: '1',
        name: 'MatingFeatureSetLabel'
    },
    '(0068,63E0)': {
        tag: '(0068,63E0)',
        vr: 'SQ',
        vm: '1',
        name: 'MatingFeatureSequence'
    },
    '(0068,63F0)': {
        tag: '(0068,63F0)',
        vr: 'US',
        vm: '1',
        name: 'MatingFeatureID'
    },
    '(0068,6400)': {
        tag: '(0068,6400)',
        vr: 'SQ',
        vm: '1',
        name: 'MatingFeatureDegreeOfFreedomSequence'
    },
    '(0068,6410)': {
        tag: '(0068,6410)',
        vr: 'US',
        vm: '1',
        name: 'DegreeOfFreedomID'
    },
    '(0068,6420)': {
        tag: '(0068,6420)',
        vr: 'CS',
        vm: '1',
        name: 'DegreeOfFreedomType'
    },
    '(0068,6430)': {
        tag: '(0068,6430)',
        vr: 'SQ',
        vm: '1',
        name: 'TwoDMatingFeatureCoordinatesSequence'
    },
    '(0068,6440)': {
        tag: '(0068,6440)',
        vr: 'US',
        vm: '1',
        name: 'ReferencedHPGLDocumentID'
    },
    '(0068,6450)': {
        tag: '(0068,6450)',
        vr: 'FD',
        vm: '2',
        name: 'TwoDMatingPoint'
    },
    '(0068,6460)': {
        tag: '(0068,6460)',
        vr: 'FD',
        vm: '4',
        name: 'TwoDMatingAxes'
    },
    '(0068,6470)': {
        tag: '(0068,6470)',
        vr: 'SQ',
        vm: '1',
        name: 'TwoDDegreeOfFreedomSequence'
    },
    '(0068,6490)': {
        tag: '(0068,6490)',
        vr: 'FD',
        vm: '3',
        name: 'ThreeDDegreeOfFreedomAxis'
    },
    '(0068,64A0)': {
        tag: '(0068,64A0)',
        vr: 'FD',
        vm: '2',
        name: 'RangeOfFreedom'
    },
    '(0068,64C0)': {
        tag: '(0068,64C0)',
        vr: 'FD',
        vm: '3',
        name: 'ThreeDMatingPoint'
    },
    '(0068,64D0)': {
        tag: '(0068,64D0)',
        vr: 'FD',
        vm: '9',
        name: 'ThreeDMatingAxes'
    },
    '(0068,64F0)': {
        tag: '(0068,64F0)',
        vr: 'FD',
        vm: '3',
        name: 'TwoDDegreeOfFreedomAxis'
    },
    '(0068,6500)': {
        tag: '(0068,6500)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanningLandmarkPointSequence'
    },
    '(0068,6510)': {
        tag: '(0068,6510)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanningLandmarkLineSequence'
    },
    '(0068,6520)': {
        tag: '(0068,6520)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanningLandmarkPlaneSequence'
    },
    '(0068,6530)': {
        tag: '(0068,6530)',
        vr: 'US',
        vm: '1',
        name: 'PlanningLandmarkID'
    },
    '(0068,6540)': {
        tag: '(0068,6540)',
        vr: 'LO',
        vm: '1',
        name: 'PlanningLandmarkDescription'
    },
    '(0068,6545)': {
        tag: '(0068,6545)',
        vr: 'SQ',
        vm: '1',
        name: 'PlanningLandmarkIdentificationCodeSequence'
    },
    '(0068,6550)': {
        tag: '(0068,6550)',
        vr: 'SQ',
        vm: '1',
        name: 'TwoDPointCoordinatesSequence'
    },
    '(0068,6560)': {
        tag: '(0068,6560)',
        vr: 'FD',
        vm: '2',
        name: 'TwoDPointCoordinates'
    },
    '(0068,6590)': {
        tag: '(0068,6590)',
        vr: 'FD',
        vm: '3',
        name: 'ThreeDPointCoordinates'
    },
    '(0068,65A0)': {
        tag: '(0068,65A0)',
        vr: 'SQ',
        vm: '1',
        name: 'TwoDLineCoordinatesSequence'
    },
    '(0068,65B0)': {
        tag: '(0068,65B0)',
        vr: 'FD',
        vm: '4',
        name: 'TwoDLineCoordinates'
    },
    '(0068,65D0)': {
        tag: '(0068,65D0)',
        vr: 'FD',
        vm: '6',
        name: 'ThreeDLineCoordinates'
    },
    '(0068,65E0)': {
        tag: '(0068,65E0)',
        vr: 'SQ',
        vm: '1',
        name: 'TwoDPlaneCoordinatesSequence'
    },
    '(0068,65F0)': {
        tag: '(0068,65F0)',
        vr: 'FD',
        vm: '4',
        name: 'TwoDPlaneIntersection'
    },
    '(0068,6610)': {
        tag: '(0068,6610)',
        vr: 'FD',
        vm: '3',
        name: 'ThreeDPlaneOrigin'
    },
    '(0068,6620)': {
        tag: '(0068,6620)',
        vr: 'FD',
        vm: '3',
        name: 'ThreeDPlaneNormal'
    },
    '(0070,0001)': {
        tag: '(0070,0001)',
        vr: 'SQ',
        vm: '1',
        name: 'GraphicAnnotationSequence'
    },
    '(0070,0002)': {
        tag: '(0070,0002)',
        vr: 'CS',
        vm: '1',
        name: 'GraphicLayer'
    },
    '(0070,0003)': {
        tag: '(0070,0003)',
        vr: 'CS',
        vm: '1',
        name: 'BoundingBoxAnnotationUnits'
    },
    '(0070,0004)': {
        tag: '(0070,0004)',
        vr: 'CS',
        vm: '1',
        name: 'AnchorPointAnnotationUnits'
    },
    '(0070,0005)': {
        tag: '(0070,0005)',
        vr: 'CS',
        vm: '1',
        name: 'GraphicAnnotationUnits'
    },
    '(0070,0006)': {
        tag: '(0070,0006)',
        vr: 'ST',
        vm: '1',
        name: 'UnformattedTextValue'
    },
    '(0070,0008)': {
        tag: '(0070,0008)',
        vr: 'SQ',
        vm: '1',
        name: 'TextObjectSequence'
    },
    '(0070,0009)': {
        tag: '(0070,0009)',
        vr: 'SQ',
        vm: '1',
        name: 'GraphicObjectSequence'
    },
    '(0070,0010)': {
        tag: '(0070,0010)',
        vr: 'FL',
        vm: '2',
        name: 'BoundingBoxTopLeftHandCorner'
    },
    '(0070,0011)': {
        tag: '(0070,0011)',
        vr: 'FL',
        vm: '2',
        name: 'BoundingBoxBottomRightHandCorner'
    },
    '(0070,0012)': {
        tag: '(0070,0012)',
        vr: 'CS',
        vm: '1',
        name: 'BoundingBoxTextHorizontalJustification'
    },
    '(0070,0014)': {
        tag: '(0070,0014)',
        vr: 'FL',
        vm: '2',
        name: 'AnchorPoint'
    },
    '(0070,0015)': {
        tag: '(0070,0015)',
        vr: 'CS',
        vm: '1',
        name: 'AnchorPointVisibility'
    },
    '(0070,0020)': {
        tag: '(0070,0020)',
        vr: 'US',
        vm: '1',
        name: 'GraphicDimensions'
    },
    '(0070,0021)': {
        tag: '(0070,0021)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfGraphicPoints'
    },
    '(0070,0022)': {
        tag: '(0070,0022)',
        vr: 'FL',
        vm: '2-n',
        name: 'GraphicData'
    },
    '(0070,0023)': {
        tag: '(0070,0023)',
        vr: 'CS',
        vm: '1',
        name: 'GraphicType'
    },
    '(0070,0024)': {
        tag: '(0070,0024)',
        vr: 'CS',
        vm: '1',
        name: 'GraphicFilled'
    },
    '(0070,0040)': {
        tag: '(0070,0040)',
        vr: 'IS',
        vm: '1',
        name: 'ImageRotationRetired'
    },
    '(0070,0041)': {
        tag: '(0070,0041)',
        vr: 'CS',
        vm: '1',
        name: 'ImageHorizontalFlip'
    },
    '(0070,0042)': {
        tag: '(0070,0042)',
        vr: 'US',
        vm: '1',
        name: 'ImageRotation'
    },
    '(0070,0050)': {
        tag: '(0070,0050)',
        vr: 'US',
        vm: '2',
        name: 'DisplayedAreaTopLeftHandCornerTrial'
    },
    '(0070,0051)': {
        tag: '(0070,0051)',
        vr: 'US',
        vm: '2',
        name: 'DisplayedAreaBottomRightHandCornerTrial'
    },
    '(0070,0052)': {
        tag: '(0070,0052)',
        vr: 'SL',
        vm: '2',
        name: 'DisplayedAreaTopLeftHandCorner'
    },
    '(0070,0053)': {
        tag: '(0070,0053)',
        vr: 'SL',
        vm: '2',
        name: 'DisplayedAreaBottomRightHandCorner'
    },
    '(0070,005A)': {
        tag: '(0070,005A)',
        vr: 'SQ',
        vm: '1',
        name: 'DisplayedAreaSelectionSequence'
    },
    '(0070,0060)': {
        tag: '(0070,0060)',
        vr: 'SQ',
        vm: '1',
        name: 'GraphicLayerSequence'
    },
    '(0070,0062)': {
        tag: '(0070,0062)',
        vr: 'IS',
        vm: '1',
        name: 'GraphicLayerOrder'
    },
    '(0070,0066)': {
        tag: '(0070,0066)',
        vr: 'US',
        vm: '1',
        name: 'GraphicLayerRecommendedDisplayGrayscaleValue'
    },
    '(0070,0067)': {
        tag: '(0070,0067)',
        vr: 'US',
        vm: '3',
        name: 'GraphicLayerRecommendedDisplayRGBValue'
    },
    '(0070,0068)': {
        tag: '(0070,0068)',
        vr: 'LO',
        vm: '1',
        name: 'GraphicLayerDescription'
    },
    '(0070,0080)': {
        tag: '(0070,0080)',
        vr: 'CS',
        vm: '1',
        name: 'ContentLabel'
    },
    '(0070,0081)': {
        tag: '(0070,0081)',
        vr: 'LO',
        vm: '1',
        name: 'ContentDescription'
    },
    '(0070,0082)': {
        tag: '(0070,0082)',
        vr: 'DA',
        vm: '1',
        name: 'PresentationCreationDate'
    },
    '(0070,0083)': {
        tag: '(0070,0083)',
        vr: 'TM',
        vm: '1',
        name: 'PresentationCreationTime'
    },
    '(0070,0084)': {
        tag: '(0070,0084)',
        vr: 'PN',
        vm: '1',
        name: 'ContentCreatorName'
    },
    '(0070,0086)': {
        tag: '(0070,0086)',
        vr: 'SQ',
        vm: '1',
        name: 'ContentCreatorIdentificationCodeSequence'
    },
    '(0070,0087)': {
        tag: '(0070,0087)',
        vr: 'SQ',
        vm: '1',
        name: 'AlternateContentDescriptionSequence'
    },
    '(0070,0100)': {
        tag: '(0070,0100)',
        vr: 'CS',
        vm: '1',
        name: 'PresentationSizeMode'
    },
    '(0070,0101)': {
        tag: '(0070,0101)',
        vr: 'DS',
        vm: '2',
        name: 'PresentationPixelSpacing'
    },
    '(0070,0102)': {
        tag: '(0070,0102)',
        vr: 'IS',
        vm: '2',
        name: 'PresentationPixelAspectRatio'
    },
    '(0070,0103)': {
        tag: '(0070,0103)',
        vr: 'FL',
        vm: '1',
        name: 'PresentationPixelMagnificationRatio'
    },
    '(0070,0207)': {
        tag: '(0070,0207)',
        vr: 'LO',
        vm: '1',
        name: 'GraphicGroupLabel'
    },
    '(0070,0208)': {
        tag: '(0070,0208)',
        vr: 'ST',
        vm: '1',
        name: 'GraphicGroupDescription'
    },
    '(0070,0209)': {
        tag: '(0070,0209)',
        vr: 'SQ',
        vm: '1',
        name: 'CompoundGraphicSequence'
    },
    '(0070,0226)': {
        tag: '(0070,0226)',
        vr: 'UL',
        vm: '1',
        name: 'CompoundGraphicInstanceID'
    },
    '(0070,0227)': {
        tag: '(0070,0227)',
        vr: 'LO',
        vm: '1',
        name: 'FontName'
    },
    '(0070,0228)': {
        tag: '(0070,0228)',
        vr: 'CS',
        vm: '1',
        name: 'FontNameType'
    },
    '(0070,0229)': {
        tag: '(0070,0229)',
        vr: 'LO',
        vm: '1',
        name: 'CSSFontName'
    },
    '(0070,0230)': {
        tag: '(0070,0230)',
        vr: 'FD',
        vm: '1',
        name: 'RotationAngle'
    },
    '(0070,0231)': {
        tag: '(0070,0231)',
        vr: 'SQ',
        vm: '1',
        name: 'TextStyleSequence'
    },
    '(0070,0232)': {
        tag: '(0070,0232)',
        vr: 'SQ',
        vm: '1',
        name: 'LineStyleSequence'
    },
    '(0070,0233)': {
        tag: '(0070,0233)',
        vr: 'SQ',
        vm: '1',
        name: 'FillStyleSequence'
    },
    '(0070,0234)': {
        tag: '(0070,0234)',
        vr: 'SQ',
        vm: '1',
        name: 'GraphicGroupSequence'
    },
    '(0070,0241)': {
        tag: '(0070,0241)',
        vr: 'US',
        vm: '3',
        name: 'TextColorCIELabValue'
    },
    '(0070,0242)': {
        tag: '(0070,0242)',
        vr: 'CS',
        vm: '1',
        name: 'HorizontalAlignment'
    },
    '(0070,0243)': {
        tag: '(0070,0243)',
        vr: 'CS',
        vm: '1',
        name: 'VerticalAlignment'
    },
    '(0070,0244)': {
        tag: '(0070,0244)',
        vr: 'CS',
        vm: '1',
        name: 'ShadowStyle'
    },
    '(0070,0245)': {
        tag: '(0070,0245)',
        vr: 'FL',
        vm: '1',
        name: 'ShadowOffsetX'
    },
    '(0070,0246)': {
        tag: '(0070,0246)',
        vr: 'FL',
        vm: '1',
        name: 'ShadowOffsetY'
    },
    '(0070,0247)': {
        tag: '(0070,0247)',
        vr: 'US',
        vm: '3',
        name: 'ShadowColorCIELabValue'
    },
    '(0070,0248)': {
        tag: '(0070,0248)',
        vr: 'CS',
        vm: '1',
        name: 'Underlined'
    },
    '(0070,0249)': {
        tag: '(0070,0249)',
        vr: 'CS',
        vm: '1',
        name: 'Bold'
    },
    '(0070,0250)': {
        tag: '(0070,0250)',
        vr: 'CS',
        vm: '1',
        name: 'Italic'
    },
    '(0070,0251)': {
        tag: '(0070,0251)',
        vr: 'US',
        vm: '3',
        name: 'PatternOnColorCIELabValue'
    },
    '(0070,0252)': {
        tag: '(0070,0252)',
        vr: 'US',
        vm: '3',
        name: 'PatternOffColorCIELabValue'
    },
    '(0070,0253)': {
        tag: '(0070,0253)',
        vr: 'FL',
        vm: '1',
        name: 'LineThickness'
    },
    '(0070,0254)': {
        tag: '(0070,0254)',
        vr: 'CS',
        vm: '1',
        name: 'LineDashingStyle'
    },
    '(0070,0255)': {
        tag: '(0070,0255)',
        vr: 'UL',
        vm: '1',
        name: 'LinePattern'
    },
    '(0070,0256)': {
        tag: '(0070,0256)',
        vr: 'OB',
        vm: '1',
        name: 'FillPattern'
    },
    '(0070,0257)': {
        tag: '(0070,0257)',
        vr: 'CS',
        vm: '1',
        name: 'FillMode'
    },
    '(0070,0258)': {
        tag: '(0070,0258)',
        vr: 'FL',
        vm: '1',
        name: 'ShadowOpacity'
    },
    '(0070,0261)': {
        tag: '(0070,0261)',
        vr: 'FL',
        vm: '1',
        name: 'GapLength'
    },
    '(0070,0262)': {
        tag: '(0070,0262)',
        vr: 'FL',
        vm: '1',
        name: 'DiameterOfVisibility'
    },
    '(0070,0273)': {
        tag: '(0070,0273)',
        vr: 'FL',
        vm: '2',
        name: 'RotationPoint'
    },
    '(0070,0274)': {
        tag: '(0070,0274)',
        vr: 'CS',
        vm: '1',
        name: 'TickAlignment'
    },
    '(0070,0278)': {
        tag: '(0070,0278)',
        vr: 'CS',
        vm: '1',
        name: 'ShowTickLabel'
    },
    '(0070,0279)': {
        tag: '(0070,0279)',
        vr: 'CS',
        vm: '1',
        name: 'TickLabelAlignment'
    },
    '(0070,0282)': {
        tag: '(0070,0282)',
        vr: 'CS',
        vm: '1',
        name: 'CompoundGraphicUnits'
    },
    '(0070,0284)': {
        tag: '(0070,0284)',
        vr: 'FL',
        vm: '1',
        name: 'PatternOnOpacity'
    },
    '(0070,0285)': {
        tag: '(0070,0285)',
        vr: 'FL',
        vm: '1',
        name: 'PatternOffOpacity'
    },
    '(0070,0287)': {
        tag: '(0070,0287)',
        vr: 'SQ',
        vm: '1',
        name: 'MajorTicksSequence'
    },
    '(0070,0288)': {
        tag: '(0070,0288)',
        vr: 'FL',
        vm: '1',
        name: 'TickPosition'
    },
    '(0070,0289)': {
        tag: '(0070,0289)',
        vr: 'SH',
        vm: '1',
        name: 'TickLabel'
    },
    '(0070,0294)': {
        tag: '(0070,0294)',
        vr: 'CS',
        vm: '1',
        name: 'CompoundGraphicType'
    },
    '(0070,0295)': {
        tag: '(0070,0295)',
        vr: 'UL',
        vm: '1',
        name: 'GraphicGroupID'
    },
    '(0070,0306)': {
        tag: '(0070,0306)',
        vr: 'CS',
        vm: '1',
        name: 'ShapeType'
    },
    '(0070,0308)': {
        tag: '(0070,0308)',
        vr: 'SQ',
        vm: '1',
        name: 'RegistrationSequence'
    },
    '(0070,0309)': {
        tag: '(0070,0309)',
        vr: 'SQ',
        vm: '1',
        name: 'MatrixRegistrationSequence'
    },
    '(0070,030A)': {
        tag: '(0070,030A)',
        vr: 'SQ',
        vm: '1',
        name: 'MatrixSequence'
    },
    '(0070,030C)': {
        tag: '(0070,030C)',
        vr: 'CS',
        vm: '1',
        name: 'FrameOfReferenceTransformationMatrixType'
    },
    '(0070,030D)': {
        tag: '(0070,030D)',
        vr: 'SQ',
        vm: '1',
        name: 'RegistrationTypeCodeSequence'
    },
    '(0070,030F)': {
        tag: '(0070,030F)',
        vr: 'ST',
        vm: '1',
        name: 'FiducialDescription'
    },
    '(0070,0310)': {
        tag: '(0070,0310)',
        vr: 'SH',
        vm: '1',
        name: 'FiducialIdentifier'
    },
    '(0070,0311)': {
        tag: '(0070,0311)',
        vr: 'SQ',
        vm: '1',
        name: 'FiducialIdentifierCodeSequence'
    },
    '(0070,0312)': {
        tag: '(0070,0312)',
        vr: 'FD',
        vm: '1',
        name: 'ContourUncertaintyRadius'
    },
    '(0070,0314)': {
        tag: '(0070,0314)',
        vr: 'SQ',
        vm: '1',
        name: 'UsedFiducialsSequence'
    },
    '(0070,0318)': {
        tag: '(0070,0318)',
        vr: 'SQ',
        vm: '1',
        name: 'GraphicCoordinatesDataSequence'
    },
    '(0070,031A)': {
        tag: '(0070,031A)',
        vr: 'UI',
        vm: '1',
        name: 'FiducialUID'
    },
    '(0070,031C)': {
        tag: '(0070,031C)',
        vr: 'SQ',
        vm: '1',
        name: 'FiducialSetSequence'
    },
    '(0070,031E)': {
        tag: '(0070,031E)',
        vr: 'SQ',
        vm: '1',
        name: 'FiducialSequence'
    },
    '(0070,0401)': {
        tag: '(0070,0401)',
        vr: 'US',
        vm: '3',
        name: 'GraphicLayerRecommendedDisplayCIELabValue'
    },
    '(0070,0402)': {
        tag: '(0070,0402)',
        vr: 'SQ',
        vm: '1',
        name: 'BlendingSequence'
    },
    '(0070,0403)': {
        tag: '(0070,0403)',
        vr: 'FL',
        vm: '1',
        name: 'RelativeOpacity'
    },
    '(0070,0404)': {
        tag: '(0070,0404)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedSpatialRegistrationSequence'
    },
    '(0070,0405)': {
        tag: '(0070,0405)',
        vr: 'CS',
        vm: '1',
        name: 'BlendingPosition'
    },
    '(0072,0002)': {
        tag: '(0072,0002)',
        vr: 'SH',
        vm: '1',
        name: 'HangingProtocolName'
    },
    '(0072,0004)': {
        tag: '(0072,0004)',
        vr: 'LO',
        vm: '1',
        name: 'HangingProtocolDescription'
    },
    '(0072,0006)': {
        tag: '(0072,0006)',
        vr: 'CS',
        vm: '1',
        name: 'HangingProtocolLevel'
    },
    '(0072,0008)': {
        tag: '(0072,0008)',
        vr: 'LO',
        vm: '1',
        name: 'HangingProtocolCreator'
    },
    '(0072,000A)': {
        tag: '(0072,000A)',
        vr: 'DT',
        vm: '1',
        name: 'HangingProtocolCreationDateTime'
    },
    '(0072,000C)': {
        tag: '(0072,000C)',
        vr: 'SQ',
        vm: '1',
        name: 'HangingProtocolDefinitionSequence'
    },
    '(0072,000E)': {
        tag: '(0072,000E)',
        vr: 'SQ',
        vm: '1',
        name: 'HangingProtocolUserIdentificationCodeSequence'
    },
    '(0072,0010)': {
        tag: '(0072,0010)',
        vr: 'LO',
        vm: '1',
        name: 'HangingProtocolUserGroupName'
    },
    '(0072,0012)': {
        tag: '(0072,0012)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceHangingProtocolSequence'
    },
    '(0072,0014)': {
        tag: '(0072,0014)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfPriorsReferenced'
    },
    '(0072,0020)': {
        tag: '(0072,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageSetsSequence'
    },
    '(0072,0022)': {
        tag: '(0072,0022)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageSetSelectorSequence'
    },
    '(0072,0024)': {
        tag: '(0072,0024)',
        vr: 'CS',
        vm: '1',
        name: 'ImageSetSelectorUsageFlag'
    },
    '(0072,0026)': {
        tag: '(0072,0026)',
        vr: 'AT',
        vm: '1',
        name: 'SelectorAttribute'
    },
    '(0072,0028)': {
        tag: '(0072,0028)',
        vr: 'US',
        vm: '1',
        name: 'SelectorValueNumber'
    },
    '(0072,0030)': {
        tag: '(0072,0030)',
        vr: 'SQ',
        vm: '1',
        name: 'TimeBasedImageSetsSequence'
    },
    '(0072,0032)': {
        tag: '(0072,0032)',
        vr: 'US',
        vm: '1',
        name: 'ImageSetNumber'
    },
    '(0072,0034)': {
        tag: '(0072,0034)',
        vr: 'CS',
        vm: '1',
        name: 'ImageSetSelectorCategory'
    },
    '(0072,0038)': {
        tag: '(0072,0038)',
        vr: 'US',
        vm: '2',
        name: 'RelativeTime'
    },
    '(0072,003A)': {
        tag: '(0072,003A)',
        vr: 'CS',
        vm: '1',
        name: 'RelativeTimeUnits'
    },
    '(0072,003C)': {
        tag: '(0072,003C)',
        vr: 'SS',
        vm: '2',
        name: 'AbstractPriorValue'
    },
    '(0072,003E)': {
        tag: '(0072,003E)',
        vr: 'SQ',
        vm: '1',
        name: 'AbstractPriorCodeSequence'
    },
    '(0072,0040)': {
        tag: '(0072,0040)',
        vr: 'LO',
        vm: '1',
        name: 'ImageSetLabel'
    },
    '(0072,0050)': {
        tag: '(0072,0050)',
        vr: 'CS',
        vm: '1',
        name: 'SelectorAttributeVR'
    },
    '(0072,0052)': {
        tag: '(0072,0052)',
        vr: 'AT',
        vm: '1-n',
        name: 'SelectorSequencePointer'
    },
    '(0072,0054)': {
        tag: '(0072,0054)',
        vr: 'LO',
        vm: '1-n',
        name: 'SelectorSequencePointerPrivateCreator'
    },
    '(0072,0056)': {
        tag: '(0072,0056)',
        vr: 'LO',
        vm: '1',
        name: 'SelectorAttributePrivateCreator'
    },
    '(0072,0060)': {
        tag: '(0072,0060)',
        vr: 'AT',
        vm: '1-n',
        name: 'SelectorATValue'
    },
    '(0072,0062)': {
        tag: '(0072,0062)',
        vr: 'CS',
        vm: '1-n',
        name: 'SelectorCSValue'
    },
    '(0072,0064)': {
        tag: '(0072,0064)',
        vr: 'IS',
        vm: '1-n',
        name: 'SelectorISValue'
    },
    '(0072,0066)': {
        tag: '(0072,0066)',
        vr: 'LO',
        vm: '1-n',
        name: 'SelectorLOValue'
    },
    '(0072,0068)': {
        tag: '(0072,0068)',
        vr: 'LT',
        vm: '1',
        name: 'SelectorLTValue'
    },
    '(0072,006A)': {
        tag: '(0072,006A)',
        vr: 'PN',
        vm: '1-n',
        name: 'SelectorPNValue'
    },
    '(0072,006C)': {
        tag: '(0072,006C)',
        vr: 'SH',
        vm: '1-n',
        name: 'SelectorSHValue'
    },
    '(0072,006E)': {
        tag: '(0072,006E)',
        vr: 'ST',
        vm: '1',
        name: 'SelectorSTValue'
    },
    '(0072,0070)': {
        tag: '(0072,0070)',
        vr: 'UT',
        vm: '1',
        name: 'SelectorUTValue'
    },
    '(0072,0072)': {
        tag: '(0072,0072)',
        vr: 'DS',
        vm: '1-n',
        name: 'SelectorDSValue'
    },
    '(0072,0074)': {
        tag: '(0072,0074)',
        vr: 'FD',
        vm: '1-n',
        name: 'SelectorFDValue'
    },
    '(0072,0076)': {
        tag: '(0072,0076)',
        vr: 'FL',
        vm: '1-n',
        name: 'SelectorFLValue'
    },
    '(0072,0078)': {
        tag: '(0072,0078)',
        vr: 'UL',
        vm: '1-n',
        name: 'SelectorULValue'
    },
    '(0072,007A)': {
        tag: '(0072,007A)',
        vr: 'US',
        vm: '1-n',
        name: 'SelectorUSValue'
    },
    '(0072,007C)': {
        tag: '(0072,007C)',
        vr: 'SL',
        vm: '1-n',
        name: 'SelectorSLValue'
    },
    '(0072,007E)': {
        tag: '(0072,007E)',
        vr: 'SS',
        vm: '1-n',
        name: 'SelectorSSValue'
    },
    '(0072,0080)': {
        tag: '(0072,0080)',
        vr: 'SQ',
        vm: '1',
        name: 'SelectorCodeSequenceValue'
    },
    '(0072,0100)': {
        tag: '(0072,0100)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfScreens'
    },
    '(0072,0102)': {
        tag: '(0072,0102)',
        vr: 'SQ',
        vm: '1',
        name: 'NominalScreenDefinitionSequence'
    },
    '(0072,0104)': {
        tag: '(0072,0104)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfVerticalPixels'
    },
    '(0072,0106)': {
        tag: '(0072,0106)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfHorizontalPixels'
    },
    '(0072,0108)': {
        tag: '(0072,0108)',
        vr: 'FD',
        vm: '4',
        name: 'DisplayEnvironmentSpatialPosition'
    },
    '(0072,010A)': {
        tag: '(0072,010A)',
        vr: 'US',
        vm: '1',
        name: 'ScreenMinimumGrayscaleBitDepth'
    },
    '(0072,010C)': {
        tag: '(0072,010C)',
        vr: 'US',
        vm: '1',
        name: 'ScreenMinimumColorBitDepth'
    },
    '(0072,010E)': {
        tag: '(0072,010E)',
        vr: 'US',
        vm: '1',
        name: 'ApplicationMaximumRepaintTime'
    },
    '(0072,0200)': {
        tag: '(0072,0200)',
        vr: 'SQ',
        vm: '1',
        name: 'DisplaySetsSequence'
    },
    '(0072,0202)': {
        tag: '(0072,0202)',
        vr: 'US',
        vm: '1',
        name: 'DisplaySetNumber'
    },
    '(0072,0203)': {
        tag: '(0072,0203)',
        vr: 'LO',
        vm: '1',
        name: 'DisplaySetLabel'
    },
    '(0072,0204)': {
        tag: '(0072,0204)',
        vr: 'US',
        vm: '1',
        name: 'DisplaySetPresentationGroup'
    },
    '(0072,0206)': {
        tag: '(0072,0206)',
        vr: 'LO',
        vm: '1',
        name: 'DisplaySetPresentationGroupDescription'
    },
    '(0072,0208)': {
        tag: '(0072,0208)',
        vr: 'CS',
        vm: '1',
        name: 'PartialDataDisplayHandling'
    },
    '(0072,0210)': {
        tag: '(0072,0210)',
        vr: 'SQ',
        vm: '1',
        name: 'SynchronizedScrollingSequence'
    },
    '(0072,0212)': {
        tag: '(0072,0212)',
        vr: 'US',
        vm: '2-n',
        name: 'DisplaySetScrollingGroup'
    },
    '(0072,0214)': {
        tag: '(0072,0214)',
        vr: 'SQ',
        vm: '1',
        name: 'NavigationIndicatorSequence'
    },
    '(0072,0216)': {
        tag: '(0072,0216)',
        vr: 'US',
        vm: '1',
        name: 'NavigationDisplaySet'
    },
    '(0072,0218)': {
        tag: '(0072,0218)',
        vr: 'US',
        vm: '1-n',
        name: 'ReferenceDisplaySets'
    },
    '(0072,0300)': {
        tag: '(0072,0300)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageBoxesSequence'
    },
    '(0072,0302)': {
        tag: '(0072,0302)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxNumber'
    },
    '(0072,0304)': {
        tag: '(0072,0304)',
        vr: 'CS',
        vm: '1',
        name: 'ImageBoxLayoutType'
    },
    '(0072,0306)': {
        tag: '(0072,0306)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxTileHorizontalDimension'
    },
    '(0072,0308)': {
        tag: '(0072,0308)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxTileVerticalDimension'
    },
    '(0072,0310)': {
        tag: '(0072,0310)',
        vr: 'CS',
        vm: '1',
        name: 'ImageBoxScrollDirection'
    },
    '(0072,0312)': {
        tag: '(0072,0312)',
        vr: 'CS',
        vm: '1',
        name: 'ImageBoxSmallScrollType'
    },
    '(0072,0314)': {
        tag: '(0072,0314)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxSmallScrollAmount'
    },
    '(0072,0316)': {
        tag: '(0072,0316)',
        vr: 'CS',
        vm: '1',
        name: 'ImageBoxLargeScrollType'
    },
    '(0072,0318)': {
        tag: '(0072,0318)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxLargeScrollAmount'
    },
    '(0072,0320)': {
        tag: '(0072,0320)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxOverlapPriority'
    },
    '(0072,0330)': {
        tag: '(0072,0330)',
        vr: 'FD',
        vm: '1',
        name: 'CineRelativeToRealTime'
    },
    '(0072,0400)': {
        tag: '(0072,0400)',
        vr: 'SQ',
        vm: '1',
        name: 'FilterOperationsSequence'
    },
    '(0072,0402)': {
        tag: '(0072,0402)',
        vr: 'CS',
        vm: '1',
        name: 'FilterByCategory'
    },
    '(0072,0404)': {
        tag: '(0072,0404)',
        vr: 'CS',
        vm: '1',
        name: 'FilterByAttributePresence'
    },
    '(0072,0406)': {
        tag: '(0072,0406)',
        vr: 'CS',
        vm: '1',
        name: 'FilterByOperator'
    },
    '(0072,0420)': {
        tag: '(0072,0420)',
        vr: 'US',
        vm: '3',
        name: 'StructuredDisplayBackgroundCIELabValue'
    },
    '(0072,0421)': {
        tag: '(0072,0421)',
        vr: 'US',
        vm: '3',
        name: 'EmptyImageBoxCIELabValue'
    },
    '(0072,0422)': {
        tag: '(0072,0422)',
        vr: 'SQ',
        vm: '1',
        name: 'StructuredDisplayImageBoxSequence'
    },
    '(0072,0424)': {
        tag: '(0072,0424)',
        vr: 'SQ',
        vm: '1',
        name: 'StructuredDisplayTextBoxSequence'
    },
    '(0072,0427)': {
        tag: '(0072,0427)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedFirstFrameSequence'
    },
    '(0072,0430)': {
        tag: '(0072,0430)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageBoxSynchronizationSequence'
    },
    '(0072,0432)': {
        tag: '(0072,0432)',
        vr: 'US',
        vm: '2-n',
        name: 'SynchronizedImageBoxList'
    },
    '(0072,0434)': {
        tag: '(0072,0434)',
        vr: 'CS',
        vm: '1',
        name: 'TypeOfSynchronization'
    },
    '(0072,0500)': {
        tag: '(0072,0500)',
        vr: 'CS',
        vm: '1',
        name: 'BlendingOperationType'
    },
    '(0072,0510)': {
        tag: '(0072,0510)',
        vr: 'CS',
        vm: '1',
        name: 'ReformattingOperationType'
    },
    '(0072,0512)': {
        tag: '(0072,0512)',
        vr: 'FD',
        vm: '1',
        name: 'ReformattingThickness'
    },
    '(0072,0514)': {
        tag: '(0072,0514)',
        vr: 'FD',
        vm: '1',
        name: 'ReformattingInterval'
    },
    '(0072,0516)': {
        tag: '(0072,0516)',
        vr: 'CS',
        vm: '1',
        name: 'ReformattingOperationInitialViewDirection'
    },
    '(0072,0520)': {
        tag: '(0072,0520)',
        vr: 'CS',
        vm: '1-n',
        name: 'ThreeDRenderingType'
    },
    '(0072,0600)': {
        tag: '(0072,0600)',
        vr: 'SQ',
        vm: '1',
        name: 'SortingOperationsSequence'
    },
    '(0072,0602)': {
        tag: '(0072,0602)',
        vr: 'CS',
        vm: '1',
        name: 'SortByCategory'
    },
    '(0072,0604)': {
        tag: '(0072,0604)',
        vr: 'CS',
        vm: '1',
        name: 'SortingDirection'
    },
    '(0072,0700)': {
        tag: '(0072,0700)',
        vr: 'CS',
        vm: '2',
        name: 'DisplaySetPatientOrientation'
    },
    '(0072,0702)': {
        tag: '(0072,0702)',
        vr: 'CS',
        vm: '1',
        name: 'VOIType'
    },
    '(0072,0704)': {
        tag: '(0072,0704)',
        vr: 'CS',
        vm: '1',
        name: 'PseudoColorType'
    },
    '(0072,0705)': {
        tag: '(0072,0705)',
        vr: 'SQ',
        vm: '1',
        name: 'PseudoColorPaletteInstanceReferenceSequence'
    },
    '(0072,0706)': {
        tag: '(0072,0706)',
        vr: 'CS',
        vm: '1',
        name: 'ShowGrayscaleInverted'
    },
    '(0072,0710)': {
        tag: '(0072,0710)',
        vr: 'CS',
        vm: '1',
        name: 'ShowImageTrueSizeFlag'
    },
    '(0072,0712)': {
        tag: '(0072,0712)',
        vr: 'CS',
        vm: '1',
        name: 'ShowGraphicAnnotationFlag'
    },
    '(0072,0714)': {
        tag: '(0072,0714)',
        vr: 'CS',
        vm: '1',
        name: 'ShowPatientDemographicsFlag'
    },
    '(0072,0716)': {
        tag: '(0072,0716)',
        vr: 'CS',
        vm: '1',
        name: 'ShowAcquisitionTechniquesFlag'
    },
    '(0072,0717)': {
        tag: '(0072,0717)',
        vr: 'CS',
        vm: '1',
        name: 'DisplaySetHorizontalJustification'
    },
    '(0072,0718)': {
        tag: '(0072,0718)',
        vr: 'CS',
        vm: '1',
        name: 'DisplaySetVerticalJustification'
    },
    '(0074,0120)': {
        tag: '(0074,0120)',
        vr: 'FD',
        vm: '1',
        name: 'ContinuationStartMeterset'
    },
    '(0074,0121)': {
        tag: '(0074,0121)',
        vr: 'FD',
        vm: '1',
        name: 'ContinuationEndMeterset'
    },
    '(0074,1000)': {
        tag: '(0074,1000)',
        vr: 'CS',
        vm: '1',
        name: 'ProcedureStepState'
    },
    '(0074,1002)': {
        tag: '(0074,1002)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureStepProgressInformationSequence'
    },
    '(0074,1004)': {
        tag: '(0074,1004)',
        vr: 'DS',
        vm: '1',
        name: 'ProcedureStepProgress'
    },
    '(0074,1006)': {
        tag: '(0074,1006)',
        vr: 'ST',
        vm: '1',
        name: 'ProcedureStepProgressDescription'
    },
    '(0074,1008)': {
        tag: '(0074,1008)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureStepCommunicationsURISequence'
    },
    '(0074,100a)': {
        tag: '(0074,100a)',
        vr: 'ST',
        vm: '1',
        name: 'ContactURI'
    },
    '(0074,100c)': {
        tag: '(0074,100c)',
        vr: 'LO',
        vm: '1',
        name: 'ContactDisplayName'
    },
    '(0074,100e)': {
        tag: '(0074,100e)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureStepDiscontinuationReasonCodeSequence'
    },
    '(0074,1020)': {
        tag: '(0074,1020)',
        vr: 'SQ',
        vm: '1',
        name: 'BeamTaskSequence'
    },
    '(0074,1022)': {
        tag: '(0074,1022)',
        vr: 'CS',
        vm: '1',
        name: 'BeamTaskType'
    },
    '(0074,1024)': {
        tag: '(0074,1024)',
        vr: 'IS',
        vm: '1',
        name: 'BeamOrderIndexTrial'
    },
    '(0074,1026)': {
        tag: '(0074,1026)',
        vr: 'FD',
        vm: '1',
        name: 'TableTopVerticalAdjustedPosition'
    },
    '(0074,1027)': {
        tag: '(0074,1027)',
        vr: 'FD',
        vm: '1',
        name: 'TableTopLongitudinalAdjustedPosition'
    },
    '(0074,1028)': {
        tag: '(0074,1028)',
        vr: 'FD',
        vm: '1',
        name: 'TableTopLateralAdjustedPosition'
    },
    '(0074,102A)': {
        tag: '(0074,102A)',
        vr: 'FD',
        vm: '1',
        name: 'PatientSupportAdjustedAngle'
    },
    '(0074,102B)': {
        tag: '(0074,102B)',
        vr: 'FD',
        vm: '1',
        name: 'TableTopEccentricAdjustedAngle'
    },
    '(0074,102C)': {
        tag: '(0074,102C)',
        vr: 'FD',
        vm: '1',
        name: 'TableTopPitchAdjustedAngle'
    },
    '(0074,102D)': {
        tag: '(0074,102D)',
        vr: 'FD',
        vm: '1',
        name: 'TableTopRollAdjustedAngle'
    },
    '(0074,1030)': {
        tag: '(0074,1030)',
        vr: 'SQ',
        vm: '1',
        name: 'DeliveryVerificationImageSequence'
    },
    '(0074,1032)': {
        tag: '(0074,1032)',
        vr: 'CS',
        vm: '1',
        name: 'VerificationImageTiming'
    },
    '(0074,1034)': {
        tag: '(0074,1034)',
        vr: 'CS',
        vm: '1',
        name: 'DoubleExposureFlag'
    },
    '(0074,1036)': {
        tag: '(0074,1036)',
        vr: 'CS',
        vm: '1',
        name: 'DoubleExposureOrdering'
    },
    '(0074,1038)': {
        tag: '(0074,1038)',
        vr: 'DS',
        vm: '1',
        name: 'DoubleExposureMetersetTrial'
    },
    '(0074,103A)': {
        tag: '(0074,103A)',
        vr: 'DS',
        vm: '4',
        name: 'DoubleExposureFieldDeltaTrial'
    },
    '(0074,1040)': {
        tag: '(0074,1040)',
        vr: 'SQ',
        vm: '1',
        name: 'RelatedReferenceRTImageSequence'
    },
    '(0074,1042)': {
        tag: '(0074,1042)',
        vr: 'SQ',
        vm: '1',
        name: 'GeneralMachineVerificationSequence'
    },
    '(0074,1044)': {
        tag: '(0074,1044)',
        vr: 'SQ',
        vm: '1',
        name: 'ConventionalMachineVerificationSequence'
    },
    '(0074,1046)': {
        tag: '(0074,1046)',
        vr: 'SQ',
        vm: '1',
        name: 'IonMachineVerificationSequence'
    },
    '(0074,1048)': {
        tag: '(0074,1048)',
        vr: 'SQ',
        vm: '1',
        name: 'FailedAttributesSequence'
    },
    '(0074,104A)': {
        tag: '(0074,104A)',
        vr: 'SQ',
        vm: '1',
        name: 'OverriddenAttributesSequence'
    },
    '(0074,104C)': {
        tag: '(0074,104C)',
        vr: 'SQ',
        vm: '1',
        name: 'ConventionalControlPointVerificationSequence'
    },
    '(0074,104E)': {
        tag: '(0074,104E)',
        vr: 'SQ',
        vm: '1',
        name: 'IonControlPointVerificationSequence'
    },
    '(0074,1050)': {
        tag: '(0074,1050)',
        vr: 'SQ',
        vm: '1',
        name: 'AttributeOccurrenceSequence'
    },
    '(0074,1052)': {
        tag: '(0074,1052)',
        vr: 'AT',
        vm: '1',
        name: 'AttributeOccurrencePointer'
    },
    '(0074,1054)': {
        tag: '(0074,1054)',
        vr: 'UL',
        vm: '1',
        name: 'AttributeItemSelector'
    },
    '(0074,1056)': {
        tag: '(0074,1056)',
        vr: 'LO',
        vm: '1',
        name: 'AttributeOccurrencePrivateCreator'
    },
    '(0074,1057)': {
        tag: '(0074,1057)',
        vr: 'IS',
        vm: '1-n',
        name: 'SelectorSequencePointerItems'
    },
    '(0074,1200)': {
        tag: '(0074,1200)',
        vr: 'CS',
        vm: '1',
        name: 'ScheduledProcedureStepPriority'
    },
    '(0074,1202)': {
        tag: '(0074,1202)',
        vr: 'LO',
        vm: '1',
        name: 'WorklistLabel'
    },
    '(0074,1204)': {
        tag: '(0074,1204)',
        vr: 'LO',
        vm: '1',
        name: 'ProcedureStepLabel'
    },
    '(0074,1210)': {
        tag: '(0074,1210)',
        vr: 'SQ',
        vm: '1',
        name: 'ScheduledProcessingParametersSequence'
    },
    '(0074,1212)': {
        tag: '(0074,1212)',
        vr: 'SQ',
        vm: '1',
        name: 'PerformedProcessingParametersSequence'
    },
    '(0074,1216)': {
        tag: '(0074,1216)',
        vr: 'SQ',
        vm: '1',
        name: 'UnifiedProcedureStepPerformedProcedureSequence'
    },
    '(0074,1220)': {
        tag: '(0074,1220)',
        vr: 'SQ',
        vm: '1',
        name: 'RelatedProcedureStepSequence'
    },
    '(0074,1222)': {
        tag: '(0074,1222)',
        vr: 'LO',
        vm: '1',
        name: 'ProcedureStepRelationshipType'
    },
    '(0074,1224)': {
        tag: '(0074,1224)',
        vr: 'SQ',
        vm: '1',
        name: 'ReplacedProcedureStepSequence'
    },
    '(0074,1230)': {
        tag: '(0074,1230)',
        vr: 'LO',
        vm: '1',
        name: 'DeletionLock'
    },
    '(0074,1234)': {
        tag: '(0074,1234)',
        vr: 'AE',
        vm: '1',
        name: 'ReceivingAE'
    },
    '(0074,1236)': {
        tag: '(0074,1236)',
        vr: 'AE',
        vm: '1',
        name: 'RequestingAE'
    },
    '(0074,1238)': {
        tag: '(0074,1238)',
        vr: 'LT',
        vm: '1',
        name: 'ReasonForCancellation'
    },
    '(0074,1242)': {
        tag: '(0074,1242)',
        vr: 'CS',
        vm: '1',
        name: 'SCPStatus'
    },
    '(0074,1244)': {
        tag: '(0074,1244)',
        vr: 'CS',
        vm: '1',
        name: 'SubscriptionListStatus'
    },
    '(0074,1246)': {
        tag: '(0074,1246)',
        vr: 'CS',
        vm: '1',
        name: 'UnifiedProcedureStepListStatus'
    },
    '(0074,1324)': {
        tag: '(0074,1324)',
        vr: 'UL',
        vm: '1',
        name: 'BeamOrderIndex'
    },
    '(0074,1338)': {
        tag: '(0074,1338)',
        vr: 'FD',
        vm: '1',
        name: 'DoubleExposureMeterset'
    },
    '(0074,133A)': {
        tag: '(0074,133A)',
        vr: 'FD',
        vm: '4',
        name: 'DoubleExposureFieldDelta'
    },
    '(0076,0001)': {
        tag: '(0076,0001)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantAssemblyTemplateName'
    },
    '(0076,0003)': {
        tag: '(0076,0003)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantAssemblyTemplateIssuer'
    },
    '(0076,0006)': {
        tag: '(0076,0006)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantAssemblyTemplateVersion'
    },
    '(0076,0008)': {
        tag: '(0076,0008)',
        vr: 'SQ',
        vm: '1',
        name: 'ReplacedImplantAssemblyTemplateSequence'
    },
    '(0076,000A)': {
        tag: '(0076,000A)',
        vr: 'CS',
        vm: '1',
        name: 'ImplantAssemblyTemplateType'
    },
    '(0076,000C)': {
        tag: '(0076,000C)',
        vr: 'SQ',
        vm: '1',
        name: 'OriginalImplantAssemblyTemplateSequence'
    },
    '(0076,000E)': {
        tag: '(0076,000E)',
        vr: 'SQ',
        vm: '1',
        name: 'DerivationImplantAssemblyTemplateSequence'
    },
    '(0076,0010)': {
        tag: '(0076,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantAssemblyTemplateTargetAnatomySequence'
    },
    '(0076,0020)': {
        tag: '(0076,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'ProcedureTypeCodeSequence'
    },
    '(0076,0030)': {
        tag: '(0076,0030)',
        vr: 'LO',
        vm: '1',
        name: 'SurgicalTechnique'
    },
    '(0076,0032)': {
        tag: '(0076,0032)',
        vr: 'SQ',
        vm: '1',
        name: 'ComponentTypesSequence'
    },
    '(0076,0034)': {
        tag: '(0076,0034)',
        vr: 'CS',
        vm: '1',
        name: 'ComponentTypeCodeSequence'
    },
    '(0076,0036)': {
        tag: '(0076,0036)',
        vr: 'CS',
        vm: '1',
        name: 'ExclusiveComponentType'
    },
    '(0076,0038)': {
        tag: '(0076,0038)',
        vr: 'CS',
        vm: '1',
        name: 'MandatoryComponentType'
    },
    '(0076,0040)': {
        tag: '(0076,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'ComponentSequence'
    },
    '(0076,0055)': {
        tag: '(0076,0055)',
        vr: 'US',
        vm: '1',
        name: 'ComponentID'
    },
    '(0076,0060)': {
        tag: '(0076,0060)',
        vr: 'SQ',
        vm: '1',
        name: 'ComponentAssemblySequence'
    },
    '(0076,0070)': {
        tag: '(0076,0070)',
        vr: 'US',
        vm: '1',
        name: 'Component1ReferencedID'
    },
    '(0076,0080)': {
        tag: '(0076,0080)',
        vr: 'US',
        vm: '1',
        name: 'Component1ReferencedMatingFeatureSetID'
    },
    '(0076,0090)': {
        tag: '(0076,0090)',
        vr: 'US',
        vm: '1',
        name: 'Component1ReferencedMatingFeatureID'
    },
    '(0076,00A0)': {
        tag: '(0076,00A0)',
        vr: 'US',
        vm: '1',
        name: 'Component2ReferencedID'
    },
    '(0076,00B0)': {
        tag: '(0076,00B0)',
        vr: 'US',
        vm: '1',
        name: 'Component2ReferencedMatingFeatureSetID'
    },
    '(0076,00C0)': {
        tag: '(0076,00C0)',
        vr: 'US',
        vm: '1',
        name: 'Component2ReferencedMatingFeatureID'
    },
    '(0078,0001)': {
        tag: '(0078,0001)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantTemplateGroupName'
    },
    '(0078,0010)': {
        tag: '(0078,0010)',
        vr: 'ST',
        vm: '1',
        name: 'ImplantTemplateGroupDescription'
    },
    '(0078,0020)': {
        tag: '(0078,0020)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantTemplateGroupIssuer'
    },
    '(0078,0024)': {
        tag: '(0078,0024)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantTemplateGroupVersion'
    },
    '(0078,0026)': {
        tag: '(0078,0026)',
        vr: 'SQ',
        vm: '1',
        name: 'ReplacedImplantTemplateGroupSequence'
    },
    '(0078,0028)': {
        tag: '(0078,0028)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTemplateGroupTargetAnatomySequence'
    },
    '(0078,002A)': {
        tag: '(0078,002A)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTemplateGroupMembersSequence'
    },
    '(0078,002E)': {
        tag: '(0078,002E)',
        vr: 'US',
        vm: '1',
        name: 'ImplantTemplateGroupMemberID'
    },
    '(0078,0050)': {
        tag: '(0078,0050)',
        vr: 'FD',
        vm: '3',
        name: 'ThreeDImplantTemplateGroupMemberMatchingPoint'
    },
    '(0078,0060)': {
        tag: '(0078,0060)',
        vr: 'FD',
        vm: '9',
        name: 'ThreeDImplantTemplateGroupMemberMatchingAxes'
    },
    '(0078,0070)': {
        tag: '(0078,0070)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTemplateGroupMemberMatching2DCoordinatesSequence'
    },
    '(0078,0090)': {
        tag: '(0078,0090)',
        vr: 'FD',
        vm: '2',
        name: 'TwoDImplantTemplateGroupMemberMatchingPoint'
    },
    '(0078,00A0)': {
        tag: '(0078,00A0)',
        vr: 'FD',
        vm: '4',
        name: 'TwoDImplantTemplateGroupMemberMatchingAxes'
    },
    '(0078,00B0)': {
        tag: '(0078,00B0)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTemplateGroupVariationDimensionSequence'
    },
    '(0078,00B2)': {
        tag: '(0078,00B2)',
        vr: 'LO',
        vm: '1',
        name: 'ImplantTemplateGroupVariationDimensionName'
    },
    '(0078,00B4)': {
        tag: '(0078,00B4)',
        vr: 'SQ',
        vm: '1',
        name: 'ImplantTemplateGroupVariationDimensionRankSequence'
    },
    '(0078,00B6)': {
        tag: '(0078,00B6)',
        vr: 'US',
        vm: '1',
        name: 'ReferencedImplantTemplateGroupMemberID'
    },
    '(0078,00B8)': {
        tag: '(0078,00B8)',
        vr: 'US',
        vm: '1',
        name: 'ImplantTemplateGroupVariationDimensionRank'
    },
    '(0088,0130)': {
        tag: '(0088,0130)',
        vr: 'SH',
        vm: '1',
        name: 'StorageMediaFileSetID'
    },
    '(0088,0140)': {
        tag: '(0088,0140)',
        vr: 'UI',
        vm: '1',
        name: 'StorageMediaFileSetUID'
    },
    '(0088,0200)': {
        tag: '(0088,0200)',
        vr: 'SQ',
        vm: '1',
        name: 'IconImageSequence'
    },
    '(0088,0904)': {
        tag: '(0088,0904)',
        vr: 'LO',
        vm: '1',
        name: 'TopicTitle'
    },
    '(0088,0906)': {
        tag: '(0088,0906)',
        vr: 'ST',
        vm: '1',
        name: 'TopicSubject'
    },
    '(0088,0910)': {
        tag: '(0088,0910)',
        vr: 'LO',
        vm: '1',
        name: 'TopicAuthor'
    },
    '(0088,0912)': {
        tag: '(0088,0912)',
        vr: 'LO',
        vm: '1-32',
        name: 'TopicKeywords'
    },
    '(0100,0410)': {
        tag: '(0100,0410)',
        vr: 'CS',
        vm: '1',
        name: 'SOPInstanceStatus'
    },
    '(0100,0420)': {
        tag: '(0100,0420)',
        vr: 'DT',
        vm: '1',
        name: 'SOPAuthorizationDateTime'
    },
    '(0100,0424)': {
        tag: '(0100,0424)',
        vr: 'LT',
        vm: '1',
        name: 'SOPAuthorizationComment'
    },
    '(0100,0426)': {
        tag: '(0100,0426)',
        vr: 'LO',
        vm: '1',
        name: 'AuthorizationEquipmentCertificationNumber'
    },
    '(0400,0005)': {
        tag: '(0400,0005)',
        vr: 'US',
        vm: '1',
        name: 'MACIDNumber'
    },
    '(0400,0010)': {
        tag: '(0400,0010)',
        vr: 'UI',
        vm: '1',
        name: 'MACCalculationTransferSyntaxUID'
    },
    '(0400,0015)': {
        tag: '(0400,0015)',
        vr: 'CS',
        vm: '1',
        name: 'MACAlgorithm'
    },
    '(0400,0020)': {
        tag: '(0400,0020)',
        vr: 'AT',
        vm: '1-n',
        name: 'DataElementsSigned'
    },
    '(0400,0100)': {
        tag: '(0400,0100)',
        vr: 'UI',
        vm: '1',
        name: 'DigitalSignatureUID'
    },
    '(0400,0105)': {
        tag: '(0400,0105)',
        vr: 'DT',
        vm: '1',
        name: 'DigitalSignatureDateTime'
    },
    '(0400,0110)': {
        tag: '(0400,0110)',
        vr: 'CS',
        vm: '1',
        name: 'CertificateType'
    },
    '(0400,0115)': {
        tag: '(0400,0115)',
        vr: 'OB',
        vm: '1',
        name: 'CertificateOfSigner'
    },
    '(0400,0120)': {
        tag: '(0400,0120)',
        vr: 'OB',
        vm: '1',
        name: 'Signature'
    },
    '(0400,0305)': {
        tag: '(0400,0305)',
        vr: 'CS',
        vm: '1',
        name: 'CertifiedTimestampType'
    },
    '(0400,0310)': {
        tag: '(0400,0310)',
        vr: 'OB',
        vm: '1',
        name: 'CertifiedTimestamp'
    },
    '(0400,0401)': {
        tag: '(0400,0401)',
        vr: 'SQ',
        vm: '1',
        name: 'DigitalSignaturePurposeCodeSequence'
    },
    '(0400,0402)': {
        tag: '(0400,0402)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedDigitalSignatureSequence'
    },
    '(0400,0403)': {
        tag: '(0400,0403)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedSOPInstanceMACSequence'
    },
    '(0400,0404)': {
        tag: '(0400,0404)',
        vr: 'OB',
        vm: '1',
        name: 'MAC'
    },
    '(0400,0500)': {
        tag: '(0400,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'EncryptedAttributesSequence'
    },
    '(0400,0510)': {
        tag: '(0400,0510)',
        vr: 'UI',
        vm: '1',
        name: 'EncryptedContentTransferSyntaxUID'
    },
    '(0400,0520)': {
        tag: '(0400,0520)',
        vr: 'OB',
        vm: '1',
        name: 'EncryptedContent'
    },
    '(0400,0550)': {
        tag: '(0400,0550)',
        vr: 'SQ',
        vm: '1',
        name: 'ModifiedAttributesSequence'
    },
    '(0400,0561)': {
        tag: '(0400,0561)',
        vr: 'SQ',
        vm: '1',
        name: 'OriginalAttributesSequence'
    },
    '(0400,0562)': {
        tag: '(0400,0562)',
        vr: 'DT',
        vm: '1',
        name: 'AttributeModificationDateTime'
    },
    '(0400,0563)': {
        tag: '(0400,0563)',
        vr: 'LO',
        vm: '1',
        name: 'ModifyingSystem'
    },
    '(0400,0564)': {
        tag: '(0400,0564)',
        vr: 'LO',
        vm: '1',
        name: 'SourceOfPreviousValues'
    },
    '(0400,0565)': {
        tag: '(0400,0565)',
        vr: 'CS',
        vm: '1',
        name: 'ReasonForTheAttributeModification'
    },
    '(1000,xxx0)': {
        tag: '(1000,xxx0)',
        vr: 'US',
        vm: '3',
        name: 'EscapeTriplet'
    },
    '(1000,xxx1)': {
        tag: '(1000,xxx1)',
        vr: 'US',
        vm: '3',
        name: 'RunLengthTriplet'
    },
    '(1000,xxx2)': {
        tag: '(1000,xxx2)',
        vr: 'US',
        vm: '1',
        name: 'HuffmanTableSize'
    },
    '(1000,xxx3)': {
        tag: '(1000,xxx3)',
        vr: 'US',
        vm: '3',
        name: 'HuffmanTableTriplet'
    },
    '(1000,xxx4)': {
        tag: '(1000,xxx4)',
        vr: 'US',
        vm: '1',
        name: 'ShiftTableSize'
    },
    '(1000,xxx5)': {
        tag: '(1000,xxx5)',
        vr: 'US',
        vm: '3',
        name: 'ShiftTableTriplet'
    },
    '(1010,xxxx)': {
        tag: '(1010,xxxx)',
        vr: 'US',
        vm: '1-n',
        name: 'ZonalMap'
    },
    '(2000,0010)': {
        tag: '(2000,0010)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfCopies'
    },
    '(2000,001E)': {
        tag: '(2000,001E)',
        vr: 'SQ',
        vm: '1',
        name: 'PrinterConfigurationSequence'
    },
    '(2000,0020)': {
        tag: '(2000,0020)',
        vr: 'CS',
        vm: '1',
        name: 'PrintPriority'
    },
    '(2000,0030)': {
        tag: '(2000,0030)',
        vr: 'CS',
        vm: '1',
        name: 'MediumType'
    },
    '(2000,0040)': {
        tag: '(2000,0040)',
        vr: 'CS',
        vm: '1',
        name: 'FilmDestination'
    },
    '(2000,0050)': {
        tag: '(2000,0050)',
        vr: 'LO',
        vm: '1',
        name: 'FilmSessionLabel'
    },
    '(2000,0060)': {
        tag: '(2000,0060)',
        vr: 'IS',
        vm: '1',
        name: 'MemoryAllocation'
    },
    '(2000,0061)': {
        tag: '(2000,0061)',
        vr: 'IS',
        vm: '1',
        name: 'MaximumMemoryAllocation'
    },
    '(2000,0062)': {
        tag: '(2000,0062)',
        vr: 'CS',
        vm: '1',
        name: 'ColorImagePrintingFlag'
    },
    '(2000,0063)': {
        tag: '(2000,0063)',
        vr: 'CS',
        vm: '1',
        name: 'CollationFlag'
    },
    '(2000,0065)': {
        tag: '(2000,0065)',
        vr: 'CS',
        vm: '1',
        name: 'AnnotationFlag'
    },
    '(2000,0067)': {
        tag: '(2000,0067)',
        vr: 'CS',
        vm: '1',
        name: 'ImageOverlayFlag'
    },
    '(2000,0069)': {
        tag: '(2000,0069)',
        vr: 'CS',
        vm: '1',
        name: 'PresentationLUTFlag'
    },
    '(2000,006A)': {
        tag: '(2000,006A)',
        vr: 'CS',
        vm: '1',
        name: 'ImageBoxPresentationLUTFlag'
    },
    '(2000,00A0)': {
        tag: '(2000,00A0)',
        vr: 'US',
        vm: '1',
        name: 'MemoryBitDepth'
    },
    '(2000,00A1)': {
        tag: '(2000,00A1)',
        vr: 'US',
        vm: '1',
        name: 'PrintingBitDepth'
    },
    '(2000,00A2)': {
        tag: '(2000,00A2)',
        vr: 'SQ',
        vm: '1',
        name: 'MediaInstalledSequence'
    },
    '(2000,00A4)': {
        tag: '(2000,00A4)',
        vr: 'SQ',
        vm: '1',
        name: 'OtherMediaAvailableSequence'
    },
    '(2000,00A8)': {
        tag: '(2000,00A8)',
        vr: 'SQ',
        vm: '1',
        name: 'SupportedImageDisplayFormatsSequence'
    },
    '(2000,0500)': {
        tag: '(2000,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedFilmBoxSequence'
    },
    '(2000,0510)': {
        tag: '(2000,0510)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedStoredPrintSequence'
    },
    '(2010,0010)': {
        tag: '(2010,0010)',
        vr: 'ST',
        vm: '1',
        name: 'ImageDisplayFormat'
    },
    '(2010,0030)': {
        tag: '(2010,0030)',
        vr: 'CS',
        vm: '1',
        name: 'AnnotationDisplayFormatID'
    },
    '(2010,0040)': {
        tag: '(2010,0040)',
        vr: 'CS',
        vm: '1',
        name: 'FilmOrientation'
    },
    '(2010,0050)': {
        tag: '(2010,0050)',
        vr: 'CS',
        vm: '1',
        name: 'FilmSizeID'
    },
    '(2010,0052)': {
        tag: '(2010,0052)',
        vr: 'CS',
        vm: '1',
        name: 'PrinterResolutionID'
    },
    '(2010,0054)': {
        tag: '(2010,0054)',
        vr: 'CS',
        vm: '1',
        name: 'DefaultPrinterResolutionID'
    },
    '(2010,0060)': {
        tag: '(2010,0060)',
        vr: 'CS',
        vm: '1',
        name: 'MagnificationType'
    },
    '(2010,0080)': {
        tag: '(2010,0080)',
        vr: 'CS',
        vm: '1',
        name: 'SmoothingType'
    },
    '(2010,00A6)': {
        tag: '(2010,00A6)',
        vr: 'CS',
        vm: '1',
        name: 'DefaultMagnificationType'
    },
    '(2010,00A7)': {
        tag: '(2010,00A7)',
        vr: 'CS',
        vm: '1-n',
        name: 'OtherMagnificationTypesAvailable'
    },
    '(2010,00A8)': {
        tag: '(2010,00A8)',
        vr: 'CS',
        vm: '1',
        name: 'DefaultSmoothingType'
    },
    '(2010,00A9)': {
        tag: '(2010,00A9)',
        vr: 'CS',
        vm: '1-n',
        name: 'OtherSmoothingTypesAvailable'
    },
    '(2010,0100)': {
        tag: '(2010,0100)',
        vr: 'CS',
        vm: '1',
        name: 'BorderDensity'
    },
    '(2010,0110)': {
        tag: '(2010,0110)',
        vr: 'CS',
        vm: '1',
        name: 'EmptyImageDensity'
    },
    '(2010,0120)': {
        tag: '(2010,0120)',
        vr: 'US',
        vm: '1',
        name: 'MinDensity'
    },
    '(2010,0130)': {
        tag: '(2010,0130)',
        vr: 'US',
        vm: '1',
        name: 'MaxDensity'
    },
    '(2010,0140)': {
        tag: '(2010,0140)',
        vr: 'CS',
        vm: '1',
        name: 'Trim'
    },
    '(2010,0150)': {
        tag: '(2010,0150)',
        vr: 'ST',
        vm: '1',
        name: 'ConfigurationInformation'
    },
    '(2010,0152)': {
        tag: '(2010,0152)',
        vr: 'LT',
        vm: '1',
        name: 'ConfigurationInformationDescription'
    },
    '(2010,0154)': {
        tag: '(2010,0154)',
        vr: 'IS',
        vm: '1',
        name: 'MaximumCollatedFilms'
    },
    '(2010,015E)': {
        tag: '(2010,015E)',
        vr: 'US',
        vm: '1',
        name: 'Illumination'
    },
    '(2010,0160)': {
        tag: '(2010,0160)',
        vr: 'US',
        vm: '1',
        name: 'ReflectedAmbientLight'
    },
    '(2010,0376)': {
        tag: '(2010,0376)',
        vr: 'DS',
        vm: '2',
        name: 'PrinterPixelSpacing'
    },
    '(2010,0500)': {
        tag: '(2010,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedFilmSessionSequence'
    },
    '(2010,0510)': {
        tag: '(2010,0510)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageBoxSequence'
    },
    '(2010,0520)': {
        tag: '(2010,0520)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedBasicAnnotationBoxSequence'
    },
    '(2020,0010)': {
        tag: '(2020,0010)',
        vr: 'US',
        vm: '1',
        name: 'ImageBoxPosition'
    },
    '(2020,0020)': {
        tag: '(2020,0020)',
        vr: 'CS',
        vm: '1',
        name: 'Polarity'
    },
    '(2020,0030)': {
        tag: '(2020,0030)',
        vr: 'DS',
        vm: '1',
        name: 'RequestedImageSize'
    },
    '(2020,0040)': {
        tag: '(2020,0040)',
        vr: 'CS',
        vm: '1',
        name: 'RequestedDecimateCropBehavior'
    },
    '(2020,0050)': {
        tag: '(2020,0050)',
        vr: 'CS',
        vm: '1',
        name: 'RequestedResolutionID'
    },
    '(2020,00A0)': {
        tag: '(2020,00A0)',
        vr: 'CS',
        vm: '1',
        name: 'RequestedImageSizeFlag'
    },
    '(2020,00A2)': {
        tag: '(2020,00A2)',
        vr: 'CS',
        vm: '1',
        name: 'DecimateCropResult'
    },
    '(2020,0110)': {
        tag: '(2020,0110)',
        vr: 'SQ',
        vm: '1',
        name: 'BasicGrayscaleImageSequence'
    },
    '(2020,0111)': {
        tag: '(2020,0111)',
        vr: 'SQ',
        vm: '1',
        name: 'BasicColorImageSequence'
    },
    '(2020,0130)': {
        tag: '(2020,0130)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageOverlayBoxSequence'
    },
    '(2020,0140)': {
        tag: '(2020,0140)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedVOILUTBoxSequence'
    },
    '(2030,0010)': {
        tag: '(2030,0010)',
        vr: 'US',
        vm: '1',
        name: 'AnnotationPosition'
    },
    '(2030,0020)': {
        tag: '(2030,0020)',
        vr: 'LO',
        vm: '1',
        name: 'TextString'
    },
    '(2040,0010)': {
        tag: '(2040,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedOverlayPlaneSequence'
    },
    '(2040,0011)': {
        tag: '(2040,0011)',
        vr: 'US',
        vm: '1-99',
        name: 'ReferencedOverlayPlaneGroups'
    },
    '(2040,0020)': {
        tag: '(2040,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'OverlayPixelDataSequence'
    },
    '(2040,0060)': {
        tag: '(2040,0060)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayMagnificationType'
    },
    '(2040,0070)': {
        tag: '(2040,0070)',
        vr: 'CS',
        vm: '1',
        name: 'OverlaySmoothingType'
    },
    '(2040,0072)': {
        tag: '(2040,0072)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayOrImageMagnification'
    },
    '(2040,0074)': {
        tag: '(2040,0074)',
        vr: 'US',
        vm: '1',
        name: 'MagnifyToNumberOfColumns'
    },
    '(2040,0080)': {
        tag: '(2040,0080)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayForegroundDensity'
    },
    '(2040,0082)': {
        tag: '(2040,0082)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayBackgroundDensity'
    },
    '(2040,0090)': {
        tag: '(2040,0090)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayMode'
    },
    '(2040,0100)': {
        tag: '(2040,0100)',
        vr: 'CS',
        vm: '1',
        name: 'ThresholdDensity'
    },
    '(2040,0500)': {
        tag: '(2040,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedImageBoxSequenceRetired'
    },
    '(2050,0010)': {
        tag: '(2050,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'PresentationLUTSequence'
    },
    '(2050,0020)': {
        tag: '(2050,0020)',
        vr: 'CS',
        vm: '1',
        name: 'PresentationLUTShape'
    },
    '(2050,0500)': {
        tag: '(2050,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPresentationLUTSequence'
    },
    '(2100,0010)': {
        tag: '(2100,0010)',
        vr: 'SH',
        vm: '1',
        name: 'PrintJobID'
    },
    '(2100,0020)': {
        tag: '(2100,0020)',
        vr: 'CS',
        vm: '1',
        name: 'ExecutionStatus'
    },
    '(2100,0030)': {
        tag: '(2100,0030)',
        vr: 'CS',
        vm: '1',
        name: 'ExecutionStatusInfo'
    },
    '(2100,0040)': {
        tag: '(2100,0040)',
        vr: 'DA',
        vm: '1',
        name: 'CreationDate'
    },
    '(2100,0050)': {
        tag: '(2100,0050)',
        vr: 'TM',
        vm: '1',
        name: 'CreationTime'
    },
    '(2100,0070)': {
        tag: '(2100,0070)',
        vr: 'AE',
        vm: '1',
        name: 'Originator'
    },
    '(2100,0140)': {
        tag: '(2100,0140)',
        vr: 'AE',
        vm: '1',
        name: 'DestinationAE'
    },
    '(2100,0160)': {
        tag: '(2100,0160)',
        vr: 'SH',
        vm: '1',
        name: 'OwnerID'
    },
    '(2100,0170)': {
        tag: '(2100,0170)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfFilms'
    },
    '(2100,0500)': {
        tag: '(2100,0500)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPrintJobSequencePullStoredPrint'
    },
    '(2110,0010)': {
        tag: '(2110,0010)',
        vr: 'CS',
        vm: '1',
        name: 'PrinterStatus'
    },
    '(2110,0020)': {
        tag: '(2110,0020)',
        vr: 'CS',
        vm: '1',
        name: 'PrinterStatusInfo'
    },
    '(2110,0030)': {
        tag: '(2110,0030)',
        vr: 'LO',
        vm: '1',
        name: 'PrinterName'
    },
    '(2110,0099)': {
        tag: '(2110,0099)',
        vr: 'SH',
        vm: '1',
        name: 'PrintQueueID'
    },
    '(2120,0010)': {
        tag: '(2120,0010)',
        vr: 'CS',
        vm: '1',
        name: 'QueueStatus'
    },
    '(2120,0050)': {
        tag: '(2120,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'PrintJobDescriptionSequence'
    },
    '(2120,0070)': {
        tag: '(2120,0070)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedPrintJobSequence'
    },
    '(2130,0010)': {
        tag: '(2130,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'PrintManagementCapabilitiesSequence'
    },
    '(2130,0015)': {
        tag: '(2130,0015)',
        vr: 'SQ',
        vm: '1',
        name: 'PrinterCharacteristicsSequence'
    },
    '(2130,0030)': {
        tag: '(2130,0030)',
        vr: 'SQ',
        vm: '1',
        name: 'FilmBoxContentSequence'
    },
    '(2130,0040)': {
        tag: '(2130,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageBoxContentSequence'
    },
    '(2130,0050)': {
        tag: '(2130,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'AnnotationContentSequence'
    },
    '(2130,0060)': {
        tag: '(2130,0060)',
        vr: 'SQ',
        vm: '1',
        name: 'ImageOverlayBoxContentSequence'
    },
    '(2130,0080)': {
        tag: '(2130,0080)',
        vr: 'SQ',
        vm: '1',
        name: 'PresentationLUTContentSequence'
    },
    '(2130,00A0)': {
        tag: '(2130,00A0)',
        vr: 'SQ',
        vm: '1',
        name: 'ProposedStudySequence'
    },
    '(2130,00C0)': {
        tag: '(2130,00C0)',
        vr: 'SQ',
        vm: '1',
        name: 'OriginalImageSequence'
    },
    '(2200,0001)': {
        tag: '(2200,0001)',
        vr: 'CS',
        vm: '1',
        name: 'LabelUsingInformationExtractedFromInstances'
    },
    '(2200,0002)': {
        tag: '(2200,0002)',
        vr: 'UT',
        vm: '1',
        name: 'LabelText'
    },
    '(2200,0003)': {
        tag: '(2200,0003)',
        vr: 'CS',
        vm: '1',
        name: 'LabelStyleSelection'
    },
    '(2200,0004)': {
        tag: '(2200,0004)',
        vr: 'LT',
        vm: '1',
        name: 'MediaDisposition'
    },
    '(2200,0005)': {
        tag: '(2200,0005)',
        vr: 'LT',
        vm: '1',
        name: 'BarcodeValue'
    },
    '(2200,0006)': {
        tag: '(2200,0006)',
        vr: 'CS',
        vm: '1',
        name: 'BarcodeSymbology'
    },
    '(2200,0007)': {
        tag: '(2200,0007)',
        vr: 'CS',
        vm: '1',
        name: 'AllowMediaSplitting'
    },
    '(2200,0008)': {
        tag: '(2200,0008)',
        vr: 'CS',
        vm: '1',
        name: 'IncludeNonDICOMObjects'
    },
    '(2200,0009)': {
        tag: '(2200,0009)',
        vr: 'CS',
        vm: '1',
        name: 'IncludeDisplayApplication'
    },
    '(2200,000A)': {
        tag: '(2200,000A)',
        vr: 'CS',
        vm: '1',
        name: 'PreserveCompositeInstancesAfterMediaCreation'
    },
    '(2200,000B)': {
        tag: '(2200,000B)',
        vr: 'US',
        vm: '1',
        name: 'TotalNumberOfPiecesOfMediaCreated'
    },
    '(2200,000C)': {
        tag: '(2200,000C)',
        vr: 'LO',
        vm: '1',
        name: 'RequestedMediaApplicationProfile'
    },
    '(2200,000D)': {
        tag: '(2200,000D)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedStorageMediaSequence'
    },
    '(2200,000E)': {
        tag: '(2200,000E)',
        vr: 'AT',
        vm: '1-n',
        name: 'FailureAttributes'
    },
    '(2200,000F)': {
        tag: '(2200,000F)',
        vr: 'CS',
        vm: '1',
        name: 'AllowLossyCompression'
    },
    '(2200,0020)': {
        tag: '(2200,0020)',
        vr: 'CS',
        vm: '1',
        name: 'RequestPriority'
    },
    '(3002,0002)': {
        tag: '(3002,0002)',
        vr: 'SH',
        vm: '1',
        name: 'RTImageLabel'
    },
    '(3002,0003)': {
        tag: '(3002,0003)',
        vr: 'LO',
        vm: '1',
        name: 'RTImageName'
    },
    '(3002,0004)': {
        tag: '(3002,0004)',
        vr: 'ST',
        vm: '1',
        name: 'RTImageDescription'
    },
    '(3002,000A)': {
        tag: '(3002,000A)',
        vr: 'CS',
        vm: '1',
        name: 'ReportedValuesOrigin'
    },
    '(3002,000C)': {
        tag: '(3002,000C)',
        vr: 'CS',
        vm: '1',
        name: 'RTImagePlane'
    },
    '(3002,000D)': {
        tag: '(3002,000D)',
        vr: 'DS',
        vm: '3',
        name: 'XRayImageReceptorTranslation'
    },
    '(3002,000E)': {
        tag: '(3002,000E)',
        vr: 'DS',
        vm: '1',
        name: 'XRayImageReceptorAngle'
    },
    '(3002,0010)': {
        tag: '(3002,0010)',
        vr: 'DS',
        vm: '6',
        name: 'RTImageOrientation'
    },
    '(3002,0011)': {
        tag: '(3002,0011)',
        vr: 'DS',
        vm: '2',
        name: 'ImagePlanePixelSpacing'
    },
    '(3002,0012)': {
        tag: '(3002,0012)',
        vr: 'DS',
        vm: '2',
        name: 'RTImagePosition'
    },
    '(3002,0020)': {
        tag: '(3002,0020)',
        vr: 'SH',
        vm: '1',
        name: 'RadiationMachineName'
    },
    '(3002,0022)': {
        tag: '(3002,0022)',
        vr: 'DS',
        vm: '1',
        name: 'RadiationMachineSAD'
    },
    '(3002,0024)': {
        tag: '(3002,0024)',
        vr: 'DS',
        vm: '1',
        name: 'RadiationMachineSSD'
    },
    '(3002,0026)': {
        tag: '(3002,0026)',
        vr: 'DS',
        vm: '1',
        name: 'RTImageSID'
    },
    '(3002,0028)': {
        tag: '(3002,0028)',
        vr: 'DS',
        vm: '1',
        name: 'SourceToReferenceObjectDistance'
    },
    '(3002,0029)': {
        tag: '(3002,0029)',
        vr: 'IS',
        vm: '1',
        name: 'FractionNumber'
    },
    '(3002,0030)': {
        tag: '(3002,0030)',
        vr: 'SQ',
        vm: '1',
        name: 'ExposureSequence'
    },
    '(3002,0032)': {
        tag: '(3002,0032)',
        vr: 'DS',
        vm: '1',
        name: 'MetersetExposure'
    },
    '(3002,0034)': {
        tag: '(3002,0034)',
        vr: 'DS',
        vm: '4',
        name: 'DiaphragmPosition'
    },
    '(3002,0040)': {
        tag: '(3002,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'FluenceMapSequence'
    },
    '(3002,0041)': {
        tag: '(3002,0041)',
        vr: 'CS',
        vm: '1',
        name: 'FluenceDataSource'
    },
    '(3002,0042)': {
        tag: '(3002,0042)',
        vr: 'DS',
        vm: '1',
        name: 'FluenceDataScale'
    },
    '(3002,0050)': {
        tag: '(3002,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'PrimaryFluenceModeSequence'
    },
    '(3002,0051)': {
        tag: '(3002,0051)',
        vr: 'CS',
        vm: '1',
        name: 'FluenceMode'
    },
    '(3002,0052)': {
        tag: '(3002,0052)',
        vr: 'SH',
        vm: '1',
        name: 'FluenceModeID'
    },
    '(3004,0001)': {
        tag: '(3004,0001)',
        vr: 'CS',
        vm: '1',
        name: 'DVHType'
    },
    '(3004,0002)': {
        tag: '(3004,0002)',
        vr: 'CS',
        vm: '1',
        name: 'DoseUnits'
    },
    '(3004,0004)': {
        tag: '(3004,0004)',
        vr: 'CS',
        vm: '1',
        name: 'DoseType'
    },
    '(3004,0006)': {
        tag: '(3004,0006)',
        vr: 'LO',
        vm: '1',
        name: 'DoseComment'
    },
    '(3004,0008)': {
        tag: '(3004,0008)',
        vr: 'DS',
        vm: '3',
        name: 'NormalizationPoint'
    },
    '(3004,000A)': {
        tag: '(3004,000A)',
        vr: 'CS',
        vm: '1',
        name: 'DoseSummationType'
    },
    '(3004,000C)': {
        tag: '(3004,000C)',
        vr: 'DS',
        vm: '2-n',
        name: 'GridFrameOffsetVector'
    },
    '(3004,000E)': {
        tag: '(3004,000E)',
        vr: 'DS',
        vm: '1',
        name: 'DoseGridScaling'
    },
    '(3004,0010)': {
        tag: '(3004,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'RTDoseROISequence'
    },
    '(3004,0012)': {
        tag: '(3004,0012)',
        vr: 'DS',
        vm: '1',
        name: 'DoseValue'
    },
    '(3004,0014)': {
        tag: '(3004,0014)',
        vr: 'CS',
        vm: '1-3',
        name: 'TissueHeterogeneityCorrection'
    },
    '(3004,0040)': {
        tag: '(3004,0040)',
        vr: 'DS',
        vm: '3',
        name: 'DVHNormalizationPoint'
    },
    '(3004,0042)': {
        tag: '(3004,0042)',
        vr: 'DS',
        vm: '1',
        name: 'DVHNormalizationDoseValue'
    },
    '(3004,0050)': {
        tag: '(3004,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'DVHSequence'
    },
    '(3004,0052)': {
        tag: '(3004,0052)',
        vr: 'DS',
        vm: '1',
        name: 'DVHDoseScaling'
    },
    '(3004,0054)': {
        tag: '(3004,0054)',
        vr: 'CS',
        vm: '1',
        name: 'DVHVolumeUnits'
    },
    '(3004,0056)': {
        tag: '(3004,0056)',
        vr: 'IS',
        vm: '1',
        name: 'DVHNumberOfBins'
    },
    '(3004,0058)': {
        tag: '(3004,0058)',
        vr: 'DS',
        vm: '2-2n',
        name: 'DVHData'
    },
    '(3004,0060)': {
        tag: '(3004,0060)',
        vr: 'SQ',
        vm: '1',
        name: 'DVHReferencedROISequence'
    },
    '(3004,0062)': {
        tag: '(3004,0062)',
        vr: 'CS',
        vm: '1',
        name: 'DVHROIContributionType'
    },
    '(3004,0070)': {
        tag: '(3004,0070)',
        vr: 'DS',
        vm: '1',
        name: 'DVHMinimumDose'
    },
    '(3004,0072)': {
        tag: '(3004,0072)',
        vr: 'DS',
        vm: '1',
        name: 'DVHMaximumDose'
    },
    '(3004,0074)': {
        tag: '(3004,0074)',
        vr: 'DS',
        vm: '1',
        name: 'DVHMeanDose'
    },
    '(3006,0002)': {
        tag: '(3006,0002)',
        vr: 'SH',
        vm: '1',
        name: 'StructureSetLabel'
    },
    '(3006,0004)': {
        tag: '(3006,0004)',
        vr: 'LO',
        vm: '1',
        name: 'StructureSetName'
    },
    '(3006,0006)': {
        tag: '(3006,0006)',
        vr: 'ST',
        vm: '1',
        name: 'StructureSetDescription'
    },
    '(3006,0008)': {
        tag: '(3006,0008)',
        vr: 'DA',
        vm: '1',
        name: 'StructureSetDate'
    },
    '(3006,0009)': {
        tag: '(3006,0009)',
        vr: 'TM',
        vm: '1',
        name: 'StructureSetTime'
    },
    '(3006,0010)': {
        tag: '(3006,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedFrameOfReferenceSequence'
    },
    '(3006,0012)': {
        tag: '(3006,0012)',
        vr: 'SQ',
        vm: '1',
        name: 'RTReferencedStudySequence'
    },
    '(3006,0014)': {
        tag: '(3006,0014)',
        vr: 'SQ',
        vm: '1',
        name: 'RTReferencedSeriesSequence'
    },
    '(3006,0016)': {
        tag: '(3006,0016)',
        vr: 'SQ',
        vm: '1',
        name: 'ContourImageSequence'
    },
    '(3006,0020)': {
        tag: '(3006,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'StructureSetROISequence'
    },
    '(3006,0022)': {
        tag: '(3006,0022)',
        vr: 'IS',
        vm: '1',
        name: 'ROINumber'
    },
    '(3006,0024)': {
        tag: '(3006,0024)',
        vr: 'UI',
        vm: '1',
        name: 'ReferencedFrameOfReferenceUID'
    },
    '(3006,0026)': {
        tag: '(3006,0026)',
        vr: 'LO',
        vm: '1',
        name: 'ROIName'
    },
    '(3006,0028)': {
        tag: '(3006,0028)',
        vr: 'ST',
        vm: '1',
        name: 'ROIDescription'
    },
    '(3006,002A)': {
        tag: '(3006,002A)',
        vr: 'IS',
        vm: '3',
        name: 'ROIDisplayColor'
    },
    '(3006,002C)': {
        tag: '(3006,002C)',
        vr: 'DS',
        vm: '1',
        name: 'ROIVolume'
    },
    '(3006,0030)': {
        tag: '(3006,0030)',
        vr: 'SQ',
        vm: '1',
        name: 'RTRelatedROISequence'
    },
    '(3006,0033)': {
        tag: '(3006,0033)',
        vr: 'CS',
        vm: '1',
        name: 'RTROIRelationship'
    },
    '(3006,0036)': {
        tag: '(3006,0036)',
        vr: 'CS',
        vm: '1',
        name: 'ROIGenerationAlgorithm'
    },
    '(3006,0038)': {
        tag: '(3006,0038)',
        vr: 'LO',
        vm: '1',
        name: 'ROIGenerationDescription'
    },
    '(3006,0039)': {
        tag: '(3006,0039)',
        vr: 'SQ',
        vm: '1',
        name: 'ROIContourSequence'
    },
    '(3006,0040)': {
        tag: '(3006,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'ContourSequence'
    },
    '(3006,0042)': {
        tag: '(3006,0042)',
        vr: 'CS',
        vm: '1',
        name: 'ContourGeometricType'
    },
    '(3006,0044)': {
        tag: '(3006,0044)',
        vr: 'DS',
        vm: '1',
        name: 'ContourSlabThickness'
    },
    '(3006,0045)': {
        tag: '(3006,0045)',
        vr: 'DS',
        vm: '3',
        name: 'ContourOffsetVector'
    },
    '(3006,0046)': {
        tag: '(3006,0046)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfContourPoints'
    },
    '(3006,0048)': {
        tag: '(3006,0048)',
        vr: 'IS',
        vm: '1',
        name: 'ContourNumber'
    },
    '(3006,0049)': {
        tag: '(3006,0049)',
        vr: 'IS',
        vm: '1-n',
        name: 'AttachedContours'
    },
    '(3006,0050)': {
        tag: '(3006,0050)',
        vr: 'DS',
        vm: '3-3n',
        name: 'ContourData'
    },
    '(3006,0080)': {
        tag: '(3006,0080)',
        vr: 'SQ',
        vm: '1',
        name: 'RTROIObservationsSequence'
    },
    '(3006,0082)': {
        tag: '(3006,0082)',
        vr: 'IS',
        vm: '1',
        name: 'ObservationNumber'
    },
    '(3006,0084)': {
        tag: '(3006,0084)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedROINumber'
    },
    '(3006,0085)': {
        tag: '(3006,0085)',
        vr: 'SH',
        vm: '1',
        name: 'ROIObservationLabel'
    },
    '(3006,0086)': {
        tag: '(3006,0086)',
        vr: 'SQ',
        vm: '1',
        name: 'RTROIIdentificationCodeSequence'
    },
    '(3006,0088)': {
        tag: '(3006,0088)',
        vr: 'ST',
        vm: '1',
        name: 'ROIObservationDescription'
    },
    '(3006,00A0)': {
        tag: '(3006,00A0)',
        vr: 'SQ',
        vm: '1',
        name: 'RelatedRTROIObservationsSequence'
    },
    '(3006,00A4)': {
        tag: '(3006,00A4)',
        vr: 'CS',
        vm: '1',
        name: 'RTROIInterpretedType'
    },
    '(3006,00A6)': {
        tag: '(3006,00A6)',
        vr: 'PN',
        vm: '1',
        name: 'ROIInterpreter'
    },
    '(3006,00B0)': {
        tag: '(3006,00B0)',
        vr: 'SQ',
        vm: '1',
        name: 'ROIPhysicalPropertiesSequence'
    },
    '(3006,00B2)': {
        tag: '(3006,00B2)',
        vr: 'CS',
        vm: '1',
        name: 'ROIPhysicalProperty'
    },
    '(3006,00B4)': {
        tag: '(3006,00B4)',
        vr: 'DS',
        vm: '1',
        name: 'ROIPhysicalPropertyValue'
    },
    '(3006,00B6)': {
        tag: '(3006,00B6)',
        vr: 'SQ',
        vm: '1',
        name: 'ROIElementalCompositionSequence'
    },
    '(3006,00B7)': {
        tag: '(3006,00B7)',
        vr: 'US',
        vm: '1',
        name: 'ROIElementalCompositionAtomicNumber'
    },
    '(3006,00B8)': {
        tag: '(3006,00B8)',
        vr: 'FL',
        vm: '1',
        name: 'ROIElementalCompositionAtomicMassFraction'
    },
    '(3006,00C0)': {
        tag: '(3006,00C0)',
        vr: 'SQ',
        vm: '1',
        name: 'FrameOfReferenceRelationshipSequence'
    },
    '(3006,00C2)': {
        tag: '(3006,00C2)',
        vr: 'UI',
        vm: '1',
        name: 'RelatedFrameOfReferenceUID'
    },
    '(3006,00C4)': {
        tag: '(3006,00C4)',
        vr: 'CS',
        vm: '1',
        name: 'FrameOfReferenceTransformationType'
    },
    '(3006,00C6)': {
        tag: '(3006,00C6)',
        vr: 'DS',
        vm: '16',
        name: 'FrameOfReferenceTransformationMatrix'
    },
    '(3006,00C8)': {
        tag: '(3006,00C8)',
        vr: 'LO',
        vm: '1',
        name: 'FrameOfReferenceTransformationComment'
    },
    '(3008,0010)': {
        tag: '(3008,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'MeasuredDoseReferenceSequence'
    },
    '(3008,0012)': {
        tag: '(3008,0012)',
        vr: 'ST',
        vm: '1',
        name: 'MeasuredDoseDescription'
    },
    '(3008,0014)': {
        tag: '(3008,0014)',
        vr: 'CS',
        vm: '1',
        name: 'MeasuredDoseType'
    },
    '(3008,0016)': {
        tag: '(3008,0016)',
        vr: 'DS',
        vm: '1',
        name: 'MeasuredDoseValue'
    },
    '(3008,0020)': {
        tag: '(3008,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'TreatmentSessionBeamSequence'
    },
    '(3008,0021)': {
        tag: '(3008,0021)',
        vr: 'SQ',
        vm: '1',
        name: 'TreatmentSessionIonBeamSequence'
    },
    '(3008,0022)': {
        tag: '(3008,0022)',
        vr: 'IS',
        vm: '1',
        name: 'CurrentFractionNumber'
    },
    '(3008,0024)': {
        tag: '(3008,0024)',
        vr: 'DA',
        vm: '1',
        name: 'TreatmentControlPointDate'
    },
    '(3008,0025)': {
        tag: '(3008,0025)',
        vr: 'TM',
        vm: '1',
        name: 'TreatmentControlPointTime'
    },
    '(3008,002A)': {
        tag: '(3008,002A)',
        vr: 'CS',
        vm: '1',
        name: 'TreatmentTerminationStatus'
    },
    '(3008,002B)': {
        tag: '(3008,002B)',
        vr: 'SH',
        vm: '1',
        name: 'TreatmentTerminationCode'
    },
    '(3008,002C)': {
        tag: '(3008,002C)',
        vr: 'CS',
        vm: '1',
        name: 'TreatmentVerificationStatus'
    },
    '(3008,0030)': {
        tag: '(3008,0030)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedTreatmentRecordSequence'
    },
    '(3008,0032)': {
        tag: '(3008,0032)',
        vr: 'DS',
        vm: '1',
        name: 'SpecifiedPrimaryMeterset'
    },
    '(3008,0033)': {
        tag: '(3008,0033)',
        vr: 'DS',
        vm: '1',
        name: 'SpecifiedSecondaryMeterset'
    },
    '(3008,0036)': {
        tag: '(3008,0036)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveredPrimaryMeterset'
    },
    '(3008,0037)': {
        tag: '(3008,0037)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveredSecondaryMeterset'
    },
    '(3008,003A)': {
        tag: '(3008,003A)',
        vr: 'DS',
        vm: '1',
        name: 'SpecifiedTreatmentTime'
    },
    '(3008,003B)': {
        tag: '(3008,003B)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveredTreatmentTime'
    },
    '(3008,0040)': {
        tag: '(3008,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'ControlPointDeliverySequence'
    },
    '(3008,0041)': {
        tag: '(3008,0041)',
        vr: 'SQ',
        vm: '1',
        name: 'IonControlPointDeliverySequence'
    },
    '(3008,0042)': {
        tag: '(3008,0042)',
        vr: 'DS',
        vm: '1',
        name: 'SpecifiedMeterset'
    },
    '(3008,0044)': {
        tag: '(3008,0044)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveredMeterset'
    },
    '(3008,0045)': {
        tag: '(3008,0045)',
        vr: 'FL',
        vm: '1',
        name: 'MetersetRateSet'
    },
    '(3008,0046)': {
        tag: '(3008,0046)',
        vr: 'FL',
        vm: '1',
        name: 'MetersetRateDelivered'
    },
    '(3008,0047)': {
        tag: '(3008,0047)',
        vr: 'FL',
        vm: '1-n',
        name: 'ScanSpotMetersetsDelivered'
    },
    '(3008,0048)': {
        tag: '(3008,0048)',
        vr: 'DS',
        vm: '1',
        name: 'DoseRateDelivered'
    },
    '(3008,0050)': {
        tag: '(3008,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'TreatmentSummaryCalculatedDoseReferenceSequence'
    },
    '(3008,0052)': {
        tag: '(3008,0052)',
        vr: 'DS',
        vm: '1',
        name: 'CumulativeDoseToDoseReference'
    },
    '(3008,0054)': {
        tag: '(3008,0054)',
        vr: 'DA',
        vm: '1',
        name: 'FirstTreatmentDate'
    },
    '(3008,0056)': {
        tag: '(3008,0056)',
        vr: 'DA',
        vm: '1',
        name: 'MostRecentTreatmentDate'
    },
    '(3008,005A)': {
        tag: '(3008,005A)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfFractionsDelivered'
    },
    '(3008,0060)': {
        tag: '(3008,0060)',
        vr: 'SQ',
        vm: '1',
        name: 'OverrideSequence'
    },
    '(3008,0061)': {
        tag: '(3008,0061)',
        vr: 'AT',
        vm: '1',
        name: 'ParameterSequencePointer'
    },
    '(3008,0062)': {
        tag: '(3008,0062)',
        vr: 'AT',
        vm: '1',
        name: 'OverrideParameterPointer'
    },
    '(3008,0063)': {
        tag: '(3008,0063)',
        vr: 'IS',
        vm: '1',
        name: 'ParameterItemIndex'
    },
    '(3008,0064)': {
        tag: '(3008,0064)',
        vr: 'IS',
        vm: '1',
        name: 'MeasuredDoseReferenceNumber'
    },
    '(3008,0065)': {
        tag: '(3008,0065)',
        vr: 'AT',
        vm: '1',
        name: 'ParameterPointer'
    },
    '(3008,0066)': {
        tag: '(3008,0066)',
        vr: 'ST',
        vm: '1',
        name: 'OverrideReason'
    },
    '(3008,0068)': {
        tag: '(3008,0068)',
        vr: 'SQ',
        vm: '1',
        name: 'CorrectedParameterSequence'
    },
    '(3008,006A)': {
        tag: '(3008,006A)',
        vr: 'FL',
        vm: '1',
        name: 'CorrectionValue'
    },
    '(3008,0070)': {
        tag: '(3008,0070)',
        vr: 'SQ',
        vm: '1',
        name: 'CalculatedDoseReferenceSequence'
    },
    '(3008,0072)': {
        tag: '(3008,0072)',
        vr: 'IS',
        vm: '1',
        name: 'CalculatedDoseReferenceNumber'
    },
    '(3008,0074)': {
        tag: '(3008,0074)',
        vr: 'ST',
        vm: '1',
        name: 'CalculatedDoseReferenceDescription'
    },
    '(3008,0076)': {
        tag: '(3008,0076)',
        vr: 'DS',
        vm: '1',
        name: 'CalculatedDoseReferenceDoseValue'
    },
    '(3008,0078)': {
        tag: '(3008,0078)',
        vr: 'DS',
        vm: '1',
        name: 'StartMeterset'
    },
    '(3008,007A)': {
        tag: '(3008,007A)',
        vr: 'DS',
        vm: '1',
        name: 'EndMeterset'
    },
    '(3008,0080)': {
        tag: '(3008,0080)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedMeasuredDoseReferenceSequence'
    },
    '(3008,0082)': {
        tag: '(3008,0082)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedMeasuredDoseReferenceNumber'
    },
    '(3008,0090)': {
        tag: '(3008,0090)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedCalculatedDoseReferenceSequence'
    },
    '(3008,0092)': {
        tag: '(3008,0092)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedCalculatedDoseReferenceNumber'
    },
    '(3008,00A0)': {
        tag: '(3008,00A0)',
        vr: 'SQ',
        vm: '1',
        name: 'BeamLimitingDeviceLeafPairsSequence'
    },
    '(3008,00B0)': {
        tag: '(3008,00B0)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedWedgeSequence'
    },
    '(3008,00C0)': {
        tag: '(3008,00C0)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedCompensatorSequence'
    },
    '(3008,00D0)': {
        tag: '(3008,00D0)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedBlockSequence'
    },
    '(3008,00E0)': {
        tag: '(3008,00E0)',
        vr: 'SQ',
        vm: '1',
        name: 'TreatmentSummaryMeasuredDoseReferenceSequence'
    },
    '(3008,00F0)': {
        tag: '(3008,00F0)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedSnoutSequence'
    },
    '(3008,00F2)': {
        tag: '(3008,00F2)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedRangeShifterSequence'
    },
    '(3008,00F4)': {
        tag: '(3008,00F4)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedLateralSpreadingDeviceSequence'
    },
    '(3008,00F6)': {
        tag: '(3008,00F6)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedRangeModulatorSequence'
    },
    '(3008,0100)': {
        tag: '(3008,0100)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedSourceSequence'
    },
    '(3008,0105)': {
        tag: '(3008,0105)',
        vr: 'LO',
        vm: '1',
        name: 'SourceSerialNumber'
    },
    '(3008,0110)': {
        tag: '(3008,0110)',
        vr: 'SQ',
        vm: '1',
        name: 'TreatmentSessionApplicationSetupSequence'
    },
    '(3008,0116)': {
        tag: '(3008,0116)',
        vr: 'CS',
        vm: '1',
        name: 'ApplicationSetupCheck'
    },
    '(3008,0120)': {
        tag: '(3008,0120)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedBrachyAccessoryDeviceSequence'
    },
    '(3008,0122)': {
        tag: '(3008,0122)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedBrachyAccessoryDeviceNumber'
    },
    '(3008,0130)': {
        tag: '(3008,0130)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedChannelSequence'
    },
    '(3008,0132)': {
        tag: '(3008,0132)',
        vr: 'DS',
        vm: '1',
        name: 'SpecifiedChannelTotalTime'
    },
    '(3008,0134)': {
        tag: '(3008,0134)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveredChannelTotalTime'
    },
    '(3008,0136)': {
        tag: '(3008,0136)',
        vr: 'IS',
        vm: '1',
        name: 'SpecifiedNumberOfPulses'
    },
    '(3008,0138)': {
        tag: '(3008,0138)',
        vr: 'IS',
        vm: '1',
        name: 'DeliveredNumberOfPulses'
    },
    '(3008,013A)': {
        tag: '(3008,013A)',
        vr: 'DS',
        vm: '1',
        name: 'SpecifiedPulseRepetitionInterval'
    },
    '(3008,013C)': {
        tag: '(3008,013C)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveredPulseRepetitionInterval'
    },
    '(3008,0140)': {
        tag: '(3008,0140)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedSourceApplicatorSequence'
    },
    '(3008,0142)': {
        tag: '(3008,0142)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedSourceApplicatorNumber'
    },
    '(3008,0150)': {
        tag: '(3008,0150)',
        vr: 'SQ',
        vm: '1',
        name: 'RecordedChannelShieldSequence'
    },
    '(3008,0152)': {
        tag: '(3008,0152)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedChannelShieldNumber'
    },
    '(3008,0160)': {
        tag: '(3008,0160)',
        vr: 'SQ',
        vm: '1',
        name: 'BrachyControlPointDeliveredSequence'
    },
    '(3008,0162)': {
        tag: '(3008,0162)',
        vr: 'DA',
        vm: '1',
        name: 'SafePositionExitDate'
    },
    '(3008,0164)': {
        tag: '(3008,0164)',
        vr: 'TM',
        vm: '1',
        name: 'SafePositionExitTime'
    },
    '(3008,0166)': {
        tag: '(3008,0166)',
        vr: 'DA',
        vm: '1',
        name: 'SafePositionReturnDate'
    },
    '(3008,0168)': {
        tag: '(3008,0168)',
        vr: 'TM',
        vm: '1',
        name: 'SafePositionReturnTime'
    },
    '(3008,0200)': {
        tag: '(3008,0200)',
        vr: 'CS',
        vm: '1',
        name: 'CurrentTreatmentStatus'
    },
    '(3008,0202)': {
        tag: '(3008,0202)',
        vr: 'ST',
        vm: '1',
        name: 'TreatmentStatusComment'
    },
    '(3008,0220)': {
        tag: '(3008,0220)',
        vr: 'SQ',
        vm: '1',
        name: 'FractionGroupSummarySequence'
    },
    '(3008,0223)': {
        tag: '(3008,0223)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedFractionNumber'
    },
    '(3008,0224)': {
        tag: '(3008,0224)',
        vr: 'CS',
        vm: '1',
        name: 'FractionGroupType'
    },
    '(3008,0230)': {
        tag: '(3008,0230)',
        vr: 'CS',
        vm: '1',
        name: 'BeamStopperPosition'
    },
    '(3008,0240)': {
        tag: '(3008,0240)',
        vr: 'SQ',
        vm: '1',
        name: 'FractionStatusSummarySequence'
    },
    '(3008,0250)': {
        tag: '(3008,0250)',
        vr: 'DA',
        vm: '1',
        name: 'TreatmentDate'
    },
    '(3008,0251)': {
        tag: '(3008,0251)',
        vr: 'TM',
        vm: '1',
        name: 'TreatmentTime'
    },
    '(300A,0002)': {
        tag: '(300A,0002)',
        vr: 'SH',
        vm: '1',
        name: 'RTPlanLabel'
    },
    '(300A,0003)': {
        tag: '(300A,0003)',
        vr: 'LO',
        vm: '1',
        name: 'RTPlanName'
    },
    '(300A,0004)': {
        tag: '(300A,0004)',
        vr: 'ST',
        vm: '1',
        name: 'RTPlanDescription'
    },
    '(300A,0006)': {
        tag: '(300A,0006)',
        vr: 'DA',
        vm: '1',
        name: 'RTPlanDate'
    },
    '(300A,0007)': {
        tag: '(300A,0007)',
        vr: 'TM',
        vm: '1',
        name: 'RTPlanTime'
    },
    '(300A,0009)': {
        tag: '(300A,0009)',
        vr: 'LO',
        vm: '1-n',
        name: 'TreatmentProtocols'
    },
    '(300A,000A)': {
        tag: '(300A,000A)',
        vr: 'CS',
        vm: '1',
        name: 'PlanIntent'
    },
    '(300A,000B)': {
        tag: '(300A,000B)',
        vr: 'LO',
        vm: '1-n',
        name: 'TreatmentSites'
    },
    '(300A,000C)': {
        tag: '(300A,000C)',
        vr: 'CS',
        vm: '1',
        name: 'RTPlanGeometry'
    },
    '(300A,000E)': {
        tag: '(300A,000E)',
        vr: 'ST',
        vm: '1',
        name: 'PrescriptionDescription'
    },
    '(300A,0010)': {
        tag: '(300A,0010)',
        vr: 'SQ',
        vm: '1',
        name: 'DoseReferenceSequence'
    },
    '(300A,0012)': {
        tag: '(300A,0012)',
        vr: 'IS',
        vm: '1',
        name: 'DoseReferenceNumber'
    },
    '(300A,0013)': {
        tag: '(300A,0013)',
        vr: 'UI',
        vm: '1',
        name: 'DoseReferenceUID'
    },
    '(300A,0014)': {
        tag: '(300A,0014)',
        vr: 'CS',
        vm: '1',
        name: 'DoseReferenceStructureType'
    },
    '(300A,0015)': {
        tag: '(300A,0015)',
        vr: 'CS',
        vm: '1',
        name: 'NominalBeamEnergyUnit'
    },
    '(300A,0016)': {
        tag: '(300A,0016)',
        vr: 'LO',
        vm: '1',
        name: 'DoseReferenceDescription'
    },
    '(300A,0018)': {
        tag: '(300A,0018)',
        vr: 'DS',
        vm: '3',
        name: 'DoseReferencePointCoordinates'
    },
    '(300A,001A)': {
        tag: '(300A,001A)',
        vr: 'DS',
        vm: '1',
        name: 'NominalPriorDose'
    },
    '(300A,0020)': {
        tag: '(300A,0020)',
        vr: 'CS',
        vm: '1',
        name: 'DoseReferenceType'
    },
    '(300A,0021)': {
        tag: '(300A,0021)',
        vr: 'DS',
        vm: '1',
        name: 'ConstraintWeight'
    },
    '(300A,0022)': {
        tag: '(300A,0022)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveryWarningDose'
    },
    '(300A,0023)': {
        tag: '(300A,0023)',
        vr: 'DS',
        vm: '1',
        name: 'DeliveryMaximumDose'
    },
    '(300A,0025)': {
        tag: '(300A,0025)',
        vr: 'DS',
        vm: '1',
        name: 'TargetMinimumDose'
    },
    '(300A,0026)': {
        tag: '(300A,0026)',
        vr: 'DS',
        vm: '1',
        name: 'TargetPrescriptionDose'
    },
    '(300A,0027)': {
        tag: '(300A,0027)',
        vr: 'DS',
        vm: '1',
        name: 'TargetMaximumDose'
    },
    '(300A,0028)': {
        tag: '(300A,0028)',
        vr: 'DS',
        vm: '1',
        name: 'TargetUnderdoseVolumeFraction'
    },
    '(300A,002A)': {
        tag: '(300A,002A)',
        vr: 'DS',
        vm: '1',
        name: 'OrganAtRiskFullVolumeDose'
    },
    '(300A,002B)': {
        tag: '(300A,002B)',
        vr: 'DS',
        vm: '1',
        name: 'OrganAtRiskLimitDose'
    },
    '(300A,002C)': {
        tag: '(300A,002C)',
        vr: 'DS',
        vm: '1',
        name: 'OrganAtRiskMaximumDose'
    },
    '(300A,002D)': {
        tag: '(300A,002D)',
        vr: 'DS',
        vm: '1',
        name: 'OrganAtRiskOverdoseVolumeFraction'
    },
    '(300A,0040)': {
        tag: '(300A,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'ToleranceTableSequence'
    },
    '(300A,0042)': {
        tag: '(300A,0042)',
        vr: 'IS',
        vm: '1',
        name: 'ToleranceTableNumber'
    },
    '(300A,0043)': {
        tag: '(300A,0043)',
        vr: 'SH',
        vm: '1',
        name: 'ToleranceTableLabel'
    },
    '(300A,0044)': {
        tag: '(300A,0044)',
        vr: 'DS',
        vm: '1',
        name: 'GantryAngleTolerance'
    },
    '(300A,0046)': {
        tag: '(300A,0046)',
        vr: 'DS',
        vm: '1',
        name: 'BeamLimitingDeviceAngleTolerance'
    },
    '(300A,0048)': {
        tag: '(300A,0048)',
        vr: 'SQ',
        vm: '1',
        name: 'BeamLimitingDeviceToleranceSequence'
    },
    '(300A,004A)': {
        tag: '(300A,004A)',
        vr: 'DS',
        vm: '1',
        name: 'BeamLimitingDevicePositionTolerance'
    },
    '(300A,004B)': {
        tag: '(300A,004B)',
        vr: 'FL',
        vm: '1',
        name: 'SnoutPositionTolerance'
    },
    '(300A,004C)': {
        tag: '(300A,004C)',
        vr: 'DS',
        vm: '1',
        name: 'PatientSupportAngleTolerance'
    },
    '(300A,004E)': {
        tag: '(300A,004E)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopEccentricAngleTolerance'
    },
    '(300A,004F)': {
        tag: '(300A,004F)',
        vr: 'FL',
        vm: '1',
        name: 'TableTopPitchAngleTolerance'
    },
    '(300A,0050)': {
        tag: '(300A,0050)',
        vr: 'FL',
        vm: '1',
        name: 'TableTopRollAngleTolerance'
    },
    '(300A,0051)': {
        tag: '(300A,0051)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopVerticalPositionTolerance'
    },
    '(300A,0052)': {
        tag: '(300A,0052)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopLongitudinalPositionTolerance'
    },
    '(300A,0053)': {
        tag: '(300A,0053)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopLateralPositionTolerance'
    },
    '(300A,0055)': {
        tag: '(300A,0055)',
        vr: 'CS',
        vm: '1',
        name: 'RTPlanRelationship'
    },
    '(300A,0070)': {
        tag: '(300A,0070)',
        vr: 'SQ',
        vm: '1',
        name: 'FractionGroupSequence'
    },
    '(300A,0071)': {
        tag: '(300A,0071)',
        vr: 'IS',
        vm: '1',
        name: 'FractionGroupNumber'
    },
    '(300A,0072)': {
        tag: '(300A,0072)',
        vr: 'LO',
        vm: '1',
        name: 'FractionGroupDescription'
    },
    '(300A,0078)': {
        tag: '(300A,0078)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfFractionsPlanned'
    },
    '(300A,0079)': {
        tag: '(300A,0079)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfFractionPatternDigitsPerDay'
    },
    '(300A,007A)': {
        tag: '(300A,007A)',
        vr: 'IS',
        vm: '1',
        name: 'RepeatFractionCycleLength'
    },
    '(300A,007B)': {
        tag: '(300A,007B)',
        vr: 'LT',
        vm: '1',
        name: 'FractionPattern'
    },
    '(300A,0080)': {
        tag: '(300A,0080)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfBeams'
    },
    '(300A,0082)': {
        tag: '(300A,0082)',
        vr: 'DS',
        vm: '3',
        name: 'BeamDoseSpecificationPoint'
    },
    '(300A,0084)': {
        tag: '(300A,0084)',
        vr: 'DS',
        vm: '1',
        name: 'BeamDose'
    },
    '(300A,0086)': {
        tag: '(300A,0086)',
        vr: 'DS',
        vm: '1',
        name: 'BeamMeterset'
    },
    '(300A,0088)': {
        tag: '(300A,0088)',
        vr: 'FL',
        vm: '1',
        name: 'BeamDosePointDepth'
    },
    '(300A,0089)': {
        tag: '(300A,0089)',
        vr: 'FL',
        vm: '1',
        name: 'BeamDosePointEquivalentDepth'
    },
    '(300A,008A)': {
        tag: '(300A,008A)',
        vr: 'FL',
        vm: '1',
        name: 'BeamDosePointSSD'
    },
    '(300A,00A0)': {
        tag: '(300A,00A0)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfBrachyApplicationSetups'
    },
    '(300A,00A2)': {
        tag: '(300A,00A2)',
        vr: 'DS',
        vm: '3',
        name: 'BrachyApplicationSetupDoseSpecificationPoint'
    },
    '(300A,00A4)': {
        tag: '(300A,00A4)',
        vr: 'DS',
        vm: '1',
        name: 'BrachyApplicationSetupDose'
    },
    '(300A,00B0)': {
        tag: '(300A,00B0)',
        vr: 'SQ',
        vm: '1',
        name: 'BeamSequence'
    },
    '(300A,00B2)': {
        tag: '(300A,00B2)',
        vr: 'SH',
        vm: '1',
        name: 'TreatmentMachineName'
    },
    '(300A,00B3)': {
        tag: '(300A,00B3)',
        vr: 'CS',
        vm: '1',
        name: 'PrimaryDosimeterUnit'
    },
    '(300A,00B4)': {
        tag: '(300A,00B4)',
        vr: 'DS',
        vm: '1',
        name: 'SourceAxisDistance'
    },
    '(300A,00B6)': {
        tag: '(300A,00B6)',
        vr: 'SQ',
        vm: '1',
        name: 'BeamLimitingDeviceSequence'
    },
    '(300A,00B8)': {
        tag: '(300A,00B8)',
        vr: 'CS',
        vm: '1',
        name: 'RTBeamLimitingDeviceType'
    },
    '(300A,00BA)': {
        tag: '(300A,00BA)',
        vr: 'DS',
        vm: '1',
        name: 'SourceToBeamLimitingDeviceDistance'
    },
    '(300A,00BB)': {
        tag: '(300A,00BB)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToBeamLimitingDeviceDistance'
    },
    '(300A,00BC)': {
        tag: '(300A,00BC)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfLeafJawPairs'
    },
    '(300A,00BE)': {
        tag: '(300A,00BE)',
        vr: 'DS',
        vm: '3-n',
        name: 'LeafPositionBoundaries'
    },
    '(300A,00C0)': {
        tag: '(300A,00C0)',
        vr: 'IS',
        vm: '1',
        name: 'BeamNumber'
    },
    '(300A,00C2)': {
        tag: '(300A,00C2)',
        vr: 'LO',
        vm: '1',
        name: 'BeamName'
    },
    '(300A,00C3)': {
        tag: '(300A,00C3)',
        vr: 'ST',
        vm: '1',
        name: 'BeamDescription'
    },
    '(300A,00C4)': {
        tag: '(300A,00C4)',
        vr: 'CS',
        vm: '1',
        name: 'BeamType'
    },
    '(300A,00C6)': {
        tag: '(300A,00C6)',
        vr: 'CS',
        vm: '1',
        name: 'RadiationType'
    },
    '(300A,00C7)': {
        tag: '(300A,00C7)',
        vr: 'CS',
        vm: '1',
        name: 'HighDoseTechniqueType'
    },
    '(300A,00C8)': {
        tag: '(300A,00C8)',
        vr: 'IS',
        vm: '1',
        name: 'ReferenceImageNumber'
    },
    '(300A,00CA)': {
        tag: '(300A,00CA)',
        vr: 'SQ',
        vm: '1',
        name: 'PlannedVerificationImageSequence'
    },
    '(300A,00CC)': {
        tag: '(300A,00CC)',
        vr: 'LO',
        vm: '1-n',
        name: 'ImagingDeviceSpecificAcquisitionParameters'
    },
    '(300A,00CE)': {
        tag: '(300A,00CE)',
        vr: 'CS',
        vm: '1',
        name: 'TreatmentDeliveryType'
    },
    '(300A,00D0)': {
        tag: '(300A,00D0)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfWedges'
    },
    '(300A,00D1)': {
        tag: '(300A,00D1)',
        vr: 'SQ',
        vm: '1',
        name: 'WedgeSequence'
    },
    '(300A,00D2)': {
        tag: '(300A,00D2)',
        vr: 'IS',
        vm: '1',
        name: 'WedgeNumber'
    },
    '(300A,00D3)': {
        tag: '(300A,00D3)',
        vr: 'CS',
        vm: '1',
        name: 'WedgeType'
    },
    '(300A,00D4)': {
        tag: '(300A,00D4)',
        vr: 'SH',
        vm: '1',
        name: 'WedgeID'
    },
    '(300A,00D5)': {
        tag: '(300A,00D5)',
        vr: 'IS',
        vm: '1',
        name: 'WedgeAngle'
    },
    '(300A,00D6)': {
        tag: '(300A,00D6)',
        vr: 'DS',
        vm: '1',
        name: 'WedgeFactor'
    },
    '(300A,00D7)': {
        tag: '(300A,00D7)',
        vr: 'FL',
        vm: '1',
        name: 'TotalWedgeTrayWaterEquivalentThickness'
    },
    '(300A,00D8)': {
        tag: '(300A,00D8)',
        vr: 'DS',
        vm: '1',
        name: 'WedgeOrientation'
    },
    '(300A,00D9)': {
        tag: '(300A,00D9)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToWedgeTrayDistance'
    },
    '(300A,00DA)': {
        tag: '(300A,00DA)',
        vr: 'DS',
        vm: '1',
        name: 'SourceToWedgeTrayDistance'
    },
    '(300A,00DB)': {
        tag: '(300A,00DB)',
        vr: 'FL',
        vm: '1',
        name: 'WedgeThinEdgePosition'
    },
    '(300A,00DC)': {
        tag: '(300A,00DC)',
        vr: 'SH',
        vm: '1',
        name: 'BolusID'
    },
    '(300A,00DD)': {
        tag: '(300A,00DD)',
        vr: 'ST',
        vm: '1',
        name: 'BolusDescription'
    },
    '(300A,00E0)': {
        tag: '(300A,00E0)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfCompensators'
    },
    '(300A,00E1)': {
        tag: '(300A,00E1)',
        vr: 'SH',
        vm: '1',
        name: 'MaterialID'
    },
    '(300A,00E2)': {
        tag: '(300A,00E2)',
        vr: 'DS',
        vm: '1',
        name: 'TotalCompensatorTrayFactor'
    },
    '(300A,00E3)': {
        tag: '(300A,00E3)',
        vr: 'SQ',
        vm: '1',
        name: 'CompensatorSequence'
    },
    '(300A,00E4)': {
        tag: '(300A,00E4)',
        vr: 'IS',
        vm: '1',
        name: 'CompensatorNumber'
    },
    '(300A,00E5)': {
        tag: '(300A,00E5)',
        vr: 'SH',
        vm: '1',
        name: 'CompensatorID'
    },
    '(300A,00E6)': {
        tag: '(300A,00E6)',
        vr: 'DS',
        vm: '1',
        name: 'SourceToCompensatorTrayDistance'
    },
    '(300A,00E7)': {
        tag: '(300A,00E7)',
        vr: 'IS',
        vm: '1',
        name: 'CompensatorRows'
    },
    '(300A,00E8)': {
        tag: '(300A,00E8)',
        vr: 'IS',
        vm: '1',
        name: 'CompensatorColumns'
    },
    '(300A,00E9)': {
        tag: '(300A,00E9)',
        vr: 'DS',
        vm: '2',
        name: 'CompensatorPixelSpacing'
    },
    '(300A,00EA)': {
        tag: '(300A,00EA)',
        vr: 'DS',
        vm: '2',
        name: 'CompensatorPosition'
    },
    '(300A,00EB)': {
        tag: '(300A,00EB)',
        vr: 'DS',
        vm: '1-n',
        name: 'CompensatorTransmissionData'
    },
    '(300A,00EC)': {
        tag: '(300A,00EC)',
        vr: 'DS',
        vm: '1-n',
        name: 'CompensatorThicknessData'
    },
    '(300A,00ED)': {
        tag: '(300A,00ED)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfBoli'
    },
    '(300A,00EE)': {
        tag: '(300A,00EE)',
        vr: 'CS',
        vm: '1',
        name: 'CompensatorType'
    },
    '(300A,00F0)': {
        tag: '(300A,00F0)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfBlocks'
    },
    '(300A,00F2)': {
        tag: '(300A,00F2)',
        vr: 'DS',
        vm: '1',
        name: 'TotalBlockTrayFactor'
    },
    '(300A,00F3)': {
        tag: '(300A,00F3)',
        vr: 'FL',
        vm: '1',
        name: 'TotalBlockTrayWaterEquivalentThickness'
    },
    '(300A,00F4)': {
        tag: '(300A,00F4)',
        vr: 'SQ',
        vm: '1',
        name: 'BlockSequence'
    },
    '(300A,00F5)': {
        tag: '(300A,00F5)',
        vr: 'SH',
        vm: '1',
        name: 'BlockTrayID'
    },
    '(300A,00F6)': {
        tag: '(300A,00F6)',
        vr: 'DS',
        vm: '1',
        name: 'SourceToBlockTrayDistance'
    },
    '(300A,00F7)': {
        tag: '(300A,00F7)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToBlockTrayDistance'
    },
    '(300A,00F8)': {
        tag: '(300A,00F8)',
        vr: 'CS',
        vm: '1',
        name: 'BlockType'
    },
    '(300A,00F9)': {
        tag: '(300A,00F9)',
        vr: 'LO',
        vm: '1',
        name: 'AccessoryCode'
    },
    '(300A,00FA)': {
        tag: '(300A,00FA)',
        vr: 'CS',
        vm: '1',
        name: 'BlockDivergence'
    },
    '(300A,00FB)': {
        tag: '(300A,00FB)',
        vr: 'CS',
        vm: '1',
        name: 'BlockMountingPosition'
    },
    '(300A,00FC)': {
        tag: '(300A,00FC)',
        vr: 'IS',
        vm: '1',
        name: 'BlockNumber'
    },
    '(300A,00FE)': {
        tag: '(300A,00FE)',
        vr: 'LO',
        vm: '1',
        name: 'BlockName'
    },
    '(300A,0100)': {
        tag: '(300A,0100)',
        vr: 'DS',
        vm: '1',
        name: 'BlockThickness'
    },
    '(300A,0102)': {
        tag: '(300A,0102)',
        vr: 'DS',
        vm: '1',
        name: 'BlockTransmission'
    },
    '(300A,0104)': {
        tag: '(300A,0104)',
        vr: 'IS',
        vm: '1',
        name: 'BlockNumberOfPoints'
    },
    '(300A,0106)': {
        tag: '(300A,0106)',
        vr: 'DS',
        vm: '2-2n',
        name: 'BlockData'
    },
    '(300A,0107)': {
        tag: '(300A,0107)',
        vr: 'SQ',
        vm: '1',
        name: 'ApplicatorSequence'
    },
    '(300A,0108)': {
        tag: '(300A,0108)',
        vr: 'SH',
        vm: '1',
        name: 'ApplicatorID'
    },
    '(300A,0109)': {
        tag: '(300A,0109)',
        vr: 'CS',
        vm: '1',
        name: 'ApplicatorType'
    },
    '(300A,010A)': {
        tag: '(300A,010A)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicatorDescription'
    },
    '(300A,010C)': {
        tag: '(300A,010C)',
        vr: 'DS',
        vm: '1',
        name: 'CumulativeDoseReferenceCoefficient'
    },
    '(300A,010E)': {
        tag: '(300A,010E)',
        vr: 'DS',
        vm: '1',
        name: 'FinalCumulativeMetersetWeight'
    },
    '(300A,0110)': {
        tag: '(300A,0110)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfControlPoints'
    },
    '(300A,0111)': {
        tag: '(300A,0111)',
        vr: 'SQ',
        vm: '1',
        name: 'ControlPointSequence'
    },
    '(300A,0112)': {
        tag: '(300A,0112)',
        vr: 'IS',
        vm: '1',
        name: 'ControlPointIndex'
    },
    '(300A,0114)': {
        tag: '(300A,0114)',
        vr: 'DS',
        vm: '1',
        name: 'NominalBeamEnergy'
    },
    '(300A,0115)': {
        tag: '(300A,0115)',
        vr: 'DS',
        vm: '1',
        name: 'DoseRateSet'
    },
    '(300A,0116)': {
        tag: '(300A,0116)',
        vr: 'SQ',
        vm: '1',
        name: 'WedgePositionSequence'
    },
    '(300A,0118)': {
        tag: '(300A,0118)',
        vr: 'CS',
        vm: '1',
        name: 'WedgePosition'
    },
    '(300A,011A)': {
        tag: '(300A,011A)',
        vr: 'SQ',
        vm: '1',
        name: 'BeamLimitingDevicePositionSequence'
    },
    '(300A,011C)': {
        tag: '(300A,011C)',
        vr: 'DS',
        vm: '2-2n',
        name: 'LeafJawPositions'
    },
    '(300A,011E)': {
        tag: '(300A,011E)',
        vr: 'DS',
        vm: '1',
        name: 'GantryAngle'
    },
    '(300A,011F)': {
        tag: '(300A,011F)',
        vr: 'CS',
        vm: '1',
        name: 'GantryRotationDirection'
    },
    '(300A,0120)': {
        tag: '(300A,0120)',
        vr: 'DS',
        vm: '1',
        name: 'BeamLimitingDeviceAngle'
    },
    '(300A,0121)': {
        tag: '(300A,0121)',
        vr: 'CS',
        vm: '1',
        name: 'BeamLimitingDeviceRotationDirection'
    },
    '(300A,0122)': {
        tag: '(300A,0122)',
        vr: 'DS',
        vm: '1',
        name: 'PatientSupportAngle'
    },
    '(300A,0123)': {
        tag: '(300A,0123)',
        vr: 'CS',
        vm: '1',
        name: 'PatientSupportRotationDirection'
    },
    '(300A,0124)': {
        tag: '(300A,0124)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopEccentricAxisDistance'
    },
    '(300A,0125)': {
        tag: '(300A,0125)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopEccentricAngle'
    },
    '(300A,0126)': {
        tag: '(300A,0126)',
        vr: 'CS',
        vm: '1',
        name: 'TableTopEccentricRotationDirection'
    },
    '(300A,0128)': {
        tag: '(300A,0128)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopVerticalPosition'
    },
    '(300A,0129)': {
        tag: '(300A,0129)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopLongitudinalPosition'
    },
    '(300A,012A)': {
        tag: '(300A,012A)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopLateralPosition'
    },
    '(300A,012C)': {
        tag: '(300A,012C)',
        vr: 'DS',
        vm: '3',
        name: 'IsocenterPosition'
    },
    '(300A,012E)': {
        tag: '(300A,012E)',
        vr: 'DS',
        vm: '3',
        name: 'SurfaceEntryPoint'
    },
    '(300A,0130)': {
        tag: '(300A,0130)',
        vr: 'DS',
        vm: '1',
        name: 'SourceToSurfaceDistance'
    },
    '(300A,0134)': {
        tag: '(300A,0134)',
        vr: 'DS',
        vm: '1',
        name: 'CumulativeMetersetWeight'
    },
    '(300A,0140)': {
        tag: '(300A,0140)',
        vr: 'FL',
        vm: '1',
        name: 'TableTopPitchAngle'
    },
    '(300A,0142)': {
        tag: '(300A,0142)',
        vr: 'CS',
        vm: '1',
        name: 'TableTopPitchRotationDirection'
    },
    '(300A,0144)': {
        tag: '(300A,0144)',
        vr: 'FL',
        vm: '1',
        name: 'TableTopRollAngle'
    },
    '(300A,0146)': {
        tag: '(300A,0146)',
        vr: 'CS',
        vm: '1',
        name: 'TableTopRollRotationDirection'
    },
    '(300A,0148)': {
        tag: '(300A,0148)',
        vr: 'FL',
        vm: '1',
        name: 'HeadFixationAngle'
    },
    '(300A,014A)': {
        tag: '(300A,014A)',
        vr: 'FL',
        vm: '1',
        name: 'GantryPitchAngle'
    },
    '(300A,014C)': {
        tag: '(300A,014C)',
        vr: 'CS',
        vm: '1',
        name: 'GantryPitchRotationDirection'
    },
    '(300A,014E)': {
        tag: '(300A,014E)',
        vr: 'FL',
        vm: '1',
        name: 'GantryPitchAngleTolerance'
    },
    '(300A,0180)': {
        tag: '(300A,0180)',
        vr: 'SQ',
        vm: '1',
        name: 'PatientSetupSequence'
    },
    '(300A,0182)': {
        tag: '(300A,0182)',
        vr: 'IS',
        vm: '1',
        name: 'PatientSetupNumber'
    },
    '(300A,0183)': {
        tag: '(300A,0183)',
        vr: 'LO',
        vm: '1',
        name: 'PatientSetupLabel'
    },
    '(300A,0184)': {
        tag: '(300A,0184)',
        vr: 'LO',
        vm: '1',
        name: 'PatientAdditionalPosition'
    },
    '(300A,0190)': {
        tag: '(300A,0190)',
        vr: 'SQ',
        vm: '1',
        name: 'FixationDeviceSequence'
    },
    '(300A,0192)': {
        tag: '(300A,0192)',
        vr: 'CS',
        vm: '1',
        name: 'FixationDeviceType'
    },
    '(300A,0194)': {
        tag: '(300A,0194)',
        vr: 'SH',
        vm: '1',
        name: 'FixationDeviceLabel'
    },
    '(300A,0196)': {
        tag: '(300A,0196)',
        vr: 'ST',
        vm: '1',
        name: 'FixationDeviceDescription'
    },
    '(300A,0198)': {
        tag: '(300A,0198)',
        vr: 'SH',
        vm: '1',
        name: 'FixationDevicePosition'
    },
    '(300A,0199)': {
        tag: '(300A,0199)',
        vr: 'FL',
        vm: '1',
        name: 'FixationDevicePitchAngle'
    },
    '(300A,019A)': {
        tag: '(300A,019A)',
        vr: 'FL',
        vm: '1',
        name: 'FixationDeviceRollAngle'
    },
    '(300A,01A0)': {
        tag: '(300A,01A0)',
        vr: 'SQ',
        vm: '1',
        name: 'ShieldingDeviceSequence'
    },
    '(300A,01A2)': {
        tag: '(300A,01A2)',
        vr: 'CS',
        vm: '1',
        name: 'ShieldingDeviceType'
    },
    '(300A,01A4)': {
        tag: '(300A,01A4)',
        vr: 'SH',
        vm: '1',
        name: 'ShieldingDeviceLabel'
    },
    '(300A,01A6)': {
        tag: '(300A,01A6)',
        vr: 'ST',
        vm: '1',
        name: 'ShieldingDeviceDescription'
    },
    '(300A,01A8)': {
        tag: '(300A,01A8)',
        vr: 'SH',
        vm: '1',
        name: 'ShieldingDevicePosition'
    },
    '(300A,01B0)': {
        tag: '(300A,01B0)',
        vr: 'CS',
        vm: '1',
        name: 'SetupTechnique'
    },
    '(300A,01B2)': {
        tag: '(300A,01B2)',
        vr: 'ST',
        vm: '1',
        name: 'SetupTechniqueDescription'
    },
    '(300A,01B4)': {
        tag: '(300A,01B4)',
        vr: 'SQ',
        vm: '1',
        name: 'SetupDeviceSequence'
    },
    '(300A,01B6)': {
        tag: '(300A,01B6)',
        vr: 'CS',
        vm: '1',
        name: 'SetupDeviceType'
    },
    '(300A,01B8)': {
        tag: '(300A,01B8)',
        vr: 'SH',
        vm: '1',
        name: 'SetupDeviceLabel'
    },
    '(300A,01BA)': {
        tag: '(300A,01BA)',
        vr: 'ST',
        vm: '1',
        name: 'SetupDeviceDescription'
    },
    '(300A,01BC)': {
        tag: '(300A,01BC)',
        vr: 'DS',
        vm: '1',
        name: 'SetupDeviceParameter'
    },
    '(300A,01D0)': {
        tag: '(300A,01D0)',
        vr: 'ST',
        vm: '1',
        name: 'SetupReferenceDescription'
    },
    '(300A,01D2)': {
        tag: '(300A,01D2)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopVerticalSetupDisplacement'
    },
    '(300A,01D4)': {
        tag: '(300A,01D4)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopLongitudinalSetupDisplacement'
    },
    '(300A,01D6)': {
        tag: '(300A,01D6)',
        vr: 'DS',
        vm: '1',
        name: 'TableTopLateralSetupDisplacement'
    },
    '(300A,0200)': {
        tag: '(300A,0200)',
        vr: 'CS',
        vm: '1',
        name: 'BrachyTreatmentTechnique'
    },
    '(300A,0202)': {
        tag: '(300A,0202)',
        vr: 'CS',
        vm: '1',
        name: 'BrachyTreatmentType'
    },
    '(300A,0206)': {
        tag: '(300A,0206)',
        vr: 'SQ',
        vm: '1',
        name: 'TreatmentMachineSequence'
    },
    '(300A,0210)': {
        tag: '(300A,0210)',
        vr: 'SQ',
        vm: '1',
        name: 'SourceSequence'
    },
    '(300A,0212)': {
        tag: '(300A,0212)',
        vr: 'IS',
        vm: '1',
        name: 'SourceNumber'
    },
    '(300A,0214)': {
        tag: '(300A,0214)',
        vr: 'CS',
        vm: '1',
        name: 'SourceType'
    },
    '(300A,0216)': {
        tag: '(300A,0216)',
        vr: 'LO',
        vm: '1',
        name: 'SourceManufacturer'
    },
    '(300A,0218)': {
        tag: '(300A,0218)',
        vr: 'DS',
        vm: '1',
        name: 'ActiveSourceDiameter'
    },
    '(300A,021A)': {
        tag: '(300A,021A)',
        vr: 'DS',
        vm: '1',
        name: 'ActiveSourceLength'
    },
    '(300A,0222)': {
        tag: '(300A,0222)',
        vr: 'DS',
        vm: '1',
        name: 'SourceEncapsulationNominalThickness'
    },
    '(300A,0224)': {
        tag: '(300A,0224)',
        vr: 'DS',
        vm: '1',
        name: 'SourceEncapsulationNominalTransmission'
    },
    '(300A,0226)': {
        tag: '(300A,0226)',
        vr: 'LO',
        vm: '1',
        name: 'SourceIsotopeName'
    },
    '(300A,0228)': {
        tag: '(300A,0228)',
        vr: 'DS',
        vm: '1',
        name: 'SourceIsotopeHalfLife'
    },
    '(300A,0229)': {
        tag: '(300A,0229)',
        vr: 'CS',
        vm: '1',
        name: 'SourceStrengthUnits'
    },
    '(300A,022A)': {
        tag: '(300A,022A)',
        vr: 'DS',
        vm: '1',
        name: 'ReferenceAirKermaRate'
    },
    '(300A,022B)': {
        tag: '(300A,022B)',
        vr: 'DS',
        vm: '1',
        name: 'SourceStrength'
    },
    '(300A,022C)': {
        tag: '(300A,022C)',
        vr: 'DA',
        vm: '1',
        name: 'SourceStrengthReferenceDate'
    },
    '(300A,022E)': {
        tag: '(300A,022E)',
        vr: 'TM',
        vm: '1',
        name: 'SourceStrengthReferenceTime'
    },
    '(300A,0230)': {
        tag: '(300A,0230)',
        vr: 'SQ',
        vm: '1',
        name: 'ApplicationSetupSequence'
    },
    '(300A,0232)': {
        tag: '(300A,0232)',
        vr: 'CS',
        vm: '1',
        name: 'ApplicationSetupType'
    },
    '(300A,0234)': {
        tag: '(300A,0234)',
        vr: 'IS',
        vm: '1',
        name: 'ApplicationSetupNumber'
    },
    '(300A,0236)': {
        tag: '(300A,0236)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicationSetupName'
    },
    '(300A,0238)': {
        tag: '(300A,0238)',
        vr: 'LO',
        vm: '1',
        name: 'ApplicationSetupManufacturer'
    },
    '(300A,0240)': {
        tag: '(300A,0240)',
        vr: 'IS',
        vm: '1',
        name: 'TemplateNumber'
    },
    '(300A,0242)': {
        tag: '(300A,0242)',
        vr: 'SH',
        vm: '1',
        name: 'TemplateType'
    },
    '(300A,0244)': {
        tag: '(300A,0244)',
        vr: 'LO',
        vm: '1',
        name: 'TemplateName'
    },
    '(300A,0250)': {
        tag: '(300A,0250)',
        vr: 'DS',
        vm: '1',
        name: 'TotalReferenceAirKerma'
    },
    '(300A,0260)': {
        tag: '(300A,0260)',
        vr: 'SQ',
        vm: '1',
        name: 'BrachyAccessoryDeviceSequence'
    },
    '(300A,0262)': {
        tag: '(300A,0262)',
        vr: 'IS',
        vm: '1',
        name: 'BrachyAccessoryDeviceNumber'
    },
    '(300A,0263)': {
        tag: '(300A,0263)',
        vr: 'SH',
        vm: '1',
        name: 'BrachyAccessoryDeviceID'
    },
    '(300A,0264)': {
        tag: '(300A,0264)',
        vr: 'CS',
        vm: '1',
        name: 'BrachyAccessoryDeviceType'
    },
    '(300A,0266)': {
        tag: '(300A,0266)',
        vr: 'LO',
        vm: '1',
        name: 'BrachyAccessoryDeviceName'
    },
    '(300A,026A)': {
        tag: '(300A,026A)',
        vr: 'DS',
        vm: '1',
        name: 'BrachyAccessoryDeviceNominalThickness'
    },
    '(300A,026C)': {
        tag: '(300A,026C)',
        vr: 'DS',
        vm: '1',
        name: 'BrachyAccessoryDeviceNominalTransmission'
    },
    '(300A,0280)': {
        tag: '(300A,0280)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelSequence'
    },
    '(300A,0282)': {
        tag: '(300A,0282)',
        vr: 'IS',
        vm: '1',
        name: 'ChannelNumber'
    },
    '(300A,0284)': {
        tag: '(300A,0284)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelLength'
    },
    '(300A,0286)': {
        tag: '(300A,0286)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelTotalTime'
    },
    '(300A,0288)': {
        tag: '(300A,0288)',
        vr: 'CS',
        vm: '1',
        name: 'SourceMovementType'
    },
    '(300A,028A)': {
        tag: '(300A,028A)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfPulses'
    },
    '(300A,028C)': {
        tag: '(300A,028C)',
        vr: 'DS',
        vm: '1',
        name: 'PulseRepetitionInterval'
    },
    '(300A,0290)': {
        tag: '(300A,0290)',
        vr: 'IS',
        vm: '1',
        name: 'SourceApplicatorNumber'
    },
    '(300A,0291)': {
        tag: '(300A,0291)',
        vr: 'SH',
        vm: '1',
        name: 'SourceApplicatorID'
    },
    '(300A,0292)': {
        tag: '(300A,0292)',
        vr: 'CS',
        vm: '1',
        name: 'SourceApplicatorType'
    },
    '(300A,0294)': {
        tag: '(300A,0294)',
        vr: 'LO',
        vm: '1',
        name: 'SourceApplicatorName'
    },
    '(300A,0296)': {
        tag: '(300A,0296)',
        vr: 'DS',
        vm: '1',
        name: 'SourceApplicatorLength'
    },
    '(300A,0298)': {
        tag: '(300A,0298)',
        vr: 'LO',
        vm: '1',
        name: 'SourceApplicatorManufacturer'
    },
    '(300A,029C)': {
        tag: '(300A,029C)',
        vr: 'DS',
        vm: '1',
        name: 'SourceApplicatorWallNominalThickness'
    },
    '(300A,029E)': {
        tag: '(300A,029E)',
        vr: 'DS',
        vm: '1',
        name: 'SourceApplicatorWallNominalTransmission'
    },
    '(300A,02A0)': {
        tag: '(300A,02A0)',
        vr: 'DS',
        vm: '1',
        name: 'SourceApplicatorStepSize'
    },
    '(300A,02A2)': {
        tag: '(300A,02A2)',
        vr: 'IS',
        vm: '1',
        name: 'TransferTubeNumber'
    },
    '(300A,02A4)': {
        tag: '(300A,02A4)',
        vr: 'DS',
        vm: '1',
        name: 'TransferTubeLength'
    },
    '(300A,02B0)': {
        tag: '(300A,02B0)',
        vr: 'SQ',
        vm: '1',
        name: 'ChannelShieldSequence'
    },
    '(300A,02B2)': {
        tag: '(300A,02B2)',
        vr: 'IS',
        vm: '1',
        name: 'ChannelShieldNumber'
    },
    '(300A,02B3)': {
        tag: '(300A,02B3)',
        vr: 'SH',
        vm: '1',
        name: 'ChannelShieldID'
    },
    '(300A,02B4)': {
        tag: '(300A,02B4)',
        vr: 'LO',
        vm: '1',
        name: 'ChannelShieldName'
    },
    '(300A,02B8)': {
        tag: '(300A,02B8)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelShieldNominalThickness'
    },
    '(300A,02BA)': {
        tag: '(300A,02BA)',
        vr: 'DS',
        vm: '1',
        name: 'ChannelShieldNominalTransmission'
    },
    '(300A,02C8)': {
        tag: '(300A,02C8)',
        vr: 'DS',
        vm: '1',
        name: 'FinalCumulativeTimeWeight'
    },
    '(300A,02D0)': {
        tag: '(300A,02D0)',
        vr: 'SQ',
        vm: '1',
        name: 'BrachyControlPointSequence'
    },
    '(300A,02D2)': {
        tag: '(300A,02D2)',
        vr: 'DS',
        vm: '1',
        name: 'ControlPointRelativePosition'
    },
    '(300A,02D4)': {
        tag: '(300A,02D4)',
        vr: 'DS',
        vm: '3',
        name: 'ControlPoint3DPosition'
    },
    '(300A,02D6)': {
        tag: '(300A,02D6)',
        vr: 'DS',
        vm: '1',
        name: 'CumulativeTimeWeight'
    },
    '(300A,02E0)': {
        tag: '(300A,02E0)',
        vr: 'CS',
        vm: '1',
        name: 'CompensatorDivergence'
    },
    '(300A,02E1)': {
        tag: '(300A,02E1)',
        vr: 'CS',
        vm: '1',
        name: 'CompensatorMountingPosition'
    },
    '(300A,02E2)': {
        tag: '(300A,02E2)',
        vr: 'DS',
        vm: '1-n',
        name: 'SourceToCompensatorDistance'
    },
    '(300A,02E3)': {
        tag: '(300A,02E3)',
        vr: 'FL',
        vm: '1',
        name: 'TotalCompensatorTrayWaterEquivalentThickness'
    },
    '(300A,02E4)': {
        tag: '(300A,02E4)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToCompensatorTrayDistance'
    },
    '(300A,02E5)': {
        tag: '(300A,02E5)',
        vr: 'FL',
        vm: '1',
        name: 'CompensatorColumnOffset'
    },
    '(300A,02E6)': {
        tag: '(300A,02E6)',
        vr: 'FL',
        vm: '1-n',
        name: 'IsocenterToCompensatorDistances'
    },
    '(300A,02E7)': {
        tag: '(300A,02E7)',
        vr: 'FL',
        vm: '1',
        name: 'CompensatorRelativeStoppingPowerRatio'
    },
    '(300A,02E8)': {
        tag: '(300A,02E8)',
        vr: 'FL',
        vm: '1',
        name: 'CompensatorMillingToolDiameter'
    },
    '(300A,02EA)': {
        tag: '(300A,02EA)',
        vr: 'SQ',
        vm: '1',
        name: 'IonRangeCompensatorSequence'
    },
    '(300A,02EB)': {
        tag: '(300A,02EB)',
        vr: 'LT',
        vm: '1',
        name: 'CompensatorDescription'
    },
    '(300A,0302)': {
        tag: '(300A,0302)',
        vr: 'IS',
        vm: '1',
        name: 'RadiationMassNumber'
    },
    '(300A,0304)': {
        tag: '(300A,0304)',
        vr: 'IS',
        vm: '1',
        name: 'RadiationAtomicNumber'
    },
    '(300A,0306)': {
        tag: '(300A,0306)',
        vr: 'SS',
        vm: '1',
        name: 'RadiationChargeState'
    },
    '(300A,0308)': {
        tag: '(300A,0308)',
        vr: 'CS',
        vm: '1',
        name: 'ScanMode'
    },
    '(300A,030A)': {
        tag: '(300A,030A)',
        vr: 'FL',
        vm: '2',
        name: 'VirtualSourceAxisDistances'
    },
    '(300A,030C)': {
        tag: '(300A,030C)',
        vr: 'SQ',
        vm: '1',
        name: 'SnoutSequence'
    },
    '(300A,030D)': {
        tag: '(300A,030D)',
        vr: 'FL',
        vm: '1',
        name: 'SnoutPosition'
    },
    '(300A,030F)': {
        tag: '(300A,030F)',
        vr: 'SH',
        vm: '1',
        name: 'SnoutID'
    },
    '(300A,0312)': {
        tag: '(300A,0312)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfRangeShifters'
    },
    '(300A,0314)': {
        tag: '(300A,0314)',
        vr: 'SQ',
        vm: '1',
        name: 'RangeShifterSequence'
    },
    '(300A,0316)': {
        tag: '(300A,0316)',
        vr: 'IS',
        vm: '1',
        name: 'RangeShifterNumber'
    },
    '(300A,0318)': {
        tag: '(300A,0318)',
        vr: 'SH',
        vm: '1',
        name: 'RangeShifterID'
    },
    '(300A,0320)': {
        tag: '(300A,0320)',
        vr: 'CS',
        vm: '1',
        name: 'RangeShifterType'
    },
    '(300A,0322)': {
        tag: '(300A,0322)',
        vr: 'LO',
        vm: '1',
        name: 'RangeShifterDescription'
    },
    '(300A,0330)': {
        tag: '(300A,0330)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfLateralSpreadingDevices'
    },
    '(300A,0332)': {
        tag: '(300A,0332)',
        vr: 'SQ',
        vm: '1',
        name: 'LateralSpreadingDeviceSequence'
    },
    '(300A,0334)': {
        tag: '(300A,0334)',
        vr: 'IS',
        vm: '1',
        name: 'LateralSpreadingDeviceNumber'
    },
    '(300A,0336)': {
        tag: '(300A,0336)',
        vr: 'SH',
        vm: '1',
        name: 'LateralSpreadingDeviceID'
    },
    '(300A,0338)': {
        tag: '(300A,0338)',
        vr: 'CS',
        vm: '1',
        name: 'LateralSpreadingDeviceType'
    },
    '(300A,033A)': {
        tag: '(300A,033A)',
        vr: 'LO',
        vm: '1',
        name: 'LateralSpreadingDeviceDescription'
    },
    '(300A,033C)': {
        tag: '(300A,033C)',
        vr: 'FL',
        vm: '1',
        name: 'LateralSpreadingDeviceWaterEquivalentThickness'
    },
    '(300A,0340)': {
        tag: '(300A,0340)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfRangeModulators'
    },
    '(300A,0342)': {
        tag: '(300A,0342)',
        vr: 'SQ',
        vm: '1',
        name: 'RangeModulatorSequence'
    },
    '(300A,0344)': {
        tag: '(300A,0344)',
        vr: 'IS',
        vm: '1',
        name: 'RangeModulatorNumber'
    },
    '(300A,0346)': {
        tag: '(300A,0346)',
        vr: 'SH',
        vm: '1',
        name: 'RangeModulatorID'
    },
    '(300A,0348)': {
        tag: '(300A,0348)',
        vr: 'CS',
        vm: '1',
        name: 'RangeModulatorType'
    },
    '(300A,034A)': {
        tag: '(300A,034A)',
        vr: 'LO',
        vm: '1',
        name: 'RangeModulatorDescription'
    },
    '(300A,034C)': {
        tag: '(300A,034C)',
        vr: 'SH',
        vm: '1',
        name: 'BeamCurrentModulationID'
    },
    '(300A,0350)': {
        tag: '(300A,0350)',
        vr: 'CS',
        vm: '1',
        name: 'PatientSupportType'
    },
    '(300A,0352)': {
        tag: '(300A,0352)',
        vr: 'SH',
        vm: '1',
        name: 'PatientSupportID'
    },
    '(300A,0354)': {
        tag: '(300A,0354)',
        vr: 'LO',
        vm: '1',
        name: 'PatientSupportAccessoryCode'
    },
    '(300A,0356)': {
        tag: '(300A,0356)',
        vr: 'FL',
        vm: '1',
        name: 'FixationLightAzimuthalAngle'
    },
    '(300A,0358)': {
        tag: '(300A,0358)',
        vr: 'FL',
        vm: '1',
        name: 'FixationLightPolarAngle'
    },
    '(300A,035A)': {
        tag: '(300A,035A)',
        vr: 'FL',
        vm: '1',
        name: 'MetersetRate'
    },
    '(300A,0360)': {
        tag: '(300A,0360)',
        vr: 'SQ',
        vm: '1',
        name: 'RangeShifterSettingsSequence'
    },
    '(300A,0362)': {
        tag: '(300A,0362)',
        vr: 'LO',
        vm: '1',
        name: 'RangeShifterSetting'
    },
    '(300A,0364)': {
        tag: '(300A,0364)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToRangeShifterDistance'
    },
    '(300A,0366)': {
        tag: '(300A,0366)',
        vr: 'FL',
        vm: '1',
        name: 'RangeShifterWaterEquivalentThickness'
    },
    '(300A,0370)': {
        tag: '(300A,0370)',
        vr: 'SQ',
        vm: '1',
        name: 'LateralSpreadingDeviceSettingsSequence'
    },
    '(300A,0372)': {
        tag: '(300A,0372)',
        vr: 'LO',
        vm: '1',
        name: 'LateralSpreadingDeviceSetting'
    },
    '(300A,0374)': {
        tag: '(300A,0374)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToLateralSpreadingDeviceDistance'
    },
    '(300A,0380)': {
        tag: '(300A,0380)',
        vr: 'SQ',
        vm: '1',
        name: 'RangeModulatorSettingsSequence'
    },
    '(300A,0382)': {
        tag: '(300A,0382)',
        vr: 'FL',
        vm: '1',
        name: 'RangeModulatorGatingStartValue'
    },
    '(300A,0384)': {
        tag: '(300A,0384)',
        vr: 'FL',
        vm: '1',
        name: 'RangeModulatorGatingStopValue'
    },
    '(300A,0386)': {
        tag: '(300A,0386)',
        vr: 'FL',
        vm: '1',
        name: 'RangeModulatorGatingStartWaterEquivalentThickness'
    },
    '(300A,0388)': {
        tag: '(300A,0388)',
        vr: 'FL',
        vm: '1',
        name: 'RangeModulatorGatingStopWaterEquivalentThickness'
    },
    '(300A,038A)': {
        tag: '(300A,038A)',
        vr: 'FL',
        vm: '1',
        name: 'IsocenterToRangeModulatorDistance'
    },
    '(300A,0390)': {
        tag: '(300A,0390)',
        vr: 'SH',
        vm: '1',
        name: 'ScanSpotTuneID'
    },
    '(300A,0392)': {
        tag: '(300A,0392)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfScanSpotPositions'
    },
    '(300A,0394)': {
        tag: '(300A,0394)',
        vr: 'FL',
        vm: '1-n',
        name: 'ScanSpotPositionMap'
    },
    '(300A,0396)': {
        tag: '(300A,0396)',
        vr: 'FL',
        vm: '1-n',
        name: 'ScanSpotMetersetWeights'
    },
    '(300A,0398)': {
        tag: '(300A,0398)',
        vr: 'FL',
        vm: '2',
        name: 'ScanningSpotSize'
    },
    '(300A,039A)': {
        tag: '(300A,039A)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfPaintings'
    },
    '(300A,03A0)': {
        tag: '(300A,03A0)',
        vr: 'SQ',
        vm: '1',
        name: 'IonToleranceTableSequence'
    },
    '(300A,03A2)': {
        tag: '(300A,03A2)',
        vr: 'SQ',
        vm: '1',
        name: 'IonBeamSequence'
    },
    '(300A,03A4)': {
        tag: '(300A,03A4)',
        vr: 'SQ',
        vm: '1',
        name: 'IonBeamLimitingDeviceSequence'
    },
    '(300A,03A6)': {
        tag: '(300A,03A6)',
        vr: 'SQ',
        vm: '1',
        name: 'IonBlockSequence'
    },
    '(300A,03A8)': {
        tag: '(300A,03A8)',
        vr: 'SQ',
        vm: '1',
        name: 'IonControlPointSequence'
    },
    '(300A,03AA)': {
        tag: '(300A,03AA)',
        vr: 'SQ',
        vm: '1',
        name: 'IonWedgeSequence'
    },
    '(300A,03AC)': {
        tag: '(300A,03AC)',
        vr: 'SQ',
        vm: '1',
        name: 'IonWedgePositionSequence'
    },
    '(300A,0401)': {
        tag: '(300A,0401)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedSetupImageSequence'
    },
    '(300A,0402)': {
        tag: '(300A,0402)',
        vr: 'ST',
        vm: '1',
        name: 'SetupImageComment'
    },
    '(300A,0410)': {
        tag: '(300A,0410)',
        vr: 'SQ',
        vm: '1',
        name: 'MotionSynchronizationSequence'
    },
    '(300A,0412)': {
        tag: '(300A,0412)',
        vr: 'FL',
        vm: '3',
        name: 'ControlPointOrientation'
    },
    '(300A,0420)': {
        tag: '(300A,0420)',
        vr: 'SQ',
        vm: '1',
        name: 'GeneralAccessorySequence'
    },
    '(300A,0421)': {
        tag: '(300A,0421)',
        vr: 'SH',
        vm: '1',
        name: 'GeneralAccessoryID'
    },
    '(300A,0422)': {
        tag: '(300A,0422)',
        vr: 'ST',
        vm: '1',
        name: 'GeneralAccessoryDescription'
    },
    '(300A,0423)': {
        tag: '(300A,0423)',
        vr: 'CS',
        vm: '1',
        name: 'GeneralAccessoryType'
    },
    '(300A,0424)': {
        tag: '(300A,0424)',
        vr: 'IS',
        vm: '1',
        name: 'GeneralAccessoryNumber'
    },
    '(300A,0431)': {
        tag: '(300A,0431)',
        vr: 'SQ',
        vm: '1',
        name: 'ApplicatorGeometrySequence'
    },
    '(300A,0432)': {
        tag: '(300A,0432)',
        vr: 'CS',
        vm: '1',
        name: 'ApplicatorApertureShape'
    },
    '(300A,0433)': {
        tag: '(300A,0433)',
        vr: 'FL',
        vm: '1',
        name: 'ApplicatorOpening'
    },
    '(300A,0434)': {
        tag: '(300A,0434)',
        vr: 'FL',
        vm: '1',
        name: 'ApplicatorOpeningX'
    },
    '(300A,0435)': {
        tag: '(300A,0435)',
        vr: 'FL',
        vm: '1',
        name: 'ApplicatorOpeningY'
    },
    '(300A,0436)': {
        tag: '(300A,0436)',
        vr: 'FL',
        vm: '1',
        name: 'SourceToApplicatorMountingPositionDistance'
    },
    '(300C,0002)': {
        tag: '(300C,0002)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedRTPlanSequence'
    },
    '(300C,0004)': {
        tag: '(300C,0004)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedBeamSequence'
    },
    '(300C,0006)': {
        tag: '(300C,0006)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedBeamNumber'
    },
    '(300C,0007)': {
        tag: '(300C,0007)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedReferenceImageNumber'
    },
    '(300C,0008)': {
        tag: '(300C,0008)',
        vr: 'DS',
        vm: '1',
        name: 'StartCumulativeMetersetWeight'
    },
    '(300C,0009)': {
        tag: '(300C,0009)',
        vr: 'DS',
        vm: '1',
        name: 'EndCumulativeMetersetWeight'
    },
    '(300C,000A)': {
        tag: '(300C,000A)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedBrachyApplicationSetupSequence'
    },
    '(300C,000C)': {
        tag: '(300C,000C)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedBrachyApplicationSetupNumber'
    },
    '(300C,000E)': {
        tag: '(300C,000E)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedSourceNumber'
    },
    '(300C,0020)': {
        tag: '(300C,0020)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedFractionGroupSequence'
    },
    '(300C,0022)': {
        tag: '(300C,0022)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedFractionGroupNumber'
    },
    '(300C,0040)': {
        tag: '(300C,0040)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedVerificationImageSequence'
    },
    '(300C,0042)': {
        tag: '(300C,0042)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedReferenceImageSequence'
    },
    '(300C,0050)': {
        tag: '(300C,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedDoseReferenceSequence'
    },
    '(300C,0051)': {
        tag: '(300C,0051)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedDoseReferenceNumber'
    },
    '(300C,0055)': {
        tag: '(300C,0055)',
        vr: 'SQ',
        vm: '1',
        name: 'BrachyReferencedDoseReferenceSequence'
    },
    '(300C,0060)': {
        tag: '(300C,0060)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedStructureSetSequence'
    },
    '(300C,006A)': {
        tag: '(300C,006A)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedPatientSetupNumber'
    },
    '(300C,0080)': {
        tag: '(300C,0080)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedDoseSequence'
    },
    '(300C,00A0)': {
        tag: '(300C,00A0)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedToleranceTableNumber'
    },
    '(300C,00B0)': {
        tag: '(300C,00B0)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedBolusSequence'
    },
    '(300C,00C0)': {
        tag: '(300C,00C0)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedWedgeNumber'
    },
    '(300C,00D0)': {
        tag: '(300C,00D0)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedCompensatorNumber'
    },
    '(300C,00E0)': {
        tag: '(300C,00E0)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedBlockNumber'
    },
    '(300C,00F0)': {
        tag: '(300C,00F0)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedControlPointIndex'
    },
    '(300C,00F2)': {
        tag: '(300C,00F2)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedControlPointSequence'
    },
    '(300C,00F4)': {
        tag: '(300C,00F4)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedStartControlPointIndex'
    },
    '(300C,00F6)': {
        tag: '(300C,00F6)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedStopControlPointIndex'
    },
    '(300C,0100)': {
        tag: '(300C,0100)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedRangeShifterNumber'
    },
    '(300C,0102)': {
        tag: '(300C,0102)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedLateralSpreadingDeviceNumber'
    },
    '(300C,0104)': {
        tag: '(300C,0104)',
        vr: 'IS',
        vm: '1',
        name: 'ReferencedRangeModulatorNumber'
    },
    '(300E,0002)': {
        tag: '(300E,0002)',
        vr: 'CS',
        vm: '1',
        name: 'ApprovalStatus'
    },
    '(300E,0004)': {
        tag: '(300E,0004)',
        vr: 'DA',
        vm: '1',
        name: 'ReviewDate'
    },
    '(300E,0005)': {
        tag: '(300E,0005)',
        vr: 'TM',
        vm: '1',
        name: 'ReviewTime'
    },
    '(300E,0008)': {
        tag: '(300E,0008)',
        vr: 'PN',
        vm: '1',
        name: 'ReviewerName'
    },
    '(4000,0010)': {
        tag: '(4000,0010)',
        vr: 'LT',
        vm: '1',
        name: 'Arbitrary'
    },
    '(4000,4000)': {
        tag: '(4000,4000)',
        vr: 'LT',
        vm: '1',
        name: 'TextComments'
    },
    '(4008,0040)': {
        tag: '(4008,0040)',
        vr: 'SH',
        vm: '1',
        name: 'ResultsID'
    },
    '(4008,0042)': {
        tag: '(4008,0042)',
        vr: 'LO',
        vm: '1',
        name: 'ResultsIDIssuer'
    },
    '(4008,0050)': {
        tag: '(4008,0050)',
        vr: 'SQ',
        vm: '1',
        name: 'ReferencedInterpretationSequence'
    },
    '(4008,00FF)': {
        tag: '(4008,00FF)',
        vr: 'CS',
        vm: '1',
        name: 'ReportProductionStatusTrial'
    },
    '(4008,0100)': {
        tag: '(4008,0100)',
        vr: 'DA',
        vm: '1',
        name: 'InterpretationRecordedDate'
    },
    '(4008,0101)': {
        tag: '(4008,0101)',
        vr: 'TM',
        vm: '1',
        name: 'InterpretationRecordedTime'
    },
    '(4008,0102)': {
        tag: '(4008,0102)',
        vr: 'PN',
        vm: '1',
        name: 'InterpretationRecorder'
    },
    '(4008,0103)': {
        tag: '(4008,0103)',
        vr: 'LO',
        vm: '1',
        name: 'ReferenceToRecordedSound'
    },
    '(4008,0108)': {
        tag: '(4008,0108)',
        vr: 'DA',
        vm: '1',
        name: 'InterpretationTranscriptionDate'
    },
    '(4008,0109)': {
        tag: '(4008,0109)',
        vr: 'TM',
        vm: '1',
        name: 'InterpretationTranscriptionTime'
    },
    '(4008,010A)': {
        tag: '(4008,010A)',
        vr: 'PN',
        vm: '1',
        name: 'InterpretationTranscriber'
    },
    '(4008,010B)': {
        tag: '(4008,010B)',
        vr: 'ST',
        vm: '1',
        name: 'InterpretationText'
    },
    '(4008,010C)': {
        tag: '(4008,010C)',
        vr: 'PN',
        vm: '1',
        name: 'InterpretationAuthor'
    },
    '(4008,0111)': {
        tag: '(4008,0111)',
        vr: 'SQ',
        vm: '1',
        name: 'InterpretationApproverSequence'
    },
    '(4008,0112)': {
        tag: '(4008,0112)',
        vr: 'DA',
        vm: '1',
        name: 'InterpretationApprovalDate'
    },
    '(4008,0113)': {
        tag: '(4008,0113)',
        vr: 'TM',
        vm: '1',
        name: 'InterpretationApprovalTime'
    },
    '(4008,0114)': {
        tag: '(4008,0114)',
        vr: 'PN',
        vm: '1',
        name: 'PhysicianApprovingInterpretation'
    },
    '(4008,0115)': {
        tag: '(4008,0115)',
        vr: 'LT',
        vm: '1',
        name: 'InterpretationDiagnosisDescription'
    },
    '(4008,0117)': {
        tag: '(4008,0117)',
        vr: 'SQ',
        vm: '1',
        name: 'InterpretationDiagnosisCodeSequence'
    },
    '(4008,0118)': {
        tag: '(4008,0118)',
        vr: 'SQ',
        vm: '1',
        name: 'ResultsDistributionListSequence'
    },
    '(4008,0119)': {
        tag: '(4008,0119)',
        vr: 'PN',
        vm: '1',
        name: 'DistributionName'
    },
    '(4008,011A)': {
        tag: '(4008,011A)',
        vr: 'LO',
        vm: '1',
        name: 'DistributionAddress'
    },
    '(4008,0200)': {
        tag: '(4008,0200)',
        vr: 'SH',
        vm: '1',
        name: 'InterpretationID'
    },
    '(4008,0202)': {
        tag: '(4008,0202)',
        vr: 'LO',
        vm: '1',
        name: 'InterpretationIDIssuer'
    },
    '(4008,0210)': {
        tag: '(4008,0210)',
        vr: 'CS',
        vm: '1',
        name: 'InterpretationTypeID'
    },
    '(4008,0212)': {
        tag: '(4008,0212)',
        vr: 'CS',
        vm: '1',
        name: 'InterpretationStatusID'
    },
    '(4008,0300)': {
        tag: '(4008,0300)',
        vr: 'ST',
        vm: '1',
        name: 'Impressions'
    },
    '(4008,4000)': {
        tag: '(4008,4000)',
        vr: 'ST',
        vm: '1 ',
        name: 'ResultsComments'
    },
    '(4010,0001)': {
        tag: '(4010,0001)',
        vr: 'CS',
        vm: '1',
        name: 'LowEnergyDetectors'
    },
    '(4010,0002)': {
        tag: '(4010,0002)',
        vr: 'CS',
        vm: '1',
        name: 'HighEnergyDetectors'
    },
    '(4010,0004)': {
        tag: '(4010,0004)',
        vr: 'SQ',
        vm: '1',
        name: 'DetectorGeometrySequence'
    },
    '(4010,1001)': {
        tag: '(4010,1001)',
        vr: 'SQ',
        vm: '1',
        name: 'ThreatROIVoxelSequence'
    },
    '(4010,1004)': {
        tag: '(4010,1004)',
        vr: 'FL',
        vm: '3',
        name: 'ThreatROIBase'
    },
    '(4010,1005)': {
        tag: '(4010,1005)',
        vr: 'FL',
        vm: '3',
        name: 'ThreatROIExtents'
    },
    '(4010,1006)': {
        tag: '(4010,1006)',
        vr: 'OB',
        vm: '1',
        name: 'ThreatROIBitmap'
    },
    '(4010,1007)': {
        tag: '(4010,1007)',
        vr: 'SH',
        vm: '1',
        name: 'RouteSegmentID'
    },
    '(4010,1008)': {
        tag: '(4010,1008)',
        vr: 'CS',
        vm: '1',
        name: 'GantryType'
    },
    '(4010,1009)': {
        tag: '(4010,1009)',
        vr: 'CS',
        vm: '1',
        name: 'OOIOwnerType'
    },
    '(4010,100A)': {
        tag: '(4010,100A)',
        vr: 'SQ',
        vm: '1',
        name: 'RouteSegmentSequence'
    },
    '(4010,1010)': {
        tag: '(4010,1010)',
        vr: 'US',
        vm: '1',
        name: 'PotentialThreatObjectID'
    },
    '(4010,1011)': {
        tag: '(4010,1011)',
        vr: 'SQ',
        vm: '1',
        name: 'ThreatSequence'
    },
    '(4010,1012)': {
        tag: '(4010,1012)',
        vr: 'CS',
        vm: '1',
        name: 'ThreatCategory'
    },
    '(4010,1013)': {
        tag: '(4010,1013)',
        vr: 'LT',
        vm: '1',
        name: 'ThreatCategoryDescription'
    },
    '(4010,1014)': {
        tag: '(4010,1014)',
        vr: 'CS',
        vm: '1',
        name: 'ATDAbilityAssessment'
    },
    '(4010,1015)': {
        tag: '(4010,1015)',
        vr: 'CS',
        vm: '1',
        name: 'ATDAssessmentFlag'
    },
    '(4010,1016)': {
        tag: '(4010,1016)',
        vr: 'FL',
        vm: '1',
        name: 'ATDAssessmentProbability'
    },
    '(4010,1017)': {
        tag: '(4010,1017)',
        vr: 'FL',
        vm: '1',
        name: 'Mass'
    },
    '(4010,1018)': {
        tag: '(4010,1018)',
        vr: 'FL',
        vm: '1',
        name: 'Density'
    },
    '(4010,1019)': {
        tag: '(4010,1019)',
        vr: 'FL',
        vm: '1',
        name: 'ZEffective'
    },
    '(4010,101A)': {
        tag: '(4010,101A)',
        vr: 'SH',
        vm: '1',
        name: 'BoardingPassID'
    },
    '(4010,101B)': {
        tag: '(4010,101B)',
        vr: 'FL',
        vm: '3',
        name: 'CenterOfMass'
    },
    '(4010,101C)': {
        tag: '(4010,101C)',
        vr: 'FL',
        vm: '3',
        name: 'CenterOfPTO'
    },
    '(4010,101D)': {
        tag: '(4010,101D)',
        vr: 'FL',
        vm: '6-n',
        name: 'BoundingPolygon'
    },
    '(4010,101E)': {
        tag: '(4010,101E)',
        vr: 'SH',
        vm: '1',
        name: 'RouteSegmentStartLocationID'
    },
    '(4010,101F)': {
        tag: '(4010,101F)',
        vr: 'SH',
        vm: '1',
        name: 'RouteSegmentEndLocationID'
    },
    '(4010,1020)': {
        tag: '(4010,1020)',
        vr: 'CS',
        vm: '1',
        name: 'RouteSegmentLocationIDType'
    },
    '(4010,1021)': {
        tag: '(4010,1021)',
        vr: 'CS',
        vm: '1-n',
        name: 'AbortReason'
    },
    '(4010,1023)': {
        tag: '(4010,1023)',
        vr: 'FL',
        vm: '1',
        name: 'VolumeOfPTO'
    },
    '(4010,1024)': {
        tag: '(4010,1024)',
        vr: 'CS',
        vm: '1',
        name: 'AbortFlag'
    },
    '(4010,1025)': {
        tag: '(4010,1025)',
        vr: 'DT',
        vm: '1',
        name: 'RouteSegmentStartTime'
    },
    '(4010,1026)': {
        tag: '(4010,1026)',
        vr: 'DT',
        vm: '1',
        name: 'RouteSegmentEndTime'
    },
    '(4010,1027)': {
        tag: '(4010,1027)',
        vr: 'CS',
        vm: '1',
        name: 'TDRType'
    },
    '(4010,1028)': {
        tag: '(4010,1028)',
        vr: 'CS',
        vm: '1',
        name: 'InternationalRouteSegment'
    },
    '(4010,1029)': {
        tag: '(4010,1029)',
        vr: 'LO',
        vm: '1-n',
        name: 'ThreatDetectionAlgorithmandVersion'
    },
    '(4010,102A)': {
        tag: '(4010,102A)',
        vr: 'SH',
        vm: '1',
        name: 'AssignedLocation'
    },
    '(4010,102B)': {
        tag: '(4010,102B)',
        vr: 'DT',
        vm: '1',
        name: 'AlarmDecisionTime'
    },
    '(4010,1031)': {
        tag: '(4010,1031)',
        vr: 'CS',
        vm: '1',
        name: 'AlarmDecision'
    },
    '(4010,1033)': {
        tag: '(4010,1033)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfTotalObjects'
    },
    '(4010,1034)': {
        tag: '(4010,1034)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfAlarmObjects'
    },
    '(4010,1037)': {
        tag: '(4010,1037)',
        vr: 'SQ',
        vm: '1',
        name: 'PTORepresentationSequence'
    },
    '(4010,1038)': {
        tag: '(4010,1038)',
        vr: 'SQ',
        vm: '1',
        name: 'ATDAssessmentSequence'
    },
    '(4010,1039)': {
        tag: '(4010,1039)',
        vr: 'CS',
        vm: '1',
        name: 'TIPType'
    },
    '(4010,103A)': {
        tag: '(4010,103A)',
        vr: 'CS',
        vm: '1',
        name: 'DICOSVersion'
    },
    '(4010,1041)': {
        tag: '(4010,1041)',
        vr: 'DT',
        vm: '1',
        name: 'OOIOwnerCreationTime'
    },
    '(4010,1042)': {
        tag: '(4010,1042)',
        vr: 'CS',
        vm: '1',
        name: 'OOIType'
    },
    '(4010,1043)': {
        tag: '(4010,1043)',
        vr: 'FL',
        vm: '3',
        name: 'OOISize'
    },
    '(4010,1044)': {
        tag: '(4010,1044)',
        vr: 'CS',
        vm: '1',
        name: 'AcquisitionStatus'
    },
    '(4010,1045)': {
        tag: '(4010,1045)',
        vr: 'SQ',
        vm: '1',
        name: 'BasisMaterialsCodeSequence'
    },
    '(4010,1046)': {
        tag: '(4010,1046)',
        vr: 'CS',
        vm: '1',
        name: 'PhantomType'
    },
    '(4010,1047)': {
        tag: '(4010,1047)',
        vr: 'SQ',
        vm: '1',
        name: 'OOIOwnerSequence'
    },
    '(4010,1048)': {
        tag: '(4010,1048)',
        vr: 'CS',
        vm: '1',
        name: 'ScanType'
    },
    '(4010,1051)': {
        tag: '(4010,1051)',
        vr: 'LO',
        vm: '1',
        name: 'ItineraryID'
    },
    '(4010,1052)': {
        tag: '(4010,1052)',
        vr: 'SH',
        vm: '1',
        name: 'ItineraryIDType'
    },
    '(4010,1053)': {
        tag: '(4010,1053)',
        vr: 'LO',
        vm: '1',
        name: 'ItineraryIDAssigningAuthority'
    },
    '(4010,1054)': {
        tag: '(4010,1054)',
        vr: 'SH',
        vm: '1',
        name: 'RouteID'
    },
    '(4010,1055)': {
        tag: '(4010,1055)',
        vr: 'SH',
        vm: '1',
        name: 'RouteIDAssigningAuthority'
    },
    '(4010,1056)': {
        tag: '(4010,1056)',
        vr: 'CS',
        vm: '1',
        name: 'InboundArrivalType'
    },
    '(4010,1058)': {
        tag: '(4010,1058)',
        vr: 'SH',
        vm: '1',
        name: 'CarrierID'
    },
    '(4010,1059)': {
        tag: '(4010,1059)',
        vr: 'CS',
        vm: '1',
        name: 'CarrierIDAssigningAuthority'
    },
    '(4010,1060)': {
        tag: '(4010,1060)',
        vr: 'FL',
        vm: '3',
        name: 'SourceOrientation'
    },
    '(4010,1061)': {
        tag: '(4010,1061)',
        vr: 'FL',
        vm: '3',
        name: 'SourcePosition'
    },
    '(4010,1062)': {
        tag: '(4010,1062)',
        vr: 'FL',
        vm: '1',
        name: 'BeltHeight'
    },
    '(4010,1064)': {
        tag: '(4010,1064)',
        vr: 'SQ',
        vm: '1',
        name: 'AlgorithmRoutingCodeSequence'
    },
    '(4010,1067)': {
        tag: '(4010,1067)',
        vr: 'CS',
        vm: '1',
        name: 'TransportClassification'
    },
    '(4010,1068)': {
        tag: '(4010,1068)',
        vr: 'LT',
        vm: '1',
        name: 'OOITypeDescriptor'
    },
    '(4010,1069)': {
        tag: '(4010,1069)',
        vr: 'FL',
        vm: '1',
        name: 'TotalProcessingTime'
    },
    '(4010,106C)': {
        tag: '(4010,106C)',
        vr: 'OB',
        vm: '1',
        name: 'DetectorCalibrationData'
    },
    '(4FFE,0001)': {
        tag: '(4FFE,0001)',
        vr: 'SQ',
        vm: '1',
        name: 'MACParametersSequence'
    },
    '(50xx,0005)': {
        tag: '(50xx,0005)',
        vr: 'US',
        vm: '1',
        name: 'CurveDimensions'
    },
    '(50xx,0010)': {
        tag: '(50xx,0010)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfPoints'
    },
    '(50xx,0020)': {
        tag: '(50xx,0020)',
        vr: 'CS',
        vm: '1',
        name: 'TypeOfData'
    },
    '(50xx,0022)': {
        tag: '(50xx,0022)',
        vr: 'LO',
        vm: '1',
        name: 'CurveDescription'
    },
    '(50xx,0030)': {
        tag: '(50xx,0030)',
        vr: 'SH',
        vm: '1-n',
        name: 'AxisUnits'
    },
    '(50xx,0040)': {
        tag: '(50xx,0040)',
        vr: 'SH',
        vm: '1-n',
        name: 'AxisLabels'
    },
    '(50xx,0103)': {
        tag: '(50xx,0103)',
        vr: 'US',
        vm: '1',
        name: 'DataValueRepresentation'
    },
    '(50xx,0104)': {
        tag: '(50xx,0104)',
        vr: 'US',
        vm: '1-n',
        name: 'MinimumCoordinateValue'
    },
    '(50xx,0105)': {
        tag: '(50xx,0105)',
        vr: 'US',
        vm: '1-n',
        name: 'MaximumCoordinateValue'
    },
    '(50xx,0106)': {
        tag: '(50xx,0106)',
        vr: 'SH',
        vm: '1-n',
        name: 'CurveRange'
    },
    '(50xx,0110)': {
        tag: '(50xx,0110)',
        vr: 'US',
        vm: '1-n',
        name: 'CurveDataDescriptor'
    },
    '(50xx,0112)': {
        tag: '(50xx,0112)',
        vr: 'US',
        vm: '1-n',
        name: 'CoordinateStartValue'
    },
    '(50xx,0114)': {
        tag: '(50xx,0114)',
        vr: 'US',
        vm: '1-n',
        name: 'CoordinateStepValue'
    },
    '(50xx,1001)': {
        tag: '(50xx,1001)',
        vr: 'CS',
        vm: '1',
        name: 'CurveActivationLayer'
    },
    '(50xx,2000)': {
        tag: '(50xx,2000)',
        vr: 'US',
        vm: '1',
        name: 'AudioType'
    },
    '(50xx,2002)': {
        tag: '(50xx,2002)',
        vr: 'US',
        vm: '1',
        name: 'AudioSampleFormat'
    },
    '(50xx,2004)': {
        tag: '(50xx,2004)',
        vr: 'US',
        vm: '1',
        name: 'NumberOfChannels'
    },
    '(50xx,2006)': {
        tag: '(50xx,2006)',
        vr: 'UL',
        vm: '1',
        name: 'NumberOfSamples'
    },
    '(50xx,2008)': {
        tag: '(50xx,2008)',
        vr: 'UL',
        vm: '1',
        name: 'SampleRate'
    },
    '(50xx,200A)': {
        tag: '(50xx,200A)',
        vr: 'UL',
        vm: '1',
        name: 'TotalTime'
    },
    '(50xx,200C)': {
        tag: '(50xx,200C)',
        vr: 'OW|OB',
        vm: '1',
        name: 'AudioSampleData'
    },
    '(50xx,200E)': {
        tag: '(50xx,200E)',
        vr: 'LT',
        vm: '1 ',
        name: 'AudioComments'
    },
    '(50xx,2500)': {
        tag: '(50xx,2500)',
        vr: 'LO',
        vm: '1',
        name: 'CurveLabel'
    },
    '(50xx,2600)': {
        tag: '(50xx,2600)',
        vr: 'SQ',
        vm: '1',
        name: 'CurveReferencedOverlaySequence'
    },
    '(50xx,2610)': {
        tag: '(50xx,2610)',
        vr: 'US',
        vm: '1',
        name: 'CurveReferencedOverlayGroup'
    },
    '(50xx,3000)': {
        tag: '(50xx,3000)',
        vr: 'OW|OB',
        vm: '1',
        name: 'CurveData'
    },
    '(5200,9229)': {
        tag: '(5200,9229)',
        vr: 'SQ',
        vm: '1',
        name: 'SharedFunctionalGroupsSequence'
    },
    '(5200,9230)': {
        tag: '(5200,9230)',
        vr: 'SQ',
        vm: '1',
        name: 'PerFrameFunctionalGroupsSequence'
    },
    '(5400,0100)': {
        tag: '(5400,0100)',
        vr: 'SQ',
        vm: '1',
        name: 'WaveformSequence'
    },
    '(5400,0110)': {
        tag: '(5400,0110)',
        vr: 'OB|OW',
        vm: '1',
        name: 'ChannelMinimumValue'
    },
    '(5400,0112)': {
        tag: '(5400,0112)',
        vr: 'OB|OW',
        vm: '1',
        name: 'ChannelMaximumValue'
    },
    '(5400,1004)': {
        tag: '(5400,1004)',
        vr: 'US',
        vm: '1',
        name: 'WaveformBitsAllocated'
    },
    '(5400,1006)': {
        tag: '(5400,1006)',
        vr: 'CS',
        vm: '1',
        name: 'WaveformSampleInterpretation'
    },
    '(5400,100A)': {
        tag: '(5400,100A)',
        vr: 'OB|OW',
        vm: '1',
        name: 'WaveformPaddingValue'
    },
    '(5400,1010)': {
        tag: '(5400,1010)',
        vr: 'OB|OW',
        vm: '1',
        name: 'WaveformData'
    },
    '(5600,0010)': {
        tag: '(5600,0010)',
        vr: 'OF',
        vm: '1',
        name: 'FirstOrderPhaseCorrectionAngle'
    },
    '(5600,0020)': {
        tag: '(5600,0020)',
        vr: 'OF',
        vm: '1',
        name: 'SpectroscopyData'
    },
    '(60xx,0010)': {
        tag: '(60xx,0010)',
        vr: 'US',
        vm: '1',
        name: 'OverlayRows'
    },
    '(60xx,0011)': {
        tag: '(60xx,0011)',
        vr: 'US',
        vm: '1',
        name: 'OverlayColumns'
    },
    '(60xx,0012)': {
        tag: '(60xx,0012)',
        vr: 'US',
        vm: '1',
        name: 'OverlayPlanes'
    },
    '(60xx,0015)': {
        tag: '(60xx,0015)',
        vr: 'IS',
        vm: '1',
        name: 'NumberOfFramesInOverlay'
    },
    '(60xx,0022)': {
        tag: '(60xx,0022)',
        vr: 'LO',
        vm: '1',
        name: 'OverlayDescription'
    },
    '(60xx,0040)': {
        tag: '(60xx,0040)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayType'
    },
    '(60xx,0045)': {
        tag: '(60xx,0045)',
        vr: 'LO',
        vm: '1',
        name: 'OverlaySubtype'
    },
    '(60xx,0050)': {
        tag: '(60xx,0050)',
        vr: 'SS',
        vm: '2',
        name: 'OverlayOrigin'
    },
    '(60xx,0051)': {
        tag: '(60xx,0051)',
        vr: 'US',
        vm: '1',
        name: 'ImageFrameOrigin'
    },
    '(60xx,0052)': {
        tag: '(60xx,0052)',
        vr: 'US',
        vm: '1',
        name: 'OverlayPlaneOrigin'
    },
    '(60xx,0060)': {
        tag: '(60xx,0060)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayCompressionCode'
    },
    '(60xx,0061)': {
        tag: '(60xx,0061)',
        vr: 'SH',
        vm: '1',
        name: 'OverlayCompressionOriginator'
    },
    '(60xx,0062)': {
        tag: '(60xx,0062)',
        vr: 'SH',
        vm: '1',
        name: 'OverlayCompressionLabel'
    },
    '(60xx,0063)': {
        tag: '(60xx,0063)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayCompressionDescription'
    },
    '(60xx,0066)': {
        tag: '(60xx,0066)',
        vr: 'AT',
        vm: '1-n',
        name: 'OverlayCompressionStepPointers'
    },
    '(60xx,0068)': {
        tag: '(60xx,0068)',
        vr: 'US',
        vm: '1',
        name: 'OverlayRepeatInterval'
    },
    '(60xx,0069)': {
        tag: '(60xx,0069)',
        vr: 'US',
        vm: '1',
        name: 'OverlayBitsGrouped'
    },
    '(60xx,0100)': {
        tag: '(60xx,0100)',
        vr: 'US',
        vm: '1',
        name: 'OverlayBitsAllocated'
    },
    '(60xx,0102)': {
        tag: '(60xx,0102)',
        vr: 'US',
        vm: '1',
        name: 'OverlayBitPosition'
    },
    '(60xx,0110)': {
        tag: '(60xx,0110)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayFormat'
    },
    '(60xx,0200)': {
        tag: '(60xx,0200)',
        vr: 'US',
        vm: '1',
        name: 'OverlayLocation'
    },
    '(60xx,0800)': {
        tag: '(60xx,0800)',
        vr: 'CS',
        vm: '1-n',
        name: 'OverlayCodeLabel'
    },
    '(60xx,0802)': {
        tag: '(60xx,0802)',
        vr: 'US',
        vm: '1',
        name: 'OverlayNumberOfTables'
    },
    '(60xx,0803)': {
        tag: '(60xx,0803)',
        vr: 'AT',
        vm: '1-n',
        name: 'OverlayCodeTableLocation'
    },
    '(60xx,0804)': {
        tag: '(60xx,0804)',
        vr: 'US',
        vm: '1',
        name: 'OverlayBitsForCodeWord'
    },
    '(60xx,1001)': {
        tag: '(60xx,1001)',
        vr: 'CS',
        vm: '1',
        name: 'OverlayActivationLayer'
    },
    '(60xx,1100)': {
        tag: '(60xx,1100)',
        vr: 'US',
        vm: '1',
        name: 'OverlayDescriptorGray'
    },
    '(60xx,1101)': {
        tag: '(60xx,1101)',
        vr: 'US',
        vm: '1',
        name: 'OverlayDescriptorRed'
    },
    '(60xx,1102)': {
        tag: '(60xx,1102)',
        vr: 'US',
        vm: '1',
        name: 'OverlayDescriptorGreen'
    },
    '(60xx,1103)': {
        tag: '(60xx,1103)',
        vr: 'US',
        vm: '1',
        name: 'OverlayDescriptorBlue'
    },
    '(60xx,1200)': {
        tag: '(60xx,1200)',
        vr: 'US',
        vm: '1-n',
        name: 'OverlaysGray'
    },
    '(60xx,1201)': {
        tag: '(60xx,1201)',
        vr: 'US',
        vm: '1-n',
        name: 'OverlaysRed'
    },
    '(60xx,1202)': {
        tag: '(60xx,1202)',
        vr: 'US',
        vm: '1-n',
        name: 'OverlaysGreen'
    },
    '(60xx,1203)': {
        tag: '(60xx,1203)',
        vr: 'US',
        vm: '1-n',
        name: 'OverlaysBlue'
    },
    '(60xx,1301)': {
        tag: '(60xx,1301)',
        vr: 'IS',
        vm: '1',
        name: 'ROIArea'
    },
    '(60xx,1302)': {
        tag: '(60xx,1302)',
        vr: 'DS',
        vm: '1',
        name: 'ROIMean'
    },
    '(60xx,1303)': {
        tag: '(60xx,1303)',
        vr: 'DS',
        vm: '1',
        name: 'ROIStandardDeviation'
    },
    '(60xx,1500)': {
        tag: '(60xx,1500)',
        vr: 'LO',
        vm: '1',
        name: 'OverlayLabel'
    },
    '(60xx,3000)': {
        tag: '(60xx,3000)',
        vr: 'OB|OW',
        vm: '1',
        name: 'OverlayData'
    },
    '(60xx,4000)': {
        tag: '(60xx,4000)',
        vr: 'LT',
        vm: '1',
        name: 'OverlayComments'
    },
    '(7FE0,0010)': {
        tag: '(7FE0,0010)',
        vr: 'OW|OB',
        vm: '1',
        name: 'PixelData'
    },
    '(7FE0,0020)': {
        tag: '(7FE0,0020)',
        vr: 'OW',
        vm: '1',
        name: 'CoefficientsSDVN'
    },
    '(7FE0,0030)': {
        tag: '(7FE0,0030)',
        vr: 'OW',
        vm: '1',
        name: 'CoefficientsSDHN'
    },
    '(7FE0,0040)': {
        tag: '(7FE0,0040)',
        vr: 'OW',
        vm: '1',
        name: 'CoefficientsSDDN'
    },
    '(7Fxx,0010)': {
        tag: '(7Fxx,0010)',
        vr: 'OW|OB',
        vm: '1',
        name: 'VariablePixelData'
    },
    '(7Fxx,0011)': {
        tag: '(7Fxx,0011)',
        vr: 'US',
        vm: '1',
        name: 'VariableNextDataGroup'
    },
    '(7Fxx,0020)': {
        tag: '(7Fxx,0020)',
        vr: 'OW',
        vm: '1',
        name: 'VariableCoefficientsSDVN'
    },
    '(7Fxx,0030)': {
        tag: '(7Fxx,0030)',
        vr: 'OW',
        vm: '1',
        name: 'VariableCoefficientsSDHN'
    },
    '(7Fxx,0040)': {
        tag: '(7Fxx,0040)',
        vr: 'OW',
        vm: '1',
        name: 'VariableCoefficientsSDDN'
    },
    '(FFFA,FFFA)': {
        tag: '(FFFA,FFFA)',
        vr: 'SQ',
        vm: '1',
        name: 'DigitalSignaturesSequence'
    },
    '(FFFC,FFFC)': {
        tag: '(FFFC,FFFC)',
        vr: 'OB',
        vm: '1',
        name: 'DataSetTrailingPadding'
    },
    '(FFFE,E000)': {
        tag: '(FFFE,E000)',
        vr: '',
        vm: '1',
        name: 'Item'
    },
    '(FFFE,E00D)': {
        tag: '(FFFE,E00D)',
        vr: '',
        vm: '1',
        name: 'ItemDelimitationItem'
    },
    '(FFFE,E0DD)': {
        tag: '(FFFE,E0DD)',
        vr: '',
        vm: '1',
        name: 'SequenceDelimitationItem'
    },
};

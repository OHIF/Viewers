
import os
import sys
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory

import pytest

from pydicom import config, dcmread
from pydicom.data import get_testdata_file
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.filebase import DicomBytesIO
from pydicom.fileset import (
    FileSet, FileInstance, RecordNode, is_conformant_file_id,
    generate_filename, _define_patient, _define_study, _define_series,
    _define_image, _PREFIXES
)
from pydicom.filewriter import write_dataset
from pydicom.tag import Tag, BaseTag
from pydicom.uid import (
    ExplicitVRLittleEndian, generate_uid, ImplicitVRLittleEndian,
    MediaStorageDirectoryStorage, ComputedRadiographyImageStorage,
    CTImageStorage, RTBeamsTreatmentRecordStorage, RTPlanStorage,
    GrayscaleSoftcopyPresentationStateStorage, BasicTextSRStorage,
    KeyObjectSelectionDocumentStorage, MRSpectroscopyStorage,
    HangingProtocolStorage, EncapsulatedPDFStorage, ColorPaletteStorage,
    GenericImplantTemplateStorage, ImplantAssemblyTemplateStorage,
    ImplantTemplateGroupStorage, TwelveLeadECGWaveformStorage,
    RawDataStorage, SpatialRegistrationStorage, SpatialFiducialsStorage,
    RealWorldValueMappingStorage, StereometricRelationshipStorage,
    LensometryMeasurementsStorage, SurfaceSegmentationStorage,
    TractographyResultsStorage, SurfaceScanMeshStorage, RTDoseStorage,
    ContentAssessmentResultsStorage, RTStructureSetStorage,
    RTBeamsDeliveryInstructionStorage, CArmPhotonElectronRadiationStorage,
)


TEST_FILE = get_testdata_file('DICOMDIR')
TINY_ALPHA_FILESET = get_testdata_file("TINY_ALPHA/DICOMDIR")
IMPLICIT_TEST_FILE = get_testdata_file('DICOMDIR-implicit')
BIGENDIAN_TEST_FILE = get_testdata_file('DICOMDIR-bigEnd')


@pytest.fixture
def tiny():
    """Return the tiny alphanumeric File-set."""
    return dcmread(TINY_ALPHA_FILESET)


@pytest.fixture
def dicomdir():
    """Return the DICOMDIR dataset."""
    return dcmread(TEST_FILE)


@pytest.fixture
def dicomdir_copy():
    """Copy the File-set to a temporary directory and return its DICOMDIR."""
    t = TemporaryDirectory()
    src = Path(TEST_FILE).parent
    dst = Path(t.name)

    shutil.copyfile(src / 'DICOMDIR', dst / 'DICOMDIR')
    shutil.copytree(src / "77654033", dst / "77654033")
    shutil.copytree(src / "98892003", dst / "98892003")
    shutil.copytree(src / "98892001", dst / "98892001")

    return t, dcmread(dst / "DICOMDIR")


@pytest.fixture
def ct():
    """Return a DICOMDIR dataset."""
    return dcmread(get_testdata_file("CT_small.dcm"))


@pytest.fixture
def tdir():
    """Return a TemporaryDirectory instance."""
    return TemporaryDirectory()


@pytest.fixture
def custom_leaf():
    """Return the leaf node from a custom 4-level record hierarchy"""
    ct = dcmread(get_testdata_file("CT_small.dcm"))
    patient = _define_patient(ct)
    study = _define_study(ct)
    series = _define_series(ct)
    image = _define_image(ct)
    for ii, record in enumerate([patient, study, series, image]):
        rtypes = ["PATIENT", "STUDY", "SERIES", "IMAGE"]
        record.DirectoryRecordType = rtypes[ii]
        record.OffsetOfTheNextDirectoryRecord = 0
        record.RecordInUseFlag = 0xFFFF
        record.OffsetOfReferencedLowerLevelDirectoryEntity = 0

    patient = RecordNode(patient)
    study = RecordNode(study)
    series = RecordNode(series)

    image.ReferencedFileID = None
    image.ReferencedSOPClassUIDInFile = ct.SOPClassUID
    image.ReferencedSOPInstanceUIDInFile = ct.SOPInstanceUID
    image.ReferencedTransferSyntaxUIDInFile = (
        ct.file_meta.TransferSyntaxUID
    )
    image = RecordNode(image)

    image.parent = series
    series.parent = study
    study.parent = patient

    return image


@pytest.fixture
def private(dicomdir):
    """Return a DICOMDIR dataset with PRIVATE records."""
    def write_record(ds):
        """Return `ds` as explicit little encoded bytes."""
        fp = DicomBytesIO()
        fp.is_implicit_VR = False
        fp.is_little_endian = True
        write_dataset(fp, ds)

        return fp.parent.getvalue()

    def private_record():
        record = Dataset()
        record.OffsetOfReferencedLowerLevelDirectoryEntity = 0
        record.RecordInUseFlag = 65535
        record.OffsetOfTheNextDirectoryRecord = 0
        record.DirectoryRecordType = "PRIVATE"
        record.PrivateRecordUID = generate_uid()

        return record

    ds = dicomdir

    top = private_record()
    middle = private_record()
    bottom = private_record()
    bottom.ReferencedSOPClassUIDInFile = "1.2.3.4"
    bottom.ReferencedFileID = [
        "TINY_ALPHA", "PT000000", "ST000000", "SE000000", "IM000000"
    ]
    bottom.ReferencedSOPInstanceUIDInFile = (
        "1.2.276.0.7230010.3.1.4.0.31906.1359940846.78187"
    )
    bottom.ReferencedTransferSyntaxUIDInFile = ExplicitVRLittleEndian

    len_top = len(write_record(top))  # 112
    len_middle = len(write_record(middle))  # 112
    len_bottom = len(write_record(bottom))  # 238
    len_last = len(write_record(ds.DirectoryRecordSequence[-1]))  # 248

    records = {}
    for item in ds.DirectoryRecordSequence:
        records[item.seq_item_tell] = item

    # Top PRIVATE
    # Offset to the top PRIVATE - 10860 + 248 + 8
    offset = ds.DirectoryRecordSequence[-1].seq_item_tell + len_last + 8

    # Change the last top-level record to point at the top PRIVATE
    # Original is 3126
    last = ds.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity
    record = records[last]
    record.OffsetOfTheNextDirectoryRecord = offset

    # Change the last record offset
    ds.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity = offset
    top.seq_item_tell = offset

    # Offset to the middle PRIVATE
    offset += len_top + 8
    top.OffsetOfReferencedLowerLevelDirectoryEntity = offset
    ds.DirectoryRecordSequence.append(top)
    middle.seq_item_tell = offset

    # Middle PRIVATE
    # Offset to the bottom PRIVATE
    offset += len_middle + 8
    middle.OffsetOfReferencedLowerLevelDirectoryEntity = offset
    ds.DirectoryRecordSequence.append(middle)

    # Bottom PRIVATE
    ds.DirectoryRecordSequence.append(bottom)
    bottom.seq_item_tell = offset

    # Redo the record parsing to reflect changes
    ds.parse_records()

    return ds


@pytest.fixture
def dummy():
    """Return a dummy dataset used for testing the record creators"""
    ds = Dataset()
    ds.file_meta = FileMetaDataset()
    ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    ds.PatientID = "12345678"
    ds.PatientName = "Citizen^Jan"
    ds.StudyDate = "20201001"
    ds.StudyTime = "120000"
    ds.StudyID = "1"
    ds.StudyInstanceUID = "1.2.3"
    ds.SeriesInstanceUID = "1.2.3.4"
    ds.SeriesNumber = "1"
    ds.SOPInstanceUID = "1.2.3.4.5"
    ds.InstanceNumber = "1"
    ds.ContentDate = "20201002"
    ds.ContentTime = "120100"
    ds.ContentLabel = "CONTENT LABEL"
    ds.ContentDescription = "Content description"
    ds.ContentCreatorName = "Content^Creator^Name"
    ds.TreatmentDate = "20201003"
    ds.TreatmentTime = "120200"
    ds.PresentationCreationDate = "20201004"
    ds.PresentationCreationTime = "120300"
    ds.InstanceCreationDate = "20200105"
    ds.InstanceCreationTime = "120400"
    ds.CompletionFlag = "COMPLETE"
    ds.VerificationFlag = "VERIFIED"
    ds.ConceptNameCodeSequence = [Dataset()]
    ds.ImageType = "ADDITION"
    ds.NumberOfFrames = 7
    ds.Rows = 10
    ds.Columns = 11
    ds.DataPointRows = 12
    ds.DataPointColumns = 13
    ds.HangingProtocolCreator = "HP Creator"
    ds.HangingProtocolCreationDateTime = "20201001120000"
    ds.HangingProtocolDefinitionSequence = [Dataset()]
    ds.NumberOfPriorsReferenced = 2
    ds.HangingProtocolUserIdentificationCodeSequence = [Dataset()]
    ds.DocumentTitle = "Document title"
    ds.MIMETypeOfEncapsulatedDocument = "PDF"
    ds.Manufacturer = "Implant manufacturer"
    ds.ImplantName = "Implant name"
    ds.ImplantPartNumber = "PN01"
    ds.ImplantAssemblyTemplateName = "Template name"
    ds.ProcedureTypeCodeSequence = [Dataset()]
    ds.ImplantTemplateGroupName = "Group name"
    ds.ImplantTemplateGroupIssuer = "Group issuer"
    ds.RTPlanDate = "20201006"
    ds.RTPlanTime = "120600"
    ds.DoseSummationType = "PLAN"
    ds.StructureSetLabel = "Struct set label"
    ds.StructureSetDate = "20201007"
    ds.StructureSetTime = "120700"

    # To be customised
    ds.Modality = "CT"  # PLAN, STSEGANN
    ds.SOPClassUID = CTImageStorage

    # To be added
    # ds.EncapsulatedDocument = None
    # ds.RTPlanLabel = None

    # 1C elements
    opt = Dataset()
    opt.SpecificCharacterSet = "ISO_IR 100"
    opt.BlendingSequence = [Dataset()]
    opt.ReferencedSeriesSequence = [Dataset()]
    opt.VerificationDateTime = "20201001120000"
    opt.ContentSequence = [Dataset()]
    opt.ReferencedImageEvidenceSequence = [Dataset()]
    opt.HL7InstanceIdentifier = "HL7 identifier"
    opt.ImplantSize = "13.4x12.5"
    opt.UserContentLabel = "Content label"
    opt.UserContentLongLabel = "Content long label"

    return ds, opt


def write_fs(fs, path=None):
    """Call FileSet.write(path).

    Returns
    -------
    pydicom.dataset.Dataset
        The resulting DICOMDIR dataset
    list of PathLike
        A list of paths for the non-DICOMDIR files in the File-set.
    """
    fs.write(path)
    path = Path(fs.path)
    paths = [
        p for p in path.glob('**/*')
        if p.is_file() and p.name != 'DICOMDIR'
    ]
    return dcmread(path / "DICOMDIR"), sorted(paths)


def copy_fs(fs, path, as_implicit=False):
    """Call FileSet.copy(path).

    Returns
    -------
    pydicom.fileset.FileSet
        The new FileSet,
    pydicom.dataset.Dataset
        The new File-set's DICOMDIR dataset
    list of PathLike
        A list of paths for the non-DICOMDIR files in the new File-set.
    """
    path = Path(path)
    fs = fs.copy(path, force_implicit=as_implicit)
    paths = [
        p for p in path.glob('**/*')
        if p.is_file() and p.name != 'DICOMDIR'
    ]
    return fs, dcmread(path / "DICOMDIR"), sorted(paths)


def temporary_fs(ds):
    """Copy a File-set to a temporary directory."""
    t = TemporaryDirectory()
    src = Path(ds.filename).parent
    dst = Path(t.name)

    shutil.copyfile(src / 'DICOMDIR', dst / 'DICOMDIR')
    for d in src.glob('*'):
        if d.is_dir():
            shutil.copytree(d, dst / d.name)

    return t, dcmread(dst / "DICOMDIR")


def test_is_conformant_file_id():
    """Test conformant and non-conformant File ID paths"""
    bad = [
        "aBCDEF123", "aBCD1234", "ABCD!", "1234)", " ",
        "1/2/3/4/5/6/7/8/9", "لنزار", "ABCD.DCM", "123 ABCD"
    ]
    for p in bad:
        assert not is_conformant_file_id(Path(p))

    good = [
        "ACBDEFGH", "12345678", "1/2/3/4/5/6/7/8", "0", "9", "A", "Z",
        "ABCD1234", "1234ABCD", "_", "_ABCD", "ABCD_", "AB_CD", "________",
        "A_______", "_______1"
    ]
    for p in good:
        assert is_conformant_file_id(Path(p))


def test_prefixes():
    """Test that the file ID prefixes are unique."""
    prefixes = set(_PREFIXES.values())
    assert len(_PREFIXES) == len(prefixes)


class TestGenerateFilename:
    """Tests for generate_filename()."""
    def test_numeric(self):
        """Test generating numeric suffixes."""
        gen = generate_filename(start=0, alphanumeric=False)
        assert '00000000' == next(gen)
        assert '00000001' == next(gen)
        assert '00000002' == next(gen)
        assert '00000003' == next(gen)
        assert '00000004' == next(gen)
        assert '00000005' == next(gen)
        assert '00000006' == next(gen)
        assert '00000007' == next(gen)
        assert '00000008' == next(gen)
        assert '00000009' == next(gen)
        assert '00000010' == next(gen)

    def test_numeric_prefix(self):
        """Test prefix for numeric filenames."""
        for ii in range(1, 8):
            prefix = "A" * ii
            gen = generate_filename(
                prefix="A" * ii, start=0, alphanumeric=False
            )
            assert prefix + '0' * (8 - ii) == next(gen)

    def test_numeric_start(self):
        """Test start point with numeric suffixes."""
        gen = generate_filename(start=10, alphanumeric=False)
        assert '00000010' == next(gen)
        assert '00000011' == next(gen)
        assert '00000012' == next(gen)

    def test_alphanumeric(self):
        """Test generating alphanumeric suffixes."""
        gen = generate_filename(start=0, alphanumeric=True)
        assert '00000000' == next(gen)
        assert '00000001' == next(gen)
        assert '00000002' == next(gen)
        assert '00000003' == next(gen)
        assert '00000004' == next(gen)
        assert '00000005' == next(gen)
        assert '00000006' == next(gen)
        assert '00000007' == next(gen)
        assert '00000008' == next(gen)
        assert '00000009' == next(gen)
        assert '0000000A' == next(gen)
        for ii in range(24):
            next(gen)
        assert '0000000Z' == next(gen)
        assert '00000010' == next(gen)

    def test_alphanumeric_prefix(self):
        """Test length of the suffixes."""
        for ii in range(1, 8):
            prefix = "A" * ii
            gen = generate_filename(
                prefix="A" * ii, start=0, alphanumeric=True
            )
            assert prefix + '0' * (8 - ii) == next(gen)
            assert prefix + '0' * (7 - ii) + '1' == next(gen)
            assert prefix + '0' * (7 - ii) + '2' == next(gen)
            assert prefix + '0' * (7 - ii) + '3' == next(gen)
            assert prefix + '0' * (7 - ii) + '4' == next(gen)
            assert prefix + '0' * (7 - ii) + '5' == next(gen)
            assert prefix + '0' * (7 - ii) + '6' == next(gen)
            assert prefix + '0' * (7 - ii) + '7' == next(gen)
            assert prefix + '0' * (7 - ii) + '8' == next(gen)
            assert prefix + '0' * (7 - ii) + '9' == next(gen)
            assert prefix + '0' * (7 - ii) + 'A' == next(gen)

    def test_alphanumeric_start(self):
        """Test start point with alphanumeric suffixes."""
        gen = generate_filename(start=10, alphanumeric=True)
        assert '0000000A' == next(gen)
        assert '0000000B' == next(gen)
        assert '0000000C' == next(gen)

    def test_long_prefix_raises(self):
        """Test too long a prefix."""
        msg = r"The 'prefix' must be less than 8 characters long"
        with pytest.raises(ValueError, match=msg):
            next(generate_filename('A' * 8))


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestRecordNode:
    """Tests for RecordNode."""
    def test_root(self, private):
        """Tests the root node."""
        fs = FileSet(private)
        root = fs._tree
        assert [] == root.ancestors
        msg = r"The root node doesn't contribute a File ID component"
        with pytest.raises(ValueError, match=msg):
            root.component

        assert root.file_set == fs
        assert root.parent is None
        assert 3 == len(root.children)
        assert 55 == len(list(iter(root)))

        # Test __contains__
        for child in root.children:
            assert child in root
            assert child.key in root

        assert -1 == root.depth
        assert 0 == root.index
        assert not root.has_instance
        assert root.is_root
        assert root.previous is None
        assert root.next is None
        assert root == root.root

        assert "ROOT" == str(root)

        msg = r"'RootNode' object has no attribute '_record'"
        with pytest.raises(AttributeError, match=msg):
            root.key

        with pytest.raises(AttributeError, match=msg):
            root.record_type

        assert pytest.raises(StopIteration, next, root.reverse())

        # Test __getitem__
        for child in root.children:
            assert child == root[child.key]
            assert child == root[child]  # bit silly

        child = child.children[0]
        with pytest.raises(KeyError):
            root[child.key]

        with pytest.raises(KeyError):
            root[child]

        with pytest.raises(KeyError):
            del root[child.key]

        with pytest.raises(KeyError):
            del root[child]

        # Test __delitem__
        del root[root.children[0]]
        assert 2 == len(root.children)
        assert 41 == len(list(iter(root)))

        # Test __iter__
        gen = iter(root)
        assert "PatientID='98890234'" in str(next(gen))
        assert "StudyDate=20010101" in str(next(gen))
        assert "SeriesNumber=4" in str(next(gen))
        assert "InstanceNumber=1" in str(next(gen))
        assert "InstanceNumber=2" in str(next(gen))
        assert "SeriesNumber=5" in str(next(gen))
        assert "InstanceNumber=6" in str(next(gen))
        assert "InstanceNumber=7" in str(next(gen))
        for ii in range(29):
            next(gen)

        assert "InstanceNumber=7" in str(next(gen))
        assert "PRIVATE" in str(next(gen))
        assert "PRIVATE" in str(next(gen))
        assert "PRIVATE" in str(next(gen))
        assert pytest.raises(StopIteration, next, gen)

    def test_leaf(self, private):
        """Test a leaf node."""
        fs = FileSet(private)

        # non-PRIVATE
        leaf = fs._instances[5].node
        assert [] == leaf.children
        assert leaf.has_instance
        ancestors = leaf.ancestors
        assert 3 == len(ancestors)
        assert "IMAGE" == leaf.record_type
        assert "IM000002" == leaf.component
        assert "SERIES" in str(ancestors[0])
        assert "SE000000" == ancestors[0].component
        assert "STUDY" in str(ancestors[1])
        assert "ST000001" == ancestors[1].component
        assert "PATIENT" in str(ancestors[2])
        assert "PT000000" == ancestors[2].component
        assert 3 == leaf.depth
        assert fs == leaf.file_set
        assert 2 == leaf.index
        assert not leaf.is_root
        gen = iter(leaf)
        assert leaf == next(gen)
        assert pytest.raises(StopIteration, next, gen)
        assert leaf.parent.children[3] == leaf.next
        assert leaf.parent.children[1] == leaf.previous

        # PRIVATE
        leaf = fs._instances[-1].node
        assert [] == leaf.children
        assert leaf.has_instance
        ancestors = leaf.ancestors
        assert 2 == len(ancestors)
        assert "PRIVATE" == leaf.record_type
        assert "P2000000" == leaf.component
        assert "PRIVATE" in str(ancestors[0])
        assert "P1000000" == ancestors[0].component
        assert "PRIVATE" in str(ancestors[1])
        assert "P0000002" == ancestors[1].component
        assert 2 == leaf.depth
        assert fs == leaf.file_set
        assert 0 == leaf.index
        assert not leaf.is_root
        gen = iter(leaf)
        assert leaf == next(gen)
        assert pytest.raises(StopIteration, next, gen)
        assert leaf.next is None
        assert leaf.previous is None

    def test_add(self, private, ct):
        """Test instance added at end of children"""
        fs = FileSet(private)
        instance = fs._instances[0]
        parent = instance.node.parent
        assert 1 == len(parent.children)
        assert 0 == instance.node.index
        assert instance.node.next is None
        assert instance.node.previous is None

        ct.PatientID = instance.PatientID
        ct.StudyInstanceUID = instance.StudyInstanceUID
        ct.SeriesInstanceUID = instance.SeriesInstanceUID
        added = fs.add(ct)
        assert 2 == len(parent.children)
        assert 0 == instance.node.index
        assert added.node == instance.node.next
        assert instance.node.previous is None
        assert 1 == added.node.index
        assert instance.node == added.node.previous
        assert added.node.next is None

    def test_key(self, private):
        """Test the record keys."""
        fs = FileSet(private)
        root = fs._tree
        node = root.children[0]
        assert node._record.PatientID == node.key
        node = node.children[0]
        assert node._record.StudyInstanceUID == node.key
        node = node.children[0]
        assert node._record.SeriesInstanceUID == node.key
        node = node.children[0]
        assert node._record.ReferencedSOPInstanceUIDInFile == node.key

        node = root.children[-1]
        assert node._record.PrivateRecordUID == node.key
        node = node.children[-1]
        assert node._record.PrivateRecordUID == node.key
        node = node.children[-1]
        assert node._record.PrivateRecordUID == node.key

        # Test STUDY directly referencing an instance
        ds = private
        seq = ds.DirectoryRecordSequence
        uid = seq[3].ReferencedSOPInstanceUIDInFile
        seq[1].ReferencedSOPInstanceUIDInFile = uid
        seq[1].ReferencedTransferSyntaxUIDInFile = ExplicitVRLittleEndian
        seq[1].ReferencedSOPClassUID = ComputedRadiographyImageStorage
        seq[1].OffsetOfReferencedLowerLevelDirectoryEntity = 0
        seq[1].ReferencedFileID = seq[3].ReferencedFileID
        del seq[1].StudyInstanceUID
        fs = FileSet(ds)
        # The leaf STUDY node
        node = fs._tree.children[0].children[0]
        assert [] == node.children
        assert uid == node.key
        assert node.has_instance

    def test_key_raises(self, dummy):
        """Test missing required element raises."""
        ds, opt = dummy
        ds.SOPClassUID = ColorPaletteStorage
        fs = FileSet()
        instance = fs.add(ds)
        del instance.node._record.ReferencedSOPInstanceUIDInFile

        msg = (
            r"Invalid 'PALETTE' record - missing required element "
            r"'Referenced SOP Instance UID in File'"
        )
        with pytest.raises(AttributeError, match=msg):
            instance.node.key

    def test_bad_record(self, private):
        """Test a bad directory record raises an exception when loading."""
        del private.DirectoryRecordSequence[0].PatientID
        msg = (
            r"The PATIENT directory record at offset 396 is missing a "
            r"required element"
        )
        with pytest.raises(ValueError, match=msg):
            FileSet(private)

        private.DirectoryRecordSequence[0].PatientID = "77654033"
        del private.DirectoryRecordSequence[1].StudyInstanceUID
        msg = (
            r"The STUDY directory record at offset 510 is missing a required "
            r"element"
        )
        with pytest.raises(ValueError, match=msg):
            FileSet(private)

    def test_bad_record_missing_req(self, private):
        """Test bad directory record raises if missing required element."""
        del private.DirectoryRecordSequence[0].DirectoryRecordType
        msg = (
            r"The directory record at offset 396 is missing one or more "
            r"required elements: DirectoryRecordType"
        )
        with pytest.raises(ValueError, match=msg):
            FileSet(private)

    def test_encoding(self, private, tdir):
        """Test group element not added when encoding."""
        fs = FileSet(private)
        node = fs._instances[0].node
        fs._instances[0].node._record.add_new(0x00080000, "UL", 128)
        fs._instances[0].node._record.PatientSex = 'F'
        fs, ds, paths = copy_fs(fs, tdir.name)
        item = ds.DirectoryRecordSequence[3]
        assert 0x00080000 not in item
        assert "PatientSex" in item

    def test_remove_raises(self, private):
        """Test RecordNode.remove() raises if not a leaf."""
        fs = FileSet(private)
        node = fs._tree.children[0]
        assert not node.has_instance
        msg = r"Only leaf nodes can be removed"
        with pytest.raises(ValueError, match=msg):
            fs._tree.remove(node)

    def test_file_id_singleton(self, ct, tdir):
        """Test a singleton File ID."""
        fs = FileSet()
        p = Path(tdir.name)
        ct.save_as(p / "01")
        fs.add(p / "01")
        fs.write(p)
        ds = dcmread(p / "DICOMDIR")
        item = ds.DirectoryRecordSequence[-1]
        assert "IMAGE" == item.DirectoryRecordType
        item.ReferencedFileID = "01"
        ds.save_as(p / "DICOMDIR")
        fs = FileSet(ds)
        assert fs._instances[0].node._file_id == Path("01")

    def test_file_id_missing(self, ct):
        """Test RecordNode._file_id if no Referenced File ID."""
        fs = FileSet()
        instance = fs.add(ct)
        del instance.node._record.ReferencedFileID
        msg = r"No 'Referenced File ID' in the directory record"
        with pytest.raises(AttributeError, match=msg):
            instance.node._file_id


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestFileInstance:
    """Tests for FileInstance."""
    def test_getattr(self, dicomdir):
        """Test FileInstance.__getattribute__."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        assert "20010101" == instance.StudyDate
        instance.my_attr = 1234
        assert 1234 == instance.my_attr
        msg = r"'FileInstance' object has no attribute 'missing_attr'"
        with pytest.raises(AttributeError, match=msg):
            instance.missing_attr

    def test_getattr_order(self, private):
        """Test records are searched closest to furthest"""
        fs = FileSet(private)
        instance = fs._instances[-1]
        assert instance.is_private
        # a: root, b: middle, c: bottom,
        c = instance.node
        b = c.parent
        a = b.parent
        assert c._record.PrivateRecordUID != b._record.PrivateRecordUID
        assert c._record.PrivateRecordUID != a._record.PrivateRecordUID
        assert instance.PrivateRecordUID == c._record.PrivateRecordUID

    def test_getitem(self, dicomdir):
        """Test FileInstance.__getitem__."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        assert "20010101" == instance["StudyDate"].value
        assert "20010101" == instance[0x00080020].value
        assert "20010101" == instance[Tag(0x00080020)].value
        assert "20010101" == instance[(0x0008, 0x0020)].value
        assert "20010101" == instance["0x00080020"].value

        with pytest.raises(KeyError, match=r"(0000, 0000)"):
            instance[0x00000000]

    def test_getitem_special(self, tiny):
        """Test FileInstance.__getitem__ for the three special elements."""
        fs = FileSet(tiny)
        instance = fs._instances[0]
        elem = instance["SOPInstanceUID"]
        assert (
            "1.2.826.0.1.3680043.8.498.66612287766462461480665815941164330386"
        ) == elem.value
        elem = instance["SOPClassUID"]
        assert CTImageStorage == elem.value
        elem = instance["TransferSyntaxUID"]
        assert ExplicitVRLittleEndian == elem.value

    def test_getitem_order(self, private):
        """Test records are searched closest to furthest"""
        fs = FileSet(private)
        instance = fs._instances[-1]
        assert instance.is_private
        # a: root, b: middle, c: bottom,
        c = instance.node
        b = c.parent
        a = b.parent
        assert c._record["PrivateRecordUID"] != b._record["PrivateRecordUID"]
        assert c._record["PrivateRecordUID"] != a._record["PrivateRecordUID"]
        assert instance["PrivateRecordUID"] == c._record["PrivateRecordUID"]

    def test_contains(self, dicomdir):
        """Test FileInstance.__contains__."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        assert "StudyDate" in instance
        assert 0x00080020 in instance
        assert Tag(0x00080020) in instance
        assert (0x0008, 0x0020) in instance
        assert "0x00080020" in instance
        assert 'bad' not in instance

    def test_is_private(self, private):
        """Test FileInstance.is_private"""
        fs = FileSet(private)
        instance = fs._instances[-1]
        assert instance.is_private
        instance = fs._instances[0]
        assert not instance.is_private

    def test_properties(self, dicomdir):
        """Test the FileInstance properties."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        assert fs == instance.file_set
        assert os.fspath(Path("77654033/CR1/6154")) in instance.path
        assert isinstance(instance.path, str)
        sop_instance = "1.3.6.1.4.1.5962.1.1.0.0.0.1196527414.5534.0.11"

        nodes = [node for node in instance.node.ancestors]
        assert 3 == len(nodes)
        assert nodes[0].record_type == "SERIES"
        assert nodes[1].record_type == "STUDY"
        assert nodes[2].record_type == "PATIENT"
        record = instance.node._record
        assert sop_instance == record.ReferencedSOPInstanceUIDInFile
        assert sop_instance == instance.SOPInstanceUID
        assert ExplicitVRLittleEndian == instance.TransferSyntaxUID
        assert "1.2.840.10008.5.1.4.1.1.1" == instance.SOPClassUID

    def test_path(self, ct, tdir):
        """Test FileInstance.path when not staged."""
        fs = FileSet()
        fs.add(ct)
        ds, paths = write_fs(fs, tdir.name)

        assert 1 == len(fs)
        instance = fs._instances[0]
        assert not instance.is_staged
        assert (Path(fs.path) / Path(instance.FileID)) == Path(instance.path)

    def test_path_add(self, ct, tdir):
        """Test FileInstance.path when staged for addition."""
        fs = FileSet()
        fs.add(ct)
        assert 1 == len(fs)
        instance = fs._instances[0]
        assert instance.is_staged
        assert instance.for_addition
        assert (
            Path(fs._stage['path']) / Path(instance.SOPInstanceUID)
        ) == Path(instance.path)
        assert isinstance(instance.path, str)

    def test_path_move(self, dicomdir):
        """Test FileInstance.path for an instance to be move."""
        fs = FileSet(dicomdir)
        assert fs._stage['~']
        instance = fs._instances[0]
        assert instance.is_staged
        assert instance.for_moving
        assert (
            Path(fs.path) / Path(*instance.ReferencedFileID)
        ) == Path(instance.path)
        assert isinstance(instance.path, str)

    def test_path_removal(self, dicomdir, tdir):
        """Test FileInstance.FileID when staged for removal."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        fs.remove(instance)
        assert instance.is_staged
        assert instance.for_removal
        assert (
            Path(fs.path) / Path(*instance.ReferencedFileID)
        ) == Path(instance.path)
        assert isinstance(instance.path, str)

    def test_load(self, ct, tdir):
        """Test FileInstance.load() when not staged."""
        fs = FileSet()
        fs.add(ct)
        ds, paths = write_fs(fs, tdir.name)

        assert 1 == len(fs)
        instance = fs._instances[0]
        assert not instance.is_staged
        ds = instance.load()
        assert isinstance(ds, Dataset)
        assert ct.SOPInstanceUID == ds.SOPInstanceUID

    def test_load_staged_add(self, ct, tdir):
        """Test FileInstance.load() when staged for addition."""
        fs = FileSet()
        fs.add(ct)
        assert 1 == len(fs)
        instance = fs._instances[0]
        assert instance.is_staged
        assert instance.for_addition
        ds = instance.load()
        assert isinstance(ds, Dataset)
        assert ct.SOPInstanceUID == ds.SOPInstanceUID

    def test_load_staged_move(self, dicomdir):
        """Test FileInstance.load() for an instance to be moved."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        assert instance.is_staged
        assert instance.for_moving
        assert fs.is_staged
        # At least one instance needs to be moved
        assert fs._stage['~']
        ds = instance.load()
        assert isinstance(ds, Dataset)
        sop_instance = "1.3.6.1.4.1.5962.1.1.0.0.0.1196527414.5534.0.11"
        assert sop_instance == ds.SOPInstanceUID

    def test_load_staged_removal(self, dicomdir, tdir):
        """Test FileInstance.load() when staged for removal."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        fs.remove(instance)
        assert instance.is_staged
        assert instance.for_removal
        ds = instance.load()
        assert isinstance(ds, Dataset)
        sop_instance = "1.3.6.1.4.1.5962.1.1.0.0.0.1196527414.5534.0.11"
        assert sop_instance == ds.SOPInstanceUID

    def test_for_moving(self, dummy, ct, tdir):
        """Test FileInstance.for_moving."""
        ds, opt = dummy
        ds.SOPClassUID = ColorPaletteStorage
        fs = FileSet()
        # Single level File ID
        instance = fs.add(ds)
        assert instance.for_addition
        assert not instance.for_removal
        assert not instance.for_moving

        # Four level File ID
        instance = fs.add(ct)
        assert instance.for_addition
        assert not instance.for_removal
        assert not instance.for_moving

        ds, paths = write_fs(fs, tdir.name)
        for instance in fs:
            assert not instance.for_addition
            assert not instance.for_removal
            assert not instance.for_moving

    def test_fileid(self, ct, tdir):
        """Test FileInstance.FileID when not staged."""
        fs = FileSet()
        fs.add(ct)
        ds, paths = write_fs(fs, tdir.name)

        assert 1 == len(fs)
        instance = fs._instances[0]
        assert not instance.is_staged
        fileid = Path("PT000000/ST000000/SE000000/IM000000")
        assert os.fspath(fileid) == instance.FileID

    def test_fileid_add(self, ct, tdir):
        """Test FileInstance.FileID when staged for addition."""
        fs = FileSet()
        fs.add(ct)
        assert 1 == len(fs)
        instance = fs._instances[0]
        assert instance.is_staged
        assert instance.for_addition
        fileid = Path("PT000000/ST000000/SE000000/IM000000")
        assert os.fspath(fileid) == instance.FileID

    def test_fileid_move(self, dicomdir):
        """Test FileInstance.FileID for an instance to be moved."""
        fs = FileSet(dicomdir)
        assert fs.is_staged
        # At least one instance needs to be moved
        assert fs._stage['~']
        instance = fs._instances[0]
        assert instance.is_staged
        assert instance.for_moving
        fileid = Path("PT000000/ST000000/SE000000/IM000000")
        assert os.fspath(fileid) == instance.FileID

    def test_fileid_removal(self, dicomdir, tdir):
        """Test FileInstance.FileID when staged for removal."""
        fs = FileSet(dicomdir)
        instance = fs._instances[0]
        fs.remove(instance)
        assert instance.is_staged
        assert instance.for_removal
        fileid = Path("PT000000/ST000000/SE000000/IM000000")
        assert os.fspath(fileid) == instance.FileID

    def test_private(self, private):
        """Test FileInstance with PRIVATE records."""
        fs = FileSet(private)

        instances = fs._instances
        assert 32 == len(instances)

        instance = instances[-1]
        assert 2 == len(instance.node.ancestors)
        for node in instance.node.reverse():
            assert node.record_type == "PRIVATE"

        path = os.fspath(
            Path("TINY_ALPHA/PT000000/ST000000/SE000000/IM000000")
        )
        assert path in instances[-1].path

        assert "1.2.3.4" == instance.SOPClassUID
        assert "1.2.276.0.7230010.3.1.4.0.31906.1359940846.78187" == (
            instance.SOPInstanceUID
        )
        assert ExplicitVRLittleEndian == instance.TransferSyntaxUID


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestFileSet:
    """Tests for FileSet."""
    def test_empty(self):
        """Test an new and empty File-set."""
        fs = FileSet()
        assert 0 == len(fs)
        assert fs.ID is None
        assert fs.UID.is_valid
        assert fs.path is None
        assert fs.is_staged  # New datasets are staged

        with pytest.raises(StopIteration):
            next(iter(fs))

        s = str(fs)
        assert "DICOM File-set" in s
        assert "Root directory: (no value available)" in s
        assert "File-set ID: (no value available)" in s
        assert f"File-set UID: {fs.UID}" in s
        assert "Managed instances" not in s

    def test_id(self, tdir):
        """Test the FileSet.ID property."""
        fs = FileSet()
        assert fs.is_staged
        assert fs.ID is None
        fs.ID = "MYID"
        assert fs.is_staged
        assert "MYID" == fs.ID

        s = str(fs)
        assert "DICOM File-set" in s
        assert "Root directory: (no value available)" in s
        assert "File-set ID: MYID" in s
        assert f"File-set UID: {fs.UID}" in s
        assert "Managed instances" not in s

        ds, paths = write_fs(fs, tdir.name)
        assert not fs.is_staged
        assert "Changes staged for write():" not in str(fs)

        fs.ID = "MYID"
        assert not fs.is_staged

        fsids = [None, "A", "1" * 16]
        for fsid in fsids:
            fs.ID = fsid
            assert fs.is_staged
            assert fsid == fs.ID
            ds, paths = write_fs(fs)
            assert [] == paths
            if fsid is None:
                fsid = ""
            assert fsid == ds.FileSetID

        msg = r"The maximum length of the 'File-set ID' is 16 characters"
        with pytest.raises(ValueError, match=msg):
            fs.ID = "1" * 17

        assert "1" * 16 == fs.ID

    def test_uid(self, tdir):
        """Test the FileSet.UID property."""
        fs = FileSet()
        assert fs.is_staged
        uid = fs.UID
        ds, paths = write_fs(fs, tdir.name)
        assert [] == paths
        assert fs.UID == ds.file_meta.MediaStorageSOPInstanceUID

        s = str(fs)
        assert "DICOM File-set" in s
        assert f"Root directory: (no value available)" not in s
        assert "File-set ID: (no value available)" in s
        assert f"File-set UID: {fs.UID}" in s
        assert "Managed instances" not in s
        assert "Changes staged for write():" not in s
        assert not fs.is_staged

        fs.UID = uid
        assert not fs.is_staged

        fs.UID = generate_uid()
        assert uid != fs.UID
        assert fs.is_staged

    def test_descriptor(self):
        """Test FileSet.descriptor_file_id."""
        fs = FileSet()
        assert fs.descriptor_file_id is None
        assert fs.is_staged
        fs._stage['^'] = False  # Override
        assert not fs.is_staged
        fs.descriptor_file_id = None
        assert not fs.is_staged
        assert fs.descriptor_file_id is None
        fs.descriptor_file_id = "README"
        assert fs.is_staged
        assert "README" == fs.descriptor_file_id
        fs.descriptor_file_id = "README"
        assert "README" == fs.descriptor_file_id
        fs.descriptor_file_id = "A" * 16
        assert "A" * 16 == fs.descriptor_file_id
        fs.descriptor_file_id = None
        assert fs.descriptor_file_id is None
        fs.descriptor_file_id = ['A'] * 8
        assert ['A'] * 8 == fs.descriptor_file_id
        fs.descriptor_file_id = ["A", "", "B", "C"]
        assert ['A', 'B', 'C'] == fs.descriptor_file_id

        # Test exceptions
        msg = r"The 'DescriptorFileID' must be a str, list of str, or None"
        with pytest.raises(TypeError, match=msg):
            fs.descriptor_file_id = 12
        msg = (
            r"The 'File-set Descriptor File ID' has a maximum of 8 "
            r"components, each between 0 and 16 characters long"
        )
        with pytest.raises(ValueError, match=msg):
            fs.descriptor_file_id = ['A'] * 9
        with pytest.raises(ValueError, match=msg):
            fs.descriptor_file_id = ['A' * 17]
        with pytest.raises(ValueError, match=msg):
            fs.descriptor_file_id = ['A', 1]
        msg = (
            r"Each 'File-set Descriptor File ID' component has a "
            r"maximum length of 16 characters"
        )
        with pytest.raises(ValueError, match=msg):
            fs.descriptor_file_id = "A" * 17

        assert ['A', 'B', 'C'] == fs.descriptor_file_id

    def test_descriptor_and_charset_written(self, tdir):
        """Test that the File-set Descriptor File ID gets written."""
        fs = FileSet()
        fs.descriptor_file_id = "README"
        fs.descriptor_character_set = "ISO_IR 100"
        ds, paths = write_fs(fs, tdir.name)
        assert "README" == ds.FileSetDescriptorFileID
        assert "ISO_IR 100" == ds.SpecificCharacterSetOfFileSetDescriptorFile

    def test_descriptor_dicomdir(self, dicomdir):
        """Test FileSet.descriptor_file_id with a DICOMDIR file."""
        fs = FileSet(dicomdir)
        ds = fs._ds
        assert fs.descriptor_file_id is None
        assert "FileSetDescriptorFileID" not in ds
        assert fs.is_staged
        fs._stage['^'] = False  # Override
        fs._stage['~'] = {}
        assert not fs.is_staged
        fs.descriptor_file_id = None
        assert "FileSetDescriptorFileID" not in ds
        assert not fs.is_staged
        assert fs.descriptor_file_id is None
        fs.descriptor_file_id = "README"
        assert "README" == ds.FileSetDescriptorFileID
        assert fs.is_staged
        assert "README" == fs.descriptor_file_id
        fs.descriptor_file_id = "README"
        assert "README" == fs.descriptor_file_id
        fs.descriptor_file_id = "A" * 16
        assert "A" * 16 == fs.descriptor_file_id
        assert "A" * 16 == ds.FileSetDescriptorFileID
        fs.descriptor_file_id = None
        assert fs.descriptor_file_id is None
        assert ds.FileSetDescriptorFileID is None
        fs.descriptor_file_id = ['A'] * 8
        assert ['A'] * 8 == fs.descriptor_file_id
        assert ['A'] * 8 == ds.FileSetDescriptorFileID

    def test_descriptor_charset(self):
        """Test FileSet.descriptor_character_set."""
        fs = FileSet()
        assert fs.descriptor_character_set is None
        assert fs.is_staged
        fs._stage['^'] = False  # Override
        assert not fs.is_staged
        fs.descriptor_character_set = None
        assert not fs.is_staged
        assert fs.descriptor_character_set is None
        fs.descriptor_character_set = "README"
        assert fs.is_staged
        assert "README" == fs.descriptor_character_set

    def test_descriptor_charset_dicomdir(self, dicomdir):
        """Test FileSet.descriptor_character_set."""
        fs = FileSet(dicomdir)
        ds = fs._ds
        assert fs.descriptor_character_set is None
        assert "SpecificCharacterSetOfFileSetDescriptorFile" not in ds
        assert fs.is_staged
        fs._stage['^'] = False  # Override
        fs._stage['~'] = {}
        assert not fs.is_staged
        fs.descriptor_character_set = None
        assert "SpecificCharacterSetOfFileSetDescriptorFile" not in ds
        assert not fs.is_staged
        assert fs.descriptor_character_set is None
        fs.descriptor_character_set = "README"
        assert "README" == ds.SpecificCharacterSetOfFileSetDescriptorFile
        assert fs.is_staged

    def test_path(self, tdir):
        """Test setting the File-set's path."""
        fs = FileSet()
        assert fs.path is None
        msg = (r"can't set attribute" if sys.version_info < (3, 11)
               else r"property 'path' of 'FileSet' object has no setter")
        with pytest.raises(AttributeError, match=msg):
            fs.path = tdir.name

        # Test with str
        path = tdir.name
        assert isinstance(path, str)
        ds, paths = write_fs(fs, path)
        assert Path(path).parts[-2:] == Path(fs.path).parts[-2:]
        assert [] == paths
        root = os.fspath(Path(*Path(tdir.name).parts[-2:]))
        assert root in ds.filename
        assert root in str(fs)
        assert not fs.is_staged

        # Test with PathLike
        fs = FileSet()
        path = Path(tdir.name)
        ds, paths = write_fs(fs, path)
        assert [] == paths
        root = os.fspath(Path(*Path(tdir.name).parts[-2:]))
        assert root in ds.filename
        assert root in str(fs)
        assert not fs.is_staged

    def test_empty_write(self, tdir):
        """Test writing an empty File-set."""
        fs = FileSet()
        uid = fs.UID
        msg = (
            r"The path to the root directory is required for a new File-set"
        )
        with pytest.raises(ValueError, match=msg):
            fs.write()

        path = Path(tdir.name)
        fs.write(path)

        # Should be the DICOMDIR file
        contents = list(path.glob('**/*'))
        assert "DICOMDIR" == contents[0].name
        assert 1 == len(contents)

        ds = dcmread(contents[0])
        meta = ds.file_meta
        assert MediaStorageDirectoryStorage == meta.MediaStorageSOPClassUID
        assert uid == meta.MediaStorageSOPInstanceUID
        assert meta.TransferSyntaxUID == ExplicitVRLittleEndian
        assert "" == ds.FileSetID
        assert 0 == ds.OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity
        assert 0 == ds.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity
        assert 0 == ds.FileSetConsistencyFlag
        assert [] == ds.DirectoryRecordSequence

    def test_add_dataset(self, ct, tdir):
        """Test FileSet.add() with a Dataset."""
        fs = FileSet()
        assert fs.is_staged
        fs.write(tdir.name)  # write empty to unstage
        assert not fs.is_staged
        fs.add(ct)
        assert fs.is_staged

        s = str(fs)
        assert "Managed instances" in s
        assert (
            "PATIENT: PatientID='1CT1', "
            "PatientName='CompressedSamples^CT1'"
        ) in s
        assert (
            "STUDY: StudyDate=20040119, StudyTime=072730, "
            "StudyDescription='e+1'" in s
        )
        assert "SERIES: Modality=CT, SeriesNumber=1" in s
        assert 1 == len(fs)
        instances = [ii for ii in fs]
        file_id = Path("PT000000", "ST000000", "SE000000", "IM000000")
        assert os.fspath(file_id) == instances[0].FileID

        ds, paths = write_fs(fs)
        assert 1 == len(fs)

        # Test the DICOMDIR
        assert 398 == (
            ds.OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity
        )
        assert 398 == (
            ds.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity
        )

        seq = ds.DirectoryRecordSequence
        assert 4 == len(seq)

        item = seq[0]
        assert item.seq_item_tell == 398
        assert "PATIENT" == item.DirectoryRecordType
        assert ct.PatientName == item.PatientName
        assert ct.PatientID == item.PatientID
        assert 0xFFFF == item.RecordInUseFlag
        assert 0 == item.OffsetOfTheNextDirectoryRecord
        assert "ISO_IR 100" == item.SpecificCharacterSet
        assert 516 == item.OffsetOfReferencedLowerLevelDirectoryEntity

        item = seq[1]
        assert item.seq_item_tell == 516
        assert "STUDY" == item.DirectoryRecordType
        assert ct.StudyDate == item.StudyDate
        assert ct.StudyTime == item.StudyTime
        assert ct.AccessionNumber == item.AccessionNumber
        assert ct.StudyDescription == item.StudyDescription
        assert ct.StudyInstanceUID == item.StudyInstanceUID
        assert 0xFFFF == item.RecordInUseFlag
        assert 0 == item.OffsetOfTheNextDirectoryRecord
        assert "ISO_IR 100" == item.SpecificCharacterSet
        assert 704 == item.OffsetOfReferencedLowerLevelDirectoryEntity

        item = seq[2]
        assert item.seq_item_tell == 704
        assert "SERIES" == item.DirectoryRecordType
        assert ct.Modality == item.Modality
        assert ct.SeriesInstanceUID == item.SeriesInstanceUID
        assert ct.SeriesNumber == item.SeriesNumber
        assert 0xFFFF == item.RecordInUseFlag
        assert 0 == item.OffsetOfTheNextDirectoryRecord
        assert "ISO_IR 100" == item.SpecificCharacterSet
        assert 852 == item.OffsetOfReferencedLowerLevelDirectoryEntity

        item = seq[3]
        assert item.seq_item_tell == 852
        assert "IMAGE" == item.DirectoryRecordType
        assert ['PT000000', 'ST000000', 'SE000000', 'IM000000'] == (
            item.ReferencedFileID
        )
        assert ct.SOPInstanceUID == item.ReferencedSOPInstanceUIDInFile
        assert ct.InstanceNumber == item.InstanceNumber
        assert ct.SOPClassUID == item.ReferencedSOPClassUIDInFile
        assert ct.file_meta.TransferSyntaxUID == (
            item.ReferencedTransferSyntaxUIDInFile
        )
        assert 0xFFFF == item.RecordInUseFlag
        assert 0 == item.OffsetOfTheNextDirectoryRecord
        assert "ISO_IR 100" == item.SpecificCharacterSet
        assert 0 == item.OffsetOfReferencedLowerLevelDirectoryEntity

        assert not fs.is_staged
        s = str(fs)
        root = os.fspath(Path(*Path(tdir.name).parts[-2:]))
        assert root in s
        assert 1 == len(paths)
        assert ct == dcmread(paths[0])

        # Calling write() again shouldn't change anything
        ds2, paths = write_fs(fs)
        assert ds == ds2
        assert ds2.filename == ds.filename
        assert 1 == len(paths)
        assert ct == dcmread(paths[0])

    def test_add_bad_dataset(self, ct):
        """Test adding a dataset missing Type 1 element value."""
        ct.PatientID = None
        fs = FileSet()
        msg = (
            r"Unable to use the default 'PATIENT' record creator "
            r"as the instance is missing a required element or value. Either "
            r"update the instance, define your own record creation function "
            r"or use 'FileSet.add_custom\(\)' instead"
        )
        with pytest.raises(ValueError, match=msg):
            fs.add(ct)

    def test_add_path(self, tdir):
        """Test FileSet.add() with a Dataset."""
        fs = FileSet()
        fs.write(tdir.name)
        assert not fs.is_staged
        fs.add(get_testdata_file("CT_small.dcm"))
        assert fs.is_staged

    def test_add_add(self, ct, tdir):
        """Test calling FileSet.add() on the same Dataset."""
        fs = FileSet()
        fs.add(ct)
        fs.add(ct)
        assert fs.is_staged
        assert 1 == len(fs)

        ds, paths = write_fs(fs, tdir.name)
        assert 4 == len(ds.DirectoryRecordSequence)
        assert 1 == len(paths)

    def test_remove(self, ct, tdir):
        """Test removing an instance."""
        fs = FileSet()
        fs.add(ct)
        fs.write(tdir.name)
        assert "Managed instances" in str(fs)

        instance = next(iter(fs))
        assert isinstance(instance, FileInstance)
        fs.remove(instance)
        assert 0 == len(fs)
        with pytest.raises(StopIteration):
            next(iter(fs))

        ds, paths = write_fs(fs)
        assert [] == ds.DirectoryRecordSequence
        assert 0 == ds.OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity
        assert 0 == ds.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity
        assert [] == paths

    def test_remove_iter(self, tiny):
        """Test FileSet.remove() with iter(FileSet)."""
        fs = FileSet(tiny)
        for instance in fs:
            fs.remove(instance)

        assert 0 == len(fs)

    def test_remove_remove(self, ct, tdir):
        """Test removing an instance that's already removed."""
        fs = FileSet()
        fs.add(ct)
        fs.write(tdir.name)

        instance = next(iter(fs))
        assert isinstance(instance, FileInstance)
        fs.remove(instance)
        msg = r"No such instance in the File-set"
        with pytest.raises(ValueError, match=msg):
            fs.remove(instance)

    def test_remove_add(self, ct, tdir):
        """Test adding an instance that's removed."""
        fs = FileSet()
        fs.add(ct)
        fs.write(tdir.name)

        instance = next(iter(fs))
        assert isinstance(instance, FileInstance)
        fs.remove(instance)
        assert fs.is_staged
        fs.add(ct)
        assert not fs.is_staged
        ds, paths = write_fs(fs)
        assert 4 == len(ds.DirectoryRecordSequence)
        assert 1 == len(paths)

    def test_add_remove(self, ct, tdir):
        """Test removing an instance that's added."""
        fs = FileSet()
        fs.write(tdir.name)
        assert not fs.is_staged
        fs.add(ct)
        assert fs.is_staged
        instance = next(iter(fs))
        assert isinstance(instance, FileInstance)
        fs.remove(instance)
        assert not fs.is_staged

        ds, paths = write_fs(fs)
        assert [] == ds.DirectoryRecordSequence
        assert [] == paths

    def test_file_ids_unique(self, dicomdir):
        """That that the File IDs are all unique within the File-set."""
        fs = FileSet(dicomdir)
        ids = set([ii.FileID for ii in fs])
        assert len(fs._instances) == len(ids)

    def test_add_custom(self, ct, tdir, custom_leaf):
        """Test FileSet.add_custom() with a standard IOD."""
        fs = FileSet()
        fs.add_custom(ct, custom_leaf)
        assert 1 == len(fs)
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))
        assert fs.is_staged
        instance = fs._instances[0]
        assert instance.SOPInstanceUID in fs._stage['+']

        ds, paths = write_fs(fs, tdir.name)
        assert 1 == len(paths)
        assert 4 == len(ds.DirectoryRecordSequence)
        assert Dataset(ct) == dcmread(paths[0])

    def test_add_custom_path(self, ct, tdir, custom_leaf):
        """Test add_custom() with a path."""
        fs = FileSet()
        fs.add_custom(ct.filename, custom_leaf)
        assert 1 == len(fs)
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))
        assert fs.is_staged
        instance = fs._instances[0]
        assert instance.SOPInstanceUID in fs._stage['+']

        ds, paths = write_fs(fs, tdir.name)
        assert 1 == len(paths)
        assert 4 == len(ds.DirectoryRecordSequence)
        assert Dataset(ct) == dcmread(paths[0])

    def test_add_custom_private(self, ct, tdir):
        """Test add_custom() with a private instance."""
        # Maximum of 8, including the top (root) node
        patient = _define_patient(ct)
        patient.DirectoryRecordType = "PATIENT"
        patient.OffsetOfTheNextDirectoryRecord = 0
        patient.RecordInUseFlag = 0xFFFF
        patient.OffsetOfReferencedLowerLevelDirectoryEntity = 0
        patient = RecordNode(patient)
        ds = Dataset()
        ds.PrivateRecordUID = generate_uid()
        ds.DirectoryRecordType = "PRIVATE"
        ds.ReferencedFileID = None
        ds.ReferencedSOPClassUIDInFile = ct.SOPClassUID
        ds.ReferencedSOPInstanceUIDInFile = ct.SOPInstanceUID
        ds.ReferencedTransferSyntaxUIDInFile = (
            ct.file_meta.TransferSyntaxUID
        )
        private = RecordNode(ds)
        private.parent = patient

        assert 1 == private.depth

        fs = FileSet()
        fs.add_custom(ct, private)

        assert 1 == len(fs)
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))
        assert fs.is_staged
        instance = fs._instances[0]
        assert instance.SOPInstanceUID in fs._stage['+']

        ds, paths = write_fs(fs, tdir.name)
        assert 1 == len(paths)
        assert 2 == len(ds.DirectoryRecordSequence)
        assert "PATIENT" == ds.DirectoryRecordSequence[0].DirectoryRecordType
        assert "PRIVATE" == ds.DirectoryRecordSequence[1].DirectoryRecordType
        assert Dataset(ct) == dcmread(paths[0])

    def test_add_custom_too_deep(self, ct):
        """Test adding too many nodes raises exception."""
        # Maximum of 8, including the top (root) node
        top = _define_patient(ct)
        top.DirectoryRecordType = "PATIENT"
        top.OffsetOfTheNextDirectoryRecord = 0
        top.RecordInUseFlag = 0xFFFF
        top.OffsetOfReferencedLowerLevelDirectoryEntity = 0
        top = RecordNode(top)
        for ii in range(8):
            ds = Dataset()
            ds.PrivateRecordUID = generate_uid()
            ds.DirectoryRecordType = "PRIVATE"

            node = RecordNode(ds)
            node.parent = top
            top = node

        top._record.ReferencedFileID = None
        top._record.ReferencedSOPClassUIDInFile = ct.SOPClassUID
        top._record.ReferencedSOPInstanceUIDInFile = ct.SOPInstanceUID
        top._record.ReferencedTransferSyntaxUIDInFile = (
            ct.file_meta.TransferSyntaxUID
        )
        assert 8 == top.depth

        fs = FileSet()
        msg = (
            r"The 'leaf' node must not have more than 7 ancestors as "
            r"'FileSet' supports a maximum directory structure depth of 8"
        )
        with pytest.raises(ValueError, match=msg):
            fs.add_custom(ct, top)

    def test_add_custom_bad_leaf(self, ct, tdir, custom_leaf):
        """Test FileSet.add_custom() with a bad leaf record."""
        del custom_leaf._record.ReferencedSOPClassUIDInFile
        del custom_leaf._record.ReferencedFileID
        del custom_leaf._record.ReferencedSOPInstanceUIDInFile
        del custom_leaf._record.ReferencedTransferSyntaxUIDInFile

        fs = FileSet()
        instance = fs.add_custom(ct, custom_leaf)
        assert 1 == len(fs)
        assert ct.SOPClassUID == instance.ReferencedSOPClassUIDInFile
        assert instance.ReferencedFileID is None
        assert ct.SOPInstanceUID == instance.ReferencedSOPInstanceUIDInFile
        assert ct.file_meta.TransferSyntaxUID == (
            instance.ReferencedTransferSyntaxUIDInFile
        )

    def test_add_custom_add_add(self, ct, tdir, custom_leaf):
        """Test add_custom() if the instance is already in the File-set."""
        fs = FileSet()
        fs.add(ct)
        assert 1 == len(fs)
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))

        fs.add_custom(ct, custom_leaf)
        assert 1 == len(fs)
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))

    def test_add_custom_remove_add(self, ct, tdir, custom_leaf):
        """Test adding a removed instance."""
        fs = FileSet()
        fs.add_custom(ct, custom_leaf)
        ds, paths = write_fs(fs, tdir.name)
        assert not fs.is_staged
        assert 1 == len(fs)
        fs.remove(fs._instances[0])
        fs.add_custom(ct, custom_leaf)
        assert 1 == len(fs)
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))

    def test_clear(self, dicomdir, tdir):
        """Test FileSet.clear()."""
        fs = FileSet(dicomdir)
        fs.ID = "TESTID"
        fs.descriptor_file_id = "README"
        fs.descriptor_character_set = "ISO 1"
        fs, ds, paths = copy_fs(fs, tdir.name)
        assert "README" == fs.descriptor_file_id
        assert "ISO 1" == fs.descriptor_character_set
        assert [] != fs._instances
        assert fs._id is not None
        assert fs._path is not None
        uid = fs._uid
        assert fs._uid is not None
        assert fs._ds is not None
        assert fs._descriptor is not None
        assert fs._charset is not None
        assert [] != fs._tree.children

        fs.clear()
        assert [] == fs._instances
        assert fs._id is None
        assert fs._path is None
        assert uid != fs._uid
        assert fs._uid.is_valid
        assert fs._ds == Dataset()
        assert fs._descriptor is None
        assert fs._charset is None
        assert [] == fs._tree.children

    def test_str_empty(self, tdir):
        """Test str(FileSet) on an empty File-set."""
        fs = FileSet()
        s = str(fs)
        assert "DICOM File-set" in s
        assert "Root directory: (no value available)" in s
        assert "File-set ID: (no value available)" in s
        assert "File-set UID: 1.2.826.0.1" in s
        assert "Descriptor file ID: (no value available)" in s
        assert "Descriptor file character set: (no value available)" in s
        assert "Changes staged for write(): DICOMDIR creation" in s
        assert "addition" not in s
        assert "removal" not in s
        assert "Managed instances:" not in s

        # Set DICOMDIR elements
        fs.ID = "TEST ID"
        fs.descriptor_file_id = "README"
        fs.descriptor_character_set = "ISO WHATEVER"
        ds, paths = write_fs(fs, tdir.name)
        s = str(fs)
        assert "DICOM File-set" in s
        assert "Root directory: (no value available)" not in s
        assert "File-set ID: TEST ID" in s
        assert "File-set UID: 1.2.826.0.1" in s
        assert "Descriptor file ID: README" in s
        assert "Descriptor file character set: ISO WHATEVER" in s
        assert "Changes staged for write(): DICOMDIR creation" not in s
        assert "addition" not in s
        assert "removal" not in s
        assert "Managed instances:" not in s

    def test_str(self, ct, dummy, tdir):
        """Test str(FileSet) with empty + additions."""
        fs = FileSet()
        fs.add(ct)
        fs.add(get_testdata_file("MR_small.dcm"))

        for p in list(Path(TINY_ALPHA_FILESET).parent.glob('**/*'))[::2]:
            if p.is_file() and p.name not in ['DICOMDIR', 'README']:
                fs.add(p)

        instance = fs._instances[-1]
        ds = dcmread(get_testdata_file("rtdose.dcm"))
        ds.PatientID = '12345678'
        ds.InstanceNumber = '1'
        ds.StudyInstanceUID = instance.StudyInstanceUID
        ds.SeriesInstanceUID = instance.SeriesInstanceUID
        fs.add(ds)

        ds = dcmread(get_testdata_file("rtplan.dcm"))
        ds.PatientID = '12345678'
        ds.InstanceNumber = '1'
        ds.StudyInstanceUID = instance.StudyInstanceUID
        ds.SeriesInstanceUID = instance.SeriesInstanceUID
        fs.add(ds)

        ds, opt = dummy
        ds.SOPClassUID = ColorPaletteStorage
        fs.add(ds)

        ref = (
            "DICOM File-set\n"
            "  Root directory: (no value available)\n"
            "  File-set ID: (no value available)\n"
            f"  File-set UID: {fs.UID}\n"
            "  Descriptor file ID: (no value available)\n"
            "  Descriptor file character set: (no value available)\n"
            "  Changes staged for write(): DICOMDIR creation, 30 additions\n"
            "\n"
            "  Managed instances:\n"
            "    PATIENT: PatientID='1CT1', "
            "PatientName='CompressedSamples^CT1'\n"
            "      STUDY: StudyDate=20040119, StudyTime=072730, "
            "StudyDescription='e+1'\n"
            "        SERIES: Modality=CT, SeriesNumber=1\n"
            "          IMAGE: 1 SOP Instance (1 addition)\n"
            "    PATIENT: PatientID='4MR1', "
            "PatientName='CompressedSamples^MR1'\n"
            "      STUDY: StudyDate=20040826, StudyTime=185059\n"
            "        SERIES: Modality=MR, SeriesNumber=1\n"
            "          IMAGE: 1 SOP Instance (1 addition)\n"
            "    PATIENT: PatientID='12345678', PatientName='Citizen^Jan'\n"
            "      STUDY: StudyDate=20200913, StudyTime=161900, "
            "StudyDescription='Testing File-set'\n"
            "        SERIES: Modality=CT, SeriesNumber=1\n"
            "          IMAGE: 25 SOP Instances (25 additions)\n"
            "          RT DOSE: 1 SOP Instance (1 addition)\n"
            "          RT PLAN: 1 SOP Instance (1 addition)\n"
            "    PALETTE: 1 SOP Instance (to be added)"
        )

        assert ref == str(fs)

        ds, paths = write_fs(fs, tdir.name)

        ref = (
            "  File-set ID: (no value available)\n"
            f"  File-set UID: {fs.UID}\n"
            "  Descriptor file ID: (no value available)\n"
            "  Descriptor file character set: (no value available)\n"
            "\n"
            "  Managed instances:\n"
            "    PATIENT: PatientID='1CT1', "
            "PatientName='CompressedSamples^CT1'\n"
            "      STUDY: StudyDate=20040119, StudyTime=072730, "
            "StudyDescription='e+1'\n"
            "        SERIES: Modality=CT, SeriesNumber=1\n"
            "          IMAGE: 1 SOP Instance\n"
            "    PATIENT: PatientID='4MR1', "
            "PatientName='CompressedSamples^MR1'\n"
            "      STUDY: StudyDate=20040826, StudyTime=185059\n"
            "        SERIES: Modality=MR, SeriesNumber=1\n"
            "          IMAGE: 1 SOP Instance\n"
            "    PATIENT: PatientID='12345678', PatientName='Citizen^Jan'\n"
            "      STUDY: StudyDate=20200913, StudyTime=161900, "
            "StudyDescription='Testing File-set'\n"
            "        SERIES: Modality=CT, SeriesNumber=1\n"
            "          IMAGE: 25 SOP Instances\n"
            "          RT DOSE: 1 SOP Instance\n"
            "          RT PLAN: 1 SOP Instance\n"
            "    PALETTE: 1 SOP Instance"
        )

        assert ref in str(fs)

        for instance in fs:
            fs.remove(instance)

        for p in list(Path(TINY_ALPHA_FILESET).parent.glob('**/*'))[1:40:2]:
            if p.is_file() and p.name not in ['DICOMDIR', 'README']:
                fs.add(p)

        ref = (
            "  File-set ID: (no value available)\n"
            f"  File-set UID: {fs.UID}\n"
            "  Descriptor file ID: (no value available)\n"
            "  Descriptor file character set: (no value available)\n"
            "  Changes staged for write(): DICOMDIR update, 18 additions, "
            "30 removals\n"
            "\n"
            "  Managed instances:\n"
            "    PATIENT: PatientID='1CT1', "
            "PatientName='CompressedSamples^CT1'\n"
            "      STUDY: StudyDate=20040119, StudyTime=072730, "
            "StudyDescription='e+1'\n"
            "        SERIES: Modality=CT, SeriesNumber=1\n"
            "          IMAGE: 0 SOP Instances (1 initial, 1 removal)\n"
            "    PATIENT: PatientID='4MR1', "
            "PatientName='CompressedSamples^MR1'\n"
            "      STUDY: StudyDate=20040826, StudyTime=185059\n"
            "        SERIES: Modality=MR, SeriesNumber=1\n"
            "          IMAGE: 0 SOP Instances (1 initial, 1 removal)\n"
            "    PATIENT: PatientID='12345678', PatientName='Citizen^Jan'\n"
            "      STUDY: StudyDate=20200913, StudyTime=161900, "
            "StudyDescription='Testing File-set'\n"
            "        SERIES: Modality=CT, SeriesNumber=1\n"
            "          IMAGE: 18 SOP Instances (25 initial, 18 additions, "
            "25 removals)\n"
            "          RT DOSE: 0 SOP Instances (1 initial, 1 removal)\n"
            "          RT PLAN: 0 SOP Instances (1 initial, 1 removal)\n"
            "    PALETTE: 1 SOP Instance (to be removed)"
        )

        assert ref in str(fs)

    def test_str_update_structure(self, dicomdir):
        """Test that the update structure comment appears."""
        fs = FileSet(dicomdir)
        assert (
            "Changes staged for write(): DICOMDIR update, directory "
            "structure update"
        ) in str(fs)


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestFileSet_Load:
    """Tests for a loaded File-set."""
    def test_write_dicomdir(self, dicomdir):
        """Test DICOMDIR writing"""
        fs = FileSet(dicomdir)
        out = DicomBytesIO()
        out.is_little_endian = True
        out.is_implicit_VR = False
        fs._write_dicomdir(out)
        out.seek(0)

        new = dcmread(out)
        assert dicomdir.DirectoryRecordSequence == new.DirectoryRecordSequence
        assert (
            396 == new.OffsetOfTheFirstDirectoryRecordOfTheRootDirectoryEntity
        )
        assert (
            3126 == new.OffsetOfTheLastDirectoryRecordOfTheRootDirectoryEntity
        )

    def test_write_new_path(self, dicomdir):
        """Test writing to a new path."""
        fs = FileSet(dicomdir)
        assert fs.path is not None
        msg = (
            r"The path for an existing File-set cannot be changed, use "
            r"'FileSet.copy\(\)' to write the File-set to a new location"
        )
        with pytest.raises(ValueError, match=msg):
            fs.write("MYNEWPATH")

    def test_bad_sop_class_raises(self, dicomdir):
        """Test loading using non-DICOMDIR."""
        dicomdir.file_meta.MediaStorageSOPClassUID = '1.2.3'
        msg = (
            r"Unable to load the File-set as the supplied dataset is "
            r"not a 'Media Storage Directory' instance"
        )
        with pytest.raises(ValueError, match=msg):
            fs = FileSet(dicomdir)

    def test_bad_filename_raises(self, dicomdir):
        """Test loading with a bad path."""
        dicomdir.filename = 'bad'
        msg = (
            r"Unable to load the File-set as the 'filename' attribute "
            r"for the DICOMDIR dataset is not a valid path: "
            r"bad"
        )
        with pytest.raises(FileNotFoundError, match=msg):
            FileSet(dicomdir)

    def test_bad_filename_type_raises(self, dicomdir):
        """Test loading with a bad DICOMDIR filename type."""
        dicomdir.filename = None
        msg = (
            r"Unable to load the File-set as the DICOMDIR dataset must "
            r"have a 'filename' attribute set to the path of the "
            r"DICOMDIR file"
        )
        with pytest.raises(TypeError, match=msg):
            FileSet(dicomdir)

    def test_find(self, dicomdir):
        """Tests for FileSet.find()."""
        fs = FileSet(dicomdir)
        assert 31 == len(fs.find())
        assert 7 == len(fs.find(PatientID='77654033'))
        assert 24 == len(fs.find(PatientID='98890234'))

        matches = fs.find(PatientID='98890234', StudyDate="20030505")
        assert 17 == len(matches)
        for ii in matches:
            assert isinstance(ii, FileInstance)

        sop_instances = [ii.SOPInstanceUID for ii in matches]
        assert 17 == len(list(set(sop_instances)))

    def test_find_load(self, private):
        """Test FileSet.find(load=True)."""
        fs = FileSet(private)
        msg = (
            r"None of the records in the DICOMDIR dataset contain all "
            r"the query elements, consider using the 'load' parameter "
            r"to expand the search to the corresponding SOP instances"
        )
        with pytest.warns(UserWarning, match=msg):
            results = fs.find(
                load=False, PhotometricInterpretation="MONOCHROME1"
            )
            assert not results

        results = fs.find(
            load=True, PhotometricInterpretation="MONOCHROME1"
        )
        assert 3 == len(results)

    def test_find_values(self, private):
        """Test searching the FileSet for element values."""
        fs = FileSet(private)
        expected = {
            "PatientID": ['77654033', '98890234'],
            "StudyDescription": [
                'XR C Spine Comp Min 4 Views',
                'CT, HEAD/BRAIN WO CONTRAST',
                '',
                'Carotids',
                'Brain',
                'Brain-MRA',
            ],
        }
        for k, v in expected.items():
            assert fs.find_values(k) == v
        assert fs.find_values(list(expected.keys())) == expected

    def test_find_values_load(self, private):
        """Test FileSet.find_values(load=True)."""
        fs = FileSet(private)
        search_element = "PhotometricInterpretation"
        msg = (
            r"None of the records in the DICOMDIR dataset contain "
            fr"\['{search_element}'\], consider using the 'load' parameter "
            r"to expand the search to the corresponding SOP instances"
        )
        with pytest.warns(UserWarning, match=msg):
            results = fs.find_values(search_element, load=False)
            assert not results

        assert fs.find_values(search_element, load=True) == [
            'MONOCHROME1', 'MONOCHROME2'
        ]

        with pytest.warns(UserWarning, match=msg):
            results = fs.find_values([search_element], load=False)
            assert not results[search_element]

        assert (
            fs.find_values([search_element], load=True)
        ) == {search_element: ['MONOCHROME1', 'MONOCHROME2']}

    def test_empty_file_id(self, dicomdir):
        """Test loading a record with an empty File ID."""
        item = dicomdir.DirectoryRecordSequence[5]
        item.ReferencedFileID = None
        uid = item.ReferencedSOPInstanceUIDInFile
        fs = FileSet(dicomdir)
        assert [] == fs.find(SOPInstanceUID=uid)
        assert 30 == len(fs)

    def test_bad_file_id(self, dicomdir):
        """Test loading a record with a bad File ID."""
        item = dicomdir.DirectoryRecordSequence[5]
        item.ReferencedFileID[-1] = "MISSING"
        uid = item.ReferencedSOPInstanceUIDInFile
        msg = (
            r"The referenced SOP Instance for the directory record at offset "
            r"1220 does not exist:"
        )
        with pytest.warns(UserWarning, match=msg):
            fs = FileSet(dicomdir)

        assert [] == fs.find(SOPInstanceUID=uid)
        assert 30 == len(fs)

    def test_load_orphans_raise(self, private):
        """Test loading orphaned records raises exception."""
        ds = private
        seq = ds.DirectoryRecordSequence
        uid = seq[3].ReferencedSOPInstanceUIDInFile
        seq[1].ReferencedSOPInstanceUIDInFile = uid
        seq[1].ReferencedTransferSyntaxUIDInFile = ExplicitVRLittleEndian
        seq[1].ReferencedSOPClassUID = ComputedRadiographyImageStorage
        seq[1].OffsetOfReferencedLowerLevelDirectoryEntity = 0
        seq[1].ReferencedFileID = seq[3].ReferencedFileID
        del seq[1].StudyInstanceUID
        fs = FileSet()
        msg = r"The DICOMDIR contains orphaned directory records"
        with pytest.raises(ValueError, match=msg):
            fs.load(ds, raise_orphans=True)

    def test_load_orphans_exclude(self, private):
        """Test loading and ignore orphaned records."""
        # The first study includes 3 series, each series with 1 image
        #   so we're orphaning 3 instances
        seq = private.DirectoryRecordSequence
        seq[1].OffsetOfReferencedLowerLevelDirectoryEntity = 0
        fs = FileSet()
        msg = (
            r"The DICOMDIR has 3 orphaned directory records that reference "
            r"an instance that will not be included in the File-set"
        )
        with pytest.warns(UserWarning, match=msg):
            fs.load(private, include_orphans=False)

        assert 29 == len(fs)
        assert [] == fs.find(StudyInstanceUID=seq[1].StudyInstanceUID)
        assert [] == fs.find(SeriesInstanceUID=seq[2].SeriesInstanceUID)
        for ii in range(3, 9, 2):
            assert "IMAGE" == seq[ii].DirectoryRecordType
            assert [] == fs.find(
                SOPInstanceUID=seq[ii].ReferencedSOPInstanceUIDInFile
            )

    def test_load_orphans_no_file_id(self, private):
        """Test loading orphaned records without a valid File ID."""
        # The first study includes 3 series, each series with 1 image
        #   so we're orphaning 3 instances, 1 with an invalid File ID
        seq = private.DirectoryRecordSequence
        seq[1].OffsetOfReferencedLowerLevelDirectoryEntity = 0
        seq[5].ReferencedFileID = None
        fs = FileSet()
        fs.load(private)

        assert 31 == len(fs)
        assert "IMAGE" == seq[5].DirectoryRecordType
        assert [] == fs.find(
            SOPInstanceUID=seq[5].ReferencedSOPInstanceUIDInFile
        )
        assert 1 == len(
            fs.find(SOPInstanceUID=seq[3].ReferencedSOPInstanceUIDInFile)
        )
        assert 1 == len(
            fs.find(SOPInstanceUID=seq[7].ReferencedSOPInstanceUIDInFile)
        )

    def test_load_orphans_private(self, private):
        """Test loading an orphaned PRIVATE record."""
        seq = private.DirectoryRecordSequence
        seq[-2].OffsetOfReferencedLowerLevelDirectoryEntity = 0
        fs = FileSet()
        fs.load(private)
        assert 32 == len(fs)
        assert 1 == len(
            fs.find(SOPInstanceUID=seq[-1].ReferencedSOPInstanceUIDInFile)
        )

    def test_load_dicomdir_big_endian(self, dicomdir, tdir):
        """Test loading a big endian DICOMDIR"""
        with pytest.warns(UserWarning):
            ds = dcmread(BIGENDIAN_TEST_FILE)
        msg = (
            r"The DICOMDIR dataset uses an invalid transfer syntax "
            r"'Explicit VR Big Endian' and will be updated to use 'Explicit "
            r"VR Little Endian'"
        )
        with pytest.warns(UserWarning, match=msg):
            fs = FileSet(ds)

        # Should be written out as explicit little
        fs, ds, paths = copy_fs(fs, tdir.name)
        assert ExplicitVRLittleEndian == ds.file_meta.TransferSyntaxUID

        ref = FileSet(dicomdir)
        assert len(ref) == len(fs)
        for ii, rr in zip(fs, ref):
            assert ii.SOPInstanceUID == rr.SOPInstanceUID

    def test_load_dicomdir_implicit(self, dicomdir, tdir):
        """Test loading an implicit VR DICOMDIR."""
        with pytest.warns(UserWarning):
            ds = dcmread(IMPLICIT_TEST_FILE)
        msg = (
            r"The DICOMDIR dataset uses an invalid transfer syntax "
            r"'Implicit VR Little Endian' and will be updated to use "
            r"'Explicit VR Little Endian'"
        )
        with pytest.warns(UserWarning, match=msg):
            fs = FileSet(ds)

        # Should be written out as explicit little
        fs, ds, paths = copy_fs(fs, tdir.name)
        assert ExplicitVRLittleEndian == ds.file_meta.TransferSyntaxUID

        ref = FileSet(dicomdir)
        assert len(ref) == len(fs)
        for ii, rr in zip(fs, ref):
            assert ii.SOPInstanceUID == rr.SOPInstanceUID

    def test_load_dicomdir_reordered(self, dicomdir):
        """Test loading DICOMDIR-reordered"""
        ds = dcmread(get_testdata_file('DICOMDIR-reordered'))
        fs = FileSet(ds)
        ref = FileSet(dicomdir)
        assert len(ref) == len(fs)
        for ii, rr in zip(fs, ref):
            assert ii.SOPInstanceUID == rr.SOPInstanceUID

    def test_load_dicomdir_no_offset(self, dicomdir):
        """Test loading DICOMDIR-nooffset"""
        ds = dcmread(get_testdata_file('DICOMDIR-nooffset'))
        fs = FileSet(ds)
        ref = FileSet(dicomdir)
        assert len(ref) == len(fs)
        for ii, rr in zip(fs, ref):
            assert ii.SOPInstanceUID == rr.SOPInstanceUID

    def test_load_dicomdir_no_uid(self, dicomdir):
        """Test loading DICOMDIR with no UID"""
        del dicomdir.file_meta.MediaStorageSOPInstanceUID
        fs = FileSet(dicomdir)
        assert fs.UID.is_valid
        assert fs.UID == dicomdir.file_meta.MediaStorageSOPInstanceUID


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestFileSet_Modify:
    """Tests for a modified File-set."""
    def setup(self):
        self.fn = FileSet.__len__

    def teardown(self):
        FileSet.__len__ = self.fn

    def test_write_dicomdir_fs_changes(self, dicomdir_copy):
        """Test FileSet.write() with only ^ changes."""
        t, ds = dicomdir_copy
        fs = FileSet(ds)
        ds, paths = write_fs(fs)
        assert not fs._stage['^']
        fs.descriptor_file_id = ["1", "2", "3"]
        assert fs._stage['^']
        assert not fs._stage['~']
        assert not fs._stage['+']
        assert not fs._stage['-']
        fs.write()
        assert not fs._stage['^']
        ds = dcmread(Path(fs.path) / "DICOMDIR")
        assert ["1", "2", "3"] == ds.FileSetDescriptorFileID

    def test_write_dicomdir_use_existing(self, dicomdir_copy):
        """Test FileSet.write() with use_existing."""
        tdir, ds = dicomdir_copy
        assert "FileSetDescriptorFileID" not in ds
        fs = FileSet(ds)
        assert fs._stage['~']
        assert not fs._stage['+']
        assert not fs._stage['-']
        fs.descriptor_file_id = ["1", "2", "3"]
        fs.write(use_existing=True)
        t = Path(tdir.name)
        # File IDs haven't changed
        assert [] == list(t.glob("PT000000"))
        assert 1 == len(list(t.glob("98892003")))
        ds = dcmread(t / "DICOMDIR")
        assert ["1", "2", "3"] == ds.FileSetDescriptorFileID

    def test_write_dicomdir_use_existing_raises(self, dicomdir_copy, ct):
        """Test FileSet.write() with use_existing raises with +/- changes."""
        tdir, ds = dicomdir_copy
        assert "FileSetDescriptorFileID" not in ds
        fs = FileSet(ds)
        fs.add(ct)
        assert fs._stage['~']
        assert fs._stage['+']
        assert not fs._stage['-']
        fs.descriptor_file_id = ["1", "2", "3"]
        msg = (
            r"'Fileset.write\(\)' called with 'use_existing' but additions to "
            r"the File-set's managed instances are staged"
        )
        with pytest.raises(ValueError, match=msg):
            fs.write(use_existing=True)

    def test_remove_addition_bad_path(self, dicomdir, ct):
        """Test removing a missing file from the File-set's stage."""
        fs = FileSet(dicomdir)
        fs.add(ct)
        instance = fs.find(SOPInstanceUID=ct.SOPInstanceUID)[0]
        assert instance.SOPInstanceUID in fs._stage['+']
        assert instance in fs

        path = instance._stage_path
        instance._stage_path = Path(fs.path) / "BADFILE"
        fs.remove(instance)
        assert instance not in fs
        assert instance.SOPInstanceUID not in fs._stage['-']
        assert instance.SOPInstanceUID not in fs._stage['+']
        # File should still exist
        assert path.exists()

    def test_write_file_id(self, tiny):
        """Test that the File IDs character sets switch correctly."""
        tdir, ds = temporary_fs(tiny)

        def my_len(self):
            return 10**6 + 1

        FileSet.__len__ = my_len
        fs = FileSet(ds)
        assert 10**6 + 1 == len(fs)
        ds, paths = write_fs(fs)
        instance = fs._instances[-1]
        # Was written with alphanumeric File IDs
        assert "IM00001D" in instance.path

        def my_len(self):
            return 36**6 + 1

        FileSet.__len__ = my_len
        fs = FileSet(ds)
        assert 36**6 + 1 == len(fs)
        msg = (
            r"pydicom doesn't support writing File-sets with more than "
            r"2176782336 managed instances"
        )
        with pytest.raises(NotImplementedError, match=msg):
            fs.write()

    def test_write_missing_removal(self, tiny):
        """Test that missing files are ignored when removing during write."""
        tdir, ds = temporary_fs(tiny)
        fs = FileSet(ds)
        instance = fs._instances[0]
        path = Path(instance.path)
        fs.remove(instance)
        assert path.exists()
        path.unlink()
        assert not path.exists()
        ds, paths = write_fs(fs)
        assert [] == fs.find(SOPInstanceUID=instance.SOPInstanceUID)
        assert 49 == len(fs)

    def test_write_removal_addition_collision(self, tiny):
        """Test re-adding files staged for removal that also collide."""
        # The colliding files are IM000010 to IM000019 which get
        #   overwritten by IM00000A to IM00000J
        tdir, ds = temporary_fs(tiny)
        fs = FileSet(ds)
        # IM000010 to IM000013
        instances = fs._instances[36:40]
        assert "IM000010" == Path(instances[0].path).name
        assert "IM000011" == Path(instances[1].path).name
        assert "IM000012" == Path(instances[2].path).name
        assert "IM000013" == Path(instances[3].path).name
        fs.remove(instances)
        assert 46 == len(fs)
        for instance in instances:
            path = Path(instance.path)
            fs.add(path)

        ds, paths = write_fs(fs)
        assert 50 == len(paths)
        original = FileSet(tiny)
        assert len(original) == len(fs)
        for ref, ii in zip(original, fs):
            assert ref.path != ii.path
            assert ref.SOPInstanceUID == ii.SOPInstanceUID
            rs = ref.load()
            ts = ii.load()
            assert Dataset(rs) == ts

    def test_write_implicit(self, dicomdir, dicomdir_copy, tdir):
        """Test writing the DICOMDIR using Implicit VR"""
        tdir, ds = dicomdir_copy
        fs = FileSet(ds)
        with pytest.warns(UserWarning):
            fs.write(force_implicit=True, use_existing=True)
        with pytest.warns(UserWarning):
            ds = dcmread(Path(fs.path) / "DICOMDIR")
        assert ImplicitVRLittleEndian == ds.file_meta.TransferSyntaxUID

        with pytest.warns(UserWarning):
            ref_ds = dcmread(IMPLICIT_TEST_FILE)
        assert Dataset(ref_ds) == ds

        ref = FileSet(dicomdir)
        assert len(ref) == len(fs)
        for ii, rr in zip(fs, ref):
            assert ii.SOPInstanceUID == rr.SOPInstanceUID

    def test_write_use_existing(self, dicomdir_copy):
        """Test write() with use_existing."""
        tdir, ds = dicomdir_copy
        assert 52 == len(ds.DirectoryRecordSequence)
        fs = FileSet(ds)
        orig_paths = [p for p in fs._path.glob('**/*') if p.is_file()]
        instance = fs._instances[0]
        assert Path(instance.path) in orig_paths
        fs.remove(instance)
        orig_file_ids = [ii.ReferencedFileID for ii in fs]
        fs.write(use_existing=True)
        assert 50 == len(fs._ds.DirectoryRecordSequence)
        paths = [p for p in fs._path.glob('**/*') if p.is_file()]
        assert orig_file_ids == [ii.ReferencedFileID for ii in fs]
        assert Path(instance.path) not in paths
        assert sorted(orig_paths)[1:] == sorted(paths)
        assert {} == fs._stage['-']
        assert not fs._stage['^']
        assert {} == fs._stage['+']
        assert fs._stage['~']

    def test_write_use_existing_raises(self, dicomdir, ct):
        """Test write() with use_existing raises if additions."""
        fs = FileSet(dicomdir)
        fs.remove(fs._instances[0])
        fs.add(ct)
        msg = (
            r"'Fileset.write\(\)' called with 'use_existing' but additions "
            r"to the File-set's managed instances are staged"
        )
        with pytest.raises(ValueError, match=msg):
            fs.write(use_existing=True)

    def test_add_instance_missing(self, tdir):
        """Test adding an instance missing a required value."""
        fs = FileSet()
        ds = dcmread(get_testdata_file("rtdose.dcm"))
        del ds.InstanceNumber
        msg = (
            r"Unable to use the default 'RT DOSE' record creator "
            r"as the instance is missing a required element or value. Either "
            r"update the instance, define your own record creation function "
            r"or use 'FileSet.add_custom\(\)' instead"
        )
        with pytest.raises(ValueError, match=msg):
            fs.add(ds)

    def test_add_instance_missing_required_value(self, tdir):
        """Test adding an instance missing a required value."""
        fs = FileSet()
        ds = dcmread(get_testdata_file("rtdose.dcm"))
        ds.InstanceNumber = None
        msg = (
            r"Unable to use the default 'RT DOSE' record creator "
            r"as the instance is missing a required element or value. Either "
            r"update the instance, define your own record creation function "
            r"or use 'FileSet.add_custom\(\)' instead"
        )
        with pytest.raises(ValueError, match=msg):
            fs.add(ds)

    def test_add_rt_dose(self, tdir, disable_value_validation):
        """Test adding an RT Dose instance."""
        fs = FileSet()
        ds = dcmread(get_testdata_file("rtdose.dcm"))
        ds.SpecificCharacterSet = "ISO_IR 100"
        ds.InstanceNumber = 1  # Type 2, but Type 1 in the RT DOSE record
        fs.add(ds)
        assert 1 == len(fs.find(SOPInstanceUID=ds.SOPInstanceUID))
        dicomdir, paths = write_fs(fs, tdir.name)
        assert 1 == len(paths)
        seq = dicomdir.DirectoryRecordSequence
        assert "PATIENT" == seq[0].DirectoryRecordType
        assert "STUDY" == seq[1].DirectoryRecordType
        assert "SERIES" == seq[2].DirectoryRecordType
        assert "RT DOSE" == seq[3].DirectoryRecordType
        assert Dataset(ds) == dcmread(paths[0])

    def test_add_rt_structure_set(self, tdir):
        """Test adding an RT Structure Set instance."""
        ds = dcmread(get_testdata_file("rtstruct.dcm"), force=True)
        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian
        ds.StudyDate = "20201001"
        ds.StudyTime = "120000"

        fs = FileSet()
        fs.add(ds)
        assert 1 == len(fs.find(SOPInstanceUID=ds.SOPInstanceUID))
        dicomdir, paths = write_fs(fs, tdir.name)
        assert 1 == len(paths)
        seq = dicomdir.DirectoryRecordSequence
        assert "PATIENT" == seq[0].DirectoryRecordType
        assert "STUDY" == seq[1].DirectoryRecordType
        assert "SERIES" == seq[2].DirectoryRecordType
        assert "RT STRUCTURE SET" == seq[3].DirectoryRecordType
        assert Dataset(ds) == dcmread(paths[0])

    def test_add_rt_plan(self, tdir):
        """Test adding an RT Plan instance."""
        ds = dcmread(get_testdata_file("rtplan.dcm"), force=True)
        ds.InstanceNumber = 1

        fs = FileSet()
        fs.add(ds)
        assert 1 == len(fs.find(SOPInstanceUID=ds.SOPInstanceUID))
        dicomdir, paths = write_fs(fs, tdir.name)
        assert 1 == len(paths)
        seq = dicomdir.DirectoryRecordSequence
        assert "PATIENT" == seq[0].DirectoryRecordType
        assert "STUDY" == seq[1].DirectoryRecordType
        assert "SERIES" == seq[2].DirectoryRecordType
        assert "RT PLAN" == seq[3].DirectoryRecordType
        assert Dataset(ds) == dcmread(paths[0])

    def test_remove_list(self, dicomdir, tdir):
        """Test remove using a list of instances."""
        fs = FileSet(dicomdir)
        instances = fs.find(StudyDescription='XR C Spine Comp Min 4 Views')
        fs.remove(instances)
        assert 28 == len(fs)

    def test_add_bad_one_level(self, dummy):
        """Test adding a bad one-level dataset raises."""
        ds, opt = dummy
        ds.SOPClassUID = HangingProtocolStorage
        del ds.HangingProtocolCreator
        fs = FileSet()
        msg = (
            r"Unable to use the default 'HANGING PROTOCOL' record creator "
            r"as the instance is missing a required element or value. Either "
            r"update the instance, define your own record creation function "
            r"or use 'FileSet.add_custom\(\)' instead"
        )
        with pytest.raises(ValueError, match=msg):
            fs.add(ds)

    def test_write_undefined_length(self, dicomdir_copy):
        """Test writing with undefined length items"""
        t, ds = dicomdir_copy
        elem = ds["DirectoryRecordSequence"]
        ds["DirectoryRecordSequence"].is_undefined_length = True
        for item in ds.DirectoryRecordSequence:
            item.is_undefined_length_sequence_item = True

        fs = FileSet(ds)
        fs.write(use_existing=True)

        ds = dcmread(Path(t.name) / "DICOMDIR")
        item = ds.DirectoryRecordSequence[-1]
        assert item.ReferencedFileID == ['98892003', 'MR700', '4648']


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestFileSet_Copy:
    """Tests for copying a File-set."""
    def setup(self):
        self.orig = FileSet.__len__

    def teardown(self):
        FileSet.__len__ = self.orig

    def test_copy(self, dicomdir, tdir):
        """Test FileSet.copy()"""
        orig_root = Path(dicomdir.filename).parent
        fs = FileSet(dicomdir)

        fs.ID = "NEW ID"
        uid = fs.UID = generate_uid()
        fs.descriptor_file_id = "README"
        fs.descriptor_character_set = "ISO_IR 100"
        cp, ds, paths = copy_fs(fs, tdir.name)
        assert 31 == len(paths)
        assert (
            ('PT000000', 'ST000000', 'SE000000', 'IM000000')
        ) == paths[0].parts[-4:]
        assert (
            ('PT000001', 'ST000003', 'SE000002', 'IM000006')
        ) == paths[-1].parts[-4:]

        # Check existing File-set remains the same
        assert "NEW ID" == fs.ID
        assert dicomdir.file_meta.TransferSyntaxUID == ExplicitVRLittleEndian
        assert uid == fs.UID
        assert dicomdir.file_meta.MediaStorageSOPInstanceUID == fs.UID
        assert "README" == fs.descriptor_file_id
        assert "ISO_IR 100" == fs.descriptor_character_set
        assert not bool(fs._stage['+'])
        assert not bool(fs._stage['-'])
        assert fs.is_staged
        paths = list(orig_root.glob('98892001/**/*'))
        paths += list(orig_root.glob('98892003/**/*'))
        paths += list(orig_root.glob('77654033/**/*'))
        paths = [p for p in paths if p.is_file()]

        # Test new File-set
        assert len(fs) == len(cp)
        for ref, instance in zip(fs, cp):
            assert ref.SOPInstanceUID == instance.SOPInstanceUID

        assert ds.file_meta.TransferSyntaxUID == ExplicitVRLittleEndian
        assert not ds.is_implicit_VR
        assert ds.is_little_endian
        assert not cp.is_staged
        assert "NEW ID" == cp.ID
        assert uid == cp.UID
        assert ds.file_meta.MediaStorageSOPInstanceUID == cp.UID
        assert "README" == cp.descriptor_file_id
        assert "ISO_IR 100" == cp.descriptor_character_set

    def test_copy_raises(self, dicomdir, tdir):
        """Test exceptions raised by FileSet.copy()."""
        fs = FileSet(dicomdir)
        msg = r"Cannot copy the File-set as the 'path' is unchanged"
        with pytest.raises(ValueError, match=msg):
            fs.copy(fs.path)

    def test_copy_implicit(self, dicomdir, tdir):
        """Test copy() with implicit VR."""
        assert not dicomdir.is_implicit_VR
        fs = FileSet(dicomdir)
        with pytest.warns(UserWarning):
            cp, ds, paths = copy_fs(fs, tdir.name, as_implicit=True)

        # Check existing File-set remains the same
        assert "PYDICOM_TEST" == fs.ID
        assert dicomdir.file_meta.TransferSyntaxUID == ExplicitVRLittleEndian
        assert dicomdir.file_meta.MediaStorageSOPInstanceUID == fs.UID
        assert fs.descriptor_file_id is None
        assert fs.descriptor_character_set is None
        assert not bool(fs._stage['+'])
        assert not bool(fs._stage['-'])

        assert 31 == len(paths)

        assert len(fs) == len(cp)
        for ref, instance in zip(fs, cp):
            assert ref.SOPInstanceUID == instance.SOPInstanceUID

        assert ds.file_meta.TransferSyntaxUID == ImplicitVRLittleEndian
        assert ds.is_implicit_VR
        assert ds.is_little_endian

    def test_file_id(self, tiny, tdir):
        """Test that the File IDs character sets switch correctly."""
        def my_len(self):
            return 10**6 + 1

        FileSet.__len__ = my_len
        fs = FileSet(tiny)
        assert 10**6 + 1 == len(fs)
        fs, ds, paths = copy_fs(fs, tdir.name)
        instance = fs._instances[-1]
        # Was written with alphanumeric File IDs
        assert "IM00001D" in instance.path

        def my_len(self):
            return 36**6 + 1

        FileSet.__len__ = my_len
        fs = FileSet(tiny)
        assert 36**6 + 1 == len(fs)
        msg = (
            r"pydicom doesn't support writing File-sets with more than "
            r"2176782336 managed instances"
        )
        with pytest.raises(NotImplementedError, match=msg):
            fs.copy(tdir.name)

    def test_additions(self, tiny, ct, tdir):
        """Test that additions get added when copying."""
        fs = FileSet(tiny)
        assert [] == fs.find(PatientID="1CT1")
        fs.add(ct)
        cp, ds, paths = copy_fs(fs, tdir.name)
        assert 51 == len(paths)
        assert (
            ('PT000001', 'ST000000', 'SE000000', 'IM000000')
        ) == paths[-1].parts[-4:]
        assert 51 == len(cp)
        assert not cp.is_staged
        instances = cp.find(PatientID="1CT1")
        assert 1 == len(instances)
        assert ct.SOPInstanceUID == instances[0].SOPInstanceUID

        # Test addition is still staged in original fs
        assert fs.is_staged
        assert 51 == len(fs)
        assert 1 == len(fs._stage['+'])
        assert ct.SOPInstanceUID in fs._stage['+']

    def test_removals(self, tiny, tdir):
        """Test that additions get added when copying."""
        fs = FileSet(tiny)
        instance = fs._instances[0]
        uid = instance.SOPInstanceUID
        instances = fs.find(SOPInstanceUID=uid)
        assert 1 == len(instances)
        fs.remove(instance)
        assert fs.is_staged

        cp, ds, paths = copy_fs(fs, tdir.name)
        assert 49 == len(paths)
        assert (
            ('PT000000', 'ST000000', 'SE000000', 'IM000048')
        ) == paths[-1].parts[-4:]
        assert not cp.is_staged
        names = [p.name for p in paths]
        assert 49 == len(names)
        assert "IM000000" in names
        assert "IM000048" in names
        assert "IM000049" not in names
        assert [] == cp.find(SOPInstanceUID=uid)

        # Test removal is still staged in original fs
        assert fs.is_staged
        assert 1 == len(fs._stage['-'])
        assert uid in fs._stage['-']

    def test_additions_removals(self, tiny, ct, tdir):
        """Test copying with additions and removals."""
        mr = dcmread(get_testdata_file("MR_small.dcm"))
        fs = FileSet(tiny)
        assert [] == fs.find(PatientID=ct.PatientID)
        assert [] == fs.find(PatientID=mr.PatientID)
        fs.add(ct)
        fs.add(mr)

        instances = fs._instances[:5]
        for instance in instances:
            matches = fs.find(SOPInstanceUID=instance.SOPInstanceUID)
            assert 1 == len(matches)
            fs.remove(instance)

        assert fs.is_staged
        cp, ds, paths = copy_fs(fs, tdir.name)

        # Test written instances
        parts = [p.parts for p in paths]
        assert 47 == len(parts)
        assert 'IM000000' == parts[0][-1]
        assert 'IM000044' == parts[44][-1]
        for ii in range(45):
            assert ('PT000000', 'ST000000', 'SE000000') == parts[ii][-4:-1]

        assert (
            ('PT000001', 'ST000000', 'SE000000', 'IM000000') == parts[45][-4:]
        )
        assert (
            ('PT000002', 'ST000000', 'SE000000', 'IM000000') == parts[46][-4:]
        )

        # Test copied fileset
        assert not cp.is_staged
        assert 1 == len(cp.find(SOPInstanceUID=ct.SOPInstanceUID))
        assert 1 == len(cp.find(SOPInstanceUID=mr.SOPInstanceUID))
        for instance in instances:
            matches = cp.find(SOPInstanceUID=instance.SOPInstanceUID)
            assert 0 == len(matches)
            assert instance.SOPInstanceUID not in cp._stage['-']

        # Test original fileset
        assert fs.is_staged
        for instance in instances:
            assert instance.SOPInstanceUID in fs._stage['-']
        assert 2 == len(fs._stage['+'])
        assert 1 == len(fs.find(SOPInstanceUID=ct.SOPInstanceUID))
        assert 1 == len(fs.find(SOPInstanceUID=mr.SOPInstanceUID))


# record type
REFERENCE_1LEVEL = [
    ("HANGING PROTOCOL", HangingProtocolStorage),
    ("IMPLANT", GenericImplantTemplateStorage),
    ("IMPLANT ASSY", ImplantAssemblyTemplateStorage),
    ("IMPLANT GROUP", ImplantTemplateGroupStorage),
    ("PALETTE", ColorPaletteStorage),
]
# PATIENT -> STUDY -> SERIES -> record type
REFERENCE_4LEVEL = [
    # Record type, SOP Class, Modality, Optional element to include
    ("IMAGE", CTImageStorage, "CT", None),
    ("RT DOSE", RTDoseStorage, "RTDOSE", None),
    ("RT STRUCTURE SET", RTStructureSetStorage, "RTSTRUCT", None),
    ("RT PLAN", RTPlanStorage, "RTPLAN", "RTPlanLabel"),
    ("RT TREAT RECORD", RTBeamsTreatmentRecordStorage, "RTRECORD", None),
    ("PRESENTATION", GrayscaleSoftcopyPresentationStateStorage, "PR", None),
    ("WAVEFORM", TwelveLeadECGWaveformStorage, "ECG", None),
    ("SR DOCUMENT", BasicTextSRStorage, "SR", None),
    ("KEY OBJECT DOC", KeyObjectSelectionDocumentStorage, "KO", None),
    ("SPECTROSCOPY", MRSpectroscopyStorage, "MS", None),
    ("RAW DATA", RawDataStorage, "OT", None),
    ("REGISTRATION", SpatialRegistrationStorage, "REG", None),
    ("FIDUCIAL", SpatialFiducialsStorage, "FID", None),
    ("ENCAP DOC", EncapsulatedPDFStorage, "DOC", "EncapsulatedDocument"),
    ("VALUE MAP", RealWorldValueMappingStorage, "RWV", None),
    ("STEREOMETRIC", StereometricRelationshipStorage, "SMR", None),
    ("PLAN", RTBeamsDeliveryInstructionStorage, "PLAN", None),
    ("MEASUREMENT", LensometryMeasurementsStorage, "LEN", None),
    ("SURFACE", SurfaceSegmentationStorage, "LS", None),
    ("SURFACE SCAN", SurfaceScanMeshStorage, "LS", None),
    ("TRACT", TractographyResultsStorage, "NONE", None),
    ("ASSESSMENT", ContentAssessmentResultsStorage, "ASMT", None),
    ("RADIOTHERAPY", CArmPhotonElectronRadiationStorage, "RTRAD", None),
]


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
@pytest.mark.parametrize("rtype, sop", REFERENCE_1LEVEL)
def test_one_level_record(rtype, sop, dummy, tdir):
    """Test adding instances that require a single level hierarchy."""
    ds, opt = dummy
    ds.SOPClassUID = sop

    fs = FileSet()
    fs.add(ds)
    assert 1 == len(fs.find(SOPInstanceUID=ds.SOPInstanceUID))
    dicomdir, paths = write_fs(fs, tdir.name)
    assert 1 == len(paths)
    [leaf] = dicomdir.DirectoryRecordSequence
    assert rtype == leaf.DirectoryRecordType
    assert sop == leaf.ReferencedSOPClassUIDInFile
    assert ds.SOPInstanceUID == leaf.ReferencedSOPInstanceUIDInFile
    assert ds.file_meta.TransferSyntaxUID == (
        leaf.ReferencedTransferSyntaxUIDInFile
    )
    file_id = list(paths[0].relative_to(fs.path).parts)
    assert file_id == [leaf.ReferencedFileID]
    assert Dataset(ds) == dcmread(paths[0])

    # Test the 1C elements
    ds.update(opt)
    fs = FileSet()
    fs.add(ds)


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
@pytest.mark.parametrize("rtype, sop, modality, kw", REFERENCE_4LEVEL)
def test_four_level_record(rtype, sop, modality, kw, dummy, tdir):
    """Test adding instances that require the 4-level hierarchy."""
    ds, opt = dummy
    ds.SOPClassUID = sop
    ds.Modality = modality
    if kw == "RTPlanLabel":
        setattr(ds, kw, "Value")
    elif kw == "EncapsulatedDocument":
        setattr(ds, kw, b'\x00\x01')

    fs = FileSet()
    fs.add(ds)
    assert 1 == len(fs.find(SOPInstanceUID=ds.SOPInstanceUID))
    dicomdir, paths = write_fs(fs, tdir.name)
    assert 1 == len(paths)
    [pt, st, se, leaf] = dicomdir.DirectoryRecordSequence
    assert "PATIENT" == pt.DirectoryRecordType
    assert ds.PatientID == pt.PatientID
    assert ds.PatientName == pt.PatientName
    assert "STUDY" == st.DirectoryRecordType
    assert ds.StudyDate == st.StudyDate
    assert ds.StudyTime == st.StudyTime
    assert ds.StudyInstanceUID == st.StudyInstanceUID
    assert "SERIES" == se.DirectoryRecordType
    assert modality == se.Modality
    assert rtype == leaf.DirectoryRecordType
    assert sop == leaf.ReferencedSOPClassUIDInFile
    assert ds.SOPInstanceUID == leaf.ReferencedSOPInstanceUIDInFile
    assert ds.file_meta.TransferSyntaxUID == (
        leaf.ReferencedTransferSyntaxUIDInFile
    )
    file_id = list(paths[0].relative_to(fs.path).parts)
    assert file_id == leaf.ReferencedFileID
    assert Dataset(ds) == dcmread(paths[0])

    # Test the 1C elements
    ds.update(opt)
    fs = FileSet()
    fs.add(ds)

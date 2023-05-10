# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Test for dicomdir.py"""

import pytest

from pydicom.data import get_testdata_file
from pydicom.dicomdir import DicomDir
from pydicom.errors import InvalidDicomError
from pydicom import config, dcmread

TEST_FILE = get_testdata_file('DICOMDIR')
IMPLICIT_TEST_FILE = get_testdata_file('DICOMDIR-implicit')
BIGENDIAN_TEST_FILE = get_testdata_file('DICOMDIR-bigEnd')

TEST_FILES = (
    get_testdata_file('DICOMDIR'),
    get_testdata_file('DICOMDIR-reordered'),
    get_testdata_file('DICOMDIR-nooffset')
)


@pytest.mark.filterwarnings("ignore:The 'DicomDir'")
class TestDicomDir:
    """Test dicomdir.DicomDir class"""

    @pytest.mark.parametrize("testfile", TEST_FILES)
    def test_read_file(self, testfile):
        """Test creation of DicomDir instance using filereader.read_file"""
        ds = dcmread(testfile)
        assert isinstance(ds, DicomDir)

    def test_invalid_sop_file_meta(self):
        """Test exception raised if SOP Class is not Media Storage Directory"""
        ds = dcmread(get_testdata_file('CT_small.dcm'))
        msg = r"SOP Class is not Media Storage Directory \(DICOMDIR\)"
        with pytest.raises(InvalidDicomError, match=msg):
            DicomDir("some_name", ds, b'\x00' * 128, ds.file_meta, True, True)

    def test_invalid_sop_no_file_meta(self, allow_reading_invalid_values):
        """Test exception raised if invalid sop class but no file_meta"""
        ds = dcmread(get_testdata_file('CT_small.dcm'))
        with pytest.raises(AttributeError,
                           match="'DicomDir' object has no attribute "
                                 "'DirectoryRecordSequence'"):
            with pytest.warns(UserWarning, match=r"Invalid transfer syntax"):
                DicomDir("some_name", ds, b'\x00' * 128, None, True, True)

    @pytest.mark.parametrize("testfile", TEST_FILES)
    def test_parse_records(self, testfile):
        """Test DicomDir.parse_records"""
        ds = dcmread(testfile)
        assert hasattr(ds, 'patient_records')
        # There are two top level PATIENT records
        assert len(ds.patient_records) == 2
        assert ds.patient_records[0].PatientName == 'Doe^Archibald'
        assert ds.patient_records[1].PatientName == 'Doe^Peter'

    def test_invalid_transfer_syntax(self, allow_reading_invalid_values):
        with pytest.warns(UserWarning, match='Invalid transfer syntax*'):
            dcmread(IMPLICIT_TEST_FILE)
        with pytest.warns(UserWarning, match='Invalid transfer syntax*'):
            dcmread(BIGENDIAN_TEST_FILE)

    def test_empty(self):
        """Test that an empty DICOMDIR can be read."""
        ds = dcmread(get_testdata_file('DICOMDIR-empty.dcm'))
        assert [] == ds.DirectoryRecordSequence

    def test_invalid_transfer_syntax_strict_mode(self, enforce_valid_values):
        with pytest.raises(InvalidDicomError,
                           match='Invalid transfer syntax*'):
            dcmread(IMPLICIT_TEST_FILE)
        with pytest.raises(InvalidDicomError,
                           match='Invalid transfer syntax*'):
            dcmread(BIGENDIAN_TEST_FILE)


def test_deprecation_warning():
    msg = (
        r"The 'DicomDir' class is deprecated and will be removed in v3.0, "
        r"after which 'dcmread\(\)' will return a normal 'FileDataset' "
        r"instance for 'Media Storage Directory' SOP Instances."
    )
    with pytest.warns(DeprecationWarning, match=msg):
        ds = dcmread(TEST_FILE)

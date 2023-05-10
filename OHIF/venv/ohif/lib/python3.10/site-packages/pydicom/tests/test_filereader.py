# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
# -*- coding: utf-8 -*-
"""Unit tests for the pydicom.filereader module."""

import gzip
import io
from io import BytesIO
import os
import shutil
from pathlib import Path
from struct import unpack
import sys
import tempfile

import pytest

import pydicom.config
from pydicom import config
from pydicom.dataset import Dataset, FileDataset, FileMetaDataset
from pydicom.data import get_testdata_file
from pydicom.datadict import add_dict_entries
from pydicom.filereader import (
    dcmread, read_dataset, read_dicomdir, data_element_generator
)
from pydicom.dataelem import DataElement, DataElement_from_raw
from pydicom.errors import InvalidDicomError
from pydicom.filebase import DicomBytesIO
from pydicom.multival import MultiValue
from pydicom.sequence import Sequence
from pydicom.tag import Tag, TupleTag
from pydicom.uid import ImplicitVRLittleEndian
import pydicom.valuerep
from pydicom import values


from pydicom.pixel_data_handlers import gdcm_handler

have_gdcm_handler = gdcm_handler.is_available()

have_numpy = pydicom.config.have_numpy
if have_numpy:
    import numpy  # NOQA

try:
    import jpeg_ls
except ImportError:
    jpeg_ls = None

try:
    from PIL import Image as PILImg
except ImportError:
    # If that failed, try the alternate import syntax for PIL.
    try:
        import Image as PILImg
    except ImportError:
        # Neither worked, so it's likely not installed.
        PILImg = None

have_jpeg_ls = jpeg_ls is not None
have_pillow = PILImg is not None

empty_number_tags_name = get_testdata_file(
    "reportsi_with_empty_number_tags.dcm"
)
rtplan_name = get_testdata_file("rtplan.dcm")
rtdose_name = get_testdata_file("rtdose.dcm")
ct_name = get_testdata_file("CT_small.dcm")
mr_name = get_testdata_file("MR_small.dcm")
truncated_mr_name = get_testdata_file("MR_truncated.dcm")
jpeg2000_name = get_testdata_file("JPEG2000.dcm")
jpeg2000_embedded_sequence_delimeter_name = get_testdata_file(
    "JPEG2000-embedded-sequence-delimiter.dcm"
)
jpeg2000_lossless_name = get_testdata_file("MR_small_jp2klossless.dcm")
jpeg_ls_lossless_name = get_testdata_file("MR_small_jpeg_ls_lossless.dcm")
jpeg_lossy_name = get_testdata_file("JPEG-lossy.dcm")
jpeg_lossless_name = get_testdata_file("JPEG-LL.dcm")
deflate_name = get_testdata_file("image_dfl.dcm")
rtstruct_name = get_testdata_file("rtstruct.dcm")
priv_SQ_name = get_testdata_file("priv_SQ.dcm")
nested_priv_SQ_name = get_testdata_file("nested_priv_SQ.dcm")
meta_missing_tsyntax_name = get_testdata_file("meta_missing_tsyntax.dcm")
no_meta_group_length = get_testdata_file("no_meta_group_length.dcm")
gzip_name = get_testdata_file("zipMR.gz")
color_px_name = get_testdata_file("color-px.dcm")
color_pl_name = get_testdata_file("color-pl.dcm")
explicit_vr_le_no_meta = get_testdata_file("ExplVR_LitEndNoMeta.dcm")
explicit_vr_be_no_meta = get_testdata_file("ExplVR_BigEndNoMeta.dcm")
emri_name = get_testdata_file("emri_small.dcm")
emri_big_endian_name = get_testdata_file("emri_small_big_endian.dcm")
emri_jpeg_ls_lossless = get_testdata_file("emri_small_jpeg_ls_lossless.dcm")
emri_jpeg_2k_lossless = get_testdata_file("emri_small_jpeg_2k_lossless.dcm")
emri_jpeg_2k_lossless_too_short = get_testdata_file(
    "emri_small_jpeg_2k_lossless_too_short.dcm"
)
color_3d_jpeg_baseline = get_testdata_file("color3d_jpeg_baseline.dcm")
dir_name = os.path.dirname(sys.argv[0])
save_dir = os.getcwd()


class TestReader:
    def test_empty_numbers_tag(self):
        """Test that an empty tag with a number VR (FL, UL, SL, US,
        SS, FL, FD, OF) reads as ``None``."""
        empty_number_tags_ds = dcmread(empty_number_tags_name)
        assert empty_number_tags_ds.ExaminedBodyThickness is None
        assert empty_number_tags_ds.SimpleFrameList is None
        assert empty_number_tags_ds.ReferencePixelX0 is None
        assert empty_number_tags_ds.PhysicalUnitsXDirection is None
        assert empty_number_tags_ds.TagAngleSecondAxis is None
        assert empty_number_tags_ds.TagSpacingSecondDimension is None
        assert empty_number_tags_ds.VectorGridData is None

    def test_UTF8_filename(self):
        utf8_filename = os.path.join(tempfile.gettempdir(), "ДИКОМ.dcm")
        shutil.copyfile(rtdose_name, utf8_filename)
        ds = dcmread(utf8_filename)
        os.remove(utf8_filename)
        assert ds is not None

    def test_pathlib_path_filename(self):
        """Check that file can be read using pathlib.Path"""
        dcmread(Path(priv_SQ_name))

    def test_RTPlan(self):
        """Returns correct values for sample data elements in test
        RT Plan file.
        """
        plan = dcmread(rtplan_name)
        beam = plan.BeamSequence[0]
        # if not two controlpoints, then this would raise exception
        cp0, cp1 = beam.ControlPointSequence

        assert "unit001" == beam.TreatmentMachineName
        assert beam[0x300A, 0x00B2].value == beam.TreatmentMachineName

        got = cp1.ReferencedDoseReferenceSequence[
            0
        ].CumulativeDoseReferenceCoefficient
        DS = pydicom.valuerep.DS
        expected = DS("0.9990268")
        assert expected == got
        got = cp0.BeamLimitingDevicePositionSequence[0].LeafJawPositions
        if have_numpy and config.use_DS_numpy:
            expected = numpy.array([DS("-100"), DS("100.0")])
            assert numpy.allclose(got, expected)
        else:
            expected = [DS("-100"), DS("100.0")]
            assert got == expected

    def test_RTDose(self):
        """Returns correct values for sample data elements in test
        RT Dose file"""
        dose = dcmread(rtdose_name)
        assert Tag((0x3004, 0x000C)) == dose.FrameIncrementPointer
        assert dose[0x28, 9].value == dose.FrameIncrementPointer

        # try a value that is nested the deepest
        # (so deep I break it into two steps!)
        fract = dose.ReferencedRTPlanSequence[
            0
        ].ReferencedFractionGroupSequence[0]
        assert 1 == fract.ReferencedBeamSequence[0].ReferencedBeamNumber

    def test_CT(self):
        """Returns correct values for sample data elements in test CT file."""
        ct = dcmread(ct_name)
        assert "1.3.6.1.4.1.5962.2" == ct.file_meta.ImplementationClassUID
        value = ct.file_meta[0x2, 0x12].value
        assert value == ct.file_meta.ImplementationClassUID

        # (0020, 0032) Image Position (Patient)
        # [-158.13580300000001, -179.035797, -75.699996999999996]
        got = ct.ImagePositionPatient
        DS = pydicom.valuerep.DS
        if have_numpy and config.use_DS_numpy:
            expected = numpy.array([-158.135803, -179.035797, -75.699997])
            assert numpy.allclose(got, expected)
        else:
            expected = [DS("-158.135803"), DS("-179.035797"), DS("-75.699997")]
            assert got == expected

        assert 128 == ct.Rows
        assert 128 == ct.Columns
        assert 16 == ct.BitsStored
        assert 128 * 128 * 2 == len(ct.PixelData)

        # Also test private elements name can be resolved:
        got = ct[(0x0043, 0x104E)].name
        assert "[Duration of X-ray on]" == got

    @pytest.mark.skipif(not have_numpy, reason="Numpy not installed")
    def test_CT_PixelData(self):
        """Check that we can read pixel data.
        Tests that we get last one in array.
        """
        ct = dcmread(ct_name)
        assert 909 == ct.pixel_array[-1][-1]

    def test_no_force(self):
        """Raises exception if missing DICOM header and force==False."""
        with pytest.raises(InvalidDicomError):
            dcmread(rtstruct_name)

    def test_RTStruct(self):
        """Returns correct values for sample elements in test RTSTRUCT file."""
        # RTSTRUCT test file has complex nested sequences
        # -- see rtstruct.dump file
        # Also has no DICOM header ... so tests 'force' argument of dcmread

        rtss = dcmread(rtstruct_name, force=True)
        frame_of_ref = rtss.ReferencedFrameOfReferenceSequence[0]
        study = frame_of_ref.RTReferencedStudySequence[0]
        uid = study.RTReferencedSeriesSequence[0].SeriesInstanceUID
        assert "1.2.826.0.1.3680043.8.498.2010020400001.2.1.1" == uid

        got = rtss.ROIContourSequence[0].ContourSequence[2].ContourNumber
        assert 3 == got

        obs_seq0 = rtss.RTROIObservationsSequence[0]
        got = obs_seq0.ROIPhysicalPropertiesSequence[0].ROIPhysicalProperty
        assert "REL_ELEC_DENSITY" == got

    def test_dir(self):
        """Returns correct dir attributes for both Dataset and DICOM names
        (python >= 2.6).."""
        # Only python >= 2.6 calls __dir__ for dir() call
        rtss = dcmread(rtstruct_name, force=True)
        # sample some expected 'dir' values
        got_dir = dir(rtss)
        expect_in_dir = [
            "pixel_array",
            "add_new",
            "ROIContourSequence",
            "StructureSetDate",
        ]
        for name in expect_in_dir:
            assert name in got_dir

        # Now check for some items in dir() of a nested item
        roi0 = rtss.ROIContourSequence[0]
        got_dir = dir(roi0)
        expect_in_dir = [
            "pixel_array",
            "add_new",
            "ReferencedROINumber",
            "ROIDisplayColor",
        ]
        for name in expect_in_dir:
            assert name in got_dir

    def test_MR(self):
        """Returns correct values for sample data elements in test MR file."""
        mr = dcmread(mr_name)
        # (0010, 0010) Patient's Name           'CompressedSamples^MR1'
        mr.decode()
        assert "CompressedSamples^MR1" == mr.PatientName
        assert mr[0x10, 0x10].value == mr.PatientName

        DS = pydicom.valuerep.DS

        if have_numpy and config.use_DS_numpy:
            expected = numpy.array([0.3125, 0.3125])
            assert numpy.allclose(mr.PixelSpacing, expected)
        else:
            assert [DS("0.3125"), DS("0.3125")] == mr.PixelSpacing

    def test_deflate(self):
        """Returns correct values for sample data elements in test compressed
         (zlib deflate) file
         """
        # Everything after group 2 is compressed.
        # If we can read anything else, the decompression must have been ok.
        ds = dcmread(deflate_name)
        assert "WSD" == ds.ConversionType

    def test_sequence_with_implicit_vr(self):
        """Test that reading a UN sequence with unknown length and implicit VR
        in a dataset with explicit VR is read regardless of the value of
        the assume_implicit_vr_switch option."""
        replace_un_with_known_vr = config.replace_un_with_known_vr
        assume_implicit_vr_switch = config.assume_implicit_vr_switch

        config.replace_un_with_known_vr = True
        config.assume_implicit_vr_switch = True
        ds = dcmread(get_testdata_file("bad_sequence.dcm"))
        str(ds.CTDIPhantomTypeCodeSequence)

        config.assume_implicit_vr_switch = False
        ds = dcmread(get_testdata_file("bad_sequence.dcm"))
        str(ds.CTDIPhantomTypeCodeSequence)

        config.replace_un_with_known_vr = False
        ds = dcmread(get_testdata_file("bad_sequence.dcm"))
        str(ds.CTDIPhantomTypeCodeSequence)

        config.replace_un_with_known_vr = replace_un_with_known_vr
        config.assume_implicit_vr_switch = assume_implicit_vr_switch

    def test_no_pixels_read(self):
        """Returns all data elements before pixels using
        stop_before_pixels=False.
        """
        # Just check the tags, and a couple of values
        ctpartial = dcmread(ct_name, stop_before_pixels=True)
        ctpartial_tags = sorted(ctpartial.keys())
        ctfull = dcmread(ct_name)
        ctfull_tags = sorted(ctfull.keys())
        missing = [Tag(0x7FE0, 0x10), Tag(0xFFFC, 0xFFFC)]
        assert ctfull_tags == ctpartial_tags + missing

    @pytest.mark.skipif(not have_numpy, reason="Numpy not available")
    def test_no_float_pixels_read(self):
        """Returns all data elements before pixels using
        stop_before_pixels=True.
        """
        ds = Dataset()
        ds.InstanceNumber = 1
        ds.FloatPixelData = numpy.random.random((3, 3)).tobytes()

        fp = BytesIO()
        file_ds = FileDataset(fp, ds)
        file_ds.is_implicit_VR = True
        file_ds.is_little_endian = True
        file_ds.save_as(fp, write_like_original=True)

        test_ds = dcmread(fp, force=True, stop_before_pixels=True)
        ds_tags = sorted(ds.keys())
        test_ds_tags = sorted(test_ds.keys())
        assert ds_tags == test_ds_tags + [Tag(0x7FE0, 0x08)]

    def test_specific_tags(self):
        """Returns only tags specified by user."""
        ctspecific = dcmread(
            ct_name,
            specific_tags=[
                Tag(0x0010, 0x0010),
                "PatientID",
                "ImageType",
                "ViewName",
            ],
        )
        ctspecific_tags = sorted(ctspecific.keys())
        expected = [
            # SpecificCharacterSet is always added
            # ViewName does not exist in the data set
            Tag(0x0008, 0x0005),
            Tag(0x0008, 0x0008),
            Tag(0x0010, 0x0010),
            Tag(0x0010, 0x0020),
        ]
        assert expected == ctspecific_tags

    def test_specific_tags_with_other_unkonwn_length_tags(self):
        rtstruct_specific = dcmread(
            rtstruct_name,
            force=True,
            specific_tags=[
                "PatientName",
                "PatientID",
            ],
        )
        rtstruct_specific_tags = sorted(rtstruct_specific.keys())
        expected = [
            # SpecificCharacterSet is always added
            Tag(0x0008, 0x0005),
            Tag(0x0010, 0x0010),
            Tag(0x0010, 0x0020),
        ]
        assert expected == rtstruct_specific_tags

    def test_specific_tags_with_unknown_length_SQ(self):
        """Returns only tags specified by user."""
        unknown_len_sq_tag = Tag(0x3F03, 0x1001)
        tags = dcmread(priv_SQ_name, specific_tags=[unknown_len_sq_tag])
        tags = sorted(tags.keys())
        assert [unknown_len_sq_tag] == tags

        tags = dcmread(priv_SQ_name, specific_tags=["PatientName"])
        tags = sorted(tags.keys())
        assert [] == tags

    def test_specific_tags_with_unknown_length_tag(self):
        """Returns only tags specified by user."""
        unknown_len_tag = Tag(0x7FE0, 0x0010)  # Pixel Data
        tags = dcmread(emri_jpeg_2k_lossless, specific_tags=[unknown_len_tag])
        tags = sorted(tags.keys())
        # SpecificCharacterSet is always added
        assert [Tag(0x08, 0x05), unknown_len_tag] == tags

        tags = dcmread(
            emri_jpeg_2k_lossless, specific_tags=["SpecificCharacterSet"]
        )
        tags = sorted(tags.keys())
        assert [Tag(0x08, 0x05)] == tags

    def test_tag_with_unknown_length_tag_too_short(
            self, allow_reading_invalid_values):
        """Tests handling of incomplete sequence value."""
        # the data set is the same as emri_jpeg_2k_lossless,
        # with the last 8 bytes removed to provoke the EOF error
        unknown_len_tag = Tag(0x7FE0, 0x0010)  # Pixel Data
        with pytest.warns(UserWarning, match="End of file reached*"):
            dcmread(
                emri_jpeg_2k_lossless_too_short,
                specific_tags=[unknown_len_tag],
            )

    def test_tag_with_unknown_length_tag_too_short_strict(
            self, enforce_valid_values):
        """Tests handling of incomplete sequence value in strict mode."""
        unknown_len_tag = Tag(0x7FE0, 0x0010)  # Pixel Data
        with pytest.raises(EOFError, match="End of file reached*"):
            dcmread(
                emri_jpeg_2k_lossless_too_short,
                specific_tags=[unknown_len_tag],
            )

    def test_private_SQ(self):
        """Can read private undefined length SQ without error."""
        # From issues 91, 97, 98. Bug introduced by fast reading, due to
        #    VR=None in raw data elements, then an undefined length private
        #    item VR is looked up, and there is no such tag,
        #    generating an exception

        # Simply read the file, in 0.9.5 this generated an exception
        dcmread(priv_SQ_name)

    def test_nested_private_SQ(self):
        """Can successfully read a private SQ which contains additional SQs."""
        # From issue 113. When a private SQ of undefined length is used, the
        #   sequence is read in and the length of the SQ is determined upon
        #   identification of the SQ termination sequence. When using nested
        #   Sequences, the first termination sequence encountered actually
        #   belongs to the nested Sequence not the parent, therefore the
        #   remainder of the file is not read in properly
        ds = dcmread(nested_priv_SQ_name)

        # Make sure that the entire dataset was read in
        pixel_data_tag = TupleTag((0x7FE0, 0x10))
        assert pixel_data_tag in ds

        # Check that the DataElement is indeed a Sequence
        tag = TupleTag((0x01, 0x01))
        seq0 = ds[tag]
        assert "SQ" == seq0.VR

        # Now verify the presence of the nested private SQ
        seq1 = seq0[0][tag]
        assert "SQ" == seq1.VR

        # Now make sure the values that are parsed are correct
        assert b"Double Nested SQ" == seq1[0][tag].value
        assert b"Nested SQ" == seq0[0][0x01, 0x02].value

    def test_un_sequence(self, dont_replace_un_with_known_vr):
        ds = dcmread(get_testdata_file("UN_sequence.dcm"))
        seq_element = ds[0x4453100c]
        assert seq_element.VR == "SQ"
        assert len(seq_element.value) == 1
        assert len(seq_element.value[0].ReferencedSeriesSequence) == 1

    def test_un_sequence_dont_infer(
            self,
            dont_replace_un_with_sq_vr,
            dont_replace_un_with_known_vr
    ):
        ds = dcmread(get_testdata_file("UN_sequence.dcm"))
        seq_element = ds[0x4453100c]
        assert seq_element.VR == "UN"

    def test_no_meta_group_length(self, no_datetime_conversion):
        """Read file with no group length in file meta."""
        # Issue 108 -- iView example file with no group length (0002,0002)
        # Originally crashed, now check no exception, but also check one item
        #     in file_meta, and second one in followinsg dataset
        ds = dcmread(no_meta_group_length)
        assert "20111130" == ds.InstanceCreationDate

    def test_no_transfer_syntax_in_meta(self):
        """Read file with file_meta, but has no TransferSyntaxUID in it."""
        # From issue 258: if file has file_meta but no TransferSyntaxUID in it,
        #   should assume default transfer syntax
        ds = dcmread(meta_missing_tsyntax_name)  # is default transfer syntax

        # Repeat one test from nested private sequence test to maker sure
        #    file was read correctly
        pixel_data_tag = TupleTag((0x7FE0, 0x10))
        assert pixel_data_tag in ds

    def test_explicit_VR_little_endian_no_meta(self, no_datetime_conversion):
        """Read file without file meta with Little Endian Explicit VR dataset.
        """
        # Example file from CMS XiO 5.0 and above
        # Still need to force read data since there is no 'DICM' marker present
        ds = dcmread(explicit_vr_le_no_meta, force=True)
        assert "20150529" == ds.InstanceCreationDate

    def test_explicit_VR_big_endian_no_meta(self, no_datetime_conversion):
        """Read file without file meta with Big Endian Explicit VR dataset."""
        # Example file from CMS XiO 5.0 and above
        # Still need to force read data since there is no 'DICM' marker present
        ds = dcmread(explicit_vr_be_no_meta, force=True)
        assert "20150529" == ds.InstanceCreationDate

    def test_planar_config(self):
        px_data_ds = dcmread(color_px_name)
        pl_data_ds = dcmread(color_pl_name)
        assert px_data_ds.PlanarConfiguration != pl_data_ds.PlanarConfiguration
        if have_numpy:
            px_data = px_data_ds.pixel_array
            pl_data = pl_data_ds.pixel_array
            assert numpy.all(px_data == pl_data)

    def test_correct_ambiguous_vr(self):
        """Test correcting ambiguous VR elements read from file"""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.add(DataElement(0x00280108, "US", 10))
        ds.add(DataElement(0x00280109, "US", 500))

        fp = BytesIO()
        file_ds = FileDataset(fp, ds)
        file_ds.is_implicit_VR = True
        file_ds.is_little_endian = True
        file_ds.save_as(fp, write_like_original=True)

        ds = dcmread(fp, force=True)
        assert "US" == ds[0x00280108].VR
        assert 10 == ds.SmallestPixelValueInSeries

    def test_correct_ambiguous_explicit_vr(self):
        """Test correcting ambiguous VR elements read from file"""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.add(DataElement(0x00280108, "US", 10))
        ds.add(DataElement(0x00280109, "US", 500))

        fp = BytesIO()
        file_ds = FileDataset(fp, ds)
        file_ds.is_implicit_VR = False
        file_ds.is_little_endian = True
        file_ds.save_as(fp, write_like_original=True)

        ds = dcmread(fp, force=True)
        assert "US" == ds[0x00280108].VR
        assert 10 == ds.SmallestPixelValueInSeries

    def test_correct_ambiguous_vr_compressed(self):
        """Test correcting compressed Pixel Data read from file"""
        # Create an implicit VR compressed dataset
        ds = dcmread(jpeg_lossless_name)
        fp = BytesIO()
        file_ds = FileDataset(fp, ds)
        file_ds.is_implicit_VR = True
        file_ds.is_little_endian = True
        file_ds.save_as(fp, write_like_original=True)

        ds = dcmread(fp, force=True)
        assert "OB" == ds[0x7FE00010].VR

    def test_read_encoded_pixel_data_without_embedded_sequence_delimiter(self):
        ds = dcmread(jpeg2000_name)
        assert "OB" == ds[0x7FE00010].VR
        assert 266 == len(ds[0x7FE00010].value)

    def test_read_encoded_pixel_data_with_embedded_sequence_delimiter(self):
        """Test ignoring embedded sequence delimiter in encoded pixel
        data fragment. Reproduces #1140.
        """
        ds = dcmread(jpeg2000_embedded_sequence_delimeter_name)
        assert "OB" == ds[0x7FE00010].VR
        assert 266 == len(ds[0x7FE00010].value)

    def test_long_specific_char_set(self, allow_reading_invalid_values):
        """Test that specific character set is read even if it is longer
         than defer_size"""
        ds = Dataset()

        long_specific_char_set_value = ["ISO 2022IR 100"] * 9
        ds.add(DataElement(0x00080005, "CS", long_specific_char_set_value))

        msg = (
            r"Unknown encoding 'ISO 2022IR 100' - using default encoding "
            r"instead"
        )

        fp = BytesIO()
        file_ds = FileDataset(fp, ds)
        with pytest.warns(UserWarning, match=msg):
            file_ds.save_as(fp, write_like_original=True)

        with pytest.warns(UserWarning, match=msg):
            ds = dcmread(fp, defer_size=65, force=True)
            assert long_specific_char_set_value == ds[0x00080005].value

    def test_long_specific_char_set_strict(self, enforce_valid_values):
        ds = Dataset()

        long_specific_char_set_value = ["ISO 2022IR 100"] * 9
        ds.add(DataElement(0x00080005, "CS", long_specific_char_set_value))

        fp = BytesIO()
        file_ds = FileDataset(fp, ds)
        with pytest.raises(LookupError,
                           match="Unknown encoding 'ISO 2022IR 100'"):
            file_ds.save_as(fp, write_like_original=True)

    def test_no_preamble_file_meta_dataset(self):
        """Test correct read of group 2 elements with no preamble."""
        bytestream = (
            b"\x02\x00\x02\x00\x55\x49\x16\x00\x31\x2e\x32\x2e"
            b"\x38\x34\x30\x2e\x31\x30\x30\x30\x38\x2e\x35\x2e"
            b"\x31\x2e\x31\x2e\x39\x00\x02\x00\x10\x00\x55\x49"
            b"\x12\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31\x30"
            b"\x30\x30\x38\x2e\x31\x2e\x32\x00\x20\x20\x10\x00"
            b"\x02\x00\x00\x00\x01\x00\x20\x20\x20\x00\x06\x00"
            b"\x00\x00\x4e\x4f\x52\x4d\x41\x4c"
        )

        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert "MediaStorageSOPClassUID" in ds.file_meta
        assert ImplicitVRLittleEndian == ds.file_meta.TransferSyntaxUID
        assert "NORMAL" == ds.Polarity
        assert 1 == ds.ImageBoxPosition

    def test_no_preamble_command_group_dataset(self):
        """Test correct read of group 0 and 2 elements with no preamble."""
        bytestream = (
            b"\x02\x00\x02\x00\x55\x49\x16\x00\x31\x2e\x32\x2e"
            b"\x38\x34\x30\x2e\x31\x30\x30\x30\x38\x2e\x35\x2e"
            b"\x31\x2e\x31\x2e\x39\x00\x02\x00\x10\x00\x55\x49"
            b"\x12\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31\x30"
            b"\x30\x30\x38\x2e\x31\x2e\x32\x00"
            b"\x20\x20\x10\x00\x02\x00\x00\x00\x01\x00\x20\x20"
            b"\x20\x00\x06\x00\x00\x00\x4e\x4f\x52\x4d\x41\x4c"
            b"\x00\x00\x10\x01\x02\x00\x00\x00\x03\x00"
        )

        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert "MediaStorageSOPClassUID" in ds.file_meta
        assert ImplicitVRLittleEndian == ds.file_meta.TransferSyntaxUID
        assert "NORMAL" == ds.Polarity
        assert 1 == ds.ImageBoxPosition
        assert 3 == ds.MessageID

    def test_group_length_wrong(self):
        """Test file is read correctly even if FileMetaInformationGroupLength
        is incorrect.
        """
        bytestream = (
            b"\x02\x00\x00\x00\x55\x4C\x04\x00\x0A\x00\x00\x00"
            b"\x02\x00\x02\x00\x55\x49\x16\x00\x31\x2e\x32\x2e"
            b"\x38\x34\x30\x2e\x31\x30\x30\x30\x38\x2e\x35\x2e"
            b"\x31\x2e\x31\x2e\x39\x00\x02\x00\x10\x00\x55\x49"
            b"\x12\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31\x30"
            b"\x30\x30\x38\x2e\x31\x2e\x32\x00"
            b"\x20\x20\x10\x00\x02\x00\x00\x00\x01\x00\x20\x20"
            b"\x20\x00\x06\x00\x00\x00\x4e\x4f\x52\x4d\x41\x4c"
        )
        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        value = ds.file_meta.FileMetaInformationGroupLength
        assert not len(bytestream) - 12 == value
        assert 10 == ds.file_meta.FileMetaInformationGroupLength
        assert "MediaStorageSOPClassUID" in ds.file_meta
        assert ImplicitVRLittleEndian == ds.file_meta.TransferSyntaxUID
        assert "NORMAL" == ds.Polarity
        assert 1 == ds.ImageBoxPosition

    def test_preamble_command_meta_no_dataset(self):
        """Test reading only preamble, command and meta elements"""
        preamble = b"\x00" * 128
        prefix = b"DICM"
        command = (
            b"\x00\x00\x00\x00\x04\x00\x00\x00\x38"
            b"\x00\x00\x00\x00\x00\x02\x00\x12\x00\x00"
            b"\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31"
            b"\x30\x30\x30\x38\x2e\x31\x2e\x31\x00\x00"
            b"\x00\x00\x01\x02\x00\x00\x00\x30\x00\x00"
            b"\x00\x10\x01\x02\x00\x00\x00\x07\x00\x00"
            b"\x00\x00\x08\x02\x00\x00\x00\x01\x01"
        )
        meta = (
            b"\x02\x00\x00\x00\x55\x4C\x04\x00\x0A\x00\x00\x00"
            b"\x02\x00\x02\x00\x55\x49\x16\x00\x31\x2e\x32\x2e"
            b"\x38\x34\x30\x2e\x31\x30\x30\x30\x38\x2e\x35\x2e"
            b"\x31\x2e\x31\x2e\x39\x00\x02\x00\x10\x00\x55\x49"
            b"\x12\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31\x30"
            b"\x30\x30\x38\x2e\x31\x2e\x32\x00"
        )

        bytestream = preamble + prefix + meta + command
        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert "TransferSyntaxUID" in ds.file_meta
        assert "MessageID" in ds

    def test_preamble_meta_no_dataset(self):
        """Test reading only preamble and meta elements"""
        preamble = b"\x00" * 128
        prefix = b"DICM"
        meta = (
            b"\x02\x00\x00\x00\x55\x4C\x04\x00\x0A\x00\x00\x00"
            b"\x02\x00\x02\x00\x55\x49\x16\x00\x31\x2e\x32\x2e"
            b"\x38\x34\x30\x2e\x31\x30\x30\x30\x38\x2e\x35\x2e"
            b"\x31\x2e\x31\x2e\x39\x00\x02\x00\x10\x00\x55\x49"
            b"\x12\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31\x30"
            b"\x30\x30\x38\x2e\x31\x2e\x32\x00"
        )

        bytestream = preamble + prefix + meta
        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert b"\x00" * 128 == ds.preamble
        assert "TransferSyntaxUID" in ds.file_meta
        assert Dataset() == ds[:]

    def test_preamble_commandset_no_dataset(self):
        """Test reading only preamble and command set"""
        preamble = b"\x00" * 128
        prefix = b"DICM"
        command = (
            b"\x00\x00\x00\x00\x04\x00\x00\x00\x38"
            b"\x00\x00\x00\x00\x00\x02\x00\x12\x00\x00"
            b"\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31"
            b"\x30\x30\x30\x38\x2e\x31\x2e\x31\x00\x00"
            b"\x00\x00\x01\x02\x00\x00\x00\x30\x00\x00"
            b"\x00\x10\x01\x02\x00\x00\x00\x07\x00\x00"
            b"\x00\x00\x08\x02\x00\x00\x00\x01\x01"
        )
        bytestream = preamble + prefix + command

        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert "MessageID" in ds
        assert Dataset() == ds.file_meta

    def test_meta_no_dataset(self):
        """Test reading only meta elements"""
        bytestream = (
            b"\x02\x00\x00\x00\x55\x4C\x04\x00\x0A\x00\x00\x00"
            b"\x02\x00\x02\x00\x55\x49\x16\x00\x31\x2e\x32\x2e"
            b"\x38\x34\x30\x2e\x31\x30\x30\x30\x38\x2e\x35\x2e"
            b"\x31\x2e\x31\x2e\x39\x00\x02\x00\x10\x00\x55\x49"
            b"\x12\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31\x30"
            b"\x30\x30\x38\x2e\x31\x2e\x32\x00"
        )
        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert "TransferSyntaxUID" in ds.file_meta
        assert Dataset() == ds[:]

    def test_commandset_no_dataset(self):
        """Test reading only command set elements"""
        bytestream = (
            b"\x00\x00\x00\x00\x04\x00\x00\x00\x38"
            b"\x00\x00\x00\x00\x00\x02\x00\x12\x00\x00"
            b"\x00\x31\x2e\x32\x2e\x38\x34\x30\x2e\x31"
            b"\x30\x30\x30\x38\x2e\x31\x2e\x31\x00\x00"
            b"\x00\x00\x01\x02\x00\x00\x00\x30\x00\x00"
            b"\x00\x10\x01\x02\x00\x00\x00\x07\x00\x00"
            b"\x00\x00\x08\x02\x00\x00\x00\x01\x01"
        )
        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert "MessageID" in ds
        assert ds.preamble is None
        assert Dataset() == ds.file_meta

    def test_file_meta_dataset_implicit_vr(self, allow_reading_invalid_values):
        """Test reading a file meta dataset that is implicit VR"""

        bytestream = (
            b"\x02\x00\x10\x00\x12\x00\x00\x00"
            b"\x31\x2e\x32\x2e\x38\x34\x30\x2e"
            b"\x31\x30\x30\x30\x38\x2e\x31\x2e"
            b"\x32\x00"
        )
        fp = BytesIO(bytestream)
        with pytest.warns(UserWarning):
            ds = dcmread(fp, force=True)
        assert "TransferSyntaxUID" in ds.file_meta

    def test_file_meta_dataset_implicit_vr_strict(self, enforce_valid_values):
        """Test reading a file meta dataset that is implicit VR"""

        bytestream = (
            b"\x02\x00\x10\x00\x12\x00\x00\x00"
            b"\x31\x2e\x32\x2e\x38\x34\x30\x2e"
            b"\x31\x30\x30\x30\x38\x2e\x31\x2e"
            b"\x32\x00"
        )
        fp = BytesIO(bytestream)
        with pytest.raises(InvalidDicomError,
                           match="Expected explicit VR, "
                                 "but found implicit VR"):
            dcmread(fp, force=True)

    def test_no_dataset(self):
        """Test reading no elements or preamble produces empty Dataset"""
        bytestream = b""
        fp = BytesIO(bytestream)
        ds = dcmread(fp, force=True)
        assert ds.preamble is None
        assert Dataset() == ds.file_meta
        assert Dataset() == ds[:]

    def test_empty_file(self):
        """Test reading no elements from file produces empty Dataset"""
        with tempfile.NamedTemporaryFile() as f:
            ds = dcmread(f, force=True)
            assert ds.preamble is None
            assert Dataset() == ds.file_meta
            assert Dataset() == ds[:]

    def test_bad_filename(self):
        """Test reading from non-existing file raises."""
        with pytest.raises(FileNotFoundError):
            dcmread("InvalidFilePath")
        with pytest.raises(TypeError, match="dcmread: Expected a file path or "
                                            "a file-like, but got None"):
            dcmread(None)
        with pytest.raises(TypeError, match="dcmread: Expected a file path or "
                                            "a file-like, but got int"):
            dcmread(42)

    def test_empty_specific_character_set(self):
        """Test that an empty Specific Character Set is handled correctly.
        Regression test for #1038"""
        ds = dcmread(get_testdata_file("empty_charset_LEI.dcm"))
        assert ds.read_encoding == ["iso8859"]

    def test_dcmread_does_not_raise(self):
        """Test that reading from DicomBytesIO does not raise on EOF.
        Regression test for #358."""
        ds = dcmread(mr_name)
        fp = DicomBytesIO()
        ds.save_as(fp, write_like_original=True)
        fp.seek(0)
        de_gen = data_element_generator(fp, False, True)
        try:
            while True:
                next(de_gen)
        except StopIteration:
            pass
        except EOFError:
            self.fail("Unexpected EOFError raised")

    def test_lut_descriptor(self):
        """Regression test for #942: incorrect first value"""
        prefixes = [
            b"\x28\x00\x01\x11",
            b"\x28\x00\x02\x11",
            b"\x28\x00\x03\x11",
            b"\x28\x00\x02\x30",
        ]
        suffix = b"\x53\x53\x06\x00\x00\xf5\x00\xf8\x10\x00"

        for raw_tag in prefixes:
            tag = unpack("<2H", raw_tag)
            bs = DicomBytesIO(raw_tag + suffix)
            bs.is_little_endian = True
            bs.is_implicit_VR = False

            ds = dcmread(bs, force=True)
            elem = ds[tag]
            assert elem.VR == "SS"
            assert elem.value == [62720, -2048, 16]

    def test_lut_descriptor_empty(self):
        """Regression test for #1049: LUT empty raises."""
        bs = DicomBytesIO(b"\x28\x00\x01\x11\x53\x53\x00\x00")
        bs.is_little_endian = True
        bs.is_implicit_VR = False
        ds = dcmread(bs, force=True)
        elem = ds[0x00281101]
        assert elem.value is None
        assert elem.VR == "SS"

    def test_lut_descriptor_singleton(self):
        """Test LUT Descriptor with VM = 1"""
        bs = DicomBytesIO(b"\x28\x00\x01\x11\x53\x53\x02\x00\x00\xf5")
        bs.is_little_endian = True
        bs.is_implicit_VR = False
        ds = dcmread(bs, force=True)
        elem = ds[0x00281101]
        # No conversion to US if not a triplet
        assert elem.value == -2816
        assert elem.VR == "SS"

    def test_reading_of(self):
        """Test reading a dataset with OF element."""
        bs = DicomBytesIO(
            b"\x28\x00\x01\x11\x53\x53\x06\x00\x00\xf5\x00\xf8\x10\x00"
            b"\xe0\x7f\x08\x00\x4F\x46\x00\x00\x04\x00\x00\x00\x00\x01\x02\x03"
        )
        bs.is_little_endian = True
        bs.is_implicit_VR = False

        ds = dcmread(bs, force=True)
        elem = ds["FloatPixelData"]
        assert "OF" == elem.VR
        assert b"\x00\x01\x02\x03" == elem.value

    def test_empty_pn(self):
        """Test correct type for an empty PN element."""
        # Test for 1338
        ds = Dataset()
        ds.is_little_endian = True
        ds.is_implicit_VR = True
        ds.PatientName = ''
        assert isinstance(ds.PatientName, pydicom.valuerep.PersonName)

        bs = DicomBytesIO()
        ds.save_as(bs)

        out = dcmread(bs, force=True)
        assert isinstance(ds[0x00100010].value, pydicom.valuerep.PersonName)


class TestIncorrectVR:
    def setup(self):
        self.ds_explicit = BytesIO(
            b"\x08\x00\x05\x00CS\x0a\x00ISO_IR 100"  # SpecificCharacterSet
            b"\x08\x00\x20\x00DA\x08\x0020000101"  # StudyDate
        )
        self.ds_implicit = BytesIO(
            b"\x08\x00\x05\x00\x0a\x00\x00\x00ISO_IR 100"
            b"\x08\x00\x20\x00\x08\x00\x00\x0020000101"
        )

    def test_implicit_vr_expected_explicit_used(
            self, allow_reading_invalid_values, no_datetime_conversion):
        msg = (
            "Expected implicit VR, but found explicit VR - "
            "using explicit VR for reading"
        )

        with pytest.warns(UserWarning, match=msg):
            ds = read_dataset(
                self.ds_explicit, is_implicit_VR=True, is_little_endian=True
            )
        assert "ISO_IR 100" == ds.SpecificCharacterSet
        assert "20000101" == ds.StudyDate

    def test_implicit_vr_expected_explicit_used_strict(
            self, enforce_valid_values):
        msg = "Expected implicit VR, but found explicit VR"
        with pytest.raises(InvalidDicomError, match=msg):
            read_dataset(
                self.ds_explicit, is_implicit_VR=True, is_little_endian=True
            )

    def test_explicit_vr_expected_implicit_used(
            self, allow_reading_invalid_values, no_datetime_conversion):
        msg = (
            "Expected explicit VR, but found implicit VR - "
            "using implicit VR for reading"
        )

        with pytest.warns(UserWarning, match=msg):
            ds = read_dataset(
                self.ds_implicit, is_implicit_VR=False, is_little_endian=True
            )
        assert "ISO_IR 100" == ds.SpecificCharacterSet
        assert "20000101" == ds.StudyDate

    def test_explicit_vr_expected_implicit_used_strict(
            self, enforce_valid_values):
        msg = "Expected explicit VR, but found implicit VR"
        with pytest.raises(InvalidDicomError, match=msg):
            read_dataset(
                self.ds_implicit, is_implicit_VR=False, is_little_endian=True
            )

    def test_seq_item_looks_like_explicit_VR(self):
        # For issue 999.

        # Set up an implicit VR dataset with a "normal" group 8 tag,
        # followed by a sequence with an item (dataset) having
        # a data element length that looks like a potential valid VR
        ds = Dataset()
        ds.file_meta = FileMetaDataset()
        ds.file_meta.MediaStorageSOPClassUID = "1.1.1"
        ds.file_meta.MediaStorageSOPInstanceUID = "2.2.2"
        ds.is_implicit_VR = True
        ds.is_little_endian = True
        ds.SOPClassUID = "9.9.9"  # First item group 8 in top-level dataset
        seq = Sequence()
        seq_ds = Dataset()
        seq_ds.BadPixelImage = b"\3" * 0x5244  # length looks like "DR"
        seq.append(seq_ds)
        ds.ReferencedImageSequence = seq

        dbio = DicomBytesIO()
        ds.save_as(dbio, write_like_original=False)

        # Now read the constructed dataset back in
        # In original issue, shows warning that has detected what appears
        # to be Explicit VR, then throws NotImplemented for the unknown VR
        dbio.seek(0)
        ds = dcmread(dbio)
        ds.remove_private_tags()  # forces it to actually parse SQ


class TestUnknownVR:
    @pytest.fixture(autouse=True)
    def restore_config_values(self):
        orig_impl_VR_switch = config.assume_implicit_vr_switch
        config.assume_implicit_vr_switch = False
        yield
        config.assume_implicit_vr_switch = orig_impl_VR_switch

    @pytest.mark.parametrize(
        "vr_bytes, str_output",
        [
            # Test limits of char values
            (b"\x00\x41", "0x00 0x41"),  # 000/A
            (b"\x40\x41", "0x40 0x41"),  # 064/A
            (b"\x5B\x41", "0x5b 0x41"),  # 091/A
            (b"\x60\x41", "0x60 0x41"),  # 096/A
            (b"\x7B\x41", "0x7b 0x41"),  # 123/A
            (b"\xFF\x41", "0xff 0x41"),  # 255/A
            # Test good/bad
            (b"\x41\x00", "0x41 0x00"),  # A/-
            (b"\x5A\x00", "0x5a 0x00"),  # Z/-
            # Test not quite good/bad
            (b"\x61\x00", "0x61 0x00"),  # a/-
            (b"\x7A\x00", "0x7a 0x00"),  # z/-
            # Test bad/good
            (b"\x00\x41", "0x00 0x41"),  # -/A
            (b"\x00\x5A", "0x00 0x5a"),  # -/Z
            # Test bad/not quite good
            (b"\x00\x61", "0x00 0x61"),  # -/a
            (b"\x00\x7A", "0x00 0x7a"),  # -/z
            # Test good/good
            (b"\x41\x41", "AA"),  # A/A
            (b"\x41\x5A", "AZ"),  # A/Z
            (b"\x5A\x41", "ZA"),  # Z/A
            (b"\x5A\x5A", "ZZ"),  # Z/Z
            # Test not quite good
            (b"\x41\x61", "Aa"),  # A/a
            (b"\x41\x7A", "Az"),  # A/z
            (b"\x61\x41", "aA"),  # a/A
            (b"\x61\x5A", "aZ"),  # a/Z
            (b"\x61\x61", "aa"),  # a/a
            (b"\x61\x7A", "az"),  # a/z
            (b"\x5A\x61", "Za"),  # Z/a
            (b"\x5A\x7A", "Zz"),  # Z/z
            (b"\x7A\x41", "zA"),  # z/A
            (b"\x7A\x5A", "zZ"),  # z/Z
            (b"\x7A\x61", "za"),  # z/a
            (b"\x7A\x7A", "zz"),  # z/z
        ],
    )
    def test_fail_decode_msg(self, vr_bytes, str_output):
        """Regression test for #791."""
        # start the dataset with a valid tag (SpecificCharacterSet),
        # as the first tag is used to check the VR
        ds = read_dataset(
            BytesIO(
                b"\x08\x00\x05\x00CS\x0a\x00ISO_IR 100"
                b"\x08\x00\x06\x00" + vr_bytes + b"\x00\x00\x00\x08\x00\x49"
            ),
            False,
            True,
        )
        msg = r"Unknown Value Representation '{}' in tag \(0008, 0006\)"
        msg = msg.format(str_output)
        with pytest.raises(NotImplementedError, match=msg):
            print(ds)


class TestReadDataElement:
    def setup(self):
        ds = Dataset()
        ds.DoubleFloatPixelData = (
            b"\x00\x01\x02\x03\x04\x05\x06\x07"
            b"\x01\x01\x02\x03\x04\x05\x06\x07"
        )  # OD
        ds.SelectorOLValue = (
            b"\x00\x01\x02\x03\x04\x05\x06\x07" b"\x01\x01\x02\x03"
        )  # VR of OL
        ds.PotentialReasonsForProcedure = [
            "A",
            "B",
            "C",
        ]  # VR of UC, odd length
        ds.StrainDescription = "Test"  # Even length
        ds.URNCodeValue = "http://test.com"  # VR of UR
        ds.RetrieveURL = "ftp://test.com  "  # Test trailing spaces ignored
        ds.DestinationAE = "    TEST  12    "  # 16 characters max for AE
        # 8-byte values
        ds.ExtendedOffsetTable = (  # VR of OV
            b"\x00\x00\x00\x00\x00\x00\x00\x00"
            b"\x01\x02\x03\x04\x05\x06\x07\x08"
        )

        # No public elements with VR of SV or UV yet...
        add_dict_entries(
            {
                0xFFFE0001: (
                    "SV",
                    "1",
                    "SV Element Minimum",
                    "",
                    "SVElementMinimum",
                ),
                0xFFFE0002: (
                    "SV",
                    "1",
                    "SV Element Maximum",
                    "",
                    "SVElementMaximum",
                ),
                0xFFFE0003: (
                    "UV",
                    "1",
                    "UV Element Minimum",
                    "",
                    "UVElementMinimum",
                ),
                0xFFFE0004: (
                    "UV",
                    "1",
                    "UV Element Maximum",
                    "",
                    "UVElementMaximum",
                ),
            }
        )
        ds.SVElementMinimum = -(2 ** 63)
        ds.SVElementMaximum = 2 ** 63 - 1
        ds.UVElementMinimum = 0
        ds.UVElementMaximum = 2 ** 64 - 1

        self.fp = BytesIO()  # Implicit little
        file_ds = FileDataset(self.fp, ds)
        file_ds.is_implicit_VR = True
        file_ds.is_little_endian = True
        file_ds.save_as(self.fp, write_like_original=True)

        self.fp_ex = BytesIO()  # Explicit little
        file_ds = FileDataset(self.fp_ex, ds)
        file_ds.is_implicit_VR = False
        file_ds.is_little_endian = True
        file_ds.save_as(self.fp_ex, write_like_original=True)

    def test_read_OD_implicit_little(self):
        """Check creation of OD DataElement from byte data works correctly."""
        ds = dcmread(self.fp, force=True)
        ref_elem = ds.get(0x7FE00009)
        elem = DataElement(
            0x7FE00009,
            "OD",
            b"\x00\x01\x02\x03\x04\x05\x06\x07"
            b"\x01\x01\x02\x03\x04\x05\x06\x07",
        )
        assert ref_elem == elem

    def test_read_OD_explicit_little(self):
        """Check creation of OD DataElement from byte data works correctly."""
        ds = dcmread(self.fp_ex, force=True)
        ref_elem = ds.get(0x7FE00009)
        elem = DataElement(
            0x7FE00009,
            "OD",
            b"\x00\x01\x02\x03\x04\x05\x06\x07"
            b"\x01\x01\x02\x03\x04\x05\x06\x07",
        )
        assert ref_elem == elem

    def test_read_OL_implicit_little(self):
        """Check creation of OL DataElement from byte data works correctly."""
        ds = dcmread(self.fp, force=True)
        ref_elem = ds.get(0x00720075)
        elem = DataElement(
            0x00720075,
            "OL",
            b"\x00\x01\x02\x03\x04\x05\x06\x07" b"\x01\x01\x02\x03",
        )
        assert ref_elem == elem

    def test_read_OL_explicit_little(self):
        """Check creation of OL DataElement from byte data works correctly."""
        ds = dcmread(self.fp_ex, force=True)
        ref_elem = ds.get(0x00720075)
        elem = DataElement(
            0x00720075,
            "OL",
            b"\x00\x01\x02\x03\x04\x05\x06\x07" b"\x01\x01\x02\x03",
        )
        assert ref_elem == elem

    def test_read_UC_implicit_little(self):
        """Check creation of DataElement from byte data works correctly."""
        ds = dcmread(self.fp, force=True)
        ref_elem = ds.get(0x00189908)
        elem = DataElement(0x00189908, "UC", ["A", "B", "C"])
        assert ref_elem == elem

        ds = dcmread(self.fp, force=True)
        ref_elem = ds.get(0x00100212)
        elem = DataElement(0x00100212, "UC", "Test")
        assert ref_elem == elem

    def test_read_UC_explicit_little(self):
        """Check creation of DataElement from byte data works correctly."""
        ds = dcmread(self.fp_ex, force=True)
        ref_elem = ds.get(0x00189908)
        elem = DataElement(0x00189908, "UC", ["A", "B", "C"])
        assert ref_elem == elem

        ds = dcmread(self.fp_ex, force=True)
        ref_elem = ds.get(0x00100212)
        elem = DataElement(0x00100212, "UC", "Test")
        assert ref_elem == elem

    def test_read_UR_implicit_little(self):
        """Check creation of DataElement from byte data works correctly."""
        ds = dcmread(self.fp, force=True)
        ref_elem = ds.get(0x00080120)  # URNCodeValue
        elem = DataElement(0x00080120, "UR", "http://test.com")
        assert ref_elem == elem

        # Test trailing spaces ignored
        ref_elem = ds.get(0x00081190)  # RetrieveURL
        elem = DataElement(0x00081190, "UR", "ftp://test.com")
        assert ref_elem == elem

    def test_read_UR_explicit_little(self):
        """Check creation of DataElement from byte data works correctly."""
        ds = dcmread(self.fp_ex, force=True)
        ref_elem = ds.get(0x00080120)  # URNCodeValue
        elem = DataElement(0x00080120, "UR", "http://test.com")
        assert ref_elem == elem

        # Test trailing spaces ignored
        ref_elem = ds.get(0x00081190)  # RetrieveURL
        elem = DataElement(0x00081190, "UR", "ftp://test.com")
        assert ref_elem == elem

    def test_read_AE(self):
        """Check creation of AE DataElement from byte data works correctly."""
        ds = dcmread(self.fp, force=True)
        assert "TEST  12" == ds.DestinationAE

        # Test multivalue read correctly
        ds.DestinationAE = ["TEST  12  ", "  TEST2", "   TEST 3  "]

        fp = BytesIO()
        ds.save_as(fp, write_like_original=True)
        fp.seek(0)
        ds = dcmread(fp, force=True)
        assert ["TEST  12", "TEST2", "TEST 3"] == ds.DestinationAE

    def test_read_OV_implicit_little(self):
        """Check reading element with VR of OV encoded as implicit"""
        ds = dcmread(self.fp, force=True)
        val = (
            b"\x00\x00\x00\x00\x00\x00\x00\x00"
            b"\x01\x02\x03\x04\x05\x06\x07\x08"
        )
        elem = ds["ExtendedOffsetTable"]
        assert "OV" == elem.VR
        assert 0x7FE00001 == elem.tag
        assert val == elem.value

        new = DataElement(0x7FE00001, "OV", val)
        assert elem == new

    def test_read_OV_explicit_little(self):
        """Check reading element with VR of OV encoded as explicit"""
        ds = dcmread(self.fp_ex, force=True)
        val = (
            b"\x00\x00\x00\x00\x00\x00\x00\x00"
            b"\x01\x02\x03\x04\x05\x06\x07\x08"
        )
        elem = ds["ExtendedOffsetTable"]
        assert "OV" == elem.VR
        assert 0x7FE00001 == elem.tag
        assert val == elem.value

        new = DataElement(0x7FE00001, "OV", val)
        assert elem == new

    def test_read_SV_implicit_little(self):
        """Check reading element with VR of SV encoded as implicit"""
        ds = dcmread(self.fp, force=True)
        elem = ds["SVElementMinimum"]
        assert "SV" == elem.VR
        assert 0xFFFE0001 == elem.tag
        assert -(2 ** 63) == elem.value

        new = DataElement(0xFFFE0001, "SV", -(2 ** 63))
        assert elem == new

        elem = ds["SVElementMaximum"]
        assert "SV" == elem.VR
        assert 0xFFFE0002 == elem.tag
        assert 2 ** 63 - 1 == elem.value

        new = DataElement(0xFFFE0002, "SV", 2 ** 63 - 1)
        assert elem == new

    @pytest.mark.skip("No public elements with VR of SV")
    def test_read_SV_explicit_little(self):
        """Check reading element with VR of SV encoded as explicit"""
        ds = dcmread(self.fp_ex, force=True)
        elem = ds["SVElementMinimum"]
        assert "SV" == elem.VR
        assert 0xFFFE0001 == elem.tag
        assert -(2 ** 63) == elem.value

        new = DataElement(0xFFFE0001, "SV", -(2 ** 63))
        assert elem == new

        elem = ds["SVElementMaximum"]
        assert "SV" == elem.VR
        assert 0xFFFE0002 == elem.tag
        assert 2 ** 63 - 1 == elem.value

        new = DataElement(0xFFFE0002, "SV", 2 ** 63 - 1)
        assert elem == new

    def test_read_UV_implicit_little(self):
        """Check reading element with VR of UV encoded as implicit"""
        ds = dcmread(self.fp, force=True)
        elem = ds["UVElementMinimum"]
        assert "UV" == elem.VR
        assert 0xFFFE0003 == elem.tag
        assert 0 == elem.value

        new = DataElement(0xFFFE0003, "UV", 0)
        assert elem == new

        elem = ds["UVElementMaximum"]
        assert "UV" == elem.VR
        assert 0xFFFE0004 == elem.tag
        assert 2 ** 64 - 1 == elem.value

        new = DataElement(0xFFFE0004, "UV", 2 ** 64 - 1)
        assert elem == new

    def test_read_UV_explicit_little(self):
        """Check reading element with VR of UV encoded as explicit"""
        ds = dcmread(self.fp_ex, force=True)
        elem = ds["UVElementMinimum"]
        assert "UV" == elem.VR
        assert 0xFFFE0003 == elem.tag
        assert 0 == elem.value

        new = DataElement(0xFFFE0003, "UV", 0)
        assert elem == new

        elem = ds["UVElementMaximum"]
        assert "UV" == elem.VR
        assert 0xFFFE0004 == elem.tag
        assert 2 ** 64 - 1 == elem.value

        new = DataElement(0xFFFE0004, "UV", 2 ** 64 - 1)
        assert elem == new


class TestDSISnumpy:
    @pytest.fixture(autouse=True)
    def restore_config_values(self):
        orig_IS_numpy = config.use_IS_numpy
        orig_DS_numpy = config.use_DS_numpy
        orig_DS_decimal = config.use_DS_decimal
        yield
        config.use_IS_numpy = orig_IS_numpy
        config.DS_decimal(orig_DS_decimal)
        config.DS_numpy(orig_DS_numpy)

    @pytest.mark.skipif(have_numpy, reason="Testing import error")
    def test_IS_numpy_import_error(self):
        config.use_IS_numpy = True
        rtss = dcmread(rtstruct_name, force=True)
        # no numpy, then trying to use numpy raises error
        with pytest.raises(ImportError):
            rtss.ROIContourSequence[0].ROIDisplayColor  # VR is IS

    @pytest.mark.skipif(not have_numpy, reason="Testing with numpy only")
    def test_IS_numpy_class(self):
        config.use_IS_numpy = True
        rtss = dcmread(rtstruct_name, force=True)
        col = rtss.ROIContourSequence[0].ROIDisplayColor  # VR is IS
        assert isinstance(col, numpy.ndarray)
        assert "int64" == col.dtype

        # Check a conversion with only a single value
        roi_num = rtss.ROIContourSequence[0].ReferencedROINumber
        assert isinstance(roi_num, numpy.int64)

    def test_IS_not_numpy(self):
        """Test class of the object matches the config,
        when the config is changed"""
        config.use_IS_numpy = False
        rtss = dcmread(rtstruct_name, force=True)
        col = rtss.ROIContourSequence[0].ROIDisplayColor  # VR is IS
        assert isinstance(col, MultiValue)

    @pytest.mark.skipif(have_numpy, reason="Testing import error")
    def test_DS_numpy_import_error(self):
        config.use_DS_numpy = True
        rtss = dcmread(rtstruct_name, force=True)
        # no numpy, then trying to use numpy raises error
        with pytest.raises(ImportError):
            rtss.ROIContourSequence[0].ContourSequence[0].ContourData

    @pytest.mark.skipif(not have_numpy, reason="Testing with numpy only")
    def test_DS_numpy_class(self):
        config.use_DS_numpy = True
        rtss = dcmread(rtstruct_name, force=True)
        # ContourData has VR of DS
        cd = rtss.ROIContourSequence[0].ContourSequence[0].ContourData
        assert isinstance(cd, numpy.ndarray)
        assert "float64" == cd.dtype

        # Check conversion with only a single value
        roi_vol = rtss.StructureSetROISequence[0].ROIVolume
        assert isinstance(roi_vol, numpy.float64)

    def test_DS_not_numpy(self):
        """Test class of the object matches the config."""
        config.use_DS_numpy = False
        rtss = dcmread(rtstruct_name, force=True)
        # ContourData has VR of DS
        cd = rtss.ROIContourSequence[0].ContourSequence[0].ContourData
        assert isinstance(cd, MultiValue)

    @pytest.mark.skipif(not have_numpy, reason="numpy not installed")
    def test_DS_conflict_config(self):
        config.DS_numpy(False)
        config.DS_decimal(True)
        with pytest.raises(ValueError):
            config.DS_numpy(True)

    @pytest.mark.skipif(not have_numpy, reason="numpy not installed")
    def test_DS_conflict_config2(self):
        config.DS_numpy(True)
        with pytest.raises(ValueError):
            config.DS_decimal(True)

    @pytest.mark.skipif(not have_numpy, reason="numpy not installed")
    def test_DS_bad_chars(self):
        config.DS_numpy(True)
        with pytest.raises(ValueError):
            values.convert_DS_string(b"123.1b", True)

    @pytest.mark.skipif(not have_numpy, reason="numpy not installed")
    def test_IS_bad_chars(self):
        config.use_IS_numpy = True
        with pytest.raises(ValueError):
            values.convert_IS_string(b"123b", True)

    @pytest.mark.skipif(have_numpy, reason="testing numpy ImportError")
    def test_numpy_import_warning(self):
        config.DS_numpy(True)
        config.use_IS_numpy = True
        with pytest.raises(ImportError):
            values.convert_DS_string(b"123.1", True)
        with pytest.raises(ImportError):
            values.convert_IS_string(b"123", True)


class TestDeferredRead:
    """Test that deferred data element reading (for large size)
    works as expected
    """

    # Copy one of test files and use temporarily, then later remove.
    def setup(self):
        self.testfile_name = ct_name + ".tmp"
        shutil.copyfile(ct_name, self.testfile_name)

    def teardown(self):
        if os.path.exists(self.testfile_name):
            os.remove(self.testfile_name)

    def test_time_check(self):
        """Deferred read warns if file has been modified"""
        ds = dcmread(self.testfile_name, defer_size="2 kB")
        from time import sleep

        sleep(0.1)
        with open(self.testfile_name, "r+") as f:
            f.write("\0")  # "touch" the file

        msg = r"Deferred read warning -- file modification time has changed"
        with pytest.warns(UserWarning, match=msg):
            ds.PixelData

    def test_file_exists(self):
        """Deferred read raises error if file no longer exists."""
        ds = dcmread(self.testfile_name, defer_size=2000)
        os.remove(self.testfile_name)
        with pytest.raises(IOError):
            ds.PixelData

    def test_values_identical(self):
        """Deferred values exactly matches normal read."""
        ds_norm = dcmread(self.testfile_name)
        ds_defer = dcmread(self.testfile_name, defer_size=2000)
        for data_elem in ds_norm:
            tag = data_elem.tag

            if have_numpy and isinstance(data_elem.value, numpy.ndarray):
                assert numpy.allclose(data_elem.value, ds_defer[tag].value)
            else:
                assert data_elem.value == ds_defer[tag].value

    def test_zipped_deferred(self):
        """Deferred values from a gzipped file works."""
        # Arose from issue 103 "Error for defer_size read of gzip file object"
        fobj = gzip.open(gzip_name)
        ds = dcmread(fobj, defer_size=1)
        fobj.close()
        # before the fix, this threw an error as file reading was not in
        # the right place, it was re-opened as a normal file, not a zip file
        ds.InstanceNumber

    def test_filelike_deferred(self):
        """Deferred values work with file-like objects."""
        with open(ct_name, "rb") as fp:
            data = fp.read()
        filelike = io.BytesIO(data)
        dataset = pydicom.dcmread(filelike, defer_size=1024)
        assert 32768 == len(dataset.PixelData)
        # The 'Histogram tables' private data element is also > 1024 bytes so
        # pluck this out to confirm multiple deferred reads work (#1609).
        private_block = dataset.private_block(0x43, 'GEMS_PARM_01')
        assert 2068 == len(private_block[0x29].value)


class TestReadTruncatedFile:
    def testReadFileWithMissingPixelData(self):
        mr = dcmread(truncated_mr_name)
        mr.decode()
        assert "CompressedSamples^MR1" == mr.PatientName
        assert mr.PatientName == mr[0x10, 0x10].value
        DS = pydicom.valuerep.DS

        if have_numpy and config.use_DS_numpy:
            expected = numpy.array([0.3125, 0.3125])
            assert numpy.allclose(mr.PixelSpacing, expected)
        else:
            assert [DS("0.3125"), DS("0.3125")] == mr.PixelSpacing

    @pytest.mark.skipif(
        not have_numpy or have_gdcm_handler,
        reason="Missing numpy or GDCM present",
    )
    def testReadFileWithMissingPixelDataArray(self):
        mr = dcmread(truncated_mr_name)
        mr.decode()
        # Need to escape brackets
        msg = (
            r"The length of the pixel data in the dataset \(8130 bytes\) "
            r"doesn't match the expected length \(8192 bytes\). "
            r"The dataset may be corrupted or there may be an issue with "
            r"the pixel data handler."
        )
        with pytest.raises(ValueError, match=msg):
            mr.pixel_array


class TestFileLike:
    """Test that can read DICOM files with file-like object rather than
    filename
    """

    def test_read_file_given_file_object(self):
        """filereader: can read using already opened file............"""
        f = open(ct_name, "rb")
        ct = dcmread(f)
        # XXX Tests here simply repeat testCT -- perhaps should collapse
        # the code together?
        DS = pydicom.valuerep.DS

        got = ct.ImagePositionPatient
        if have_numpy and config.use_DS_numpy:
            expected = numpy.array([-158.135803, -179.035797, -75.699997])
            assert numpy.allclose(got, expected)
        else:
            expected = [DS("-158.135803"), DS("-179.035797"), DS("-75.699997")]
            assert expected == got

        assert "1.3.6.1.4.1.5962.2" == ct.file_meta.ImplementationClassUID
        value = ct.file_meta[0x2, 0x12].value
        assert ct.file_meta.ImplementationClassUID == value

        assert 128 == ct.Rows
        assert 128 == ct.Columns
        assert 16 == ct.BitsStored
        assert 128 * 128 * 2 == len(ct.PixelData)

        # Should also be able to close the file ourselves without
        # exception raised:
        f.close()

    def test_read_file_given_file_like_object(self):
        """filereader: can read using a file-like (BytesIO) file...."""
        with open(ct_name, "rb") as f:
            file_like = BytesIO(f.read())
        ct = dcmread(file_like)
        # Tests here simply repeat some of testCT test
        got = ct.ImagePositionPatient
        DS = pydicom.valuerep.DS

        if have_numpy and config.use_DS_numpy:
            expected = numpy.array([-158.135803, -179.035797, -75.699997])
            assert numpy.allclose(got, expected)
        else:
            expected = [DS("-158.135803"), DS("-179.035797"), DS("-75.699997")]
            assert expected == got

        assert 128 * 128 * 2 == len(ct.PixelData)

        # Should also be able to close the file ourselves without
        # exception raised:
        file_like.close()


class TestDataElementGenerator:
    """Test filereader.data_element_generator"""

    def test_little_endian_explicit(self):
        """Test reading little endian explicit VR data"""
        # (0010, 0010) PatientName PN 6 ABCDEF
        bytestream = b"\x10\x00\x10\x00" b"PN" b"\x06\x00" b"ABCDEF"
        fp = BytesIO(bytestream)
        # fp, is_implicit_VR, is_little_endian,
        gen = data_element_generator(fp, False, True)
        elem = DataElement(0x00100010, "PN", "ABCDEF")
        assert elem == DataElement_from_raw(next(gen), "ISO_IR 100")

    def test_little_endian_implicit(self):
        """Test reading little endian implicit VR data"""
        # (0010, 0010) PatientName PN 6 ABCDEF
        bytestream = b"\x10\x00\x10\x00" b"\x06\x00\x00\x00" b"ABCDEF"
        fp = BytesIO(bytestream)
        gen = data_element_generator(
            fp, is_implicit_VR=True, is_little_endian=True
        )
        elem = DataElement(0x00100010, "PN", "ABCDEF")
        assert elem == DataElement_from_raw(next(gen), "ISO_IR 100")

    def test_big_endian_explicit(self):
        """Test reading big endian explicit VR data"""
        # (0010, 0010) PatientName PN 6 ABCDEF
        bytestream = b"\x00\x10\x00\x10" b"PN" b"\x00\x06" b"ABCDEF"
        fp = BytesIO(bytestream)
        # fp, is_implicit_VR, is_little_endian,
        gen = data_element_generator(fp, False, False)
        elem = DataElement(0x00100010, "PN", "ABCDEF")
        assert elem == DataElement_from_raw(next(gen), "ISO_IR 100")


def test_read_dicomdir_deprecated():
    """Test deprecation warning for read_dicomdir()."""
    msg = (
        r"'read_dicomdir\(\)' is deprecated and will be removed in v3.0, use "
        r"'dcmread\(\)' instead"
    )
    with pytest.warns(DeprecationWarning, match=msg):
        ds = read_dicomdir(get_testdata_file("DICOMDIR"))


def test_read_file_deprecated():
    """Test deprecation warning for read_file()."""
    if sys.version_info[:2] < (3, 7):
        from pydicom.filereader import read_file
    else:
        msg = (
            r"'read_file' is deprecated and will be removed in v3.0, use "
            r"'dcmread' instead"
        )
        with pytest.warns(DeprecationWarning, match=msg):
            from pydicom.filereader import read_file

    assert read_file == dcmread

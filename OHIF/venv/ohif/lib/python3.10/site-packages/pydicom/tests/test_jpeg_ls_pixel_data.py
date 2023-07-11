# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Unit tests for the JPEG-LS Pixel Data handler."""

import os
import sys

import pytest

import pydicom
from pydicom.filereader import dcmread
from pydicom.data import get_testdata_file

jpeg_ls_missing_message = ("jpeg_ls is not available "
                           "in this test environment")
jpeg_ls_present_message = "jpeg_ls is being tested"

from pydicom.pixel_data_handlers import numpy_handler
have_numpy_handler = numpy_handler.is_available()

from pydicom.pixel_data_handlers import jpeg_ls_handler
have_jpeg_ls_handler = jpeg_ls_handler.is_available()

test_jpeg_ls_decoder = have_numpy_handler and have_jpeg_ls_handler

empty_number_tags_name = get_testdata_file(
    "reportsi_with_empty_number_tags.dcm")
rtplan_name = get_testdata_file("rtplan.dcm")
rtdose_name = get_testdata_file("rtdose.dcm")
ct_name = get_testdata_file("CT_small.dcm")
mr_name = get_testdata_file("MR_small.dcm")
truncated_mr_name = get_testdata_file("MR_truncated.dcm")
jpeg2000_name = get_testdata_file("JPEG2000.dcm")
jpeg2000_lossless_name = get_testdata_file(
    "MR_small_jp2klossless.dcm")
jpeg_ls_lossless_name = get_testdata_file(
    "MR_small_jpeg_ls_lossless.dcm")
jpeg_lossy_name = get_testdata_file("JPEG-lossy.dcm")
jpeg_lossless_name = get_testdata_file("JPEG-LL.dcm")
deflate_name = get_testdata_file("image_dfl.dcm")
rtstruct_name = get_testdata_file("rtstruct.dcm")
priv_SQ_name = get_testdata_file("priv_SQ.dcm")
nested_priv_SQ_name = get_testdata_file("nested_priv_SQ.dcm")
meta_missing_tsyntax_name = get_testdata_file(
    "meta_missing_tsyntax.dcm")
no_meta_group_length = get_testdata_file(
    "no_meta_group_length.dcm")
gzip_name = get_testdata_file("zipMR.gz")
color_px_name = get_testdata_file("color-px.dcm")
color_pl_name = get_testdata_file("color-pl.dcm")
explicit_vr_le_no_meta = get_testdata_file(
    "ExplVR_LitEndNoMeta.dcm")
explicit_vr_be_no_meta = get_testdata_file(
    "ExplVR_BigEndNoMeta.dcm")
emri_name = get_testdata_file("emri_small.dcm")
emri_big_endian_name = get_testdata_file(
    "emri_small_big_endian.dcm")
emri_jpeg_ls_lossless = get_testdata_file(
    "emri_small_jpeg_ls_lossless.dcm")
emri_jpeg_2k_lossless = get_testdata_file(
    "emri_small_jpeg_2k_lossless.dcm")
color_3d_jpeg_baseline = get_testdata_file(
    "color3d_jpeg_baseline.dcm")
dir_name = os.path.dirname(sys.argv[0])
save_dir = os.getcwd()

SUPPORTED_HANDLER_NAMES = (
    'jpegls', 'jpeg_ls', 'JPEG_LS', 'jpegls_handler', 'JPEG_LS_Handler'
)

class TestJPEGLS_no_jpeg_ls:
    def setup(self):
        self.jpeg_ls_lossless = dcmread(jpeg_ls_lossless_name)
        self.mr_small = dcmread(mr_name)
        self.emri_jpeg_ls_lossless = dcmread(emri_jpeg_ls_lossless)
        self.emri_small = dcmread(emri_name)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def test_JPEG_LS_PixelArray(self):
        with pytest.raises((RuntimeError, NotImplementedError)):
            self.jpeg_ls_lossless.pixel_array


class TestJPEGLS_JPEG2000_no_jpeg_ls:
    def setup(self):
        self.jpeg_2k = dcmread(jpeg2000_name)
        self.jpeg_2k_lossless = dcmread(jpeg2000_lossless_name)
        self.mr_small = dcmread(mr_name)
        self.emri_jpeg_2k_lossless = dcmread(emri_jpeg_2k_lossless)
        self.emri_small = dcmread(emri_name)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def test_JPEG2000PixelArray(self):
        """JPEG2000: Now works"""
        with pytest.raises(NotImplementedError):
            self.jpeg_2k.pixel_array

    def test_emri_JPEG2000PixelArray(self):
        """JPEG2000: Now works"""
        with pytest.raises(NotImplementedError):
            self.emri_jpeg_2k_lossless.pixel_array


class TestJPEGLS_JPEGlossy_no_jpeg_ls:
    def setup(self):
        self.jpeg_lossy = dcmread(jpeg_lossy_name)
        self.color_3d_jpeg = dcmread(color_3d_jpeg_baseline)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def testJPEGlossy(self):
        """JPEG-lossy: Returns correct values for sample data elements"""
        got = self.jpeg_lossy.DerivationCodeSequence[0].CodeMeaning
        assert 'Lossy Compression' == got

    def testJPEGlossyPixelArray(self):
        """JPEG-lossy: Fails gracefully when uncompressed data is asked for"""
        with pytest.raises(NotImplementedError):
            self.jpeg_lossy.pixel_array

    def testJPEGBaselineColor3DPixelArray(self):
        with pytest.raises(NotImplementedError):
            self.color_3d_jpeg.pixel_array


class TestJPEGLS_JPEGlossless_no_jpeg_ls:
    def setup(self):
        self.jpeg_lossless = dcmread(jpeg_lossless_name)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def testJPEGlossless(self):
        """JPEGlossless: Returns correct values for sample data elements"""
        got = self.\
            jpeg_lossless.\
            SourceImageSequence[0].\
            PurposeOfReferenceCodeSequence[0].CodeMeaning
        assert 'Uncompressed predecessor' == got

    def testJPEGlosslessPixelArray(self):
        """JPEGlossless: Fails gracefully when uncompressed data asked for"""
        with pytest.raises(NotImplementedError):
            self.jpeg_lossless.pixel_array


@pytest.mark.skipif(not test_jpeg_ls_decoder, reason=jpeg_ls_missing_message)
class TestJPEGLS_JPEG_LS_with_jpeg_ls:
    def setup(self):
        self.jpeg_ls_lossless = dcmread(jpeg_ls_lossless_name)
        self.mr_small = dcmread(mr_name)
        self.emri_jpeg_ls_lossless = dcmread(emri_jpeg_ls_lossless)
        self.emri_small = dcmread(emri_name)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [jpeg_ls_handler, numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def test_JPEG_LS_PixelArray(self):
        a = self.jpeg_ls_lossless.pixel_array
        b = self.mr_small.pixel_array
        assert b.mean() == a.mean()
        assert a.flags.writeable

    def test_emri_JPEG_LS_PixelArray(self):
        a = self.emri_jpeg_ls_lossless.pixel_array
        b = self.emri_small.pixel_array
        assert b.mean() == a.mean()
        assert a.flags.writeable

    @pytest.mark.parametrize("handler_name", SUPPORTED_HANDLER_NAMES)
    def test_decompress_using_handler(self, handler_name):
        self.emri_jpeg_ls_lossless.decompress(handler_name=handler_name)
        a = self.emri_jpeg_ls_lossless.pixel_array
        b = self.emri_small.pixel_array
        assert b.mean() == a.mean()


@pytest.mark.skipif(not test_jpeg_ls_decoder, reason=jpeg_ls_missing_message)
class TestJPEGLS_JPEG2000_with_jpeg_ls:
    def setup(self):
        self.jpeg_2k = dcmread(jpeg2000_name)
        self.jpeg_2k_lossless = dcmread(jpeg2000_lossless_name)
        self.mr_small = dcmread(mr_name)
        self.emri_jpeg_2k_lossless = dcmread(emri_jpeg_2k_lossless)
        self.emri_small = dcmread(emri_name)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [jpeg_ls_handler, numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def test_JPEG2000PixelArray(self):
        with pytest.raises(NotImplementedError):
            self.jpeg_2k.pixel_array

    def test_emri_JPEG2000PixelArray(self):
        with pytest.raises(NotImplementedError):
            self.emri_jpeg_2k_lossless.pixel_array


@pytest.mark.skipif(not test_jpeg_ls_decoder, reason=jpeg_ls_missing_message)
class TestJPEGLS_JPEGlossy_with_jpeg_ls:
    def setup(self):
        self.jpeg_lossy = dcmread(jpeg_lossy_name)
        self.color_3d_jpeg = dcmread(color_3d_jpeg_baseline)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [jpeg_ls_handler, numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def testJPEGlossy(self):
        """JPEG-lossy: Returns correct values for sample data elements"""
        got = self.jpeg_lossy.DerivationCodeSequence[0].CodeMeaning
        assert 'Lossy Compression' == got

    def testJPEGlossyPixelArray(self):
        with pytest.raises(NotImplementedError):
            self.jpeg_lossy.pixel_array

    def testJPEGBaselineColor3DPixelArray(self):
        with pytest.raises(NotImplementedError):
            self.color_3d_jpeg.pixel_array


@pytest.mark.skipif(not test_jpeg_ls_decoder, reason=jpeg_ls_missing_message)
class TestJPEGLS_JPEGlossless_with_jpeg_ls:
    def setup(self):
        self.jpeg_lossless = dcmread(jpeg_lossless_name)
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [jpeg_ls_handler, numpy_handler]

    def teardown(self):
        pydicom.config.pixel_data_handlers = self.original_handlers

    def testJPEGlossless(self):
        """JPEGlossless: Returns correct values for sample data elements"""
        got = self.\
            jpeg_lossless.\
            SourceImageSequence[0].\
            PurposeOfReferenceCodeSequence[0].CodeMeaning
        assert 'Uncompressed predecessor' == got

    def testJPEGlosslessPixelArray(self):
        """JPEGlossless: Fails gracefully when uncompressed data asked for"""
        with pytest.raises(NotImplementedError):
            self.jpeg_lossless.pixel_array

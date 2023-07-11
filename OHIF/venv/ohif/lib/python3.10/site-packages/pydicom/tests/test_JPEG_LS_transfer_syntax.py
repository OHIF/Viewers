# Copyright 2008-2018 pydicom authors. See LICENSE file for details.

import os
import sys
import pytest
import pydicom
from pydicom.filereader import dcmread
from pydicom.data import get_testdata_file

pillow_missing_message = ("pillow is not available "
                          "in this test environment")
pillow_present_message = "pillow is being tested"
gdcm_missing_message = "GDCM is not available in this test environment"
numpy_missing_message = ("numpy is not available "
                         "in this test environment")
jpeg_ls_missing_message = ("jpeg_ls is not available "
                           "in this test environment")


try:
    import pydicom.pixel_data_handlers.numpy_handler as numpy_handler
    HAVE_NP = numpy_handler.HAVE_NP
except ImportError:
    HAVE_NP = False
    numpy_handler = None

try:
    import pydicom.pixel_data_handlers.pillow_handler as pillow_handler
    HAVE_PIL = pillow_handler.HAVE_PIL
    HAVE_JPEG = pillow_handler.HAVE_JPEG
    HAVE_JPEG2K = pillow_handler.HAVE_JPEG2K
except ImportError:
    HAVE_PIL = False
    pillow_handler = None
    HAVE_JPEG = False
    HAVE_JPEG2K = False

try:
    import pydicom.pixel_data_handlers.jpeg_ls_handler as jpeg_ls_handler
    HAVE_JPEGLS = jpeg_ls_handler.HAVE_JPEGLS
except ImportError:
    jpeg_ls_handler = None
    HAVE_JPEGLS = False

try:
    import pydicom.pixel_data_handlers.gdcm_handler as gdcm_handler
    HAVE_GDCM = gdcm_handler.HAVE_GDCM
except ImportError:
    gdcm_handler = None
    HAVE_GDCM = False

mr_name = get_testdata_file("MR_small.dcm")
jpeg_ls_lossless_name = get_testdata_file("MR_small_jpeg_ls_lossless.dcm")
emri_name = get_testdata_file("emri_small.dcm")
emri_jpeg_ls_lossless = get_testdata_file(
    "emri_small_jpeg_ls_lossless.dcm")
dir_name = os.path.dirname(sys.argv[0])
save_dir = os.getcwd()


class Test_JPEG_LS_Lossless_transfer_syntax():
    def setup_method(self, method):
        self.jpeg_ls_lossless = dcmread(jpeg_ls_lossless_name)
        self.mr_small = dcmread(mr_name)
        self.emri_jpeg_ls_lossless = dcmread(emri_jpeg_ls_lossless)
        self.emri_small = dcmread(emri_name)
        self.original_handlers = pydicom.config.pixel_data_handlers

    def teardown_method(self, method):
        pydicom.config.pixel_data_handlers = self.original_handlers

    @pytest.mark.skipif(not HAVE_NP, reason=numpy_missing_message)
    def test_read_mr_with_numpy(self):
        pydicom.config.pixel_data_handlers = [numpy_handler]
        msg = (
            r"Unable to decode pixel data with a transfer syntax UID of "
            r"'1.2.840.10008.1.2.4.80' \(JPEG-LS Lossless Image Compression\) "
            r"as there are no pixel data handlers available."
        )
        with pytest.raises(NotImplementedError, match=msg):
            self.jpeg_ls_lossless.pixel_array

    @pytest.mark.skipif(not HAVE_NP, reason=numpy_missing_message)
    def test_read_emri_with_numpy(self):
        pydicom.config.pixel_data_handlers = [numpy_handler]
        msg = (
            r"Unable to decode pixel data with a transfer syntax UID of "
            r"'1.2.840.10008.1.2.4.80' \(JPEG-LS Lossless Image Compression\) "
            r"as there are no pixel data handlers available."
        )
        with pytest.raises(NotImplementedError, match=msg):
            self.emri_jpeg_ls_lossless.pixel_array

    @pytest.mark.skipif(not HAVE_PIL, reason=pillow_missing_message)
    def test_read_mr_with_pillow(self):
        pydicom.config.pixel_data_handlers = [pillow_handler]
        msg = (
            r"Unable to decode pixel data with a transfer syntax UID of "
            r"'1.2.840.10008.1.2.4.80' \(JPEG-LS Lossless Image Compression\) "
            r"as there are no pixel data handlers available."
        )
        with pytest.raises(NotImplementedError, match=msg):
            self.jpeg_ls_lossless.pixel_array

    @pytest.mark.skipif(not HAVE_PIL, reason=pillow_missing_message)
    def test_read_emri_with_pillow(self):
        pydicom.config.pixel_data_handlers = [pillow_handler]
        msg = (
            r"Unable to decode pixel data with a transfer syntax UID of "
            r"'1.2.840.10008.1.2.4.80' \(JPEG-LS Lossless Image Compression\) "
            r"as there are no pixel data handlers available."
        )
        with pytest.raises(NotImplementedError, match=msg):
            self.emri_jpeg_ls_lossless.pixel_array

    @pytest.mark.skipif(not HAVE_GDCM, reason=gdcm_missing_message)
    def test_read_mr_with_gdcm(self):
        pydicom.config.pixel_data_handlers = [numpy_handler, gdcm_handler]
        a = self.jpeg_ls_lossless.pixel_array
        b = self.mr_small.pixel_array
        assert a.mean() == b.mean(), \
            "using GDCM Decoded pixel data is not " \
            "all {0} (mean == {1})".format(b.mean(), a.mean())

    @pytest.mark.skipif(not HAVE_GDCM, reason=gdcm_missing_message)
    def test_read_emri_with_gdcm(self):
        pydicom.config.pixel_data_handlers = [numpy_handler, gdcm_handler]
        a = self.emri_jpeg_ls_lossless.pixel_array
        b = self.emri_small.pixel_array
        assert a.mean() == b.mean(), \
            "using GDCM Decoded pixel data is not " \
            "all {0} (mean == {1})".format(b.mean(), a.mean())

    @pytest.mark.skipif(not HAVE_JPEGLS, reason=jpeg_ls_missing_message)
    def test_read_mr_with_jpeg_ls(self):
        pydicom.config.pixel_data_handlers = [numpy_handler, jpeg_ls_handler]
        a = self.jpeg_ls_lossless.pixel_array
        b = self.mr_small.pixel_array
        assert a.mean() == b.mean(), \
            "using jpeg_ls decoded pixel data is not " \
            "all {0} (mean == {1})".format(b.mean(), a.mean())

    @pytest.mark.skipif(not HAVE_JPEGLS, reason=jpeg_ls_missing_message)
    def test_read_emri_with_jpeg_ls(self):
        pydicom.config.pixel_data_handlers = [numpy_handler, jpeg_ls_handler]
        a = self.emri_jpeg_ls_lossless.pixel_array
        b = self.emri_small.pixel_array
        assert a.mean() == b.mean(), \
            "using jpeg_ls decoded pixel data is not all {0} " \
            "(mean == {1})".format(b.mean(), a.mean())

    def test_read_mr_without_any_handler(self):
        pydicom.config.pixel_data_handlers = []
        msg = (
            r"Unable to decode pixel data with a transfer syntax UID of "
            r"'1.2.840.10008.1.2.4.80' \(JPEG-LS Lossless Image Compression\) "
            r"as there are no pixel data handlers available."
        )
        with pytest.raises(NotImplementedError, match=msg):
            self.jpeg_ls_lossless.pixel_array

    def test_read_emri_without_any_handler(self):
        pydicom.config.pixel_data_handlers = []
        msg = (
            r"Unable to decode pixel data with a transfer syntax UID of "
            r"'1.2.840.10008.1.2.4.80' \(JPEG-LS Lossless Image Compression\) "
            r"as there are no pixel data handlers available."
        )
        with pytest.raises(NotImplementedError, match=msg):
            self.emri_jpeg_ls_lossless.pixel_array

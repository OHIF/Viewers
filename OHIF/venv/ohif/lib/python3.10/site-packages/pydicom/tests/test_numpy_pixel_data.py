# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Tests for the pixel_data_handlers.numpy_handler module.

There are the following possibilities:

* numpy is not available and
  * the numpy handler is not available
  * the numpy handler is available
* numpy is available and
  * the numpy handler is not available
  * the numpy handler is available

**Supported transfer syntaxes**

* 1.2.840.10008.1.2 : Implicit VR Little Endian
* 1.2.840.10008.1.2.1 : Explicit VR Little Endian
* 1.2.840.10008.1.2.1.99 : Deflated Explicit VR Little Endian
* 1.2.840.10008.1.2.2 : Explicit VR Big Endian

**Elements affecting the handler**

* PixelRepresentation
* BitsAllocated
* SamplesPerPixel
* NumberOfFrames
* PlanarConfiguration
"""

from copy import deepcopy

import pytest

from pydicom import config
from pydicom.data import get_testdata_file
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.filereader import dcmread
from pydicom.pixel_data_handlers.util import convert_color_space
from pydicom.uid import (
    ImplicitVRLittleEndian,
    ExplicitVRLittleEndian,
    DeflatedExplicitVRLittleEndian,
    ExplicitVRBigEndian,
    AllTransferSyntaxes,
)

try:
    import numpy as np

    HAVE_NP = True
except ImportError:
    HAVE_NP = False

try:
    from pydicom.pixel_data_handlers import numpy_handler as NP_HANDLER
    from pydicom.pixel_data_handlers.numpy_handler import (
        get_pixeldata,
        unpack_bits,
        pack_bits,
    )
except ImportError:
    NP_HANDLER = None

# Paths to the test datasets
# IMPL: Implicit VR Little Endian
# EXPL: Explicit VR Little Endian
# DEFL: Deflated Explicit VR Little Endian
# EXPB: Explicit VR Big Endian
# 1/1, 1 sample/pixel, 1 frame
EXPL_1_1_1F = get_testdata_file("liver_1frame.dcm")
EXPB_1_1_1F = get_testdata_file("liver_expb_1frame.dcm")
# 1/1, 1 sample/pixel, 3 frame
EXPL_1_1_3F = get_testdata_file("liver.dcm")
EXPB_1_1_3F = get_testdata_file("liver_expb.dcm")
# 1/1, 3 sample/pixel, 1 frame
EXPL_1_3_1F = None
EXPB_1_3_1F = None
# 1/1, 3 sample/pixel, XXX frame
EXPL_1_3_XF = None
EXPB_1_3_XF = None
# 8/8, 1 sample/pixel, 1 frame
DEFL_8_1_1F = get_testdata_file("image_dfl.dcm")
EXPL_8_1_1F = get_testdata_file("OBXXXX1A.dcm")
EXPB_8_1_1F = get_testdata_file("OBXXXX1A_expb.dcm")
# 8/8, 1 sample/pixel, 2 frame
EXPL_8_1_2F = get_testdata_file("OBXXXX1A_2frame.dcm")
EXPB_8_1_2F = get_testdata_file("OBXXXX1A_expb_2frame.dcm")
# 8/8, 3 sample/pixel, 1 frame
EXPL_8_3_1F = get_testdata_file("SC_rgb.dcm")
EXPB_8_3_1F = get_testdata_file("SC_rgb_expb.dcm")
# 8/8, 3 samples/pixel, 1 frame, 3 x 3
EXPL_8_3_1F_ODD = get_testdata_file('SC_rgb_small_odd.dcm')
# 8/8, 3 sample/pixel, 1 frame, YBR_FULL_422
EXPL_8_3_1F_YBR422 = get_testdata_file('SC_ybr_full_422_uncompressed.dcm')
# 8/8, 3 sample/pixel, 1 frame, YBR_FULL
EXPL_8_3_1F_YBR = get_testdata_file('SC_ybr_full_uncompressed.dcm')
# 8/8, 3 sample/pixel, 2 frame
EXPL_8_3_2F = get_testdata_file("SC_rgb_2frame.dcm")
EXPB_8_3_2F = get_testdata_file("SC_rgb_expb_2frame.dcm")
# 16/16, 1 sample/pixel, 1 frame
IMPL_16_1_1F = get_testdata_file("MR_small_implicit.dcm")
EXPL_16_1_1F = get_testdata_file("MR_small.dcm")
EXPB_16_1_1F = get_testdata_file("MR_small_expb.dcm")
# Pixel Data with 128 bytes trailing padding
EXPL_16_1_1F_PAD = get_testdata_file("MR_small_padded.dcm")
# 16/12, 1 sample/pixel, 10 frame
EXPL_16_1_10F = get_testdata_file("emri_small.dcm")
EXPB_16_1_10F = get_testdata_file("emri_small_big_endian.dcm")
# 16/16, 3 sample/pixel, 1 frame
EXPL_16_3_1F = get_testdata_file("SC_rgb_16bit.dcm")
EXPB_16_3_1F = get_testdata_file("SC_rgb_expb_16bit.dcm")
# 16/16, 3 sample/pixel, 2 frame
EXPL_16_3_2F = get_testdata_file("SC_rgb_16bit_2frame.dcm")
EXPB_16_3_2F = get_testdata_file("SC_rgb_expb_16bit_2frame.dcm")
# 32/32, 1 sample/pixel, 1 frame
IMPL_32_1_1F = get_testdata_file("rtdose_1frame.dcm")
EXPB_32_1_1F = get_testdata_file("rtdose_expb_1frame.dcm")
# 32/32, 1 sample/pixel, 15 frame
IMPL_32_1_15F = get_testdata_file("rtdose.dcm")
EXPB_32_1_15F = get_testdata_file("rtdose_expb.dcm")
# 32/32, 3 sample/pixel, 1 frame
EXPL_32_3_1F = get_testdata_file("SC_rgb_32bit.dcm")
EXPB_32_3_1F = get_testdata_file("SC_rgb_expb_32bit.dcm")
# 32/32, 3 sample/pixel, 2 frame
EXPL_32_3_2F = get_testdata_file("SC_rgb_32bit_2frame.dcm")
EXPB_32_3_2F = get_testdata_file("SC_rgb_expb_32bit_2frame.dcm")

# Transfer syntaxes supported by other handlers
# JPEG Baseline (Process 1)
JPEG_BASELINE_1 = get_testdata_file("SC_rgb_jpeg_dcmtk.dcm")
# JPEG Baseline (Process 2 and 4)
JPEG_EXTENDED_2 = get_testdata_file("JPEG-lossy.dcm")
# JPEG Lossless (Process 14)
JPEG_LOSSLESS_14 = None
# JPEG Lossless (Process 14, Selection Value 1)
JPEG_LOSSLESS_14_1 = get_testdata_file("SC_rgb_jpeg_gdcm.dcm")
# JPEG-LS Lossless
JPEG_LS_LOSSLESS = get_testdata_file("MR_small_jpeg_ls_lossless.dcm")
# JPEG-LS Lossy
JPEG_LS_LOSSY = None
# JPEG2k Lossless
JPEG_2K_LOSSLESS = get_testdata_file("emri_small_jpeg_2k_lossless.dcm")
# JPEG2k
JPEG_2K = get_testdata_file("JPEG2000.dcm")
# RLE Lossless
RLE = get_testdata_file("MR_small_RLE.dcm")
# No Image Pixel module
NO_PIXEL = get_testdata_file("rtplan.dcm")


# Transfer Syntaxes (non-retired + Explicit VR Big Endian)
SUPPORTED_SYNTAXES = [
    ImplicitVRLittleEndian,
    ExplicitVRLittleEndian,
    DeflatedExplicitVRLittleEndian,
    ExplicitVRBigEndian
]
UNSUPPORTED_SYNTAXES = list(
    set(AllTransferSyntaxes) ^ set(SUPPORTED_SYNTAXES)
)


def test_unsupported_syntaxes():
    """Test that UNSUPPORTED_SYNTAXES is as expected."""
    for syntax in SUPPORTED_SYNTAXES:
        assert syntax not in UNSUPPORTED_SYNTAXES


REFERENCE_DATA_UNSUPPORTED = [
    (JPEG_BASELINE_1, ('1.2.840.10008.1.2.4.50', 'Lestrade^G')),
    (JPEG_EXTENDED_2, ('1.2.840.10008.1.2.4.51', 'CompressedSamples^NM1')),
    # (JPEG_LOSSLESS_14, ('1.2.840.10008.1.2.4.57')),  # No dataset available
    (JPEG_LOSSLESS_14_1, ('1.2.840.10008.1.2.4.70', 'Lestrade^G')),
    (JPEG_LS_LOSSLESS, ('1.2.840.10008.1.2.4.80', 'CompressedSamples^MR1')),
    # (JPEG_LS_LOSSY, ('1.2.840.10008.1.2.4.81')),  # No dataset available
    (JPEG_2K_LOSSLESS, ('1.2.840.10008.1.2.4.90', '')),
    (JPEG_2K, ('1.2.840.10008.1.2.4.91', 'CompressedSamples^NM1')),
    (RLE, ('1.2.840.10008.1.2.5', 'CompressedSamples^MR1')),
]

SUPPORTED_HANDLER_NAMES = (
    'numpy', 'NumPy', 'np', 'np_handler', 'numpy_handler'
)

# Numpy and the numpy handler are unavailable
@pytest.mark.skipif(HAVE_NP, reason='Numpy is available')
class TestNoNumpy_NoNumpyHandler:
    """Tests for handling datasets without numpy and the handler."""

    def setup(self):
        """Setup the environment."""
        self.original_handlers = config.pixel_data_handlers
        config.pixel_data_handlers = []

    def teardown(self):
        """Restore the environment."""
        config.pixel_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert not HAVE_NP
        assert NP_HANDLER is not None

    def test_can_access_supported_dataset(self):
        """Test that we can read and access elements in dataset."""
        # Explicit little
        ds = dcmread(EXPL_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

        # Implicit little
        ds = dcmread(IMPL_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

        # Deflated little
        ds = dcmread(DEFL_8_1_1F)
        assert '^^^^' == ds.PatientName
        assert 262144 == len(ds.PixelData)

        # Explicit big
        ds = dcmread(EXPB_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

    @pytest.mark.parametrize("fpath,data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    def test_pixel_array_raises(self):
        """Test pixel_array raises exception for all syntaxes."""
        ds = dcmread(EXPL_16_1_1F)
        for uid in AllTransferSyntaxes:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises(NotImplementedError,
                               match="UID of '{}'".format(uid)):
                ds.pixel_array

    def test_using_numpy_handler_raises(self):
        ds = dcmread(EXPL_16_1_1F)
        msg = ("The pixel data handler 'numpy' is not available on your "
               "system. Please refer to the pydicom documentation*")
        with pytest.raises(RuntimeError, match=msg):
            ds.decompress('numpy')


# Numpy unavailable and the numpy handler is available
@pytest.mark.skipif(HAVE_NP, reason='Numpy is available')
class TestNoNumpy_NumpyHandler:
    """Tests for handling datasets without numpy and the handler."""

    def setup(self):
        """Setup the environment."""
        self.original_handlers = config.pixel_data_handlers
        config.pixel_data_handlers = [NP_HANDLER]

    def teardown(self):
        """Restore the environment."""
        config.pixel_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert not HAVE_NP
        assert NP_HANDLER is not None

    def test_can_access_supported_dataset(self):
        """Test that we can read and access elements in dataset."""
        # Explicit little
        ds = dcmread(EXPL_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

        # Implicit little
        ds = dcmread(IMPL_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

        # Deflated little
        ds = dcmread(DEFL_8_1_1F)
        assert '^^^^' == ds.PatientName
        assert 262144 == len(ds.PixelData)

        # Explicit big
        ds = dcmread(EXPB_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

    @pytest.mark.parametrize("fpath,data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    def test_unsupported_pixel_array_raises(self):
        """Test pixel_array raises exception for unsupported syntaxes."""
        ds = dcmread(EXPL_16_1_1F)
        for uid in UNSUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises(NotImplementedError,
                               match="UID of '{}'".format(uid)):
                ds.pixel_array

    def test_supported_pixel_array_raises(self):
        """Test pixel_array raises exception for supported syntaxes."""
        ds = dcmread(EXPL_16_1_1F)
        for uid in SUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            exc_msg = (
                r"The following handlers are available to decode the pixel "
                r"data however they are missing required dependencies: "
                r"Numpy \(req. NumPy\)"
            )
            with pytest.raises(RuntimeError, match=exc_msg):
                ds.pixel_array


# Numpy is available, the numpy handler is unavailable
@pytest.mark.skipif(not HAVE_NP, reason='Numpy is unavailable')
class TestNumpy_NoNumpyHandler:
    """Tests for handling datasets without the handler."""

    def setup(self):
        """Setup the environment."""
        self.original_handlers = config.pixel_data_handlers
        config.pixel_data_handlers = []

    def teardown(self):
        """Restore the environment."""
        config.pixel_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert HAVE_NP
        # We numpy handler should still be available
        assert NP_HANDLER is not None

    def test_can_access_supported_dataset(self):
        """Test that we can read and access elements in dataset."""
        # Explicit little
        ds = dcmread(EXPL_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

        # Implicit little
        ds = dcmread(IMPL_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

        # Deflated little
        ds = dcmread(DEFL_8_1_1F)
        assert '^^^^' == ds.PatientName
        assert 262144 == len(ds.PixelData)

        # Explicit big
        ds = dcmread(EXPB_16_1_1F)
        assert 'CompressedSamples^MR1' == ds.PatientName
        assert 8192 == len(ds.PixelData)

    @pytest.mark.parametrize("fpath,data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    def test_pixel_array_raises(self):
        """Test pixel_array raises exception for all syntaxes."""
        ds = dcmread(EXPL_16_1_1F)
        for uid in AllTransferSyntaxes:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises((NotImplementedError, RuntimeError)):
                ds.pixel_array


# Numpy and the numpy handler are available
MATCHING_DATASETS = [
    (EXPL_1_1_1F, EXPB_1_1_1F),
    (EXPL_1_1_3F, EXPB_1_1_3F),
    (EXPL_8_1_1F, EXPB_8_1_1F),
    (EXPL_8_1_2F, EXPB_8_1_2F),
    (EXPL_8_3_1F, EXPB_8_3_1F),
    (EXPL_8_3_2F, EXPB_8_3_2F),
    (EXPL_16_1_1F, EXPB_16_1_1F),
    (EXPL_16_1_10F, EXPB_16_1_10F),
    (EXPL_16_3_1F, EXPB_16_3_1F),
    (EXPL_16_3_2F, EXPB_16_3_2F),
    (IMPL_32_1_1F, EXPB_32_1_1F),
    (IMPL_32_1_15F, EXPB_32_1_15F),
    (EXPL_32_3_1F, EXPB_32_3_1F),
    (EXPL_32_3_2F, EXPB_32_3_2F)
]

EXPL = ExplicitVRLittleEndian
IMPL = ImplicitVRLittleEndian
REFERENCE_DATA_LITTLE = [
    # fpath, (syntax, bits, nr samples, pixel repr, nr frames, shape, dtype)
    (EXPL_1_1_1F, (EXPL, 1, 1, 0, 1, (512, 512), 'uint8')),
    (EXPL_1_1_3F, (EXPL, 1, 1, 0, 3, (3, 512, 512), 'uint8')),
    (EXPL_8_1_1F, (EXPL, 8, 1, 0, 1, (600, 800), 'uint8')),
    (EXPL_8_3_1F_ODD, (EXPL, 8, 3, 0, 1, (3, 3, 3), 'uint8')),
    (EXPL_8_3_1F_YBR422, (EXPL, 8, 3, 0, 1, (100, 100, 3), 'uint8')),
    (EXPL_8_1_2F, (EXPL, 8, 1, 0, 2, (2, 600, 800), 'uint8')),
    (EXPL_8_3_1F, (EXPL, 8, 3, 0, 1, (100, 100, 3), 'uint8')),
    (EXPL_8_3_2F, (EXPL, 8, 3, 0, 2, (2, 100, 100, 3), 'uint8')),
    (EXPL_16_1_1F, (EXPL, 16, 1, 1, 1, (64, 64), 'int16')),
    (EXPL_16_1_10F, (EXPL, 16, 1, 0, 10, (10, 64, 64), 'uint16')),
    (EXPL_16_3_1F, (EXPL, 16, 3, 0, 1, (100, 100, 3), 'uint16')),
    (EXPL_16_3_2F, (EXPL, 16, 3, 0, 2, (2, 100, 100, 3), 'uint16')),
    (IMPL_32_1_1F, (IMPL, 32, 1, 0, 1, (10, 10), 'uint32')),
    (IMPL_32_1_15F, (IMPL, 32, 1, 0, 15, (15, 10, 10), 'uint32')),
    (EXPL_32_3_1F, (EXPL, 32, 3, 0, 1, (100, 100, 3), 'uint32')),
    (EXPL_32_3_2F, (EXPL, 32, 3, 0, 2, (2, 100, 100, 3), 'uint32')),
]


@pytest.mark.skipif(not HAVE_NP, reason='Numpy is not available')
class TestNumpy_NumpyHandler:
    """Tests for handling Pixel Data with the handler."""

    def setup(self):
        """Setup the test datasets and the environment."""
        self.original_handlers = config.pixel_data_handlers
        config.pixel_data_handlers = [NP_HANDLER]

    def teardown(self):
        """Restore the environment."""
        config.pixel_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert HAVE_NP
        assert NP_HANDLER is not None

    def test_unsupported_syntax_raises(self):
        """Test pixel_array raises exception for unsupported syntaxes."""
        ds = dcmread(EXPL_16_1_1F)

        for uid in UNSUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises((NotImplementedError, RuntimeError)):
                ds.pixel_array

    def test_dataset_pixel_array_handler_needs_convert(self):
        """Test Dataset.pixel_array when converting to RGB."""
        ds = dcmread(EXPL_8_3_1F)
        # Convert to YBR first
        arr = ds.pixel_array
        assert (255, 0, 0) == tuple(arr[5, 50, :])
        arr = convert_color_space(arr, 'RGB', 'YBR_FULL')
        ds.PixelData = arr.tobytes()
        del ds._pixel_array  # Weird PyPy2 issue without this

        # Test normal functioning (False)
        assert (76, 85, 255) == tuple(ds.pixel_array[5, 50, :])

        def needs_convert(ds):
            """Change the default return to True"""
            return True

        # Test modified
        orig_fn = NP_HANDLER.needs_to_convert_to_RGB
        NP_HANDLER.needs_to_convert_to_RGB = needs_convert

        # Ensure the pixel array gets updated
        ds._pixel_id = None
        assert (254, 0, 0) == tuple(ds.pixel_array[5, 50, :])

        # Reset
        NP_HANDLER.needs_to_convert_to_RGB = orig_fn

    def test_dataset_pixel_array_no_pixels(self):
        """Test good exception message if no pixel data in dataset."""
        ds = dcmread(NO_PIXEL)
        msg = (
            r"Unable to convert the pixel data: one of Pixel Data, Float "
            r"Pixel Data or Double Float Pixel Data must be present in the "
            r"dataset"
        )
        with pytest.raises(AttributeError, match=msg):
            ds.pixel_array

    @pytest.mark.parametrize("fpath, data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    def test_pixel_array_8bit_un_signed(self):
        """Test pixel_array for 8-bit unsigned -> signed data."""
        ds = dcmread(EXPL_8_1_1F)
        # 0 is unsigned int, 1 is 2's complement
        assert ds.PixelRepresentation == 0
        ds.PixelRepresentation = 1
        arr = ds.pixel_array
        ref = dcmread(EXPL_8_1_1F)

        assert not np.array_equal(arr, ref.pixel_array)
        assert (600, 800) == arr.shape
        assert -12 == arr[0].min() == arr[0].max()
        assert (1, -10, 1) == tuple(arr[300, 491:494])
        assert 0 == arr[-1].min() == arr[-1].max()

    @pytest.mark.parametrize("handler_name", SUPPORTED_HANDLER_NAMES)
    def test_decompress_using_handler(self, handler_name):
        """Test different possibilities for the numpy handler name."""
        ds = dcmread(EXPL_8_1_1F)
        ds.decompress(handler_name)
        assert (600, 800) == ds.pixel_array.shape
        assert 244 == ds.pixel_array[0].min() == ds.pixel_array[0].max()
        assert (1, 246, 1) == tuple(ds.pixel_array[300, 491:494])
        assert 0 == ds.pixel_array[-1].min() == ds.pixel_array[-1].max()

    def test_pixel_array_16bit_un_signed(self):
        """Test pixel_array for 16-bit unsigned -> signed."""
        ds = dcmread(EXPL_16_3_1F)
        # 0 is unsigned int, 1 is 2's complement
        assert ds.PixelRepresentation == 0
        ds.PixelRepresentation = 1
        arr = ds.pixel_array
        ref = dcmread(EXPL_16_3_1F)

        assert not np.array_equal(arr, ref.pixel_array)
        assert (100, 100, 3) == arr.shape
        assert -1 == arr[0, :, 0].min() == arr[0, :, 0].max()
        assert -32640 == arr[50, :, 0].min() == arr[50, :, 0].max()

    def test_pixel_array_32bit_un_signed(self):
        """Test pixel_array for 32-bit unsigned -> signed."""
        ds = dcmread(EXPL_32_3_1F)
        # 0 is unsigned int, 1 is 2's complement
        assert ds.PixelRepresentation == 0
        ds.PixelRepresentation = 1
        arr = ds.pixel_array
        ref = dcmread(EXPL_32_3_1F)

        assert not np.array_equal(arr, ref.pixel_array)
        assert (100, 100, 3) == arr.shape
        assert -1 == arr[0, :, 0].min() == arr[0, :, 0].max()
        assert -2139062144 == arr[50, :, 0].min() == arr[50, :, 0].max()

    # Endian independent datasets
    def test_8bit_1sample_1frame(self):
        """Test pixel_array for 8-bit, 1 sample/pixel, 1 frame."""
        # Check supported syntaxes
        ds = dcmread(EXPL_8_1_1F)
        for uid in SUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert (600, 800) == arr.shape
            assert 244 == arr[0].min() == arr[0].max()
            assert (1, 246, 1) == tuple(arr[300, 491:494])
            assert 0 == arr[-1].min() == arr[-1].max()

    def test_8bit_1sample_2frame(self):
        """Test pixel_array for 8-bit, 1 sample/pixel, 2 frame."""
        # Check supported syntaxes
        ds = dcmread(EXPL_8_1_2F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert (2, 600, 800) == arr.shape
            # Frame 1
            assert 244 == arr[0, 0].min() == arr[0, 0].max()
            assert (1, 246, 1) == tuple(arr[0, 300, 491:494])
            assert 0 == arr[0, -1].min() == arr[0, -1].max()
            # Frame 2 is frame 1 inverted
            assert np.array_equal((2 ** ds.BitsAllocated - 1) - arr[1], arr[0])

    def test_8bit_3sample_1frame_odd_size(self):
        """Test pixel_array for odd sized (3x3) pixel data."""
        # Check supported syntaxes
        ds = dcmread(EXPL_8_3_1F_ODD)
        for uid in SUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert ds.pixel_array[0].tolist() == [
                [166, 141, 52], [166, 141, 52], [166, 141, 52]
            ]
            assert ds.pixel_array[1].tolist() == [
                [63, 87, 176], [63, 87, 176], [63, 87, 176]
            ]
            assert ds.pixel_array[2].tolist() == [
                [158, 158, 158], [158, 158, 158], [158, 158, 158]
            ]

    def test_8bit_3sample_1frame_ybr422(self):
        """Test pixel_array for YBR_FULL_422 pixel data."""
        ds = dcmread(EXPL_8_3_1F_YBR422)
        assert ds.PhotometricInterpretation == 'YBR_FULL_422'
        arr = ds.pixel_array

        # Check resampling
        assert [
                   [76, 85, 255],
                   [76, 85, 255],
                   [76, 85, 255],
                   [76, 85, 255]
               ] == arr[0:4, 0, :].tolist()
        # Check values
        assert (76, 85, 255) == tuple(arr[5, 50, :])
        assert (166, 106, 193) == tuple(arr[15, 50, :])
        assert (150, 46, 20) == tuple(arr[25, 50, :])
        assert (203, 86, 75) == tuple(arr[35, 50, :])
        assert (29, 255, 107) == tuple(arr[45, 50, :])
        assert (142, 193, 118) == tuple(arr[55, 50, :])
        assert (0, 128, 128) == tuple(arr[65, 50, :])
        assert (64, 128, 128) == tuple(arr[75, 50, :])
        assert (192, 128, 128) == tuple(arr[85, 50, :])
        assert (255, 128, 128) == tuple(arr[95, 50, :])

    def test_8bit_3sample_1frame(self):
        """Test pixel_array for 8-bit, 3 sample/pixel, 1 frame."""
        # Check supported syntaxes
        ds = dcmread(EXPL_8_3_1F)
        for uid in SUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert (255, 0, 0) == tuple(arr[5, 50, :])
            assert (255, 128, 128) == tuple(arr[15, 50, :])
            assert (0, 255, 0) == tuple(arr[25, 50, :])
            assert (128, 255, 128) == tuple(arr[35, 50, :])
            assert (0, 0, 255) == tuple(arr[45, 50, :])
            assert (128, 128, 255) == tuple(arr[55, 50, :])
            assert (0, 0, 0) == tuple(arr[65, 50, :])
            assert (64, 64, 64) == tuple(arr[75, 50, :])
            assert (192, 192, 192) == tuple(arr[85, 50, :])
            assert (255, 255, 255) == tuple(arr[95, 50, :])

    def test_8bit_3sample_2frame(self):
        """Test pixel_array for 8-bit, 3 sample/pixel, 2 frame."""
        # Check supported syntaxes
        ds = dcmread(EXPL_8_3_2F)
        for uid in SUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            # Frame 1
            frame = arr[0]
            assert (255, 0, 0) == tuple(frame[5, 50, :])
            assert (255, 128, 128) == tuple(frame[15, 50, :])
            assert (0, 255, 0) == tuple(frame[25, 50, :])
            assert (128, 255, 128) == tuple(frame[35, 50, :])
            assert (0, 0, 255) == tuple(frame[45, 50, :])
            assert (128, 128, 255) == tuple(frame[55, 50, :])
            assert (0, 0, 0) == tuple(frame[65, 50, :])
            assert (64, 64, 64) == tuple(frame[75, 50, :])
            assert (192, 192, 192) == tuple(frame[85, 50, :])
            assert (255, 255, 255) == tuple(frame[95, 50, :])
            # Frame 2 is frame 1 inverted
            assert np.array_equal((2 ** ds.BitsAllocated - 1) - arr[1], arr[0])

    # Little endian datasets
    @pytest.mark.parametrize('fpath, data', REFERENCE_DATA_LITTLE)
    def test_properties(self, fpath, data):
        """Test dataset and pixel array properties are as expected."""
        ds = dcmread(fpath)
        assert ds.file_meta.TransferSyntaxUID == data[0]
        assert ds.BitsAllocated == data[1]
        assert ds.SamplesPerPixel == data[2]
        assert ds.PixelRepresentation == data[3]
        assert getattr(ds, 'NumberOfFrames', 1) == data[4]

        # Check all little endian syntaxes
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array
            assert data[5] == arr.shape
            assert arr.dtype == data[6]

            # Default to 1 if element not present
            nr_frames = getattr(ds, 'NumberOfFrames', 1)
            # Odd sized data is padded by a final 0x00 byte
            size = ds.Rows * ds.Columns * nr_frames * data[1] / 8 * data[2]
            # YBR_FULL_422 data is 2/3rds usual size
            if ds.PhotometricInterpretation == 'YBR_FULL_422':
                size = size // 3 * 2
            assert len(ds.PixelData) == size + size % 2
            if size % 2:
                assert ds.PixelData[-1] == b'\x00'[0]

    def test_little_1bit_1sample_1frame(self):
        """Test pixel_array for little 1-bit, 1 sample/pixel, 1 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_1_1_1F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert arr.max() == 1
            assert arr.min() == 0

            assert (0, 1, 1) == tuple(arr[155, 180:183])
            assert (1, 0, 1, 0) == tuple(arr[155, 310:314])
            assert (0, 1, 1) == tuple(arr[254, 78:81])
            assert (1, 0, 0, 1, 1, 0) == tuple(arr[254, 304:310])

    def test_little_1bit_1sample_3frame(self):
        """Test pixel_array for little 1-bit, 1 sample/pixel, 3 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_1_1_3F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert arr.max() == 1
            assert arr.min() == 0

            # Frame 1
            assert (0, 1, 1) == tuple(arr[0, 155, 180:183])
            assert (1, 0, 1, 0) == tuple(arr[0, 155, 310:314])
            assert (0, 1, 1) == tuple(arr[0, 254, 78:81])
            assert (1, 0, 0, 1, 1, 0) == tuple(arr[0, 254, 304:310])

            assert 0 == arr[0][0][0]
            assert 0 == arr[2][511][511]
            assert 1 == arr[1][256][256]

            # Frame 2
            assert 0 == arr[1, 146, :254].max()
            assert (0, 1, 1, 1, 1, 1, 0, 1) == tuple(arr[1, 146, 253:261])
            assert 0 == arr[1, 146, 261:].max()

            assert 0 == arr[1, 210, :97].max()
            assert 1 == arr[1, 210, 97:350].max()
            assert 0 == arr[1, 210, 350:].max()

            # Frame 3
            assert 0 == arr[2, 147, :249].max()
            assert (0, 1, 0, 1, 1, 1) == tuple(arr[2, 147, 248:254])
            assert (1, 0, 1, 0, 1, 1) == tuple(arr[2, 147, 260:266])
            assert 0 == arr[2, 147, 283:].max()

            assert 0 == arr[2, 364, :138].max()
            assert (0, 1, 0, 1, 1, 0, 0, 1) == tuple(arr[2, 364, 137:145])
            assert (1, 0, 0, 1, 0) == tuple(arr[2, 364, 152:157])
            assert 0 == arr[2, 364, 157:].max()

    @pytest.mark.skip(reason='No suitable dataset available')
    def test_little_1bit_3sample_1frame(self):
        """Test pixel_array for little 1-bit, 3 sample/pixel, 1 frame."""
        # Check all little endian syntaxes
        ds = dcmread(None)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

    @pytest.mark.skip(reason='No suitable dataset available')
    def test_little_1bit_3sample_10frame(self):
        """Test pixel_array for little 1-bit, 3 sample/pixel, 10 frame."""
        # Check all little endian syntaxes
        ds = dcmread(None)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

    def test_little_16bit_1sample_1frame(self):
        """Test pixel_array for little 16-bit, 1 sample/pixel, 1 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_16_1_1F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert (422, 319, 361) == tuple(arr[0, 31:34])
            assert (366, 363, 322) == tuple(arr[31, :3])
            assert (1369, 1129, 862) == tuple(arr[-1, -3:])
            # Last pixel
            assert 862 == arr[-1, -1]

    def test_little_16bit_1sample_1frame_padded(self):
        """Test with padded little 16-bit, 1 sample/pixel, 1 frame."""
        ds = dcmread(EXPL_16_1_1F_PAD)
        assert ds.file_meta.TransferSyntaxUID == ExplicitVRLittleEndian
        assert ds.BitsAllocated == 16
        assert ds.SamplesPerPixel == 1
        assert ds.PixelRepresentation == 1
        nr_frames = getattr(ds, 'NumberOfFrames', 1)
        assert nr_frames == 1

        # Odd sized data is padded by a final 0x00 byte
        size = ds.Rows * ds.Columns * nr_frames * 16 / 8 * ds.SamplesPerPixel
        # Has excess padding
        assert len(ds.PixelData) > size + size % 2

        msg = (
            r"The length of the pixel data in the dataset \(8320 bytes\) "
            r"indicates it contains excess padding. 128 bytes will be "
            r"removed from the end of the data"
        )
        with pytest.warns(UserWarning, match=msg):
            arr = ds.pixel_array

        assert (64, 64) == arr.shape
        assert arr.dtype == 'int16'

        assert arr.flags.writeable

        assert (422, 319, 361) == tuple(arr[0, 31:34])
        assert (366, 363, 322) == tuple(arr[31, :3])
        assert (1369, 1129, 862) == tuple(arr[-1, -3:])
        # Last pixel
        assert 862 == arr[-1, -1]

    def test_little_16bit_1sample_10frame(self):
        """Test pixel_array for little 16-bit, 1 sample/pixel, 10 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_16_1_10F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            # Frame 1
            assert (206, 197, 159) == tuple(arr[0, 0, 31:34])
            assert (49, 78, 128) == tuple(arr[0, 31, :3])
            assert (362, 219, 135) == tuple(arr[0, -1, -3:])
            # Frame 5
            assert (67, 82, 44) == tuple(arr[4, 0, 31:34])
            assert (37, 41, 17) == tuple(arr[4, 31, :3])
            assert (225, 380, 355) == tuple(arr[4, -1, -3:])
            # Frame 10
            assert (72, 86, 69) == tuple(arr[-1, 0, 31:34])
            assert (25, 4, 9) == tuple(arr[-1, 31, :3])
            assert (227, 300, 147) == tuple(arr[-1, -1, -3:])

    def test_little_16bit_3sample_1frame(self):
        """Test pixel_array for little 16-bit, 3 sample/pixel, 1 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_16_3_1F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert (65535, 0, 0) == tuple(arr[5, 50, :])
            assert (65535, 32896, 32896) == tuple(arr[15, 50, :])
            assert (0, 65535, 0) == tuple(arr[25, 50, :])
            assert (32896, 65535, 32896) == tuple(arr[35, 50, :])
            assert (0, 0, 65535) == tuple(arr[45, 50, :])
            assert (32896, 32896, 65535) == tuple(arr[55, 50, :])
            assert (0, 0, 0) == tuple(arr[65, 50, :])
            assert (16448, 16448, 16448) == tuple(arr[75, 50, :])
            assert (49344, 49344, 49344) == tuple(arr[85, 50, :])
            assert (65535, 65535, 65535) == tuple(arr[95, 50, :])

    def test_little_16bit_3sample_2frame(self):
        """Test pixel_array for little 16-bit, 3 sample/pixel, 2 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_16_3_2F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            # Frame 1
            assert (65535, 0, 0) == tuple(arr[0, 5, 50, :])
            assert (65535, 32896, 32896) == tuple(arr[0, 15, 50, :])
            assert (0, 65535, 0) == tuple(arr[0, 25, 50, :])
            assert (32896, 65535, 32896) == tuple(arr[0, 35, 50, :])
            assert (0, 0, 65535) == tuple(arr[0, 45, 50, :])
            assert (32896, 32896, 65535) == tuple(arr[0, 55, 50, :])
            assert (0, 0, 0) == tuple(arr[0, 65, 50, :])
            assert (16448, 16448, 16448) == tuple(arr[0, 75, 50, :])
            assert (49344, 49344, 49344) == tuple(arr[0, 85, 50, :])
            assert (65535, 65535, 65535) == tuple(arr[0, 95, 50, :])
            # Frame 2 is frame 1 inverted
            assert np.array_equal((2 ** ds.BitsAllocated - 1) - arr[1], arr[0])

    def test_little_32bit_1sample_1frame(self):
        """Test pixel_array for little 32-bit, 1 sample/pixel, 1 frame."""
        # Check all little endian syntaxes
        ds = dcmread(IMPL_32_1_1F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            assert (1249000, 1249000, 1250000) == tuple(arr[0, :3])
            assert (1031000, 1029000, 1027000) == tuple(arr[4, 3:6])
            assert (803000, 801000, 798000) == tuple(arr[-1, -3:])

    def test_little_32bit_1sample_15frame(self):
        """Test pixel_array for little 32-bit, 1 sample/pixel, 15 frame."""
        # Check all little endian syntaxes
        ds = dcmread(IMPL_32_1_15F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            # Frame 1
            assert (1249000, 1249000, 1250000) == tuple(arr[0, 0, :3])
            assert (1031000, 1029000, 1027000) == tuple(arr[0, 4, 3:6])
            assert (803000, 801000, 798000) == tuple(arr[0, -1, -3:])
            # Frame 8
            assert (1253000, 1253000, 1249000) == tuple(arr[7, 0, :3])
            assert (1026000, 1023000, 1022000) == tuple(arr[7, 4, 3:6])
            assert (803000, 803000, 803000) == tuple(arr[7, -1, -3:])
            # Frame 15
            assert (1249000, 1250000, 1251000) == tuple(arr[-1, 0, :3])
            assert (1031000, 1031000, 1031000) == tuple(arr[-1, 4, 3:6])
            assert (801000, 800000, 799000) == tuple(arr[-1, -1, -3:])

    def test_little_32bit_3sample_1frame(self):
        """Test pixel_array for little 32-bit, 3 sample/pixel, 1 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_32_3_1F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            ar = ds.pixel_array

            assert ar.flags.writeable

            assert (4294967295, 0, 0) == tuple(ar[5, 50, :])
            assert (4294967295, 2155905152, 2155905152) == tuple(ar[15, 50, :])
            assert (0, 4294967295, 0) == tuple(ar[25, 50, :])
            assert (2155905152, 4294967295, 2155905152) == tuple(ar[35, 50, :])
            assert (0, 0, 4294967295) == tuple(ar[45, 50, :])
            assert (2155905152, 2155905152, 4294967295) == tuple(ar[55, 50, :])
            assert (0, 0, 0) == tuple(ar[65, 50, :])
            assert (1077952576, 1077952576, 1077952576) == tuple(ar[75, 50, :])
            assert (3233857728, 3233857728, 3233857728) == tuple(ar[85, 50, :])
            assert (4294967295, 4294967295, 4294967295) == tuple(ar[95, 50, :])

    def test_little_32bit_3sample_2frame(self):
        """Test pixel_array for little 32-bit, 3 sample/pixel, 10 frame."""
        # Check all little endian syntaxes
        ds = dcmread(EXPL_32_3_2F)
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid
            arr = ds.pixel_array

            assert arr.flags.writeable

            # Frame 1
            assert (4294967295, 0, 0) == tuple(arr[0, 5, 50, :])
            assert (4294967295, 2155905152, 2155905152) == tuple(
                arr[0, 15, 50, :]
            )
            assert (0, 4294967295, 0) == tuple(arr[0, 25, 50, :])
            assert (2155905152, 4294967295, 2155905152) == tuple(
                arr[0, 35, 50, :]
            )
            assert (0, 0, 4294967295) == tuple(arr[0, 45, 50, :])
            assert (2155905152, 2155905152, 4294967295) == tuple(
                arr[0, 55, 50, :]
            )
            assert (0, 0, 0) == tuple(arr[0, 65, 50, :])
            assert (1077952576, 1077952576, 1077952576) == tuple(
                arr[0, 75, 50, :]
            )
            assert (3233857728, 3233857728, 3233857728) == tuple(
                arr[0, 85, 50, :]
            )
            assert (4294967295, 4294967295, 4294967295) == tuple(
                arr[0, 95, 50, :]
            )
            # Frame 2 is frame 1 inverted
            assert np.array_equal((2 ** ds.BitsAllocated - 1) - arr[1], arr[0])

    def test_little_32bit_float_1frame(self):
        """Test pixel_array for float pixel data, 1 frame."""
        ds = dcmread(IMPL_32_1_1F)
        ds.FloatPixelData = ds.PixelData
        del ds.PixelData
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid

            arr = ds.pixel_array

            assert arr.flags.writeable
            assert (10, 10) == arr.shape
            assert 1.75e-39 == pytest.approx(arr[0, 0], abs=0.01e-39)
            assert 1.44e-39 == pytest.approx(arr[4, 3], abs=0.01e-39)
            assert 1.13e-39 == pytest.approx(arr[-1, -3], abs=0.01e-39)

    def test_little_32bit_float_15frame(self):
        """Test pixel_array for float pixel data, 15 frames."""
        ds = dcmread(IMPL_32_1_15F)
        ds.FloatPixelData = ds.PixelData
        del ds.PixelData
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid

            arr = ds.pixel_array

            assert arr.flags.writeable
            assert (15, 10, 10) == arr.shape
            assert 1.75e-39 == pytest.approx(arr[0, 0, 0], abs=0.01e-39)
            assert 1.44e-39 == pytest.approx(arr[0, 4, 3], abs=0.01e-39)
            assert 1.13e-39 == pytest.approx(arr[0, -1, -3], abs=0.01e-39)

    def test_little_64bit_float_1frame(self):
        """Test pixel_array for double float pixel data, 1 frame."""
        ds = dcmread(IMPL_32_1_1F)
        ds.DoubleFloatPixelData = ds.PixelData + ds.PixelData
        del ds.PixelData
        ds.BitsAllocated = 64
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid

            arr = ds.pixel_array

            assert arr.flags.writeable
            assert (10, 10) == arr.shape
            assert 2.65e-308 == pytest.approx(arr[0, 0], abs=0.01e-308)
            assert 1.80e-308 == pytest.approx(arr[4, 3], abs=0.01e-308)
            assert 1.69e-308 == pytest.approx(arr[-1, -3], abs=0.01e-308)

    def test_little_64bit_float_15frame(self):
        """Test pixel_array for double float pixel data, 15 frames."""
        ds = dcmread(IMPL_32_1_15F)
        ds.DoubleFloatPixelData = ds.PixelData + ds.PixelData
        del ds.PixelData
        ds.BitsAllocated = 64
        for uid in SUPPORTED_SYNTAXES[:3]:
            ds.file_meta.TransferSyntaxUID = uid

            arr = ds.pixel_array

            assert arr.flags.writeable
            assert (15, 10, 10) == arr.shape
            assert 2.65e-308 == pytest.approx(arr[0, 0, 0], abs=0.01e-308)
            assert 1.80e-308 == pytest.approx(arr[0, 4, 3], abs=0.01e-308)
            assert 1.69e-308 == pytest.approx(arr[0, -1, -3], abs=0.01e-308)

    # Big endian datasets
    @pytest.mark.parametrize('little, big', MATCHING_DATASETS)
    def test_big_endian_datasets(self, little, big):
        """Test pixel_array for big endian matches little."""
        ds = dcmread(big)
        assert ds.file_meta.TransferSyntaxUID == ExplicitVRBigEndian
        ref = dcmread(little)
        assert ref.file_meta.TransferSyntaxUID != ExplicitVRBigEndian
        assert np.array_equal(ds.pixel_array, ref.pixel_array)

    # Regression tests
    def test_endianness_not_set(self):
        """Test for #704, Dataset.is_little_endian unset."""
        ds = Dataset()
        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        ds.Rows = 10
        ds.Columns = 10
        ds.BitsAllocated = 16
        ds.BitsStored = 16
        ds.PixelRepresentation = 0
        ds.SamplesPerPixel = 1
        ds.PhotometricInterpretation = 'MONOCHROME2'
        arr = np.ones((10, 10), dtype='uint16')
        ds.PixelData = arr.tobytes()

        assert ds.pixel_array.max() == 1

    def test_read_only(self):
        """Test for #717, returned array read-only."""
        ds = dcmread(EXPL_8_1_1F)
        arr = ds.pixel_array
        assert 0 != arr[0, 0]
        arr[0, 0] = 0
        assert 0 == arr[0, 0]
        assert arr.flags.writeable


# Tests for numpy_handler module with Numpy available
@pytest.mark.skipif(not HAVE_NP, reason='Numpy is not available')
class TestNumpy_GetPixelData:
    """Tests for numpy_handler.get_pixeldata with numpy."""
    def test_no_pixel_data_raises(self):
        """Test get_pixeldata raises if dataset has no PixelData."""
        ds = dcmread(EXPL_16_1_1F)
        del ds.PixelData
        assert 'PixelData' not in ds
        assert 'FloatPixelData' not in ds
        assert 'DoubleFloatPixelData' not in ds
        msg = (
            r"Unable to convert the pixel data: one of Pixel Data, Float "
            r"Pixel Data or Double Float Pixel Data must be present in "
            r"the dataset"
        )
        with pytest.raises(AttributeError, match=msg):
            get_pixeldata(ds)

    def test_missing_required_elem_pixel_data_monochrome(self):
        """Tet get_pixeldata raises if dataset missing required element."""
        required_attrs = (
            'BitsAllocated',
            'BitsStored',
            'Rows',
            'Columns',
            'SamplesPerPixel',
            'PhotometricInterpretation',
            'PixelRepresentation',
        )
        for attr in required_attrs:
            ds = dcmread(EXPL_16_1_1F)
            delattr(ds, attr)
            msg = (
                r"Unable to convert the pixel data as the following required "
                r"elements are missing from the dataset: {}".format(attr)
            )
            with pytest.raises(AttributeError, match=msg):
                get_pixeldata(ds)

    def test_missing_required_elem_pixel_data_color(self):
        """Tet get_pixeldata raises if dataset missing required element."""
        ds = dcmread(EXPL_8_3_1F)
        del ds.Rows
        del ds.Columns
        msg = (
            r"Unable to convert the pixel data as the following required "
            r"elements are missing from the dataset: Rows, Columns"
        )
        with pytest.raises(AttributeError, match=msg):
            get_pixeldata(ds)

    def test_missing_conditionally_required_elem_pixel_data_color(self):
        """Tet get_pixeldata raises if dataset missing required element."""
        ds = dcmread(EXPL_8_3_1F)
        del ds.PlanarConfiguration
        msg = (
            r"Unable to convert the pixel data as the following conditionally "
            r"required element is missing from the dataset: "
            r"PlanarConfiguration"
        )
        with pytest.raises(AttributeError, match=msg):
            get_pixeldata(ds)

    def test_missing_required_elem_float_pixel_data_monochrome(self):
        """Tet get_pixeldata raises if dataset missing required element."""
        ds = dcmread(IMPL_32_1_1F)
        ds.FloatPixelData = ds.PixelData
        del ds.PixelData
        del ds.Rows
        msg = (
            r"Unable to convert the pixel data as the following required "
            r"elements are missing from the dataset: Rows"
        )
        with pytest.raises(AttributeError, match=msg):
            get_pixeldata(ds)

    def test_unknown_pixel_representation_raises(self):
        """Test get_pixeldata raises if unsupported PixelRepresentation."""
        ds = dcmread(EXPL_16_1_1F)
        ds.PixelRepresentation = 2
        with pytest.raises(ValueError,
                           match=r"value of '2' for '\(0028,0103"):
            get_pixeldata(ds)

    def test_unsupported_syntaxes_raises(self):
        """Test get_pixeldata raises if unsupported Transfer Syntax."""
        ds = dcmread(EXPL_16_1_1F)
        ds.file_meta.TransferSyntaxUID = '1.2.840.10008.1.2.4.50'
        with pytest.raises(NotImplementedError,
                           match=' the transfer syntax is not supported'):
            get_pixeldata(ds)

    def test_bad_length_raises(self):
        """Test bad pixel data length raises exception."""
        ds = dcmread(EXPL_8_1_1F)
        # Too short
        ds.PixelData = ds.PixelData[:-1]
        msg = (
            r"The length of the pixel data in the dataset \(479999 bytes\) "
            r"doesn't match the expected length \(480000 bytes\). "
            r"The dataset may be corrupted or there may be an issue "
            r"with the pixel data handler."
        )
        with pytest.raises(ValueError, match=msg):
            get_pixeldata(ds)

    def test_missing_padding_warns(self):
        """A warning shall be issued if the padding for odd data is missing."""
        ds = dcmread(EXPL_8_3_1F_ODD)
        # remove the padding byte
        ds.PixelData = ds.PixelData[:-1]
        msg = r"The odd length pixel data is missing a trailing padding byte"
        with pytest.warns(UserWarning, match=msg):
            get_pixeldata(ds)

    def test_change_photometric_interpretation(self):
        """Test get_pixeldata changes PhotometricInterpretation if required."""

        def to_rgb(ds):
            """Override the original function that returned False"""
            return True

        # Test default
        ds = dcmread(EXPL_16_1_1F)
        assert ds.PhotometricInterpretation == 'MONOCHROME2'

        get_pixeldata(ds)
        assert ds.PhotometricInterpretation == 'MONOCHROME2'

        # Test modified
        orig_fn = NP_HANDLER.should_change_PhotometricInterpretation_to_RGB
        NP_HANDLER.should_change_PhotometricInterpretation_to_RGB = to_rgb

        get_pixeldata(ds)
        assert ds.PhotometricInterpretation == 'RGB'

        NP_HANDLER.should_change_PhotometricInterpretation_to_RGB = orig_fn

    def test_array_read_only(self):
        """Test returning a read only array for BitsAllocated > 8."""
        ds = dcmread(EXPL_8_1_1F)
        arr = get_pixeldata(ds, read_only=False)
        assert arr.flags.writeable
        assert 0 != arr[10]
        arr[10] = 0
        assert 0 == arr[10]

        arr = get_pixeldata(ds, read_only=True)
        assert not arr.flags.writeable
        with pytest.raises(ValueError, match="is read-only"):
            arr[10] = 0

    def test_array_read_only_bit_packed(self):
        """Test returning a read only array for BitsAllocated = 1."""
        ds = dcmread(EXPL_1_1_1F)
        arr = get_pixeldata(ds, read_only=False)
        assert arr.flags.writeable

        arr = get_pixeldata(ds, read_only=True)
        assert arr.flags.writeable

    def test_ybr422_excess_padding(self):
        """Test YBR data with excess padding."""
        ds = dcmread(EXPL_8_3_1F_YBR422)
        assert ds.PhotometricInterpretation == 'YBR_FULL_422'
        ds.PixelData += b'\x00\x00\x00\x00'
        msg = (
            r"The length of the pixel data in the dataset \(20004 bytes\) "
            r"indicates it contains excess padding. 4 bytes will be removed "
            r"from the end of the data"
        )
        with pytest.warns(UserWarning, match=msg):
            arr = ds.pixel_array

        assert (76, 85, 255) == tuple(arr[5, 50, :])
        assert (166, 106, 193) == tuple(arr[15, 50, :])
        assert (150, 46, 20) == tuple(arr[25, 50, :])
        assert (203, 86, 75) == tuple(arr[35, 50, :])
        assert (29, 255, 107) == tuple(arr[45, 50, :])
        assert (142, 193, 118) == tuple(arr[55, 50, :])
        assert (0, 128, 128) == tuple(arr[65, 50, :])
        assert (64, 128, 128) == tuple(arr[75, 50, :])
        assert (192, 128, 128) == tuple(arr[85, 50, :])
        assert (255, 128, 128) == tuple(arr[95, 50, :])

    def test_ybr422_wrong_interpretation(self):
        """Test YBR data with wrong Photometric Interpretation."""
        ds = dcmread(EXPL_8_3_1F_YBR)
        assert ds.PhotometricInterpretation == 'YBR_FULL'
        assert len(ds.PixelData) == 30000
        ds.PhotometricInterpretation = 'YBR_FULL_422'
        msg = r"The Photometric Interpretation of the dataset is YBR_FULL_422"
        with pytest.warns(UserWarning, match=msg):
            arr = ds.pixel_array

        # Resulting data will be nonsense but of correct shape
        assert (100, 100, 3) == arr.shape

    def test_float_pixel_data(self):
        """Test handling of Float Pixel Data."""
        # Only 1 sample per pixel allowed
        ds = dcmread(IMPL_32_1_1F)
        ds.FloatPixelData = ds.PixelData
        del ds.PixelData
        assert 32 == ds.BitsAllocated
        arr = get_pixeldata(ds)
        assert 'float32' == arr.dtype

    def test_double_float_pixel_data(self):
        """Test handling of Double Float Pixel Data."""
        # Only 1 sample per pixel allowed
        ds = dcmread(IMPL_32_1_1F)
        ds.DoubleFloatPixelData = ds.PixelData + ds.PixelData
        del ds.PixelData
        ds.BitsAllocated = 64
        arr = get_pixeldata(ds)
        assert 'float64' == arr.dtype

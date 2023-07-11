# Copyright 2008-2019 pydicom authors. See LICENSE file for details.
"""Tests for the overlay_data_handlers.numpy_handler module.

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

* OverlayBitsAllocated
* NumberOfFramesInOverlay
* OverlayRows
* OverlayColumns
"""

from importlib import reload
import typing

import pytest

import pydicom
from pydicom.data import get_testdata_file
from pydicom.filereader import dcmread
from pydicom.uid import ImplicitVRLittleEndian, ExplicitVRLittleEndian

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

try:
    from pydicom.overlays import numpy_handler as NP_HANDLER
    from pydicom.overlays.numpy_handler import (
        get_overlay_array,
        reshape_overlay_array,
        get_expected_length,
    )
except ImportError:
    NP_HANDLER = None


# Paths to the test datasets
# EXPL: Explicit VR Little Endian
# Overlay Data
# 1/1, 1 sample/pixel, 1 frame
EXPL_1_1_1F = get_testdata_file("MR-SIEMENS-DICOM-WithOverlays.dcm")
# 1/1, 1 sample/pixel, N frame
EXPL_1_1_3F = None
# No Overlay Data
# 16/16, 1 sample/pixel, 1 frame
EXPL_16_1_1F = get_testdata_file("MR_small.dcm")


# Numpy unavailable and the numpy handler is available
@pytest.mark.skipif(HAVE_NP, reason='Numpy is available')
class TestNoNumpy_NumpyHandler:
    """Tests for handling datasets without numpy and the handler."""
    def setup(self):
        """Setup the environment."""
        self.original_handlers = pydicom.config.overlay_data_handlers
        pydicom.config.overlay_data_handlers = [NP_HANDLER]

    def teardown(self):
        """Restore the environment."""
        pydicom.config.overlay_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert not HAVE_NP
        assert NP_HANDLER is not None

    def test_overlay_array_raises(self):
        """Test overlay_array raises exception"""
        ds = dcmread(EXPL_1_1_1F)
        msg = r"The following handlers are available to decode"
        with pytest.raises(RuntimeError, match=msg):
            ds.overlay_array(0x6000)

    def test_get_overlay_array_raises(self):
        """Test get_overlay_array raises exception"""
        ds = dcmread(EXPL_1_1_1F)
        msg = r"The overlay data handler requires numpy"
        with pytest.raises(ImportError, match=msg):
            get_overlay_array(ds, 0x6000)


@pytest.mark.skipif(HAVE_NP, reason='Numpy is available')
def test_reshape_pixel_array_raises():
    """Test that reshape_overlay_array raises exception without numpy."""
    with pytest.raises(ImportError, match="Numpy is required to reshape"):
        reshape_overlay_array(None, None)


# Numpy and the numpy handler are available
EXPL = ExplicitVRLittleEndian
IMPL = ImplicitVRLittleEndian
REFERENCE_DATA_LITTLE = [
    # fpath, (syntax, bits, nr samples, pixel repr, nr frames, shape, dtype,
    #   group)
    (EXPL_1_1_1F, (EXPL, 1, 1, 0, 1, (484, 484), 'uint8', 0x6000)),
    # (EXPL_1_1_3F, (EXPL, 1, 1, 0, 3, (3, 512, 512), 'uint8', 0x6000)),
]


@pytest.mark.skipif(not HAVE_NP, reason='Numpy is not available')
class TestNumpy_NumpyHandler:
    """Tests for handling Overlay Data with the handler."""
    def setup(self):
        """Setup the test datasets and the environment."""
        self.original_handlers = pydicom.config.overlay_data_handlers
        pydicom.config.overlay_data_handlers = [NP_HANDLER]

    def teardown(self):
        """Restore the environment."""
        pydicom.config.overlay_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert HAVE_NP
        assert NP_HANDLER is not None

    # Little endian datasets
    @pytest.mark.parametrize('fpath, data', REFERENCE_DATA_LITTLE)
    def test_properties(self, fpath, data):
        """Test dataset and overlay array properties are as expected."""
        ds = dcmread(fpath)
        group = data[7]
        assert ds.file_meta.TransferSyntaxUID == data[0]
        assert ds[group, 0x0100].value == data[1]  # OverlayBitsAllocated

        arr = ds.overlay_array(data[7])
        assert data[5] == arr.shape
        assert arr.dtype == data[6]

        # Odd sized data is padded by a final 0x00 byte
        rows = ds[group, 0x0010].value
        columns = ds[group, 0x0011].value
        nr_frames = ds[group, 0x0015].value
        size = rows * columns * nr_frames / 8 * data[2]
        assert len(ds[group, 0x3000].value) == size + size % 2
        if size % 2:
            assert ds[group, 0x3000].value[-1] == b'\x00'[0]

    def test_little_1bit_1sample_1frame(self):
        """Test pixel_array for little 1-bit, 1 sample/pixel, 1 frame."""
        ds = dcmread(EXPL_1_1_1F)
        arr = ds.overlay_array(0x6000)

        assert arr.flags.writeable
        assert arr.max() == 1
        assert arr.min() == 0
        assert 29 == sum(arr[422, 393:422])

    @pytest.mark.skip(reason='No dataset available')
    def test_little_1bit_1sample_3frame(self):
        """Test pixel_array for little 1-bit, 1 sample/pixel, 3 frame."""
        ds = dcmread(EXPL_1_1_3F)
        arr = ds.overlay_array(0x6000)

    def test_read_only(self):
        """Test for #717, returned array read-only."""
        ds = dcmread(EXPL_1_1_1F)
        arr = ds.overlay_array(0x6000)
        assert 0 == arr[0, 0]
        arr[0, 0] = 1
        assert 1 == arr[0, 0]
        assert arr.flags.writeable

    def test_bad_group_raises(self):
        """Test that using a bad group raises exception."""
        ds = dcmread(EXPL_1_1_1F)
        msg = (
            r"The group part of the 'Overlay Data' element tag must be "
            r"between 0x6000 and 0x60FF \(inclusive\)"
        )
        with pytest.raises(ValueError, match=msg):
            ds.overlay_array(0x5FFF)
        with pytest.raises(ValueError, match=msg):
            ds.overlay_array(0x6100)

    def test_no_frames(self):
        """Test handler with no NumberOfFramesInOverlay element."""
        ds = dcmread(EXPL_1_1_1F)
        del ds[0x6000, 0x0015]
        arr = ds.overlay_array(0x6000)

        assert arr.max() == 1
        assert arr.min() == 0
        assert 29 == sum(arr[422, 393:422])


# Tests for numpy_handler module with Numpy available
@pytest.mark.skipif(not HAVE_NP, reason='Numpy is not available')
class TestNumpy_GetOverlayArray:
    """Tests for numpy_handler.get_overlay_array with numpy."""
    def test_no_overlay_data_raises(self):
        """Test get_overlay_array raises if dataset has no OverlayData."""
        ds = dcmread(EXPL_1_1_1F)
        del ds[0x6000, 0x3000]
        assert (0x6000, 0x3000) not in ds
        with pytest.raises(AttributeError, match=r' dataset: OverlayData'):
            get_overlay_array(ds, 0x6000)

    def test_bad_length_raises(self):
        """Test bad pixel data length raises exception."""
        ds = dcmread(EXPL_1_1_1F)
        # Too short
        ds[0x6000, 0x3000].value = ds[0x6000, 0x3000][:-1]
        msg = (
            r"The length of the overlay data in the dataset \(29281 bytes\) "
            r"doesn't match the expected length \(29282 bytes\). "
            r"The dataset may be corrupted or there may be an issue "
            r"with the overlay data handler."
        )
        with pytest.raises(ValueError, match=msg):
            get_overlay_array(ds, 0x6000)

    def test_missing_padding_warns(self):
        """A warning shall be issued if the padding for odd data is missing."""
        ds = dcmread(EXPL_1_1_1F)
        # Edit shape
        ds[0x6000, 0x0010].value = 15  # OverlayRows
        ds[0x6000, 0x0011].value = 14  # OverlayColumns
        ds[0x6000, 0x3000].value = ds[0x6000, 0x3000].value[:27]  # 15 * 14 / 8
        msg = r"The overlay data length is odd and misses a padding byte."
        with pytest.warns(UserWarning, match=msg):
            get_overlay_array(ds, 0x6000)

    def test_excess_padding(self):
        """A warning shall be issued excess padding present."""
        ds = dcmread(EXPL_1_1_1F)
        # Edit shape
        ds[0x6000, 0x0010].value = 15  # OverlayRows
        ds[0x6000, 0x0011].value = 14  # OverlayColumns
        overlay_data = ds[0x6000, 0x3000].value[:27] + b'\x00\x00\x00'
        ds[0x6000, 0x3000].value = overlay_data
        msg = (
            r"overlay data in the dataset \(30 bytes\) indicates it contains "
            r"excess padding. 3 bytes will be removed"
        )
        with pytest.warns(UserWarning, match=msg):
            get_overlay_array(ds, 0x6000)

    def test_old_import(self):
        """Test that can import using the old path."""
        from pydicom.overlay_data_handlers import numpy_handler as np_old
        ds = dcmread(EXPL_1_1_1F)
        arr = np_old.get_overlay_array(ds, 0x6000)
        assert 0 == arr[0, 0]


if HAVE_NP:
    RESHAPE_ARRAYS = {
        'reference': np.asarray([
            [  # Frame 1
                [[1,  9, 17],
                 [2, 10, 18],
                 [3, 11, 19],
                 [4, 12, 20],
                 [5, 13, 21]],
                [[2, 10, 18],
                 [3, 11, 19],
                 [4, 12, 20],
                 [5, 13, 21],
                 [6, 14, 22]],
                [[3, 11, 19],
                 [4, 12, 20],
                 [5, 13, 21],
                 [6, 14, 22],
                 [7, 15, 23]],
                [[4, 12, 20],
                 [5, 13, 21],
                 [6, 14, 22],
                 [7, 15, 23],
                 [8, 16, 24]],
            ],
            [  # Frame 2
                [[25, 33, 41],
                 [26, 34, 42],
                 [27, 35, 43],
                 [28, 36, 44],
                 [29, 37, 45]],
                [[26, 34, 42],
                 [27, 35, 43],
                 [28, 36, 44],
                 [29, 37, 45],
                 [30, 38, 46]],
                [[27, 35, 43],
                 [28, 36, 44],
                 [29, 37, 45],
                 [30, 38, 46],
                 [31, 39, 47]],
                [[28, 36, 44],
                 [29, 37, 45],
                 [30, 38, 46],
                 [31, 39, 47],
                 [32, 40, 48]],
            ]
        ]),
        '1frame_1sample': np.asarray(
            [1, 2, 3, 4, 5, 2, 3, 4, 5, 6, 3, 4, 5, 6, 7, 4, 5, 6, 7, 8]
        ),
        '2frame_1sample': np.asarray(
            [1,   2,  3,  4,  5,  2,  3,  4,  5,  6,  # Frame 1
             3,   4,  5,  6,  7,  4,  5,  6,  7,  8,
             25, 26, 27, 28, 29, 26, 27, 28, 29, 30,  # Frame 2
             27, 28, 29, 30, 31, 28, 29, 30, 31, 32]
        ),
    }


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ReshapeOverlayArray:
    """Tests for numpy_handler.reshape_overlay_array."""
    def setup(self):
        """Setup the test dataset."""
        self.elem = {
            'OverlayRows': 4,
            'OverlayColumns': 5,
        }

        # Expected output ref_#frames_#samples
        self.ref_1_1 = RESHAPE_ARRAYS['reference'][0, :, :, 0]
        self.ref_2_1 = RESHAPE_ARRAYS['reference'][:, :, :, 0]

    def test_reference_1frame_1sample(self):
        """Test the 1 frame 1 sample/pixel reference array is as expected."""
        # (rows, columns)
        assert (4, 5) == self.ref_1_1.shape
        assert np.array_equal(
            self.ref_1_1,
            np.asarray(
                [[1, 2, 3, 4, 5],
                 [2, 3, 4, 5, 6],
                 [3, 4, 5, 6, 7],
                 [4, 5, 6, 7, 8]]
            )
        )

    def test_reference_2frame_1sample(self):
        """Test the 2 frame 1 sample/pixel reference array is as expected."""
        # (nr frames, rows, columns)
        assert (2, 4, 5) == self.ref_2_1.shape

        # Frame 1
        assert np.array_equal(
            self.ref_2_1[0, :, :],
            np.asarray(
                [[1, 2, 3, 4, 5],
                 [2, 3, 4, 5, 6],
                 [3, 4, 5, 6, 7],
                 [4, 5, 6, 7, 8]]
            )
        )
        # Frame 2
        assert np.array_equal(
            self.ref_2_1[1, :, :],
            np.asarray(
                [[25, 26, 27, 28, 29],
                 [26, 27, 28, 29, 30],
                 [27, 28, 29, 30, 31],
                 [28, 29, 30, 31, 32]]
            )
        )

    def test_1frame(self):
        """Test reshaping 1 frame, 1 sample/pixel."""
        self.elem['NumberOfFramesInOverlay'] = 1
        arr = reshape_overlay_array(
            self.elem, RESHAPE_ARRAYS['1frame_1sample']
        )
        assert (4, 5) == arr.shape
        assert np.array_equal(arr, self.ref_1_1)

    def test_2frame_1sample(self):
        """Test reshaping 2 frame, 1 sample/pixel."""
        self.elem['NumberOfFramesInOverlay'] = 2
        arr = reshape_overlay_array(
            self.elem, RESHAPE_ARRAYS['2frame_1sample']
        )
        assert (2, 4, 5) == arr.shape
        assert np.array_equal(arr, self.ref_2_1)

    def test_invalid_nr_frames_raises(self):
        """Test an invalid Number of Frames value raises exception."""
        self.elem['NumberOfFramesInOverlay'] = 0
        # Need to escape brackets
        with pytest.raises(ValueError, match=r"value of 0 for \(60xx,0015\)"):
            reshape_overlay_array(self.elem, RESHAPE_ARRAYS['1frame_1sample'])


REFERENCE_LENGTH = [
    # (frames, rows, cols), bit depth, result in (bytes, pixels)
    ((1, 0, 0), 1, (0, 0)),
    ((1, 1, 1), 1, (1, 1)),  # 1 bit -> 1 byte
    ((1, 2, 2), 1, (1, 4)),  # 4 bits -> 1 byte
    ((1, 2, 4), 1, (1, 8)),  # 8 bits -> 1 byte
    ((1, 3, 3), 1, (2, 9)),  # 9 bits -> 2 bytes
    ((1, 512, 512), 1, (32768, 262144)),  # Typical length
    # NumberOfFramesInOverlay odd and > 1
    ((3, 0, 0), 1, (0, 0)),
    ((3, 1, 1), 1, (1, 3)),
    ((3, 2, 4), 1, (3, 24)),
    ((3, 2, 2), 1, (2, 12)),
    ((3, 3, 3), 1, (4, 27)),
    ((3, 512, 512), 1, (98304, 786432)),
    # NumberOfFramesInOverlay even
    ((4, 0, 0), 1, (0, 0)),
    ((4, 1, 1), 1, (1, 4)),
    ((4, 2, 4), 1, (4, 32)),
    ((4, 2, 2), 1, (2, 16)),
    ((4, 3, 3), 1, (5, 36)),
    ((4, 512, 512), 1, (131072, 1048576)),
]


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_GetExpectedLength:
    """Tests for numpy_handler.get_expected_length."""
    @pytest.mark.parametrize('shape, bits, length', REFERENCE_LENGTH)
    def test_length_in_bytes(self, shape, bits, length):
        """Test get_expected_length(ds, unit='bytes')."""
        elem = {
            'OverlayRows': shape[1],
            'OverlayColumns': shape[2],
            'OverlayBitsAllocated': bits,
            'NumberOfFramesInOverlay': shape[0],
        }

        assert length[0] == get_expected_length(elem, unit='bytes')

    @pytest.mark.parametrize('shape, bits, length', REFERENCE_LENGTH)
    def test_length_in_pixels(self, shape, bits, length):
        """Test get_expected_length(ds, unit='pixels')."""
        elem = {
            'OverlayRows': shape[1],
            'OverlayColumns': shape[2],
            'OverlayBitsAllocated': bits,
            'NumberOfFramesInOverlay': shape[0],
        }

        assert length[1] == get_expected_length(elem, unit='pixels')

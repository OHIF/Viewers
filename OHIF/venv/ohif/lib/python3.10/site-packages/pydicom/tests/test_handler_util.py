# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Tests for the pixel_data_handlers.util module."""

import os
import random
from struct import unpack, pack
from sys import byteorder

import pytest

try:
    import numpy as np
    HAVE_NP = True
except ImportError:
    HAVE_NP = False

from pydicom import dcmread, config
from pydicom.data import get_testdata_file, get_palette_files
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.pixel_data_handlers.util import (
    dtype_corrected_for_endianness,
    reshape_pixel_array,
    convert_color_space,
    pixel_dtype,
    get_expected_length,
    apply_color_lut,
    _expand_segmented_lut,
    apply_modality_lut,
    apply_voi_lut,
    get_j2k_parameters,
    get_nr_frames,
    apply_voi,
    apply_windowing,
    pack_bits,
    unpack_bits,
    expand_ybr422,
)
from pydicom.uid import (
    ExplicitVRLittleEndian,
    ImplicitVRLittleEndian,
    UncompressedPixelTransferSyntaxes,
)


# PAL: PALETTE COLOR Photometric Interpretation
# SEG: Segmented Palette Color
# SUP: Supplemental Palette Color
# LE, BE: little endian, big endian encoding
# 8/8, 1 sample/pixel, 1 frame
PAL_08_256_0_16_1F = get_testdata_file("OBXXXX1A.dcm")
PAL_08_200_0_16_1F = get_testdata_file("OT-PAL-8-face.dcm")
# 8/8, 1 sample/pixel, 2 frame
PAL_08_256_0_16_2F = get_testdata_file("OBXXXX1A_2frame.dcm")
# PALETTE COLOR with 16-bit LUTs (no indirect segments)
PAL_SEG_LE_16_1F = get_testdata_file("gdcm-US-ALOKA-16.dcm")
PAL_SEG_BE_16_1F = get_testdata_file("gdcm-US-ALOKA-16_big.dcm")
# Supplemental palette colour + VOI windowing
SUP_16_16_2F = get_testdata_file("eCT_Supplemental.dcm")
# 8 bit, 3 samples/pixel, 1 and 2 frame datasets
# RGB colorspace, uncompressed
RGB_8_3_1F = get_testdata_file("SC_rgb.dcm")
RGB_8_3_2F = get_testdata_file("SC_rgb_2frame.dcm")
# MOD: Modality LUT
# SEQ: Modality LUT Sequence
MOD_16 = get_testdata_file("CT_small.dcm")
MOD_16_SEQ = get_testdata_file("mlut_18.dcm")
# VOI: VOI LUT Sequence
# WIN: Windowing operation
WIN_12_1F = get_testdata_file("MR-SIEMENS-DICOM-WithOverlays.dcm")
VOI_08_1F = get_testdata_file("vlut_04.dcm")
# 1/1, 1 sample/pixel, 3 frame
EXPL_1_1_3F = get_testdata_file("liver.dcm")
# Uncompressed YBR_FULL_422
EXPL_8_3_1F_YBR422 = get_testdata_file('SC_ybr_full_422_uncompressed.dcm')


# Tests with Numpy unavailable
@pytest.mark.skipif(HAVE_NP, reason='Numpy is available')
class TestNoNumpy:
    """Tests for the util functions without numpy."""
    def test_pixel_dtype_raises(self):
        """Test that pixel_dtype raises exception without numpy."""
        with pytest.raises(ImportError,
                           match="Numpy is required to determine the dtype"):
            pixel_dtype(None)

    def test_reshape_pixel_array_raises(self):
        """Test that reshape_pixel_array raises exception without numpy."""
        with pytest.raises(ImportError,
                           match="Numpy is required to reshape"):
            reshape_pixel_array(None, None)


# Tests with Numpy available
REFERENCE_DTYPE = [
    # BitsAllocated, PixelRepresentation, as_float, numpy dtype string
    (1, 0, False, 'uint8'), (1, 1, False, 'uint8'),
    (8, 0, False, 'uint8'), (8, 1, False, 'int8'),
    (16, 0, False, 'uint16'), (16, 1, False, 'int16'),
    (32, 0, False, 'uint32'), (32, 1, False, 'int32'),
    (32, 0, True, 'float32'), (64, 0, True, 'float64'),
]


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_PixelDtype:
    """Tests for util.pixel_dtype."""
    def setup(self):
        """Setup the test dataset."""
        self.ds = Dataset()
        self.ds.file_meta = FileMetaDataset()
        self.ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian

    def test_unknown_pixel_representation_raises(self):
        """Test an unknown PixelRepresentation value raises exception."""
        self.ds.BitsAllocated = 16
        self.ds.PixelRepresentation = -1
        # The bracket needs to be escaped
        with pytest.raises(ValueError,
                           match=r"value of '-1' for '\(0028,0103"):
            pixel_dtype(self.ds)

        self.ds.PixelRepresentation = 2
        with pytest.raises(ValueError,
                           match=r"value of '2' for '\(0028,0103"):
            pixel_dtype(self.ds)

    def test_unknown_bits_allocated_raises(self):
        """Test an unknown BitsAllocated value raises exception."""
        self.ds.BitsAllocated = 0
        self.ds.PixelRepresentation = 0
        # The bracket needs to be escaped
        with pytest.raises(ValueError,
                           match=r"value of '0' for '\(0028,0100"):
            pixel_dtype(self.ds)

        self.ds.BitsAllocated = 2
        with pytest.raises(ValueError,
                           match=r"value of '2' for '\(0028,0100"):
            pixel_dtype(self.ds)

        self.ds.BitsAllocated = 15
        with pytest.raises(ValueError,
                           match=r"value of '15' for '\(0028,0100"):
            pixel_dtype(self.ds)

    def test_unsupported_dtypes(self):
        """Test unsupported dtypes raise exception."""
        self.ds.BitsAllocated = 24
        self.ds.PixelRepresentation = 0

        with pytest.raises(NotImplementedError,
                           match="data type 'uint24' needed to contain"):
            pixel_dtype(self.ds)

    @pytest.mark.parametrize(
        'bits, pixel_repr, as_float, dtype', REFERENCE_DTYPE
    )
    def test_supported_dtypes(self, bits, pixel_repr, as_float, dtype):
        """Test supported dtypes."""
        self.ds.BitsAllocated = bits
        self.ds.PixelRepresentation = pixel_repr
        # Correct for endianness of system
        ref_dtype = np.dtype(dtype)
        endianness = self.ds.file_meta.TransferSyntaxUID.is_little_endian
        if endianness != (byteorder == 'little'):
            ref_dtype = ref_dtype.newbyteorder('S')

        assert ref_dtype == pixel_dtype(self.ds, as_float=as_float)

    def test_byte_swapping(self):
        """Test that the endianness of the system is taken into account."""
        # The main problem is that our testing environments are probably
        #   all little endian, but we'll try our best
        self.ds.BitsAllocated = 16
        self.ds.PixelRepresentation = 0

        # < is little, = is native, > is big
        if byteorder == 'little':
            self.ds.is_little_endian = True
            assert pixel_dtype(self.ds).byteorder in ['<', '=']
            self.ds.is_little_endian = False
            assert pixel_dtype(self.ds).byteorder == '>'
        elif byteorder == 'big':
            self.ds.is_little_endian = True
            assert pixel_dtype(self.ds).byteorder == '<'
            self.ds.is_little_endian = False
            assert pixel_dtype(self.ds).byteorder in ['>', '=']


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
        '1frame_3sample_0config': np.asarray(
            [1,  9, 17,  2, 10, 18,  3, 11, 19,  4, 12, 20,
             5, 13, 21,  2, 10, 18,  3, 11, 19,  4, 12, 20,
             5, 13, 21,  6, 14, 22,  3, 11, 19,  4, 12, 20,
             5, 13, 21,  6, 14, 22,  7, 15, 23,  4, 12, 20,
             5, 13, 21,  6, 14, 22,  7, 15, 23,  8, 16, 24]
        ),
        '1frame_3sample_1config': np.asarray(
            [1,   2,  3,  4,  5,  2,  3,  4,  5,  6,  # Red
             3,   4,  5,  6,  7,  4,  5,  6,  7,  8,
             9,  10, 11, 12, 13, 10, 11, 12, 13, 14,  # Green
             11, 12, 13, 14, 15, 12, 13, 14, 15, 16,
             17, 18, 19, 20, 21, 18, 19, 20, 21, 22,  # Blue
             19, 20, 21, 22, 23, 20, 21, 22, 23, 24]
        ),
        '2frame_3sample_0config': np.asarray(
            [1,   9, 17,  2, 10, 18,  3, 11, 19,  4, 12, 20,  # Frame 1
             5,  13, 21,  2, 10, 18,  3, 11, 19,  4, 12, 20,
             5,  13, 21,  6, 14, 22,  3, 11, 19,  4, 12, 20,
             5,  13, 21,  6, 14, 22,  7, 15, 23,  4, 12, 20,
             5,  13, 21,  6, 14, 22,  7, 15, 23,  8, 16, 24,
             25, 33, 41, 26, 34, 42, 27, 35, 43, 28, 36, 44,  # Frame 2
             29, 37, 45, 26, 34, 42, 27, 35, 43, 28, 36, 44,
             29, 37, 45, 30, 38, 46, 27, 35, 43, 28, 36, 44,
             29, 37, 45, 30, 38, 46, 31, 39, 47, 28, 36, 44,
             29, 37, 45, 30, 38, 46, 31, 39, 47, 32, 40, 48]
        ),
        '2frame_3sample_1config': np.asarray(
            [1,   2,  3,  4,  5,  2,  3,  4,  5,  6,  # Frame 1, red
             3,   4,  5,  6,  7,  4,  5,  6,  7,  8,
             9,  10, 11, 12, 13, 10, 11, 12, 13, 14,  # Frame 1, green
             11, 12, 13, 14, 15, 12, 13, 14, 15, 16,
             17, 18, 19, 20, 21, 18, 19, 20, 21, 22,  # Frame 1, blue
             19, 20, 21, 22, 23, 20, 21, 22, 23, 24,
             25, 26, 27, 28, 29, 26, 27, 28, 29, 30,  # Frame 2, red
             27, 28, 29, 30, 31, 28, 29, 30, 31, 32,
             33, 34, 35, 36, 37, 34, 35, 36, 37, 38,  # Frame 2, green
             35, 36, 37, 38, 39, 36, 37, 38, 39, 40,
             41, 42, 43, 44, 45, 42, 43, 44, 45, 46,  # Frame 2, blue
             43, 44, 45, 46, 47, 44, 45, 46, 47, 48]
        )
    }


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ReshapePixelArray:
    """Tests for util.reshape_pixel_array."""
    def setup(self):
        """Setup the test dataset."""
        self.ds = Dataset()
        self.ds.file_meta = FileMetaDataset()
        self.ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        self.ds.Rows = 4
        self.ds.Columns = 5

        # Expected output ref_#frames_#samples
        self.ref_1_1 = RESHAPE_ARRAYS['reference'][0, :, :, 0]
        self.ref_1_3 = RESHAPE_ARRAYS['reference'][0]
        self.ref_2_1 = RESHAPE_ARRAYS['reference'][:, :, :, 0]
        self.ref_2_3 = RESHAPE_ARRAYS['reference']

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

    def test_reference_1frame_3sample(self):
        """Test the 1 frame 3 sample/pixel reference array is as expected."""
        # (rows, columns, planes)
        assert (4, 5, 3) == self.ref_1_3.shape

        # Red channel
        assert np.array_equal(
            self.ref_1_3[:, :, 0],
            np.asarray(
                [[1, 2, 3, 4, 5],
                 [2, 3, 4, 5, 6],
                 [3, 4, 5, 6, 7],
                 [4, 5, 6, 7, 8]]
            )
        )
        # Green channel
        assert np.array_equal(
            self.ref_1_3[:, :, 1],
            np.asarray(
                [[9,  10, 11, 12, 13],
                 [10, 11, 12, 13, 14],
                 [11, 12, 13, 14, 15],
                 [12, 13, 14, 15, 16]]
            )
        )
        # Blue channel
        assert np.array_equal(
            self.ref_1_3[:, :, 2],
            np.asarray(
                [[17, 18, 19, 20, 21],
                 [18, 19, 20, 21, 22],
                 [19, 20, 21, 22, 23],
                 [20, 21, 22, 23, 24]]
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

    def test_reference_2frame_3sample(self):
        """Test the 2 frame 3 sample/pixel reference array is as expected."""
        # (nr frames, row, columns, planes)
        assert (2, 4, 5, 3) == self.ref_2_3.shape

        # Red channel, frame 1
        assert np.array_equal(
            self.ref_2_3[0, :, :, 0],
            np.asarray(
                [[1, 2, 3, 4, 5],
                 [2, 3, 4, 5, 6],
                 [3, 4, 5, 6, 7],
                 [4, 5, 6, 7, 8]]
            )
        )
        # Green channel, frame 2
        assert np.array_equal(
            self.ref_2_3[1, :, :, 1],
            np.asarray(
                [[33, 34, 35, 36, 37],
                 [34, 35, 36, 37, 38],
                 [35, 36, 37, 38, 39],
                 [36, 37, 38, 39, 40]]
            )
        )

    def test_1frame_1sample(self):
        """Test reshaping 1 frame, 1 sample/pixel."""
        self.ds.SamplesPerPixel = 1
        arr = reshape_pixel_array(self.ds, RESHAPE_ARRAYS['1frame_1sample'])
        assert (4, 5) == arr.shape
        assert np.array_equal(arr, self.ref_1_1)

    def test_1frame_3sample_0conf(self):
        """Test reshaping 1 frame, 3 sample/pixel for 0 planar config."""
        self.ds.NumberOfFrames = 1
        self.ds.SamplesPerPixel = 3
        self.ds.PlanarConfiguration = 0
        arr = reshape_pixel_array(self.ds,
                                  RESHAPE_ARRAYS['1frame_3sample_0config'])
        assert (4, 5, 3) == arr.shape
        assert np.array_equal(arr, self.ref_1_3)

    def test_1frame_3sample_1conf(self):
        """Test reshaping 1 frame, 3 sample/pixel for 1 planar config."""
        self.ds.NumberOfFrames = 1
        self.ds.SamplesPerPixel = 3
        self.ds.PlanarConfiguration = 1
        arr = reshape_pixel_array(self.ds,
                                  RESHAPE_ARRAYS['1frame_3sample_1config'])
        assert (4, 5, 3) == arr.shape
        assert np.array_equal(arr, self.ref_1_3)

    def test_2frame_1sample(self):
        """Test reshaping 2 frame, 1 sample/pixel."""
        self.ds.NumberOfFrames = 2
        self.ds.SamplesPerPixel = 1
        arr = reshape_pixel_array(self.ds, RESHAPE_ARRAYS['2frame_1sample'])
        assert (2, 4, 5) == arr.shape
        assert np.array_equal(arr, self.ref_2_1)

    def test_2frame_3sample_0conf(self):
        """Test reshaping 2 frame, 3 sample/pixel for 0 planar config."""
        self.ds.NumberOfFrames = 2
        self.ds.SamplesPerPixel = 3
        self.ds.PlanarConfiguration = 0
        arr = reshape_pixel_array(self.ds,
                                  RESHAPE_ARRAYS['2frame_3sample_0config'])
        assert (2, 4, 5, 3) == arr.shape
        assert np.array_equal(arr, self.ref_2_3)

    def test_2frame_3sample_1conf(self):
        """Test reshaping 2 frame, 3 sample/pixel for 1 planar config."""
        self.ds.NumberOfFrames = 2
        self.ds.SamplesPerPixel = 3
        self.ds.PlanarConfiguration = 1
        arr = reshape_pixel_array(self.ds,
                                  RESHAPE_ARRAYS['2frame_3sample_1config'])
        assert (2, 4, 5, 3) == arr.shape
        assert np.array_equal(arr, self.ref_2_3)

    def test_compressed_syntaxes_0conf(self):
        """Test the compressed syntaxes that are always 0 planar conf."""
        for uid in ['1.2.840.10008.1.2.4.50',
                    '1.2.840.10008.1.2.4.57',
                    '1.2.840.10008.1.2.4.70',
                    '1.2.840.10008.1.2.4.90',
                    '1.2.840.10008.1.2.4.91']:
            self.ds.file_meta.TransferSyntaxUID = uid
            self.ds.PlanarConfiguration = 1
            self.ds.NumberOfFrames = 1
            self.ds.SamplesPerPixel = 3

            arr = reshape_pixel_array(self.ds,
                                      RESHAPE_ARRAYS['1frame_3sample_0config'])
            assert (4, 5, 3) == arr.shape
            assert np.array_equal(arr, self.ref_1_3)

    def test_compressed_syntaxes_1conf(self):
        """Test the compressed syntaxes that are always 1 planar conf."""
        for uid in ['1.2.840.10008.1.2.5']:
            self.ds.file_meta.TransferSyntaxUID = uid
            self.ds.PlanarConfiguration = 0
            self.ds.NumberOfFrames = 1
            self.ds.SamplesPerPixel = 3

            arr = reshape_pixel_array(
                self.ds, RESHAPE_ARRAYS['1frame_3sample_1config']
            )
            assert (4, 5, 3) == arr.shape
            assert np.array_equal(arr, self.ref_1_3)

    def test_uncompressed_syntaxes(self):
        """Test that uncompressed syntaxes use the dataset planar conf."""
        for uid in UncompressedPixelTransferSyntaxes:
            self.ds.file_meta.TransferSyntaxUID = uid
            self.ds.PlanarConfiguration = 0
            self.ds.NumberOfFrames = 1
            self.ds.SamplesPerPixel = 3

            arr = reshape_pixel_array(self.ds,
                                      RESHAPE_ARRAYS['1frame_3sample_0config'])
            assert (4, 5, 3) == arr.shape
            assert np.array_equal(arr, self.ref_1_3)

            self.ds.PlanarConfiguration = 1
            arr = reshape_pixel_array(self.ds,
                                      RESHAPE_ARRAYS['1frame_3sample_1config'])
            assert (4, 5, 3) == arr.shape
            assert np.array_equal(arr, self.ref_1_3)

    def test_invalid_nr_frames_raises(self):
        """Test an invalid Number of Frames value raises exception."""
        self.ds.SamplesPerPixel = 1
        self.ds.NumberOfFrames = 0
        # Need to escape brackets
        with pytest.raises(ValueError,
                           match=r"value of 0 for \(0028,0008\)"):
            reshape_pixel_array(self.ds, RESHAPE_ARRAYS['1frame_1sample'])

    def test_invalid_samples_raises(self):
        """Test an invalid Samples per Pixel value raises exception."""
        self.ds.SamplesPerPixel = 0
        # Need to escape brackets
        with pytest.raises(ValueError,
                           match=r"value of 0 for \(0028,0002\)"):
            reshape_pixel_array(self.ds, RESHAPE_ARRAYS['1frame_1sample'])

    def test_invalid_planar_conf_raises(self):
        self.ds.SamplesPerPixel = 3
        self.ds.PlanarConfiguration = 2
        # Need to escape brackets
        with pytest.raises(ValueError,
                           match=r"value of 2 for \(0028,0006\)"):
            reshape_pixel_array(self.ds,
                                RESHAPE_ARRAYS['1frame_3sample_0config'])


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ConvertColourSpace:
    """Tests for util.convert_color_space."""
    def test_unknown_current_raises(self):
        """Test an unknown current color space raises exception."""
        with pytest.raises(NotImplementedError,
                           match="Conversion from TEST to RGB is not suppo"):
            convert_color_space(None, 'TEST', 'RGB')

    def test_unknown_desired_raises(self):
        """Test an unknown desdired color space raises exception."""
        with pytest.raises(NotImplementedError,
                           match="Conversion from RGB to TEST is not suppo"):
            convert_color_space(None, 'RGB', 'TEST')

    @pytest.mark.parametrize(
        'current, desired',
        [('RGB', 'RGB'),
         ('YBR_FULL', 'YBR_FULL'), ('YBR_FULL', 'YBR_FULL_422'),
         ('YBR_FULL_422', 'YBR_FULL_422'), ('YBR_FULL_422', 'YBR_FULL')]
    )
    def test_current_is_desired(self, current, desired):
        """Test that the array is unchanged when current matches desired."""
        arr = np.ones((2, 3))
        assert np.array_equal(arr, convert_color_space(arr, current, desired))

    def test_rgb_ybr_rgb_single_frame(self):
        """Test round trip conversion of single framed pixel data."""
        ds = dcmread(RGB_8_3_1F)

        arr = ds.pixel_array
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

        ybr = convert_color_space(arr, 'RGB', 'YBR_FULL')
        assert (76, 85, 255) == tuple(ybr[5, 50, :])
        assert (166, 107, 192) == tuple(ybr[15, 50, :])
        assert (150, 44, 21) == tuple(ybr[25, 50, :])
        assert (203, 86, 75) == tuple(ybr[35, 50, :])
        assert (29, 255, 107) == tuple(ybr[45, 50, :])
        assert (142, 192, 118) == tuple(ybr[55, 50, :])
        assert (0, 128, 128) == tuple(ybr[65, 50, :])
        assert (64, 128, 128) == tuple(ybr[75, 50, :])
        assert (192, 128, 128) == tuple(ybr[85, 50, :])
        assert (255, 128, 128) == tuple(ybr[95, 50, :])

        # Round trip -> rounding errors get compounded
        rgb = convert_color_space(ybr, 'YBR_FULL', 'RGB')
        # All pixels within +/- 1 units
        assert np.allclose(rgb, arr, atol=1)
        assert rgb.shape == arr.shape

    def test_rgb_ybr_rgb_multi_frame(self):
        """Test round trip conversion of multi-framed pixel data."""
        ds = dcmread(RGB_8_3_2F)

        arr = ds.pixel_array
        assert (255, 0, 0) == tuple(arr[0, 5, 50, :])
        assert (255, 128, 128) == tuple(arr[0, 15, 50, :])
        assert (0, 255, 0) == tuple(arr[0, 25, 50, :])
        assert (128, 255, 128) == tuple(arr[0, 35, 50, :])
        assert (0, 0, 255) == tuple(arr[0, 45, 50, :])
        assert (128, 128, 255) == tuple(arr[0, 55, 50, :])
        assert (0, 0, 0) == tuple(arr[0, 65, 50, :])
        assert (64, 64, 64) == tuple(arr[0, 75, 50, :])
        assert (192, 192, 192) == tuple(arr[0, 85, 50, :])
        assert (255, 255, 255) == tuple(arr[0, 95, 50, :])
        # Frame 2 is frame 1 inverted
        assert np.array_equal((2**ds.BitsAllocated - 1) - arr[1], arr[0])

        ybr = convert_color_space(arr, 'RGB', 'YBR_FULL')
        assert (76, 85, 255) == tuple(ybr[0, 5, 50, :])
        assert (166, 107, 192) == tuple(ybr[0, 15, 50, :])
        assert (150, 44, 21) == tuple(ybr[0, 25, 50, :])
        assert (203, 86, 75) == tuple(ybr[0, 35, 50, :])
        assert (29, 255, 107) == tuple(ybr[0, 45, 50, :])
        assert (142, 192, 118) == tuple(ybr[0, 55, 50, :])
        assert (0, 128, 128) == tuple(ybr[0, 65, 50, :])
        assert (64, 128, 128) == tuple(ybr[0, 75, 50, :])
        assert (192, 128, 128) == tuple(ybr[0, 85, 50, :])
        assert (255, 128, 128) == tuple(ybr[0, 95, 50, :])
        # Frame 2
        assert (179, 171, 1) == tuple(ybr[1, 5, 50, :])
        assert (89, 149, 65) == tuple(ybr[1, 15, 50, :])
        assert (105, 212, 235) == tuple(ybr[1, 25, 50, :])
        assert (52, 170, 181) == tuple(ybr[1, 35, 50, :])
        assert (226, 1, 149) == tuple(ybr[1, 45, 50, :])
        assert (113, 65, 138) == tuple(ybr[1, 55, 50, :])
        assert (255, 128, 128) == tuple(ybr[1, 65, 50, :])
        assert (191, 128, 128) == tuple(ybr[1, 75, 50, :])
        assert (63, 128, 128) == tuple(ybr[1, 85, 50, :])
        assert (0, 128, 128) == tuple(ybr[1, 95, 50, :])

        # Round trip -> rounding errors get compounded
        rgb = convert_color_space(ybr, 'YBR_FULL', 'RGB')
        # All pixels within +/- 1 units
        assert np.allclose(rgb, arr, atol=1)
        assert rgb.shape == arr.shape

    def test_frame_by_frame(self):
        """Test processing frame-by-frame."""
        ds = dcmread(RGB_8_3_2F)

        arr = ds.pixel_array
        ybr = convert_color_space(arr, 'RGB', 'YBR_FULL', per_frame=True)
        assert (76, 85, 255) == tuple(ybr[0, 5, 50, :])
        assert (166, 107, 192) == tuple(ybr[0, 15, 50, :])
        assert (150, 44, 21) == tuple(ybr[0, 25, 50, :])
        assert (203, 86, 75) == tuple(ybr[0, 35, 50, :])
        assert (29, 255, 107) == tuple(ybr[0, 45, 50, :])
        assert (142, 192, 118) == tuple(ybr[0, 55, 50, :])
        assert (0, 128, 128) == tuple(ybr[0, 65, 50, :])
        assert (64, 128, 128) == tuple(ybr[0, 75, 50, :])
        assert (192, 128, 128) == tuple(ybr[0, 85, 50, :])
        assert (255, 128, 128) == tuple(ybr[0, 95, 50, :])
        # Frame 2
        assert (179, 171, 1) == tuple(ybr[1, 5, 50, :])
        assert (89, 149, 65) == tuple(ybr[1, 15, 50, :])
        assert (105, 212, 235) == tuple(ybr[1, 25, 50, :])
        assert (52, 170, 181) == tuple(ybr[1, 35, 50, :])
        assert (226, 1, 149) == tuple(ybr[1, 45, 50, :])
        assert (113, 65, 138) == tuple(ybr[1, 55, 50, :])
        assert (255, 128, 128) == tuple(ybr[1, 65, 50, :])
        assert (191, 128, 128) == tuple(ybr[1, 75, 50, :])
        assert (63, 128, 128) == tuple(ybr[1, 85, 50, :])
        assert (0, 128, 128) == tuple(ybr[1, 95, 50, :])


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_DtypeCorrectedForEndianness:
    """Tests for util.dtype_corrected_for_endianness."""
    def test_byte_swapping(self):
        """Test that the endianness of the system is taken into account."""
        # The main problem is that our testing environments are probably
        #   all little endian, but we'll try our best
        dtype = np.dtype('uint16')

        # < is little, = is native, > is big
        if byteorder == 'little':
            out = dtype_corrected_for_endianness(True, dtype)
            assert out.byteorder in ['<', '=']
            out = dtype_corrected_for_endianness(False, dtype)
            assert out.byteorder == '>'
        elif byteorder == 'big':
            out = dtype_corrected_for_endianness(True, dtype)
            assert out.byteorder == '<'
            out = dtype_corrected_for_endianness(False, dtype)
            assert out.byteorder in ['>', '=']

    def test_no_endian_raises(self):
        """Test that an unset endianness raises exception."""
        with pytest.raises(ValueError,
                           match="attribute 'is_little_endian' has"):
            dtype_corrected_for_endianness(None, None)


REFERENCE_LENGTH = [
    # (frames, rows, cols, samples), bit depth,
    #   result in (bytes, pixels, ybr_bytes)
    # YBR can only be 3 samples/px and > 1 bit depth
    # No 'NumberOfFrames' in dataset
    ((0, 0, 0, 0), 1, (0, 0, None)),
    ((0, 1, 1, 1), 1, (1, 1, None)),  # 1 bit -> 1 byte
    ((0, 1, 1, 3), 1, (1, 3, None)),  # 3 bits -> 1 byte
    ((0, 1, 3, 3), 1, (2, 9, None)),  # 9 bits -> 2 bytes
    ((0, 2, 2, 1), 1, (1, 4, None)),  # 4 bits -> 1 byte
    ((0, 2, 4, 1), 1, (1, 8, None)),  # 8 bits -> 1 byte
    ((0, 3, 3, 1), 1, (2, 9, None)),  # 9 bits -> 2 bytes
    ((0, 512, 512, 1), 1, (32768, 262144, None)),  # Typical length
    ((0, 512, 512, 3), 1, (98304, 786432, None)),
    ((0, 0, 0, 0), 8, (0, 0, None)),
    ((0, 1, 1, 1), 8, (1, 1, None)),  # Odd length
    ((0, 9, 1, 1), 8, (9, 9, None)),  # Odd length
    ((0, 1, 2, 1), 8, (2, 2, None)),  # Even length
    ((0, 512, 512, 1), 8, (262144, 262144, None)),
    ((0, 512, 512, 3), 8, (786432, 786432, 524288)),
    ((0, 0, 0, 0), 16, (0, 0, None)),
    ((0, 1, 1, 1), 16, (2, 1, None)),  # 16 bit data can't be odd length
    ((0, 1, 2, 1), 16, (4, 2, None)),
    ((0, 512, 512, 1), 16, (524288, 262144, None)),
    ((0, 512, 512, 3), 16, (1572864, 786432, 1048576)),
    ((0, 0, 0, 0), 32, (0, 0, None)),
    ((0, 1, 1, 1), 32, (4, 1, None)),  # 32 bit data can't be odd length
    ((0, 1, 2, 1), 32, (8, 2, None)),
    ((0, 512, 512, 1), 32, (1048576, 262144, None)),
    ((0, 512, 512, 3), 32, (3145728, 786432, 2097152)),
    # NumberOfFrames odd
    ((3, 0, 0, 0), 1, (0, 0, None)),
    ((3, 1, 1, 1), 1, (1, 3, None)),
    ((3, 1, 1, 3), 1, (2, 9, None)),
    ((3, 1, 3, 3), 1, (4, 27, None)),
    ((3, 2, 4, 1), 1, (3, 24, None)),
    ((3, 2, 2, 1), 1, (2, 12, None)),
    ((3, 3, 3, 1), 1, (4, 27, None)),
    ((3, 512, 512, 1), 1, (98304, 786432, None)),
    ((3, 512, 512, 3), 1, (294912, 2359296, 196608)),
    ((3, 0, 0, 0), 8, (0, 0, None)),
    ((3, 1, 1, 1), 8, (3, 3, None)),
    ((3, 9, 1, 1), 8, (27, 27, None)),
    ((3, 1, 2, 1), 8, (6, 6, None)),
    ((3, 512, 512, 1), 8, (786432, 786432, None)),
    ((3, 512, 512, 3), 8, (2359296, 2359296, 1572864)),
    ((3, 0, 0, 0), 16, (0, 0, None)),
    ((3, 512, 512, 1), 16, (1572864, 786432, None)),
    ((3, 512, 512, 3), 16, (4718592, 2359296, 3145728)),
    ((3, 0, 0, 0), 32, (0, 0, None)),
    ((3, 512, 512, 1), 32, (3145728, 786432, None)),
    ((3, 512, 512, 3), 32, (9437184, 2359296, 6291456)),
    # NumberOfFrames even
    ((4, 0, 0, 0), 1, (0, 0, None)),
    ((4, 1, 1, 1), 1, (1, 4, None)),
    ((4, 1, 1, 3), 1, (2, 12, None)),
    ((4, 1, 3, 3), 1, (5, 36, None)),
    ((4, 2, 4, 1), 1, (4, 32, None)),
    ((4, 2, 2, 1), 1, (2, 16, None)),
    ((4, 3, 3, 1), 1, (5, 36, None)),
    ((4, 512, 512, 1), 1, (131072, 1048576, None)),
    ((4, 512, 512, 3), 1, (393216, 3145728, 262144)),
    ((4, 0, 0, 0), 8, (0, 0, None)),
    ((4, 512, 512, 1), 8, (1048576, 1048576, None)),
    ((4, 512, 512, 3), 8, (3145728, 3145728, 2097152)),
    ((4, 0, 0, 0), 16, (0, 0, None)),
    ((4, 512, 512, 1), 16, (2097152, 1048576, None)),
    ((4, 512, 512, 3), 16, (6291456, 3145728, 4194304)),
    ((4, 0, 0, 0), 32, (0, 0, None)),
    ((4, 512, 512, 1), 32, (4194304, 1048576, None)),
    ((4, 512, 512, 3), 32, (12582912, 3145728, 8388608)),
]


class TestGetExpectedLength:
    """Tests for util.get_expected_length."""
    @pytest.mark.parametrize('shape, bits, length', REFERENCE_LENGTH)
    def test_length_in_bytes(self, shape, bits, length):
        """Test get_expected_length(ds, unit='bytes')."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME2'
        ds.Rows = shape[1]
        ds.Columns = shape[2]
        ds.BitsAllocated = bits
        if shape[0] != 0:
            ds.NumberOfFrames = shape[0]
        ds.SamplesPerPixel = shape[3]

        assert length[0] == get_expected_length(ds, unit='bytes')

    @pytest.mark.parametrize('shape, bits, length', REFERENCE_LENGTH)
    def test_length_in_pixels(self, shape, bits, length):
        """Test get_expected_length(ds, unit='pixels')."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME2'
        ds.Rows = shape[1]
        ds.Columns = shape[2]
        ds.BitsAllocated = bits
        if shape[0] != 0:
            ds.NumberOfFrames = shape[0]
        ds.SamplesPerPixel = shape[3]

        assert length[1] == get_expected_length(ds, unit='pixels')

    @pytest.mark.parametrize('shape, bits, length', REFERENCE_LENGTH)
    def test_length_ybr_422(self, shape, bits, length):
        """Test get_expected_length for YBR_FULL_422."""
        if shape[3] != 3 or bits == 1:
            return

        ds = Dataset()
        ds.PhotometricInterpretation = 'YBR_FULL_422'
        ds.Rows = shape[1]
        ds.Columns = shape[2]
        ds.BitsAllocated = bits
        if shape[0] != 0:
            ds.NumberOfFrames = shape[0]
        ds.SamplesPerPixel = shape[3]

        assert length[2] == get_expected_length(ds, unit='bytes')


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ModalityLUT:
    """Tests for util.apply_modality_lut()."""
    def test_slope_intercept(self):
        """Test the rescale slope/intercept transform."""
        ds = dcmread(MOD_16)
        assert 1 == ds.RescaleSlope
        assert -1024 == ds.RescaleIntercept
        arr = ds.pixel_array
        out = apply_modality_lut(arr, ds)
        assert out.flags.writeable
        assert np.float64 == out.dtype

        assert np.array_equal(arr - 1024, out)

        ds.RescaleSlope = 2.5
        ds.RescaleIntercept = -2048
        out = apply_modality_lut(arr, ds)
        assert np.array_equal(arr * 2.5 - 2048, out)

    def test_lut_sequence(self):
        """Test the LUT Sequence transform."""
        ds = dcmread(MOD_16_SEQ)
        seq = ds.ModalityLUTSequence[0]
        assert [4096, -2048, 16] == seq.LUTDescriptor
        arr = ds.pixel_array
        assert -2048 == arr.min()
        assert 4095 == arr.max()
        out = apply_modality_lut(arr, ds)

        # IV > 2047 -> LUT[4095]
        mapped_pixels = arr > 2047
        assert seq.LUTData[-1] == out[mapped_pixels][0]
        assert (seq.LUTData[-1] == out[mapped_pixels]).all()
        assert out.flags.writeable
        assert out.dtype == np.uint16

        assert [65535, 65535, 49147, 49147, 65535] == list(out[0, 50:55])
        assert [65535, 65535, 65535, 65535, 65535] == list(out[50, 50:55])
        assert [65535, 65535, 65535, 65535, 65535] == list(out[100, 50:55])
        assert [65535, 65535, 49147, 49147, 65535] == list(out[150, 50:55])
        assert [65535, 65535, 49147, 49147, 65535] == list(out[200, 50:55])
        assert 39321 == out[185, 340]
        assert 45867 == out[185, 385]
        assert 52428 == out[228, 385]
        assert 58974 == out[291, 385]

    def test_lut_sequence_zero_entries(self):
        """Test that 0 entries is interpreted correctly."""
        # LUTDescriptor[0] of 0 -> 65536, but only 4096 entries so any
        # attempt to access LUTData[4096] or higher will raise IndexError
        ds = dcmread(MOD_16_SEQ)
        seq = ds.ModalityLUTSequence[0]
        seq.LUTDescriptor = [0, 0, 16]
        assert 4096 == len(seq.LUTData)
        arr = np.asarray([0, 4095, 4096, 65535])
        msg = r"index 4096 is out of bounds"
        with pytest.raises(IndexError, match=msg):
            apply_modality_lut(arr, ds)

        # LUTData with 65536 entries
        seq.LUTData = [0] * 65535 + [1]
        out = apply_modality_lut(arr, ds)
        assert [0, 0, 0, 1] == list(out)

    def test_unchanged(self):
        """Test no modality LUT transform."""
        ds = dcmread(MOD_16)
        del ds.RescaleSlope
        del ds.RescaleIntercept
        arr = ds.pixel_array
        out = apply_modality_lut(arr, ds)
        assert arr is out

        ds.ModalityLUTSequence = []
        out = apply_modality_lut(arr, ds)
        assert arr is out

    def test_lutdata_ow(self):
        """Test LUT Data with VR OW."""
        ds = dcmread(MOD_16_SEQ)
        assert ds.is_little_endian is True
        seq = ds.ModalityLUTSequence[0]
        assert [4096, -2048, 16] == seq.LUTDescriptor
        seq['LUTData'].VR = 'OW'
        seq.LUTData = pack('<4096H', *seq.LUTData)
        arr = ds.pixel_array
        assert -2048 == arr.min()
        assert 4095 == arr.max()
        out = apply_modality_lut(arr, ds)

        # IV > 2047 -> LUT[4095]
        mapped_pixels = arr > 2047
        assert 65535 == out[mapped_pixels][0]
        assert (65535 == out[mapped_pixels]).all()
        assert out.flags.writeable
        assert out.dtype == np.uint16

        assert [65535, 65535, 49147, 49147, 65535] == list(out[0, 50:55])
        assert [65535, 65535, 65535, 65535, 65535] == list(out[50, 50:55])
        assert [65535, 65535, 65535, 65535, 65535] == list(out[100, 50:55])
        assert [65535, 65535, 49147, 49147, 65535] == list(out[150, 50:55])
        assert [65535, 65535, 49147, 49147, 65535] == list(out[200, 50:55])
        assert 39321 == out[185, 340]
        assert 45867 == out[185, 385]
        assert 52428 == out[228, 385]
        assert 58974 == out[291, 385]


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_PaletteColor:
    """Tests for util.apply_color_lut()."""
    def setup(self):
        """Setup the tests"""
        self.o_palette = get_palette_files('pet.dcm')[0]
        self.n_palette = get_palette_files('pet.dcm')[0][:-3] + 'tmp'

    def teardown(self):
        """Teardown the tests"""
        if os.path.exists(self.n_palette):
            os.rename(self.n_palette, self.o_palette)

    def test_neither_ds_nor_palette_raises(self):
        """Test missing `ds` and `palette` raise an exception."""
        ds = dcmread(PAL_08_256_0_16_1F)
        msg = r"Either 'ds' or 'palette' is required"
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array)

    def test_palette_unknown_raises(self, disable_value_validation):
        """Test using an unknown `palette` raise an exception."""
        ds = dcmread(PAL_08_256_0_16_1F)
        # Palette name
        msg = r"Unknown palette 'TEST'"
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, palette='TEST')

        # SOP Instance UID
        msg = r"Unknown palette '1.2.840.10008.1.1'"
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, palette='1.2.840.10008.1.1')

    def test_palette_unavailable_raises(self, disable_value_validation):
        """Test using a missing `palette` raise an exception."""
        os.rename(self.o_palette, self.n_palette)
        ds = dcmread(PAL_08_256_0_16_1F)
        msg = r"list index out of range"
        with pytest.raises(IndexError, match=msg):
            apply_color_lut(ds.pixel_array, palette='PET')

    def test_supplemental_raises(self):
        """Test that supplemental palette color LUT raises exception."""
        ds = dcmread(SUP_16_16_2F)
        msg = (
            r"Use of this function with the Supplemental Palette Color Lookup "
            r"Table Module is not currently supported"
        )
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, ds)

    def test_invalid_bit_depth_raises(self):
        """Test that an invalid bit depth raises an exception."""
        ds = dcmread(PAL_08_256_0_16_1F)
        ds.RedPaletteColorLookupTableDescriptor[2] = 15
        msg = r"data type ['\"]uint15['\"] not understood"
        with pytest.raises(TypeError, match=msg):
            apply_color_lut(ds.pixel_array, ds)

    def test_invalid_lut_bit_depth_raises(self):
        """Test that an invalid LUT bit depth raises an exception."""
        ds = dcmread(PAL_08_256_0_16_1F)
        ds.RedPaletteColorLookupTableData = (
            ds.RedPaletteColorLookupTableData[:-2]
        )
        ds.GreenPaletteColorLookupTableData = (
            ds.GreenPaletteColorLookupTableData[:-2]
        )
        ds.BluePaletteColorLookupTableData = (
            ds.BluePaletteColorLookupTableData[:-2]
        )
        msg = (
            r"The bit depth of the LUT data '15.9' is invalid \(only 8 or 16 "
            r"bits per entry allowed\)"
        )
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, ds)

    def test_unequal_lut_length_raises(self):
        """Test that an unequal LUT lengths raise an exception."""
        ds = dcmread(PAL_08_256_0_16_1F)
        ds.BluePaletteColorLookupTableData = (
            ds.BluePaletteColorLookupTableData[:-2]
        )
        msg = r"LUT data must be the same length"
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, ds)

    def test_no_palette_color(self):
        """Test that an unequal LUT lengths raise an exception."""
        ds = dcmread(PAL_08_256_0_16_1F)
        del ds.RedPaletteColorLookupTableData
        msg = r"No suitable Palette Color Lookup Table Module found"
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, ds)

    def test_uint08_16(self):
        """Test uint8 Pixel Data with 16-bit LUT entries."""
        ds = dcmread(PAL_08_200_0_16_1F, force=True)
        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian
        assert 8 == ds.BitsStored
        assert 16 == ds.RedPaletteColorLookupTableDescriptor[2]
        arr = ds.pixel_array
        orig = arr.copy()
        rgb = apply_color_lut(arr, ds)
        assert (480, 640, 3) == rgb.shape
        assert [0, 0, 0] == list(rgb[0, 0, :])
        assert [9216, 9216, 9216] == list(rgb[0, 4, :])
        assert [18688, 18688, 18688] == list(rgb[0, 9, :])
        assert [27904, 33536, 0] == list(rgb[0, 638, :])
        assert [18688, 24320, 0] == list(rgb[479, 639, :])

        # original `arr` is unchanged
        assert np.array_equal(orig, arr)

    def test_uint08_16_2frame(self):
        """Test 2 frame uint8 Pixel Data with 16-bit LUT entries."""
        ds = dcmread(PAL_08_256_0_16_2F)
        assert 8 == ds.BitsStored
        assert 16 == ds.RedPaletteColorLookupTableDescriptor[2]
        arr = ds.pixel_array
        orig = arr.copy()
        rgb = apply_color_lut(arr, ds)
        assert (2, 600, 800, 3) == rgb.shape
        assert [9472, 15872, 24064] == list(rgb[0, 0, 0, :])
        assert [34816, 43520, 54016] == list(rgb[0, 12, 12, :])
        assert [65280, 65280, 65280] == list(rgb[0, 17, 110, :])
        assert [0, 0, 0] == list(rgb[0, 77, 103, :])
        assert [23040, 52480, 65280] == list(rgb[0, 478, 793, :])

        # 2nd frame is inverse of 1st, so won't be coloured correctly
        ref = np.asarray(
            [[26112, 26112, 26112],
             [54528, 54528, 54528],
             [54528, 54528, 54528],
             [16640, 16640, 16640],
             [49152, 45056, 22016],
             [34816, 43520, 54016],
             [5632, 9984, 14848],
             [62464, 2816, 2816],
             [3072, 5632, 8192],
             [3072, 5632, 8192]]
        )
        assert np.array_equal(ref, rgb[1, 143:153, 355, :])

        # original `arr` is unchanged
        assert np.array_equal(orig, arr)

    def test_uint16_16_segmented_litle(self):
        """Test uint16 Pixel Data with 16-bit LUT entries."""
        ds = dcmread(PAL_SEG_LE_16_1F)
        assert 16 == ds.BitsStored
        assert 16 == ds.RedPaletteColorLookupTableDescriptor[2]
        arr = ds.pixel_array
        orig = arr.copy()
        rgb = apply_color_lut(arr, ds)
        assert (480, 640, 3) == rgb.shape
        assert [10280, 11565, 16705] == list(rgb[0, 0, :])
        assert [10280, 11565, 16705] == list(rgb[0, 320, :])
        assert [10280, 11565, 16705] == list(rgb[0, 639, :])
        assert [0, 0, 0] == list(rgb[240, 0, :])
        assert [257, 257, 257] == list(rgb[240, 320, :])
        assert [2313, 2313, 2313] == list(rgb[240, 639, :])
        assert [10280, 11565, 16705] == list(rgb[479, 0, :])
        assert [10280, 11565, 16705] == list(rgb[479, 320, :])
        assert [10280, 11565, 16705] == list(rgb[479, 639, :])

        assert (orig == arr).all()

    def test_uint16_16_segmented_big(self):
        """Test big endian uint16 Pixel Data with 16-bit LUT entries."""
        ds = dcmread(PAL_SEG_BE_16_1F)
        assert 16 == ds.BitsStored
        assert 16 == ds.RedPaletteColorLookupTableDescriptor[2]
        arr = ds.pixel_array
        orig = arr.copy()
        rgb = apply_color_lut(arr, ds)
        assert (480, 640, 3) == rgb.shape
        assert [10280, 11565, 16705] == list(rgb[0, 0, :])
        assert [10280, 11565, 16705] == list(rgb[0, 320, :])
        assert [10280, 11565, 16705] == list(rgb[0, 639, :])
        assert [0, 0, 0] == list(rgb[240, 0, :])
        assert [257, 257, 257] == list(rgb[240, 320, :])
        assert [2313, 2313, 2313] == list(rgb[240, 639, :])
        assert [10280, 11565, 16705] == list(rgb[479, 0, :])
        assert [10280, 11565, 16705] == list(rgb[479, 320, :])
        assert [10280, 11565, 16705] == list(rgb[479, 639, :])

    def test_16_allocated_8_entries(self):
        """Test LUT with 8-bit entries in 16 bits allocated."""
        ds = dcmread(PAL_08_200_0_16_1F, force=True)
        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian
        ds.RedPaletteColorLookupTableDescriptor = [200, 0, 8]
        lut = pack('<200H', *list(range(0, 200)))
        assert 400 == len(lut)
        ds.RedPaletteColorLookupTableData = lut
        ds.GreenPaletteColorLookupTableData = lut
        ds.BluePaletteColorLookupTableData = lut
        arr = ds.pixel_array
        assert (56, 149) == (arr.min(), arr.max())
        out = apply_color_lut(arr, ds)
        # Because the LUTs are mapped index to value (i.e. LUT[0] = 0,
        # LUT[149] = 149), the output array should equal the input array
        # but with three channels of identical values
        assert np.array_equal(arr, out[:, :, 0])
        assert np.array_equal(arr, out[:, :, 1])
        assert np.array_equal(arr, out[:, :, 2])

    def test_alpha(self):
        """Test applying a color palette with an alpha channel."""
        ds = dcmread(PAL_08_256_0_16_1F)
        ds.AlphaPaletteColorLookupTableData = b'\x00\x80' * 256
        arr = ds.pixel_array
        rgba = apply_color_lut(arr, ds)
        assert (600, 800, 4) == rgba.shape
        assert 32768 == rgba[:, :, 3][0, 0]
        assert (32768 == rgba[:, :, 3]).any()

    def test_well_known_palette(self, disable_value_validation):
        """Test using a well-known palette."""
        ds = dcmread(PAL_08_256_0_16_1F)
        # Drop it to 8-bit
        arr = ds.pixel_array
        rgb = apply_color_lut(arr, palette='PET')
        line = rgb[68:88, 364, :]
        ref = [
            [249, 122, 12],
            [255, 130, 4],
            [255, 136, 16],
            [255, 134, 12],
            [253, 126, 4],
            [239, 112, 32],
            [211, 84, 88],
            [197, 70, 116],
            [177, 50, 156],
            [168, 40, 176],
            [173, 46, 164],
            [185, 58, 140],
            [207, 80, 96],
            [209, 82, 92],
            [189, 62, 132],
            [173, 46, 164],
            [168, 40, 176],
            [162, 34, 188],
            [162, 34, 188],
            [154, 26, 204],
        ]
        assert np.array_equal(np.asarray(ref), line)
        uid = apply_color_lut(arr, palette='1.2.840.10008.1.5.2')
        assert np.array_equal(uid, rgb)

    def test_first_map_positive(self):
        """Test a positive first mapping value."""
        ds = dcmread(PAL_08_200_0_16_1F, force=True)
        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian
        ds.RedPaletteColorLookupTableDescriptor[1] = 10
        arr = ds.pixel_array
        rgb = apply_color_lut(arr, ds)
        # All IVs < 10 should be set to LUT[0]
        # All IVs >= 10 should be shifted down 10 entries
        # Original IV range is 56 to 149 -> 46 to 139
        # LUT[88] -> LUT[78] = [33280, 56320, 65280]
        # LUT[149] -> LUT[139] = [50944, 16384, 27904]
        assert [33280, 56320, 65280] == list(rgb[arr == 88][0])
        assert ([33280, 56320, 65280] == rgb[arr == 88]).all()
        assert [50944, 16384, 27904] == list(rgb[arr == 149][0])
        assert ([50944, 16384, 27904] == rgb[arr == 149]).all()

    def test_first_map_negative(self):
        """Test a positive first mapping value."""
        ds = dcmread(PAL_08_200_0_16_1F, force=True)
        ds.file_meta = FileMetaDataset()
        ds.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian
        ds.RedPaletteColorLookupTableDescriptor[1] = -10
        arr = ds.pixel_array
        rgb = apply_color_lut(arr, ds)
        # All IVs < -10 should be set to LUT[0]
        # All IVs >= -10 should be shifted up 10 entries
        # Original IV range is 56 to 149 -> 66 to 159
        # LUT[60] -> LUT[70] = [33280 61952 65280]
        # LUT[130] -> LUT[140] = [60160, 25600, 37376]
        assert [33280, 61952, 65280] == list(rgb[arr == 60][0])
        assert ([33280, 61952, 65280] == rgb[arr == 60]).all()
        assert [60160, 25600, 37376] == list(rgb[arr == 130][0])
        assert ([60160, 25600, 37376] == rgb[arr == 130]).all()

    def test_unchanged(self):
        """Test dataset with no LUT is unchanged."""
        # Regression test for #1068
        ds = dcmread(MOD_16, force=True)
        assert 'RedPaletteColorLookupTableDescriptor' not in ds
        msg = r"No suitable Palette Color Lookup Table Module found"
        with pytest.raises(ValueError, match=msg):
            apply_color_lut(ds.pixel_array, ds)


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ExpandSegmentedLUT:
    """Tests for util._expand_segmented_lut()."""
    def test_discrete(self):
        """Test expanding a discrete segment."""
        data = (0, 1, 0)
        assert [0] == _expand_segmented_lut(data, 'H')

        data = (0, 2, 0, 112)
        assert [0, 112] == _expand_segmented_lut(data, 'H')

        data = (0, 2, 0, -112)
        assert [0, -112] == _expand_segmented_lut(data, 'H')

        data = (0, 2, 0, 112, 0, 0)
        assert [0, 112] == _expand_segmented_lut(data, 'H')

        data = (0, 2, 0, -112, 0, 0)
        assert [0, -112] == _expand_segmented_lut(data, 'H')

    def test_linear(self):
        """Test expanding a linear segment."""
        # Linear can never be the first segment
        # Positive slope
        data = (0, 2, 0, 28672, 1, 5, 49152)
        out = _expand_segmented_lut(data, 'H')
        assert [0, 28672, 32768, 36864, 40960, 45056, 49152] == out

        data = (0, 1, -400, 1, 5, 0)
        out = _expand_segmented_lut(data, 'H')
        assert [-400, -320, -240, -160, -80, 0] == out

        # Positive slope, floating point steps
        data = (0, 1, 163, 1, 48, 255)
        out = _expand_segmented_lut(data, 'H')
        assert (1 + 48) == len(out)

        # No slope
        data = (0, 2, 0, 28672, 1, 5, 28672)
        out = _expand_segmented_lut(data, 'H')
        assert [0, 28672, 28672, 28672, 28672, 28672, 28672] == out

        data = (0, 1, -100, 1, 5, -100)
        out = _expand_segmented_lut(data, 'H')
        assert [-100, -100, -100, -100, -100, -100] == out

        # Negative slope
        data = (0, 2, 0, 49152, 1, 5, 28672)
        out = _expand_segmented_lut(data, 'H')
        assert [0, 49152, 45056, 40960, 36864, 32768, 28672] == out

        data = (0, 1, 0, 1, 5, -400)
        out = _expand_segmented_lut(data, 'H')
        assert [0, -80, -160, -240, -320, -400] == out

    def test_indirect_08(self):
        """Test expanding an indirect segment encoded as 8-bit."""
        # No real world test data available for this
        # LSB, MSB
        ref_a = [0, 112, 128, 144, 160, 176, 192, 192, 192, 192, 192, 192]

        # Little endian
        data = (0, 2, 0, 112, 1, 5, 192, 2, 1, 4, 0, 0, 0)
        out = _expand_segmented_lut(data, '<B')
        assert ref_a == out

        data = (0, 2, 0, 112, 2, 1, 0, 0, 0, 0)
        out = _expand_segmented_lut(data, '<B')
        assert [0, 112, 0, 112] == out

        # 0x0100 0x0302 is 66051 in LE 16-bit MSB, LSB
        data = [0, 1, 0] * 22017 + [0, 2, 1, 2] + [2, 1, 3, 2, 1, 0]
        out = _expand_segmented_lut(data, '<B')
        assert [0] * 22017 + [1, 2, 1, 2] == out

        # Big endian
        data = (0, 2, 0, 112, 1, 5, 192, 2, 1, 0, 4, 0, 0)
        out = _expand_segmented_lut(data, '>B')
        assert ref_a == out

        data = (0, 2, 0, 112, 2, 1, 0, 0, 0, 0)
        out = _expand_segmented_lut(data, '>B')
        assert [0, 112, 0, 112] == out

        # 0x0001 0x0203 is 66051 in BE 16-bit MSB, LSB
        data = [0, 1, 0] * 22017 + [0, 2, 1, 2] + [2, 1, 2, 3, 0, 1]
        out = _expand_segmented_lut(data, '>B')
        assert [0] * 22017 + [1, 2, 1, 2] == out

    def test_indirect_16(self):
        """Test expanding an indirect segment encoded as 16-bit."""
        # Start from a discrete segment
        data = (0, 2, 0, 112, 1, 5, 192, 2, 2, 0, 0)
        out = _expand_segmented_lut(data, 'H')
        assert [0, 112, 128, 144, 160, 176, 192] * 2 == out

        # Start from a linear segment
        data = (0, 2, 0, 112, 1, 5, 192, 2, 1, 4, 0)
        out = _expand_segmented_lut(data, 'H')
        assert [
            0, 112, 128, 144, 160, 176, 192, 192, 192, 192, 192, 192
        ] == out

    def test_palettes_spring(self):
        """Test expanding the SPRING palette."""
        ds = dcmread(get_palette_files('spring.dcm')[0])

        bs = ds.SegmentedRedPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [255] * 256 == out

        bs = ds.SegmentedGreenPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert list(range(0, 256)) == out

        bs = ds.SegmentedBluePaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert list(range(255, -1, -1)) == out

    def test_palettes_summer(self):
        """Test expanding the SUMMER palette."""
        ds = dcmread(get_palette_files('summer.dcm')[0])

        bs = ds.SegmentedRedPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [0] * 256 == out

        bs = ds.SegmentedGreenPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [255, 255, 254, 254, 253] == out[:5]
        assert [130, 129, 129, 128, 128] == out[-5:]

        bs = ds.SegmentedBluePaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [0] * 128 == out[:128]
        assert [246, 248, 250, 252, 254] == out[-5:]

    def test_palettes_fall(self):
        """Test expanding the FALL palette."""
        ds = dcmread(get_palette_files('fall.dcm')[0])

        bs = ds.SegmentedRedPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [255] * 256 == out

        bs = ds.SegmentedGreenPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert list(range(255, -1, -1)) == out

        bs = ds.SegmentedBluePaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [0] * 256 == out

    def test_palettes_winter(self):
        """Test expanding the WINTER palette."""
        ds = dcmread(get_palette_files('winter.dcm')[0])

        bs = ds.SegmentedRedPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [0] * 128 == out[:128]
        assert [123, 124, 125, 126, 127] == out[-5:]

        bs = ds.SegmentedGreenPaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert list(range(0, 256)) == out

        bs = ds.SegmentedBluePaletteColorLookupTableData
        fmt = '<{}B'.format(len(bs))
        data = unpack(fmt, bs)
        out = _expand_segmented_lut(data, fmt)
        assert [255, 255, 254, 254, 253] == out[:5]
        assert [130, 129, 129, 128, 128] == out[-5:]

    def test_first_linear_raises(self):
        """Test having a linear segment first raises exception."""
        data = (1, 5, 49152)
        msg = (
            r"Error expanding a segmented palette color lookup table: "
            r"the first segment cannot be a linear segment"
        )
        with pytest.raises(ValueError, match=msg):
            _expand_segmented_lut(data, 'H')

    def test_first_indirect_raises(self):
        """Test having a linear segment first raises exception."""
        data = (2, 5, 2, 0)
        msg = (
            r"Error expanding a segmented palette color lookup table: "
            r"the first segment cannot be an indirect segment"
        )
        with pytest.raises(ValueError, match=msg):
            _expand_segmented_lut(data, 'H')

    def test_unknown_opcode_raises(self):
        """Test having an unknown opcode raises exception."""
        data = (3, 5, 49152)
        msg = (
            r"Error expanding a segmented palette lookup table: "
            r"unknown segment type '3'"
        )
        with pytest.raises(ValueError, match=msg):
            _expand_segmented_lut(data, 'H')


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ApplyWindowing:
    """Tests for util.apply_windowing()."""
    def test_window_single_view(self):
        """Test windowing with a single view."""
        # 12-bit unsigned
        ds = dcmread(WIN_12_1F)
        assert 16 == ds.BitsAllocated
        assert 12 == ds.BitsStored
        assert 0 == ds.PixelRepresentation
        ds.WindowCenter = 450
        ds.WindowWidth = 790
        assert 450 == ds.WindowCenter
        assert 790 == ds.WindowWidth

        arr = ds.pixel_array
        assert 642 == arr[326, 130]
        out = apply_windowing(arr, ds)
        assert 3046.6 == pytest.approx(out[326, 130], abs=0.1)

    def test_window_multi_view(self):
        """Test windowing with multiple views."""
        ds = dcmread(WIN_12_1F)
        assert 16 == ds.BitsAllocated
        assert 12 == ds.BitsStored
        assert 0 == ds.PixelRepresentation
        if HAVE_NP and config.use_DS_numpy:
            expected = np.array([450, 200])
            assert np.allclose(ds.WindowCenter, expected)
            expected = np.array([790, 443])
            assert np.allclose(ds.WindowWidth, expected)
        else:
            assert [450, 200] == ds.WindowCenter
            assert [790, 443] == ds.WindowWidth

        arr = ds.pixel_array
        assert 642 == arr[326, 130]
        out = apply_windowing(arr, ds)
        assert 3046.6 == pytest.approx(out[326, 130], abs=0.1)
        out = apply_windowing(arr, ds, index=1)
        assert 4095.0 == pytest.approx(out[326, 130], abs=0.1)

    def test_window_uint8(self):
        """Test windowing an 8-bit unsigned array."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 0
        ds.BitsStored = 8
        arr = np.asarray([0, 1, 128, 254, 255], dtype='uint8')

        # Linear
        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert [255, 255, 255, 255, 255] == apply_windowing(arr, ds).tolist()

        ds.WindowWidth = 128
        ds.WindowCenter = 254
        assert [0, 0, 0, 128.5, 130.5] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

        # Linear exact
        ds.VOILUTFunction = 'LINEAR_EXACT'
        assert [0, 0, 0, 127.5, 129.5] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

        # Sigmoid
        ds.VOILUTFunction = 'SIGMOID'
        assert [0.1, 0.1, 4.9, 127.5, 129.5] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

    def test_window_uint16(self):
        """Test windowing a 16-bit unsigned array."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 0
        ds.BitsStored = 16
        arr = np.asarray([0, 1, 32768, 65534, 65535], dtype='uint16')

        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert [65535] * 5 == apply_windowing(arr, ds).tolist()

        ds.WindowWidth = 32768
        ds.WindowCenter = 254
        assert [32260.5, 32262.5, 65535, 65535, 65535] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

        ds.VOILUTFunction = 'LINEAR_EXACT'
        assert [32259.5, 32261.5, 65535, 65535, 65535] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

        ds.VOILUTFunction = 'SIGMOID'
        assert [32259.5, 32261.5, 64319.8, 65512.3, 65512.3] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

    def test_window_uint32(self):
        """Test windowing a 32-bit unsigned array."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 0
        ds.BitsStored = 32
        y_max = 2**32 - 1
        arr = np.asarray([0, 1, 2**31, y_max - 1, y_max], dtype='uint32')

        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert [y_max] * 5 == apply_windowing(arr, ds).tolist()

        ds.WindowWidth = 342423423423
        ds.WindowCenter = 757336
        assert (
            [2147474148.4, 2147474148.4,
             2174409724, 2201345299.7, 2201345299.7] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        ds.VOILUTFunction = 'LINEAR_EXACT'
        assert (
            [2147474148.3, 2147474148.4,
             2174409724, 2201345299.7, 2201345299.7] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        ds.VOILUTFunction = 'SIGMOID'
        assert (
            [2147474148.3, 2147474148.4,
             2174408313.1, 2201334008.2, 2201334008.3] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

    def test_window_int8(self):
        """Test windowing an 8-bit signed array."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 1
        ds.BitsStored = 8
        arr = np.asarray([-128, -127, -1, 0, 1, 126, 127], dtype='int8')

        # Linear
        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert [-128, -128, -128, 127, 127, 127, 127] == pytest.approx(
            apply_windowing(arr, ds).tolist()
        )

        ds.WindowWidth = 128
        ds.WindowCenter = -5
        assert [-128, -128, 8.5, 10.5, 12.6, 127, 127] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

        # Linear exact
        ds.VOILUTFunction = 'LINEAR_EXACT'
        assert [-128, -128, 7.5, 9.5, 11.5, 127, 127] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

        # Sigmoid
        ds.VOILUTFunction = 'SIGMOID'
        assert [-122.7, -122.5, 7.5, 9.4, 11.4, 122.8, 122.9] == pytest.approx(
            apply_windowing(arr, ds).tolist(), abs=0.1
        )

    def test_window_int16(self):
        """Test windowing an 8-bit signed array."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 1
        ds.BitsStored = 16
        arr = np.asarray([-128, -127, -1, 0, 1, 126, 127], dtype='int16')

        # Linear
        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert (
            [-32768, -32768, -32768,
             32767, 32767, 32767, 32767] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        ds.WindowWidth = 128
        ds.WindowCenter = -5
        assert (
            [-32768, -32768, 2321.6,
             2837.6, 3353.7, 32767, 32767] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        # Linear exact
        ds.VOILUTFunction = 'LINEAR_EXACT'
        assert (
            [-32768, -32768, 2047.5,
             2559.5, 3071.5, 32767, 32767] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        # Sigmoid
        ds.VOILUTFunction = 'SIGMOID'
        assert (
            [-31394.1, -31351.4, 2044.8,
             2554.3, 3062.5, 31692, 31724.6] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

    def test_window_int32(self):
        """Test windowing an 32-bit signed array."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 1
        ds.BitsStored = 32
        arr = np.asarray([-128, -127, -1, 0, 1, 126, 127], dtype='int32')

        # Linear
        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert (
            [-2**31, -2**31, -2**31,
             2**31 - 1, 2**31 - 1, 2**31 - 1, 2**31 - 1] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        ds.WindowWidth = 128
        ds.WindowCenter = -5
        assert (
            [-2147483648, -2147483648, 152183880, 186002520.1,
             219821160.3, 2147483647, 2147483647] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        # Linear exact
        ds.VOILUTFunction = 'LINEAR_EXACT'
        assert (
            [-2147483648, -2147483648, 134217727.5, 167772159.5,
             201326591.5, 2147483647, 2147483647] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

        # Sigmoid
        ds.VOILUTFunction = 'SIGMOID'
        assert (
            [-2057442919.3, -2054646500.7, 134043237.4, 167431657.4,
             200738833.7, 2077033158.8, 2079166214.8] == pytest.approx(
                apply_windowing(arr, ds).tolist(), abs=0.1
            )
        )

    def test_window_multi_frame(self):
        """Test windowing with a multiple frames."""
        ds = dcmread(WIN_12_1F)
        assert 16 == ds.BitsAllocated
        assert 12 == ds.BitsStored
        assert 0 == ds.PixelRepresentation
        ds.WindowCenter = 450
        ds.WindowWidth = 790
        assert 450 == ds.WindowCenter
        assert 790 == ds.WindowWidth

        arr = ds.pixel_array
        arr = np.stack([arr, 4095 - arr])
        assert (2, 484, 484) == arr.shape
        assert 642 == arr[0, 326, 130]
        assert 3453 == arr[1, 326, 130]
        out = apply_windowing(arr, ds)
        assert 3046.6 == pytest.approx(out[0, 326, 130], abs=0.1)
        assert 4095.0 == pytest.approx(out[1, 326, 130], abs=0.1)

    def test_window_rescale(self):
        """Test windowing after a rescale operation."""
        ds = dcmread(WIN_12_1F)
        assert 16 == ds.BitsAllocated
        assert 12 == ds.BitsStored
        assert 0 == ds.PixelRepresentation
        if HAVE_NP and config.use_DS_numpy:
            expected = np.array([450, 200])
            assert np.allclose(ds.WindowCenter, expected)
            expected = np.array([790, 443])
            assert np.allclose(ds.WindowWidth, expected)
        else:
            assert [450, 200] == ds.WindowCenter
            assert [790, 443] == ds.WindowWidth
        ds.RescaleSlope = 1.2
        ds.RescaleIntercept = 0

        arr = ds.pixel_array
        assert 0 == arr[16, 60]
        assert 642 == arr[326, 130]
        assert 1123 == arr[316, 481]
        hu = apply_modality_lut(arr, ds)
        assert 0 == hu[16, 60]
        assert 770.4 == hu[326, 130]
        assert 1347.6 == hu[316, 481]
        # With rescale -> output range is 0 to 4914
        out = apply_windowing(hu, ds)
        assert 0 == pytest.approx(out[16, 60], abs=0.1)
        assert 4455.6 == pytest.approx(out[326, 130], abs=0.1)
        assert 4914.0 == pytest.approx(out[316, 481], abs=0.1)

    def test_window_modality_lut(self):
        """Test windowing after a modality LUT operation."""
        ds = dcmread(MOD_16_SEQ)
        ds.WindowCenter = [49147, 200]
        ds.WindowWidth = [790, 443]
        assert 16 == ds.BitsAllocated
        assert 12 == ds.BitsStored
        assert 1 == ds.PixelRepresentation  # Signed
        assert 'RescaleSlope' not in ds
        assert 'ModalityLUTSequence' in ds

        seq = ds.ModalityLUTSequence[0]
        assert [4096, -2048, 16] == seq.LUTDescriptor
        arr = ds.pixel_array
        assert -2048 == arr.min()
        assert 4095 == arr.max()

        arr = ds.pixel_array
        assert 2047 == arr[16, 60]
        assert 1023 == arr[0, 1]
        hu = apply_modality_lut(arr, ds)
        assert 65535 == hu[16, 60]
        assert 49147 == hu[0, 1]
        out = apply_windowing(hu, ds)
        assert 65535.0 == pytest.approx(out[16, 60], abs=0.1)
        assert 32809.0 == pytest.approx(out[0, 1], abs=0.1)
        # Output range must be 0 to 2**16 - 1
        assert 65535 == out.max()
        assert 0 == out.min()

    def test_window_bad_photometric_interp(self):
        """Test bad photometric interpretation raises exception."""
        ds = dcmread(WIN_12_1F)
        ds.PhotometricInterpretation = 'RGB'
        msg = r"only 'MONOCHROME1' and 'MONOCHROME2' are allowed"
        with pytest.raises(ValueError, match=msg):
            apply_windowing(ds.pixel_array, ds)

    def test_window_bad_parameters(self):
        """Test bad windowing parameters raise exceptions."""
        ds = dcmread(WIN_12_1F)
        ds.WindowWidth = 0
        ds.VOILUTFunction = 'LINEAR'
        msg = r"Width must be greater than or equal to 1"
        with pytest.raises(ValueError, match=msg):
            apply_windowing(ds.pixel_array, ds)

        ds.VOILUTFunction = 'LINEAR_EXACT'
        msg = r"Width must be greater than 0"
        with pytest.raises(ValueError, match=msg):
            apply_windowing(ds.pixel_array, ds)

        ds.VOILUTFunction = 'SIGMOID'
        msg = r"Width must be greater than 0"
        with pytest.raises(ValueError, match=msg):
            apply_windowing(ds.pixel_array, ds)

        ds.VOILUTFunction = 'UNKNOWN'
        msg = r"Unsupported \(0028,1056\) VOI LUT Function value 'UNKNOWN'"
        with pytest.raises(ValueError, match=msg):
            apply_windowing(ds.pixel_array, ds)

    def test_window_bad_index(self, no_numpy_use):
        """Test windowing with a bad view index."""
        ds = dcmread(WIN_12_1F)
        assert 2 == len(ds.WindowWidth)
        arr = ds.pixel_array
        with pytest.raises(IndexError, match=r"list index out of range"):
            apply_windowing(arr, ds, index=2)

    def test_unchanged(self):
        """Test input array is unchanged if no VOI LUT"""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 1
        ds.BitsStored = 8
        arr = np.asarray([-128, -127, -1, 0, 1, 126, 127], dtype='int8')
        out = apply_windowing(arr, ds)
        assert [-128, -127, -1, 0, 1, 126, 127] == out.tolist()

        ds.ModalityLUTSequence = []
        out = apply_windowing(arr, ds)
        assert [-128, -127, -1, 0, 1, 126, 127] == out.tolist()

    def test_rescale_empty(self):
        """Test RescaleSlope and RescaleIntercept being empty."""
        ds = dcmread(WIN_12_1F)
        ds.RescaleSlope = None
        ds.RescaleIntercept = None

        arr = ds.pixel_array
        assert 0 == arr[16, 60]
        assert 642 == arr[326, 130]
        assert 1123 == arr[316, 481]
        out = apply_windowing(arr, ds)
        assert 0 == pytest.approx(out[16, 60], abs=0.1)
        assert 3046.6 == pytest.approx(out[326, 130], abs=0.1)
        assert 4095.0 == pytest.approx(out[316, 481], abs=0.1)


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ApplyVOI:
    """Tests for util.apply_voi()."""
    def test_voi_single_view(self):
        """Test VOI LUT with a single view."""
        ds = dcmread(VOI_08_1F)
        assert 8 == ds.BitsAllocated
        assert 8 == ds.BitsStored
        assert 0 == ds.PixelRepresentation
        item = ds.VOILUTSequence[0]
        assert [256, 0, 16] == item.LUTDescriptor
        lut = item.LUTData
        assert 0 == lut[0]
        assert 19532 == lut[76]
        assert 45746 == lut[178]
        assert 65535 == lut[255]

        arr = ds.pixel_array
        assert 0 == arr[387, 448]
        assert 76 == arr[178, 126]
        assert 178 == arr[186, 389]
        assert 255 == arr[129, 79]

        out = apply_voi(arr, ds)
        assert 0 == out[387, 448]
        assert 19532 == out[178, 126]
        assert 45746 == out[186, 389]
        assert 65535 == out[129, 79]

    def test_voi_multi_view(self):
        """Test VOI LUT with multiple views."""
        ds = dcmread(VOI_08_1F)
        assert 8 == ds.BitsAllocated
        assert 8 == ds.BitsStored
        assert 0 == ds.PixelRepresentation
        item0 = ds.VOILUTSequence[0]
        # Add another view that's the inverse
        ds.VOILUTSequence.append(Dataset())
        item1 = ds.VOILUTSequence[1]
        item1.LUTDescriptor = [256, 0, 16]
        item1.LUTData = item0.LUTData[::-1]

        arr = ds.pixel_array
        assert 0 == arr[387, 448]
        assert 76 == arr[178, 126]
        assert 178 == arr[186, 389]
        assert 255 == arr[129, 79]

        out0 = apply_voi(arr, ds)
        assert 0 == out0[387, 448]
        assert 19532 == out0[178, 126]
        assert 45746 == out0[186, 389]
        assert 65535 == out0[129, 79]

        out1 = apply_voi(arr, ds, index=1)
        assert 65535 == out1[387, 448]
        assert 46003 == out1[178, 126]
        assert 19789 == out1[186, 389]
        assert 0 == out1[129, 79]

    def test_voi_multi_frame(self):
        """Test VOI with a multiple frames."""
        ds = dcmread(VOI_08_1F)
        assert 8 == ds.BitsAllocated
        assert 8 == ds.BitsStored
        assert 0 == ds.PixelRepresentation

        arr = ds.pixel_array
        arr = np.stack([arr, 255 - arr])
        assert (2, 512, 512) == arr.shape

        out = apply_voi(arr, ds)
        assert 0 == out[0, 387, 448]
        assert 19532 == out[0, 178, 126]
        assert 45746 == out[0, 186, 389]
        assert 65535 == out[0, 129, 79]
        assert 65535 == out[1, 387, 448]
        assert 46003 == out[1, 178, 126]
        assert 19789 == out[1, 186, 389]
        assert 0 == out[1, 129, 79]

    def test_voi_zero_entries(self):
        """Test that 0 entries is interpreted correctly."""
        ds = dcmread(VOI_08_1F)
        seq = ds.VOILUTSequence[0]
        seq.LUTDescriptor = [0, 0, 16]
        assert 256 == len(seq.LUTData)
        arr = np.asarray([0, 255, 256, 65535])
        msg = r"index 256 is out of bounds"
        with pytest.raises(IndexError, match=msg):
            apply_voi(arr, ds)

        # LUTData with 65536 entries
        seq.LUTData = [0] * 65535 + [1]
        out = apply_voi(arr, ds)
        assert [0, 0, 0, 1] == list(out)

    def test_voi_uint8(self):
        """Test uint VOI LUT with an 8-bit LUT."""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.BitsStored = 8
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 8]
        item.LUTData = [0, 127, 128, 255]
        arr = np.asarray([0, 1, 128, 254, 255], dtype='uint8')
        out = apply_voi(arr, ds)
        assert 'uint8' == out.dtype
        assert [0, 127, 255, 255, 255] == out.tolist()

    def test_voi_uint16(self):
        """Test uint VOI LUT with an 16-bit LUT."""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.BitsStored = 16
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 16]
        item.LUTData = [0, 127, 32768, 65535]
        arr = np.asarray([0, 1, 2, 3, 255], dtype='uint16')
        out = apply_voi(arr, ds)
        assert 'uint16' == out.dtype
        assert [0, 127, 32768, 65535, 65535] == out.tolist()

    def test_voi_int8(self):
        """Test int VOI LUT with an 8-bit LUT."""
        ds = Dataset()
        ds.PixelRepresentation = 1
        ds.BitsStored = 8
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 8]
        item.LUTData = [0, 127, 128, 255]
        arr = np.asarray([0, -1, 2, -128, 127], dtype='int8')
        out = apply_voi(arr, ds)
        assert 'uint8' == out.dtype
        assert [0, 0, 128, 0, 255] == out.tolist()

    def test_voi_int16(self):
        """Test int VOI LUT with an 16-bit LUT."""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.BitsStored = 16
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 16]
        item.LUTData = [0, 127, 32768, 65535]
        arr = np.asarray([0, -1, 2, -128, 255], dtype='int16')
        out = apply_voi(arr, ds)
        assert 'uint16' == out.dtype
        assert [0, 0, 32768, 0, 65535] == out.tolist()

    def test_voi_bad_depth(self):
        """Test bad LUT depth raises exception."""
        ds = dcmread(VOI_08_1F)
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor[2] = 7
        msg = r"'7' bits per LUT entry is not supported"
        with pytest.raises(NotImplementedError, match=msg):
            apply_voi(ds.pixel_array, ds)

        item.LUTDescriptor[2] = 17
        msg = r"'17' bits per LUT entry is not supported"
        with pytest.raises(NotImplementedError, match=msg):
            apply_voi(ds.pixel_array, ds)

    def test_voi_uint16_array_float(self):
        """Test warning when array is float and VOI LUT with an 16-bit LUT"""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.BitsStored = 16
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 16]
        item.LUTData = [0, 127, 32768, 65535]
        arr = np.asarray([0, 1, 2, 3, 255], dtype='float64')
        msg = (
            r"Applying a VOI LUT on a float input array may give "
            r"incorrect results"
        )

        with pytest.warns(UserWarning, match=msg):
            out = apply_voi(arr, ds)
            assert [0, 127, 32768, 65535, 65535] == out.tolist()

    def test_unchanged(self):
        """Test input array is unchanged if no VOI LUT"""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 1
        ds.BitsStored = 8
        arr = np.asarray([-128, -127, -1, 0, 1, 126, 127], dtype='int8')
        out = apply_voi(arr, ds)
        assert [-128, -127, -1, 0, 1, 126, 127] == out.tolist()

        ds.VOILUTSequence = []
        out = apply_voi(arr, ds)
        assert [-128, -127, -1, 0, 1, 126, 127] == out.tolist()


    def test_voi_lutdata_ow(self):
        """Test LUT Data with VR OW."""
        ds = Dataset()
        ds.is_little_endian = True
        ds.is_explicit_VR = True
        ds.PixelRepresentation = 0
        ds.BitsStored = 16
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 16]
        item.LUTData = [0, 127, 32768, 65535]
        item.LUTData = pack('<4H', *item.LUTData)
        item['LUTData'].VR = 'OW'
        arr = np.asarray([0, 1, 2, 3, 255], dtype='uint16')
        out = apply_voi(arr, ds)
        assert 'uint16' == out.dtype
        assert [0, 127, 32768, 65535, 65535] == out.tolist()


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_ApplyVOILUT:
    """Tests for util.apply_voi_lut()"""
    def test_unchanged(self):
        """Test input array is unchanged if no VOI LUT"""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 1
        ds.BitsStored = 8
        arr = np.asarray([-128, -127, -1, 0, 1, 126, 127], dtype='int8')
        out = apply_voi_lut(arr, ds)
        assert [-128, -127, -1, 0, 1, 126, 127] == out.tolist()

        ds.VOILUTSequence = []
        out = apply_voi_lut(arr, ds)
        assert [-128, -127, -1, 0, 1, 126, 127] == out.tolist()

    def test_only_windowing(self):
        """Test only windowing operation elements present."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 0
        ds.BitsStored = 8
        arr = np.asarray([0, 1, 128, 254, 255], dtype='uint8')

        ds.WindowWidth = 1
        ds.WindowCenter = 0
        assert [255, 255, 255, 255, 255] == apply_voi_lut(arr, ds).tolist()

    def test_only_voi(self):
        """Test only LUT operation elements present."""
        ds = Dataset()
        ds.PixelRepresentation = 0
        ds.BitsStored = 8
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 8]
        item.LUTData = [0, 127, 128, 255]
        arr = np.asarray([0, 1, 128, 254, 255], dtype='uint8')
        out = apply_voi_lut(arr, ds)
        assert 'uint8' == out.dtype
        assert [0, 127, 255, 255, 255] == out.tolist()

    def test_voi_windowing(self):
        """Test both LUT and windowing operation elements present."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 0
        ds.BitsStored = 8
        ds.WindowWidth = 1
        ds.WindowCenter = 0
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 8]
        item.LUTData = [0, 127, 128, 255]
        arr = np.asarray([0, 1, 128, 254, 255], dtype='uint8')

        # Defaults to LUT
        out = apply_voi_lut(arr, ds)
        assert [0, 127, 255, 255, 255] == out.tolist()

        out = apply_voi_lut(arr, ds, prefer_lut=False)
        assert [255, 255, 255, 255, 255] == out.tolist()

    def test_voi_windowing_empty(self):
        """Test empty VOI elements."""
        ds = Dataset()
        ds.PhotometricInterpretation = 'MONOCHROME1'
        ds.PixelRepresentation = 0
        ds.BitsStored = 8
        ds.WindowWidth = 1
        ds.WindowCenter = 0
        ds.VOILUTSequence = [Dataset()]
        item = ds.VOILUTSequence[0]
        item.LUTDescriptor = [4, 0, 8]
        item.LUTData = [0, 127, 128, 255]
        arr = np.asarray([0, 1, 128, 254, 255], dtype='uint8')

        # Test empty VOI elements
        item.LUTData = None
        out = apply_voi_lut(arr, ds)
        assert [255, 255, 255, 255, 255] == out.tolist()

        # Test empty windowing elements
        ds.WindowWidth = None
        out = apply_voi_lut(arr, ds)
        assert [0, 1, 128, 254, 255] == out.tolist()


class TestGetJ2KParameters:
    """Tests for get_j2k_parameters."""
    def test_precision(self):
        """Test getting the precision for a JPEG2K bytestream."""
        base = b'\xff\x4f\xff\x51' + b'\x00' * 38
        # Signed
        for ii in range(135, 144):
            params = get_j2k_parameters(base + bytes([ii]))
            assert ii - 127 == params["precision"]
            assert params["is_signed"]

        # Unsigned
        for ii in range(7, 16):
            params = get_j2k_parameters(base + bytes([ii]))
            assert ii + 1 == params["precision"]
            assert not params["is_signed"]

    def test_not_j2k(self):
        """Test result when no JPEG2K SOF marker present"""
        base = b'\xff\x4e\xff\x51' + b'\x00' * 38
        assert {} == get_j2k_parameters(base + b'\x8F')

    def test_no_siz(self):
        """Test result when no SIZ box present"""
        base = b'\xff\x4f\xff\x52' + b'\x00' * 38
        assert {} == get_j2k_parameters(base + b'\x8F')

    def test_short_bytestream(self):
        """Test result when no SIZ box present"""
        assert {} == get_j2k_parameters(b'')
        assert {} == get_j2k_parameters(b'\xff\x4f\xff\x51' + b'\x00' * 20)


class TestGetNrFrames:
    """Tests for get_nr_frames."""
    def test_none(self):
        """Test warning when (0028,0008) 'Number of Frames' has a value of
            None"""
        ds = Dataset()
        ds.NumberOfFrames = None
        msg = (
            r"A value of None for \(0028,0008\) 'Number of Frames' is "
            r"non-conformant. It's recommended that this value be "
            r"changed to 1"
        )
        with pytest.warns(UserWarning, match=msg):
            assert 1 == get_nr_frames(ds)

    def test_missing(self):
        """Test return value when (0028,0008) 'Number of Frames' does not
            exist"""
        ds = Dataset()
        with pytest.warns(None) as w:
            assert 1 == get_nr_frames(ds)
            assert not w

    def test_existing(self):
        """Test return value when (0028,0008) 'Number of Frames' exists."""
        ds = Dataset()
        ds.NumberOfFrames = random.randint(1, 10)
        with pytest.warns(None) as w:
            assert ds.NumberOfFrames == get_nr_frames(ds)
            assert not w


REFERENCE_PACK_UNPACK = [
    (b'', []),
    (b'\x00', [0, 0, 0, 0, 0, 0, 0, 0]),
    (b'\x01', [1, 0, 0, 0, 0, 0, 0, 0]),
    (b'\x02', [0, 1, 0, 0, 0, 0, 0, 0]),
    (b'\x04', [0, 0, 1, 0, 0, 0, 0, 0]),
    (b'\x08', [0, 0, 0, 1, 0, 0, 0, 0]),
    (b'\x10', [0, 0, 0, 0, 1, 0, 0, 0]),
    (b'\x20', [0, 0, 0, 0, 0, 1, 0, 0]),
    (b'\x40', [0, 0, 0, 0, 0, 0, 1, 0]),
    (b'\x80', [0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\xAA', [0, 1, 0, 1, 0, 1, 0, 1]),
    (b'\xF0', [0, 0, 0, 0, 1, 1, 1, 1]),
    (b'\x0F', [1, 1, 1, 1, 0, 0, 0, 0]),
    (b'\xFF', [1, 1, 1, 1, 1, 1, 1, 1]),
    #              | 1st byte              | 2nd byte
    (b'\x00\x00', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    (b'\x00\x01', [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
    (b'\x00\x80', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x00\xFF', [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]),
    (b'\x01\x80', [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x80\x80', [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\xFF\x80', [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]),
]


class TestUnpackBits:
    """Tests for unpack_bits."""

    @pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
    @pytest.mark.parametrize('src, output', REFERENCE_PACK_UNPACK)
    def test_unpack_np(self, src, output):
        """Test unpacking data using numpy."""
        assert np.array_equal(
            unpack_bits(src, as_array=True), np.asarray(output)
        )

        as_bytes = pack(f"{len(output)}B", *output)
        assert unpack_bits(src, as_array=False) == as_bytes

    @pytest.mark.skipif(HAVE_NP, reason="Numpy is available")
    @pytest.mark.parametrize('src, output', REFERENCE_PACK_UNPACK)
    def test_unpack_bytes(self, src, output):
        """Test unpacking data without numpy."""
        as_bytes = pack(f"{len(output)}B", *output)
        assert unpack_bits(src, as_array=False) == as_bytes

        msg = r"unpack_bits\(\) requires NumPy if 'as_array = True'"
        with pytest.raises(ValueError, match=msg):
            unpack_bits(src, as_array=True)


REFERENCE_PACK_PARTIAL = [
    #              | 1st byte              | 2nd byte
    (b'\x00\x40', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),  # 15-bits
    (b'\x00\x20', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x00\x10', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x00\x08', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x00\x04', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x00\x02', [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    (b'\x00\x01', [0, 0, 0, 0, 0, 0, 0, 0, 1]),  # 9-bits
    (b'\x80', [0, 0, 0, 0, 0, 0, 0, 1]),  # 8-bits
    (b'\x40', [0, 0, 0, 0, 0, 0, 1]),
    (b'\x20', [0, 0, 0, 0, 0, 1]),
    (b'\x10', [0, 0, 0, 0, 1]),
    (b'\x08', [0, 0, 0, 1]),
    (b'\x04', [0, 0, 1]),
    (b'\x02', [0, 1]),
    (b'\x01', [1]),
    (b'', []),
]


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestNumpy_PackBits:
    """Tests for numpy_handler.pack_bits."""

    @pytest.mark.parametrize('output, input', REFERENCE_PACK_UNPACK)
    def test_pack(self, input, output):
        """Test packing data."""
        assert output == pack_bits(np.asarray(input), pad=False)

    def test_non_binary_input(self):
        """Test non-binary input raises exception."""
        with pytest.raises(ValueError,
                           match=r"Only binary arrays \(containing ones or"):
            pack_bits(np.asarray([0, 0, 2, 0, 0, 0, 0, 0]))

    def test_ndarray_input(self):
        """Test non 1D input gets ravelled."""
        arr = np.asarray(
            [[0, 0, 0, 0, 0, 0, 0, 0],
             [1, 0, 1, 0, 1, 0, 1, 0],
             [1, 1, 1, 1, 1, 1, 1, 1]]
        )
        assert (3, 8) == arr.shape
        b = pack_bits(arr, pad=False)
        assert b'\x00\x55\xff' == b

    def test_padding(self):
        """Test odd length packed data is padded."""
        arr = np.asarray(
            [[0, 0, 0, 0, 0, 0, 0, 0],
             [1, 0, 1, 0, 1, 0, 1, 0],
             [1, 1, 1, 1, 1, 1, 1, 1]]
        )
        assert 3 == len(pack_bits(arr, pad=False))
        b = pack_bits(arr, pad=True)
        assert 4 == len(b)
        assert 0 == b[-1]

    @pytest.mark.parametrize('output, input', REFERENCE_PACK_PARTIAL)
    def test_pack_partial(self, input, output):
        """Test packing data that isn't a full byte long."""
        assert output == pack_bits(np.asarray(input), pad=False)

    def test_functional(self):
        """Test against a real dataset."""
        ds = dcmread(EXPL_1_1_3F)
        arr = ds.pixel_array
        arr = arr.ravel()
        assert ds.PixelData == pack_bits(arr)


@pytest.mark.skipif(not HAVE_NP, reason="Numpy is not available")
class TestExpandYBR422:
    def test_8bit(self):
        """Test 8-bit expansion."""
        ds = dcmread(EXPL_8_3_1F_YBR422)
        assert ds.PhotometricInterpretation == 'YBR_FULL_422'
        ref = ds.pixel_array

        expanded = expand_ybr422(ds.PixelData, ds.BitsAllocated)
        arr = np.frombuffer(expanded, dtype="u1")
        assert np.array_equal(arr, ref.ravel())

    def test_16bit(self):
        """Test 16-bit expansion."""
        # Have to make our own 16-bit data
        ds = dcmread(EXPL_8_3_1F_YBR422)
        ref = ds.pixel_array.astype('float32')
        ref *= 65535 / 255
        ref = ref.astype("u2")
        # Subsample
        # YY BB RR YY BB RR YY BB RR YY BB RR -> YY YY BB RR YY YY BB RR
        src = bytearray(ref.tobytes())
        del src[2::12]
        del src[2::11]
        del src[2::10]
        del src[2::9]

        # Should be 2/3rds of the original number of bytes
        nr_bytes = ds.Rows * ds.Columns * ds.SamplesPerPixel * 2
        assert len(src) == nr_bytes * 2 // 3
        arr = np.frombuffer(expand_ybr422(src, 16), "u2")
        assert np.array_equal(arr, ref.ravel())
        # Spot check values
        arr = arr.reshape(100, 100, 3)
        assert (19532, 21845, 65535) == tuple(arr[5, 50, :])
        assert (42662, 27242, 49601) == tuple(arr[15, 50, :])

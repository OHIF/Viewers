# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Encoding benchmarks for the rle_handler module."""

from pydicom import dcmread
from pydicom.data import get_testdata_file
from pydicom.pixel_data_handlers.rle_handler import rle_encode_frame
from pydicom.uid import RLELossless


# 8/8-bit, 1 sample/pixel, 1 frame
EXPL_8_1_1F = get_testdata_file("OBXXXX1A.dcm")
# 8/8-bit, 3 sample/pixel, 1 frame
EXPL_8_3_1F = get_testdata_file("SC_rgb.dcm")
# 16/16-bit, 1 sample/pixel, 1 frame
EXPL_16_1_1F = get_testdata_file("MR_small.dcm")
# 16/16-bit, 3 sample/pixel, 1 frame
EXPL_16_3_1F = get_testdata_file("SC_rgb_16bit.dcm")
# 32/32-bit, 1 sample/pixel, 1 frame
EXPL_32_1_1F = get_testdata_file("rtdose_1frame.dcm")
# 32/32-bit, 3 sample/pixel, 1 frame
EXPL_32_3_1F = get_testdata_file("SC_rgb_32bit.dcm")


class TimeRLEEncodeFrame:
    """Time tests for rle_handler.rle_encode_frame."""
    def setup(self):
        ds = dcmread(EXPL_8_1_1F)
        self.arr8_1 = ds.pixel_array
        ds = dcmread(EXPL_8_3_1F)
        self.arr8_3 = ds.pixel_array
        ds = dcmread(EXPL_16_1_1F)
        self.arr16_1 = ds.pixel_array
        ds = dcmread(EXPL_16_3_1F)
        self.arr16_3 = ds.pixel_array
        ds = dcmread(EXPL_32_1_1F)
        self.arr32_1 = ds.pixel_array
        ds = dcmread(EXPL_32_3_1F)
        self.arr32_3 = ds.pixel_array

        self.no_runs = 100

    def time_08_1(self):
        """Time encoding 8 bit 1 sample/pixel."""
        for ii in range(self.no_runs):
            rle_encode_frame(self.arr8_1)

    def time_08_3(self):
        """Time encoding 8 bit 3 sample/pixel."""
        for ii in range(self.no_runs):
            rle_encode_frame(self.arr8_3)

    def time_16_1(self):
        """Time encoding 16 bit 1 sample/pixel."""
        for ii in range(self.no_runs):
            rle_encode_frame(self.arr16_1)

    def time_16_3(self):
        """Time encoding 16 bit 3 sample/pixel."""
        for ii in range(self.no_runs):
            rle_encode_frame(self.arr16_3)

    def time_32_1(self):
        """Time encoding 32 bit 1 sample/pixel."""
        for ii in range(self.no_runs):
            rle_encode_frame(self.arr32_1)

    def time_32_3(self):
        """Time encoding 32 bit 3 sample/pixel."""
        for ii in range(self.no_runs):
            rle_encode_frame(self.arr32_3)


# Requires numpy, pylibjpeg, pylibjpeg-rle and python-gdcm
class TimeDatasetCompress:
    """Test Dataset.compress()."""
    def setup(self):
        # More real-world like dataset
        self.ds = dcmread(EXPL_8_1_1F)
        self.arr8_1 = self.ds.pixel_array

        self.no_runs = 1000

    def time_pydicom(self):
        """Time the native RLE encoder."""
        for _ in range(self.no_runs):
            self.ds.compress(
                RLELossless, self.arr8_1, encoding_plugin='pydicom'
            )

    def time_pylibjpeg(self):
        """Time the pylibjpeg-rle Rust RLE encoder."""
        for _ in range(self.no_runs):
            self.ds.compress(
                RLELossless, self.arr8_1, encoding_plugin='pylibjpeg'
            )

    def time_gdcm(self):
        """Time the GDCM C++ RLE encoder."""
        for _ in range(self.no_runs):
            self.ds.compress(
                RLELossless, self.arr8_1, encoding_plugin='gdcm'
            )

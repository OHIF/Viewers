# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Decoding benchmarks for the rle_handler module."""

from pydicom import dcmread
from pydicom.data import get_testdata_file
from pydicom.encaps import decode_data_sequence
from pydicom.pixel_data_handlers.rle_handler import (
    get_pixeldata,
    _rle_decode_frame,
)


# 8/8-bit, 1 sample/pixel, 1 frame
OB_RLE_1F = get_testdata_file("OBXXXX1A_rle.dcm")
# 8/8-bit, 1 sample/pixel, 2 frame
OB_RLE_2F = get_testdata_file("OBXXXX1A_rle_2frame.dcm")
# 8/8-bit, 3 sample/pixel, 1 frame
SC_RLE_1F = get_testdata_file("SC_rgb_rle.dcm")
# 8/8-bit, 3 sample/pixel, 2 frame
SC_RLE_2F = get_testdata_file("SC_rgb_rle_2frame.dcm")
# 16/16-bit, 1 sample/pixel, 1 frame
MR_RLE_1F = get_testdata_file("MR_small_RLE.dcm")
# 16/16-bit, 3 sample/pixel, 1 frame
SC_RLE_16_1F = get_testdata_file("SC_rgb_rle_16bit.dcm")
# 16/16-bit, 3 sample/pixel, 2 frame
SC_RLE_16_2F = get_testdata_file("SC_rgb_rle_16bit_2frame.dcm")
# 16/12-bit, 1 sample/pixel, 10 frame
EMRI_RLE_10F = get_testdata_file("emri_small_RLE.dcm")
# 32/32-bit, 1 sample/pixel, 1 frame
RTDOSE_RLE_1F = get_testdata_file("rtdose_rle_1frame.dcm")
# 32/32-bit, 3 sample/pixel, 1 frame
SC_RLE_32_1F = get_testdata_file("SC_rgb_rle_32bit.dcm")
# 32/32-bit, 3 sample/pixel, 2 frame
SC_RLE_32_2F = get_testdata_file("SC_rgb_rle_32bit_2frame.dcm")
# 32/32-bit, 1 sample/pixel, 15 frame
RTDOSE_RLE_15F = get_testdata_file("rtdose_rle.dcm")


class TimeRLEDecodeFrame:
    """Time tests for rle_handler._rle_decode_frame."""
    def setup(self):
        # MONOCHROME2, 64x64, 1 sample/pixel, 16 bits allocated, 12 bits stored
        self.ds = dcmread(EMRI_RLE_10F)
        self.frames = decode_data_sequence(self.ds.PixelData)
        assert len(self.frames) == 10

        self.no_runs = 100

    def time_decode_16bit_1sample_1frame(self):
        """Time decoding the pixel data from a single RLE frame."""
        for ii in range(self.no_runs):
            _rle_decode_frame(self.frames[0],
                              self.ds.Rows,
                              self.ds.Columns,
                              self.ds.SamplesPerPixel,
                              self.ds.BitsAllocated)

    def time_decode_16bit_1sample_10frame(self):
        """Time decoding the pixel data from 10 RLE frames."""
        for ii in range(self.no_runs):
            for frame in self.frames:
                _rle_decode_frame(frame,
                                  self.ds.Rows,
                                  self.ds.Columns,
                                  self.ds.SamplesPerPixel,
                                  self.ds.BitsAllocated)


class TimeGetPixelData:
    """Time tests for rle_handler.get_pixeldata."""
    def setup(self):
        """Setup the test"""
        self.ds_8_1_1 = dcmread(OB_RLE_1F)
        self.ds_8_3_1 = dcmread(SC_RLE_1F)
        self.ds_16_1_1 = dcmread(MR_RLE_1F)
        self.ds_16_3_1 = dcmread(SC_RLE_16_1F)
        self.ds_32_1_1 = dcmread(RTDOSE_RLE_1F)
        self.ds_32_3_1 = dcmread(SC_RLE_32_1F)

        self.no_runs = 100

    def time_08bit_1sample(self):
        """Time retrieval of 8-bit, 1 sample/pixel RLE data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_8_1_1)

    def time_08bit_3sample(self):
        """Time retrieval of 8-bit, 3 sample/pixel RLE data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_8_3_1)

    def time_16bit_1sample(self):
        """Time retrieval of 16-bit, 1 sample/pixel RLE data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_1_1)

    def time_16bit_3sample(self):
        """Time retrieval of 16-bit, 3 sample/pixel RLE data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_3_1)

    def time_32bit_1sample(self):
        """Time retrieval of 32-bit, 1 sample/pixel RLE data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_32_1_1)

    def time_32bit_3sample(self):
        """Time retrieval of 32-bit, 3 sample/pixel RLE data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_32_3_1)

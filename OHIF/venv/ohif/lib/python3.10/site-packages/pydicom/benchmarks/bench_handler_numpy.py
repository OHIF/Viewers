# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Benchmarks for the numpy_handler module.

Requires asv and numpy.
"""

from platform import python_implementation
from tempfile import TemporaryFile

import numpy as np

from pydicom import dcmread
from pydicom.data import get_testdata_file
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.pixel_data_handlers.numpy_handler import (
    get_pixeldata, unpack_bits, pack_bits
)
from pydicom.uid import ExplicitVRLittleEndian, generate_uid

# 1/1, 1 sample/pixel, 1 frame
EXPL_1_1_1F = get_testdata_file("liver_1frame.dcm")
# 1/1, 1 sample/pixel, 3 frame
EXPL_1_1_3F = get_testdata_file("liver.dcm")
# 8/8, 1 sample/pixel, 1 frame
EXPL_8_1_1F = get_testdata_file("OBXXXX1A.dcm")
# 8/8, 1 sample/pixel, 2 frame
EXPL_8_1_2F = get_testdata_file("OBXXXX1A_2frame.dcm")
# 8/8, 3 sample/pixel, 1 frame
EXPL_8_3_1F = get_testdata_file("SC_rgb.dcm")
# 8/8, 3 sample/pixel, 1 frame, YBR_FULL_422
EXPL_8_3_1F_YBR422 = get_testdata_file('SC_ybr_full_422_uncompressed.dcm')
# 8/8, 3 sample/pixel, 2 frame
EXPL_8_3_2F = get_testdata_file("SC_rgb_2frame.dcm")
# 16/16, 1 sample/pixel, 1 frame
EXPL_16_1_1F = get_testdata_file("MR_small.dcm")
# 16/12, 1 sample/pixel, 10 frame
EXPL_16_1_10F = get_testdata_file("emri_small.dcm")
# 16/16, 3 sample/pixel, 1 frame
EXPL_16_3_1F = get_testdata_file("SC_rgb_16bit.dcm")
# 16/16, 3 sample/pixel, 2 frame
EXPL_16_3_2F = get_testdata_file("SC_rgb_16bit_2frame.dcm")
# 32/32, 1 sample/pixel, 1 frame
IMPL_32_1_1F = get_testdata_file("rtdose_1frame.dcm")
# 32/32, 1 sample/pixel, 15 frame
IMPL_32_1_15F = get_testdata_file("rtdose.dcm")
# 32/32, 3 sample/pixel, 1 frame
EXPL_32_3_1F = get_testdata_file("SC_rgb_32bit.dcm")
# 32/32, 3 sample/pixel, 2 frame
EXPL_32_3_2F = get_testdata_file("SC_rgb_32bit_2frame.dcm")


def _create_temporary_dataset(shape=(100, 1024, 1024, 3), bit_depth=16):
    """Function to create a temporary dataset for use in testing.

    Parameters
    ----------
    shape : 4-tuple
        The (frames, rows, columns, channels) of the test dataset.
    bit_depth : int
        The BitsAllocated value to use for the dataset, one of 8, 16, 32, 64.

    Returns
    -------
    tempfile.TemporaryFile
        A created DICOM File Format conformant dataset.
    """
    ds = Dataset()
    ds.is_little_endian = True
    ds.is_implicit_VR = False
    ds.file_meta = FileMetaDataset()
    ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    ds.SOPClassUID = '1.2.3.4'
    ds.SOPInstanceUID = generate_uid()
    ds.BitsAllocated = bit_depth
    ds.PixelRepresentation = 0
    ds.PlanarConfiguration = 0
    ds.Rows = shape[1]
    ds.Columns = shape[2]
    ds.NumberOfFrames = shape[0]
    ds.SamplesPerPixel = shape[3]
    if shape[3] == 1:
        ds.PhotometricInterpretation = 'MONOCHROME2'
    elif shape[3] == 3:
        ds.PhotometricInterpretation = 'RGB'

    arr = np.zeros(shape, dtype='uint{}'.format(bit_depth))
    ds.PixelData = arr.tobytes()

    if len(ds.PixelData) % 2:
        ds.PixelData += b'\x00'

    tfile = TemporaryFile(mode='w+b')
    ds.save_as(tfile, write_like_original=False)
    tfile.seek(0)

    return tfile


class TimeGetPixelData_LargeDataset:
    """Time tests for numpy_handler.get_pixeldata with large datasets."""
    def setup(self):
        """Setup the tests."""
        self.no_runs = 100

        self.ds_16_3_100 = dcmread(_create_temporary_dataset())

    def time_large_dataset(self):
        """Time reading pixel data from a large dataset."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_3_100)


class TimeGetPixelData:
    """Time tests for numpy_handler.get_pixeldata."""
    def setup(self):
        """Setup the tests."""
        self.no_runs = 100

        self.ds_1_1_1 = dcmread(EXPL_1_1_1F)
        self.ds_1_1_3 = dcmread(EXPL_1_1_3F)
        self.ds_8_1_1 = dcmread(EXPL_8_1_1F)
        self.ds_8_1_2 = dcmread(EXPL_8_1_2F)
        self.ds_8_3_1 = dcmread(EXPL_8_3_1F)
        self.ds_8_3_2 = dcmread(EXPL_8_3_2F)
        self.ds_16_1_1 = dcmread(EXPL_16_1_1F)
        self.ds_16_1_10 = dcmread(EXPL_16_1_10F)
        self.ds_16_3_1 = dcmread(EXPL_16_3_1F)
        self.ds_16_3_2 = dcmread(EXPL_16_3_2F)
        self.ds_32_1_1 = dcmread(IMPL_32_1_1F)
        self.ds_32_1_15 = dcmread(IMPL_32_1_15F)
        self.ds_32_3_1 = dcmread(EXPL_32_3_1F)
        self.ds_32_3_2 = dcmread(EXPL_32_3_2F)
        self.ds_ybr_422 = dcmread(EXPL_8_3_1F_YBR422)

    def time_1bit_1sample_1frame(self):
        """Time retrieval of 1-bit, 1 sample/pixel, 1 frame."""
        no_runs = self.no_runs
        if 'PyPy' in python_implementation():
            no_runs = 1

        for ii in range(no_runs):
            get_pixeldata(self.ds_1_1_1)

    def time_1bit_1sample_3frame(self):
        """Time retrieval of 1-bit, 1 sample/pixel, 3 frame."""
        no_runs = self.no_runs
        if 'PyPy' in python_implementation():
            no_runs = 1

        for ii in range(no_runs):
            get_pixeldata(self.ds_1_1_3)

    def time_8bit_1sample_1frame(self):
        """Time retrieval of 8-bit, 1 sample/pixel, 1 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_8_1_1)

    def time_8bit_1sample_2frame(self):
        """Time retrieval of 8-bit, 1 sample/pixel, 2 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_8_1_2)

    def time_8bit_3sample_1frame(self):
        """Time retrieval of 8-bit, 3 sample/pixel, 1 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_8_3_1)

    def time_8bit_3sample_2frame(self):
        """Time retrieval of 8-bit, 3 sample/pixel, 2 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_8_3_2)

    def time_16bit_1sample_1frame(self):
        """Time retrieval of 16-bit, 1 sample/pixel, 1 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_1_1)

    def time_16bit_1sample_10frame(self):
        """Time retrieval of 16-bit, 1 sample/pixel, 10 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_1_10)

    def time_16bit_3sample_1frame(self):
        """Time retrieval of 16-bit, 3 sample/pixel, 1 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_3_1)

    def time_16bit_3sample_2frame(self):
        """Time retrieval of 16-bit, 3 sample/pixel, 2 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_16_3_2)

    def time_32bit_1sample_1frame(self):
        """Time retrieval of 32-bit, 1 sample/pixel, 1 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_32_1_1)

    def time_32bit_1sample_15frame(self):
        """Time retrieval of 32-bit, 1 sample/pixel, 15 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_32_1_15)

    def time_32bit_3sample_1frame(self):
        """Time retrieval of 32-bit, 3 sample/pixel, 1 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_32_3_1)

    def time_32bit_3sample_2frame(self):
        """Time retrieval of 32-bit, 3 sample/pixel, 2 frame."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_32_3_2)

    def time_ybr_422(self):
        """Time retrieval of YBR_FULL_422 data."""
        for ii in range(self.no_runs):
            get_pixeldata(self.ds_ybr_422)


class TimePackUnpack:
    def setup(self):
        """Setup the tests."""
        self.no_runs = 100
        self.ds_1_1_1 = dcmread(EXPL_1_1_1F)
        self.unpacked = unpack_bits(self.ds_1_1_1.PixelData)

    def time_unpack(self):
        """Time unpacking"""
        for ii in range(self.no_runs):
            unpack_bits(self.ds_1_1_1.PixelData)

    def time_pack(self):
        """Time packing."""
        for ii in range(self.no_runs):
            pack_bits(self.unpacked)

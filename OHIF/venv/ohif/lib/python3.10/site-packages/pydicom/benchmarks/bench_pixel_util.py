# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Benchmarks for the pixel data utilities."""

import numpy as np

from pydicom import dcmread
from pydicom.data import get_testdata_file
from pydicom.pixel_data_handlers.util import convert_color_space


# 32/32, 3 sample/pixel, 2 frame
EXPL_32_3_2F = get_testdata_file("SC_rgb_32bit_2frame.dcm")


class TimeConvertColorSpace:
    """Benchmarks for utils.convert_color_space()."""
    def setup(self):
        """Setup the benchmark."""
        self.no_runs = 1000

        ds = dcmread(get_testdata_file('SC_rgb_gdcm2k_uncompressed.dcm'))
        self.rgb = ds.pixel_array
        ds = dcmread(get_testdata_file('SC_ybr_full_uncompressed.dcm'))
        self.ybr_full = ds.pixel_array

        self.arr_large = np.ones((10, 1024, 1024, 3), dtype=np.uint8)
        self.arr_32_3_2f = dcmread(EXPL_32_3_2F).pixel_array

    def time_rgb_ybr(self):
        """Time converting from RGB to YBR color space."""
        for ii in range(self.no_runs):
            convert_color_space(self.rgb, 'RGB', 'YBR_FULL')

    def time_ybr_rgb(self):
        """Time converting from YBR to RGB color space."""
        for ii in range(self.no_runs):
            convert_color_space(self.ybr_full, 'YBR_FULL', 'RGB')

    def time_ybr_rgb_32_3_2f(self):
        """Time converting YBR to RGB."""
        for ii in range(self.no_runs):
            convert_color_space(self.arr_32_3_2f, "YBR_FULL", "RGB")

    def time_rgb_ybr_32_3_2f(self):
        """Time converting RGB to YBR."""
        for ii in range(self.no_runs):
            convert_color_space(self.arr_32_3_2f, "RGB", "YBR_FULL")

    def time_ybr_rgb_large(self):
        """Time converting YBR to RGB."""
        for ii in range(1):
            convert_color_space(
                self.arr_large, "YBR_FULL", "RGB", per_frame=True
            )

    def time_rgb_ybr_large(self):
        """Time converting RGB to YBR."""
        for ii in range(1):
            convert_color_space(
                self.arr_large, "RGB", "YBR_FULL", per_frame=True
            )

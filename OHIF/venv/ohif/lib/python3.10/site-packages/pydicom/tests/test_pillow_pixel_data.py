# Copyright 2008-2018 pydicom authors. See LICENSE file for details.

import pytest

import pydicom
from pydicom.data import get_testdata_file
from pydicom.encaps import defragment_data
from pydicom.filereader import dcmread
from pydicom.pixel_data_handlers.util import (
    convert_color_space, get_j2k_parameters
)
from pydicom.uid import (
    JPEGBaseline8Bit,
    JPEGLosslessSV1,
    JPEGExtended12Bit,
    JPEG2000,
    JPEG2000Lossless,
    AllTransferSyntaxes,
)


try:
    import numpy as np
    from pydicom.pixel_data_handlers import numpy_handler as NP_HANDLER
    HAVE_NP = True
except ImportError:
    NP_HANDLER = None
    HAVE_NP = False

try:
    from pydicom.pixel_data_handlers import pillow_handler as PIL_HANDLER
    from pydicom.pixel_data_handlers.pillow_handler import get_pixeldata
    HAVE_PIL = PIL_HANDLER.HAVE_PIL
    HAVE_JPEG = PIL_HANDLER.HAVE_JPEG
    HAVE_JPEG2K = PIL_HANDLER.HAVE_JPEG2K
except ImportError:
    PIL_HANDLER = None
    HAVE_PIL = False
    HAVE_JPEG = False
    HAVE_JPEG2K = False


TEST_PIL = HAVE_NP and HAVE_PIL
TEST_JPEG = TEST_PIL and HAVE_JPEG
TEST_JPEG2K = TEST_PIL and HAVE_JPEG2K


# JPEG - ISO/IEC 10918 Standard
# FMT: Transfer Syntax
# BA: BitsAllocated
# BV: Actual sample bit depth - may not be the same as BitsStored
# SPX: SamplesPerPixel
# PR: PixelRepresentation
# FRAMES: NumberOfFrames
# PI: PhotometricInterpretation
# FMT_BA_BV_SPX_PR_FRAMESF_PI
# JPGB: 1.2.840.10008.1.2.4.50 - JPEG Baseline (8-bit only)
JPGB_08_08_3_0_1F_YBR_FULL = get_testdata_file("SC_rgb_small_odd_jpeg.dcm")
JPGB_08_08_3_0_120F_YBR_FULL_422 = get_testdata_file("color3d_jpeg_baseline.dcm")  # noqa
# Different subsampling 411, 422, 444
JPGB_08_08_3_0_1F_YBR_FULL_422_411 = get_testdata_file("SC_rgb_dcmtk_+eb+cy+np.dcm")  # noqa
JPGB_08_08_3_0_1F_YBR_FULL_422_422 = get_testdata_file("SC_rgb_dcmtk_+eb+cy+s2.dcm")  # noqa
JPGB_08_08_3_0_1F_YBR_FULL_411 = get_testdata_file("SC_rgb_dcmtk_+eb+cy+n1.dcm")  # noqa
JPGB_08_08_3_0_1F_YBR_FULL_422 = get_testdata_file("SC_rgb_dcmtk_+eb+cy+n2.dcm")  # noqa
JPGB_08_08_3_0_1F_YBR_FULL_444 = get_testdata_file("SC_rgb_dcmtk_+eb+cy+s4.dcm")  # noqa
JPGB_08_08_3_0_1F_RGB = get_testdata_file("SC_jpeg_no_color_transform.dcm")
JPGB_08_08_3_0_1F_RGB_APP14 = get_testdata_file("SC_jpeg_no_color_transform_2.dcm")  # noqa
# JPGE: 1.2.840.10008.1.2.4.51 - JPEG Extended (Process 2 and 4) (8 and 12-bit)
# No supported datasets available

# JPEG 2000 - ISO/IEC 15444 Standard
# J2KR: 1.2.840.100008.1.2.4.90 - JPEG 2000 Lossless
J2KR_08_08_3_0_1F_YBR_ICT = get_testdata_file("US1_J2KR.dcm")
J2KR_16_10_1_0_1F_M1 = get_testdata_file("RG3_J2KR.dcm")
J2KR_16_12_1_0_1F_M2 = get_testdata_file("MR2_J2KR.dcm")
J2KR_16_15_1_0_1F_M1 = get_testdata_file("RG1_J2KR.dcm")
J2KR_16_16_1_0_10F_M2 = get_testdata_file("emri_small_jpeg_2k_lossless.dcm")
J2KR_16_14_1_1_1F_M2 = get_testdata_file("693_J2KR.dcm")
J2KR_16_16_1_1_1F_M2 = get_testdata_file("MR_small_jp2klossless.dcm")
J2KR_16_13_1_1_1F_M2_MISMATCH = get_testdata_file("J2K_pixelrep_mismatch.dcm")
# J2KI: 1.2.840.10008.1.2.4.91 - JPEG 2000
J2KI_08_08_3_0_1F_RGB = get_testdata_file("SC_rgb_gdcm_KY.dcm")
J2KI_08_08_3_0_1F_YBR_ICT = get_testdata_file("US1_J2KI.dcm")
J2KI_16_10_1_0_1F_M1 = get_testdata_file("RG3_J2KI.dcm")
J2KI_16_12_1_0_1F_M2 = get_testdata_file("MR2_J2KI.dcm")
J2KI_16_15_1_0_1F_M1 = get_testdata_file("RG1_J2KI.dcm")
J2KI_16_14_1_1_1F_M2 = get_testdata_file("693_J2KI.dcm")
J2KI_16_16_1_1_1F_M2 = get_testdata_file("JPEG2000.dcm")

# Transfer syntaxes supported by other handlers
IMPL = get_testdata_file("MR_small_implicit.dcm")
EXPL = get_testdata_file("OBXXXX1A.dcm")
EXPB = get_testdata_file("OBXXXX1A_expb.dcm")
DEFL = get_testdata_file("image_dfl.dcm")
JPEG_LS_LOSSLESS = get_testdata_file("MR_small_jpeg_ls_lossless.dcm")
RLE = get_testdata_file("MR_small_RLE.dcm")
JPGE_16_12_1_0_1F_M2 = get_testdata_file("JPEG-lossy.dcm")
JPGL_16_16_1_1_1F_M2 = get_testdata_file("JPEG-LL.dcm")
# JPGL14: 1.2.840.10008.1.2.4.57 - JPEG Lossless P14
# No datasets available
# JPGL: 1.2.840.10008.1.2.4.70 - JPEG Lossless, Non-hierarchical, 1st Order
JPGL_08_08_1_0_1F = get_testdata_file("JPGLosslessP14SV1_1s_1f_8b.dcm")


# Transfer Syntaxes (non-retired + Explicit VR Big Endian)
JPEG_SUPPORTED_SYNTAXES = []
if HAVE_JPEG:
    JPEG_SUPPORTED_SYNTAXES = [JPEGBaseline8Bit, JPEGExtended12Bit]

JPEG2K_SUPPORTED_SYNTAXES = []
if HAVE_JPEG2K:
    JPEG2K_SUPPORTED_SYNTAXES = [JPEG2000, JPEG2000Lossless]

SUPPORTED_SYNTAXES = JPEG_SUPPORTED_SYNTAXES + JPEG2K_SUPPORTED_SYNTAXES
UNSUPPORTED_SYNTAXES = list(
    set(AllTransferSyntaxes) ^ set(SUPPORTED_SYNTAXES)
)


def test_unsupported_syntaxes():
    """Test that UNSUPPORTED_SYNTAXES is as expected."""
    for syntax in SUPPORTED_SYNTAXES:
        assert syntax not in UNSUPPORTED_SYNTAXES


REFERENCE_DATA_UNSUPPORTED = [
    (IMPL, ('1.2.840.10008.1.2', 'CompressedSamples^MR1')),
    (EXPL, ('1.2.840.10008.1.2.1', 'OB^^^^')),
    (EXPB, ('1.2.840.10008.1.2.2', 'OB^^^^')),
    (DEFL, ('1.2.840.10008.1.2.1.99', '^^^^')),
    (JPEG_LS_LOSSLESS, ('1.2.840.10008.1.2.4.80', 'CompressedSamples^MR1')),
    (JPGL_08_08_1_0_1F, ('1.2.840.10008.1.2.4.70', 'Citizen^Jan')),
    (RLE, ('1.2.840.10008.1.2.5', 'CompressedSamples^MR1')),
]


# Numpy and the pillow handler are unavailable
@pytest.mark.skipif(HAVE_NP, reason='Numpy is available')
class TestNoNumpy_NoPillowHandler:
    """Tests for handling datasets without numpy and the handler."""

    def setup(self):
        """Setup the environment."""
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = []

    def teardown(self):
        """Restore the environment."""
        pydicom.config.pixel_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert not HAVE_NP
        assert PIL_HANDLER is not None

    def test_can_access_supported_dataset(self):
        """Test that we can read and access elements in dataset."""
        # JPEG Baseline
        ds = dcmread(JPGB_08_08_3_0_120F_YBR_FULL_422)
        assert 'PLA' == ds.PatientName
        assert 6108928 == len(ds.PixelData)

        # JPEG Extended
        ds = dcmread(JPGE_16_12_1_0_1F_M2)
        assert 'CompressedSamples^NM1' == ds.PatientName
        assert 6846 == len(ds.PixelData)

        # JPEG Lossless
        ds = dcmread(JPGL_16_16_1_1_1F_M2)
        assert 'CompressedSamples^NM1' == ds.PatientName
        assert 116076 == len(ds.PixelData)

        # JPEG 2000
        ds = dcmread(J2KR_16_10_1_0_1F_M1)
        assert 'CompressedSamples^RG3' == ds.PatientName
        assert 830542 == len(ds.PixelData)

        # JPEG 2000 Lossless
        ds = dcmread(J2KI_08_08_3_0_1F_RGB)
        assert 'Lestrade^G' == ds.PatientName
        assert 1286 == len(ds.PixelData)

    @pytest.mark.parametrize("fpath,data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    def test_pixel_array_raises(self):
        """Test pixel_array raises exception for all syntaxes."""
        ds = dcmread(IMPL)
        for uid in AllTransferSyntaxes:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises(NotImplementedError,
                               match="UID of '{}'".format(uid)):
                ds.pixel_array

    def test_using_pillow_handler_raises(self):
        ds = dcmread(J2KI_08_08_3_0_1F_RGB)
        msg = ("The pixel data handler 'pillow' is not available on your "
               "system. Please refer to the pydicom documentation*")
        with pytest.raises(RuntimeError, match=msg):
            ds.decompress('pillow')


JPGB = JPEGBaseline8Bit
JPGE = JPEGExtended12Bit
JPGL = JPEGLosslessSV1
J2KI = JPEG2000
J2KR = JPEG2000Lossless
REFERENCE_DATA = [
    # fpath, (syntax, bits, nr samples, pixel repr, nr frames, shape, dtype)
    (JPGB_08_08_3_0_120F_YBR_FULL_422, (JPGB, 8, 3, 0, 120, (120, 480, 640, 3), 'uint8')),  # noqa
    (JPGB_08_08_3_0_1F_YBR_FULL_422_411, (JPGB, 8, 3, 0, 1, (100, 100, 3), 'uint8')),  # noqa
    (JPGB_08_08_3_0_1F_YBR_FULL_422_422, (JPGB, 8, 3, 0, 1, (100, 100, 3), 'uint8')),  # noqa
    (JPGB_08_08_3_0_1F_YBR_FULL_411, (JPGB, 8, 3, 0, 1, (100, 100, 3), 'uint8')),  # noqa
    (JPGB_08_08_3_0_1F_YBR_FULL_422, (JPGB, 8, 3, 0, 1, (100, 100, 3), 'uint8')),  # noqa
    (JPGB_08_08_3_0_1F_YBR_FULL_444, (JPGB, 8, 3, 0, 1, (100, 100, 3), 'uint8')),  # noqa
    (JPGB_08_08_3_0_1F_RGB, (JPGB, 8, 3, 0, 1, (256, 256, 3), 'uint8')),
    (JPGB_08_08_3_0_1F_RGB_APP14, (JPGB, 8, 3, 0, 1, (256, 256, 3), 'uint8')),
    (J2KR_08_08_3_0_1F_YBR_ICT, (J2KR, 8, 3, 0, 1, (480, 640, 3), 'uint8')),
    (J2KR_16_10_1_0_1F_M1, (J2KR, 16, 1, 0, 1, (1760, 1760), 'uint16')),
    (J2KR_16_12_1_0_1F_M2, (J2KR, 16, 1, 0, 1, (1024, 1024), 'uint16')),
    (J2KR_16_15_1_0_1F_M1, (J2KR, 16, 1, 0, 1, (1955, 1841), 'uint16')),
    (J2KR_16_16_1_0_10F_M2, (J2KR, 16, 1, 0, 10, (10, 64, 64), 'uint16')),
    (J2KR_16_14_1_1_1F_M2, (J2KR, 16, 1, 1, 1, (512, 512), 'int16')),
    (J2KR_16_16_1_1_1F_M2, (J2KR, 16, 1, 1, 1, (64, 64), 'int16')),
    (J2KI_08_08_3_0_1F_RGB, (J2KI, 8, 3, 0, 1, (100, 100, 3), 'uint8')),
    (J2KI_08_08_3_0_1F_YBR_ICT, (J2KI, 8, 3, 0, 1, (480, 640, 3), 'uint8')),
    (J2KI_16_10_1_0_1F_M1, (J2KI, 16, 1, 0, 1, (1760, 1760), 'uint16')),
    (J2KI_16_12_1_0_1F_M2, (J2KI, 16, 1, 0, 1, (1024, 1024), 'uint16')),
    (J2KI_16_15_1_0_1F_M1, (J2KI, 16, 1, 0, 1, (1955, 1841), 'uint16')),
    (J2KI_16_14_1_1_1F_M2, (J2KI, 16, 1, 1, 1, (512, 512), 'int16')),
    (J2KI_16_16_1_1_1F_M2, (J2KI, 16, 1, 1, 1, (1024, 256), 'int16')),
]

JPEG_MATCHING_DATASETS = [
    # (compressed, reference, hard coded check values)
    pytest.param(
        JPGB_08_08_3_0_1F_YBR_FULL_422_411,
        get_testdata_file("SC_rgb_dcmtk_ebcynp_dcmd.dcm"),
        [
            (253, 1, 0), (253, 128, 132), (0, 255, 5), (127, 255, 127),
            (1, 0, 254), (127, 128, 255), (0, 0, 0), (64, 64, 64),
            (192, 192, 192), (255, 255, 255),
        ],
        marks=pytest.mark.xfail(reason="Resulting image is a bad match")
    ),
    pytest.param(
        JPGB_08_08_3_0_1F_YBR_FULL_422_422,
        get_testdata_file("SC_rgb_dcmtk_ebcys2_dcmd.dcm"),
        [
            (254, 0, 0), (255, 127, 127), (0, 255, 5), (129, 255, 129),
            (0, 0, 254), (128, 127, 255), (0, 0, 0), (64, 64, 64),
            (192, 192, 192), (255, 255, 255),
        ],
    ),
    pytest.param(
        JPGB_08_08_3_0_1F_YBR_FULL_411,
        get_testdata_file("SC_rgb_dcmtk_ebcyn1_dcmd.dcm"),
        [
            (253, 1, 0), (253, 128, 132), (0, 255, 5), (127, 255, 127),
            (1, 0, 254), (127, 128, 255), (0, 0, 0), (64, 64, 64),
            (192, 192, 192), (255, 255, 255),
        ],
        marks=pytest.mark.xfail(reason="Resulting image is a bad match")
    ),
    pytest.param(
        JPGB_08_08_3_0_1F_YBR_FULL_422,
        get_testdata_file("SC_rgb_dcmtk_ebcyn2_dcmd.dcm"),
        [
            (254, 0, 0), (255, 127, 127), (0, 255, 5), (129, 255, 129),
            (0, 0, 254), (128, 127, 255), (0, 0, 0), (64, 64, 64),
            (192, 192, 192), (255, 255, 255),
        ],
    ),
    pytest.param(
        JPGB_08_08_3_0_1F_YBR_FULL_444,
        get_testdata_file("SC_rgb_dcmtk_ebcys4_dcmd.dcm"),
        [
            (254, 0, 0), (255, 127, 127), (0, 255, 5), (129, 255, 129),
            (0, 0, 254), (128, 127, 255), (0, 0, 0), (64, 64, 64),
            (192, 192, 192), (255, 255, 255),
        ],
    ),
    pytest.param(
        JPGB_08_08_3_0_1F_RGB,
        get_testdata_file("SC_rgb_jpeg_dcmd.dcm"),
        [
            (244, 244, 244), (244, 244, 244), (244, 244, 244), (244, 244, 244),
            (236, 237, 234), (244, 244, 244), (244, 244, 244), (244, 244, 244),
            (244, 244, 244), (244, 244, 244),
        ],
    ),
    pytest.param(
        JPGB_08_08_3_0_1F_RGB_APP14,
        get_testdata_file("SC_rgb_jpeg_app14_dcmd.dcm"),
        [
            (246, 246, 246), (246, 246, 246), (246, 246, 246), (246, 246, 246),
            (246, 246, 246), (244, 244, 246), (246, 246, 246), (246, 246, 246),
            (246, 246, 246), (246, 246, 246),
        ],
    ),
]
JPEG2K_MATCHING_DATASETS = [
    # (compressed, reference, fixes)
    pytest.param(
        J2KR_08_08_3_0_1F_YBR_ICT,
        get_testdata_file("US1_UNCR.dcm"),
        {},
    ),
    pytest.param(
        J2KR_16_10_1_0_1F_M1,
        get_testdata_file("RG3_UNCR.dcm"),
        {},
    ),
    pytest.param(
        J2KR_16_12_1_0_1F_M2,
        get_testdata_file("MR2_UNCR.dcm"),
        {},
    ),
    pytest.param(
        J2KR_16_15_1_0_1F_M1,
        get_testdata_file("RG1_UNCR.dcm"),
        {},
    ),
    pytest.param(
        J2KR_16_16_1_0_10F_M2,
        get_testdata_file("emri_small.dcm"),
        {'BitsStored': 16},
    ),
    pytest.param(
        J2KR_16_14_1_1_1F_M2,
        get_testdata_file("693_UNCR.dcm"),
        {'BitsStored': 14},
    ),
    pytest.param(
        J2KR_16_16_1_1_1F_M2,
        get_testdata_file("MR_small.dcm"),
        {},
    ),
    pytest.param(
        J2KI_08_08_3_0_1F_RGB,
        get_testdata_file("SC_rgb_gdcm2k_uncompressed.dcm"),
        {},
    ),
    pytest.param(
        J2KI_08_08_3_0_1F_YBR_ICT,
        get_testdata_file("US1_UNCI.dcm"),
        {},
    ),
    pytest.param(
        J2KI_16_10_1_0_1F_M1,
        get_testdata_file("RG3_UNCI.dcm"),
        {},
    ),
    pytest.param(
        J2KI_16_12_1_0_1F_M2,
        get_testdata_file("MR2_UNCI.dcm"),
        {},
    ),
    pytest.param(
        J2KI_16_15_1_0_1F_M1,
        get_testdata_file("RG1_UNCI.dcm"),
        {},
    ),
    pytest.param(
        J2KI_16_14_1_1_1F_M2,
        get_testdata_file("693_UNCI.dcm"),
        {'BitsStored': 16},
    ),
    pytest.param(
        J2KI_16_16_1_1_1F_M2,
        get_testdata_file("JPEG2000_UNC.dcm"),
        {},
    ),
]


@pytest.mark.skipif(not HAVE_JPEG2K, reason='Pillow or JPEG2K not available')
class TestPillowHandler_JPEG2K:
    """Tests for handling Pixel Data with the handler."""
    def setup(self):
        """Setup the test datasets and the environment."""
        self.original_handlers = pydicom.config.pixel_data_handlers
        self.original_j2k = pydicom.config.APPLY_J2K_CORRECTIONS
        pydicom.config.pixel_data_handlers = [NP_HANDLER, PIL_HANDLER]

    def teardown(self):
        """Restore the environment."""
        pydicom.config.pixel_data_handlers = self.original_handlers
        pydicom.config.APPLY_J2K_CORRECTIONS = self.original_j2k

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert HAVE_NP
        assert HAVE_PIL
        assert PIL_HANDLER is not None

    def test_unsupported_syntax_raises(self):
        """Test pixel_array raises exception for unsupported syntaxes."""
        pydicom.config.pixel_data_handlers = [PIL_HANDLER]

        ds = dcmread(EXPL)
        for uid in UNSUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises((NotImplementedError, RuntimeError)):
                ds.pixel_array

    @pytest.mark.parametrize("fpath, data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    @pytest.mark.parametrize('fpath, data', REFERENCE_DATA)
    def test_properties(self, fpath, data):
        """Test dataset and pixel array properties are as expected."""
        if data[0] not in JPEG2K_SUPPORTED_SYNTAXES:
            return

        ds = dcmread(fpath)
        assert ds.file_meta.TransferSyntaxUID == data[0]
        assert ds.BitsAllocated == data[1]
        assert ds.SamplesPerPixel == data[2]
        assert ds.PixelRepresentation == data[3]
        assert getattr(ds, 'NumberOfFrames', 1) == data[4]

        bs = defragment_data(ds.PixelData)
        if get_j2k_parameters(bs)["precision"] != ds.BitsStored:
            with pytest.warns(UserWarning, match=r"doesn't match the JPEG 20"):
                arr = ds.pixel_array
        else:
            arr = ds.pixel_array

        assert arr.flags.writeable
        assert data[5] == arr.shape
        assert arr.dtype == data[6]

    @pytest.mark.parametrize('fpath, rpath, fixes', JPEG2K_MATCHING_DATASETS)
    def test_array(self, fpath, rpath, fixes):
        """Test pixel_array returns correct values."""
        ds = dcmread(fpath)
        # May need to correct some element values
        for kw, val in fixes.items():
            setattr(ds, kw, val)
        arr = ds.pixel_array
        if 'YBR_FULL' in ds.PhotometricInterpretation:
            arr = convert_color_space(arr, ds.PhotometricInterpretation, 'RGB')

        ref = dcmread(rpath).pixel_array
        assert np.array_equal(arr, ref)

    def test_warning(self):
        """Test that the precision warning works OK."""
        ds = dcmread(J2KR_16_14_1_1_1F_M2)
        msg = (
            r"The \(0028,0101\) 'Bits Stored' value \(16-bit\) doesn't match "
            r"the JPEG 2000 data \(14-bit\). It's recommended that you "
            r"change the 'Bits Stored' value"
        )
        with pytest.warns(UserWarning, match=msg):
            ds.pixel_array

    def test_decompress_using_pillow(self):
        """Test decompressing JPEG2K with pillow handler succeeds."""
        ds = dcmread(J2KR_16_14_1_1_1F_M2)
        ds.BitsStored = 14
        ds.decompress(handler_name='pillow')
        arr = ds.pixel_array
        ds = dcmread(get_testdata_file("693_UNCR.dcm"))
        ref = ds.pixel_array
        assert np.array_equal(arr, ref)

    def test_changing_bits_stored(self):
        """Test changing BitsStored affects the pixel data."""
        pydicom.config.APPLY_J2K_CORRECTIONS = False
        ds = dcmread(J2KR_16_14_1_1_1F_M2)
        assert 16 == ds.BitsStored
        with pytest.warns(UserWarning):
            arr = ds.pixel_array

        ds.BitsStored = 14
        arr_14 = ds.pixel_array
        assert not np.array_equal(arr, arr_14)

    def test_pixel_rep_mismatch(self):
        """Test mismatched j2k sign and Pixel Representation."""
        ds = dcmread(J2KR_16_13_1_1_1F_M2_MISMATCH)
        assert 1 == ds.PixelRepresentation
        assert 13 == ds.BitsStored

        bs = defragment_data(ds.PixelData)
        params = get_j2k_parameters(bs)
        assert 13 == params["precision"]
        assert not params["is_signed"]
        arr = ds.pixel_array

        assert 'int16' == arr.dtype
        assert (512, 512) == arr.shape
        assert arr.flags.writeable

        assert -2000 == arr[0, 0]
        assert [621, 412, 138, -193, -520, -767, -907, -966, -988, -995] == (
            arr[47:57, 279].tolist()
        )
        assert [-377, -121, 141, 383, 633, 910, 1198, 1455, 1638, 1732] == (
            arr[328:338, 106].tolist()
        )


@pytest.mark.skipif(not HAVE_JPEG, reason='Pillow or JPEG not available')
class TestPillowHandler_JPEG:
    """Tests for handling Pixel Data with the handler."""
    def setup(self):
        """Setup the test datasets and the environment."""
        self.original_handlers = pydicom.config.pixel_data_handlers
        pydicom.config.pixel_data_handlers = [NP_HANDLER, PIL_HANDLER]

    def teardown(self):
        """Restore the environment."""
        pydicom.config.pixel_data_handlers = self.original_handlers

    def test_environment(self):
        """Check that the testing environment is as expected."""
        assert HAVE_NP
        assert HAVE_PIL
        assert PIL_HANDLER is not None

    def test_unsupported_syntax_raises(self):
        """Test pixel_array raises exception for unsupported syntaxes."""
        pydicom.config.pixel_data_handlers = [PIL_HANDLER]

        ds = dcmread(EXPL)
        for uid in UNSUPPORTED_SYNTAXES:
            ds.file_meta.TransferSyntaxUID = uid
            with pytest.raises((NotImplementedError, RuntimeError)):
                ds.pixel_array

    @pytest.mark.parametrize("fpath, data", REFERENCE_DATA_UNSUPPORTED)
    def test_can_access_unsupported_dataset(self, fpath, data):
        """Test can read and access elements in unsupported datasets."""
        ds = dcmread(fpath)
        assert data[0] == ds.file_meta.TransferSyntaxUID
        assert data[1] == ds.PatientName

    @pytest.mark.parametrize('fpath, data', REFERENCE_DATA)
    def test_properties(self, fpath, data):
        """Test dataset and pixel array properties are as expected."""
        if data[0] not in JPEG_SUPPORTED_SYNTAXES:
            return

        ds = dcmread(fpath)
        assert ds.file_meta.TransferSyntaxUID == data[0]
        assert ds.BitsAllocated == data[1]
        assert ds.SamplesPerPixel == data[2]
        assert ds.PixelRepresentation == data[3]
        assert getattr(ds, 'NumberOfFrames', 1) == data[4]

        arr = ds.pixel_array
        assert arr.flags.writeable
        assert data[5] == arr.shape
        assert arr.dtype == data[6]

    @pytest.mark.parametrize('fpath, rpath, values', JPEG_MATCHING_DATASETS)
    def test_array(self, fpath, rpath, values):
        """Test pixel_array returns correct values."""
        ds = dcmread(fpath)
        arr = ds.pixel_array
        if 'YBR' in ds.PhotometricInterpretation:
            arr = convert_color_space(arr, ds.PhotometricInterpretation, 'RGB')

        ref = dcmread(rpath).pixel_array

        if values:
            assert tuple(arr[5, 50, :]) == values[0]
            assert tuple(arr[15, 50, :]) == values[1]
            assert tuple(arr[25, 50, :]) == values[2]
            assert tuple(arr[35, 50, :]) == values[3]
            assert tuple(arr[45, 50, :]) == values[4]
            assert tuple(arr[55, 50, :]) == values[5]
            assert tuple(arr[65, 50, :]) == values[6]
            assert tuple(arr[75, 50, :]) == values[7]
            assert tuple(arr[85, 50, :]) == values[8]
            assert tuple(arr[95, 50, :]) == values[9]

        assert np.array_equal(arr, ref)

    def test_color_3d(self):
        """Test decoding JPEG with pillow handler succeeds."""
        ds = dcmread(JPGB_08_08_3_0_120F_YBR_FULL_422)
        assert "YBR_FULL_422" == ds.PhotometricInterpretation
        arr = ds.pixel_array
        assert arr.flags.writeable
        assert (120, 480, 640, 3) == arr.shape
        arr = convert_color_space(arr, 'YBR_FULL_422', 'RGB')
        # this test points were manually identified in Osirix viewer
        assert (41, 41, 41) == tuple(arr[3, 159, 290, :])
        assert (57, 57, 57) == tuple(arr[3, 169, 290, :])

        assert "YBR_FULL_422" == ds.PhotometricInterpretation

    def test_JPGE_16bit_raises(self):
        """Test decoding JPEG lossy with pillow handler fails."""
        ds = dcmread(JPGE_16_12_1_0_1F_M2)
        msg = (
            r"1.2.840.10008.1.2.4.51 - JPEG Extended \(Process 2 and 4\) only "
            r"supported by Pillow if Bits Allocated = 8"
        )
        with pytest.raises(NotImplementedError, match=msg):
            ds.pixel_array

    def test_JPGL_raises(self):
        """Test decoding JPEG Lossless with pillow handler fails."""
        ds = dcmread(JPGL_16_16_1_1_1F_M2)
        msg = r"as there are no pixel data handlers available that support it"
        with pytest.raises(NotImplementedError, match=msg):
            ds.pixel_array

    def test_JPGB_odd_data_size(self):
        """Test decoding JPEG Baseline with pillow handler succeeds."""
        ds = dcmread(JPGB_08_08_3_0_1F_YBR_FULL)
        pixel_data = ds.pixel_array
        assert pixel_data.nbytes == 27
        assert pixel_data.shape == (3, 3, 3)

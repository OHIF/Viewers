Test Files used for testing pydicom

2020-06 Many files were moved to an external data store,
and are downloaded as needed.

-----------------------------------
I obtained images to test the pydicom code, and revised them as follow:
  * images were often downsized to keep the total file size quite small (typically <50K-ish). I wanted unittests for the code where I could run a number of tests quickly, and with files I could include in the source (and binary) distributions without bloating them too much
  * In some cases, the original files have been binary edited to replace anything that looks like a real patient name

I believe there is no restriction on using any of these files in this manner.

First, which transfer syntax the files are:
ExplVR_BigEnd.dcm       : Expl VR Big Endian
ExplVR_BigEndNoMeta.dcm : Expl VR Big Endian
MR_small_bigendian.dcm  : Expl VR Big Endian

color-pl.dcm            : Expl VR Little Endian
color-px.dcm            : Expl VR Little Endian
CT_small.dcm            : Expl VR Little Endian
ExplVR_LitEndNoMeta.dcm : Expl VR Little Endian
image_dfl.dcm           : Expl VR Little Endian
JPEG-LL.dcm             : Expl VR Little Endian
JPEG-lossy.dcm          : Expl VR Little Endian
JPEG2000.dcm            : Expl VR Little Endian
liver.dcm               : Expl VR Little Endian
MR_small.dcm            : Expl VR Little Endian
OBXXXX1A.dcm            : Expl VR Little Endian
reportsi.dcm            : Expl VR Little Endian
test-SR.dcm             : Expl VR Little Endian
explicit_VR-UN.dcm      : Expl VR Little Endian
UN_sequence.dcm         : Expl VR Little Endian

MR_small_implicit.dcm   : Impl VR Little Endian
nested_priv_SQ.dcm      : Impl VR Little Endian
no_meta_group_length.dcm: Impl VR Little Endian
OT-PAL-8-face.dcm       : Impl VR Little Endian
priv_SQ.dcm             : Impl VR Little Endian
rtdose.dcm              : Impl VR Little Endian
rtplan.dcm              : Impl VR Little Endian
rtplan_truncated.dcm    : Impl VR Little Endian
rtstruct.dcm            : Impl VR Little Endian

693_*.dcm
  * Regression datasets for issue #693
  * JPEG2000, JPEG2000Lossless and uncompressed versions
  * Mismatch between BitsStored and sample bit depth

bad_sequence.dcm
   * Anonymized test dataset for issue #1067, provided by @sylvainKritter
   * JPEGLossless:Non-hierarchical-1stOrderPrediction
   * contains invalid sequence (encoded as Implicit Little Endian) with VR
   "UN"

CT_small.dcm
  * CT image, Explicit VR, LittleEndian
  * Downsized to 128x128 from 'CT1_UNC', ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04/

eCT_Supplemental.dcm
  * Original filename CT0012
  * Taken from ftp://medical.nema.org/medical/dicom/Multiframe/CT/nemamfct.images.tar.bz2
  * 2 frames, 16 bits allocated/stored, MONOCHROME2
  * Enhanced CT with supplemental (at IV 1024) 16-bit palette colour LUT data

GDCMJ2K_TextGBR.dcm (from GDCM)
  * JPEG 2000 Lossless transfer syntax
  * Contains non-conformant Pixel Data with a JP2 header
  * unsigned 8-bit, 3 samples/px, YBR_RCT Photometric Interpretation

J2K_pixelrep_mismatch.dcm
  * Dataset from issue 1149
  * J2K data is unsigned, Pixel Representation 1
  * Bits Stored is 13

MR_small.dcm
  * MR image, Explicit VR, LittleEndian
  * Downsized to 64x64 from 'MR1_UNC', ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04/
  * Explicit VR big endian version created using DCMTK's dcmconv for PR #714

MR_small_implicit.dcm
  * The same dataset as MR_small, saved with Implicit VR using dcmodify

MR_small_bigendian.dcm
  * The same dataset as MR_small, saved as Big Endian using dcmodify

MR2_*.dcm
  * JPEG2000, JPEG2000Lossless and uncompressed versions
  * unsigned 16-bit/12-bit with rescale and windowing
  * From ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04

JPGExtended.dcm
  * 1.2.840.10008.1.2.4.51 - JPEG Extended
  * Fixed version of JPEG-lossy.dcm

JPGLosslessP14SV1_1s_1f_8b.dcm
  * 1.2.840.10008.1.2.4.70 - JPEG Lossless, Process 14, Selection Value 1
  * 1 sample/px, 1 frame, 8-bits stored, monochrome2

JPEG2000.dcm and JPEG2000_UNC.dcm (uncompressed version)
  * JPEG 2000 small image
  * to test JPEG transfer syntax, eventually JPEG decompression
  * Edited 'NM1_J2KI' from ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04

image_dfl.dcm
  * Compressed (using "deflate" zlib compression) after FileMeta
  * 'image_dfl' from http://www.dclunie.com/images/compressed/

gdcm-US-ALOKA-16.dcm (from GDCM)
  * Little endian implicit
  * Segmented 16-bit Palette Color LUT Data
  * Modified to remove original patient name and ID from Pixel Data

gdcm-US-ALOKA-16_big.dcm (from GDCM)
  * Big endian implicit version of gdcm-US-ALOKA-16.dcm
  * Converted to big endian using DCMTK's dcmodify +tb

ExplVR_BigEnd.dcm
  * Big Endian test image
  * Also is Samples Per Pixel of 3 (RGB)
  * Downsized to 60x80 from 'US-RGB-8-epicard' at http://www.barre.nom.fr/medical/samples/

JPEG-LL.dcm
  * NM1_JPLL from ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04/
  * Transfer Syntax 1.2.840.10008.1.2.4.70:  JPEG Lossless Default Process 14 [Selection Value 1]

JPEG-lossy.dcm
  * NM1_JPLY from ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04/
  * 1.2.840.10008.1.2.4.51 Default Transfer Syntax for Lossy JPEG 12-bit
  * GDCM prints when reading this file: "Unsupported JPEG data precision 12" and "Invalid SOS parameters for sequential JPEG", although it does appear to be read properly

JPEG2000-embedded-sequence-delimiter.dcm
  * A copy of JPEG2000.dcm, with 4 of the encoded pixel data bytes replaced with the Sequence Delimiter
  * Almost certainly not a valid JPEG anymore, but the DICOM structure is valid
  * Used to reproduce #1140.

liver.dcm
  * The DICOM SEG example was generated using the dcmqi library: https://github.com/qiicr/dcmqi
  * Provided by Andrey Fedorov (@fedorov)
  * Explicit VR big endian versions created using DCMTK's dcmconv and a script
    used to fix the pixel data for PR #714
  * Single frame versions created using a script for PR #714

mlut_18.dcm
  * Modality LUT Sequence
  * One of the IHE (https://wiki.ihe.net/index.php/Main_Page) MESA display test
    images

no_meta.dcm
  * Same as CT_small.dcm with no File Meta Information header
    
UN_sequence.dcm
  * Contains only one private sequence with VR UN
  * Provided by @naterichman to reproduce issue #1312


Created by a commercial radiotherapy treatment planning system and modified:
rtplan.dcm       Implicit VR, Little Endian
rtdose.dcm       Implicit VR, Little Endian
  * Explicit VR big endian version created using DCMTK's dcmconv and the
    pixel data corrected using script for PR #714
  * Single frame version created using a script for PR #714
  * RLE encoded versions created using GDCM's gdcmconv for PR #708

chr*.dcm
  * Character set files for testing (0008,0005) Specific Character Set
  * from http://www.dclunie.com/images/charset/SCS*
  * downsized to 32x32 since pixel data is irrelevant for these (test pattern only)

empty_charset_LEI.dcm
  * Dataset with empty Specific Character Set, regression dataset for #1038
  * provided by @micjuel

test-SR.dcm
  * from ftp://ftp.dcmtk.org/pub/dicom/offis/software/dscope/dscope360/support/srdoc103.zip, file "test.dcm"
  * Structured Reporting example, many levels of nesting

priv_SQ.dcm
  * a file with an undefined length SQ item in a private tag.
  * minimal data elements kept from example files in issues 91, 97, 98

OBXXXX1A.dcm
  * a file with a Photometric Interpretation of PALETTE COLOR
  * used to check if to pixel_array is interpreted correctly for such a case
  * taken from https://github.com/pydicom/pydicom/issues/205#issuecomment-103329677
  * supposedly from a Philips machine
  * Explicit VR big endian version created using DCMTK's dcmconv and the
    pixel data corrected using script for PR #714
  * 2 frame version created using a script for PR #714
  * RLE encoded versions created using GDCM's gdcmconv for PR #708

OT-PAL-8-face.dcm
  * a file with a Photometric Interpretation of PALETTE COLOR
  * used to check if to pixel_array is interpreted correctly for such a case
  * taken from http://www.barre.nom.fr/medical/samples/

RG1_*.dcm
  * JPEG2000, JPEG2000Lossless and uncompressed versions
  * unsigned 16-bit/15-bit with windowing
  * From ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04

RG3_*.dcm
  * JPEG2000, JPEG2000Lossless and uncompressed versions
  * unsigned 16-bit/10-bit with windowing
  * From ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04

SC_rgb.dcm
  * 16 and 32 bit versions created using a script for PR #714
  * Explicit VR big endian version created using DCMTK's dcmconv and the
    pixel data corrected using script for PR #714
  * 2 frame versions created using a script for PR #714
  * RLE encoded versions created using GDCM's gdcmconv for PR #708

SC_jpeg_no_color_transform.dcm
  * 8-bit baseline JPEG compressed in RGB color space without transformation
    into YCbCr color space
  * Individual tile of a TCGA whole slide image in Aperio SVS format obtained
    from TCIA
  * Created for PR #878 using DCMTK's img2cdm script with the value of the
    Photometric Interpretation element patched

SC_jpeg_no_color_transform_2.dcm
  * 8-bit baseline JPEG compressed in RGB color space without transformation
    into YCbCr color space
  * Individual tile of a TCGA whole slide image in Aperio SVS format obtained
    from TCIA with APP14 marker segment included in JPEG header
  * Created for PR #878 using DCMTK's img2cdm script with the value of the
    Photometric Interpretation element patched

SC_ybr_full_uncompressed.dcm
  * Uncompressed version of SC_rgb_dcmtk_+eb+cy+n2.dcm using gdcmconv
  * PhotometricIntepretation is YBR_FULL

SC_ybr_full_422_uncompressed.dcm
    * Uncompressed version of SC_rgb_dcmtk_+eb+cy+n2.dcm using gdcmconv
    * Converted to YBR_FULL_422 using a script by @scaramallion
    * PhotometricIntepretation is YBR_FULL_422

US1_*.dcm
  * JPEG2000, JPEG2000Lossless and uncompressed versions
  * unsigned 3 channel 8-bit/8-bit
  * From ftp://medical.nema.org/MEDICAL/Dicom/DataSets/WG04

vlut_04.dcm
    * VOI LUT Sequence
    * One of the IHE (https://wiki.ihe.net/index.php/Main_Page) MESA display test
      images

zipMR.gz
  * a gzipped version of MR_small.dcm
  * used for checking that deferred read reopens as zip again (issue 103)

explicit_VR-UN.dcm
  * taken from test data in issue #968
  * original image taken from https://www.cancerimagingarchive.net,
    (freely available de-identified datasets)
  * image was compressed using "gdcmconv --j2k <original.dcm>"
  * almost all tags have VR "UN" due to gdcmconv issue

== DICOMDIR tests ==

dicomdirtests files were from http://www.pcir.org, freely available image sets.
They were downsized to 16x16 images to keep them very small so they
could be added to the source distribution without bloating it. For the
same reason, many were removed, leaving only samples of the studies,
series, and images.

For the subdirectories ending in "N" (e.g. CT2N, CT5N), the name indicates
the number of images inside the folder, i.e. CT2N has two images,
CT5N has five. This was a memory-aid for use in unit tests.

Below is the hierarchy of Patient, Study, Series, Images that comes from a
straight read of the dicomdirtests DICOMDIR file. The DICOMDIR file itself
was created using the dcmtk program dcmgpdir. It complained about different
Specific Character Set in some of the files, so some with 2022 IR6 were set
to ISO_IR 100.


Patient: 77654033: Doe^Archibald
    Study 2: 20010101: XR C Spine Comp Min 4 Views
        Series 1:  CR: (1 image)
            ['./77654033/CR1/6154']
        Series 2:  CR: (1 image)
            ['./77654033/CR2/6247']
        Series 3:  CR: (1 image)
            ['./77654033/CR3/6278']
    Study 2: 19950903: CT, HEAD/BRAIN WO CONTRAST
        Series 2:  CT: (4 images)
            ['./77654033/CT2/17106',
             './77654033/CT2/17136',
             './77654033/CT2/17166',
             './77654033/CT2/17196']

Patient: 98890234: Doe^Peter
    Study 2: 20010101:
        Series 4:  CT: (2 images)
            ['./98892001/CT2N/6293',
             './98892001/CT2N/6924']
        Series 5:  CT: (5 images)
            ['./98892001/CT5N/2062',
             './98892001/CT5N/2392',
             './98892001/CT5N/2693',
             './98892001/CT5N/3023',
             './98892001/CT5N/3353']
    Study 428: 20030505: Carotids
        Series 1:  MR: (1 image)
            ['./98892003/MR1/15820']
        Series 2:  MR: (1 image)
            ['./98892003/MR2/15970']
    Study 134: 20030505: Brain
        Series 1:  MR: (1 image)
            ['./98892003/MR1/4919']
        Series 2:  MR: (3 images)
            ['./98892003/MR2/4950',
             './98892003/MR2/5011',
             './98892003/MR2/4981']
    Study 2: 20030505: Brain-MRA
        Series 1:  MR: (1 image)
            ['./98892003/MR1/5641']
        Series 2:  MR: (3 images)
            ['./98892003/MR2/6935',
             './98892003/MR2/6605',
             './98892003/MR2/6273']
        Series 700:  MR: (7 images)
            ['./98892003/MR700/4558',
             './98892003/MR700/4528',
             './98892003/MR700/4588',
             './98892003/MR700/4467',
             './98892003/MR700/4618',
             './98892003/MR700/4678',
             './98892003/MR700/4648']


== Overlay Data ==

MR-SIEMENS-DICOM-WithOverlays.dcm (from GDCM)
    * Little Endian Explicit VR
    * Single frame, single channel Pixel Data
    * Single frame Overlay Data in group 0x6000
    * Icon Image Sequence
    * 8-bit Palette Color LUT


== Licenses ==

The datasets from GDCM (github.com/malaterre/GDCM) are used under the following
license:

Program: GDCM (Grassroots DICOM). A DICOM library

Copyright (c) 2006-2016 Mathieu Malaterre
Copyright (c) 1993-2005 CREATIS
(CREATIS = Centre de Recherche et d'Applications en Traitement de l'Image)
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

 * Neither name of Mathieu Malaterre, or CREATIS, nor the names of any
   contributors (CNRS, INSERM, UCB, Universite Lyon I), may be used to
   endorse or promote products derived from this software without specific
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS ``AS IS''
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHORS OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

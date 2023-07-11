# Copyright 2008-2018 pydicom authors. See LICENSE file for details.

"""Snippets for what a particular dataset (including nested sequences)
should look like after writing in different expl/impl Vr and endian combos,
as well as undefined length sequences and items
"""

# Implicit VR, little endian, SQ's with defined lengths
impl_LE_deflen_std_hex = (
    b"10 00 10 00 "     # (0010, 0010) Patient's Name
    b"0c 00 00 00 "     # length 12
    b"4e 61 6d 65 5e 50 61 74 69 65 6e 74 "    # "Name^Patient"
    b"20 00 13 00 "     # instance number with no value
    b"00 00 00 00 "     # length 0
    b"06 30 39 00 "     # (3006, 0039) ROI Contour Sequence
    b"5a 00 00 00 "     # length 90
    b"fe ff 00 e0 "     # (fffe, e000) Item Tag
    b"52 00 00 00 "     # length 82
    b"06 30 40 00 "     # (3006, 0040)  Contour Sequence
    b"4a 00 00 00 "     # length 74
    b"fe ff 00 e0 "     # (fffe, e000) Item Tag
    b"1a 00 00 00 "     # length 26
    b"06 30 48 00 "     # (3006, 0048) Contour Number
    b"02 00 00 00 "     # length 2
    b"31 20 "           # "1 "
    b"06 30 50 00 "     # (3006, 0050) Contour Data
    b"08 00 00 00 "     # length 8
    b"32 5c 34 5c 38 5c 31 36 "  # "2\4\8\16"
    b"fe ff 00 e0 "     # (fffe, e000) Item Tag
    b"20 00 00 00 "     # length 32
    b"06 30 48 00 "     # (3006, 0048) Contour Number
    b"02 00 00 00 "     # length 2
    b"32 20 "           # "2 "
    b"06 30 50 00 "     # (3006, 0050) Contour Data
    b"0e 00 00 00 "     # length 14
    b"33 32 5c 36 34 5c 31 32 38 5c 31 39 36 20 "
                        # "32\64\128\196 "
)

# Implicit VR, big endian, SQ's with defined lengths
# Realized after coding this that there is no Impl VR big endian in DICOM std;
#    however, it seems to exist as a GE private transfer syntax.
#    Will leave this here for now.
impl_BE_deflen_std_hex = (
    b"00 10 00 10 "     # (0010, 0010) Patient's Name
    b"00 00 00 0c "     # length 12
    b"4e 61 6d 65 5e 50 61 74 69 65 6e 74 "    # "Name^Patient"
    b"30 06 00 39 "     # (3006, 0039) ROI Contour Sequence
    b"00 00 00 5a "     # length 90
    b"ff fe e0 00 "     # (fffe, e000) Item Tag
    b"00 00 00 52 "     # length 82
    b"30 06 00 40 "     # (3006, 0040)  Contour Sequence
    b"00 00 00 4a "     # length 74
    b"ff fe e0 00 "     # (fffe, e000) Item Tag
    b"00 00 00 1a "     # length 26
    b"30 06 00 48 "     # (3006, 0048) Contour Number
    b"00 00 00 02 "     # length 2
    b"31 20 "           # "1 "
    b"30 06 00 50 "     # (3006, 0050) Contour Data
    b"00 00 00 08 "     # length 8
    b"32 5c 34 5c 38 5c 31 36 "  # "2\4\8\16"
    b"ff fe e0 00 "     # (fffe, e000) Item Tag
    b"20 00 00 00 "     # length 32
    b"30 06 00 48 "     # (3006, 0048) Contour Number
    b"00 00 00 02 "     # length 2
    b"32 20 "           # "2 "
    b"30 06 00 50 "     # (3006, 0050) Contour Data
    b"00 00 00 0e "     # length 14
    b"33 32 5c 36 34 5c 31 32 38 5c 31 39 36 20 "
                        # "32\64\128\196 "
)

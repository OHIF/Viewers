# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
"""Unit tests for the pydicom.filereader module using raw data elements."""

from io import BytesIO

import pytest

from pydicom.filereader import data_element_generator
from pydicom.values import convert_value
from pydicom.sequence import Sequence
from pydicom.util.hexutil import hex2bytes


class TestRawReaderExplVRTests:
    # See comments in data_element_generator
    # summary of DICOM data element formats
    # Here we are trying to test all those variations
    def testExplVRLittleEndianLongLength(self):
        """Raw read: Explicit VR Little Endian long length..."""
        # (0002,0001) OB 2-byte-reserved 4-byte-length, value 0x00 0x01
        bytes_input = "02 00 01 00 4f 42 00 00 02 00 00 00 00 01"
        infile = BytesIO(hex2bytes(bytes_input))
        expected = ((2, 1), 'OB',
                    2, b'\00\01',
                    0xc, False, True, True)

        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)
        # (0002,0002) OB 2-byte-reserved 4-byte-length,
        # value 0x00 0x01

    def testExplVRLittleEndianShortLength(self):
        """Raw read: Explicit VR Little Endian short length..."""
        # (0008,212a) IS 2-byte-length, value '1 '
        infile = BytesIO(hex2bytes("08 00 2a 21 49 53 02 00 31 20"))
        # XXX Assumes that a RawDataElement doesn't convert the value based
        # upon the VR value, thus it will remain a byte string since that is
        # the input
        expected = ((8, 0x212a), 'IS', 2,
                    b'1 ', 0x8, False, True, True)
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)

    def testExplVRLittleEndianUndefLength(self):
        """Raw read: Expl VR Little Endian with undefined length..."""
        # (7fe0,0010), OB, 2-byte reserved, 4-byte-length (UNDEFINED)
        hexstr1 = "e0 7f 10 00 4f 42 00 00 ff ff ff ff"
        hexstr2 = " 41 42 43 44 45 46 47 48 49 4a"  # 'content'
        hexstr3 = " fe ff dd e0 00 00 00 00"        # Sequence Delimiter
        hexstr = hexstr1 + hexstr2 + hexstr3
        infile = BytesIO(hex2bytes(hexstr))
        expected = ((0x7fe0, 0x10), 'OB',
                    0xffffffff, b'ABCDEFGHIJ',
                    0xc, False, True, True)

        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)

        # Test again such that delimiter crosses default 128-byte "chunks"
        for multiplier in (116, 117, 118, 120):
            multiplier = 116
            hexstr2b = hexstr2 + " 00" * multiplier
            hexstr = hexstr1 + hexstr2b + hexstr3
            infile = BytesIO(hex2bytes(hexstr))
            expected = len('ABCDEFGHIJ' + '\0' * multiplier)
            de_gen = data_element_generator(infile,
                                            is_implicit_VR=False,
                                            is_little_endian=True)
            got = next(de_gen)
            got_len = len(got.value)
            assert expected == got_len
            assert got.value.startswith(b'ABCDEFGHIJ\0')


class TestRawReaderImplVR:
    # See comments in data_element_generator
    # summary of DICOM data element formats
    # Here we are trying to test all those variations

    def testImplVRLittleEndian(self):
        """Raw read: Implicit VR Little Endian..."""
        # (0008,212a) {IS} 4-byte-length, value '1 '
        infile = BytesIO(hex2bytes("08 00 2a 21 02 00 00 00 31 20"))

        expected = ((8, 0x212a),
                    None, 2, b'1 ',
                    0x8, True, True, True)

        de_gen = data_element_generator(infile,
                                        is_implicit_VR=True,
                                        is_little_endian=True)
        assert expected == next(de_gen)

    def testImplVRLittleEndianUndefLength(self):
        """Raw read: Impl VR Little Endian with undefined length..."""
        # (7fe0,0010), OB, 2-byte reserved, 4-byte-length (UNDEFINED)
        hexstr1 = "e0 7f 10 00 ff ff ff ff"
        hexstr2 = " 41 42 43 44 45 46 47 48 49 4a"  # 'content'
        hexstr3 = " fe ff dd e0 00 00 00 00"        # Sequence Delimiter
        hexstr = hexstr1 + hexstr2 + hexstr3
        infile = BytesIO(hex2bytes(hexstr))
        expected = ((0x7fe0, 0x10), 'OB or OW',
                    0xffffffff, b'ABCDEFGHIJ',
                    0x8, True, True, True)
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=True,
                                        is_little_endian=True)
        assert expected == next(de_gen)

        # Test again such that delimiter crosses default 128-byte "chunks"
        for multiplier in (116, 117, 118, 120):
            multiplier = 116
            hexstr2b = hexstr2 + " 00" * multiplier
            hexstr = hexstr1 + hexstr2b + hexstr3
            infile = BytesIO(hex2bytes(hexstr))
            expected = len('ABCDEFGHIJ' + '\0' * multiplier)
            de_gen = data_element_generator(infile,
                                            is_implicit_VR=True,
                                            is_little_endian=True)
            got = next(de_gen)
            assert expected == len(got.value)
            assert got.value.startswith(b'ABCDEFGHIJ\0')

    def testExplVRLittleEndianEncapsulatedUndefLength(self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "18 00 00 00"  # Item (dataset) Length
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "51 52 53 54"
            "55 56 57 58"
            "fe ff dd e0"  # (fffe, edd) Sequence Delimiter
            "00 00 00 00"  # required Item Length Field of value 0
        )

        infile = BytesIO(hex2bytes(hexstr))
        expected = (
            (0x7fe0, 0x10),
            'OB',
            0xffffffff,  # declared value length
            b'\xfe\xff\x00\xe0\x18\x00\x00\x00ABCDEFGHIJKLMNOPQRSTUVWX',
            12,          # value starts 12 bytes after beginning of element
            False,       # is Implicit VR
            True,        # is Little Endian
            True
        )
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)
        assert 52 == infile.tell()

    def testExplVRLittleEndianEncapsulatedUndefLengthTwoFragments(self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length broken into two defined-length fragments..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "18 00 00 00"  # Item (dataset) Length
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "51 52 53 54"
            "55 56 57 58"
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "14 00 00 00"  # Item (dataset) Length
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "51 52 53 54"
            "fe ff dd e0"  # (fffe, edd) Sequence Delimiter
            "00 00 00 00"  # required Item Length Field of value 0
        )

        infile = BytesIO(hex2bytes(hexstr))
        expected = (
            (0x7fe0, 0x10),
            'OB',
            0xffffffff,  # declared value length
            (b'\xfe\xff\x00\xe0\x18\x00\x00\x00ABCDEFGHIJKLMNOPQRSTUVWX'
             b'\xfe\xff\x00\xe0\x14\x00\x00\x00ABCDEFGHIJKLMNOPQRST'),
            12,          # value starts 12 bytes after beginning of element
            False,       # is Implicit VR
            True,        # is Little Endian
            True
        )
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)
        assert 80 == infile.tell()

    def testExplVRLittleEndianEncapsulatedUndefLengthUndefItemLength(self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length and whose fragment (Item) also has an undefined
        length..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "ff ff ff ff"  # Item (dataset) Length - undefined
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "51 52 53 54"
            "55 56 57 58"
            "fe ff dd e0"  # (fffe, edd) Sequence Delimiter
            "00 00 00 00"  # required Item Length Field of value 0
        )

        infile = BytesIO(hex2bytes(hexstr))
        expected = (
            (0x7fe0, 0x10),
            'OB',
            0xffffffff,  # declared value length
            b'\xfe\xff\x00\xe0\xff\xff\xff\xffABCDEFGHIJKLMNOPQRSTUVWX',
            12,          # value starts 12 bytes after beginning of element
            False,       # is Implicit VR
            True,        # is Little Endian
            True
        )
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)
        assert 52 == infile.tell()

    def testExplVRLittleEndianEncapsulatedUndefLengthAndTooLongItemLength(
            self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length and whose fragment (Item) has an erroneous (too long)
        length..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "50 00 00 00"  # Item (dataset) Length - too long
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "51 52 53 54"
            "55 56 57 58"
            "fe ff dd e0"  # (fffe, edd) Sequence Delimiter
            "00 00 00 00"  # required Item Length Field of value 0
        )

        infile = BytesIO(hex2bytes(hexstr))
        expected = (
            (0x7fe0, 0x10),
            'OB',
            0xffffffff,  # declared value length
            b'\xfe\xff\x00\xe0\x50\x00\x00\x00ABCDEFGHIJKLMNOPQRSTUVWX',
            12,          # value starts 12 bytes after beginning of element
            False,       # is Implicit VR
            True,        # is Little Endian
            True
        )
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)
        assert 52 == infile.tell()

    def testExplVRLittleEndianEncapsulatedUndefLengthAndItemLengthMIssing(
            self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length and whose fragment (Item) ends before its length
        is specified..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
        )

        infile = BytesIO(hex2bytes(hexstr))
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        with pytest.raises(EOFError):
            next(de_gen)

    def testExplVRLittleEndianEncapsulatedUndefLengthDeferred(self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length that's longer than defer_size..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "14 00 00 00"  # Item (dataset) Length
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "51 52 53 54"
            "fe ff dd e0"  # (fffe, edd) Sequence Delimiter
            "00 00 00 00"  # required Item Length Field of value 0
        )

        infile = BytesIO(hex2bytes(hexstr))
        expected = (
            (0x7fe0, 0x10),
            'OB',
            0xffffffff,  # declared value length
            None,        # extracted data
            12,          # value starts 12 bytes after beginning of element
            False,       # is Implicit VR
            True,        # is Little Endian
            True
        )
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True,
                                        defer_size=16)
        assert expected == next(de_gen)
        assert 48 == infile.tell()

    def testExplVRLittleEndianEncapsulatedUndefLengthBadDelimiterLength(self):
        """Raw read: Expl VR Little Endian encapsulated pixel data with
        undefined length and a bad (non-zero) sequence delimiter length..."""

        hexstr = (
            "e0 7f 10 00"  # (7fe0, 0010) Pixel Data
            "4f 42 00 00"  # VR OB, 2 bytes reserved
            "ff ff ff ff"  # -1 undefined length
            "fe ff 00 e0"  # (fffe, e000) Item Tag
            "10 00 00 00"  # Item (dataset) Length
            "41 42 43 44"
            "45 46 47 48"
            "49 4a 4b 4c"
            "4d 4e 4f 50"
            "fe ff dd e0"  # (fffe, edd) Sequence Delimiter
            "12 13 14 15"  # bad non-0 required Item Length Field
        )

        infile = BytesIO(hex2bytes(hexstr))
        expected = (
            (0x7fe0, 0x10),
            'OB',
            0xffffffff,  # declared value length
            b'\xfe\xff\x00\xe0\x10\x00\x00\x00ABCDEFGHIJKLMNOP',
            12,          # value starts 12 bytes after beginning of element
            False,       # is Implicit VR
            True,         # is Little Endian
            True
        )
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=True)
        assert expected == next(de_gen)
        assert 44 == infile.tell()


class TestRawSequence:
    # See DICOM standard PS3.5-2008 section 7.5 for sequence syntax
    def testEmptyItem(self):
        """Read sequence with a single empty item..."""
        # This is fix for issue 27
        hexstr = (
            "08 00 32 10"    # (0008, 1032) SQ "Procedure Code Sequence"
            " 08 00 00 00"    # length 8
            " fe ff 00 e0"    # (fffe, e000) Item Tag
            " 00 00 00 00"    # length = 0
        ) + (             # --------------- end of Sequence
            " 08 00 3e 10"    # (0008, 103e) LO "Series Description"  nopep8
            " 0c 00 00 00"    # length     nopep8
            " 52 20 41 44 44 20 56 49 45 57 53 20"  # value     nopep8
        )
        # "\x08\x00\x32\x10\x08\x00\x00\x00\xfe\xff\x00\xe0\x00\x00\x00\x00"
        # from issue 27, procedure code sequence (0008,1032)
        # hexstr += "\x08\x00\x3e\x10\x0c\x00\x00\x00\x52\x20
        # \x41\x44\x44\x20\x56\x49\x45\x57\x53\x20"
        # data element following

        fp = BytesIO(hex2bytes(hexstr))
        gen = data_element_generator(fp,
                                     is_implicit_VR=True,
                                     is_little_endian=True)
        raw_seq = next(gen)
        seq = convert_value("SQ", raw_seq)
        assert isinstance(seq, Sequence)
        assert 1 == len(seq)
        assert 0 == len(seq[0])
        elem2 = next(gen)
        assert 0x0008103e == elem2.tag

    def testImplVRLittleEndian_ExplicitLengthSeq(self):
        """Raw read: ImplVR Little Endian SQ with explicit lengths..."""
        # Create a fictional sequence with bytes directly,
        #    similar to PS 3.5-2008 Table 7.5-1 p42
        hexstr = (
            "0a 30 B0 00"    # (300a, 00b0) Beam Sequence
            " 40 00 00 00"    # length
            " fe ff 00 e0"    # (fffe, e000) Item Tag
            " 18 00 00 00"    # Item (dataset) Length
            " 0a 30 c0 00"    # (300A, 00C0) Beam Number
            " 02 00 00 00"    # length
            " 31 20"          # value '1 '
            " 0a 30 c2 00"    # (300A, 00C2) Beam Name
            " 06 00 00 00"    # length
            " 42 65 61 6d 20 31"  # value 'Beam 1'
            # -------------
            " fe ff 00 e0"    # (fffe, e000) Item Tag
            " 18 00 00 00"    # Item (dataset) Length
            " 0a 30 c0 00"    # (300A, 00C0) Beam Number
            " 02 00 00 00"    # length
            " 32 20"          # value '2 '
            " 0a 30 c2 00"    # (300A, 00C2) Beam Name
            " 06 00 00 00"    # length
            " 42 65 61 6d 20 32"  # value 'Beam 2'
        )

        infile = BytesIO(hex2bytes(hexstr))
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=True,
                                        is_little_endian=True)
        raw_seq = next(de_gen)
        seq = convert_value("SQ", raw_seq)

        # The sequence is parsed, but only into raw data elements.
        # They will be converted when asked for. Check some:
        assert 1 == seq[0].BeamNumber
        assert 'Beam 2' == seq[1].BeamName

    def testImplVRBigEndian_ExplicitLengthSeq(self):
        """Raw read: ImplVR BigEndian SQ with explicit lengths..."""
        # Create a fictional sequence with bytes directly,
        #    similar to PS 3.5-2008 Table 7.5-1 p42
        hexstr = (
            "30 0a 00 B0"    # (300a, 00b0) Beam Sequence
            " 00 00 00 40"    # length
            " ff fe e0 00"    # (fffe, e000) Item Tag
            " 00 00 00 18"    # Item (dataset) Length
            " 30 0a 00 c0"    # (300A, 00C0) Beam Number
            " 00 00 00 02"    # length
            " 31 20"          # value '1 '
            " 30 0a 00 c2"    # (300A, 00C2) Beam Name
            " 00 00 00 06"    # length
            " 42 65 61 6d 20 31"  # value 'Beam 1'
            # -------------
            " ff fe e0 00"    # (fffe, e000) Item Tag
            " 00 00 00 18"    # Item (dataset) Length
            " 30 0a 00 c0"    # (300A, 00C0) Beam Number
            " 00 00 00 02"    # length
            " 32 20"          # value '2 '
            " 30 0a 00 c2"    # (300A, 00C2) Beam Name
            " 00 00 00 06"    # length
            " 42 65 61 6d 20 32"  # value 'Beam 2'
        )

        infile = BytesIO(hex2bytes(hexstr))
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=True,
                                        is_little_endian=False)
        raw_seq = next(de_gen)
        seq = convert_value("SQ", raw_seq)

        # The sequence is parsed, but only into raw data elements.
        # They will be converted when asked for. Check some:
        assert 1 == seq[0].BeamNumber
        assert 'Beam 2' == seq[1].BeamName

    def testExplVRBigEndian_UndefinedLengthSeq(self):
        """Raw read: ExplVR BigEndian Undefined Length SQ..."""
        # Create a fictional sequence with bytes directly,
        #    similar to PS 3.5-2008 Table 7.5-2 p42
        hexstr = (
            "30 0a 00 B0"    # (300a, 00b0) Beam Sequence
            " 53 51"         # SQ
            " 00 00"         # reserved
            " ff ff ff ff"    # undefined length
            " ff fe e0 00"    # (fffe, e000) Item Tag
            " 00 00 00 18"    # Item (dataset) Length
            " 30 0a 00 c0"    # (300A, 00C0) Beam Number
            " 49 53"          # IS
            " 00 02"          # length
            " 31 20"          # value '1 '
            " 30 0a 00 c2"    # (300A, 00C2) Beam Name
            " 4c 4F"          # LO
            " 00 06"          # length
            " 42 65 61 6d 20 31"  # value 'Beam 1'
            # -------------
            " ff fe e0 00"    # (fffe, e000) Item Tag
            " 00 00 00 18"    # Item (dataset) Length
            " 30 0a 00 c0"    # (300A, 00C0) Beam Number
            " 49 53"          # IS
            " 00 02"          # length
            " 32 20"          # value '2 '
            " 30 0a 00 c2"    # (300A, 00C2) Beam Name
            " 4C 4F"          # LO
            " 00 06"          # length
            " 42 65 61 6d 20 32"  # value 'Beam 2'
            " ff fe E0 dd"    # SQ delimiter
            " 00 00 00 00"    # zero length
        )

        infile = BytesIO(hex2bytes(hexstr))
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=False)
        seq = next(de_gen)
        # Note seq itself is not a raw data element.
        #     The parser does parse undefined length SQ

        # The sequence is parsed, but only into raw data elements.
        # They will be converted when asked for. Check some:
        assert 1 == seq[0].BeamNumber
        assert 'Beam 2' == seq[1].BeamName

    def test_explVR_switch_implVR_in_SQ_item(self):
        """Raw read: Tolerate missing VR in Sequence item"""
        # issue 1305
        hexstr = (
            "30 0a 00 B0"    # (300a, 00b0) Beam Sequence
            " 53 51"         # SQ
            " 00 00"         # reserved
            " FF FF FF FF"   # undefined length
            " ff fe e0 00"   # (fffe, e000) Item Tag
            " 00 00 00 12"   # Item (dataset) Length - 18 bytes
            " 00 10 00 20 00 00 00 0a"  # (0010, 0020) IMPL VR with length 0a
            " 34 34 34 34 34 34 34 34 34 34"
            " ff fe E0 dd"    # SQ delimiter
            " 00 00 00 00"    # zero length
        )
        infile = BytesIO(hex2bytes(hexstr))
        de_gen = data_element_generator(infile,
                                        is_implicit_VR=False,
                                        is_little_endian=False)
        seq = next(de_gen)
        assert seq[0].PatientID == "4444444444"

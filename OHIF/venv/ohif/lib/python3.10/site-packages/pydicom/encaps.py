# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Functions for working with encapsulated (compressed) pixel data."""

from struct import pack
from typing import List, Generator, Optional, Tuple
import warnings

import pydicom.config
from pydicom.filebase import DicomBytesIO, DicomFileLike
from pydicom.tag import (Tag, ItemTag, SequenceDelimiterTag)


# Functions for parsing encapsulated data
def get_frame_offsets(fp: DicomFileLike) -> Tuple[bool, List[int]]:
    """Return a list of the fragment offsets from the Basic Offset Table.

    **Basic Offset Table**

    The Basic Offset Table Item must be present and have a tag (FFFE,E000) and
    a length, however it may or may not have a value.

    Basic Offset Table with no value
    ::

        Item Tag   | Length    |
        FE FF 00 E0 00 00 00 00

    Basic Offset Table with value (2 frames)
    ::

        Item Tag   | Length    | Offset 1  | Offset 2  |
        FE FF 00 E0 08 00 00 00 00 00 00 00 10 00 00 00

    For single or multi-frame images with only one frame, the Basic Offset
    Table may or may not have a value. When it has no value then its length
    shall be ``0x00000000``.

    For multi-frame images with more than one frame, the Basic Offset Table
    should have a value containing concatenated 32-bit unsigned integer values
    that are the byte offsets to the first byte of the Item tag of the first
    fragment of each frame as measured from the first byte of the first item
    tag following the Basic Offset Table Item.

    All decoders, both for single and multi-frame images should accept both
    an empty Basic Offset Table and one containing offset values.

    .. versionchanged:: 1.4

        Changed to return (is BOT empty, list of offsets).

    Parameters
    ----------
    fp : filebase.DicomFileLike
        The encapsulated pixel data positioned at the start of the Basic Offset
        Table. ``fp.is_little_endian`` should be set to ``True``.

    Returns
    -------
    bool, list of int
        Whether or not the BOT is empty, and a list of the byte offsets
        to the first fragment of each frame, as measured from the start of the
        first item following the Basic Offset Table item.

    Raises
    ------
    ValueError
        If the Basic Offset Table item's tag is not (FFEE,E000) or if the
        length in bytes of the item's value is not a multiple of 4.

    References
    ----------
    DICOM Standard, Part 5, :dcm:`Annex A.4 <part05/sect_A.4.html>`
    """
    if not fp.is_little_endian:
        raise ValueError("'fp.is_little_endian' must be True")

    tag = Tag(fp.read_tag())

    if tag != 0xfffee000:
        raise ValueError(
            f"Unexpected tag '{tag}' when parsing the Basic Table Offset item"
        )

    length = fp.read_UL()
    if length % 4:
        raise ValueError(
            "The length of the Basic Offset Table item is not a multiple of 4"
        )

    offsets = []
    # Always return at least a 0 offset
    if length == 0:
        offsets.append(0)

    for ii in range(length // 4):
        offsets.append(fp.read_UL())

    return bool(length), offsets


def get_nr_fragments(fp: DicomFileLike) -> int:
    """Return the number of fragments in `fp`.

    .. versionadded:: 1.4
    """
    if not fp.is_little_endian:
        raise ValueError("'fp.is_little_endian' must be True")

    nr_fragments = 0
    start = fp.tell()
    while True:
        try:
            tag = Tag(fp.read_tag())
        except EOFError:
            break

        if tag == 0xFFFEE000:
            # Item
            length = fp.read_UL()
            if length == 0xFFFFFFFF:
                raise ValueError(
                    f"Undefined item length at offset {fp.tell() - 4} when "
                    "parsing the encapsulated pixel data fragments"
                )
            fp.seek(length, 1)
            nr_fragments += 1
        elif tag == 0xFFFEE0DD:
            # Sequence Delimiter
            break
        else:
            raise ValueError(
                f"Unexpected tag '{tag}' at offset {fp.tell() - 4} when "
                "parsing the encapsulated pixel data fragment items"
            )

    fp.seek(start)
    return nr_fragments


def generate_pixel_data_fragment(
    fp: DicomFileLike
) -> Generator[bytes, None, None]:
    """Yield the encapsulated pixel data fragments.

    For compressed (encapsulated) Transfer Syntaxes, the (7FE0,0010) *Pixel
    Data* element is encoded in an encapsulated format.

    **Encapsulation**

    The encoded pixel data stream is fragmented into one or more Items. The
    stream may represent a single or multi-frame image.

    Each *Data Stream Fragment* shall have tag of (FFFE,E000), followed by a 4
    byte *Item Length* field encoding the explicit number of bytes in the Item.
    All Items containing an encoded fragment shall have an even number of bytes
    greater than or equal to 2, with the last fragment being padded if
    necessary.

    The first Item in the Sequence of Items shall be a 'Basic Offset Table',
    however the Basic Offset Table item value is not required to be present.
    It is assumed that the Basic Offset Table item has already been read prior
    to calling this function (and that `fp` is positioned past this item).

    The remaining items in the Sequence of Items are the pixel data fragments
    and it is these items that will be read and returned by this function.

    The Sequence of Items is terminated by a (FFFE,E0DD) *Sequence Delimiter
    Item* with an Item Length field of value ``0x00000000``. The presence
    or absence of the *Sequence Delimiter Item* in `fp` has no effect on the
    returned fragments.

    *Encoding*

    The encoding of the data shall be little endian.

    Parameters
    ----------
    fp : filebase.DicomFileLike
        The encoded (7FE0,0010) *Pixel Data* element value, positioned at the
        start of the item tag for the first item after the Basic Offset Table
        item. ``fp.is_little_endian`` should be set to ``True``.

    Yields
    ------
    bytes
        A pixel data fragment.

    Raises
    ------
    ValueError
        If the data contains an item with an undefined length or an unknown
        tag.

    References
    ----------
    DICOM Standard Part 5, :dcm:`Annex A.4 <part05/sect_A.4.html>`
    """
    if not fp.is_little_endian:
        raise ValueError("'fp.is_little_endian' must be True")

    # We should be positioned at the start of the Item Tag for the first
    # fragment after the Basic Offset Table
    while True:
        try:
            tag = Tag(fp.read_tag())
        except EOFError:
            break

        if tag == 0xFFFEE000:
            # Item
            length = fp.read_UL()
            if length == 0xFFFFFFFF:
                raise ValueError(
                    f"Undefined item length at offset {fp.tell() - 4} when "
                    "parsing the encapsulated pixel data fragments"
                )
            yield fp.read(length)
        elif tag == 0xFFFEE0DD:
            # Sequence Delimiter
            # Behave nicely and rewind back to the end of the items
            fp.seek(-4, 1)
            break
        else:
            raise ValueError(
                f"Unexpected tag '{tag}' at offset {fp.tell() - 4} when "
                "parsing the encapsulated pixel data fragment items"
            )


def generate_pixel_data_frame(
    bytestream: bytes, nr_frames: Optional[int] = None
) -> Generator[bytes, None, None]:
    """Yield an encapsulated pixel data frame.

    Parameters
    ----------
    bytestream : bytes
        The value of the (7FE0,0010) *Pixel Data* element from an encapsulated
        dataset. The Basic Offset Table item should be present and the
        Sequence Delimiter item may or may not be present.
    nr_frames : int, optional
        Required for multi-frame data when the Basic Offset Table is empty
        and there are multiple frames. This should be the value of (0028,0008)
        *Number of Frames*.

    Yields
    ------
    bytes
        A frame contained in the encapsulated pixel data.

    References
    ----------
    DICOM Standard Part 5, :dcm:`Annex A <part05/chapter_A.html>`
    """
    for fragmented_frame in generate_pixel_data(bytestream, nr_frames):
        yield b''.join(fragmented_frame)


def generate_pixel_data(
    bytestream: bytes, nr_frames: Optional[int] = None
) -> Generator[Tuple[bytes, ...], None, None]:
    """Yield an encapsulated pixel data frame.

    For the following transfer syntaxes, a fragment may not contain encoded
    data from more than one frame. However data from one frame may span
    multiple fragments.

    * 1.2.840.10008.1.2.4.50 - JPEG Baseline (Process 1)
    * 1.2.840.10008.1.2.4.51 - JPEG Baseline (Process 2 and 4)
    * 1.2.840.10008.1.2.4.57 - JPEG Lossless, Non-Hierarchical (Process 14)
    * 1.2.840.10008.1.2.4.70 - JPEG Lossless, Non-Hierarchical, First-Order
      Prediction (Process 14 [Selection Value 1])
    * 1.2.840.10008.1.2.4.80 - JPEG-LS Lossless Image Compression
    * 1.2.840.10008.1.2.4.81 - JPEG-LS Lossy (Near-Lossless) Image Compression
    * 1.2.840.10008.1.2.4.90 - JPEG 2000 Image Compression (Lossless Only)
    * 1.2.840.10008.1.2.4.91 - JPEG 2000 Image Compression
    * 1.2.840.10008.1.2.4.92 - JPEG 2000 Part 2 Multi-component Image
      Compression (Lossless Only)
    * 1.2.840.10008.1.2.4.93 - JPEG 2000 Part 2 Multi-component Image
      Compression

    For the following transfer syntaxes, each frame shall be encoded in one and
    only one fragment.

    * 1.2.840.10008.1.2.5 - RLE Lossless

    Parameters
    ----------
    bytestream : bytes
        The value of the (7FE0,0010) *Pixel Data* element from an encapsulated
        dataset. The Basic Offset Table item should be present and the
        Sequence Delimiter item may or may not be present.
    nr_frames : int, optional
        Required for multi-frame data when the Basic Offset Table is empty
        and there are multiple frames. This should be the value of (0028,0008)
        *Number of Frames*.

    Yields
    -------
    tuple of bytes
        An encapsulated pixel data frame, with the contents of the
        :class:`tuple` the frame's fragmented data.

    Notes
    -----
    If the Basic Offset Table is empty and there are multiple fragments per
    frame then an attempt will be made to locate the frame boundaries by
    searching for the JPEG/JPEG-LS/JPEG2000 EOI/EOC marker (``0xFFD9``). If the
    marker is not present or the pixel data hasn't been compressed using one of
    the JPEG standards then the generated pixel data may be incorrect.

    References
    ----------
    DICOM Standard Part 5, :dcm:`Annex A <part05/chapter_A.html>`
    """
    fp = DicomBytesIO(bytestream)
    fp.is_little_endian = True

    # `offsets` is a list of the offsets to the first fragment in each frame
    has_bot, offsets = get_frame_offsets(fp)
    # Doesn't actually matter what the last offset value is, as long as its
    # greater than the total number of bytes in the fragments
    offsets.append(len(bytestream))

    if has_bot:
        # Use the BOT to determine the frame boundaries
        frame = []
        frame_length = 0
        frame_number = 0
        for fragment in generate_pixel_data_fragment(fp):
            if frame_length < offsets[frame_number + 1]:
                frame.append(fragment)
            else:
                yield tuple(frame)
                frame = [fragment]
                frame_number += 1

            frame_length += len(fragment) + 8

        # Yield the final frame - required here because the frame_length will
        # never be greater than offsets[-1] and thus never trigger the final
        # yield within the for block
        yield tuple(frame)
    else:
        nr_fragments = get_nr_fragments(fp)
        if nr_fragments == 1:
            # Single fragment: 1 frame
            for fragment in generate_pixel_data_fragment(fp):
                yield tuple([fragment])
        elif nr_frames:
            # Multiple fragments: 1 or more frames
            if nr_fragments == nr_frames:
                # 1 fragment per frame
                # Covers RLE and others if 1:1 ratio
                for fragment in generate_pixel_data_fragment(fp):
                    yield tuple([fragment])
            elif nr_frames == 1:
                # Multiple fragments: 1 frame
                frame = []
                for fragment in generate_pixel_data_fragment(fp):
                    frame.append(fragment)
                yield tuple(frame)
            elif nr_fragments > nr_frames:
                # More fragments then frames
                # Search for JPEG/JPEG-LS/JPEG2K EOI/EOC marker
                # Should be the last two bytes of a frame
                # May fail if no EOI/EOC marker or not JPEG
                eoi_marker = b'\xff\xd9'
                frame = []
                frame_nr = 0
                for fragment in generate_pixel_data_fragment(fp):
                    frame.append(fragment)
                    if eoi_marker in fragment[-10:]:
                        yield tuple(frame)
                        frame_nr += 1
                        frame = []

                if frame or frame_nr != nr_frames:
                    # If data in `frame` or fewer frames yielded then we
                    #   must've missed a frame boundary
                    warnings.warn(
                        "The end of the encapsulated pixel data has been "
                        "reached but one or more frame boundaries may have "
                        "been missed; please confirm that the generated frame "
                        "data is correct"
                    )
                    if frame:
                        yield tuple(frame)

            else:
                # Fewer fragments than frames
                raise ValueError(
                    "Unable to parse encapsulated pixel data as the Basic "
                    "Offset Table is empty and there are fewer fragments then "
                    "frames; the dataset may be corrupt"
                )
        else:
            # Multiple fragments but unknown number of frames
            raise ValueError(
                "Unable to determine the frame boundaries for the "
                "encapsulated pixel data as the Basic Offset Table is empty "
                "and `nr_frames` parameter is None"
            )


def decode_data_sequence(data: bytes) -> List[bytes]:
    """Read encapsulated data and return a list of bytes.

    Parameters
    ----------
    data : bytes
        The encapsulated data, typically the value from ``Dataset.PixelData``.

    Returns
    -------
    list of bytes
        All fragments as a list of ``bytes``.
    """
    # Convert data into a memory-mapped file
    with DicomBytesIO(data) as fp:

        # DICOM standard requires this
        fp.is_little_endian = True
        BasicOffsetTable = read_item(fp)  # NOQA
        seq = []

        while True:
            item = read_item(fp)

            # None is returned if get to Sequence Delimiter
            if not item:
                break
            seq.append(item)

        # XXX should
        return seq


def defragment_data(data: bytes) -> bytes:
    """Read encapsulated data and return the fragments as one continuous bytes.

    Parameters
    ----------
    data : bytes
        The encapsulated pixel data fragments.

    Returns
    -------
    bytes
        All fragments concatenated together.
    """
    return b"".join(decode_data_sequence(data))


# read_item modeled after filereader.ReadSequenceItem
def read_item(fp: DicomFileLike) -> Optional[bytes]:
    """Read and return a single Item in the fragmented data stream.

    Parameters
    ----------
    fp : filebase.DicomIO
        The file-like to read the item from.

    Returns
    -------
    bytes
        The Item's raw bytes.
    """

    logger = pydicom.config.logger
    try:
        tag = fp.read_tag()

    # already read delimiter before passing data here
    # so should just run out
    except EOFError:
        return None

    # No more items, time for sequence to stop reading
    if tag == SequenceDelimiterTag:
        length = fp.read_UL()
        logger.debug(
            "%04x: Sequence Delimiter, length 0x%x",
            fp.tell() - 8,
            length)

        if length != 0:
            logger.warning(
                "Expected 0x00000000 after delimiter, found 0x%x,"
                " at data position 0x%x",
                length,
                fp.tell() - 4)
        return None

    if tag != ItemTag:
        logger.warning(
            "Expected Item with tag %s at data position 0x%x",
            ItemTag,
            fp.tell() - 4)
        length = fp.read_UL()
    else:
        length = fp.read_UL()
        logger.debug(
            "%04x: Item, length 0x%x",
            fp.tell() - 8,
            length)

    if length == 0xFFFFFFFF:
        raise ValueError(
            "Encapsulated data fragment had Undefined Length"
            " at data position 0x%x" % (fp.tell() - 4, ))

    item_data = fp.read(length)
    return item_data


# Functions for encapsulating data
def fragment_frame(
    frame: bytes, nr_fragments: int = 1
) -> Generator[bytes, None, None]:
    """Yield one or more fragments from `frame`.

    .. versionadded:: 1.2

    Parameters
    ----------
    frame : bytes
        The data to fragment.
    nr_fragments : int, optional
        The number of fragments (default ``1``).

    Yields
    ------
    bytes
        The fragmented data, with all fragments as an even number of bytes
        greater than or equal to two.

    Notes
    -----

    * All items containing an encoded fragment shall be made of an even number
      of bytes greater than or equal to two.
    * The last fragment of a frame may be padded, if necessary to meet the
      sequence item format requirements of the DICOM Standard.
    * Any necessary padding may be appended after the end of image marker.
    * Encapsulated Pixel Data has the Value Representation OB.
    * Values with a VR of OB shall be padded with a single trailing NULL byte
      value (``0x00``) to achieve even length.

    References
    ----------
    DICOM Standard, Part 5, :dcm:`Section 6.2 <part05/sect_6.2.html>` and
    :dcm:`Annex A.4 <part05/sect_A.4.html>`
    """
    frame_length = len(frame)
    # Add 1 to fix odd length frames not being caught
    if nr_fragments > (frame_length + 1) / 2.0:
        raise ValueError(
            "Too many fragments requested (the minimum fragment size is "
            "2 bytes)"
        )

    length = int(frame_length / nr_fragments)

    # Each item shall be an even number of bytes
    if length % 2:
        length += 1

    # 1st to (N-1)th fragment
    for offset in range(0, length * (nr_fragments - 1), length):
        yield frame[offset:offset + length]

    # Nth fragment
    offset = length * (nr_fragments - 1)
    fragment = frame[offset:]

    # Pad last fragment if needed to make it even
    if (frame_length - offset) % 2:
        fragment += b'\x00'

    yield fragment


def itemize_fragment(fragment: bytes) -> bytes:
    """Return an itemized `fragment`.

    .. versionadded:: 1.2

    Parameters
    ----------
    fragment : bytes
        The fragment to itemize.

    Returns
    -------
    bytes
        The itemized fragment.

    Notes
    -----

    * The encoding of the item shall be in Little Endian.
    * Each fragment is encapsulated as a DICOM Item with tag (FFFE,E000), then
      a 4 byte length.
    """
    # item tag (fffe,e000)
    item = b'\xFE\xFF\x00\xE0'
    # fragment length '<I' little endian, 4 byte unsigned int
    item += pack('<I', len(fragment))
    # fragment data
    item += fragment

    return item


itemise_fragment = itemize_fragment


def itemize_frame(
    frame: bytes, nr_fragments: int = 1
) -> Generator[bytes, None, None]:
    """Yield items generated from `frame`.

    .. versionadded:: 1.2

    Parameters
    ----------
    frame : bytes
        The data to fragment and itemise.
    nr_fragments : int, optional
        The number of fragments/items (default 1).

    Yields
    ------
    bytes
        An itemized fragment of the frame, encoded as little endian.

    Notes
    -----

    * The encoding of the items shall be in Little Endian.
    * Each fragment is encapsulated as a DICOM Item with tag (FFFE,E000), then
      a 4 byte length.

    References
    ----------
    DICOM Standard, Part 5, :dcm:`Section 7.5 <part05/sect_7.5.html>` and
    :dcm:`Annex A.4 <part05/sect_A.4.html>`
    """
    for fragment in fragment_frame(frame, nr_fragments):
        yield itemize_fragment(fragment)


itemise_frame = itemize_frame


def encapsulate(
    frames: List[bytes], fragments_per_frame: int = 1, has_bot: bool = True
) -> bytes:
    """Return encapsulated `frames`.

    .. versionadded:: 1.2

    When using a compressed transfer syntax (such as RLE Lossless or one of
    JPEG formats) then any *Pixel Data* must be :dcm:`encapsulated
    <part05/sect_A.4.html>`::

      # Where `frame1`, `frame2` are single frames that have been encoded
      # using the corresponding compression method to Transfer Syntax UID
      ds.PixelData = encapsulate([frame1, frame2, ...])

    For multi-frame data each frame must be encoded separately and then all
    encoded frames encapsulated together.

    When many large frames are to be encapsulated, the total length of
    encapsulated data may exceed the maximum length available with the
    :dcm:`Basic Offset Table<part05/sect_A.4.html>` (2**31 - 1 bytes). Under
    these circumstances you can:

    * Pass ``has_bot=False`` to :func:`~pydicom.encaps.encapsulate`
    * Use :func:`~pydicom.encaps.encapsulate_extended` and add the
      :dcm:`Extended Offset Table<part03/sect_C.7.6.3.html>` elements to your
      dataset (recommended)

    Data will be encapsulated with a Basic Offset Table Item at the beginning,
    then one or more fragment items. Each item will be of even length and the
    final fragment of each frame may be padded with ``0x00`` if required.

    Parameters
    ----------
    frames : list of bytes
        The frame data to encapsulate, one frame per item.
    fragments_per_frame : int, optional
        The number of fragments to use for each frame (default ``1``).
    has_bot : bool, optional
        ``True`` to include values in the Basic Offset Table, ``False``
        otherwise (default ``True``). If `fragments_per_frame` is not ``1``
        then it's strongly recommended that this be ``True``.

    Returns
    -------
    bytes
        The encapsulated pixel data.

    References
    ----------
    DICOM Standard, Part 5, :dcm:`Section 7.5 <part05/sect_7.5.html>` and
    :dcm:`Annex A.4 <part05/sect_A.4.html>`

    See Also
    --------
    :func:`~pydicom.encaps.encapsulate_extended`
    """
    nr_frames = len(frames)
    output = bytearray()

    # Add the Basic Offset Table Item
    # Add the tag
    output.extend(b'\xFE\xFF\x00\xE0')
    if has_bot:
        # Check that the 2**32 - 1 limit in BOT item lengths won't be exceeded
        total = (nr_frames - 1) * 8 + sum([len(f) for f in frames[:-1]])
        if total > 2**32 - 1:
            raise ValueError(
                f"The total length of the encapsulated frame data ({total} "
                "bytes) will be greater than the maximum allowed by the Basic "
                f"Offset Table ({2**32 - 1} bytes), it's recommended that you "
                "use the Extended Offset Table instead (see the "
                "'encapsulate_extended' function for more information)"
            )

        # Add the length
        output.extend(pack('<I', 4 * nr_frames))
        # Reserve 4 x len(frames) bytes for the offsets
        output.extend(b'\xFF\xFF\xFF\xFF' * nr_frames)
    else:
        # Add the length
        output.extend(pack('<I', 0))

    bot_offsets = [0]
    for ii, frame in enumerate(frames):
        # `itemised_length` is the total length of each itemised frame
        itemised_length = 0
        for item in itemize_frame(frame, fragments_per_frame):
            itemised_length += len(item)
            output.extend(item)

        # Update the list of frame offsets
        bot_offsets.append(bot_offsets[ii] + itemised_length)

    if has_bot:
        # Go back and write the frame offsets - don't need the last offset
        output[8:8 + 4 * nr_frames] = pack(f"<{nr_frames}I", *bot_offsets[:-1])

    return bytes(output)


def encapsulate_extended(frames: List[bytes]) -> Tuple[bytes, bytes, bytes]:
    """Return encapsulated image data and values for the Extended Offset Table
    elements.

    When using a compressed transfer syntax (such as RLE Lossless or one of
    JPEG formats) then any *Pixel Data* must be :dcm:`encapsulated
    <part05/sect_A.4.html>`. When many large frames are to be encapsulated, the
    total length of encapsulated data may exceed the maximum length available
    with the :dcm:`Basic Offset Table<part05/sect_A.4.html>` (2**32 - 1 bytes).
    Under these circumstances you can:

    * Pass ``has_bot=False`` to :func:`~pydicom.encaps.encapsulate`
    * Use :func:`~pydicom.encaps.encapsulate_extended` and add the
      :dcm:`Extended Offset Table<part03/sect_C.7.6.3.html>` elements to your
      dataset (recommended)

    Examples
    --------

    .. code-block:: python

        from pydicom.encaps import encapsulate_extended

        # 'frames' is a list of image frames that have been each been encoded
        # separately using the compression method corresponding to the Transfer
        # Syntax UID
        frames: List[bytes] = [...]
        out: Tuple[bytes, bytes, bytes] = encapsulate_extended(frames)

        ds.PixelData = out[0]
        ds.ExtendedOffsetTable = out[1]
        ds.ExtendedOffsetTableLengths = out[2]

    Parameters
    ----------
    frames : list of bytes
        The compressed frame data to encapsulate, one frame per item.

    Returns
    -------
    bytes, bytes, bytes
        The (encapsulated frames, extended offset table, extended offset
        table lengths).

    See Also
    --------
    :func:`~pydicom.encaps.encapsulate`
    """
    nr_frames = len(frames)
    frame_lengths = [len(frame) for frame in frames]
    frame_offsets = [0]
    for ii, length in enumerate(frame_lengths[:-1]):
        # Extra 8 bytes for the Item tag and length
        frame_offsets.append(frame_offsets[ii] + length + 8)

    offsets = pack(f"<{nr_frames}Q", *frame_offsets)
    lengths = pack(f"<{nr_frames}Q", *frame_lengths)

    return encapsulate(frames, has_bot=False), offsets, lengths

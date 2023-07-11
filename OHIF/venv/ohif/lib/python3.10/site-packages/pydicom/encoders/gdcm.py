"""Interface for *Pixel Data* encoding, not intended to be used directly."""

from typing import Any, cast

from pydicom.uid import RLELossless

try:
    import gdcm
    HAVE_GDCM = True
except ImportError:
    HAVE_GDCM = False


ENCODER_DEPENDENCIES = {
    RLELossless: ('gdcm', ),
}


def is_available(uid: str) -> bool:
    """Return ``True`` if a pixel data encoder for `uid` is available for use,
    ``False`` otherwise.
    """
    if not HAVE_GDCM:
        return False

    return uid in ENCODER_DEPENDENCIES


def encode_pixel_data(src: bytes, **kwargs: Any) -> bytes:
    """Return the encoded image data in `src`.

    Parameters
    ----------
    src : bytes
        The raw image frame data to be encoded.
    **kwargs
        Required parameters:

        * `rows`: int
        * `columns`: int
        * `samples_per_pixel`: int
        * `number_of_frames`: int
        * `bits_allocated`: int
        * `bits_stored`: int
        * `pixel_representation`: int
        * `byteorder`: str
        * `transfer_syntax_uid`: pydicom.uid.UID

    Returns
    -------
    bytes
        The encoded image data.
    """
    if kwargs['byteorder'] != '<':
        raise ValueError(
            "Unsupported option for the 'gdcm' encoding plugin: "
            f"\"byteorder = '{kwargs['byteorder']}'\""
        )

    return _ENCODERS[kwargs['transfer_syntax_uid']](src, **kwargs)


def _rle_encode(src: bytes, **kwargs: Any) -> bytes:
    """Return RLE encoded image data from `src`.

    Parameters
    ----------
    src : bytes
        The raw image frame data to be encoded.
    **kwargs
        Required parameters:

        * `rows`: int
        * `columns`: int
        * `samples_per_pixel`: int
        * `number_of_frames`: int
        * `bits_allocated`: int
        * `bits_stored`: int
        * `pixel_representation`: int
        * `photometric_interpretation`: str

    Returns
    -------
    bytes
        The encoded image data.
    """
    # Check the parameters are valid for RLE encoding with GDCM
    rows = kwargs['rows']
    columns = kwargs['columns']
    samples_per_pixel = kwargs['samples_per_pixel']
    number_of_frames = kwargs['number_of_frames']
    pixel_representation = kwargs['pixel_representation']
    bits_allocated = kwargs['bits_allocated']
    bits_stored = kwargs['bits_stored']
    photometric_interpretation = kwargs['photometric_interpretation']

    # Bug up to v3.0.9 (Apr 2021) in handling 32-bit, 3 sample/px data
    gdcm_version = [int(c) for c in gdcm.Version.GetVersion().split('.')]
    if gdcm_version < [3, 0, 10]:
        if bits_allocated == 32 and samples_per_pixel == 3:
            raise RuntimeError(
                "The 'gdcm' plugin is unable to RLE encode 32-bit, 3 "
                "samples/px data with GDCM v3.0.9 or older"
            )

    if bits_allocated > 32:
        raise ValueError(
            f"The 'gdcm' plugin is unable to encode {bits_allocated}-bit data"
        )

    # Create a gdcm.Image with the uncompressed `src` data
    pi = gdcm.PhotometricInterpretation.GetPIType(
        photometric_interpretation
    )

    # GDCM's null photometric interpretation gets used for invalid values
    if pi == gdcm.PhotometricInterpretation.PI_END:
        raise ValueError(
            "An error occurred with the 'gdcm' plugin: invalid photometric "
            f"interpretation '{photometric_interpretation}'"
        )

    # `src` uses little-endian byte ordering
    ts = gdcm.TransferSyntax.ImplicitVRLittleEndian

    # Must use ImageWriter().GetImage() to create a gdcmImage
    #   also have to make sure `writer` doesn't go out of scope
    writer = gdcm.ImageWriter()
    image = writer.GetImage()
    image.SetNumberOfDimensions(2)
    image.SetDimensions((columns, rows, 1))
    image.SetPhotometricInterpretation(
        gdcm.PhotometricInterpretation(pi)
    )
    image.SetTransferSyntax(gdcm.TransferSyntax(ts))

    pixel_format = gdcm.PixelFormat(
        samples_per_pixel,
        bits_allocated,
        bits_stored,
        bits_stored - 1,
        pixel_representation
    )
    image.SetPixelFormat(pixel_format)
    if samples_per_pixel > 1:
        # Default `src` is planar configuration 0 (i.e. R1 G1 B1 R2 G2 B2)
        image.SetPlanarConfiguration(0)

    # Add the Pixel Data element and set the value to `src`
    elem = gdcm.DataElement(gdcm.Tag(0x7FE0, 0x0010))
    elem.SetByteStringValue(src)
    image.SetDataElement(elem)

    # Converts an image to match the set transfer syntax
    converter = gdcm.ImageChangeTransferSyntax()

    # Set up the converter with the intended transfer syntax...
    rle = gdcm.TransferSyntax.GetTSType(kwargs['transfer_syntax_uid'])
    converter.SetTransferSyntax(gdcm.TransferSyntax(rle))
    # ...and image to be converted
    converter.SetInput(image)

    # Perform the conversion, returns bool
    # 'PALETTE COLOR' and a lossy transfer syntax will return False
    result = converter.Change()
    if not result:
        raise RuntimeError(
            "An error occurred with the 'gdcm' plugin: "
            "ImageChangeTransferSyntax.Change() returned a failure result"
        )

    # A new gdcmImage with the converted pixel data element
    image = converter.GetOutput()

    # The element's value is the encapsulated encoded pixel data
    seq = image.GetDataElement().GetSequenceOfFragments()

    # RLECodec::Code() uses only 1 fragment per frame
    if seq is None or seq.GetNumberOfFragments() != 1:
        # Covers both no sequence and unexpected number of fragments
        raise RuntimeError(
            "An error occurred with the 'gdcm' plugin: unexpected number of "
            "fragments found in the 'Pixel Data'"
        )

    fragment = seq.GetFragment(0).GetByteValue().GetBuffer()
    return cast(bytes, fragment.encode("utf-8", "surrogateescape"))


_ENCODERS = {
    RLELossless: _rle_encode
}

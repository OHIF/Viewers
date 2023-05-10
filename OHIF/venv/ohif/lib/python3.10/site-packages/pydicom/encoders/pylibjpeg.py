# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Interface for *Pixel Data* encoding, not intended to be used directly."""

from typing import Any, cast

from pydicom.uid import RLELossless

try:
    from pylibjpeg.utils import get_pixel_data_encoders
    HAVE_PYLJ = True
except ImportError:
    HAVE_PYLJ = False


ENCODER_DEPENDENCIES = {
    RLELossless: ('numpy', 'pylibjpeg', 'pylibjpeg-rle'),
}


def encode_pixel_data(src: bytes, **kwargs: Any) -> bytes:
    """Return the encoded image data in `src`.

    Parameters
    ----------
    src : bytes
        The raw image frame data to be encoded.
    **kwargs
        Parameters to pass to the encoder function.

    Returns
    -------
    bytes
        The encoded image data.
    """
    encoder = get_pixel_data_encoders()[kwargs['transfer_syntax_uid']]

    return cast(bytes, encoder(src, **kwargs))


def is_available(uid: str) -> bool:
    """Return ``True`` if a pixel data encoder for `uid` is available for use,
    ``False`` otherwise.
    """
    if not HAVE_PYLJ:
        return False

    return uid in get_pixel_data_encoders()

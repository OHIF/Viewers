# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Bulk data encoding."""

from importlib import import_module
import sys
from typing import (
    Callable, Iterator, Tuple, List, Optional, Dict, Union, cast, Iterable,
    TYPE_CHECKING, Any
)

from pydicom.uid import (
    UID, JPEGBaseline8Bit, JPEGExtended12Bit, JPEGLosslessP14, JPEGLosslessSV1,
    JPEGLSLossless, JPEGLSNearLossless, JPEG2000Lossless, JPEG2000, RLELossless
)

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset, FileMetaDataset, FileDataset

try:
    import numpy
    import numpy as np
except ImportError:
    pass


class Encoder:
    """Factory class for data encoders.

    Every available ``Encoder`` instance in *pydicom* corresponds directly
    to a single DICOM *Transfer Syntax UID*, and provides a  mechanism for
    converting raw unencoded source data to meet the requirements of that
    transfer syntax using one or more :doc:`encoding plugins
    </guides/encoding/encoder_plugins>`.

    .. versionadded:: 2.2
    """
    def __init__(self, uid: UID) -> None:
        """Create a new data encoder.

        Parameters
        ----------
        uid : pydicom.uid.UID
            The *Transfer Syntax UID* that the encoder supports.
        """
        # The *Transfer Syntax UID* data will be encoded to
        self._uid = uid
        # Available encoding plugins
        self._available: Dict[str, Callable] = {}
        # Unavailable encoding plugins - missing dependencies or other reason
        self._unavailable: Dict[str, Tuple[str, ...]] = {}
        # Default encoding options
        self._defaults = {
            'transfer_syntax_uid': self.UID,  # Intended transfer syntax
            'byteorder': '<',  # Byte ordering of `src` passed to plugins
        }

    def add_plugin(self, label: str, import_path: Tuple[str, str]) -> None:
        """Add an encoding plugin to the encoder.

        The requirements for encoding plugins are available
        :doc:`here</guides/encoding/encoder_plugins>`.

        Parameters
        ----------
        label : str
            The label to use for the plugin, should be unique for the encoder.
        import_path : Tuple[str, str]
            The module import path and the encoding function's name (e.g.
            ``('pydicom.encoders.pylibjpeg', 'encode_pixel_data')``).

        Raises
        ------
        ModuleNotFoundError
            If the module import path is incorrect or unavailable.
        AttributeError
            If the plugin's encoding function, ``is_available()`` or
            ``ENCODER_DEPENDENCIES`` aren't found in the module.
        """
        if label in self._available or label in self._unavailable:
            raise ValueError(
                f"'{self.name}' already has a plugin named '{label}'"
            )

        module = import_module(import_path[0])

        # `is_available(UID)` is required for plugins
        if module.is_available(self.UID):
            self._available[label] = getattr(module, import_path[1])
        else:
            # `ENCODER_DEPENDENCIES[UID]` is required for plugins
            deps = module.ENCODER_DEPENDENCIES
            self._unavailable[label] = deps[self.UID]

    @staticmethod
    def _check_kwargs(kwargs: Dict[str, Union[int, str]]) -> None:
        """Raise TypeError if `kwargs` is missing required keys."""
        required_keys = [
            'rows', 'columns', 'samples_per_pixel', 'bits_allocated',
            'bits_stored', 'pixel_representation',
            'photometric_interpretation', 'number_of_frames'
        ]
        missing = [f"'{key}'" for key in required_keys if key not in kwargs]
        if missing:
            raise TypeError(
                f"Missing expected arguments: {', '.join(missing)}"
            )

    def encode(
        self,
        src: Union[bytes, "numpy.ndarray", "Dataset"],
        idx: Optional[int] = None,
        encoding_plugin: str = '',
        decoding_plugin: str = '',
        **kwargs: Any,
    ) -> bytes:
        """Return an encoded frame of the pixel data in `src` as
        :class:`bytes`.

        Parameters
        ----------
        src : bytes, numpy.ndarray or pydicom.dataset.Dataset
            Single or multi-frame pixel data as one of the following:

            * :class:`~numpy.ndarray`: the uncompressed pixel data, should be
              :attr:`shaped<numpy.ndarray.shape>` as:

              * (Rows, Columns) for single frame, single sample data.
              * (Rows, Columns, Samples) for single frame, multi-sample data.
              * (Frames, Rows, Columns) for multi-frame, single sample data.
              * (Frames, Rows, Columns, Samples) for multi-frame and
                multi-sample data.

            * :class:`~pydicom.dataset.Dataset`: the dataset containing
              the uncompressed *Pixel Data* to be encoded.
            * :class:`bytes`: the uncompressed little-endian ordered pixel
              data. Using ``bytes`` as the `src` will bypass some of the
              validation checks and is only recommended for advanced users.
        idx : int, optional
            Required when `src` contains multiple frames, this is the index
            of the frame to be encoded.
        encoding_plugin : str, optional
            The name of the pixel data encoding plugin to use. If
            `encoding_plugin` is not specified then all available
            plugins will be tried (default). For information on the available
            plugins for each encoder see the
            :mod:`API documentation<pydicom.encoders>`.
        decoding_plugin : str, optional
            Placeholder for future functionality.
        **kwargs
            The following keyword parameters are required when `src` is
            :class:`bytes` or :class:`~numpy.ndarray`:

            * ``'rows'``: :class:`int` - the number of rows of pixels in `src`,
              maximum 65535.
            * ``'columns'``: :class:`int` - the number of columns of pixels in
              `src`, maximum 65535.
            * ``'number_of_frames'``: :class:`int` - the number of frames
              in `src`.
            * ``'samples_per_pixel'``: :class:`int` - the number of samples
              per pixel in `src`, should be 1 or 3.
            * ``'bits_allocated'``: :class:`int` - the number of bits used
              to contain each pixel, should be a multiple of 8.
            * ``'bits_stored'``: :class:`int` - the number of bits actually
              used per pixel. For example, an ``ndarray`` `src` might have a
              :class:`~numpy.dtype` of ``'uint16'`` (range 0 to 65535) but
              only contain 12-bit pixel values (range 0 to 4095).
            * ``'pixel_representation'``: :class:`int` - the type of data
              being encoded, ``0`` for unsigned, ``1`` for 2's complement
              (signed)
            * ``'photometric_interpretation'``: :class:`str` - the intended
              color space of the *encoded* pixel data, such as ``'YBR_FULL'``.

            Optional keyword parameters for the encoding plugin may also be
            present. See the :doc:`encoding plugin options
            </guides/encoding/encoder_plugin_options>` for more information.

        Returns
        -------
        bytes
            The encoded pixel data.
        """
        from pydicom.dataset import Dataset

        if isinstance(src, Dataset):
            return self._encode_dataset(
                src, idx, encoding_plugin, decoding_plugin, **kwargs
            )

        if isinstance(src, np.ndarray):
            return self._encode_array(src, idx, encoding_plugin, **kwargs)

        if isinstance(src, bytes):
            return self._encode_bytes(src, idx, encoding_plugin, **kwargs)

        raise TypeError(
            "'src' must be bytes, numpy.ndarray or pydicom.dataset.Dataset, "
            f"not '{src.__class__.__name__}'"
        )

    def _encode_array(
        self,
        arr: "numpy.ndarray",
        idx: Optional[int] = None,
        encoding_plugin: str = '',
        **kwargs: Any,
    ) -> bytes:
        """Return a single encoded frame from `arr`."""
        self._check_kwargs(kwargs)

        if len(arr.shape) > 4:
            raise ValueError(f"Unable to encode {len(arr.shape)}D ndarrays")

        if kwargs.get('number_of_frames', 1) > 1 or len(arr.shape) == 4:
            if idx is None:
                raise ValueError(
                    "The frame 'idx' is required for multi-frame pixel data"
                )

            arr = arr[idx]

        src = self._preprocess(arr, **kwargs)
        return self._process(src, encoding_plugin, **kwargs)

    def _encode_bytes(
        self,
        src: bytes,
        idx: Optional[int] = None,
        encoding_plugin: str = '',
        **kwargs: Any,
    ) -> bytes:
        """Return a single encoded frame from `src`.

        Encoding :class:`bytes` will bypass a number of the validation checks.
        This is to allow advanced users to intentionally perform non-conformant
        encoding if they wish to do so.
        """
        self._check_kwargs(kwargs)

        rows: int = kwargs['rows']
        columns: int = kwargs['columns']
        samples_per_pixel: int = kwargs['samples_per_pixel']
        bits_allocated: int = kwargs['bits_allocated']
        bytes_allocated = bits_allocated // 8

        # Expected length of a single frame
        expected_len = rows * columns * samples_per_pixel * bytes_allocated
        whole_frames = len(src) // expected_len

        # Insufficient data
        if whole_frames == 0:
            raise ValueError(
                "Unable to encode as the actual length of the frame "
                f"({len(src)} bytes) is less than the expected length "
                f"of {expected_len} bytes"
            )

        # Single frame with matching length or with padding
        if whole_frames == 1:
            return self._process(
                src[:expected_len], plugin=encoding_plugin, **kwargs
            )

        # Multiple frames
        if idx is not None:
            frame_offset = idx * expected_len
            return self._process(
                src[frame_offset:frame_offset + expected_len],
                plugin=encoding_plugin,
                **kwargs
            )

        raise ValueError(
            "The frame 'idx' is required for multi-frame pixel data"
        )

    def _encode_dataset(
        self,
        ds: "Dataset",
        idx: Optional[int] = None,
        encoding_plugin: str = '',
        decoding_plugin: str = '',
        **kwargs: Any,
    ) -> bytes:
        """Return a single encoded frame from the *Pixel Data* in `ds`."""
        kwargs = {**self.kwargs_from_ds(ds), **kwargs}
        self._validate_encoding_profile(**kwargs)

        tsyntax = ds.file_meta.TransferSyntaxUID
        if not tsyntax.is_compressed:
            return self._encode_bytes(
                ds.PixelData, idx, encoding_plugin, **kwargs
            )

        # Pixel Data is compressed
        raise ValueError(
            "The dataset must be decompressed and correct 'Transfer "
            "Syntax UID' and 'Photometric Interpretation' values set before "
            "attempting to compress"
        )

        # Note that from this point on we require at least numpy be available
        # if decoding_plugin:
        #     ds.convert_pixel_data(handler_name=decoding_plugin)
        #
        # arr = ds.pixel_array
        #
        # if kwargs['number_of_frames'] > 1 or len(arr.shape) == 4:
        #     if idx is None:
        #         raise ValueError(
        #             "The frame 'idx' is required for multi-frame pixel data"
        #         )
        #
        #     arr = arr[idx]
        #
        # src = self._preprocess(arr, **kwargs)
        # return self._process(src, encoding_plugin, **kwargs)

    @property
    def is_available(self) -> bool:
        """Return ``True`` if the encoder has plugins available that can be
        used to encode data, ``False`` otherwise.
        """
        return bool(self._available)

    def iter_encode(
        self,
        src: Union[bytes, "numpy.ndarray", "Dataset"],
        encoding_plugin: str = '',
        decoding_plugin: str = '',
        **kwargs: Any,
    ) -> Iterator[bytes]:
        """Yield encoded frames of the pixel data in  `src` as :class:`bytes`.

        Parameters
        ----------
        src : bytes, numpy.ndarray or pydicom.dataset.Dataset
            Single or multi-frame pixel data as one of the following:

            * :class:`~numpy.ndarray`: the uncompressed pixel data, should be
              :attr:`shaped<numpy.ndarray.shape>` as:

              * (Rows, Columns) for single frame, single sample data.
              * (Rows, Columns, Samples) for single frame, multi-sample data.
              * (Frames, Rows, Columns) for multi-frame, single sample data.
              * (Frames, Rows, Columns, Samples) for multi-frame and
                multi-sample data.

            * :class:`~pydicom.dataset.Dataset`: the dataset containing
              the uncompressed *Pixel Data* to be encoded.
            * :class:`bytes`: the uncompressed little-endian ordered pixel
              data. Using ``bytes`` as the `src` will bypass some of the
              validation checks and is only recommended for advanced users.
        encoding_plugin : str, optional
            The name of the pixel data encoding plugin to use. If
            `encoding_plugin` is not specified then all available
            plugins will be tried (default). For information on the available
            plugins for each encoder see the
            :mod:`API documentation<pydicom.encoders>`.
        decoding_plugin : str, optional
            If `src` is a :class:`~pydicom.dataset.Dataset` containing
            compressed *Pixel Data* then this is the name of the
            :mod:`pixel data decoding handler<pydicom.pixel_data_handlers>`.
            If `decoding_plugin` is not specified then all available
            handlers will be tried (default).
        **kwargs
            The following keyword parameters are required when `src` is
            :class:`bytes` or :class:`~numpy.ndarray`:

            * ``'rows'``: :class:`int` - the number of rows of pixels in `src`,
              maximum 65535.
            * ``'columns'``: :class:`int` - the number of columns of pixels in
              `src`, maximum 65535.
            * ``'number_of_frames'``: :class:`int` - the number of frames
              in `src`.
            * ``'samples_per_pixel'``: :class:`int` - the number of samples
              per pixel in `src`, should be 1 or 3.
            * ``'bits_allocated'``: :class:`int` - the number of bits used
              to contain each pixel, should be a multiple of 8.
            * ``'bits_stored'``: :class:`int` - the number of bits actually
              used per pixel. For example, an ``ndarray`` `src` might have a
              :class:`~numpy.dtype` of ``'uint16'`` (range 0 to 65535) but
              only contain 12-bit pixel values (range 0 to 4095).
            * ``'pixel_representation'``: :class:`int` - the type of data
              being encoded, ``0`` for unsigned, ``1`` for 2's complement
              (signed)
            * ``'photometric_interpretation'``: :class:`str` - the intended
              color space of the encoded pixel data, such as ``'YBR_FULL'``.

            Optional keyword parameters for the encoding plugin may also be
            present. See the :doc:`encoding plugin options
            </guides/encoding/encoder_plugin_options>` for more information.

        Yields
        ------
        bytes
            An encoded frame of pixel data.
        """
        from pydicom.dataset import Dataset

        if isinstance(src, Dataset):
            nr_frames = cast(Optional[str], src.get('NumberOfFrames', 1))
            for idx in range(int(nr_frames or 1)):
                yield self._encode_dataset(
                    src, idx, encoding_plugin, decoding_plugin, **kwargs
                )
        elif isinstance(src, np.ndarray):
            for idx in range(kwargs.get('number_of_frames', 1)):
                yield self._encode_array(src, idx, encoding_plugin, **kwargs)
        elif isinstance(src, bytes):
            for idx in range(kwargs.get('number_of_frames', 1)):
                yield self._encode_bytes(src, idx, encoding_plugin, **kwargs)
        else:
            raise TypeError(
                "'src' must be bytes, numpy.ndarray or "
                f"pydicom.dataset.Dataset, not '{src.__class__.__name__}'"
            )

    @staticmethod
    def kwargs_from_ds(ds: "Dataset") -> Dict[str, Union[int, str]]:
        """Return a *kwargs* dict from `ds`.

        Parameters
        ----------
        ds : pydicom.dataset.Dataset
            The dataset to use as a source of keyword parameters.

        Returns
        -------
        Dict[str, Union[int, str]]
            A dict with the following keys, with values from the corresponding
            dataset elements:

            * ``'rows'``: :class:`int`
            * ``'columns'``: :class:`int`
            * ``'samples_per_pixel'``: :class:`int`
            * ``'number_of_frames'``: :class:`int`, default ``1`` if not
              present
            * ``'bits_allocated'``: :class:`int`
            * ``'bits_stored'``: :class:`int`
            * ``'pixel_representation'``: :class:`int`
            * ``'photometric_interpretation'``: :class:`str`
        """
        required = [
            "Rows", "Columns", "SamplesPerPixel", "BitsAllocated",
            "BitsStored", "PixelRepresentation", "PhotometricInterpretation"
        ]
        missing = [f"'{kw}'" for kw in required if kw not in ds]
        if missing:
            raise AttributeError(
                "The following required elements are missing from the "
                f"dataset: {', '.join(missing)}"
            )
        empty = [f"'{kw}'" for kw in required if ds[kw].VM == 0]
        if empty:
            raise AttributeError(
                "The following required dataset elements have a VM of 0: "
                f"{', '.join(empty)}"
            )

        rows = cast(int, ds.Rows)  # US
        columns = cast(int, ds.Columns)  # US
        samples_per_pixel = cast(int, ds.SamplesPerPixel)  # US
        bits_allocated = cast(int, ds.BitsAllocated)  # US
        bits_stored = cast(int, ds.BitsStored)  # US
        pixel_representation = cast(int, ds.PixelRepresentation)  # US
        # CS
        photometric_interpretation = cast(str, ds.PhotometricInterpretation)

        # IS, may be missing, None or "1", "2", ...
        nr_frames = cast(Optional[str], ds.get('NumberOfFrames', 1))

        return {
            'rows': rows,
            'columns': columns,
            'samples_per_pixel': samples_per_pixel,
            'number_of_frames': int(nr_frames or 1),
            'bits_allocated': bits_allocated,
            'bits_stored': bits_stored,
            'pixel_representation': pixel_representation,
            'photometric_interpretation': photometric_interpretation,
        }

    @property
    def missing_dependencies(self) -> List[str]:
        """Return nice strings for plugins with missing dependencies as
        List[str].
        """
        s = []
        for label, deps in self._unavailable.items():
            if not deps:
                # A plugin might have no dependencies and be unavailable for
                #   other reasons
                s.append(f"{label} - plugin indicating it is unavailable")
            elif len(deps) > 1:
                s.append(
                    f"{label} - requires {', '.join(deps[:-1])} and {deps[-1]}"
                )
            else:
                s.append(f"{label} - requires {deps[0]}")

        return s

    @property
    def name(self) -> str:
        """Return the name of the encoder as :class:`str`."""
        return f"{self.UID.keyword}Encoder"

    def _preprocess(self, arr: "numpy.ndarray", **kwargs: Any) -> bytes:
        """Preprocess `arr` before encoding to ensure it meets requirements.

        `arr` will be checked against the required keys in `kwargs` before
        being converted to little-endian ordered bytes.

        UID specific validation will also be performed to ensure `kwargs` meets
        the requirements of Section 8 of Part 5 of the DICOM Standard.

        Note that this pre-processing only occurs when an
        :class:`~numpy.ndarray`  or :class:`~pydicom.dataset.Dataset` are
        passed to ``encode`` or ``iter_encode``. This is a deliberate decision
        to allow advanced users to bypass these restrictions by using
        :class:`bytes` as a `src`.

        Parameters
        ----------
        arr : numpy.ndarray
            A single frame of uncompressed pixel data. Should be shaped as
            (Rows, Columns) or (Rows, Columns, Samples) or the corresponding
            1D array.
        **kwargs
            Required parameters:

            * `rows`: int
            * `columns`: int
            * `samples_per_pixel`: int
            * `number_of_frames`: int
            * `bits_allocated`: int
            * `bits_stored`: int
            * `pixel_representation`: int

        Returns
        -------
        bytes
            The pixel data in `arr` converted to little-endian ordered bytes.
        """
        rows: int = kwargs['rows']
        cols: int = kwargs['columns']
        samples_per_pixel: int = kwargs['samples_per_pixel']
        bits_allocated: int = kwargs['bits_allocated']
        bytes_allocated = bits_allocated // 8
        bits_stored: int = kwargs['bits_stored']
        pixel_repr: int = kwargs['pixel_representation']

        shape = arr.shape
        dims = len(shape)
        dtype = arr.dtype

        # Ensure *Samples per Pixel* value is supported
        if samples_per_pixel not in (1, 3):
            raise ValueError(
                "Unable to encode as a samples per pixel value of "
                f"{samples_per_pixel} is not supported (must be 1 or 3)"
            )

        # Check shape/length of `arr` matches
        valid_shapes = {
            1: (rows * cols * samples_per_pixel, ),
            2: (rows, cols),
            3: (rows, cols, samples_per_pixel),
        }

        if valid_shapes[dims] != shape:
            raise ValueError(
                f"Unable to encode as the shape of the ndarray {shape} "
                "doesn't match the values for the rows, columns and samples "
                "per pixel"
            )

        if samples_per_pixel > 1 and dims == 2:
            raise ValueError(
                f"Unable to encode as the shape of the ndarray {shape} "
                "is not consistent with a samples per pixel value of 3"
            )

        ui = [
            np.issubdtype(dtype, np.unsignedinteger),
            np.issubdtype(dtype, np.signedinteger)
        ]
        if not any(ui):
            raise ValueError(
                f"Unable to encode as the ndarray's dtype '{dtype}' is "
                "not supported"
            )

        # Check *Pixel Representation* is consistent with `arr`
        if not ui[pixel_repr]:
            s = ['unsigned', 'signed'][pixel_repr]
            raise ValueError(
                f"Unable to encode as the ndarray's dtype '{dtype}' is "
                f"not consistent with pixel representation '{pixel_repr}' "
                f"({s} int)"
            )

        # Checks for *Bits Allocated*
        if bits_allocated % 8:
            raise ValueError(
                "Unable to encode as a bits allocated value of "
                f"{bits_allocated} is not supported (must be a multiple of 8)"
            )

        if bytes_allocated != dtype.itemsize:
            raise ValueError(
                f"Unable to encode as the ndarray's dtype '{dtype}' is "
                "not consistent with a bits allocated value of "
                f"{bits_allocated}"
            )

        if bits_allocated < bits_stored:
            raise ValueError(
                "Unable to encode as the bits stored value is greater than "
                "the bits allocated value"
            )

        # UID specific validation based on Section 8 of Part 5
        self._validate_encoding_profile(**kwargs)

        # Convert the array to the required byte order (little-endian)
        sys_endianness = '<' if sys.byteorder == 'little' else '>'
        # `byteorder` may be
        #   '|': none available, such as for 8 bit -> ignore
        #   '=': native system endianness -> change to '<' or '>'
        #   '<' or '>': little or big
        byteorder = dtype.byteorder
        byteorder = sys_endianness if byteorder == '=' else byteorder
        if byteorder == '>':
            arr = arr.astype(dtype.newbyteorder('<'))

        return cast(bytes, arr.tobytes())

    def _process(
        self,
        src: bytes,
        plugin: str = '',
        **kwargs: Any,
    ) -> bytes:
        """Return an encoded frame from `src` as :class:`bytes`.

        Parameters
        ----------
        src : bytes
            A single uncompressed frame of little-endian ordered pixel data.
        plugin : str, optional
            The name of the encoding plugin to use. If not specified then all
            available plugins will be tried.
        **kwargs
            Required parameters:

            * ``'rows'``: :class:`int`
            * ``'columns'``: :class:`int`
            * ``'number_of_frames'``: :class:`int`
            * ``'samples_per_pixel'``: :class:`int`
            * ``'bits_allocated'``: :class:`int`
            * ``'bits_stored'``: :class:`int`
            * ``'pixel_representation'``: :class:`int`
            * ``'photometric_interpretation'``: :class:`str`

            May also contain optional parameters for the encoding function.

        Returns
        ------
        bytes
            The encoded pixel data frame.
        """
        if not self.is_available:
            missing = "\n".join(
                [f"    {s}" for s in self.missing_dependencies]
            )
            raise RuntimeError(
                f"Unable to encode because the encoding plugins are missing "
                f"dependencies:\n{missing}"
            )

        all_plugins = (
            list(self._unavailable.keys()) + list(self._available.keys())
        )
        if plugin and plugin not in all_plugins:
            raise ValueError(
                f"No plugin named '{plugin}' has been added to the "
                f"'{self.name}'"
            )

        if plugin and plugin in self._unavailable:
            deps = self._unavailable[plugin]
            missing = deps[0]
            if len(deps) > 1:
                missing = f"{', '.join(deps[:-1])} and {deps[-1]}"
            raise RuntimeError(
                f"Unable to encode with the '{plugin}' encoding plugin "
                f"because it's missing dependencies - requires {missing}"
            )

        # Add our defaults, but don't override existing options
        kwargs = {**self._defaults, **kwargs}

        if plugin:
            # Try specific encoder
            try:
                return cast(bytes, self._available[plugin](src, **kwargs))
            except Exception as exc:
                raise RuntimeError(
                    "Unable to encode as an exception was raised by the "
                    f"'{plugin}' plugin's encoding function"
                ) from exc

        # Try all available encoders
        failure_messages: List[str] = []
        for name, func in self._available.items():
            try:
                return cast(bytes, func(src, **kwargs))
            except Exception as exc:
                failure_messages.append(f"{name}: {str(exc)}")

        messages = '\n  '.join(failure_messages)
        raise RuntimeError(
            "Unable to encode as exceptions were raised by all the "
            f"available plugins:\n  {messages}"
        )

    def remove_plugin(self, label: str) -> None:
        """Remove a plugin from the encoder.

        Parameters
        ----------
        label : str
            The label of the plugin to remove.
        """
        if label in self._available:
            del self._available[label]
        elif label in self._unavailable:
            del self._unavailable[label]
        else:
            raise ValueError(f"Unable to remove '{label}', no such plugin'")

    @property
    def UID(self) -> UID:
        """Return the encoder's corresponding *Transfer Syntax UID* as
        :class:`~pydicom.uid.UID`.
        """
        return self._uid

    def _validate_encoding_profile(self, **kwargs: Any) -> None:
        """Perform  UID specific validation of encoding parameters based on
        Part 5, Section 8 of the DICOM Standard.

        Encoding profiles should be:

        Tuple[str, int, Iterable[int], Iterable[int], Iterable[int]] as
        (
            PhotometricInterpretation, SamplesPerPixel, PixelRepresentation,
            BitsAllocated, BitsStored
        )
        """
        if self.UID not in ENCODING_PROFILES:
            return

        # Test each profile and see if it matches `kwargs`
        for (pi, spp, px_repr, bits_a, bits_s) in ENCODING_PROFILES[self.UID]:
            try:
                assert kwargs['photometric_interpretation'] == pi
                assert kwargs['samples_per_pixel'] == spp
                assert kwargs['pixel_representation'] in px_repr
                assert kwargs['bits_allocated'] in bits_a
                assert kwargs['bits_stored'] in bits_s
            except AssertionError as exc:
                continue

            return

        raise ValueError(
            "Unable to encode as one or more of 'photometric interpretation', "
            "'samples per pixel', 'bits allocated', 'bits stored' or "
            f"'pixel representation' is not valid for '{self.UID.name}'"
        )


# UID: [
#   Photometric Interpretation (the intended value *after* encoding),
#   Samples per Pixel,
#   Pixel Representation,
#   Bits Allocated,
#   Bits Stored,
# ]
ProfileType = Tuple[str, int, Iterable[int], Iterable[int], Iterable[int]]
ENCODING_PROFILES: Dict[UID, List[ProfileType]] = {
    JPEGBaseline8Bit: [  # 1.2.840.10008.1.2.4.50: Table 8.2.1-1 in PS3.5
        ("MONOCHROME1", 1, (0, ), (8, ), (8, )),
        ("MONOCHROME2", 1, (0, ), (8, ), (8, )),
        ("YBR_FULL_422", 3, (0, ), (8, ), (8, )),
        ("RGB", 3, (0, ), (8, ), (8, )),
    ],
    JPEGExtended12Bit: [  # 1.2.840.10008.1.2.4.51: Table 8.2.1-1 in PS3.5
        ("MONOCHROME1", 1, (0, ), (8, ), (8, )),
        ("MONOCHROME1", 1, (0, ), (16, ), (12, )),
        ("MONOCHROME2", 1, (0, ), (8, ), (8, )),
        ("MONOCHROME2", 1, (0, ), (16, ), (12, )),
    ],
    JPEGLosslessP14: [  # 1.2.840.10008.1.2.4.57: Table 8.2.1-2 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16), range(1, 17)),
        ("MONOCHROME2", 1, (0, 1), (8, 16), range(1, 17)),
        ("PALETTE COLOR", 1, (0, ), (8, 16), range(1, 17)),
        ("YBR_FULL", 3, (0, ), (8, 16), range(1, 17)),
        ("RGB", 3, (0, ), (8, 16), range(1, 17)),
    ],
    JPEGLosslessSV1: [  # 1.2.840.10008.1.2.4.70: Table 8.2.1-2 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16), range(1, 17)),
        ("MONOCHROME2", 1, (0, 1), (8, 16), range(1, 17)),
        ("PALETTE COLOR", 1, (0, ), (8, 16), range(1, 17)),
        ("YBR_FULL", 3, (0, ), (8, 16), range(1, 17)),
        ("RGB", 3, (0, ), (8, 16), range(1, 17)),
    ],
    JPEGLSLossless: [  # 1.2.840.10008.1.2.4.80: Table 8.2.3-1 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16), range(2, 17)),
        ("MONOCHROME2", 1, (0, 1), (8, 16), range(2, 17)),
        ("PALETTE COLOR", 1, (0, ), (8, 16), range(2, 17)),
        ("YBR_FULL", 3, (0, ), (8, ), range(2, 9)),
        ("RGB", 3, (0, ), (8, 16), range(2, 17)),
    ],
    JPEGLSNearLossless: [  # 1.2.840.10008.1.2.4.81: Table 8.2.3-1 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16), range(2, 17)),
        ("MONOCHROME2", 1, (0, 1), (8, 16), range(2, 17)),
        ("YBR_FULL", 3, (0, ), (8, ), range(2, 9)),
        ("RGB", 3, (0, ), (8, 16), range(2, 17)),
    ],
    JPEG2000Lossless: [  # 1.2.840.10008.1.2.4.90: Table 8.2.4-1 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16, 24, 32, 40), range(1, 39)),
        ("MONOCHROME2", 1, (0, 1), (8, 16, 24, 32, 40), range(1, 39)),
        ("PALETTE COLOR", 1, (0, ), (8, 16), range(1, 17)),
        ("YBR_RCT", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
        ("RGB", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
        ("YBR_FULL", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
    ],
    JPEG2000: [  # 1.2.840.10008.1.2.4.91: Table 8.2.4-1 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16, 24, 32, 40), range(1, 39)),
        ("MONOCHROME2", 1, (0, 1), (8, 16, 24, 32, 40), range(1, 39)),
        ("YBR_RCT", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
        ("YBR_ICT", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
        ("RGB", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
        ("YBR_FULL", 3, (0, ), (8, 16, 24, 32, 40), range(1, 39)),
    ],
    RLELossless: [  # 1.2.840.10008.1.2.5: Table 8.2.2-1 in PS3.5
        ("MONOCHROME1", 1, (0, 1), (8, 16), range(1, 17)),
        ("MONOCHROME2", 1, (0, 1), (8, 16), range(1, 17)),
        ("PALETTE COLOR", 1, (0, ), (8, 16), range(1, 17)),
        ("YBR_FULL", 3, (0, ), (8, ), range(1, 9)),
        ("RGB", 3, (0, ), (8, 16), range(1, 17)),
    ],
}

# Encoder names should be f"{UID.keyword}Encoder"
RLELosslessEncoder = Encoder(RLELossless)
RLELosslessEncoder.add_plugin(
    'gdcm', ('pydicom.encoders.gdcm', 'encode_pixel_data'),
)
RLELosslessEncoder.add_plugin(
    'pylibjpeg', ('pydicom.encoders.pylibjpeg', 'encode_pixel_data'),
)
RLELosslessEncoder.add_plugin(
    'pydicom', ('pydicom.encoders.native', '_encode_frame'),
)


# Available pixel data encoders
_PIXEL_DATA_ENCODERS = {
    # UID: (encoder, 'versionadded')
    RLELossless: (RLELosslessEncoder, '2.2'),
}


def _build_encoder_docstrings() -> None:
    """Override the default Encoder docstring."""
    plugin_doc_links = {
        'pydicom': ":ref:`pydicom <encoder_plugin_pydicom>`",
        'pylibjpeg': ":ref:`pylibjpeg <encoder_plugin_pylibjpeg>`",
        'gdcm': ":ref:`gdcm <encoder_plugin_gdcm>`",
    }

    for enc, versionadded in _PIXEL_DATA_ENCODERS.values():
        uid = enc.UID
        available = enc._available.keys()
        unavailable = enc._unavailable.keys()
        plugins = list(available) + list(unavailable)

        plugins = [plugin_doc_links[name] for name in sorted(plugins)]

        s = [f"A *Pixel Data* encoder for *{uid.name}* - ``{uid}``"]
        s.append("")
        s.append(f".. versionadded:: {versionadded}")
        s.append("")
        s.append(f"Encoding plugins: {', '.join(plugins)}")
        s.append("")
        s.append(
            "See the :class:`~pydicom.encoders.base.Encoder` "
            "reference for instance methods and attributes."
        )
        enc.__doc__ = "\n".join(s)


_build_encoder_docstrings()


def get_encoder(uid: str) -> Encoder:
    """Return the pixel data encoder corresponding to `uid`.

    .. versionadded:: 2.2

    +-----------------------------------------------+--------------------+
    | Transfer Syntax                               | Version added      |
    +----------------------+------------------------+                    +
    | Name                 | UID                    |                    |
    +======================+========================+====================+
    | *RLE Lossless*       | 1.2.840.10008.1.2.5    | 2.2                |
    +----------------------+------------------------+--------------------+
    """
    uid = UID(uid)
    try:
        return _PIXEL_DATA_ENCODERS[uid][0]
    except KeyError:
        raise NotImplementedError(
            f"No pixel data encoders have been implemented for '{uid.name}'"
        )

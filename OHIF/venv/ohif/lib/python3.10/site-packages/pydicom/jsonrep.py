# Copyright 2008-2021 pydicom authors. See LICENSE file for details.
"""Methods for converting Datasets and DataElements to/from json"""

import base64
from inspect import signature
from typing import (
    Callable, Optional, Union, Any, cast, Type, Dict, TYPE_CHECKING,
    List
)
import warnings

from pydicom.valuerep import FLOAT_VR, INT_VR, VR

if TYPE_CHECKING:  # pragma: no cover
    from pydicom.dataset import Dataset


JSON_VALUE_KEYS = ('Value', 'BulkDataURI', 'InlineBinary')


def convert_to_python_number(value: Any, vr: str) -> Any:
    """When possible convert numeric-like values to either ints or floats
    based on their value representation.

    .. versionadded:: 1.4

    Parameters
    ----------
    value : Any
        Value of the data element.
    vr : str
        Value representation of the data element.

    Returns
    -------
    Any

        * If `value` is empty then returns the `value` unchanged.
        * If `vr` is an integer-like VR type then returns ``int`` or
          ``List[int]``
        * If `vr` is a float-like VR type then returns ``float`` or
          ``List[float]``
        * Otherwise returns `value` unchanged

    """
    from pydicom.dataelem import empty_value_for_VR

    if value is None or "":
        return value

    number_type: Optional[Union[Type[int], Type[float]]] = None
    if vr in (INT_VR - {VR.AT}) | {VR.US_SS}:
        number_type = int
    if vr in FLOAT_VR:
        number_type = float

    if number_type is None:
        return value

    if isinstance(value, (list, tuple)):
        return [
            number_type(v) if v is not None
            else empty_value_for_VR(vr)
            for v in value
        ]

    return number_type(value)


OtherValueType = Union[None, str, int, float]
PNValueType = Union[None, str, Dict[str, str]]
SQValueType = Optional[Dict[str, Any]]  # Recursive

ValueType = Union[PNValueType, SQValueType, OtherValueType]
InlineBinaryType = Union[str, List[str]]
BulkDataURIType = Union[str, List[str]]

JSONValueType = Union[List[ValueType], InlineBinaryType, BulkDataURIType]

BulkDataType = Union[None, str, int, float, bytes]
BulkDataHandlerType = Optional[Callable[[str, str, str], BulkDataType]]


class JsonDataElementConverter:
    """Convert from a JSON struct to a :class:`DataElement`.

    .. versionadded:: 1.4

    References
    ----------

    * :dcm:`Annex F of Part 18 of the DICOM Standard<part18/chapter_F.html>`
    * `JSON to Python object conversion table
      <https://docs.python.org/3/library/json.html#json-to-py-table>`_
    """

    def __init__(
        self,
        dataset_class: Type["Dataset"],
        tag: str,
        vr: str,
        value: JSONValueType,
        value_key: Optional[str],
        bulk_data_uri_handler: Optional[
            Union[BulkDataHandlerType, Callable[[str], BulkDataType]]
        ] = None
    ) -> None:
        """Create a new converter instance.

        Parameters
        ----------
        dataset_class : dataset.Dataset derived class
            The class object to use for **SQ** element items.
        tag : str
            The data element's tag in uppercase hex format like ``"7FE00010"``.
        vr : str
            The data element value representation.
        value : str or List[Union[None, str, int, float, dict]]
            The attribute value for the JSON object's "Value", "InlineBinary"
            or "BulkDataURI" field. If there's no such attribute then `value`
            will be ``[""]``.
        value_key : str or None
            The attribute name for `value`, should be one of:
            ``{"Value", "InlineBinary", "BulkDataURI"}``. If the element's VM
            is ``0`` and none of the keys are used then will be ``None``.
        bulk_data_uri_handler: callable, optional
            Callable function that accepts either the `tag`, `vr` and the
            "BulkDataURI" `value`, or just the "BulkDataURI" `value` of the
            JSON representation of a data element and returns the actual
            value of that data element (retrieved via DICOMweb WADO-RS). If
            no `bulk_data_uri_handler` is specified (default) then the
            corresponding element will have an "empty" value such as
            ``""``, ``b""`` or ``None`` depending on the
            `vr` (i.e. the Value Multiplicity will be 0).
        """
        self.dataset_class = dataset_class
        self.tag = tag
        self.vr = vr
        self.value = value
        self.value_key = value_key
        self.bulk_data_element_handler: BulkDataHandlerType

        handler = bulk_data_uri_handler
        if handler and len(signature(handler).parameters) == 1:
            # `handler` is Callable[[str], BulkDataType]
            def wrapper(tag: str, vr: str, value: str) -> BulkDataType:
                x = cast(Callable[[str], BulkDataType], handler)
                return x(value)

            self.bulk_data_element_handler = wrapper
        else:
            self.bulk_data_element_handler = cast(BulkDataHandlerType, handler)

    def get_element_values(self) -> Any:
        """Return a the data element value or list of values.

        Returns
        -------
        None, str, float, int, bytes, dataset_class or a list of these
            The value or value list of the newly created data element.
        """
        from pydicom.dataelem import empty_value_for_VR

        # An attribute with an empty value should have no "Value",
        #   "BulkDataURI" or "InlineBinary"
        if self.value_key is None:
            return empty_value_for_VR(self.vr)

        if self.value_key == 'Value':
            if not isinstance(self.value, list):
                raise TypeError(
                    f"'{self.value_key}' of data element '{self.tag}' must "
                    "be a list"
                )

            if not self.value:
                return empty_value_for_VR(self.vr)

            val = cast(List[ValueType], self.value)
            element_value = [self.get_regular_element_value(v) for v in val]
            if len(element_value) == 1 and self.vr != VR.SQ:
                element_value = element_value[0]

            return convert_to_python_number(element_value, self.vr)

        # The value for "InlineBinary" shall be encoded as a base64 encoded
        # string, as shown in PS3.18, Table F.3.1-1, but the example in
        # PS3.18, Annex F.4 shows the string enclosed in a list.
        # We support both variants, as the standard is ambiguous here,
        # and do the same for "BulkDataURI".
        value = cast(Union[str, List[str]], self.value)
        if isinstance(value, list):
            value = value[0]

        if self.value_key == 'InlineBinary':
            # The `value` should be a base64 encoded str
            if not isinstance(value, str):
                raise TypeError(
                    f"Invalid attribute value for data element '{self.tag}' - "
                    "the value for 'InlineBinary' must be str, not "
                    f"{type(value).__name__}"
                )

            return base64.b64decode(value)  # bytes

        if self.value_key == 'BulkDataURI':
            # The `value` should be a URI as a str
            if not isinstance(value, str):
                raise TypeError(
                    f"Invalid attribute value for data element '{self.tag}' - "
                    "the value for 'BulkDataURI' must be str, not "
                    f"{type(value).__name__}"
                )

            if self.bulk_data_element_handler is None:
                warnings.warn(
                    'No bulk data URI handler provided for retrieval '
                    f'of value of data element "{self.tag}"'
                )
                return empty_value_for_VR(self.vr)

            return self.bulk_data_element_handler(self.tag, self.vr, value)

        raise ValueError(
            f"Unknown attribute name '{self.value_key}' for tag {self.tag}"
        )

    def get_regular_element_value(self, value: ValueType) -> Any:
        """Return a the data element value created from a json "Value" entry.

        Parameters
        ----------
        value : None, str, int, float or dict
            The data element's value from the json entry.

        Returns
        -------
        None, str, int, float or Dataset
            A single value of the corresponding :class:`DataElement`.
        """
        from pydicom.dataelem import empty_value_for_VR

        # Table F.2.3-1 has JSON type mappings
        if self.vr == VR.SQ:  # Dataset
            # May be an empty dict
            value = cast(Dict[str, Any], value)
            return self.get_sequence_item(value)

        if value is None:
            return empty_value_for_VR(self.vr)

        if self.vr == VR.PN:  # str
            value = cast(Dict[str, str], value)
            return self.get_pn_element_value(value)

        if self.vr == VR.AT:  # Optional[int]
            # May be an empty str
            value = cast(str, value)
            try:
                return int(value, 16)
            except ValueError:
                warnings.warn(
                    f"Invalid value '{value}' for AT element - ignoring it"
                )

            return None

        return value

    def get_sequence_item(self, value: SQValueType) -> "Dataset":
        """Return a sequence item for the JSON dict `value`.

        Parameters
        ----------
        value : dict or None
            The sequence item from the JSON entry.

        Returns
        -------
        dataset_class
            The decoded dataset item.

        Raises
        ------
        KeyError
            If the "vr" key is missing for a contained element
        """
        from pydicom import DataElement
        from pydicom.dataelem import empty_value_for_VR

        ds = self.dataset_class()

        value = {} if value is None else value
        for key, val in value.items():
            if 'vr' not in val:
                raise KeyError(
                    f"Data element '{self.tag}' must have key 'vr'"
                )

            vr = val['vr']
            unique_value_keys = tuple(
                set(val.keys()) & set(JSON_VALUE_KEYS)
            )

            if not unique_value_keys:
                # data element with no value
                elem = DataElement(
                    tag=int(key, 16),
                    value=empty_value_for_VR(vr),
                    VR=vr
                )
            else:
                value_key = unique_value_keys[0]
                elem = DataElement.from_json(
                    self.dataset_class,
                    key,
                    vr,
                    val[value_key],
                    value_key,
                    self.bulk_data_element_handler
                )
            ds.add(elem)

        return ds

    def get_pn_element_value(self, value: Union[str, Dict[str, str]]) -> str:
        """Return a person name from JSON **PN** value as str.

        Values with VR PN have a special JSON encoding, see the DICOM Standard,
        Part 18, :dcm:`Annex F.2.2<part18/sect_F.2.2.html>`.

        Parameters
        ----------
        value : Dict[str, str]
            The person name components in the JSON entry.

        Returns
        -------
        str
            The decoded PersonName object or an empty string.
        """
        if not isinstance(value, dict):
            # Some DICOMweb services get this wrong, so we
            # workaround the issue and warn the user
            # rather than raising an error.
            warnings.warn(
                f"Value of data element '{self.tag}' with VR Person Name (PN) "
                "is not formatted correctly"
            )
            return value

        if 'Phonetic' in value:
            comps = ['', '', '']
        elif 'Ideographic' in value:
            comps = ['', '']
        else:
            comps = ['']

        if 'Alphabetic' in value:
            comps[0] = value['Alphabetic']
        if 'Ideographic' in value:
            comps[1] = value['Ideographic']
        if 'Phonetic' in value:
            comps[2] = value['Phonetic']

        return '='.join(comps)

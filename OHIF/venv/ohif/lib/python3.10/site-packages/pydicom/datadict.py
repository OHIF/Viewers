# Copyright 2008-2018 pydicom authors. See LICENSE file for details.
# -*- coding: utf-8 -*-
"""Access dicom dictionary information"""

from typing import Tuple, Optional, Dict

from pydicom.config import logger
from pydicom.tag import Tag, BaseTag, TagType

# the actual dict of {tag: (VR, VM, name, is_retired, keyword), ...}
from pydicom._dicom_dict import DicomDictionary

# those with tags like "(50xx, 0005)"
from pydicom._dicom_dict import RepeatersDictionary
from pydicom._private_dict import private_dictionaries


# Generate mask dict for checking repeating groups etc.
# Map a true bitwise mask to the DICOM mask with "x"'s in it.
masks: Dict[str, Tuple[int, int]] = {}
for mask_x in RepeatersDictionary:
    # mask1 is XOR'd to see that all non-"x" bits
    # are identical (XOR result = 0 if bits same)
    # then AND those out with 0 bits at the "x"
    # ("we don't care") location using mask2
    mask1 = int(mask_x.replace("x", "0"), 16)
    mask2 = int("".join(["F0"[c == "x"] for c in mask_x]), 16)
    masks[mask_x] = (mask1, mask2)


def mask_match(tag: int) -> Optional[str]:
    """Return the repeaters tag mask for `tag`.

    Parameters
    ----------
    tag : int
        The tag to check.

    Returns
    -------
    str or None
        If the tag is in the repeaters dictionary then returns the
        corresponding masked tag, otherwise returns ``None``.
    """
    for mask_x, (mask1, mask2) in masks.items():
        if (tag ^ mask1) & mask2 == 0:
            return mask_x
    return None


def add_dict_entry(
    tag: int,
    VR: str,
    keyword: str,
    description: str,
    VM: str = '1',
    is_retired: str = ''
) -> None:
    """Update the DICOM dictionary with a new non-private entry.

    Parameters
    ----------
    tag : int
        The tag number for the new dictionary entry.
    VR : str
        DICOM value representation.
    description : str
        The descriptive name used in printing the entry. Often the same as the
        keyword, but with spaces between words.
    VM : str, optional
        DICOM value multiplicity. If not specified, then ``'1'`` is used.
    is_retired : str, optional
        Usually leave as blank string (default). Set to ``'Retired'`` if is a
        retired data element.

    Raises
    ------
    ValueError
        If the tag is a private tag.

    Notes
    -----
    Does not permanently update the dictionary, but only during run-time.
    Will replace an existing entry if the tag already exists in the dictionary.

    See Also
    --------
    pydicom.examples.add_dict_entry
        Example file which shows how to use this function
    add_dict_entries
        Update multiple values at once.

    Examples
    --------

    >>> from pydicom import Dataset
    >>> add_dict_entry(0x10021001, "UL", "TestOne", "Test One")
    >>> add_dict_entry(0x10021002, "DS", "TestTwo", "Test Two", VM='3')
    >>> ds = Dataset()
    >>> ds.TestOne = 'test'
    >>> ds.TestTwo = ['1', '2', '3']

    """
    add_dict_entries({tag: (VR, VM, description, is_retired, keyword)})


def add_dict_entries(
    new_entries_dict: Dict[int, Tuple[str, str, str, str, str]]
) -> None:
    """Update the DICOM dictionary with new non-private entries.

    Parameters
    ----------
    new_entries_dict : dict
        :class:`dict` of form:
        ``{tag: (VR, VM, description, is_retired, keyword), ...}``
        where parameters are as described in :func:`add_dict_entry`.

    Raises
    ------
    ValueError
        If one of the entries is a private tag.

    See Also
    --------
    add_dict_entry
        Add a single entry to the dictionary.

    Examples
    --------

    >>> from pydicom import Dataset
    >>> new_dict_items = {
    ...        0x10021001: ('UL', '1', "Test One", '', 'TestOne'),
    ...        0x10021002: ('DS', '3', "Test Two", '', 'TestTwo'),
    ... }
    >>> add_dict_entries(new_dict_items)
    >>> ds = Dataset()
    >>> ds.TestOne = 'test'
    >>> ds.TestTwo = ['1', '2', '3']

    """

    if any([BaseTag(tag).is_private for tag in new_entries_dict]):
        raise ValueError(
            'Private tags cannot be added using "add_dict_entries" - '
            'use "add_private_dict_entries" instead')

    # Update the dictionary itself
    DicomDictionary.update(new_entries_dict)

    # Update the reverse mapping from name to tag
    keyword_dict.update({val[4]: tag for tag, val in new_entries_dict.items()})


def add_private_dict_entry(
    private_creator: str, tag: int, VR: str, description: str, VM: str = '1'
) -> None:
    """Update the private DICOM dictionary with a new entry.

    .. versionadded:: 1.3

    Parameters
    ----------
    private_creator : str
        The private creator for the new entry.
    tag : int
        The tag number for the new dictionary entry. Note that the
        2 high bytes of the element part of the tag are ignored.
    VR : str
        DICOM value representation.
    description : str
        The descriptive name used in printing the entry.
    VM : str, optional
        DICOM value multiplicity. If not specified, then ``'1'`` is used.

    Raises
    ------
    ValueError
        If the tag is a non-private tag.

    Notes
    -----
    Behaves like :func:`add_dict_entry`, only for a private tag entry.

    See Also
    --------
    add_private_dict_entries
        Add or update multiple entries at once.
    """
    new_dict_val = (VR, VM, description, '')
    add_private_dict_entries(private_creator, {tag: new_dict_val})


def add_private_dict_entries(
    private_creator: str,
    new_entries_dict: Dict[int, Tuple[str, str, str, str]]
) -> None:
    """Update pydicom's private DICOM tag dictionary with new entries.

    .. versionadded:: 1.3

    Parameters
    ----------
    private_creator: str
        The private creator for all entries in `new_entries_dict`.
    new_entries_dict : dict
        :class:`dict` of form ``{tag: (VR, VM, description, is_retired), ...}``
        where parameters are as described in :func:`add_private_dict_entry`.

    Raises
    ------
    ValueError
        If one of the entries is a non-private tag.

    See Also
    --------
    add_private_dict_entry
        Function to add a single entry to the private tag dictionary.

    Examples
    --------
    >>> new_dict_items = {
    ...        0x00410001: ('UL', '1', "Test One"),
    ...        0x00410002: ('DS', '3', "Test Two", '3'),
    ... }
    >>> add_private_dict_entries("ACME LTD 1.2", new_dict_items)
    >>> add_private_dict_entry("ACME LTD 1.3", 0x00410001, "US", "Test Three")
    """

    if not all([BaseTag(tag).is_private for tag in new_entries_dict]):
        raise ValueError(
            "Non-private tags cannot be added using "
            "'add_private_dict_entries()' - use 'add_dict_entries()' instead"
        )

    new_entries = {
        f"{tag >> 16:04x}xx{tag & 0xff:02x}": value
        for tag, value in new_entries_dict.items()
    }
    private_dictionaries.setdefault(private_creator, {}).update(new_entries)


def get_entry(tag: TagType) -> Tuple[str, str, str, str, str]:
    """Return an entry from the DICOM dictionary as a tuple.

    If the `tag` is not in the main DICOM dictionary, then the repeating
    group dictionary will also be checked.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose entry is to be retrieved, in any of the
        forms accepted by :func:`~pydicom.tag.Tag`. Only entries in the
        official DICOM dictionary will be checked, not entries in the
        private dictionary.

    Returns
    -------
    tuple of str
        The (VR, VM, name, is_retired, keyword) from the DICOM dictionary.

    Raises
    ------
    KeyError
        If the tag is not present in the DICOM data dictionary.

    See Also
    --------
    get_private_entry
        Return an entry from the private dictionary.
    """
    # Note: tried the lookup with 'if tag in DicomDictionary'
    # and with DicomDictionary.get, instead of try/except
    # Try/except was fastest using timeit if tag is valid (usual case)
    # My test had 5.2 usec vs 8.2 for 'contains' test, vs 5.32 for dict.get
    if not isinstance(tag, BaseTag):
        tag = Tag(tag)
    try:
        return DicomDictionary[tag]
    except KeyError:
        if not tag.is_private:
            mask_x = mask_match(tag)
            if mask_x:
                return RepeatersDictionary[mask_x]
        raise KeyError(f"Tag {tag} not found in DICOM dictionary")


def dictionary_is_retired(tag: TagType) -> bool:
    """Return ``True`` if the element corresponding to `tag` is retired.

    Only performs the lookup for official DICOM elements.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose retirement status is being checked, in
        any of the forms accepted by :func:`~pydicom.tag.Tag`.

    Returns
    -------
    bool
        ``True`` if the element's retirement status is 'Retired', ``False``
        otherwise.

    Raises
    ------
    KeyError
        If the tag is not present in the DICOM data dictionary.
    """
    return 'retired' in get_entry(tag)[3].lower()


def dictionary_VR(tag: TagType) -> str:
    """Return the VR of the element corresponding to `tag`.

    Only performs the lookup for official DICOM elements.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose value representation (VR) is being
        retrieved, in any of the forms accepted by :func:`~pydicom.tag.Tag`.

    Returns
    -------
    str
        The VR of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the DICOM data dictionary.
    """
    return get_entry(tag)[0]


def dictionary_VM(tag: TagType) -> str:
    """Return the VM of the element corresponding to `tag`.

    Only performs the lookup for official DICOM elements.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose value multiplicity (VM) is being
        retrieved, in any of the forms accepted by :func:`~pydicom.tag.Tag`.

    Returns
    -------
    str
        The VM of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the DICOM data dictionary.
    """
    return get_entry(tag)[1]


def dictionary_description(tag: TagType) -> str:
    """Return the description of the element corresponding to `tag`.

    Only performs the lookup for official DICOM elements.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose description is being retrieved, in any
        of the forms accepted by :func:`~pydicom.tag.Tag`.

    Returns
    -------
    str
        The description of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the DICOM data dictionary.
    """
    return get_entry(tag)[2]


def dictionary_keyword(tag: TagType) -> str:
    """Return the keyword of the element corresponding to `tag`.

    Only performs the lookup for official DICOM elements.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose keyword is being retrieved, in any of
        the forms accepted by :func:`~pydicom.tag.Tag`.

    Returns
    -------
    str
        The keyword of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the DICOM data dictionary.
    """
    return get_entry(tag)[4]


def dictionary_has_tag(tag: TagType) -> bool:
    """Return ``True`` if `tag` is in the official DICOM data dictionary.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag to check, in any of the forms accepted by
        :func:`~pydicom.tag.Tag`.

    Returns
    -------
    bool
        ``True`` if the tag corresponds to an element present in the official
        DICOM data dictionary, ``False`` otherwise.
    """
    try:
        return Tag(tag) in DicomDictionary
    except Exception:
        return False


def keyword_for_tag(tag: TagType) -> str:
    """Return the keyword of the element corresponding to `tag`.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose keyword is being retrieved, in any of
        the forms accepted by :func:`~pydicom.tag.Tag`.

    Returns
    -------
    str
        If the element is in the DICOM data dictionary then returns the
        corresponding element's keyword, otherwise returns ``''``. For
        group length elements will always return ``'GroupLength'``.
    """
    try:
        return dictionary_keyword(tag)
    except KeyError:
        return ""


# Provide for the 'reverse' lookup. Given the keyword, what is the tag?
keyword_dict: Dict[str, int] = {
    dictionary_keyword(tag): tag for tag in DicomDictionary
}


def tag_for_keyword(keyword: str) -> Optional[int]:
    """Return the tag of the element corresponding to `keyword`.

    Only performs the lookup for official DICOM elements.

    Parameters
    ----------
    keyword : str
        The keyword for the element whose tag is being retrieved.

    Returns
    -------
    int or None
        If the element is in the DICOM data dictionary then returns the
        corresponding element's tag, otherwise returns ``None``.
    """
    return keyword_dict.get(keyword)


def repeater_has_tag(tag: int) -> bool:
    """Return ``True`` if `tag` is in the DICOM repeaters data dictionary.

    Parameters
    ----------
    tag : int
        The tag to check.

    Returns
    -------
    bool
        ``True`` if the tag is a non-private element tag present in the
        official DICOM repeaters data dictionary, ``False`` otherwise.
    """
    return (mask_match(tag) in RepeatersDictionary)


REPEATER_KEYWORDS = [val[4] for val in RepeatersDictionary.values()]


def repeater_has_keyword(keyword: str) -> bool:
    """Return ``True`` if `keyword` is in the DICOM repeaters data dictionary.

    Parameters
    ----------
    keyword : str
        The keyword to check.

    Returns
    -------
    bool
        ``True`` if the keyword corresponding to an element present in the
        official DICOM repeaters data dictionary, ``False`` otherwise.
    """
    return keyword in REPEATER_KEYWORDS


# PRIVATE DICTIONARY handling
# functions in analogy with those of main DICOM dict
def get_private_entry(
    tag: TagType, private_creator: str
) -> Tuple[str, str, str, str]:
    """Return an entry from the private dictionary corresponding to `tag`.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose entry is to be retrieved, in any of the
        forms accepted by :func:`~pydicom.tag.Tag`. Only entries in the
        private dictionary will be checked.
    private_creator : str
        The name of the private creator.

    Returns
    -------
    tuple of str
        The (VR, VM, name, is_retired) from the private dictionary.

    Raises
    ------
    KeyError
        If the tag or private creator is not present in the private dictionary.

    See Also
    --------
    get_entry
        Return an entry from the DICOM data dictionary.
    """
    if not isinstance(tag, BaseTag):
        tag = Tag(tag)

    try:
        private_dict = private_dictionaries[private_creator]
    except KeyError as exc:
        raise KeyError(
            f"Private creator '{private_creator}' not in the private "
            "dictionary"
        ) from exc

    # private elements are usually agnostic for
    # "block" (see PS3.5-2008 7.8.1 p44)
    # Some elements in _private_dict are explicit;
    # most have "xx" for high-byte of element
    #  so here put in the "xx" in the block position for key to look up
    group_str = f"{tag.group:04x}"
    elem_str = f"{tag.elem:04x}"
    keys = [
        f"{group_str}{elem_str}",
        f"{group_str}xx{elem_str[-2:]}",
        f"{group_str[:2]}xxxx{elem_str[-2:]}"
    ]
    keys = [k for k in keys if k in private_dict]
    if not keys:
        raise KeyError(
            f"Tag '{tag}' not in private dictionary "
            f"for private creator '{private_creator}'"
        )
    dict_entry = private_dict[keys[0]]

    return dict_entry


def private_dictionary_VR(tag: TagType, private_creator: str) -> str:
    """Return the VR of the private element corresponding to `tag`.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose value representation (VR) is being
        retrieved, in any of the forms accepted by :func:`~pydicom.tag.Tag`.
    private_creator : str
        The name of the private creator.

    Returns
    -------
    str
        The VR of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the private dictionary.
    """
    return get_private_entry(tag, private_creator)[0]


def private_dictionary_VM(tag: TagType, private_creator: str) -> str:
    """Return the VM of the private element corresponding to `tag`.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose value multiplicity (VM) is being
        retrieved, in any of the forms accepted by :func:`~pydicom.tag.Tag`.
    private_creator : str
        The name of the private creator.

    Returns
    -------
    str
        The VM of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the private dictionary.
    """
    return get_private_entry(tag, private_creator)[1]


def private_dictionary_description(tag: TagType, private_creator: str) -> str:
    """Return the description of the private element corresponding to `tag`.

    Parameters
    ----------
    tag : int or str or Tuple[int, int]
        The tag for the element whose description is being retrieved, in any
        of the forms accepted by :func:`~pydicom.tag.Tag`.
    private_creator : str
        The name of the private createor.

    Returns
    -------
    str
        The description of the corresponding element.

    Raises
    ------
    KeyError
        If the tag is not present in the private dictionary.
    """
    return get_private_entry(tag, private_creator)[2]

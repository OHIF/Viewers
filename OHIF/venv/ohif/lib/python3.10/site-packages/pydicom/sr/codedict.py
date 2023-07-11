# Copyright 2008-2019 pydicom authors. See LICENSE file for details.
# -*- coding: utf-8 -*-
"""Access code dictionary information"""

from itertools import chain
import inspect
from typing import List, Optional, Tuple, KeysView, Iterable, Dict, cast, Union

from pydicom.sr.coding import Code
from pydicom.sr._concepts_dict import concepts as CONCEPTS
from pydicom.sr._cid_dict import name_for_cid, cid_concepts as CID_CONCEPTS


# Reverse lookup for cid names
cid_for_name = {v: k for k, v in name_for_cid.items()}


def _filtered(source: Iterable[str], filters: Iterable[str]) -> List[str]:
    """Return a sorted list of filtered str.

    Parameters
    ----------
    source : Iterable[str]
        The iterable of str to be filtered.
    filters : Iterable[str]
        An iterable containing patterns for which values are to be included
        in the results.

    Returns
    -------
    List[str]
        A sorted list of unique values from `source`, filtered by including
        case-insensitive partial or full matches against the values
        in `filters`.
    """
    if not filters:
        return sorted(set(source))

    filters = [f.lower() for f in filters]

    return sorted(
        set(
            val for val in source
            if any((f in val.lower()) for f in filters)
        )
    )


ConceptsType = Dict[str, Dict[str, Dict[str, Tuple[str, List[int]]]]]
SnomedMappingType = Dict[str, Dict[str, str]]


class _CID_Dict:
    repr_format = "{} = {}"
    str_format = "{:20} {:12} {:8} {}\n"

    def __init__(self, cid: int) -> None:
        self.cid = cid
        self._concepts: Dict[str, Code] = {}

    def __dir__(self) -> List[str]:
        """Gives a list of available SR identifiers.

        List of attributes is used, for example, in auto-completion in editors
        or command-line environments.
        """
        meths = {
            v[0] for v in inspect.getmembers(type(self), inspect.isroutine)
        }
        props = {
            v[0]
            for v in inspect.getmembers(type(self), inspect.isdatadescriptor)
        }
        sr_names = set(self.dir())

        return sorted(props | meths | sr_names)

    def __getattr__(self, name: str) -> Code:
        """Return the ``Code`` for class attribute `name`."""
        matches = [
            scheme
            for scheme, keywords in CID_CONCEPTS[self.cid].items()
            if name in keywords
        ]

        if not matches:
            raise AttributeError(
                f"'{name}' not found in CID {self.cid}"
            )

        if len(matches) > 1:
            # Should never happen, but just in case
            raise AttributeError(
                f"Multiple schemes found for '{name}' in CID {self.cid}: "
                f"{', '.join(matches)}"
            )

        scheme = matches[0]
        identifiers = cast(
            Dict[str, Tuple[str, List[int]]], CONCEPTS[scheme][name]
        )
        # Almost always only one code per identifier
        if len(identifiers) == 1:
            code, val = list(identifiers.items())[0]
        else:
            _matches = [
                (code, val) for code, val in identifiers.items()
                if self.cid in val[1]
            ]
            if len(_matches) > 1:
                # Rare, but multiple codes may end up with the same identifier
                # See CID 12300 for example
                codes = ", ".join([f"'{v[0]}'" for v in _matches])
                raise AttributeError(
                    f"'{name}' has multiple code matches in CID {self.cid}: "
                    f"{codes}"
                )

            code, val = _matches[0]

        return Code(value=code, meaning=val[0], scheme_designator=scheme)

    @property
    def concepts(self) -> Dict[str, Code]:
        """Return a dict of {SR identifiers: codes}"""
        if not self._concepts:
            self._concepts = {name: getattr(self, name) for name in self.dir()}

        return self._concepts

    def __repr__(self) -> str:
        concepts = [
            self.repr_format.format(name, concept)
            for name, concept in self.concepts.items()
        ]

        return f"CID {self.cid}\n" + "\n".join(concepts)

    def __str__(self) -> str:
        """Return a str representation of the instance."""
        s = [f"CID {self.cid} ({name_for_cid[self.cid]})"]
        s.append(
            self.str_format.format(
                "Attribute", "Code value", "Scheme", "Meaning"
            )
        )
        s.append(
            self.str_format.format(
                "---------", "----------", "------", "-------"
            )
        )
        s.append(
            "\n".join(
                self.str_format.format(name, *concept)
                for name, concept in self.concepts.items()
            )
        )

        return "\n".join(s)

    def dir(self, *filters: str) -> List[str]:
        """Return an sorted list of SR identifiers based on a partial
        match.

        Parameters
        ----------
        filters : str
            Zero or more string arguments to the function. Used for
            case-insensitive match to any part of the SR keyword.

        Returns
        -------
        list of str
            The matching SR keywords. If no `filters` are used then all
            keywords are returned.
        """
        # CID_CONCEPTS: Dict[int, Dict[str, List[str]]]
        return _filtered(
            chain.from_iterable(CID_CONCEPTS[self.cid].values()),
            filters,
        )

    def __contains__(self, code: Code) -> bool:
        """Checks whether a given code is a member of the context group.

        Parameters
        ----------
        code: Union[pydicom.sr.coding.Code, pydicom.sr.coding.CodedConcept]
            coded concept

        Returns
        -------
        bool
            whether CID contains `code`
        """
        return any([concept == code for concept in self.concepts.values()])

    def trait_names(self) -> List[str]:
        """Returns a list of valid names for auto-completion code.
        Used in IPython, so that data element names can be found and offered
        for autocompletion on the IPython command line.
        """
        return dir(self)


class _CodesDict:
    """Interface for a concepts dictionary.

    Examples
    --------
    >>> from pydicom.sr import codes
    >>> code = codes.SCT.Deep
    >>> code.value
    '795002'
    >>> code.meaning
    'Deep'
    >>> code == codes.CID2.Deep  # Or use the CID instead
    True
    >>> code = codes.SCT.FontanelOfSkull
    >>> code.value
    '79361005'
    >>> code.meaning
    'Fontanel of skull'
    """
    def __init__(self, scheme: Optional[str] = None) -> None:
        """Create a new CodesDict.

        Parameters
        ----------
        scheme : str, optional
            The if used, then the scheme designator for the concepts
            dictionary.
        """
        self.scheme = scheme
        self._dict = {scheme: CONCEPTS[scheme]} if scheme else CONCEPTS

    def __dir__(self) -> List[str]:
        """Gives a list of available SR identifiers.

        List of attributes is used, for example, in auto-completion in editors
        or command-line environments.
        """
        meths = {
            v[0] for v in inspect.getmembers(type(self), inspect.isroutine)
        }
        props = {
            v[0]
            for v in inspect.getmembers(type(self), inspect.isdatadescriptor)
        }
        sr_names = set(self.dir())

        return sorted(props | meths | sr_names)

    def __getattr__(self, name: str) -> Union["_CodesDict", _CID_Dict, Code]:
        """Return either a ``_CodesDict``, ``_CID_Dict`` or ``Code`` depending
        on the `name`.

        Parameters
        ----------
        name : str
            One of the following:

            * A coding scheme designator such as ``"SCT"``.
            * A concept ID such as ``"CID2"``.
            * If ``_CodesDict.scheme`` is not ``None``, a camel case version
              of the concept's code meaning, such as ``"FontanelOfSkull" in
              the SCT coding scheme.

        Returns
        -------
        pydicom.sr._CodesDict, pydicom.sr._CID_Dict or pydicom.sr.Code

            * If `name` is a concept ID then the ``_CID_Dict`` for the
              corresponding CID.
            * If `name` is a coding scheme designator then the ``_CodesDict``
              instance for the corresponding scheme.
            * If ``_CodesDict.scheme`` is not ``None`` then the ``Code``
              corresponding to `name`.
        """
        # for codes.X, X must be a CID or a scheme designator
        if name.startswith("cid"):
            if not self.scheme:
                return _CID_Dict(int(name[3:]))

            raise AttributeError("Cannot use a CID with a scheme dictionary")

        if name in self._dict.keys():
            # Return concepts limited only the specified scheme designator
            return _CodesDict(scheme=name)

        # If not already narrowed to a particular scheme, is an error
        if not self.scheme:
            raise AttributeError(
                f"'{name}' not recognized as a CID or scheme designator"
            )

        # else try to find in this scheme
        try:
            val = cast(
                Dict[str, Tuple[str, List[int]]],
                self._dict[self.scheme][name]
            )
        except KeyError:
            raise AttributeError(
                f"Unknown code name '{name}' for scheme '{self.scheme}'"
            )

        if len(val) > 1:
            # val is {code value: (meaning, cid_list}, code_value: ...}
            code_values = ", ".join(val.keys())
            raise RuntimeError(
                f"Multiple code values for '{name}' found: {code_values}"
            )

        code = list(val.keys())[0]  # get first and only
        meaning, cids = val[code]

        return Code(value=code, meaning=meaning, scheme_designator=self.scheme)

    def dir(self, *filters: str) -> List[str]:
        """Returns an alphabetical list of SR identifiers based on a partial
        match.

        Intended mainly for use in interactive Python sessions.

        Parameters
        ----------
        filters : str
            Zero or more string arguments to the function. Used for
            case-insensitive match to any part of the SR keyword.

        Returns
        -------
        list of str
            The matching SR keywords. If no filters are
            used then all keywords are returned.

        """
        return _filtered(chain.from_iterable(self._dict.values()), filters)

    def schemes(self) -> KeysView[str]:
        return self._dict.keys()

    def trait_names(self) -> List[str]:
        """Returns a list of valid names for auto-completion code.

        Used in IPython, so that data element names can be found and offered
        for autocompletion on the IPython command line.

        """
        return dir(self)


codes = _CodesDict()

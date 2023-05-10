# Copyright 2008-2020 pydicom authors. See LICENSE file for details.
"""Code for multi-value data elements values,
or any list of items that must all be the same type.
"""

from typing import (
    Iterable, Union, List, overload, Callable, Any, cast,
    TypeVar, MutableSequence, Iterator
)

from pydicom import config

_T = TypeVar("_T")
_ItemType = TypeVar("_ItemType")


class MultiValue(MutableSequence[_ItemType]):
    """Class to hold any multi-valued DICOM value, or any list of items that
    are all of the same type.

    This class enforces that any items added to the list are of the correct
    type, by calling the constructor on any items that are added. Therefore,
    the constructor must behave nicely if passed an object that is already its
    type. The constructor should raise :class:`TypeError` if the item cannot be
    converted.

    Note, however, that DS and IS types can be a blank string ``''`` rather
    than an instance of their classes.
    """

    def __init__(
        self,
        type_constructor: Callable[[_T], _ItemType],
        iterable: Iterable[_T],
        validation_mode: int = None
    ) -> None:
        """Create a new :class:`MultiValue` from an iterable and ensure each
        item in the :class:`MultiValue` has the same type.

        Parameters
        ----------
        type_constructor : callable
            A constructor for the required type for all items. Could be
            the class, or a factory function. Takes a single parameter and
            returns the input as the desired type (or raises an appropriate
            exception).
        iterable : iterable
            An iterable (e.g. :class:`list`, :class:`tuple`) of items to
            initialize the :class:`MultiValue` list. Each item in the iterable
            is passed to `type_constructor` and the returned value added to
            the :class:`MultiValue`.
        """
        from pydicom.valuerep import DSfloat, DSdecimal, IS

        def DS_IS_constructor(x: _T) -> _ItemType:
            return (  # type: ignore[no-any-return]
                self.type_constructor(  # type: ignore[has-type]
                    x, validation_mode=validation_mode)
                if x != '' else cast(_ItemType, x)
            )

        if validation_mode is None:
            validation_mode = config.settings.reading_validation_mode
        self._list: List[_ItemType] = list()
        self.type_constructor = type_constructor
        if type_constructor in (DSfloat, IS, DSdecimal):
            type_constructor = DS_IS_constructor

        for x in iterable:
            self._list.append(type_constructor(x))

    def append(self, val: _T) -> None:
        self._list.append(self.type_constructor(val))

    def __delitem__(self, index: Union[slice, int]) -> None:
        del self._list[index]

    def extend(self, val: Iterable[_T]) -> None:
        """Extend the :class:`~pydicom.multival.MultiValue` using an iterable
        of objects.
        """
        self._list.extend([self.type_constructor(x) for x in val])

    def __iadd__(  # type: ignore[override]
            self, other: Iterable[_T]
    ) -> MutableSequence[_ItemType]:
        """Implement MultiValue() += Iterable[Any]."""
        self._list += [self.type_constructor(x) for x in other]
        return self

    def __eq__(self, other: Any) -> Any:
        return self._list == other

    @overload
    def __getitem__(self, index: int) -> _ItemType: pass  # pragma: no cover

    @overload
    def __getitem__(self, index: slice) -> MutableSequence[_ItemType]:
        pass  # pragma: no cover

    def __getitem__(
        self, index: Union[slice, int]
    ) -> Union[MutableSequence[_ItemType], _ItemType]:
        return self._list[index]

    def insert(self, position: int, val: _T) -> None:
        self._list.insert(position, self.type_constructor(val))

    def __iter__(self) -> Iterator[_ItemType]:
        yield from self._list

    def __len__(self) -> int:
        return len(self._list)

    def __ne__(self, other: Any) -> Any:
        return self._list != other

    @overload
    def __setitem__(self, idx: int, val: _T) -> None: pass  # pragma: no cover

    @overload
    def __setitem__(self, idx: slice, val: Iterable[_T]) -> None:
        pass  # pragma: no cover

    def __setitem__(  # type: ignore[misc]
        self, idx: Union[int, slice], val: Union[_T, Iterable[_T]]
    ) -> None:
        """Set an item of the list, making sure it is of the right VR type"""
        if isinstance(idx, slice):
            val = cast(Iterable[_T], val)
            out = [self.type_constructor(v) for v in val]
            self._list.__setitem__(idx, out)
        else:
            val = cast(_T, val)
            self._list.__setitem__(idx, self.type_constructor(val))

    def sort(self, *args: Any, **kwargs: Any) -> None:
        self._list.sort(*args, **kwargs)

    def __str__(self) -> str:
        if not self:
            return ''
        lines = (
            f"{x!r}" if isinstance(x, (str, bytes)) else str(x) for x in self
        )
        return f"[{', '.join(lines)}]"

    __repr__ = __str__

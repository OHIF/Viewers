# Copyright 2008-2021 pydicom authors. See LICENSE file for details.

from typing import NamedTuple, Any, Optional

from pydicom.sr._snomed_dict import mapping as snomed_mapping


class Code(NamedTuple):
    """Namedtuple for representation of a coded concept consisting of the
    actual code *value*, the coding *scheme designator*, the code *meaning*
    (and optionally the coding *scheme version*).

    ..versionadded: 1.4
    """
    value: str
    scheme_designator: str
    meaning: str
    scheme_version: Optional[str] = None

    def __hash__(self) -> int:
        return hash(self.scheme_designator + self.value)

    def __eq__(self, other: Any) -> Any:
        if self.scheme_designator == "SRT":
            self_mapped = Code(
                value=snomed_mapping["SRT"][self.value],
                meaning="",
                scheme_designator="SCT",
                scheme_version=self.scheme_version,
            )
        else:
            self_mapped = Code(
                value=self.value,
                meaning="",
                scheme_designator=self.scheme_designator,
                scheme_version=self.scheme_version,
            )

        if other.scheme_designator == "SRT":
            other_mapped = Code(
                value=snomed_mapping["SRT"][other.value],
                meaning="",
                scheme_designator="SCT",
                scheme_version=other.scheme_version,
            )
        else:
            other_mapped = Code(
                value=other.value,
                meaning="",
                scheme_designator=other.scheme_designator,
                scheme_version=other.scheme_version,
            )

        return (
            self_mapped.value == other_mapped.value
            and self_mapped.scheme_designator == other_mapped.scheme_designator
            and self_mapped.scheme_version == other_mapped.scheme_version
        )

    def __ne__(self, other: Any) -> Any:
        return not (self == other)


Code.__new__.__defaults__ = (None,)

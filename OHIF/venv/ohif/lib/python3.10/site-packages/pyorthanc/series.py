from typing import List, Dict

from pyorthanc.instance import Instance
from pyorthanc.client import Orthanc


class Series:
    """Represent an series that is in an Orthanc server

    This object has many getters that allow the user to retrieve metadata
    or the entire DICOM file of the Series
    """

    def __init__(
            self,
            series_id: str,
            client: Orthanc,
            series_information: Dict = None) -> None:
        """Constructor

        Parameters
        ----------
        series_id
            Orthanc series identifier.
        client
            Orthanc object.
        series_information
            Dictionary of series information.
        """
        self.client = client

        self.id_ = series_id
        self.information = series_information

        self._instances: List[Instance] = []

    @property
    def instances(self) -> List[Instance]:
        """Get series instance

        Returns
        -------
        List[Instance]
            List of the series' Instance.
        """
        return self._instances

    @property
    def identifier(self) -> str:
        """Get series identifier

        Returns
        -------
        str
            Series identifier.
        """
        return self.id_

    @property
    def uid(self) -> str:
        """Get SeriesInstanceUID

        Returns
        -------
        str
            SeriesInstanceUID
        """
        return self.get_main_information()['MainDicomTags']['SeriesInstanceUID']

    def get_main_information(self) -> Dict:
        """Get series main information

        Returns
        -------
        Dict
            Dictionary of series main information.
        """
        if self.information is None:
            self.information = self.client.get_series_id(self.id_)

        return self.information

    @property
    def manufacturer(self) -> str:
        """Get the manufacturer

        Returns
        -------
        str
            The manufacturer.
        """
        return self.get_main_information()['MainDicomTags']['Manufacturer']

    @property
    def study_identifier(self) -> str:
        """Get the parent study identifier

        Returns
        -------
        str
            The parent study identifier.
        """
        return self.get_main_information()['ParentStudy']

    @property
    def modality(self) -> str:
        """Get series modality

        Returns
        -------
        str
            Series modality.
        """
        return self.get_main_information()['MainDicomTags']['Modality']

    @property
    def series_number(self) -> str:
        """Get series number

        Returns
        -------
        str
            Series number.
        """
        return self.get_main_information()['MainDicomTags']['SeriesNumber']

    def anonymize(self, remove: List = None, replace: Dict = None, keep: List = None, force: bool = False) -> 'Series':
        """Anonymize Series

        If no error has been raise, then it creates a new anonymous series.
        Documentation: https://book.orthanc-server.com/users/anonymization.html

        Parameters
        ----------
        remove
            List of tag to remove
        replace
            Dictionary of {tag: new_content}
        keep
            List of tag to keep unchanged
        force
            Some tags can't be change without forcing it (e.g. PatientID) for security reason

        Returns
        -------
        Series
            A new anonymous Series.
        """
        remove = [] if remove is None else remove
        replace = {} if replace is None else replace
        keep = [] if keep is None else keep

        anonymous_series = self.client.post_series_id_anonymize(
            self.id_,
            json={'Remove': remove, 'Replace': replace, 'Keep': keep, 'Force': force}
        )

        return Series(anonymous_series['ID'], self.client)

    def get_zip(self) -> bytes:
        """Get the bytes of the zip file

        Get the .zip file.

        Returns
        -------
        bytes
            Bytes of Zip file of the series.

        Examples
        --------
        >>> from pyorthanc import Orthanc, Series
        >>> a_series = Series(
        ...     'SERIES_IDENTIFIER',
        ...     Orthanc('http://localhost:8042')
        ... )
        >>> bytes_content = a_series.get_zip()
        >>> with open('series_zip_file_path.zip', 'wb') as file_handler:
        ...     file_handler.write(bytes_content)

        """
        return self.client.get_series_id_archive(self.id_)

    def build_instances(self) -> None:
        """Build a list of the series' instances."""

        instance_ids = self.client.get_series_id_instances(self.id_)
        self._instances = [Instance(i['ID'], self.client) for i in instance_ids]

    def __repr__(self):
        return f'Series(identifier={self.id_})'

    def remove_empty_instances(self) -> None:
        self._instances = [i for i in self._instances if i is not None]


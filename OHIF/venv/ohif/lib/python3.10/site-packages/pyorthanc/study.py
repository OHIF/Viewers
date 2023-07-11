from datetime import datetime
from typing import List, Dict

from pyorthanc.client import Orthanc
from pyorthanc.series import Series
from pyorthanc.util import make_datetime_from_dicom_date


class Study:
    """Represent a study that is in an Orthanc server

    This object has many getters that allow the user to retrieve metadata
    or the entire DICOM file of the Series
    """

    def __init__(
            self,
            study_id: str,
            client: Orthanc,
            study_information: Dict = None) -> None:
        """Constructor

        Parameters
        ----------
        study_id
            Orthanc study identifier.
        client
            Orthanc object.
        study_information
            Dictionary of study's information.
        """
        self.client = client

        self.id_ = study_id
        self.information = study_information

        self._series: List[Series] = []

    @property
    def identifier(self) -> str:
        """Get Study Orthanc's identifier

        Returns
        -------
        str
            Study identifier
        """
        return self.id_

    def get_main_information(self) -> Dict:
        """Get Study information

        Returns
        -------
        Dict
            Dictionary of study information
        """
        if self.information is None:
            self.information = self.client.get_studies_id(self.id_)

        return self.information

    @property
    def referring_physician_name(self) -> str:
        """Get referring physician name

        Returns
        -------
        str
            Referring physician Name.
        """
        return self.get_main_information()['MainDicomTags']['ReferringPhysicianName']

    @property
    def date(self) -> datetime:
        """Get study date

        The date have precision to the second (if available).

        Returns
        -------
        datetime
            Study date
        """
        date_string = self.get_main_information()['MainDicomTags']['StudyDate']
        time_string = self.get_main_information()['MainDicomTags']['StudyTime']

        return make_datetime_from_dicom_date(date_string, time_string)

    @property
    def study_id(self) -> str:
        """Get Study ID

        Returns
        -------
        str
            Study ID
        """
        try:
            return self.get_main_information()['MainDicomTags']['StudyID']
        except KeyError:
            return ''

    @property
    def uid(self) -> str:
        """Get StudyInstanceUID

        Returns
        -------
        str
            StudyInstanceUID
        """
        return self.get_main_information()['MainDicomTags']['StudyInstanceUID']

    @property
    def patient_identifier(self) -> str:
        """Get the Orthanc identifier of the parent patient

        Returns
        -------
        str
            Parent patient's identifier.
        """
        return self.get_main_information()['ParentPatient']

    @property
    def patient_information(self) -> Dict:
        """Get patient information

        Returns
        -------
        Dict
            Patient general information.
        """
        return self.get_main_information()['PatientMainDicomTags']

    @property
    def series(self) -> List[Series]:
        """Get Study series

        Returns
        -------
        List[Series]
            List of study's Series
        """
        return self._series

    def anonymize(self, remove: List = None, replace: Dict = None, keep: List = None, force: bool = False) -> 'Study':
        """Anonymize Study

        If no error has been raise, then it creates a new anonymous study.
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
        Study
            A new anonymous Study.
        """
        remove = [] if remove is None else remove
        replace = {} if replace is None else replace
        keep = [] if keep is None else keep

        anonymous_study = self.client.post_studies_id_anonymize(
            self.id_,
            json={'Remove': remove, 'Replace': replace, 'Keep': keep, 'Force': force}
        )

        return Study(anonymous_study['ID'], self.client)

    def get_zip(self) -> bytes:
        """Get the bytes of the zip file

        Get the .zip file.

        Returns
        -------
        bytes
            Bytes of Zip file of the study.

        Examples
        --------
        >>> from pyorthanc import Orthanc, Study
        >>> a_study = Study(
        ...     'STUDY_IDENTIFIER',
        ...     Orthanc('http://localhost:8042')
        ... )
        >>> bytes_content = a_study.get_zip()
        >>> with open('study_zip_file_path.zip', 'wb') as file_handler:
        ...     file_handler.write(bytes_content)

        """
        return self.client.get_studies_id_archive(self.id_)

    def build_series(self) -> None:
        """Build a list of the study's series."""
        series_information = self.client.get_studies_id_series(self.id_)
        self._series = [Series(i['ID'], self.client) for i in series_information]
        for series in self._series:
            series.build_instances()

    def remove_empty_series(self) -> None:
        """Delete empty series."""
        for series in self._series:
            series.remove_empty_instances()

        self._series = list(filter(
            lambda series: series.instances != [],
            self._series
        ))

    def __repr__(self):
        return f'Study(StudyId={self.study_id}, identifier={self.id_})'

from typing import List, Dict

from pyorthanc.study import Study
from pyorthanc.client import Orthanc


class Patient:
    """Represent a Patient that is in an Orthanc server

    This object has many getters that allow the user to retrieve metadata
    or the entire DICOM file of the Patient
    """

    def __init__(
            self,
            patient_id: str,
            client: Orthanc,
            patient_information: Dict = None) -> None:
        """Constructor

        Parameters
        ----------
        patient_id
            Orthanc patient identifier.
        client
            Orthanc object.
        patient_information
            Dictionary of patient's information.
        """
        self.client = client

        self.id_ = patient_id
        self.information = patient_information

        self._studies: List[Study] = []

    @property
    def identifier(self) -> str:
        """Get patient identifier

        Returns
        -------
        str
            Patient identifier
        """
        return self.id_

    def get_main_information(self) -> Dict:
        """Get Patient information

        Returns
        -------
        Dict
            Dictionary of patient main information.
        """
        if self.information is None:
            self.information = self.client.get_patients_id(self.id_)

        return self.information

    @property
    def patient_id(self) -> str:
        """Get patient ID

        Returns
        -------
        str
            Patient ID
        """
        return self.get_main_information()['MainDicomTags']['PatientID']

    @property
    def name(self) -> str:
        """Get patient name

        Returns
        -------
        str
            Patient name
        """
        return self.get_main_information()['MainDicomTags']['PatientName']

    @property
    def sex(self) -> str:
        """Get patient sex

        Returns
        -------
        str
            Patient sex
        """
        return self.get_main_information()['MainDicomTags']['PatientSex']

    def get_zip(self) -> bytes:
        """Get the bytes of the zip file

        Get the .zip file.

        Returns
        -------
        bytes
            Bytes of Zip file of the patient.

        Examples
        --------
        >>> from pyorthanc import Orthanc, Patient
        >>> a_patient = Patient(
        ...     'A_PATIENT_IDENTIFIER',
        ...     Orthanc('http://localhost:8042')
        ... )
        >>> bytes_content = a_patient.get_zip()
        >>> with open('patient_zip_file_path.zip', 'wb') as file_handler:
        ...     file_handler.write(bytes_content)

        """
        return self.client.get_patients_id_archive(self.id_)

    def get_patient_module(self, simplify: bool = False, short: bool = False) -> Dict:
        """Get patient module in a simplified version

        The method returns the DICOM patient module
        (PatientName, PatientID, PatientBirthDate, ...)

        Parameters
        ----------
        simplify
            Get the simplified version of the tags
        short
            Get the short version of the tags

        Returns
        -------
        Dict
            DICOM Patient module.
        """
        if simplify and not short:
            params = {'simplify': True}
        elif short and not simplify:
            params = {'short': True}
        elif simplify and short:
            raise ValueError('simplify and short can\'t be both True')
        else:
            params = {}

        return dict(self.client.get_patients_id_module(
            self.id_,
            params=params
        ))

    def is_protected(self) -> bool:
        """Get if patient is protected against recycling

        Protection against recycling: False means unprotected, True protected.

        Returns
        -------
        bool
            False means unprotected, True means protected.
        """
        return '1' == self.client.get_patients_id_protected(self.id_)

    def set_to_protected(self):
        """Set patient to protected state

        Returns
        -------
        None
            Nothing.
        """
        # As of version 1.11.1, the Orthanc OPEN API file has missing information
        self.client._put(
            f'{self.client.url}/patients/{self.id_}/protected',
            json=1
        )

    def set_to_unprotected(self):
        """Set patient to unprotected state

        Returns
        -------
        None
            Nothing.
        """
        # As of version 1.11.1, the Orthanc OPEN API file has missing information
        self.client._put(
            f'{self.client.url}/patients/{self.id_}/protected',
            json=0
        )

    @property
    def studies(self) -> List[Study]:
        """Get patient's studies

        Returns
        -------
        List[Study]
            List of the patient's studies
        """
        return self._studies

    def build_studies(self) -> None:
        """Build a list of the patient's studies
        """
        studies_information = self.client.get_patients_id_studies(self.id_)

        self._studies = [Study(i['ID'], self.client) for i in studies_information]
        for study in self._studies:
            study.build_series()

    def anonymize(self, remove: List = None, replace: Dict = None, keep: List = None, force: bool = False) -> 'Patient':
        """Anonymize patient

        If no error has been raise, then it creates a new anonymous patient.
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
        Patient
            A New anonymous patient.
        """
        remove = [] if remove is None else remove
        replace = {} if replace is None else replace
        keep = [] if keep is None else keep

        anonymous_patient = self.client.post_patients_id_anonymize(
            self.id_,
            json={'Remove': remove, 'Replace': replace, 'Keep': keep, 'Force': force}
        )

        return Patient(anonymous_patient['ID'], self.client)

    def __str__(self):
        return f'Patient(PatientID={self.patient_id}, identifier={self.id_})'

    def remove_empty_studies(self) -> None:
        """Delete empty studies."""
        for study in self._studies:
            study.remove_empty_series()

        self._studies = list(filter(
            lambda s: s.series != [], self._studies
        ))

    def __repr__(self):
        return f'Patient(PatientID={self.patient_id}, identifier={self.id_})'

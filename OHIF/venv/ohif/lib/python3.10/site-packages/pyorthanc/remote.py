from typing import Dict

import httpx

from pyorthanc.client import Orthanc


class RemoteModality:
    """Wrapper around Orthanc API when dealing with a (remote) modality.
    """

    def __init__(self, client: Orthanc, modality: str) -> None:
        """Constructor

        Parameters
        ----------
        client
            Orthanc object.
        modality
            Remote modality.
        """
        self.client = client
        self.modality = modality

    def echo(self) -> bool:
        """C-Echo to remote modality

        Returns
        -------
        bool
            True if C-Echo succeeded.
        """
        try:
            self.client.post_modalities_id_echo(self.modality)
            return True

        except httpx.HTTPError:
            return False

    def query(self, data: Dict) -> Dict:
        """C-Find (Querying with data)

        Parameters
        ----------
        data
            Dictionary to send in the body of request.

        Returns
        -------
        Dict
            Dictionary with keys {'ID': '...', 'path': '...'}

        Examples
        -------
        >>> data = {'Level': 'Study',
        ...         'Query': {
        ...             'PatientID':'03HD*',
        ...             'StudyDescription':'*Chest*',
        ...             'PatientName':''
        ...         }
        ... }

        >>> remote_modality = RemoteModality(
        ...     client=Orthanc('http://localhost:8042'),
        ...     modality='sample'
        ... )

        >>> remote_modality.query(data)
        """
        return dict(self.client.post_modalities_id_query(self.modality, json=data))

    def move(self, query_identifier: str, cmove_data: Dict) -> Dict:
        """C-Move query results to another modality

        C-Move SCU: Send all the results to another modality whose AET is in the body

        Parameters
        ----------
        query_identifier
            Query identifier.
        cmove_data
            Ex. {'TargetAet': 'target_modality_name', "Synchronous": False}

        Returns
        -------
        Dict
            Orthanc Response (probably a Dictionary)

        Examples
        --------
        >>> remote_modality = RemoteModality(Orthanc('http://localhost:8042'), 'modality')
        >>> query_id = remote_modality.query(
        ...     data={'Level': 'Series',
        ...           'Query': {'PatientID': '',
        ...                     'Modality':'SR'}})

        >>> remote_modality.move(
        ...     query_identifier=query_id['ID'],
        ...     cmove_data={'TargetAet': 'TARGETAET'}
        ... )

        """
        return dict(self.client.post_queries_id_retrieve(query_identifier, json=cmove_data))

    def store(self, instance_or_series_id: str) -> Dict:
        """Store series or instance to remote modality.

        Parameters
        ----------
        instance_or_series_id
            Instance or Series Orthanc identifier.

        Returns
        -------
        Dict
            Information related to the C-Store operation.
        """
        return dict(self.client.post_modalities_id_store(
            self.modality,
            json=instance_or_series_id
        ))

    def get_query_answers(self) -> Dict:
        answers = {}

        for query_id in self.client.get_queries():
            for answer_id in self.client.get_queries_id_answers(query_id):
                answers[query_id] = self.client.get_queries_id_answers_index_content(query_id, answer_id)

        return answers



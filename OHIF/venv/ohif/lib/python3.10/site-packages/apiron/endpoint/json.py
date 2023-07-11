import collections
from typing import Any, Dict, Iterable, Optional

from apiron.endpoint.endpoint import Endpoint


class JsonEndpoint(Endpoint):
    """
    An endpoint that returns :mimetype:`application/json`
    """

    def __init__(
        self,
        *args,
        path: str = "/",
        default_method: str = "GET",
        default_params: Optional[Dict[str, Any]] = None,
        required_params: Optional[Iterable[str]] = None,
        preserve_order: bool = False,
    ):
        super().__init__(
            path=path, default_method=default_method, default_params=default_params, required_params=required_params
        )
        self.preserve_order = preserve_order

    def format_response(self, response) -> Dict[str, Any]:
        """
        Extracts JSON data from the response

        :param requests.Response response:
            The original response from :mod:`requests`
        :return:
            The response's JSON content
        :rtype:
            :class:`dict` if ``preserve_order`` is ``False``
        :rtype:
            :class:`collections.OrderedDict` if ``preserve_order`` is ``True``
        """

        return response.json(object_pairs_hook=collections.OrderedDict if self.preserve_order else None)

    @property
    def required_headers(self) -> Dict[str, str]:
        return {"Accept": "application/json"}

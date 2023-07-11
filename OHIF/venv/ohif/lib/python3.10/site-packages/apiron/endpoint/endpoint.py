from __future__ import annotations

import logging
import string
import sys
import warnings
from functools import partial, update_wrapper
from typing import Optional, Any, Callable, Dict, Iterable, List, TypeVar, Union, TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    if sys.version_info >= (3, 10):
        from typing import Concatenate, ParamSpec
    else:
        from typing_extensions import Concatenate, ParamSpec

    from apiron.service import Service

    P = ParamSpec("P")
    R = TypeVar("R")

import requests
from urllib3.util import retry

from apiron import client, Timeout
from apiron.exceptions import UnfulfilledParameterException


LOGGER = logging.getLogger(__name__)


def _create_caller(
    call_fn: Callable["Concatenate[Service, Endpoint, P]", "R"],
    instance: Any,
    owner: Any,
) -> Callable["P", "R"]:
    return partial(call_fn, instance, owner)


class Endpoint:
    """
    A basic service endpoint that responds with the default ``Content-Type`` for that endpoint
    """

    def __get__(self, instance, owner):
        caller = _create_caller(client.call, owner, self)
        update_wrapper(caller, client.call)
        return caller

    def __call__(self):
        raise TypeError("Endpoints are only callable in conjunction with a Service class.")

    def __init__(
        self,
        path: str = "/",
        default_method: str = "GET",
        default_params: Optional[Dict[str, Any]] = None,
        required_params: Optional[Iterable[str]] = None,
        return_raw_response_object: bool = False,
        timeout_spec: Optional[Timeout] = None,
        retry_spec: Optional[retry.Retry] = None,
    ):
        """
        :param str path:
            The URL path for this endpoint, without the protocol or domain
        :param str default_method:
            (Default ``'GET'``)
            The default method to use when calling this endpoint.
        :param dict default_params:
            The default parameters to use when calling this endpoint.
            Useful when an endpoint always or most often needs a base set of parameters supplied.
        :param required_params:
            An iterable of required parameter names.
            Calling an endpoint without its required parameters raises an exception.
        :param bool return_raw_response_object:
            Whether to return a :class:`requests.Response` object or call :func:`format_response` on it first.
            This can be overridden when calling the endpoint.
            (Default ``False``)
        :param Timeout timeout_spec:
            (optional)
            An override of the timeout behavior for calls to this endpoint.
            (default ``None``)
        :param urllib3.util.retry.Retry retry_spec:
            (optional)
            An override of the retry behavior for calls to this endpoint.
            (default ``None``)
        """
        self.default_method = default_method

        if "?" in path:
            warnings.warn(
                f"Endpoint path ('{path}') may contain query parameters. "
                f"Use the default_params or required_params attributes in the initialization of this endpoint, "
                f"or the params argument when calling the endpoint instead.",
                stacklevel=3,
            )

        self.path = path
        self.default_params = default_params or {}
        self.required_params = required_params or set()
        self.return_raw_response_object = return_raw_response_object
        self.timeout_spec = timeout_spec
        self.retry_spec = retry_spec

    def format_response(self, response: requests.Response) -> Union[str, Dict[str, Any], Iterable[bytes]]:
        """
        Extracts the appropriate type of response data from a :class:`requests.Response` object

        :param requests.Response response:
            The original response from :mod:`requests`
        :return:
            The response's text content
        :rtype:
            str
        """
        return response.text

    @property
    def required_headers(self) -> Dict[str, Any]:
        """
        Generates the headers that must be sent to this endpoint based on its attributes

        :return:
            Header name, header value pairs
        :rtype:
            dict
        """
        return {}

    def get_formatted_path(self, **kwargs) -> str:
        """
        Format this endpoint's path with the supplied keyword arguments

        :return:
            The fully-formatted path
        :rtype:
            str
        """
        self._validate_path_placeholders(self.path_placeholders, kwargs)

        return self.path.format(**kwargs)

    @property
    def path_placeholders(self) -> List[str]:
        """
        The formattable placeholders from this endpoint's path, in the order they appear.

        Example:

            >>> endpoint = Endpoint(path='/api/{foo}/{bar}')
            >>> endpoint.path_placeholders
            ['foo', 'bar']
        """

        parser = string.Formatter()
        return [placeholder_name for _, placeholder_name, _, _ in parser.parse(self.path) if placeholder_name]

    def _validate_path_placeholders(self, placeholder_names: List[str], path_kwargs: Dict[str, Any]):
        if any(path_kwarg not in placeholder_names for path_kwarg in path_kwargs):
            warnings.warn(
                f"An unknown path kwarg was supplied to {self}. kwargs supplied: {path_kwargs}",
                RuntimeWarning,
                stacklevel=6,
            )

    def _check_for_empty_params(self, params: Dict[str, Any]):
        empty_params = {param: params[param] for param in params if params[param] in (None, "")}

        if empty_params:
            warnings.warn(
                f"The {self.path} endpoint " f"was called with empty parameters: {empty_params}",
                RuntimeWarning,
                stacklevel=6,
            )

    def _check_for_unfulfilled_params(self, params: Dict[str, Any]):
        unfulfilled_params = {
            param for param in self.required_params if param not in params and param not in self.default_params
        }

        if unfulfilled_params:
            raise UnfulfilledParameterException(self.path, unfulfilled_params)

    def _validate_params(self, params: Dict[str, Any]):
        self._check_for_empty_params(params)
        self._check_for_unfulfilled_params(params)

    def get_merged_params(self, supplied_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Merge this endpoint's default parameters with the supplied parameters

        :param dict supplied_params:
            A dictionary of query parameter, value pairs
        :return:
            A dictionary of this endpoint's default parameters, merged with the supplied parameters.
            Any default parameters which have a value supplied are overridden.
        :rtype:
            dict
        :raises apiron.exceptions.UnfulfilledParameterException:
            When a required parameter for this endpoint is not a default param and is not supplied by the caller
        """
        supplied_params = supplied_params or {}

        self._validate_params(supplied_params)

        merged_params = self.default_params.copy()
        merged_params.update(supplied_params)
        return merged_params

    def __str__(self) -> str:
        return self.path

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(path='{self.path}')"

from __future__ import annotations
import collections
import logging
import random
from typing import Any, Dict, Optional, TYPE_CHECKING
from urllib import parse

import requests
from requests import adapters
from urllib3.util import retry

if TYPE_CHECKING:
    import apiron  # pragma: no cover
from apiron.exceptions import NoHostsAvailableException

LOGGER = logging.getLogger(__name__)

DEFAULT_CONNECTION_TIMEOUT = 1
DEFAULT_READ_TIMEOUT = 3

DEFAULT_CONNECTION_RETRIES = 1
DEFAULT_READ_RETRIES = 1
DEFAULT_TOTAL_RETRIES = 1
DEFAULT_STATUS_CODES_TO_RETRY_ON = range(500, 600)

Timeout = collections.namedtuple("Timeout", ["connection_timeout", "read_timeout"])

DEFAULT_TIMEOUT = Timeout(connection_timeout=DEFAULT_CONNECTION_TIMEOUT, read_timeout=DEFAULT_READ_TIMEOUT)
DEFAULT_RETRY = retry.Retry(
    total=DEFAULT_TOTAL_RETRIES,
    connect=DEFAULT_CONNECTION_RETRIES,
    read=DEFAULT_READ_RETRIES,
    status_forcelist=DEFAULT_STATUS_CODES_TO_RETRY_ON,
)


def _build_url(host: str, path: str) -> str:
    """
    Builds a valid URL from a host and path which may or may not have slashes in the proper place.
    Does not conform to `IETF RFC 1808 <https://tools.ietf.org/html/rfc1808.html>`_ but instead joins the host and path as given.
    Does not append any additional slashes to the final URL; just joins the host and path properly.

    :param str host:
        An HTTP host like ``'https://awesome-api.com/v2'``
    :param str path:
        The path to an endpoint on the host like ``'/some-resource/'``
    :return:
        The properly-joined URL of host and path, e.g. ``'https://awesome-api.com/v2/some-resource/'``
    :rtype:
        str
    """
    host += "/" if not host.endswith("/") else ""
    path = path.lstrip("/")

    return parse.urljoin(host, path)


def _adapt_session(session: requests.Session, adapter: requests.adapters.HTTPAdapter) -> requests.Session:
    """
    Mounts an adapter capable of communication over HTTP or HTTPS to the supplied session.

    :param adapter:
        A :class:`requests.adapters.HTTPAdapter` instance
    :return:
        The adapted :class:`requests.Session` instance
    """
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def _get_required_headers(service: apiron.Service, endpoint: apiron.Endpoint) -> Dict[str, str]:
    """
    :param Service service:
        The service being called
    :param Endpoint endpoint:
        The endpoint being called
    :return:
        Headers required by the ``service`` and the ``endpoint`` being called
    :rtype:
        dict
    """
    headers = {}
    headers.update(service.required_headers)
    headers.update(endpoint.required_headers)
    return headers


def _choose_host(service: apiron.Service) -> str:
    hosts = service.get_hosts()
    if not hosts:
        raise NoHostsAvailableException(getattr(service, "service_name", "UNKNOWN SERVICE"))
    return random.choice(hosts)


def _build_request_object(
    session: requests.Session,
    service: apiron.Service,
    endpoint: apiron.Endpoint,
    method: Optional[str] = None,
    params: Optional[Dict[str, Any]] = None,
    data: Optional[Dict[str, Any]] = None,
    files: Optional[Dict[str, str]] = None,
    json: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, Any]] = None,
    cookies: Optional[Dict[str, Any]] = None,
    auth: Optional[Any] = None,
    **kwargs,
):
    host = _choose_host(service=service)

    path = endpoint.get_formatted_path(**kwargs)

    merged_params = endpoint.get_merged_params(params)

    headers = headers or {}
    headers.update(_get_required_headers(service, endpoint))

    request = requests.Request(
        method=method or endpoint.default_method,
        url=_build_url(host, path),
        params=merged_params,
        data=data,
        files=files,
        json=json,
        headers=headers,
        cookies=cookies,
        auth=auth,
    )

    return session.prepare_request(request)


def _get_guaranteed_session(session: Optional[requests.Session]) -> requests.Session:
    if session:
        return session
    return requests.Session()


def _get_retry_spec(endpoint: apiron.Endpoint, retry_spec: Optional[retry.Retry] = None) -> retry.Retry:
    return retry_spec or endpoint.retry_spec or DEFAULT_RETRY


def _get_timeout_spec(endpoint: apiron.Endpoint, timeout_spec: Optional[Timeout] = None) -> Timeout:
    return timeout_spec or endpoint.timeout_spec or DEFAULT_TIMEOUT


def call(
    service: apiron.Service,
    endpoint: apiron.Endpoint,
    method: Optional[str] = None,
    session: Optional[requests.Session] = None,
    params: Optional[Dict[str, Any]] = None,
    data: Optional[Dict[str, Any]] = None,
    files: Optional[Dict[str, str]] = None,
    json: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, Any]] = None,
    cookies: Optional[Dict[str, Any]] = None,
    auth: Optional[Any] = None,
    encoding: Optional[str] = None,
    retry_spec: Optional[retry.Retry] = None,
    timeout_spec: Optional[Timeout] = None,
    logger: Optional[logging.Logger] = None,
    allow_redirects: bool = True,
    return_raw_response_object: Optional[bool] = None,
    **kwargs,
):
    """
    :param Service service:
        The service that hosts the endpoint being called
    :param Endpoint endpoint:
        The endpoint being called
    :param str method:
        The HTTP method to use for the call
    :param requests.Session session:
        (optional)
        An existing session, useful for making many calls in a single session
        (default ``None``)
    :param dict params:
        (optional)
        ``GET`` parameters to send to the endpoint
        (default ``None``)
    :param dict data:
        (optional)
        ``POST`` data to send to the endpoint.
        A :class:`dict` will be form-encoded, while a :class:`str` will be sent raw
        (default ``None``)
    :param dict files:
        (optional)
        Dictionary of ``'filename': file-like-objects`` for multipart encoding upload.
        (default ``None``)
    :param dict json:
        (optional)
        A JSON-serializable dictionary that will be sent as the ``POST`` body
        (default ``None``)
    :param dict headers:
        HTTP Headers to send to the endpoint
        (default ``None``)
    :param dict cookies:
        Cookies to send to the endpoint
        (default ``None``)
    :param auth:
        An object suitable for the :class:`requests.Request` object's ``auth`` argument
    :param str encoding:
        The codec to use when decoding the response.
        Default behavior is to have ``requests`` guess the codec.
        (default ``None``)
    :param urllib3.util.retry.Retry retry_spec:
        (optional)
        An override of the retry behavior for this call.
        (default ``None``)
    :param Timeout timeout_spec:
        (optional)
        An override of the timeout behavior for this call.
        (default ``None``)
    :param logging.Logger logger:
        (optional)
        An existing logger for logging from the proper caller for better correlation
    :param bool allow_redirects:
        (optional)
        Enable/disable GET/OPTIONS/POST/PUT/PATCH/DELETE/HEAD redirection
        (default ``True``)
    :param bool return_raw_response_object:
        Whether to return a :class:`requests.Response` object or call :func:`format_response` on it first.
        (Default ``False``)
    :param ``**kwargs``:
        Arguments to be formatted into the ``endpoint`` argument's ``path`` attribute
    :return:
        The result of ``endpoint``'s :func:`format_response`
    :rtype: The type returned by ``endpoint``'s :func:`format_response`
    :raises requests.RetryError:
        if retry threshold exceeded due to bad HTTP codes (default 500 range)
    :raises requests.ConnectionError:
        if retry threshold exceeded due to connection or request timeouts
    """
    logger = logger or LOGGER

    managing_session = not session
    guaranteed_session = _get_guaranteed_session(session)

    retry_spec_to_use = _get_retry_spec(endpoint, retry_spec)

    adapted_session = _adapt_session(guaranteed_session, adapters.HTTPAdapter(max_retries=retry_spec_to_use))

    method = method or endpoint.default_method

    auth = auth or getattr(session, "auth", None) or service.auth

    request = _build_request_object(
        adapted_session,
        service,
        endpoint,
        method=method,
        params=params,
        data=data,
        files=files,
        json=json,
        headers=headers,
        cookies=cookies,
        auth=auth,
        **kwargs,
    )

    logger.info("%s %s", method, request.url)

    timeout_spec_to_use = _get_timeout_spec(endpoint, timeout_spec)

    response = adapted_session.send(
        request,
        timeout=(timeout_spec_to_use.connection_timeout, timeout_spec_to_use.read_timeout),
        stream=getattr(endpoint, "streaming", False),
        allow_redirects=allow_redirects,
        proxies=adapted_session.proxies or service.proxies,
    )

    logger.info(
        "%d %s%s",
        response.status_code,
        response.url,
        " ({} redirect(s))".format(len(response.history)) if response.history else "",
    )

    if managing_session:
        adapted_session.close()

    response.raise_for_status()

    if encoding:
        response.encoding = encoding

    # Use the explicitly passed in option, if any
    # Otherwise, use the endpoint's setting
    if return_raw_response_object is None:
        return_raw_response = endpoint.return_raw_response_object
    else:
        return_raw_response = return_raw_response_object

    return response if return_raw_response else endpoint.format_response(response)

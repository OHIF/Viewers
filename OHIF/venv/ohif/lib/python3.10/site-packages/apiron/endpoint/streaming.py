from typing import Iterable

from apiron.endpoint.endpoint import Endpoint


class StreamingEndpoint(Endpoint):
    """
    An endpoint that streams data incrementally
    """

    streaming = True

    def format_response(self, response) -> Iterable[bytes]:
        """
        Stream response in chunks

        :param requests.Response response:
            The original response from :mod:`requests`
        :return:
            The response's content
        :rtype:
            generator
        """

        return response.iter_content(chunk_size=None)

from typing import Optional, Any

from apiron.endpoint import Endpoint


class StubEndpoint(Endpoint):
    """
    A stub endpoint designed to return a pre-baked response

    The intent is to allow for a service to be implemented
    before the endpoint is complete.
    """

    def __get__(self, instance, owner):
        return self.stub_response

    def __init__(self, stub_response: Optional[Any] = None, **kwargs):
        """
        :param stub_response:
            A pre-baked response or response-determining function.
            Pre-baked response example: ``'stub response'`` or ``{'stub': 'response'}``
            A response-determining function may operate on any arguments
            provided to the client's ``call`` method.
            Example of a response-determining function::

                def stub_response(**kwargs):
                    if kwargs.get('params') and kwargs['params'].get('param_key') == 'param_value':
                        return {'stub response': 'for param_key=param_value'}
                    else:
                        return {'default': 'response'}

        :param ``**kwargs``:
            Arbitrary parameters that can match the intended real endpoint.
            These don't do anything for the stub but streamline the interface.
        """

        super().__init__(**kwargs)

        if callable(stub_response):
            self.stub_response = stub_response
        elif stub_response:
            self.stub_response = lambda *args, **kwargs: stub_response
        else:
            self.stub_response = lambda *args, **kwargs: {"response": repr(self)}

from typing import Set


class APIException(Exception):
    pass


class NoHostsAvailableException(APIException):
    def __init__(self, service_name: str):
        message = f"No hosts available for service: {service_name}"
        super().__init__(message)


class UnfulfilledParameterException(APIException):
    def __init__(self, endpoint_path: str, unfulfilled_params: Set[str]):
        message = f"The {endpoint_path} endpoint was called without required parameters: {unfulfilled_params}"
        super().__init__(message)

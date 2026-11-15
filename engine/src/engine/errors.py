"""Engine input errors; the API maps InvalidRequestError to 422 invalid_request."""


class InvalidRequestError(ValueError):
    """The request cannot be scored, e.g. a crop in a season it does not support."""

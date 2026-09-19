class DataValidationError(ValueError):
    """Raised when canonical input cannot be persisted without alteration."""


class DuplicateTelemetryError(ValueError):
    """Raised when a packet ID or sequence number is already recorded."""

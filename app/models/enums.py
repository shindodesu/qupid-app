from enum import Enum

class ConversationType(str, Enum):
    direct = "direct"
    group = "group"

class ReportStatus(str, Enum):
    open = "open"
    reviewing = "reviewing"
    resolved = "resolved"
    rejected = "rejected"

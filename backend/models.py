"""
AquaWatch Data Models and Validation Helpers
"""

from typing import Dict, Any, Optional

class WaterUsageModel:
    @staticmethod
    def validate(data: Dict[str, Any]) -> Optional[str]:
        if not data.get("date"):
            return "Date is required."
        if not data.get("location"):
            return "Location is required."
        try:
            litres = float(data.get("litres_used", -1))
            if litres < 0:
                return "litres_used must be a non-negative number."
        except (ValueError, TypeError):
            return "litres_used must be a valid numeric quantity."
        return None

class WaterWasteReportModel:
    VALID_TYPES = [
        "Leaking taps",
        "Taps left running",
        "Excessive garden watering",
        "Overflow and spillage"
    ]
    VALID_STATUSES = ["Reported", "In Progress", "Resolved"]

    @staticmethod
    def validate(data: Dict[str, Any]) -> Optional[str]:
        if not data.get("location"):
            return "Location is required."
        if not data.get("waste_type") or data.get("waste_type") not in WaterWasteReportModel.VALID_TYPES:
            return f"waste_type must be one of: {', '.join(WaterWasteReportModel.VALID_TYPES)}"
        if not data.get("description"):
            return "Description is required."
        return None

class StudentSurveyModel:
    @staticmethod
    def validate(data: Dict[str, Any]) -> Optional[str]:
        try:
            total = int(data.get("total_responses", 0))
            if total <= 0:
                return "total_responses must be greater than zero."
            taps = int(data.get("taps_running_count", 0))
            showers = int(data.get("long_showers_count", 0))
            reuse = int(data.get("water_reuse_count", 0))

            if taps < 0 or showers < 0 or reuse < 0:
                return "Counts cannot be negative."
            if taps > total or showers > total or reuse > total:
                return "Habit count cannot exceed total respondents."
        except (ValueError, TypeError):
            return "Survey counts must be valid integers."
        return None

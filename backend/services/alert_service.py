from datetime import datetime
from bson import ObjectId
from database import alerts

def serialize_alert(doc: dict) -> dict:
    if not doc:
        return None
        
    # Map legacy properties if present
    alert_type = doc.get("type") or doc.get("alert_type") or "Information"
    if alert_type == "Disease Alert":
        alert_type = "Disease"
    elif alert_type == "Moisture Alert":
        alert_type = "Moisture"
        
    priority_val = doc.get("priority") or doc.get("severity") or "Low"
    
    created_at_val = doc.get("created_at") or doc.get("timestamp") or datetime.utcnow()
    
    # Try resolving title from message if not present
    title_val = doc.get("title")
    if not title_val:
        msg = doc.get("message", "")
        if "detected" in msg.lower() or "blight" in msg.lower() or "rust" in msg.lower():
            title_val = "Disease Detected"
        elif "moisture" in msg.lower() or "irrigation" in msg.lower():
            title_val = "Soil Moisture Warning"
        elif "registered" in msg.lower():
            title_val = "New Field Registered"
        else:
            title_val = "System Alert"
            
    return {
        "id": str(doc["_id"]),
        "field_id": doc.get("field_id"),
        "title": title_val,
        "message": doc.get("message", ""),
        "type": alert_type,
        "priority": priority_val,
        "status": doc.get("status", "Unread"),
        "created_at": created_at_val
    }

class AlertService:
    @staticmethod
    def create_alert(alert_type: str, title: str, message: str, priority: str, field_id: str | None = None, status: str = "Unread", user_id: str | None = None) -> dict:
        doc = {
            "type": alert_type,
            "title": title,
            "message": message,
            "priority": priority,
            "field_id": field_id,
            "created_at": datetime.utcnow(),
            "status": status,
            "user_id": user_id
        }
        result = alerts.insert_one(doc)
        doc["_id"] = result.inserted_id
        return serialize_alert(doc)

    @staticmethod
    def get_all_alerts(user_id: str) -> list[dict]:
        cursor = alerts.find({"user_id": user_id}).sort([("created_at", -1), ("timestamp", -1)])
        return [serialize_alert(doc) for doc in cursor]

    @staticmethod
    def get_recent_alerts(user_id: str, limit: int = 5) -> list[dict]:
        cursor = alerts.find({"user_id": user_id}).sort([("created_at", -1), ("timestamp", -1)]).limit(limit)
        return [serialize_alert(doc) for doc in cursor]

    @staticmethod
    def get_unread_count(user_id: str) -> int:
        return alerts.count_documents({"status": "Unread", "user_id": user_id})

    @staticmethod
    def mark_as_read(alert_id: str, user_id: str) -> dict | None:
        try:
            oid = ObjectId(alert_id)
        except Exception:
            return None
        update_result = alerts.update_one({"_id": oid, "user_id": user_id}, {"$set": {"status": "Read"}})
        if update_result.matched_count == 0:
            return None
        doc = alerts.find_one({"_id": oid, "user_id": user_id})
        return serialize_alert(doc)

    @staticmethod
    def delete_alert(alert_id: str, user_id: str) -> bool:
        try:
            oid = ObjectId(alert_id)
        except Exception:
            return False
        result = alerts.delete_one({"_id": oid, "user_id": user_id})
        return result.deleted_count > 0

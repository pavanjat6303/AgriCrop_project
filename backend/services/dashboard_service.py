from datetime import datetime
from database import fields, disease_scans, soil_predictions

class DashboardService:
    @staticmethod
    def get_stats(user_id: str) -> dict:
        total = fields.count_documents({"user_id": user_id})
        
        # Count healthy fields (status = 'Healthy' case-insensitive)
        healthy = fields.count_documents({
            "status": {"$regex": "^healthy$", "$options": "i"},
            "user_id": user_id
        })
        
        # Count diseased fields (status = 'Infected', 'Diseased', 'High Risk', or 'Disease Suspected' case-insensitive)
        diseased = fields.count_documents({
            "status": {"$regex": "^(infected|diseased|high risk|disease suspected)$", "$options": "i"},
            "user_id": user_id
        })
        
        # Calculate average current moisture across all soil predictions
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "avg_moisture": {"$avg": "$current_moisture"}}}
        ]
        res = list(soil_predictions.aggregate(pipeline))
        avg_moisture = 0
        if res and res[0].get("avg_moisture") is not None:
            avg_moisture = int(round(res[0]["avg_moisture"]))
        
        return {
            "total_fields": total,
            "healthy_fields": healthy,
            "diseased_fields": diseased,
            "average_moisture": avg_moisture
        }

    @staticmethod
    def get_recent_scans(user_id: str, limit: int = 5) -> list[dict]:
        scans_list = []
        cursor = disease_scans.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        for doc in cursor:
            disease_name = doc.get("disease") or doc.get("prediction") or ""
            scans_list.append({
                "id": str(doc["_id"]),
                "filename": doc.get("filename", ""),
                "disease": disease_name,
                "confidence": doc.get("confidence", 0.0),
                "recommendation": doc.get("recommendation", ""),
                "timestamp": doc.get("timestamp") or datetime.utcnow()
            })
        return scans_list

    @staticmethod
    def get_moisture_summary(user_id: str) -> dict:
        # Calculate average current moisture
        pipeline_avg = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "avg_moisture": {"$avg": "$current_moisture"}}}
        ]
        res_avg = list(soil_predictions.aggregate(pipeline_avg))
        avg_moisture = 0
        if res_avg and res_avg[0].get("avg_moisture") is not None:
            avg_moisture = int(round(res_avg[0]["avg_moisture"]))
        
        # Tally irrigation recommendations
        tallies = {
            "Required": 0,
            "Stable": 0,
            "Not Recommended": 0
        }
        
        pipeline_tally = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$irrigation", "count": {"$sum": 1}}}
        ]
        res_tally = list(soil_predictions.aggregate(pipeline_tally))
        for item in res_tally:
            status_val = item["_id"]
            if status_val in tallies:
                tallies[status_val] = item["count"]
                
        return {
            "average_moisture": avg_moisture,
            "recommendations": tallies
        }

    @staticmethod
    def get_overview(user_id: str) -> dict:
        return {
            "stats": DashboardService.get_stats(user_id),
            "recent_scans": DashboardService.get_recent_scans(user_id),
            "moisture_summary": DashboardService.get_moisture_summary(user_id)
        }


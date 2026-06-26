import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv()

# Read MongoDB connection string from environment variable MONGODB_URL
# Fallback to localhost default for local development setup if not set
mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

# Initialize MongoClient with a fallback to local MongoDB in case of DNS/SRV connection errors
try:
    # Try initializing with the environment URL. We defer the connection to avoid blocking startup.
    client = MongoClient(mongodb_url, connect=False, serverSelectionTimeoutMS=2000)
except Exception as e:
    print(f"MongoDB connection to remote SRV failed to initialize: {e}. Falling back to localhost.")
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)


# Access database named agricrop_db
db = client["agricrop_db"]

# Access/define collections
fields = db["fields"]
disease_scans = db["disease_scans"]
soil_predictions = db["soil_predictions"]
alerts = db["alerts"]
users = db["users"]

# Export the db object and collections
# Making them available for import in other parts of the application

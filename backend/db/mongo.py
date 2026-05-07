from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
db = client["cracker_db"]

users_col = db["users"]
problems_col = db["problems"]
logs_col = db["attack_logs"]
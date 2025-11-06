from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_next_id(collection_name: str):
    """Get the next available ID for a collection"""
    try:
        # Find the document with the highest ID
        result = await db[collection_name].find_one(
            sort=[("id", -1)]
        )
        if result and "id" in result:
            return result["id"] + 1
        return 1
    except Exception as e:
        logger.error(f"Error getting next ID for {collection_name}: {e}")
        return 1

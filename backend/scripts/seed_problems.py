import asyncio
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

async def seed():
    # scenarios.json 읽기
    json_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ai", "prompts", "scenarios.json"
    )

    with open(json_path, "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    # MongoDB 연결
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client["cracker_db"]
    problems_col = db["problems"]

    # 기존 문제 전체 삭제 후 새로 삽입
    await problems_col.delete_many({})
    print("기존 문제 삭제 완료")

    from datetime import datetime
    for scenario in scenarios:
        scenario["use_input_filter"] = scenario.get("use_input_filter", True)
        scenario["use_output_filter"] = scenario.get("use_output_filter", True)
        scenario["created_at"] = datetime.utcnow()
        scenario["updated_at"] = datetime.utcnow()

    result = await problems_col.insert_many(scenarios)
    print(f"문제 {len(result.inserted_ids)}개 등록 완료!")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
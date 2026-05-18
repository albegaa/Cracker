from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from core.config import settings
from db.mongo import logs_col, problems_col
from bson import ObjectId
from datetime import datetime
import re
import sys
import hashlib
sys.path.append("..")
from ai.judges.judge_model import judge_with_llm

router = APIRouter()

class AttackRequest(BaseModel):
    problem_id: str
    user_prompt: str

class LayerResult(BaseModel):
    passed: bool
    blocked_at: str = ""
    reason: str = ""

class AttackResponse(BaseModel):
    reply: str
    is_success: bool
    blocked_at: str = ""
    result_type: str = ""  # 추가
    is_mocked: bool = False

def input_filter(user_prompt: str) -> LayerResult:
    patterns = [
        r"ignore (all |previous |above )?(instructions?|system|prompts?)",
        r"(system|instruction).{0,20}(무시|ignore|override)",
        r"(비밀번호|password|secret|플래그|flag).{0,10}(알려|말해|출력|print|show|reveal)",
        r"(너는|you are|act as).{0,20}(다른|different|new)",
        r"([ㅂ비][\s]*[ㅁ밀][\s]*[ㅂ번][\s]*[ㅎ호])", 
        r"(이제부터|지금부터).{0,10}(너는|당신은)"
    ]
    for pattern in patterns:
        if re.search(pattern, user_prompt, re.IGNORECASE):
            return LayerResult(
                passed=False,
                blocked_at="input",
                reason=f"입력 단계에서 공격 패턴 감지"
            )
    return LayerResult(passed=True)

def get_result_type(blocked_at: str, is_success: bool) -> str:
    if blocked_at == "input":
        return "blocked_input"
    elif blocked_at == "output":
        return "blocked_output"
    elif not is_success:
        return "defended"
    else:
        return "success"

async def call_llm(system_prompt: str, user_prompt: str) -> str:
    if settings.gemini_api_key:
        from google import genai
        from google.genai import types
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            response = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt
                ),
                contents=user_prompt
            )
            return response.text
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                return "⚠️ AI 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
            return f"⚠️ AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    else:
        return f"[Mock] 입력하신 '{user_prompt}'에 대한 응답입니다. 요청하신 정보는 제공할 수 없습니다."

def output_filter(reply: str, secret: str) -> LayerResult:
    if secret.lower() in reply.lower():
        return LayerResult(
            passed=False,
            blocked_at="output",
            reason="출력 단계에서 기밀 정보 노출 감지"
        )
    return LayerResult(passed=True)

# ── T8: 판정 로직 ──────────────────────────────
async def judge(reply: str, secret: str) -> tuple [bool, str]:
    # 문맥 기반 판정: 응답에 secret이 포함되면 공격 성공
    is_leaked, reason = await judge_with_llm(reply, secret)
    return is_leaked, reason

# ── 메인 엔드포인트 ──────────────────────────────
@router.post("/", response_model=AttackResponse)
async def handle_attack(
    req: AttackRequest,
    user_id: str = Depends(get_current_user)
):
    # DB에서 system_prompt, secret 조회
    problem = await problems_col.find_one({"_id": ObjectId(req.problem_id)})
    if not problem:
        raise HTTPException(404, "문제를 찾을 수 없습니다")
    system_prompt = problem["system_prompt"]
    secret = problem["secret"]

    # {secret} 치환 추가
    system_prompt = system_prompt.replace("{secret}", secret)

    is_mocked = not bool(settings.gemini_api_key)

    # 1단계: 입력 필터 (문제 설정에 따라 적용)
    if problem.get("use_input_filter", True):
        input_result = input_filter(req.user_prompt)
        if not input_result.passed:
            await logs_col.insert_one({
                "user_id": hashlib.sha256(user_id.encode()).hexdigest()[:16],
                "problem_id": req.problem_id,
                "attack_prompt": req.user_prompt,
                "response": "입력이 보안 정책에 의해 차단되었습니다.",
                "is_success": False,
                "blocked_at": "input",
                "attack_type": "blocked_input",
                "created_at": datetime.utcnow()
            })
            return AttackResponse(
                reply="입력이 보안 정책에 의해 차단되었습니다.",
                is_success=False,
                blocked_at="input",
                result_type="blocked_input",
                is_mocked=is_mocked
            )

    # 2단계: LLM 호출
    reply = await call_llm(system_prompt, req.user_prompt)

    # 3단계: 출력 필터 (문제 설정에 따라 적용)
    if problem.get("use_output_filter", True):
        output_result = output_filter(reply, secret)
        if not output_result.passed:
            await logs_col.insert_one({
                "user_id": hashlib.sha256(user_id.encode()).hexdigest()[:16],
                "problem_id": req.problem_id,
                "attack_prompt": req.user_prompt,
                "response": "응답이 보안 정책에 의해 차단되었습니다.",
                "is_success": False,
                "blocked_at": "output",
                "attack_type": "blocked_output",
                "created_at": datetime.utcnow()
            })
            return AttackResponse(
                reply="응답이 보안 정책에 의해 차단되었습니다.",
                is_success=False,
                blocked_at="output",
                result_type="blocked_output",
                is_mocked=is_mocked
            )

    # T8: 판정
    is_success, judge_reason = await judge(reply, secret)
    result_type = get_result_type("", is_success)

    await logs_col.insert_one({
        "user_id": hashlib.sha256(user_id.encode()).hexdigest()[:16],
        "problem_id": req.problem_id,
        "attack_prompt": req.user_prompt,
        "response": reply,
        "is_success": is_success,
        "judge_reason": judge_reason,
        "blocked_at": "",
        "attack_type": "passed",
        "created_at": datetime.utcnow()
    })

    return AttackResponse(
        reply=reply,
        is_success=is_success,
        blocked_at="",
        result_type=result_type,
        is_mocked=is_mocked
    )

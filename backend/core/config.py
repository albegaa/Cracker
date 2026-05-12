from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str
    secret_key: str
    openai_api_key: str = ""
    gemini_api_key: str = ""    # 추가


    class Config:
        env_file = ".env"

settings = Settings()
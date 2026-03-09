from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./tasks.db"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    demo_username: str = "admin"
    demo_password: str = "admin"

    model_config = {"env_file": ".env"}


settings = Settings()

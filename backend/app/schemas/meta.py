from pydantic import BaseModel

class MetaResponse(BaseModel):
    demoMode: bool
    aiAvailable: bool
    appEnv: str
    showDemoBadge: bool
    version: str = "1.0.0"

class AIHealthResponse(BaseModel):
    provider: str
    model: str
    reachable: bool
    demoMode: bool

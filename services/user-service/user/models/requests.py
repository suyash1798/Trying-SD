from pydantic import BaseModel


class DeviceLoginRequest(BaseModel):
    deviceId: str

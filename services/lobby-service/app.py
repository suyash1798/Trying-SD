from fastapi import FastAPI

from lobby.controllers import router
from lobby.database import migrate


app = FastAPI()
app.include_router(router)


@app.on_event("startup")
def startup():
    migrate()

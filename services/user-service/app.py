from fastapi import FastAPI

from user.controllers import router
from user.database import migrate


app = FastAPI()
app.include_router(router)


@app.on_event("startup")
def startup():
    migrate()

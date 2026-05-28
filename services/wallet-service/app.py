from fastapi import FastAPI

from wallet.controllers import router
from wallet.database import migrate


app = FastAPI()
app.include_router(router)


@app.on_event("startup")
def startup():
    migrate()

from fastapi import FastAPI

app = FastAPI(title="AgroAyuda API")


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe. `data_version` is added in task L4."""
    return {"status": "ok"}

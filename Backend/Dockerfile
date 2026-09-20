FROM python:3.12-slim

WORKDIR /service/Backend

COPY Backend/requirements.txt ./requirements.txt
COPY Ml/aeronex_ml_ready/requirements.txt /service/Ml/aeronex_ml_ready/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r /service/Ml/aeronex_ml_ready/requirements.txt

COPY Backend/app ./app
COPY Ml/aeronex_ml_ready /service/Ml/aeronex_ml_ready

EXPOSE 10000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
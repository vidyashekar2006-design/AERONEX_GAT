FROM python:3.12-slim

WORKDIR /service

COPY Simulation/backend/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY Simulation/backend/server.py ./server.py
COPY Simulation/simulator ./simulator

EXPOSE 10000

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]

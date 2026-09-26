FROM python:3.12-slim

WORKDIR /srv
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-fetch the inference engine and weights from Hugging Face into the image layer
RUN NEEDLE_TELEMETRY=0 DO_NOT_TRACK=1 needle fetch

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

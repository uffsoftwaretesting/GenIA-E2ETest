FROM mcr.microsoft.com/playwright/python:v1.60.0-jammy

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000 \
    TMPDIR=/opt/render/project/tmp \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
COPY Aptfile /tmp/Aptfile

RUN mkdir -p /opt/render/project/tmp \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive xargs -a /tmp/Aptfile apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --upgrade pip \
    && pip install -r /tmp/requirements.txt

COPY . /app

EXPOSE 10000

CMD ["gunicorn", "api:app", "--bind", "0.0.0.0:10000", "--workers", "1", "--threads", "4", "--worker-class", "gthread", "--timeout", "600", "--keep-alive", "120"]

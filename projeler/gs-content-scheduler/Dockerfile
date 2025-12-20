# Dockerfile iskeleti
FROM python:3.9-slim

WORKDIR /app

COPY gereksinimler.txt .
RUN pip install -r gereksinimler.txt

COPY . .

CMD ["python", "main.py"]
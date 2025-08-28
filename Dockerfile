FROM python:3.13-slim
# Set environment variables

ENV PYTHONBUFFERED=1
# おまじない


WORKDIR /app
# localのrequirements.txtをコンテナの/app/にコピー
COPY requirements.txt /app/

# Install　packages
RUN pip install -r requirements.txt

# Copy the rest of the application
COPY ./app /app/app

CMD [ "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

EXPOSE 8000
FROM --platform=linux/amd64 ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    python3 \
    python3-pip \
    pkg-config \
    python3-dev \
    libcairo2-dev \
    libopus0 \
    libopusfile0 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_VERSION=20.x
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g azure-functions-core-tools@4 --unsafe-perm true

RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
    && apt-get update \
    && apt-get install -y azure-cli \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./static_app /app/static_app
COPY ./function_app /app/function_app

WORKDIR /app/static_app

RUN npm install

WORKDIR /app/function_app

RUN python3 -m pip install --upgrade pip
RUN pip install -r requirements.txt

ENV FUNCTIONS_WORKER_RUNTIME_PYTHON="/usr/bin/python3"

WORKDIR /app

EXPOSE 3000
EXPOSE 7071

CMD ["bash"]
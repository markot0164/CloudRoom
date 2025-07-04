FROM --platform=linux/amd64 ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y curl wget git build-essential software-properties-common python3 python3-pip pkg-config python3-dev libcairo2-dev libopus0 libopusfile0 \
    libjpeg-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev tcl-dev tk-dev \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -p /opt/conda && \
    rm /tmp/miniconda.sh && \
    /opt/conda/bin/conda clean -a -y

ENV PATH="/opt/conda/bin:$PATH"

RUN conda config --set always_yes true && \
    conda config --set changeps1 false && \
    conda update conda && \
    /opt/conda/bin/conda install python=3.11 -y

ENV NODE_VERSION=20.x
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    npm install -g npm@latest && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g azure-functions-core-tools@4 --unsafe-perm true

RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash && \
    apt-get update && \
    apt-get install -y azure-cli && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./static_app /app/static_app
COPY ./function_app /app/function_app

WORKDIR /app/function_app

RUN /opt/conda/bin/python -m ensurepip --default-pip
RUN /opt/conda/bin/pip install --upgrade pip

RUN /opt/conda/bin/pip install --no-cache-dir -r requirements.txt --target=".python_packages/lib/python3.11/site-packages"

ENV FUNCTIONS_WORKER_RUNTIME_PYTHON="/opt/conda/bin/python"
ENV AzureWebJobsScriptRoot="/app/function_app"

WORKDIR /app/static_app
RUN npm install

WORKDIR /app

EXPOSE 3000
EXPOSE 7071

CMD ["bash"]
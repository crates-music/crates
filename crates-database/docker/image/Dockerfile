FROM registry.hub.docker.com/library/postgres:12.4

## Install some utilities
RUN apt-get update && apt-get install -y \
        dnsutils \
        curl \
        vim \
    && rm -rf /var/lib/apt/lists/*

## sets default root password
ENV POSTGRES_PASSWORD_FILE=/etc/postgres/root_password

## Use UTF-8 in bash
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

## copies important things
COPY container/ /

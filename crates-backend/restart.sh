#!/usr/bin/env bash

set -e -o -pipefile

./mvnw clean install -Pdocker -DskipTests
docker rm -f crates-backend
./mvnw docker:start
docker logs -f crates-backend
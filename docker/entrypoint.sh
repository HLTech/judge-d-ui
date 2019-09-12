#!usr/bin/env sh
set -eu

envsubst '${PORT} ${BASE_PATH}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf

exec "$@"
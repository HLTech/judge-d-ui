#!usr/bin/env sh
set -eu

envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf
envsubst '${BASE_PATH}' < /usr/share/nginx/html/config.js > /usr/share/nginx/html/config.js

exec "$@"
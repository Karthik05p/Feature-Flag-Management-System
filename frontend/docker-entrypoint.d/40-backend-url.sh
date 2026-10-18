#!/bin/sh
set -eu

backend_url="${BACKEND_URL:-http://backend:8000}"
backend_url="${backend_url%/}"
escaped_backend_url=$(printf '%s' "$backend_url" | sed 's/[\/&|]/\\&/g')
listen_port="${PORT:-80}"

resolver_addr=""
if [ -f /etc/resolv.conf ]; then
  resolver_addr=$(awk '$1 == "nameserver" && $2 !~ /:/ { print $2; exit }' /etc/resolv.conf)
  if [ -z "$resolver_addr" ]; then
    resolver_addr=$(awk '$1 == "nameserver" { print $2; exit }' /etc/resolv.conf)
  fi
fi
if [ -z "$resolver_addr" ]; then
  resolver_addr="127.0.0.11"
fi
case "$resolver_addr" in
  *:*)
    resolver_addr="[${resolver_addr}]"
    ;;
esac
escaped_resolver=$(printf '%s' "$resolver_addr" | sed 's/[\/&|]/\\&/g')

sed \
    -e "s|\${BACKEND_URL}|${escaped_backend_url}|g" \
    -e "s|\${PORT}|${listen_port}|g" \
    -e "s|\${RESOLVER}|${escaped_resolver}|g" \
    /etc/nginx/backend.conf.template \
    > /etc/nginx/conf.d/default.conf

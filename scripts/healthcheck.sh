#!/bin/sh
# Health check script for Docker HEALTHCHECK instruction
wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

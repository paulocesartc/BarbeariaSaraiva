#!/usr/bin/env bash

# This script runs before EAS build installation phase
# It ensures google-services.json is available for the build

set -e

echo "Running pre-install hook..."

# Check if GOOGLE_SERVICES_JSON environment variable is set
if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "Using GOOGLE_SERVICES_JSON from environment variable..."
  echo "$GOOGLE_SERVICES_JSON" > google-services.json
else
  echo "GOOGLE_SERVICES_JSON not found in environment, checking local file..."
  if [ ! -f "google-services.json" ]; then
    echo "Warning: google-services.json not found locally or in environment!"
    echo "Build may fail if Firebase services are required."
  else
    echo "google-services.json found locally"
  fi
fi

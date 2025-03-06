#!/bin/bash

# Script to test the Docker build locally

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  echo "Please run ./setup-env.sh first to set up your environment variables."
  exit 1
fi

# Export environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Build the Docker image
echo "Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t snippet-repository:test .

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Build successful! You can now run the container with:"
  echo "docker run -p 3000:3000 snippet-repository:test"
else
  echo "Build failed. Please check the error messages above."
  exit 1
fi 
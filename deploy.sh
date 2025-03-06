#!/bin/bash

# Simple deployment script for the Snippet Repository

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  echo "Please create a .env file with your Supabase credentials."
  echo "You can run ./setup-env.sh to set up your environment variables."
  exit 1
fi

# Check if Supabase credentials are set
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env || ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env; then
  echo "Error: Supabase credentials not found in .env file!"
  echo "Please run ./setup-env.sh to set up your environment variables."
  exit 1
fi

# Check if Supabase credentials are still the default values
if grep -q "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url" .env || grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" .env; then
  echo "Error: Supabase credentials are still set to default values!"
  echo "Please run ./setup-env.sh to set up your environment variables."
  exit 1
fi

# Export environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Pull the latest changes
echo "Pulling the latest changes..."
git pull

# Build and start the Docker containers
echo "Building and starting Docker containers..."
docker-compose down
docker-compose up -d --build

# Check if the containers are running
echo "Checking if the containers are running..."
if docker-compose ps | grep -q "Up"; then
  echo "Deployment successful! The application is now running."
  echo "You can access it at http://localhost:3000"
else
  echo "Error: Deployment failed. Please check the logs with 'docker-compose logs -f app'"
  exit 1
fi 
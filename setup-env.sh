#!/bin/bash

# Script to set up environment variables for Docker deployment

# Check if .env.example exists
if [ ! -f .env.example ]; then
  echo "Error: .env.example file not found!"
  exit 1
fi

# Check if .env already exists
if [ -f .env ]; then
  read -p ".env file already exists. Do you want to overwrite it? (y/n): " overwrite
  if [ "$overwrite" != "y" ]; then
    echo "Keeping existing .env file."
    exit 0
  fi
fi

# Create .env file from .env.example
cp .env.example .env

# Prompt for Supabase URL
read -p "Enter your Supabase URL: " supabase_url
sed -i.bak "s|your_supabase_project_url|$supabase_url|g" .env

# Prompt for Supabase Anon Key
read -p "Enter your Supabase Anon Key: " supabase_key
sed -i.bak "s|your_supabase_anon_key|$supabase_key|g" .env

# Remove backup file
rm -f .env.bak

echo "Environment variables set up successfully!"
echo "You can now run ./deploy.sh to deploy your application." 
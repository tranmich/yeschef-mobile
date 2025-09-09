#!/bin/bash
# Navigate to YesChefMobile and start Expo

echo "🚀 Starting YesChef Mobile App..."
cd "D:\Mik\Downloads\Me Hungie\YesChefMobile"
echo "📁 Current directory: $(pwd)"
echo "📦 Checking package.json..."
ls -la package.json
echo "🔥 Starting Expo..."
npx expo start --clear

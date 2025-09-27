#!/bin/bash

# Try to deploy to Vercel
echo "Attempting to deploy to Vercel..."

# Force link to scribblemachine-clean project
echo "scribblemachine-clean" | npx vercel link --yes

# Try deployment
npx vercel --prod --yes

echo "Deployment attempt completed."
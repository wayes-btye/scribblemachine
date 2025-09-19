# Environment Setup Guide

This guide helps you set up the required environment variables for the Coloring Page Generator project.

## Quick Start

1. Copy the root environment template:
   ```bash
   cp .env.example .env
   ```

2. Copy service-specific templates:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp services/worker/.env.example services/worker/.env
   ```

## Required Services

### 1. Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your keys
3. Set these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

### 2. Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Set `GEMINI_API_KEY` in your environment

### 3. Stripe (for payments)

1. Create account at [stripe.com](https://stripe.com)
2. Go to Developers > API keys
3. Set these variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key (test mode)
   - `STRIPE_SECRET_KEY`: Secret key (test mode)
   - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret

## Development vs Production

### Development Environment
- Use test/sandbox keys for all services
- Set `NODE_ENV=development`
- Use local Supabase: `http://127.0.0.1:54321`

### Production Environment
- Use production keys
- Set `NODE_ENV=production`
- Use your production Supabase URL

## Environment Files Structure

```
.env                    # Global environment (not committed)
.env.example           # Global template (committed)
apps/web/.env.local    # Next.js environment (not committed)
apps/web/.env.example  # Next.js template (committed)
services/worker/.env   # Worker environment (not committed)
services/worker/.env.example # Worker template (committed)
```

## Security Notes

- **Never commit actual `.env` files**
- Keep service role keys secret
- Use different keys for development and production
- Rotate keys regularly in production

## Validation

The project includes environment validation. If you're missing required variables, you'll see helpful error messages when starting the services.

## Troubleshooting

### Common Issues

1. **"Invalid Supabase URL"**: Make sure URL includes `https://`
2. **"Unauthorized"**: Check that your anon key matches your project
3. **"Stripe key invalid"**: Ensure you're using the correct test/live keys
4. **"Gemini API error"**: Verify your API key has proper permissions

### Getting Help

1. Check the console for specific error messages
2. Verify your keys in the respective service dashboards
3. Ensure environment files are in the correct locations
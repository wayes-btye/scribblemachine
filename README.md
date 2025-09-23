# Coloring Page Generator

A web application that converts photos into printable coloring pages using AI image generation.

## 🏗️ Project Structure

This is a monorepo containing:

```
├── apps/
│   └── web/                    # Next.js web application
├── services/
│   └── worker/                 # Background processing service
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── database/               # Database utilities and client
│   └── config/                 # Shared configuration
└── supabase/                   # Database migrations and setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Google Gemini API key
- Stripe account (for payments)

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env.local
   cp services/worker/.env.example services/worker/.env
   ```

   Fill in your API keys and database URLs. See [docs/ENV_SETUP.md](./docs/ENV_SETUP.md) for detailed instructions.

### Why Multiple Environment Files?

The monorepo uses different environment files for different purposes:
- **`.env`** (root) - Global variables shared across all services
- **`apps/web/.env.local`** - Next.js specific variables (automatically loaded by Next.js)
- **`services/worker/.env`** - Worker service specific variables (API keys, processing config)

This separation allows each service to have its own configuration while sharing common variables. The web app doesn't need worker-specific settings, and the worker doesn't need Next.js public variables.

3. **Start Supabase locally** (optional for development)
   ```bash
   npx supabase start
   ```

4. **Run database migrations**
   ```bash
   npx supabase db push
   ```

5. **Start development servers**
   ```bash
   # Start both web and worker in parallel
   pnpm dev

   # Or start individually
   pnpm web:dev      # Web app on http://localhost:3000
   pnpm worker:dev   # Worker service
   ```

## 📦 Available Scripts

### Root Level
- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all services for production
- `pnpm lint` - Run linting across all packages
- `pnpm type-check` - Type check all packages

### Web App
- `pnpm web:dev` - Start web app development server
- `pnpm web:build` - Build web app for production

### Worker Service
- `pnpm worker:dev` - Start worker in development mode
- `pnpm worker:build` - Build worker for production

## 🏭 Architecture

### Web App (`apps/web`)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: React Query for server state
- **Auth**: Supabase Auth with magic links
- **Deployment**: Vercel

### Worker Service (`services/worker`)
- **Runtime**: Node.js with TypeScript
- **Queue**: pg-boss (PostgreSQL-based job queue)
- **Processing**:
  - Image preprocessing with Sharp
  - AI generation with Google Gemini
  - PDF creation with PDFKit
- **Deployment**: Docker container (Railway, Fly.io, etc.)

### Shared Packages (`packages/`)
- **types**: TypeScript interfaces and types
- **database**: Supabase client and utilities
- **config**: Environment validation and constants

### Database (`supabase/`)
- **Provider**: Supabase (PostgreSQL)
- **Features**: Row Level Security, Storage, Auth
- **Migrations**: SQL files with schema versioning

## 🔐 Security

- **Authentication**: Magic link email authentication
- **Authorization**: Row Level Security (RLS) policies
- **File Upload**: Signed URLs with TTL expiration
- **API Protection**: Rate limiting and input validation
- **Privacy**: EXIF data stripping, no data retention

## 📊 Monitoring

- **Web**: Vercel Analytics + optional Google Analytics
- **Worker**: Structured logging with optional Sentry
- **Database**: Supabase dashboard metrics
- **Costs**: Per-job cost tracking and alerts

## 🚢 Deployment

### Web App (Vercel)
```bash
# Automatic deployment on push to main branch
# Or manual deployment:
vercel --prod
```

### Worker Service (Docker)
```bash
# Build and push to registry
docker build -t coloringpage-worker services/worker/
docker push your-registry/coloringpage-worker

# Deploy to your hosting provider
# (Railway, Fly.io, Google Cloud Run, etc.)
```

### Database (Supabase)
```bash
# Deploy migrations
npx supabase db push --linked
```

## 🧪 Testing

### Frontend Testing
```bash
# Run all tests
pnpm test

# Test specific packages
pnpm --filter @coloringpage/types test
```

### Backend/Worker Testing
⚠️ **API Cost Warning**: Use cost-effective tests for routine validation

**RECOMMENDED (Cost-Effective):**
```bash
# Single image test (1 API call)
pnpm --filter @coloringpage/worker test:gemini:single

# Basic Gemini connectivity test
pnpm --filter @coloringpage/worker test:gemini

# PDF generation test (no API calls)
pnpm --filter @coloringpage/worker test:pdf
```

**USE SPARINGLY (Expensive):**
```bash
# Full test suite (18 API calls)
pnpm --filter @coloringpage/worker test:gemini:generate
```

## 📚 Documentation

- [Environment Setup](./docs/ENV_SETUP.md) - Detailed environment configuration
- [Implementation Strategy](./docs/IMPLEMENTATION_STRATEGY.md) - Development approach
- [Architecture Details](./docs/architecture.md) - Technical architecture
- [Developer Training](./docs/DEVELOPER_TRAINING.md) - Concepts and explanations
- [Work Log](./docs/work_log.md) - Development scratchpad and notes

## 🔧 Development

### Adding New Features

1. **Types First**: Add interfaces to `packages/types`
2. **Database**: Create migrations in `supabase/migrations/`
3. **Backend**: Implement logic in `services/worker/`
4. **Frontend**: Build UI in `apps/web/`
5. **Tests**: Add tests for critical paths

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js and Node.js
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: [Your support email]

---

Built with ❤️ using Next.js, Supabase, and AI.
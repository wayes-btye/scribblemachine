# ADR-001: Database Polling vs pg-boss Queue System

**Date**: 2025-09-20
**Status**: Accepted
**Phase**: Phase 3A - Backend Integration

## Context

The original architecture specified using pg-boss as the job queue system for processing generation requests. pg-boss is a PostgreSQL-based job queue that provides reliable, distributed job processing with features like retries, delays, and job monitoring.

During Phase 3A implementation, we encountered connectivity issues with pg-boss when trying to connect to the Supabase PostgreSQL database from external clients:

- **External Connection Limitations**: Supabase PostgreSQL databases have restrictions on external connections for security reasons
- **Connection Pooler Issues**: Multiple attempts to configure the connection string for Supabase's connection pooler resulted in timeout and authentication errors
- **Development Environment**: The immediate priority was to establish end-to-end functionality for testing and validation

## Decision

We implemented a **database polling approach** instead of pg-boss for the MVP:

### Implementation Details
- **Polling Worker**: Created `simple-worker.ts` that polls the `jobs` table every 5 seconds
- **Job Processing**: Worker queries for jobs with `status = 'queued'` and processes them sequentially
- **Status Updates**: Direct database updates for job status (`running`, `succeeded`, `failed`)
- **Credit Handling**: Implemented credit deduction/refund logic using database functions

### Code Changes
- Modified `POST /api/jobs` to create jobs with `queued` status (no pg-boss integration)
- Created `services/worker/src/simple-worker.ts` for polling-based processing
- Added `increment_user_credits()` database function for safe credit operations

## Consequences

### Positive
- ✅ **Immediate Functionality**: End-to-end flow working without complex setup
- ✅ **Simplified Architecture**: Easier to understand and debug
- ✅ **Reliable Operation**: Direct database operations are predictable
- ✅ **Development Speed**: Unblocked Phase 3A completion

### Negative
- ❌ **Polling Overhead**: Database queries every 5 seconds (low efficiency)
- ❌ **Scalability Concerns**: Not suitable for high-volume production
- ❌ **Limited Features**: Missing pg-boss features (job priorities, delays, distributed processing)
- ❌ **Single Point**: One worker instance, no horizontal scaling

### Technical Debt
- **Production Migration**: Will need to implement proper pg-boss setup for production
- **Connection Configuration**: Requires investigation of Supabase pooler setup for external connections
- **Monitoring**: Current approach lacks built-in job monitoring and metrics

## Future Considerations

For production deployment, consider:

1. **Supabase Database Proxy**: Investigate direct database connection options
2. **Message Queue Alternative**: Consider Redis-based queues (Bull, BullMQ)
3. **Hybrid Approach**: Use polling for MVP, migrate to proper queue system later
4. **Serverless Queue**: Consider cloud-native solutions (AWS SQS, Google Cloud Tasks)

## Related Documents

- Original Architecture: `docs/initial_documents/architecture.md`
- Phase 3A Execution Plan: `docs/PHASE_3_EXECUTION_PLAN.md`
- Worker Implementation: `services/worker/src/simple-worker.ts`
# ADR-002: Simplified Worker Architecture

**Date**: 2025-09-20
**Status**: Accepted
**Phase**: Phase 3A - Backend Integration

## Context

The original architecture planned for a distributed worker system with multiple worker types (`ingest`, `generate`, `pdf`) handling different aspects of the job processing pipeline. The design included:

- Separate workers for different job types
- Complex job routing and dependency management
- Multiple service instances for horizontal scaling

During Phase 3A implementation, we needed to prioritize getting the core generation functionality working end-to-end before adding complexity.

## Decision

We implemented a **single, unified worker** that handles the complete generation pipeline:

### Implementation Details
- **Single Worker Process**: One `simple-worker.ts` handles entire generation flow
- **Sequential Processing**: Jobs processed one at a time in FIFO order
- **Integrated Pipeline**: Upload → Process → Generate → Store in single workflow
- **Direct Database Access**: Worker connects directly to Supabase for all operations

### Processing Flow
1. Poll for `queued` jobs every 5 seconds
2. Update job status to `running`
3. Download original asset from storage
4. Call Gemini API for generation
5. Upload generated asset to storage
6. Update job status to `succeeded`/`failed`
7. Handle credit refunds on failure

## Consequences

### Positive
- ✅ **Simplified Deployment**: Single service to manage and monitor
- ✅ **Reduced Complexity**: No inter-service communication or job routing
- ✅ **Fast Implementation**: Completed integration quickly
- ✅ **Easy Debugging**: Single process for end-to-end troubleshooting
- ✅ **Resource Efficiency**: Lower overhead for MVP scale

### Negative
- ❌ **Limited Concurrency**: Processes jobs sequentially (no parallelism)
- ❌ **Single Point of Failure**: Worker failure stops all processing
- ❌ **Reduced Flexibility**: Cannot optimize different job types separately
- ❌ **Scaling Limitations**: Cannot scale individual pipeline stages independently

### Technical Considerations
- **Memory Usage**: Entire image processing happens in single process
- **Error Isolation**: Failure in one step affects entire job
- **Monitoring**: Simpler monitoring but less granular metrics

## Future Evolution Path

For scaling beyond MVP:

1. **Phase 1: Concurrent Processing**
   - Add concurrent job processing within single worker
   - Implement job limit per worker instance

2. **Phase 2: Specialized Workers**
   - Split into separate services: ingest, generate, pdf
   - Implement proper job queue routing

3. **Phase 3: Horizontal Scaling**
   - Multiple worker instances per job type
   - Load balancing and job distribution

## Related Decisions

- Related to [ADR-001](./ADR-001-database-polling-vs-pgboss.md): Database polling architecture
- Influences future scaling decisions for production deployment

## Performance Characteristics

Current implementation handles:
- **Throughput**: ~5-12 jobs per hour (limited by Gemini API response time)
- **Latency**: 6-12 seconds per job (Gemini processing time)
- **Reliability**: High (direct database operations, atomic transactions)
- **Resource Usage**: Low (single process, efficient memory usage)
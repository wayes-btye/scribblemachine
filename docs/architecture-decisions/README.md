# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting important architectural decisions made during the development of Scribblemachine.

## Format

Each ADR follows this format:
- **Status**: Proposed, Accepted, Superseded
- **Context**: What is the issue that we're seeing?
- **Decision**: What is the change that we're proposing/doing?
- **Consequences**: What becomes easier or more difficult to do because of this change?

## Index

- [ADR-001: Database Polling vs pg-boss Queue](./ADR-001-database-polling-vs-pgboss.md) - Worker job processing architecture
- [ADR-002: Simplified Worker Architecture](./ADR-002-simplified-worker-architecture.md) - Single polling worker design

## Template

Use the template in `adr-template.md` for new ADRs.
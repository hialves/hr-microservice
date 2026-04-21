# HR Microservices

A comprehensive HR management system built with NestJS, consisting of two interconnected microservices: **HCM** (Human Capital Management) and **Timeoff**.

## Overview

This project implements a distributed HR system where:

- **HCM Microservice**: Acts as the source of truth for employee data and leave balance management. It validates and processes timeoff requests, maintaining accurate leave balances and employee records.
- **Timeoff Microservice**: Handles timeoff request submissions. It emits events when employees request time off, which are then validated and processed by the HCM service.

The two services communicate through an event-driven architecture, ensuring data consistency and separation of concerns.

## Architecture

### HCM Module

Responsible for:

- Managing employee balance and leave records
- Validating timeoff requests from the Timeoff service
- Maintaining the source of truth for employee data
- Processing balance updates and snapshots
- Exposing balance information via REST endpoints

### Timeoff Module

Responsible for:

- Accepting timeoff requests from employees
- Emitting timeoff request events to the HCM service
- Storing balance snapshots for reference
- Tracking request history

### Event-Driven Communication

The services use NestJS Event Emitter for asynchronous communication:

- Timeoff service emits events when requests are submitted
- HCM service listens to these events and validates/processes them
- Events ensure loose coupling and scalability

### Batch Sync with Cursor-Based Pagination

The Timeoff service implements an efficient synchronization mechanism for keeping balance snapshots up-to-date from the HCM service. This uses cursor-based pagination to handle large datasets reliably:

**How it works:**

1. **Cursor State**: The sync process maintains a cursor containing:
   - `updatedAt`: Timestamp of the last synced record
   - `id`: ID of the last synced record

2. **Initial Sync**: On first run, the sync retrieves the last sync state from the database. If none exists, it starts from the beginning.

3. **Batch Fetching**: The process fetches records in configurable batches (default: 1000 per request):
   - Calls HCM API with current cursor and batch size
   - Receives a batch of balance updates with a `nextCursor` for continuation

4. **Data Upsert**: Each batch is:
   - Transformed to match local schema (snake_case to camelCase)
   - Inserted or updated in the local Timeoff database
   - Tracked for count and success

5. **State Persistence**: After each batch:
   - Cursor position is updated in the database
   - Process continues if `hasMore` is true
   - If an error occurs, the last valid cursor is preserved for recovery

6. **Advantages**:
   - **Reliability**: Cursor tracking ensures no data is lost or duplicated if the sync is interrupted
   - **Scalability**: Batch processing prevents memory overflow with large datasets
   - **Performance**: Only fetches changed records since the last sync
   - **Resumability**: Can resume from the last known position if sync fails

This approach ensures the Timeoff service maintains an accurate, up-to-date copy of employee balances while minimizing bandwidth and memory usage.

### Concurrency Control and Idempotency in Balance Management

The HCM service implements robust mechanisms to handle concurrent balance operations and ensure data integrity:

**Optimistic Locking with Version Control:**

- Each balance record includes a `version` field that increments with every update
- When deducting balance (e.g., timeoff approval), the update only succeeds if the balance hasn't been modified since the last read
- This prevents lost updates in concurrent scenarios where multiple timeoff requests are processed simultaneously
- If a conflict occurs, the client receives an error and can retry with the latest balance state

**Ledger System:**

- A complete audit trail is maintained in the `ledger` table
- Every balance change (creation, deduction) is recorded with:
  - Employee ID and location
  - Delta (amount changed)
  - Reason for the change
  - Timestamp
  - Idempotency key for deduplication
- This enables:
  - Balance recalculation from scratch if needed
  - Complete audit trail for compliance
  - Historical analysis of balance changes

**Idempotency Control with Processed Requests:**

- The `processed_requests` table tracks all successfully processed balance operations by their idempotency key
- Before processing any balance change (create or deduct), the system checks if the request was already processed
- If a duplicate request arrives (e.g., due to network retry), it's rejected with `AlreadyProcessedError`
- This ensures:
  - Double charging/crediting is prevented
  - Network retries are safe without side effects
  - Distributed systems can reliably retry failed operations

**Transaction Safety:**

- All balance operations (create and deduct) are wrapped in database transactions
- Ensures atomic updates across balances, ledger, and processed_requests tables
- Prevents partial updates if any step fails

This three-layer approach (versioning, ledger, idempotency) ensures the system remains consistent even under high concurrency and network failures.

## Technology Stack

- **Runtime**: Node.js 24 (Alpine)
- **Framework**: NestJS 11
- **Database**: SQLite (better-sqlite3)
- **Event System**: NestJS Event Emitter
- **HTTP Client**: Axios
- **Language**: TypeScript

## Project Structure

```
src/
├── common/                 # Shared utilities and constants
│   ├── constants/         # Database constants
│   └── event/             # Event dispatching module
├── contracts/             # Shared interfaces and DTOs
│   ├── events/           # Event definitions
│   └── rest/             # API response contracts
├── error/                # Error handling
├── filters/              # Exception filters
├── hcm/                  # HCM Microservice
│   ├── database/         # SQLite database configuration
│   └── modules/
│       ├── balance/      # Balance management
│       └── ledger/       # Ledger records
└── timeoff/              # Timeoff Microservice
    ├── database/         # SQLite database configuration
    └── modules/
        ├── balance-snapshot/    # Balance snapshots
        ├── hcm-integration/     # HCM service integration
        └── request/             # Timeoff requests
```

## Getting Started

### Prerequisites

- Node.js 24 or higher
- npm 10 or higher

### Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

### Development

```bash
# Start in watch mode
npm run start:dev

# Run e2e tests
npm run test:e2e

# Generate code coverage
npm test:cov
```

### Production

```bash
# Build for production
npm run build

# Start the application
npm run start:prod
```

## Docker

### Build and Run

```bash
# Build the Docker image
docker build -t hr-microservices:latest .

# Run the container
docker run -p 3000:3000 hr-microservices:latest

# Run with environment variables
docker run -p 3000:3000 -e NODE_ENV=production hr-microservices:latest
```

## Environment Variables

The following environment variables can be configured:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

### HCM Service

- `GET /balance` - Retrieve employee balance information
- `POST /balance` - Create or update balance records

### Timeoff Service

- `POST /request` - Submit a timeoff request
- `GET /request` - Retrieve timeoff requests
- `GET /balance-snapshot` - View balance snapshots

## Database

The project uses SQLite with better-sqlite3 for database management:

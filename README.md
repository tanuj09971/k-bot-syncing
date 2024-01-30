# k-bot-syncing

### The "k-bot-syncing" NestJS application efficiently monitors a designated contract, specifically for the "ping" event, ensuring a streamlined process by emitting a singular "ping" event for each occurrence.

![GitHub](https://img.shields.io/badge/Platform-GitHub-brightgreen)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Temporal](https://img.shields.io/badge/Workflow%20Engine-Temporal-blue)

<br/>

<br/>

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Env Variables](#env-variables)
- [Temporal UI](#temporal-ui)
- [File Structure](#file-structure)
- [Technical Overview](#technical-overview)
- [Features Covered](#features-covered)

## Prerequisites

NodeJS
https://nodejs.org/en/ v18.18.2

Typescript
https://www.typescriptlang.org/ v3.8.3

PostgresQL
https://www.postgresql.org/ v14.5-alpine

Docker
https://hub.docker.com/ v24.0.5

Prisma
https://www.prisma.io/ v5.8.0

Temporal
https://temporal.io/ v1.18.0

## Getting Started

```sh

# 1. Clone the repository .
git clone git_repo_url

# 2. Enter your newly-cloned folder.
cd k-bot-syncing

# 3. Create Environment variables file.
cp  .env

# 4. run the Server
docker compose up --build

```

## Env Variables

#### environment variables which are required

```shell
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
TEMPORAL_VERSION=1.18.0
TEMPORAL_UI_VERSION=2.6.2
TEMPORAL_HOST=temporal
```

## Temporal UI

#### Temporal ui for watching , managing the workflows and activities

```shell
curl --location --request GET `http://localhost:8080
```

## HealthCheck

#### HealthCheck to efficiently monitor and enhance performance by seamlessly checking the ping of both the database and temporal systems.

```shell
curl --location --request GET `http://localhost:3000/health

HealthCheck Response :-

{"status":"ok","info":{"temporal":{"status":"up"},"postgres":{"status":"up"}},"error":{},"details":{"temporal":{"status":"up"},"postgres":{"status":"up"}}}
```

## File structure

```text
.
└── k-bot-syncing
    ├── envs
    │   └── temporal.env                    * Temporal env for temporal configuration
    ├── prisma
    │   ├── migrations                      * Contains all migrations created during development
    │   │   └── migratiuons-files
    │   └── schema.prisma
    ├── src
    │   ├── config                          * Contains configuration of app
    │   │   ├── config.module.ts
    │   │   └── config.ts
    │   ├── health                          * HealthCheck module
    │   │   ├── health.controller.ts
    │   │   └── health.module.ts
    │   ├── prisma                          * Prisma Service for initializing prisma client
    │   │   └── prisma.service.ts
    │   ├── services
    │   │   ├── PingPong                 * Data handling module
    │   │   │   ├── types
    │   │   │   │   └── interface.ts
    │   │   │   ├── PingPong.module.ts
    │   │   │   └── PingPong.service.ts
    │   │   ├── events                      * Custom Events module for  integrating DataManger and Web3 for event handling
    │   │   │   ├── types
    │   │   │   │   └── events
    │   │   │   ├── utils
    │   │   │   │   └── utils.ts
    │   │   │   ├── events.controller.ts
    │   │   │   ├── events.module.ts
    │   │   │   └── events.service.ts
    │   │   └── temporal                    * Temporal module for workflows
    │   │       ├── activities
    │   │       │   └── ping-pong-activities.ts
    │   │       ├── types
    │   │       │   └── interface.ts
    │   │       ├── temporal.controller.ts
    │   │       └── temporal.module.ts
    │   ├── temporal_utils                  * Temporal utils for registering activites of temporal
    │   │   └── workflow.ts
    │   ├── web3                            * Web3 module for interaction with web3
    │   │   ├── web3.module.ts
    │   │   └── web3.service.ts
    │   ├── app.module.ts
    │   └── main.ts
    ├── .env                                * Env for app configuration
    ├── .gitignore
    ├── .docker-compose.yml
    ├── Dockerfile
    ├── package.json
    └── tsconfig.json

```

## Technical Overview

### Typescript

TypeScript introduces static typing, allowing you to define types for variables, function parameters, and return values. This catches type-related errors during development, providing early feedback and improving code reliability. With explicit type annotations, TypeScript code is self-documenting. This enhances code readability and makes it easier for us to understand and maintain the codebase over time. The use of types and clear interfaces in TypeScript promotes better collaboration among team members. It reduces misunderstandings about the expected data types and function signatures, leading to more cohesive and collaborative development.

### Prisma

Utilizing Prisma in application brings forth a contemporary method for seamless data manipulation. This integration introduces a type-safe and intuitive interface for robust data management, simplifying database operations significantly. With Prisma, the focus shifts from dealing with complex SQL queries to building features effortlessly. The toolkit empowers us to perform CRUD operations seamlessly and harness advanced querying capabilities within application, streamlining the development process. Prisma's qualities lie in its ability to provide a modern, type-safe database interface, allowing for efficient data handling and manipulation without the intricacies of traditional SQL queries.

### Temporal

Employing Temporal in our system revolutionizes workflow management and error handling, surpassing conventional cron job schedulers. Temporal excels not just in time-based scheduling but in orchestrating intricate workflows and resiliently handling task retries. Its seamless approach to defining and managing retry policies within workflows stands out against ad-hoc solutions in traditional error handling. The reduction in potential issues associated with retry implementations adds to Temporal's appeal. For developers seeking resilience and scalability in distributed systems, Temporal's workflow-centric design, dynamic retry policies, and fault-tolerant capabilities make it the preferred choice. We leverage Temporal for unparalleled reliability and scalability without compromising on complexity

### Docker

Leveraging Docker in the application offers enhanced scalability, portability, and consistency across diverse environments. Docker encapsulates the application, dependencies, and runtime environment into a lightweight, portable container, ensuring seamless deployment across platforms and reducing compatibility issues. This containerization facilitates simplified configuration, accelerates development cycles, and fosters collaboration through standardized environments. With Docker, managing dependencies, isolating components, and streamlining deployment workflows become efficient processes. The resulting advantages include improved reliability, easy reproducibility, and scalability, contributing to enhanced overall development and operational efficiency.

## Features Covered

### Dockerized app

Dockerizing a NestJS app provides numerous advantages, such as simplified deployment, consistent development environments, efficient resource utilization, easy scaling, isolation of dependencies, streamlined collaboration, version control for infrastructure, rapid testing, improved security, seamless integration with CI/CD pipelines, and simplified maintenance across diverse hosting environments.

### RPC Rate Limit handling

In the application, RPC rate limits are managed by storing multiple RPC requests in an array. Interactions with the web3 involve triggering functions for each RPC, utilizing Promise.any to execute the activity with the result from the fastest responding RPC. If all RPCs fail, a retry mechanism is implemented after a set interval to reattempt the requests. This approach optimizes responsiveness by prioritizing the quickest RPC response while ensuring robustness through periodic retries in case of failures.



### Transaction Atomicity

At the database level, transaction atomicity is typically achieved through the use of one-to-one relationships and the implementation of constraints such as unique keys. For instance, a constraint may prevent the creation of a new transaction if a related "ping" table already contains an existing transaction. This ensures that transactions occur atomically and avoids potential conflicts.

In contrast, at the blockchain level, transaction atomicity is maintained through the use of nonces. Each transaction in a block is assigned a unique nonce, a number that prevents replay attacks and ensures the integrity of the blockchain. A nonce is a sequential number that must be unique for each transaction associated with a particular sender's address. Attempting to perform a transaction with the same nonce is not permitted, adding a layer of security and preventing double-spending.

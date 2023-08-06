# Yet Another Kafka

A Kafka-style **publish/subscribe message broker** built from scratch in
Node.js and Express, backed by MongoDB. It implements the core ideas behind
Apache Kafka — topics, producers, consumers, a coordination service, and
broker failover — without any Kafka libraries, to explore how a distributed
streaming system works under the hood.

> **Stack:** Node.js · Express · MongoDB (Mongoose) · distributed systems

## Highlights

- **Topic-based pub/sub** — producers publish messages to a named topic;
  consumers subscribe and receive them in real time.
- **Dynamic per-topic schemas** — each topic gets its own Mongoose model/
  collection created on demand at publish time, so new topics need no schema
  migration or restart.
- **Historical message replay** — a consumer started with `--from-beginning`
  replays every message ever stored for a topic from MongoDB before tailing
  live traffic.
- **Coordination service (mini-zookeeper)** — polls the broker cluster every
  **5 seconds** via a `/healthcheck` endpoint and **rewrites the shared config
  (`.env`)** to point producers/consumers at a healthy broker, routing around
  failed nodes for continuous availability.
- **Multi-broker cluster** — three broker instances run concurrently on
  separate ports with automatic failover (5000 → 5001 → 5002).

## Architecture

```
                 ┌─────────────────────┐
                 │   mini-zookeeper     │  health-polls every 5s,
                 │  (coordination svc)  │  rewrites .env → active broker
                 └──────────┬───────────┘
                            │ /healthcheck
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌────────────┐    ┌────────────┐    ┌────────────┐
   │  broker1   │    │  broker2   │    │  broker3   │   Express + MongoDB
   │   :5000    │    │   :5001    │    │   :5002    │   (one model per topic)
   └─────┬──────┘    └────────────┘    └────────────┘
         │ publish (POST /api/producer)      ▲
         │                                   │ subscribe (/portmessage)
   ┌─────┴──────┐                     ┌──────┴──────┐
   │  producer  │                     │  consumer   │  (--from-beginning
   │   (CLI)    │                     │   (CLI)     │   replays history)
   └────────────┘                     └─────────────┘
```

**Modules**

| Module | Role |
|--------|------|
| `mini-zookeeper/` | Coordination service: 5-second health polling + dynamic `.env` rewriting for broker failover |
| `broker/broker1..3/` | Broker nodes: accept published messages, persist per-topic to MongoDB, fan out to subscribers, serve history |
| `producer/` | CLI client that publishes a message to a topic on the active broker |
| `consumer/` | CLI client that subscribes to a topic and prints messages (optionally from the beginning) |
| `globalobj.js` | In-memory registry mapping each topic to its subscribed consumer ports |

## How it works

1. **Publishing.** The producer sends `POST /api/producer?testtopic=<topic>`
   with a JSON `{ message }`. The broker lazily creates a Mongoose model for
   that topic (`createModelForName`), saves the message, and forwards it to
   every consumer port registered for the topic.
2. **Subscribing.** The consumer registers its port against a topic via
   `GET /portmessage`. With `--from-beginning`, the broker returns all stored
   documents for that topic first (replay); otherwise it receives new messages
   as they arrive.
3. **Coordination & failover.** `mini-zookeeper` pings the brokers in priority
   order every 5 seconds. Whichever broker answers `/healthcheck` first is
   written into `.env` as `BROKERPORT`, so producers and consumers always talk
   to a live broker even if one goes down.

## Prerequisites

- Node.js 16+
- MongoDB running locally at `mongodb://localhost:27017`

## Setup

```bash
npm install
```

## Running

Start MongoDB, then in separate terminals:

```bash
# 1. Start the broker cluster (broker1:5000, broker2:5001, broker3:5002)
npm run start-brokers

# 2. Start the coordination service (health-polls brokers, updates .env)
npm run start-zookeeper
```

Publish a message:

```bash
node producer/producerindex.js TESTTOPIC="myTopic" PORT=8080 "Hello Message"
```

Consume a topic (add `--from-beginning` to replay history):

```bash
node consumer/consumerindex.js TESTTOPIC="myTopic" PORT=8081 --from-beginning
```

## Project structure

```
.
├── mini-zookeeper/      coordination service (health polling + config rewrite)
├── broker/
│   ├── broker1/         broker node on :5000
│   ├── broker2/         broker node on :5001
│   └── broker3/         broker node on :5002
├── producer/            producer CLI
├── consumer/            consumer CLI
├── globalobj.js         topic → subscriber-port registry
├── .env                 BROKERPORT (rewritten by the coordination service)
└── package.json
```

## Notes & limitations

This is an educational clone, not a production broker. The subscriber registry
is in-memory, failover is coordinated through a shared `.env` file rather than
a consensus protocol, and there is no partitioning, replication, or consumer
offset management. Those are the natural next steps for anyone extending it.

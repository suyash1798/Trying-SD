# Trying-SD

## Redis deployment

This workspace includes simple manifests to deploy Redis locally using Docker Compose or to a Kubernetes cluster.

Files added:

- `docker-compose.yml` - runs Redis with persistent volume on Docker.
- `k8s/redis-deployment.yaml` - Kubernetes PVC, Deployment and Service for Redis.

Quick start (Docker Compose):

1. Start Redis:

```bash
docker compose up -d
```

2. Verify Redis is running:

```bash
# Trying-SD

## Redis deployment

This workspace includes simple manifests to deploy Redis locally using Docker Compose or to a Kubernetes cluster.

Files added:

- `docker-compose.yml` - runs Redis with persistent volume on Docker.
- `k8s/redis-deployment.yaml` - Kubernetes PVC, Deployment and Service for Redis.

Quick start (Docker Compose):

1. Start Redis:

```bash
docker compose up -d
```

2. Verify Redis is running:

```bash
docker compose ps
redis-cli ping
```

Quick start (Kubernetes):

1. Apply manifests (requires kubectl + cluster):

```bash
kubectl apply -f k8s/redis-deployment.yaml
kubectl get pods,svc
```

2. Port-forward to test locally:

```bash
kubectl port-forward svc/redis 6379:6379
redis-cli -h 127.0.0.1 ping
```

Notes:
- The Kubernetes PVC uses no storageClassName (empty) to let many local clusters bind with hostPath/backing storage. Adjust for your environment.
- For production, secure Redis (auth, network policies) and tune persistence/replication.

## Kafka deployment

This repo includes a small Docker Compose and Kubernetes manifest to run Kafka + Zookeeper for local development.

Files added:

- `docker-compose.kafka.yml` - Zookeeper and Kafka via Bitnami images, ports 2181 and 9092 exposed.
- `k8s/kafka-cluster.yaml` - minimal StatefulSets for Zookeeper and Kafka with PVC templates.

Quick start (Docker Compose):

```bash
docker compose -f docker-compose.kafka.yml up -d
docker compose -f docker-compose.kafka.yml ps
```

Verify by creating and consuming a topic (using kafka-console-producer/consumer inside the kafka container):

```bash
docker compose -f docker-compose.kafka.yml exec kafka bash
# inside container
kafka-topics.sh --create --topic test --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
kafka-console-producer.sh --topic test --bootstrap-server localhost:9092
# type messages, open another shell and run consumer:
kafka-console-consumer.sh --topic test --bootstrap-server localhost:9092 --from-beginning
```

Quick start (Kubernetes):

```bash
# requires kubectl + cluster
kubectl apply -f k8s/kafka-cluster.yaml
kubectl get pods -l app=kafka -w
kubectl get pods -l app=zookeeper -w
```

For testing, port-forward the Kafka service or run tools inside the pod. StatefulSets create PVCs per pod; if PVCs fail to bind, try a single-node cluster with a compatible storage class or switch to ephemeral storage for practice.


## Local demo: game-service + wallet-service

Two minimal Node.js services were added under `services/`:

- `services/wallet-service` (port 4000): simple in-memory balance store and `/adjust` endpoint.
- `services/game-service` (port 3000): calls wallet-service to debit 10 units on `/play`.

Start both with Docker Compose:

```bash
docker compose -f docker-compose.services.yml up --build -d
```

Try the flow:

```bash
# check balances
curl http://localhost:4000/balance/user-1

# play (debited 10)
curl -X POST -H "Content-Type: application/json" -d '{"userId":"user-1"}' http://localhost:3000/play

# verify balance decreased
curl http://localhost:4000/balance/user-1
```

Notes:
- These services are deliberately tiny for learning. For production you'd add persistence, logging, config, health checks, and tests.

## Make the services live on Kubernetes

These steps assume you have a Kubernetes cluster and `kubectl` configured. For local testing use `k3d` or `kind`.

1. Build container images (from repo root):

```bash
docker build -t suyash1798/wallet-service:latest ./services/wallet-service
docker build -t suyash1798/game-service:latest ./services/game-service
docker build -t suyash1798/mock-frontend:latest ./services/mock-frontend
```

2a. If using a remote registry: push the images:

```bash
docker push suyash1798/wallet-service:latest
docker push suyash1798/game-service:latest
docker push suyash1798/mock-frontend:latest
```

2b. If using a local k3d or kind cluster you can load the images directly (example for k3d):

```bash
# for k3d
k3d image import suyash1798/wallet-service:latest -c k3d-mycluster
k3d image import suyash1798/game-service:latest -c k3d-mycluster
k3d image import suyash1798/mock-frontend:latest -c k3d-mycluster
```

3. Apply the manifests:

```bash
kubectl apply -f k8s/wallet-deployment.yaml
kubectl apply -f k8s/game-and-frontend.yaml
kubectl get deployments,services
```

4. Test the HTTP endpoints (port-forward for local testing):

```bash
kubectl port-forward svc/game-service 3000:3000
curl -X POST -H "Content-Type: application/json" -d '{"userId":"user-1"}' http://127.0.0.1:3000/play
```

Notes:
- The manifests reference images under `suyash1798/*:latest`. Replace with your registry or image names.
- For production use, add readiness/liveness probes, proper resource limits/requests, secure image registry credentials, and an ingress/ingress controller to expose services externally.



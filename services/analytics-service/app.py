import json
import os
import threading
import time
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable


KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "game-events")
GROUP_ID = os.getenv("KAFKA_GROUP_ID", "analytics-service")
LOG_INTERVAL_SECONDS = int(os.getenv("LOG_INTERVAL_SECONDS", "10"))
HTTP_PORT = int(os.getenv("PORT", "9000"))


class SpinAnalytics:
    def __init__(self):
        self.by_game = defaultdict(lambda: {"spins": 0, "betAmount": 0, "winAmount": 0})
        self.last_log_at = time.time()
        self.lock = threading.Lock()

    def record(self, event):
        if event.get("type") != "spin_completed":
            return

        payload = event.get("payload", {})
        game_id = payload.get("gameId", "unknown")

        with self.lock:
            stats = self.by_game[game_id]
            stats["spins"] += 1
            stats["betAmount"] += int(payload.get("betAmount", 0))
            stats["winAmount"] += int(payload.get("winAmount", 0))

    def snapshot(self):
        with self.lock:
            return {
                game_id: dict(stats)
                for game_id, stats in self.by_game.items()
            }

    def log_if_due(self):
        now = time.time()

        if now - self.last_log_at < LOG_INTERVAL_SECONDS:
            return

        self.last_log_at = now
        print(json.dumps({
            "event": "analytics_snapshot",
            "service": "analytics-service",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "games": self.snapshot()
        }), flush=True)


class AnalyticsHttpHandler(BaseHTTPRequestHandler):
    analytics = None

    def do_GET(self):
        if self.path == "/":
            self.respond({"status": "ok", "service": "analytics-service"})
            return

        if self.path == "/stats":
            self.respond({
                "service": "analytics-service",
                "topic": KAFKA_TOPIC,
                "games": self.analytics.snapshot()
            })
            return

        self.respond({"error": "not found"}, status=404)

    def log_message(self, format, *args):
        return

    def respond(self, body, status=200):
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def start_http_server(analytics):
    AnalyticsHttpHandler.analytics = analytics
    server = ThreadingHTTPServer(("0.0.0.0", HTTP_PORT), AnalyticsHttpHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    print(json.dumps({
        "event": "analytics_http_started",
        "service": "analytics-service",
        "port": HTTP_PORT
    }), flush=True)


def create_consumer():
    return KafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKERS.split(","),
        group_id=GROUP_ID,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )


def wait_for_consumer():
    while True:
        try:
            return create_consumer()
        except NoBrokersAvailable:
            print(json.dumps({
                "event": "kafka_unavailable",
                "service": "analytics-service",
                "brokers": KAFKA_BROKERS
            }), flush=True)
            time.sleep(2)


def main():
    analytics = SpinAnalytics()
    start_http_server(analytics)
    consumer = wait_for_consumer()

    print(json.dumps({
        "event": "analytics_started",
        "service": "analytics-service",
        "topic": KAFKA_TOPIC,
        "brokers": KAFKA_BROKERS
    }), flush=True)

    for message in consumer:
        analytics.record(message.value)
        analytics.log_if_due()


if __name__ == "__main__":
    main()

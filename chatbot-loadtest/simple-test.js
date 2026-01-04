import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 5 }, // Start with 5 users
    { duration: "20s", target: 10 }, // Increase to 10 users
    { duration: "10s", target: 0 }, // Ramp down
  ],
};

const queries = ["Cho tôi xem sản phẩm mới nhất", "Tìm áo sơ mi"];

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)];

  const response = http.post(
    "http://localhost:5001/api/chatbot/chat",
    JSON.stringify({ message: query }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(response, {
    "status 200": (r) => r.status === 200,
    "has response": (r) => r.body.length > 0,
  });

  sleep(1);
}

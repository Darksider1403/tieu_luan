import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m', target: 20 },    // Increase gradually
    { duration: '2m', target: 30 },    // Hold at 30
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};

const queries = [
  "Cho tôi xem sản phẩm mới nhất",
  "Tìm áo sơ mi nam",
  "Có quần jean nữ không?",
];

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)];
  
  const response = http.post(
    'http://localhost:5001/api/chatbot/chat',
    JSON.stringify({ message: query }),
    { 
      headers: { 'Content-Type': 'application/json' },
      timeout: '60s',
    }
  );

  check(response, {
    'status 200': (r) => r.status === 200,
    'no timeout': (r) => r.status !== 0,
  });

  sleep(Math.random() * 5 + 3); // 3-8 seconds think time
}
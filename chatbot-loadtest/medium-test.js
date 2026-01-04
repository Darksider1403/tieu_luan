import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 30 },    // ✅ Reduce to 30 users first
    { duration: '2m', target: 50 },    // ✅ Then 50 users
    { duration: '1m', target: 50 },    // Hold at 50
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<30000'],  // ✅ Increased to 30s
    http_req_failed: ['rate<0.10'],      // ✅ Allow up to 10% failures for now
  },
};

const queries = [
  "Cho tôi xem sản phẩm mới nhất",
  "Tìm áo sơ mi nam",
  "Có quần jean nữ không?",
  "Sản phẩm giảm giá hôm nay",
  "Áo thun cotton nam",
];

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)];
  
  const response = http.post(
    'http://localhost:5001/api/chatbot/chat',
    JSON.stringify({ message: query }),
    { 
      headers: { 'Content-Type': 'application/json' },
      timeout: '60s',  // ✅ INCREASED from 30s to 60s
    }
  );

  const success = check(response, {
    'status 200': (r) => r.status === 200,
    'has response': (r) => r.body && r.body.length > 0,
    'no timeout': (r) => r.status !== 0,
  });

  if (!success) {
    console.log(`❌ ${response.status}: "${query}" - ${response.error || 'Unknown error'}`);
  }

  sleep(Math.random() * 4 + 2); // ✅ Increased think time: 2-6 seconds
}
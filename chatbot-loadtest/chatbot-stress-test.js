import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Custom metrics
const errorRate = new Rate("errors");
const productSearchDuration = new Trend("product_search_duration");
const azureOpenAIDuration = new Trend("azure_openai_duration");

// Test configuration
export const options = {
  stages: [
    // Ramp-up stages
    { duration: "30s", target: 50 }, // Warm up: 0 → 50 users
    { duration: "1m", target: 100 }, // Ramp up: 50 → 100 users
    { duration: "2m", target: 200 }, // Sustained: 200 users
    { duration: "1m", target: 500 }, // Spike: 200 → 500 users
    { duration: "30s", target: 500 }, // Hold spike
    { duration: "1m", target: 100 }, // Recovery: 500 → 100 users
    { duration: "30s", target: 0 }, // Ramp down: 100 → 0 users
  ],

  // Performance thresholds
  thresholds: {
    http_req_duration: ["p(95)<3000"], // 95% requests under 3s
    "http_req_duration{name:chat}": ["p(99)<5000"], // 99% chat requests under 5s
    errors: ["rate<0.05"], // Error rate under 5%
    http_req_failed: ["rate<0.1"], // HTTP failures under 10%
  },
};

// Test data - Vietnamese product search queries
const searchQueries = [
  "Cho tôi xem sản phẩm mới nhất",
  "Tìm áo sơ mi nam",
  "Có quần jean nữ không?",
  "Sản phẩm giảm giá hôm nay",
  "Áo thun cotton nam",
  "Váy đầm công sở nữ",
  "Giày sneaker thể thao",
  "Túi xách da cao cấp",
  "Áo khoác nam mùa đông",
  "Quần short nữ mùa hè",
  "Phụ kiện thời trang",
  "Áo polo nam",
  "Đầm dự tiệc sang trọng",
  "Giày cao gót nữ",
  "Quần tây công sở",
];

const generalQueries = [
  "Chính sách đổi trả như thế nào?",
  "Thời gian giao hàng bao lâu?",
  "Tôi có thể thanh toán COD không?",
  "Làm sao để kiểm tra đơn hàng?",
];

// Base URL - CHANGE THIS to your actual API URL
const BASE_URL = "http://localhost:5001";

export default function testChatbot() {
  // 80% product searches, 20% general queries
  const isProductSearch = Math.random() < 0.8;
  const query = isProductSearch
    ? searchQueries[Math.floor(Math.random() * searchQueries.length)]
    : generalQueries[Math.floor(Math.random() * generalQueries.length)];

  const url = `${BASE_URL}/api/chatbot/chat`;
  const payload = JSON.stringify({
    message: query,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "chat" },
  };

  // Send request
  const startTime = new Date().getTime();
  const response = http.post(url, payload, params);
  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  // Track custom metrics
  if (isProductSearch) {
    productSearchDuration.add(duration);
  }

  // Validate response
  const checkResult = check(response, {
    "status is 200": (r) => r.status === 200,
    "status is not 500": (r) => r.status !== 500,
    "response has body": (r) => r.body && r.body.length > 0,
    "response time < 5s": (r) => r.timings.duration < 5000,
    "response is JSON": (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
    "success is true": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
    "response contains text": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.response && body.response.length > 10;
      } catch (e) {
        return false;
      }
    },
  });

  // Track errors
  if (!checkResult || response.status !== 200) {
    errorRate.add(1);
    console.log(`❌ Error: Status ${response.status}, Query: "${query}"`);
  } else {
    errorRate.add(0);
  }

  // Log slow requests
  if (duration > 3000) {
    console.log(`⚠️ Slow request: ${duration}ms for query: "${query}"`);
  }

  // Simulate user reading response (think time)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Generate HTML report at end of test
export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

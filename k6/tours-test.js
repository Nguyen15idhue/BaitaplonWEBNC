import http from 'k6/http';
import { check } from 'k6';

// M10/NFR: GET /api/tours ở ~1000 req/phút trong 2 phút (tổng ~2000 request).
// constant-arrival-rate giữ đúng tải mục tiêu, không phụ thuộc tốc độ vòng lặp.
export const options = {
  scenarios: {
    tours_1000rpm: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1m',
      duration: '2m',
      preAllocatedVUs: 30,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:5000/api/tours?page=1&pageSize=12');
  check(res, {
    'status 200': (r) => r.status === 200,
    'p95 < 500ms': (r) => r.timings.duration < 500,
  });
}

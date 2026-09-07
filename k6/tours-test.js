import http from 'k6/http';
import { check } from 'k6';

// B5 NFR: GET /api/tours < 500ms ở tải ~1000 req/phút trong 2 phút.
// 30 VUs x ~1 req/1.8s ≈ 1000 req/phút.
export const options = {
  vus: 30,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get('http://localhost:5000/api/tours?page=1&pageSize=12');
  check(res, {
    'status 200': (r) => r.status === 200,
    'p95 < 500ms': (r) => r.timings.duration < 500,
  });
}

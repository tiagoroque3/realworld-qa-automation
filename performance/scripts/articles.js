import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  vus: __ENV.PERF_VUS || 100,
  duration: __ENV.PERF_DURATION || '30s',
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.1'],             // error rate should be below 10%
  },
};

const API_URL = __ENV.PERF_BASE_URL || 'https://api.realworld.io/api';
const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'demo@example.com',
  password: __ENV.TEST_PASSWORD || 'demo123',
};

export function setup() {
  // Login to get the auth token
  const loginRes = http.post(`${API_URL}/users/login`, JSON.stringify({
    user: TEST_USER
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  return {
    token: loginRes.json('user.token'),
  };
}

export default function(data) {
  const headers = {
    'Authorization': `Token ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Create an article
  const articleData = {
    article: {
      title: `Performance Test Article ${Date.now()}`,
      description: 'This is a test article for performance testing',
      body: 'Article body content goes here...',
      tagList: ['performance', 'test'],
    },
  };

  const createRes = http.post(
    `${API_URL}/articles`,
    JSON.stringify(articleData),
    { headers }
  );

  check(createRes, {
    'article created': (r) => r.status === 200,
    'has correct title': (r) => r.json('article.title') === articleData.article.title,
  });

  errorRate.add(createRes.status !== 200);

  sleep(1); // Wait 1s between iterations
}
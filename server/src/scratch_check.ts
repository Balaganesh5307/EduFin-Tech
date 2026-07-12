import http from 'http';

// 1. First login as student to get a valid signed token
const loginData = JSON.stringify({
  email: 'student@edufin.edu',
  password: 'password123'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log('Login status:', res.statusCode);
      if (parsed.accessToken) {
        // 2. Hit /api/dashboard with the token
        const token = parsed.accessToken;
        const dashReq = http.request({
          hostname: 'localhost',
          port: 5000,
          path: '/api/dashboard',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }, (dashRes) => {
          let dashBody = '';
          dashRes.on('data', (chunk) => dashBody += chunk);
          dashRes.on('end', () => {
            console.log('Dashboard status:', dashRes.statusCode);
            console.log('Dashboard response:', dashBody);
          });
        });
        dashReq.on('error', (err) => console.error('Dashboard request error:', err));
        dashReq.end();
      } else {
        console.error('No token returned:', parsed);
      }
    } catch (e) {
      console.error('Failed to parse login response:', body, e);
    }
  });
});

req.on('error', (err) => {
  console.error('Login request error:', err);
});
req.write(loginData);
req.end();

const http = require('http');

let server = null;
let getSessionFn = null;
let clearCacheFn = null;

function startCookieServer(port = 9876, getSession, clearCache) {
  if (server) return;
  getSessionFn = getSession;
  clearCacheFn = clearCache;

  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/sync-cookies') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { cookies } = JSON.parse(body);
          const result = await syncCookies(cookies);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (e) {
          console.error('同步失败:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/clear-cache') {
      try {
        if (clearCacheFn) {
          await clearCacheFn();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Cookie 同步服务已启动: http://127.0.0.1:${port}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用`);
    } else {
      console.error('Cookie 同步服务启动失败:', e);
    }
    server = null;
  });
}

async function syncCookies(cookies) {
  const ses = getSessionFn ? getSessionFn() : null;
  if (!ses) {
    throw new Error('无法获取 session');
  }

  console.log(`收到 ${cookies.length} 个 cookie`);

  let synced = 0;
  let failed = 0;

  for (const cookie of cookies) {
    try {
      const domain = cookie.domain || '';
      const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
      const path = cookie.path || '/';
      const secure = cookie.secure || false;
      const url = (secure ? 'https://' : 'http://') + cleanDomain + path;

      const cookieDetails = {
        url: url,
        name: cookie.name,
        value: cookie.value,
        path: path,
        secure: secure,
        httpOnly: cookie.httpOnly || false
      };

      if (cookie.expirationDate && cookie.expirationDate > 0) {
        cookieDetails.expirationDate = cookie.expirationDate;
      }

      await ses.cookies.set(cookieDetails);
      synced++;
    } catch (e) {
      failed++;
    }
  }

  console.log(`同步完成: 成功 ${synced}, 失败 ${failed}`);
  return { synced, failed, total: cookies.length };
}

function stopCookieServer() {
  if (server) {
    server.close();
    server = null;
  }
}

module.exports = {
  startCookieServer,
  stopCookieServer
};

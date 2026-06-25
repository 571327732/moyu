const SYNC_URL = 'http://127.0.0.1:9876/sync-cookies';
const CLEAR_URL = 'http://127.0.0.1:9876/clear-cache';

document.getElementById('syncBtn').addEventListener('click', async () => {
  const btn = document.getElementById('syncBtn');
  const status = document.getElementById('status');

  btn.disabled = true;
  status.textContent = '正在获取 Cookie...';
  status.className = '';

  try {
    const cookies = await chrome.cookies.getAll({});

    if (cookies.length === 0) {
      status.textContent = '没有找到 Cookie';
      status.className = 'error';
      btn.disabled = false;
      return;
    }

    status.textContent = `正在同步 ${cookies.length} 个 Cookie...`;

    const response = await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookies })
    });

    const result = await response.json();

    if (result.success) {
      status.innerHTML = `同步完成！共 ${result.synced} 个<br><small>请在摸鱼应用中清除缓存后访问</small>`;
      status.className = 'success';
    } else {
      status.textContent = result.error || '同步失败';
      status.className = 'error';
    }
  } catch (e) {
    status.textContent = '无法连接到摸鱼应用，请确保应用正在运行';
    status.className = 'error';
  }

  btn.disabled = false;
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');

  try {
    await fetch(CLEAR_URL, { method: 'POST' });
    status.textContent = '缓存已清除，请重新访问网站';
    status.className = 'success';
  } catch (e) {
    status.textContent = '无法连接到摸鱼应用';
    status.className = 'error';
  }
});

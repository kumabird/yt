'use strict';
const express = require('express');
const app = express();
// ── CORS & 埋め込み許可設定 ────────────────────────────────────
app.use(function(req, res, next) {
  // ブラウザに古い制限を無視させるため、既存のヘッダーを一度消去
  res.removeHeader('X-Frame-Options');
  
  // 代わりに現代的な埋め込み許可（CSP）を設定
  // 'self'（自分）と *（すべての外部サイト）からの埋め込みを許可
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *;");
  
  // 念のため、古いブラウザ用に ALLOWALL もセット
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  
  next();
});
const PORT = process.env.PORT || 3000;

// ── 動画IDバリデーション ─────────────────────────────────────
function isValidVideoId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_\-]{6,15}$/.test(id);
}

// ── HTML生成（nocookie埋め込み） ────────────────────────────
function buildPlayerHTML(videoId) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1`;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MusicViewer</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  #frame-wrap {
    position: relative; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
  }
  iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: none;
  }
</style>
</head>
<body>
<div id="frame-wrap">
  <iframe
    src="${embedUrl}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</div>
<script>
// 親ウィンドウへ準備完了を通知
(function() {
  function notify(data) {
    try {
      if (window.parent && window.parent !== window)
        window.parent.postMessage(Object.assign({ from: 'musicviewer' }, data), '*');
    } catch(e) {}
  }
  notify({ type: 'ready', videoId: '${videoId}' });

  // postMessage で次の動画IDを受け取る → 親がiframe.srcを書き換える前提だが
  // 念のためメッセージ受信も実装
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.from === 'musicviewer') return;
    if (e.data.type === 'play' && e.data.videoId) {
      // src書き換えで対応（リロード）
      window.location.href = '/?v=' + e.data.videoId;
    }
  });
})();
</script>
</body>
</html>`;
}

// ── 待機画面（動画ID未指定） ────────────────────────────────
function buildIdleHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MusicViewer</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  .idle {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
  }
  .idle-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: linear-gradient(135deg,#1a1a1a,#0a0a0a);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px;
  }
  .idle-text { font-size: 13px; color: rgba(255,255,255,0.45); }
</style>
</head>
<body>
<div class="idle">
  <div class="idle-icon">&#9835;</div>
  <div class="idle-text">曲を選択してください</div>
</div>
<script>
window.addEventListener('message', function(e) {
  if (!e.data || e.data.from === 'musicviewer') return;
  if (e.data.type === 'play' && e.data.videoId) {
    window.location.href = '/?v=' + e.data.videoId;
  }
});
</script>
</body>
</html>`;
}

// ── ルート ──────────────────────────────────────────────────
// GET /?v=VIDEOID  または  GET /VIDEOID  の両方に対応
app.get('/', function(req, res) {
  const videoId = req.query.v || req.query.id || '';
  if (!isValidVideoId(videoId)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(buildIdleHTML());
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildPlayerHTML(videoId));
});

app.get('/:videoId', function(req, res) {
  const videoId = req.params.videoId || '';
  if (!isValidVideoId(videoId)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(buildIdleHTML());
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildPlayerHTML(videoId));
});

// ── ヘルスチェック ────────────────────────────────────────
app.get('/health', function(req, res) {
  res.json({ ok: true, ts: Date.now() });
});

app.listen(PORT, function() {
  console.log('MusicViewer server listening on port ' + PORT);
});

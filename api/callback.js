// Decap CMS GitHub OAuth - step 2: exchange the code for a token and hand it
// back to the Decap admin window using its postMessage protocol.
module.exports = async (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const query = new URL(req.url, 'https://www.hausamusics.com').searchParams;
  const code = query.get('code');
  const state = query.get('state');
  const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('cms_oauth_state='));
  const savedState = cookie ? cookie.split('=')[1] : '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!clientId || !clientSecret) { res.status(500).send('Admin login is not configured yet (missing Vercel environment variables).'); return; }
  if (!code) { res.status(400).send('Missing code from GitHub. Please try logging in again.'); return; }
  if (!state || state !== savedState) { res.status(400).send('Security check failed (state mismatch). Please try logging in again.'); return; }
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: code, redirect_uri: 'https://www.hausamusics.com/api/callback' })
    });
    const data = await r.json();
    if (!data.access_token) { res.status(401).send('GitHub login failed: ' + (data.error_description || data.error || 'unknown error')); return; }
    const payload = JSON.stringify(JSON.stringify({ token: data.access_token, provider: 'github' }));
    res.status(200).send('<!doctype html><html><body><p>Login successful - you can close this window.</p><script>' +
      '(function(){' +
      'function receiveMessage(e){window.opener.postMessage(\'authorization:github:success:\' + ' + payload + ', e.origin);}' +
      'window.addEventListener("message", receiveMessage, false);' +
      'window.opener.postMessage("authorizing:github", "*");' +
      '})();' +
      '</script></body></html>');
  } catch (e) {
    res.status(502).send('Could not reach GitHub to finish login. Please try again.');
  }
};

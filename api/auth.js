// Decap CMS GitHub OAuth - step 1: send the user to GitHub to log in.
// Needs env vars in Vercel: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET
const crypto = require('crypto');
module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId) {
    res.status(500).send('Admin login is not configured yet. The site owner must finish the one-time CMS setup (GitHub OAuth app + Vercel environment variables).');
    return;
  }
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  // Sign the state with the client secret so the callback can verify it even
  // if the state cookie is missing, blocked or overwritten by a second login
  // attempt (cookie-only checks caused "state mismatch" failures).
  let state = rand;
  if (clientSecret) {
    const sig = crypto.createHmac('sha256', clientSecret).update(rand).digest('hex').slice(0, 32);
    state = rand + '.' + sig;
  }
  res.setHeader('Set-Cookie', 'cms_oauth_state=' + state + '; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=1800');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: 'https://www.hausamusics.com/api/callback',
    scope: 'repo user',
    state: state
  });
  res.writeHead(302, { Location: 'https://github.com/login/oauth/authorize?' + params.toString() });
  res.end();
};

// Decap CMS GitHub OAuth - step 1: send the user to GitHub to log in.
// Needs env vars in Vercel: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET
module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('Admin login is not configured yet. The site owner must finish the one-time CMS setup (GitHub OAuth app + Vercel environment variables).');
    return;
  }
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  res.setHeader('Set-Cookie', 'cms_oauth_state=' + state + '; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: 'https://www.hausamusics.com/api/callback',
    scope: 'repo user',
    state: state
  });
  res.writeHead(302, { Location: 'https://github.com/login/oauth/authorize?' + params.toString() });
  res.end();
};

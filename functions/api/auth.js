export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      'Missing GitHub OAuth environment variables. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Cloudflare Pages -> Settings -> Environment variables.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  if (!code) {
    const redirectUri = `${url.origin}/api/auth`;
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', 'repo');
    githubAuthUrl.searchParams.set('allow_signup', 'false');
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return new Response(`Failed to exchange GitHub code for access token: ${errorText}`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  let data;
  try {
    data = await tokenResponse.json();
  } catch (error) {
    const errorText = await tokenResponse.text();
    return new Response(`Failed to parse GitHub token response: ${errorText}`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (data.error || !data.access_token) {
    return new Response(`Auth failed: ${data.error_description || data.error || 'unknown'}`, {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });
  const successMessage = `authorization:github:success:${payload}`;
  const errorMessage = `authorization:github:error:${JSON.stringify({ message: 'Unable to get GitHub access token' })}`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>GitHub Authorization</title>
  </head>
  <body>
    <p>Completing GitHub authorization...</p>
    <script>
      const targetOrigin = window.location.origin;
      const openerWindow = window.opener;
      const payload = ${JSON.stringify(payload)};
      const successMessage = ${JSON.stringify(successMessage)};
      const errorMessage = ${JSON.stringify(errorMessage)};

      function sendMessage() {
        if (!openerWindow || openerWindow.closed) {
          document.body.innerText = 'Authorization complete. Please close this window and return to the CMS.';
          return;
        }

        openerWindow.postMessage('authorizing:github', targetOrigin);
      }

      function handleMessage(event) {
        if (event.origin !== targetOrigin || event.data !== 'authorizing:github') {
          return;
        }

        window.removeEventListener('message', handleMessage);
        openerWindow.postMessage(successMessage, targetOrigin);
        window.close();
      }

      window.addEventListener('message', handleMessage);
      sendMessage();
      setTimeout(sendMessage, 500);
      setTimeout(sendMessage, 1000);
      setTimeout(() => {
        document.body.innerText = 'Authorization complete. If this window does not close automatically, please close it manually.';
      }, 2000);
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      "Missing GitHub OAuth environment variables. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Cloudflare Pages -> Settings -> Environment variables.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  // 第一步：没有 code，跳转到 GitHub 授权
  if (!code) {
    const redirectUri = url.origin + "/api/auth";
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.set("client_id", clientId);
    githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
    githubAuthUrl.searchParams.set("scope", "public_repo");
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  // 第二步：用 code 换 token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    })
  });

  if (!tokenResponse.ok) {
    return new Response("Failed to exchange GitHub code for access token", { status: 502 });
  }

  const data = await tokenResponse.json();

  if (data.error || !data.access_token) {
    return new Response("Auth failed: " + (data.error_description || data.error || "unknown"), { status: 400 });
·  }

  // 第三步：通过 postMessage 将 token 发回给 Decap CMS
  // 消息格式必须是字符串：authorization:github:success:{json}
  const message = JSON.stringify({ token: data.access_token, provider: "github" });
  const postMessageStr = "authorization:github:success:" + message;
  const scriptContent = [
    "try {",
    "  if (window.opener) {",
    "    window.opener.postMessage(" + JSON.stringify(postMessageStr) + ", '*');",
    "  }",
    "} catch (e) {}",
    "window.close();"
  ].join("\n");
  const html = '<!DOCTYPE html><html><head><title>Auth</title></head><body><script>'
    + scriptContent + '<\/script></body></html>';

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}

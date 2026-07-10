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
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    }).toString()
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return new Response("Failed to exchange GitHub code for access token: " + errorText, { status: 502 });
  }

  let data;
  try {
    data = await tokenResponse.json();
  } catch (error) {
    const errorText = await tokenResponse.text();
    return new Response("Failed to parse GitHub token response: " + errorText, { status: 502 });
  }

  if (data.error || !data.access_token) {
    return new Response("Auth failed: " + (data.error_description || data.error || "unknown"), { status: 400 });
  }

  // 第三步：将 token 编码到 URL hash 中并重定向回 admin 页面
  const token = data.access_token;
  const message = JSON.stringify({ token: token, provider: "github" });
  const encodedMessage = encodeURIComponent(btoa(message));
  const redirectUrl = url.origin + "/admin/#authorization:github:success:" + encodedMessage;
  
  return Response.redirect(redirectUrl, 302);
}

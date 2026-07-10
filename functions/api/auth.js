export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // 第一步：没有 code，跳转到 GitHub 授权
  if (!code) {
    const clientId = env.GITHUB_CLIENT_ID;
    const redirectUri = "https://" + url.hostname + "/api/auth";
    const githubAuthUrl = "https://github.com/login/oauth/authorize?client_id=" 
      + clientId + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&scope=repo";
    return Response.redirect(githubAuthUrl, 302);
  }

  // 第二步：用 code 换 token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  const data = await tokenResponse.json();

  if (data.error || !data.access_token) {
    return new Response("Auth failed: " + (data.error_description || data.error || "unknown"), { status: 400 });
  }

  // 第三步：通过 postMessage 将 token 发回给 Decap CMS
  // 消息格式必须是字符串：authorization:github:success:{json}
  var message = JSON.stringify({ token: data.access_token, provider: "github" });
  var postMessageStr = "authorization:github:success:" + message;
  var scriptContent = "window.opener.postMessage(" + JSON.stringify(postMessageStr) + ", '*'); window.close();";
  var html = '<!DOCTYPE html><html><head><title>Auth</title></head><body><script>' 
    + scriptContent + '<\/script></body></html>';

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}

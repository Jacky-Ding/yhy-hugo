// 确保文件位于项目的 `static` 目录下
export default {
  // 必须使用 fetch 方法作为入口点
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- 1. 处理 OAuth API 路由 ---

    // 发起 GitHub OAuth 请求
    if (path === "/api/auth") {
      // 从 Pages 环境变量中读取凭证
      const clientId = env.GITHUB_CLIENT_ID;
      if (!clientId) {
        console.error("Missing GITHUB_CLIENT_ID environment variable.");
        return new Response("Server configuration error.", { status: 500 });
      }
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&redirect_uri=${url.origin}/api/callback`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // 处理 GitHub OAuth 回调
    if (path === "/api/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Bad Request: Missing 'code' parameter.", { status: 400 });
      }

      const clientId = env.GITHUB_CLIENT_ID;
      const clientSecret = env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        console.error("Missing GitHub OAuth environment variables.");
        return new Response("Server configuration error.", { status: 500 });
      }

      try {
        // 用 code 换取 access_token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: code }),
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error("GitHub Token Error:", tokenData);
          return new Response(`OAuth Error: ${tokenData.error_description}`, { status: 500 });
        }

        const accessToken = tokenData.access_token;

        // 返回一个会自动关闭的 HTML 页面，并通过 postMessage 将 token 传回父窗口
        const htmlContent = `<!DOCTYPE html>
        <html><body>
        <script>
          const token = "${accessToken}";
          console.log("OAuth popup: Token received.");
          if (token && window.opener) {
            window.opener.postMessage({ token: token, provider: "github" }, "*");
            setTimeout(() => window.close(), 500);
          } else {
            document.body.innerText = "Error: No token or no opener found.";
          }
        </script>
        </body></html>`;

        return new Response(htmlContent, { headers: { "Content-Type": "text/html" } });
      } catch (err) {
        console.error("Callback Exception:", err);
        return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
      }
    }

    // --- 2. 至关重要：将所有非 API 请求交还给 Pages 处理 ---
    // 这样网站和 admin 页面才能正常访问
    return env.ASSETS.fetch(request);
  },
};

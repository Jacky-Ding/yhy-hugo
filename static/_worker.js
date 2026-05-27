export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- 优先处理 OAuth API 请求 ---
    // 处理 /api/auth
    if (path === "/api/auth") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${url.origin}/api/callback`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // 处理 /api/callback
    if (path === "/api/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Bad Request: Missing 'code' parameter.", { status: 400 });
      }

      try {
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code,
          }),
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error("GitHub Token Error:", tokenData);
          return new Response(`OAuth Error: ${tokenData.error_description}`, { status: 500 });
        }

        const accessToken = tokenData.access_token;

        const htmlContent = `<!DOCTYPE html>
            <html><body>
            <script>
                const token = "${accessToken}";
                if (token && window.opener) {
                    window.opener.postMessage({ token: token, provider: "github" }, "*");
                }
                setTimeout(() => window.close(), 300);
            </script>
            </body></html>`;

        return new Response(htmlContent, {
          headers: { "Content-Type": "text/html" },
        });
      } catch (err) {
        console.error("Callback Exception:", err);
        return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
      }
    }

    // --- 回退给 Pages 处理所有其他请求（这是关键！）---
    // 处理所有非 API 请求，确保网站的正常访问
    return env.ASSETS.fetch(request);
  },
};

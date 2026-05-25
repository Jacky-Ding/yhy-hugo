export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return new Response('Bad request: no code', { status: 400 });

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });
    const result = await response.json();
    if (result.error) {
      return new Response(`OAuth Error: ${result.error_description}`, { status: 500 });
    }

    const token = result.access_token;

    const html = `
      <!DOCTYPE html>
      <html>
      <body>
      <script>
        // Decap CMS / Netlify CMS 默认读取的 key
        localStorage.setItem('netlify-cms-oauth-token', '${token}');
        // 备选（兼容旧版）
        localStorage.setItem('decap-cms-oauth-token', '${token}');
        if (window.opener) {
          window.opener.postMessage({ token: '${token}', provider: 'github' }, '*');
        }
        setTimeout(() => {
          window.close();
          document.body.innerText = '登录成功，请手动关闭此窗口并刷新管理页面。';
        }, 300);
      </script>
      </body>
      </html>
    `;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}

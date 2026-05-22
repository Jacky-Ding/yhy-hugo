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
    // 将 token 同时写入父窗口和自己的 localStorage，然后关闭窗口
    const html = `
      <html><body><script>
        (function() {
          if (window.opener) {
            window.opener.localStorage.setItem('decap-cms-github-token', '${token}');
            window.opener.postMessage({ token: '${token}', provider: 'github' }, '*');
          }
          localStorage.setItem('decap-cms-github-token', '${token}');
          window.close();
          setTimeout(function() {
            document.body.innerText = '登录成功，请手动关闭此窗口并刷新管理页面。';
          }, 500);
        })();
      </script></body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}

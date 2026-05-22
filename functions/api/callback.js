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
    if (result.error) throw new Error(result.error_description);

    const html = `
      <html><body><script>
        (function() {
          const token = '${result.access_token}';
          if (window.opener && token) {
            window.opener.postMessage({ token, provider: 'github' }, '*');
            window.close();
          } else {
            document.body.innerText = 'Authorization successful. You can close this window.';
          }
        })();
      </script></body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}

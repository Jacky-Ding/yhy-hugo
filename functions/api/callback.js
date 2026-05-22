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
    
    // 调试：直接显示整个响应
    return new Response(`<pre>${JSON.stringify(result, null, 2)}</pre>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(`<pre>Error: ${error.message}</pre>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

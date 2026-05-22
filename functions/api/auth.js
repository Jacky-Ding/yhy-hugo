export async function onRequest(context) {
  const { env } = context;
  const clientId = env.GITHUB_CLIENT_ID || '未设置环境变量';
  return new Response(`当前读取到的 Client ID：${clientId}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

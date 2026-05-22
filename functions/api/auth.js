export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${url.origin}/api/callback`;
  return Response.redirect(redirectUrl, 302);
}

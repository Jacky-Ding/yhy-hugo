/**
 * Cloudflare Pages Functions — 根路径语言分流
 *
 * 为什么放在这里而不是前端 JS：
 * 原来那段跳转脚本挂在 layouts/partials/head.html 里，但根路径 "/" 是 Hugo
 * 生成的 alias 页（只有一条 meta refresh），根本不会加载我们的模板，
 * 所以那段 JS 从来没有真正执行过。
 *
 * 用边缘中间件做 302 有三个好处：
 *   1. 服务端决策，用户不会看到白屏闪烁
 *   2. 搜索引擎拿到明确的 302 信号而不是 200 + meta refresh
 *   3. 不占用 Cloudflare 的 Redirect Rules 配额（也就不用额外权限）
 *
 * 分流规则：俄语优先 → 中文 → 其余走英文，与 hreflang 的 x-default 保持一致。
 */

const LANGS = ["zh", "en", "ru"];
const FALLBACK = "/en/";

function pickLanguage(acceptLanguage, cookieLang) {
  // 1) 用户手动切换过语言，优先尊重（cookie 由前端写入）
  if (cookieLang && LANGS.includes(cookieLang)) return cookieLang;

  const al = (acceptLanguage || "").toLowerCase();
  if (!al) return null;

  // 2) 按 q 值排序，取第一个能识别的语言
  const parts = al
    .split(",")
    .map((s) => {
      const [tag, ...params] = s.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim(), q: q ? parseFloat(q.split("=")[1]) : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("ru")) return "ru";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 只处理根路径，其余原样放行
  if (url.pathname !== "/") return context.next();

  const cookieLang = (context.request.headers.get("cookie") || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("yhy_lang="))
    ?.split("=")[1];

  const lang = pickLanguage(context.request.headers.get("accept-language"), cookieLang);
  const target = lang ? `/${lang}/` : FALLBACK;

  return Response.redirect(new URL(target, url.origin).toString(), 302);
}

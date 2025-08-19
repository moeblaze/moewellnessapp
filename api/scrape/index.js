
const ALLOW = ['alibaba.com','wholesaler.alibaba.com','m.alibaba.com','chinese.alibaba.com'];
function allowed(url){
  try {
    const u = new URL(url);
    return ['http:','https:'].includes(u.protocol) && ALLOW.some(h => u.hostname.endsWith(h));
  } catch { return false; }
}
function cors(res){ 
  res.headers = Object.assign({}, res.headers||{}, {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type'
  });
  return res;
}
async function fetchHtml(url){
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 MoeWellnessBot' } });
  const text = await r.text();
  return text;
}
function extract(meta, prop){
  const re = new RegExp(`<meta[^>]+property=[\"']${prop}[\"'][^>]+content=[\"']([^\"]+)`, 'i');
  const m = meta.match(re);
  return m ? m[1] : null;
}
module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') { context.res = cors({ status: 200 }); return; }
  const url = req.query.url;
  if (!url || !allowed(url)) {
    context.res = cors({ status: 400, body: { error: 'Invalid or disallowed URL' } });
    return;
  }
  try {
    const html = await fetchHtml(url);
    const head = (html.match(/<head[\s\S]*?<\/head>/i)||[])[0] || html;
    const image = extract(head, 'og:image') || extract(head, 'twitter:image') || null;
    const title = extract(head, 'og:title') || (head.match(/<title>([^<]+)<\/title>/i)||[])[1] || null;
    context.res = cors({ status: 200, headers: { 'content-type':'application/json' }, body: { url, title, image } });
  } catch (e) {
    context.log.error(e);
    context.res = cors({ status: 500, body: { error: e.message } });
  }
}

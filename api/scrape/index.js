
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
function metaExtract(head, prop, by='property'){
  const re = new RegExp(`<meta[^>]+${by}=[\"']${prop}[\"'][^>]+content=[\"']([^\"]+)`, 'i');
  const m = head.match(re);
  return m ? m[1] : null;
}
function regexPrice(txt){
  // heuristics for "US $99.00" or "$99 - $199" etc.
  const m = txt.match(/(?:US\s*\$|\$)\s*([0-9]+(?:[.,][0-9]{2})?(?:\s*[-–]\s*\$?[0-9]+(?:[.,][0-9]{2})?)?)/i);
  return m ? (m[0].replace(/\s+/g,' ').trim()) : null;
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
    const title = metaExtract(head, 'og:title') || (head.match(/<title>([^<]+)<\/title>/i)||[])[1] || null;
    const image = metaExtract(head, 'og:image') || metaExtract(head, 'twitter:image') || null;
    const description = metaExtract(head, 'og:description') || metaExtract(head, 'description','name') || null;
    // try some JSON-LD offers
    let price = null;
    const jsonlds = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig)].map(m => m[1]);
    for (const js of jsonlds) {
      try {
        const data = JSON.parse(js.trim());
        const items = Array.isArray(data) ? data : [data];
        for (const it of items) {
          const priceFound = it?.offers?.price || it?.offers?.lowPrice || it?.price;
          if (priceFound) { price = priceFound; break; }
        }
        if (price) break;
      } catch {}
    }
    if (!price) {
      price = regexPrice(head) || regexPrice(html);
    }
    context.res = cors({ status: 200, headers: { 'content-type':'application/json' }, body: { url, title, image, description, price } });
  } catch (e) {
    context.log.error(e);
    context.res = cors({ status: 500, body: { error: e.message } });
  }
}

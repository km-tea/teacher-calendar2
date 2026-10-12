export async function hwpxText(z) {
  const num = (n) => +n.match(/section(\d+)/i)[1];
  const secs = Object.keys(z.files).filter((n) => /(^|\/)contents\/section\d+\.xml$/i.test(n)).sort((a, b) => num(a) - num(b));
  let t = '';
  for (const n of secs) {
    t += (await z.file(n).async('string'))
      .replace(/<\/(?:\w+:)?p>|<(?:\w+:)?lineBreak\s*\/>/g, '\n').replace(/<\/(?:\w+:)?tc>/g, ' | ')
      .replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&') + '\n';
  }
  if (t.trim().length < 20) { const p = z.file(/(^|\/)Preview\/PrvText\.txt$/i)[0]; if (p) t = await p.async('string'); }
  return t;
}

export default async (request) => {
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/markdown')) return; // browsers continue normally

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const name = path === '' ? 'index' : path.slice(1);
  if (!['index', 'gutter', 'chimney'].includes(name)) return;

  const res = await fetch(new URL('/markdown/' + name + '.md', url));
  if (!res.ok) return;
  const text = await res.text();

  return new Response(text, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'vary': 'Accept',
      'x-markdown-tokens': String(Math.ceil(text.length / 4)),
    },
  });
};

export const config = { path: ['/', '/gutter', '/gutter/', '/chimney', '/chimney/'] };
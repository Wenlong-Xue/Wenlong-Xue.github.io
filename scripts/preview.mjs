import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export async function startPreview(port=0) {
 const server=http.createServer(async (request,response)=> {
  try {
   const url=new URL(request.url,'http://localhost');
   const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   const relative=path.relative(root,target);
   if(relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part=>part.startsWith('.')) || relative.startsWith('scripts'+path.sep) || !types[path.extname(target)]) { response.writeHead(403); response.end('Forbidden'); return; }
   const data=await fs.readFile(target);
   response.writeHead(200,{'Content-Type':types[path.extname(target)],'Cache-Control':'no-store'}); response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 return {server,url:`http://127.0.0.1:${server.address().port}`};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) { const {url}=await startPreview(Number(process.argv[2] || 8786)); console.log(`Website preview: ${url}/`); }

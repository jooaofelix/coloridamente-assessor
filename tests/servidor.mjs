// Servidor estático mínimo para rodar o assessor localmente e nos testes.
// Serve a pasta public/ como a Cloudflare faz (com a página 404 própria).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../public/", import.meta.url));
const porta = Number(process.env.PORT) || 8788;
const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

createServer(async (req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (caminho.endsWith("/")) caminho += "index.html";
  const arquivo = normalize(join(raiz, caminho));
  if (!arquivo.startsWith(raiz)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { "Content-Type": tipos[extname(arquivo)] || "application/octet-stream" });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { "Content-Type": tipos[".html"] });
    res.end(await readFile(join(raiz, "404.html")));
  }
}).listen(porta, () => console.log(`Assessor em http://localhost:${porta}`));

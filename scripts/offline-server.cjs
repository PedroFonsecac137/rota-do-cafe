const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');

const root = path.join(__dirname, 'site');
const participantsFile = path.join(__dirname, 'participantes-feira.txt');
const host = '127.0.0.1';
const preferredPort = 4173;

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.zip': 'application/zip',
};

function clean(value) {
  return String(value ?? '').replace(/[\r\n|]/g, ' ').trim();
}

function saveParticipant(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 10_000) req.destroy();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const nome = clean(data.nome).slice(0, 60);
      const telefone = clean(data.telefone).slice(0, 30);
      if (!nome || !telefone) throw new Error('Dados incompletos');
      const momento = new Date().toLocaleString('pt-BR');
      fs.appendFileSync(participantsFile, `${momento} | Nome: ${nome} | Telefone: ${telefone}\r\n`, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false }));
    }
  });
}

function serve(req, res) {
  const requestUrl = new URL(req.url, `http://${host}`);
  if (requestUrl.pathname === '/api/participantes' && req.method === 'POST') {
    saveParticipant(req, res);
    return;
  }

  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === '/') pathname = '/index.html';
  const candidate = path.resolve(root, `.${pathname}`);
  const safeRoot = `${path.resolve(root)}${path.sep}`;
  const file = candidate.startsWith(safeRoot) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(root, 'index.html');

  fs.readFile(file, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não foi possível abrir o jogo.');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': file.endsWith('index.html') || file.endsWith('sw.js') ? 'no-store' : 'public, max-age=3600',
    });
    res.end(content);
  });
}

function start(port) {
  const server = http.createServer(serve);
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') start(port + 1);
    else throw error;
  });
  server.listen(port, host, () => {
    const url = `http://${host}:${port}/`;
    console.log(`Rota do Café aberto em ${url}`);
    console.log('Mantenha esta janela aberta durante o evento.');
    exec(`start "" "${url}"`);
  });
}

start(preferredPort);

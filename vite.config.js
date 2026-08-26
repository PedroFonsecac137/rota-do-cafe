import { defineConfig } from 'vite';
import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const clean = value => String(value ?? '').replace(/[\r\n|]/g, ' ').trim();

export default defineConfig({
  server: {
    watch: { ignored: ['**/NETLIFY_UPLOAD/**', '**/dist/**'] }
  },
  plugins: [{
    name: 'cadastro-participantes',
    configureServer(server) {
      server.middlewares.use('/api/participantes', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Método não permitido');
          return;
        }
        let body = '';
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 10_000) req.destroy();
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const nome = clean(data.nome).slice(0, 60);
            const telefone = clean(data.telefone).slice(0, 30);
            if (!nome || !telefone) throw new Error('Dados incompletos');
            const momento = new Date().toLocaleString('pt-BR');
            await appendFile(resolve(process.cwd(), 'participantes.txt'), `${momento} | Nome: ${nome} | Telefone: ${telefone}\r\n`, 'utf8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, erro: 'Não foi possível salvar o cadastro.' }));
          }
        });
      });
    }
  }]
});

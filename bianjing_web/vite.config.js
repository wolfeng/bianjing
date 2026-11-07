import { defineConfig } from 'vite'

function tiandituProxyPlugin() {
  let counter = 0
  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith('/tdt/')) return next()
    try {
      const sub = counter++ % 8
      const pathAndQuery = req.url.replace(/^\/tdt/, '')
      const targetUrl = `https://t${sub}.tianditu.gov.cn${pathAndQuery}`
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'TiandituServerClient/1.0',
          Accept: 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      })
      res.statusCode = upstream.status
      const ct = upstream.headers.get('content-type')
      if (ct) res.setHeader('Content-Type', ct)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.end(buf)
    } catch (err) {
      res.statusCode = 502
      res.end(String(err))
    }
  }
  return {
    name: 'tianditu-server-key-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  plugins: [tiandituProxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    cors: true,
  },
  build: { outDir: 'dist', sourcemap: true },
})

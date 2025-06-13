import fs from 'node:fs'
import path from 'node:path'
import { sveltekit } from '@sveltejs/kit/vite'
import dotenv from 'dotenv'
import { defineConfig } from 'vite'

dotenv.config()

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: '0.0.0.0', // Listen on all network interfaces
        port: 5173, // Default Vite port, change if needed
        strictPort: true, // Fail if port is already in use
        // HTTPS configuration
        // If cert.pem and key.pem exist in a .certs directory, use them
        // for HTTPS. Otherwise fall back to HTTP.
        // You can create the certs with mkcert for your Tailscale domain
        // and localhost:
        //   mkcert your-domain.ts.net localhost
        //   mkdir .certs; mv your-domain.ts.net+1.pem .certs/cert.pem
        //   mv your-domain.ts.net+1-key.pem .certs/key.pem
        https: (() => {
            const keyPath = path.resolve(__dirname, '.certs/key.pem')
            const certPath = path.resolve(__dirname, '.certs/cert.pem')
            if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                return {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath),
                }
            }
            return undefined
        })(),
        allowedHosts: [process.env.ALLOWED_HOST || 'all'],
    },
})

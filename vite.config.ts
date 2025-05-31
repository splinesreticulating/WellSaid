import fs from 'node:fs';
import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.env.VITE_BASIC_AUTH_USERNAME':
			JSON.stringify(process.env.BASIC_AUTH_USERNAME || '')
	},
	server: {
		host: '0.0.0.0', // Listen on all network interfaces
		port: 5173, // Default Vite port, change if needed
		strictPort: true, // Fail if port is already in use
		// HTTPS configuration
		// Ensure you have created cert.pem and key.pem in a .certs directory in your project root
		// using mkcert for your Tailscale domain and localhost.
		// e.g., mkcert your-domain.ts.net localhost
		// then: mkdir .certs; mv your-domain.ts.net+1.pem .certs/cert.pem; mv your-domain.ts.net+1-key.pem .certs/key.pem
		https: {
			key: fs.readFileSync(path.resolve(__dirname, '.certs/key.pem')),
			cert: fs.readFileSync(path.resolve(__dirname, '.certs/cert.pem'))
		},
		allowedHosts: [process.env.ALLOWED_HOST || 'all']
	}
});

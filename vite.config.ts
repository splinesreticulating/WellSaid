import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0', // Listen on all network interfaces
		port: 5173, // Default Vite port, change if needed
		strictPort: true, // Fail if port is already in use
		allowedHosts: [process.env.ALLOWED_HOST || 'all'],
	}
});

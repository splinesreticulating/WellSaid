// See https://kit.svelte.dev/docs/types#app
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }

    // Add type declarations for environment variables
    interface ImportMetaEnv {
        VITE_BASIC_AUTH_USERNAME: string;
        // Add other environment variables as needed
    }
}

export { };

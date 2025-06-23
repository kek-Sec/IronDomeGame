import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // The base URL of your development server
    baseUrl: 'http://127.0.0.1:8080',
    // We can add a setupNodeEvents function here later if needed
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
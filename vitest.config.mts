import { defineConfig } from 'vitest/config';

// Server-side tests. Convex functions run in the edge runtime (convex-test);
// content scripts run in Node.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'convex',
          include: ['convex/**/*.test.ts'],
          environment: 'edge-runtime',
          server: { deps: { inline: ['convex-test'] } },
        },
      },
      {
        test: {
          name: 'scripts',
          include: ['scripts/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
    passWithNoTests: true,
  },
});

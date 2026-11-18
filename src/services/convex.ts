import { ConvexReactClient } from 'convex/react';

const url = process.env.EXPO_PUBLIC_CONVEX_URL;

/** Single Convex client for the app, or null when EXPO_PUBLIC_CONVEX_URL is not set. */
export const convexClient: ConvexReactClient | null = url
  ? new ConvexReactClient(url, { unsavedChangesWarning: false })
  : null;

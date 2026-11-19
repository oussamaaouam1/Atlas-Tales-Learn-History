import { defineApp } from 'convex/server';
import { v } from 'convex/values';
export default defineApp({ env: { CONVEX_ADMIN_KEY: v.optional(v.string()) } });

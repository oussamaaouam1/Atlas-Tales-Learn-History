import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { storyFields, pageFields, imageFields, localized } from './contentValidators';

export const ageBandValidator = v.union(
  v.literal('child'),
  v.literal('teen'),
  v.literal('adult'),
  v.literal('unknown'),
);

export const platformValidator = v.union(v.literal('ios'), v.literal('android'), v.literal('web'));

// Content and identity tables.
export default defineSchema({
  stories: defineTable(storyFields).index('by_slug', ['slug']).index('by_status_and_available', ['status', 'available']),
  storyPages: defineTable({ storyId: v.id('stories'), ...pageFields }).index('by_storyId_and_page', ['storyId', 'page']),
  storyImages: defineTable({ storyId: v.id('stories'), ...imageFields }).index('by_storyId_and_page_and_order', ['storyId', 'page', 'order']),
  releases: defineTable({ date: v.string(), storyId: v.id('stories') }).index('by_storyId', ['storyId']).index('by_date', ['date']),
  series: defineTable({ slug: v.string(), title: localized, coverImageUrl: v.string(), storyIds: v.array(v.id('stories')) }).index('by_slug', ['slug']),
  // Identity: one row per app install (anonymous first).
  // The raw install token never leaves the device's SecureStore; only its SHA-256 hash is stored.
  installs: defineTable({
    ownerKey: v.string(),
    installTokenHash: v.string(),
    platform: platformValidator,
    appVersion: v.string(),
    locale: v.string(),
    linkedUserKey: v.optional(v.string()),
    ageBand: ageBandValidator,
    firstSeenAtMs: v.number(),
    lastSeenAtMs: v.number(),
  })
    .index('by_ownerKey', ['ownerKey'])
    .index('by_installTokenHash', ['installTokenHash']),
});

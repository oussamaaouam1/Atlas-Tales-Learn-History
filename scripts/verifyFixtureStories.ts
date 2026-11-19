import { strict as assert } from 'node:assert';
import { setDefaultResultOrder } from 'node:dns';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
setDefaultResultOrder('ipv4first');
async function main() {
  const client = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
  const map = await client.query(api.stories.listForMap, { paginationOpts: { numItems: 100, cursor: null } });
  for (const slug of ['placeholder-one', 'placeholder-two']) {
    assert.equal(map.page.filter(s => s.slug === slug).length, 1);
    const result = await client.query(api.stories.getStory, { slug });
    assert(result);
    assert.equal(result.pages.length, 32);
    assert.equal(result.images.length, 40);
    for (const page of result.pages) assert.equal(Object.keys(page.audio).length, 4);
    const urls = [result.story.coverImageUrl, result.images[0]!.url, result.pages[0]!.audio.en.url];
    for (const url of urls) {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200, `Media unavailable: ${url}`);
      assert((await response.arrayBuffer()).byteLength > 0);
    }
    console.log(`${slug}: 32 pages, 40 images, 128 audio references; cover/image/audio CDN GETs passed`);
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });

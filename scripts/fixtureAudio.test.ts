import { fileURLToPath } from 'node:url';
import { parseFile } from 'music-metadata';
import { expect, test } from 'vitest';
test('bundled silent narration is a two-second mono AAC file', async () => {
  const audio = await parseFile(fileURLToPath(new URL('./fixtures/placeholder-silence.m4a', import.meta.url)));
  expect(audio.format.duration).toBeCloseTo(2, 1);
  expect(audio.format.numberOfChannels).toBe(1);
  expect(audio.format.sampleRate).toBe(44100);
  expect(audio.format.codec).toContain('AAC');
});

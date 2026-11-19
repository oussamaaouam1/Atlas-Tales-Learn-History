import type { Story } from './storySchema';
const label = { en: 'Placeholder test story', ar: 'قصة تجريبية', fr: 'Histoire de test', es: 'Historia de prueba' };
export function fixtureStory(slug: string): Story {
  const pages: Story['pages'] = Array.from({ length: 32 }, (_, i) => ({
    page: i + 1, chapter: i < 11 ? 1 : i < 22 ? 2 : 3,
    beat: i === 0 ? 'cold-open' : i === 31 ? 'closing-echo' : 'world',
    year: '1324', settingId: 'placeholder-place', tag: 'imagined', speaker: 'narrator', text: label,
    historicalNote: 'Synthetic fixture, not historical content.', images: [`placeholder-img-${i + 1}`],
  }));
  const images: Story['images'] = pages.map(p => ({ id: p.images[0]!, page: p.page, order: 1, type: 'scene', shot: 'wide', durationSec: p.page <= 8 ? 1 : 2, prompt: 'Solid-colour placeholder, no text.' }));
  for (let i = 0; i < 8; i++) {
    const id = `placeholder-detail-${i + 1}`;
    pages[i]!.images.push(id);
    images.push({ id, page: i + 1, order: 2, type: 'detail', shot: 'detail', durationSec: 1, prompt: 'Solid-colour placeholder, no text.' });
  }
  return { id: slug, version: 2, title: { ...label, en: `${label.en}: ${slug}` }, hook: label, keyTakeaway: label,
    era: { period: 'Medieval', yearStart: 1324, yearEnd: 1325, region: 'West Africa' },
    location: { name: 'Timbuktu', lat: 16.7666, lng: -3.0026 }, masterLanguage: 'en', accuracyMode: 'dramatized',
    names: [], characters: { guide: { role: 'guide', appearance: 'Placeholder', personality: 'Curious' } },
    settings: [{ id: 'placeholder-place', name: 'Placeholder', description: 'Synthetic fixture setting' }],
    chapters: [1, 12, 23].map((firstPage, i) => ({ number: i + 1, firstPage, title: label })),
    pages, images, didYouKnow: label, quiz: Array.from({ length: 3 }, () => ({ question: label, options: [label, label, label], answerIndex: 0 })),
    sources: [{ title: 'Synthetic test fixture - not a factual story', url: 'https://example.com/placeholder' }],
  };
}

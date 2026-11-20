import { describe, expect, test } from 'vitest';

import { audioFromResponse, isDailyQuota, retryDelaySeconds, splitDuration, ttsRequest, VOICES } from './narrateStory';

describe('Gemini TTS narration helpers', () => {
  test('builds an Interactions request with the speaker voice and a short style note', () => {
    const body = ttsRequest('Hello, explorer!', 'guide', 'gemini-3.8-flash-tts');
    expect(body.model).toBe('gemini-3.8-flash-tts');
    expect(body.generation_config.speech_config[0]!.voice).toBe(VOICES.guide);
    expect(body.input[0]!.content[0]!.text).toBe('Hello, explorer!');
    expect(body.input[0]!.content[0]!.annotations[0]!.style.length).toBeLessThan(80);
    expect(body.response_format.type).toBe('audio');
  });

  test('reads the last audio item from the model_output step', () => {
    const json = {
      steps: [
        { type: 'user_input', content: [{ type: 'text' }] },
        { type: 'model_output', content: [{ type: 'audio', data: 'AAA' }, { type: 'audio', data: 'BBB' }] },
      ],
    };
    expect(audioFromResponse(json)).toBe('BBB');
    expect(audioFromResponse({ steps: [] })).toBeNull();
  });

  test('honours server retry delays and spots daily quotas', () => {
    expect(retryDelaySeconds('{"retryDelay": "31s"}', null)).toBe(31);
    expect(retryDelaySeconds('', '12')).toBe(12);
    expect(retryDelaySeconds('nothing', null)).toBeNull();
    expect(isDailyQuota('GenerateRequestsPerDayPerProjectPerModel')).toBe(true);
    expect(isDailyQuota('GenerateRequestsPerMinutePerProjectPerModel')).toBe(false);
  });

  test('splits page narration across its images', () => {
    expect(splitDuration(24, 2)).toEqual([12, 12]);
    expect(splitDuration(20, 1)).toEqual([20]);
    expect(splitDuration(0.4, 1)).toEqual([0.5]);
    expect(splitDuration(10, 0)).toEqual([]);
  });
});

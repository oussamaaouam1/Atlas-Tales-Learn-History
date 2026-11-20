import { describe, expect, test } from 'vitest';

import { audioFromResponse, ffmpegInput, isDailyQuota, isWav, rejectsStyle, retryDelaySeconds, splitDuration, ttsRequest, VOICES } from './narrateStory';

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

  test('falls back to a plain transcript for models that reject style notes', () => {
    expect(rejectsStyle(400, '{"message":"Speech metadata is not supported for this model."}')).toBe(true);
    expect(rejectsStyle(400, 'Speech annotations are not supported for model x')).toBe(true);
    expect(rejectsStyle(429, 'Speech metadata is not supported')).toBe(false);
    expect(ttsRequest('Hi', 'narrator', 'm', false).input[0]!.content[0]!.annotations).toEqual([]);
  });

  test('converts WAV or raw 24 kHz PCM', () => {
    const wav = Buffer.from('RIFF....WAVEfmt ', 'ascii');
    const raw = Buffer.alloc(16);
    expect(isWav(wav)).toBe(true);
    expect(isWav(raw)).toBe(false);
    expect(ffmpegInput(wav, 'a.wav')).toEqual(['-i', 'a.wav']);
    expect(ffmpegInput(raw, 'a.wav')).toEqual(['-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'a.wav']);
  });

  test('splits page narration across its images', () => {
    expect(splitDuration(24, 2)).toEqual([12, 12]);
    expect(splitDuration(20, 1)).toEqual([20]);
    expect(splitDuration(0.4, 1)).toEqual([0.5]);
    expect(splitDuration(10, 0)).toEqual([]);
  });
});

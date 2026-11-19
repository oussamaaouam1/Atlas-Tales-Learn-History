# Silent audio fixture

`placeholder-silence.m4a` is generated silence: 2 seconds, AAC, mono, 44.1 kHz,
encoded with a 64 kbps target. Silence compresses below that target bitrate.
It contains no recorded voice or third-party audio.

Generated once with the portable Gyan FFmpeg 7.1.1 essentials build:
https://github.com/GyanD/codexffmpeg/releases/tag/7.1.1

```
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 2 -c:a aac -b:a 64k -movflags +faststart placeholder-silence.m4a
```

The encoder stays outside the repository. Fixture generation only copies this file.

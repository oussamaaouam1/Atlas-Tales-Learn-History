# Content pipeline

Use `pnpm story:fixture placeholder-one` to generate a synthetic 32-page,
three-chapter story with 40 WebP images and silent audio in all four languages.
These fixtures are labelled as test content, not historical stories.

- `pnpm story:validate content/placeholder-one`: validate JSON and referenced files.
- `pnpm story:upload content/placeholder-one [--release YYYY-MM-DD]`: upload to the
  R2 bucket and Convex deployment configured in `.env.local`. Dates are midnight UTC.
  Without a date the story is immediately available.

The uploader reads actual narration durations. It uploads media under
`stories/<slug>/<content-hash>/...` and commits metadata in one authenticated
mutation after every upload succeeds. Repeat uploads preserve the story ID and
replace its pages, images and release row. Failed uploads can leave unused R2
objects; they do not replace live database records or overwrite existing media.

`CONVEX_ADMIN_KEY` must match between `.env.local` and the target Convex deployment.
Never expose this key or R2 credentials through EXPO_PUBLIC variables.

Map results are paginated. Story reads return at most 40 pages and 60 images.
Drafts and future releases are excluded. A scheduled internal mutation enables a
release using server time; client clocks cannot bypass this. Pro early-access
entitlement enforcement is deferred to the monetization phase; until then early
content remains inaccessible to everyone.

The fixture generator copies a bundled two-second AAC/M4A silent file. It does not
require an audio encoder at runtime. Real stories still require factual review
and professionally prepared media; passing structural validation does not certify
historical accuracy.

## Artwork workflow
The owner authorizes GPT image generation for app artwork whenever useful. Follow
the Claude Design reference, keep UI/text in code, save prompts in assets/_prompts,
and use placeholder-* names for drafts. Full-screen art is landscape 16:9;
character cutouts use transparency. Pipeline fixtures deliberately use simple
solid-colour images and silent audio.

Run `node --env-file=.env.local --import tsx scripts/verifyFixtureStories.ts`
after uploading both fixtures to check the live story counts and sample CDN files.
When configuring the admin key on Windows, prefer a dotenv file with
`convex env set --from-file <file>`: piping with PowerShell can append a newline
to the secret. Keep that temporary file outside Git and remove it afterward.

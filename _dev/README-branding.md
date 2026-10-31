# Branding assets

Only files referenced by the pages belong in `assets/branding/`. The asset audit in
`tests/public-assets.test.mjs` rejects unused published files. Working copies and
retired originals may be kept in `_dev/internal/`, which is ignored by Git and
excluded from GitHub Pages. Private notes must never be committed.

The hero plays once when loaded, using a 960 px H.264 baseline MP4 with no audio,
YUV 4:2:0 pixels and `+faststart`. Its normal clip has a 300 KB budget. Reduced-motion
visitors see the still image without downloading the video. December selects a
holiday clip and its matching still.

The About animation loads its two native MP4 URLs only after interaction. Native
URLs preserve Safari byte-range support; do not replace them with Blob URLs or
wait for hidden videos to decode every frame before making the control usable.
Both directions play forwards. Switching seeks to the matching normalized position.

The 512 px, 25 fps About clips use H.264 baseline with `-g 1 -bf 0 -pix_fmt yuv420p`
and `-movflags +faststart`. Independent frames cost more bytes than long GOP clips,
but make the direction switches precise across engines. They are not part of the
initial page transfer. Playback holds the final frame before end-of-stream.
Their `?rev=` URLs use the first ten hex digits of each file's SHA-256; update
them when re-encoding so visitors do not reuse an older cached clip.

Run branding tests in Chromium, Firefox and WebKit. The delayed-load tests use a
real HTTP server with range responses because native WebKit media requests can
bypass Playwright route interception. The endpoint tests allow a rounded media
clock to hold the outgoing frame, but must never allow a clip to restart.
WebKit touch emulation covers the iPhone layout; it does not replace a physical
iPhone check.

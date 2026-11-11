# Branding assets

Only files referenced by the pages belong in `assets/branding/`. The asset audit in
`tests/public-assets.test.mjs` rejects unused published files. Working copies and
retired originals may be kept in `_dev/internal/`, which is ignored by Git and
excluded from GitHub Pages. Private notes must never be committed.

The hero plays once when loaded, using a 960 px H.264 baseline MP4 with no audio,
YUV 4:2:0 pixels and `+faststart`. Its normal clip has a 300 KB budget. Reduced-motion
visitors see the still image without downloading the video. December selects a
holiday clip and its matching still.

The About block and its Yume hover animation were replaced by the feature tour
(`#features`, `showcase.js`). Its two clips and still are kept, unpublished, in
`_dev/internal/retired-about/` on the machine that retired them, and in Git history.

## Feature tour photos

The Alba screens in the feature tour and the customer stories use nine stock photos, cropped and saved as WebP in
`assets/showcase/` (each under 40 KB; the asset audit checks they are referenced and small).
All are from Unsplash under the [Unsplash License](https://unsplash.com/license), which
allows commercial use without attribution; they are credited here anyway. Replace them
with approved client material when it is available.

| File | Shows | Photographer | Unsplash photo |
| --- | --- | --- | --- |
| `alba-runner.webp` | A runner at sunrise (landing and booking heroes) | Tikkho Maciel | `2-_WkjmC8x4` |
| `alba-fisioterapia.webp` | Knee electrotherapy (Fisioterapia card) | Terry Shultz P.T. (@elektrikpm) | `EQ-53WaTNC4` |
| `alba-masaje.webp` | A back massage (Masaje terapéutico card) | Ale Romo | `CLiwQXx7kT8` |
| `alba-pilates.webp` | A reformer studio (Pilates clínico card) | Ahmet Kurt (@ahmetkurt) | `Dvoq367wWg8` |
| `story-fisioterapia.webp` | The runner again, wide (Alba's story) | Tikkho Maciel | `2-_WkjmC8x4` |
| `story-clinica.webp` | A dentist with a patient (Sonríe Dental's story) | Ozkan Guner | `rRgjO2Y1g1E` |
| `story-barberia.webp` | A barber with a straight razor (El Bigote's story) | Agustin Fernandez | `1Pmp9uxK8X8` |
| `story-tatuajes.webp` | A tattoo artist at work (Tinta Norte's story) | Bradley Andrews | `QPP5b_25Huk` |
| `story-restaurante.webp` | Arepas on the grill (La Fonda de Rosita's story) | Leila Issa | `4C_k18o_tnk` |

Run the branding test in Chromium, Firefox and WebKit.

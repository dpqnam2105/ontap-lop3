# Midterm English illustrations

Based on commit `24d2b159d289bb56ea97b787113e4cd81852ff32`.

17 deterministic SVGs serve 20 questions. The new map puts the museum on the right, harbor on the left beyond the bridge, theater above, square below, and art gallery opposite recreation center. The start star points up. Forbidden signs use a red slash; the seating invitation and bin illustrations have no slash.

Codex visually inspected all 20 images in the real quiz at 390 × 844 on 2026-10-12. All loaded, stayed within the viewport, matched their answer, and had legible map labels. The corresponding JSON `imageReview` records are `ok`, with `by`, `date`, and `checkedOn: mobile-390`. Screenshot and bounding-box evidence is generated locally by the image E2E script.

Review of the original image gate found four paths where a caller could supply pending questions: mixed pools, review pools, explicit `pickIdx`, and topic wrong review with no `allowedIdx`. Quiz now filters at those boundaries. Tests inject pending state independently of approved production data, so the gate remains tested after opening the artwork.

Validation commands:

```sh
node tests/en-data.test.js
node tests/en-midterm.test.js
node tests/en-books.test.js
node tests/en-midterm.e2e.js
node tests/en-midterm-images.e2e.js
```

Serve this repository on port 8765 for browser tests. `PLAYWRIGHT_CHANNEL=msedge` selects the installed Edge when bundled Chromium is unavailable; the default remains Playwright Chromium. Browser tests stub cloud synchronization and create no remote child records.

# QA image fixtures

These tiny neutral images are test inputs, not damage photographs or evidence.

- `pixel.png`: generated 8×8 RGB image with valid PNG chunks and checksums using Python's standard library.
- `pixel.jpg`: JPEG conversion of that generated PNG using macOS sips.
- `pixel.webp`: minimal encoded one-pixel WebP fixture.

Container checks reject obvious truncation and inconsistent lengths. They do not fully decode compressed image pixels; provider failures still return explicit errors.

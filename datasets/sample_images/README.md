# Sample Images Dataset

This directory contains programmatically generated sample images for testing.

## Contents

- `solid_red.png` - 64x64 solid red image
- `solid_blue.png` - 64x64 solid blue image
- `checkerboard.png` - 64x64 black and white checkerboard pattern
- `gradient.png` - 64x64 horizontal grayscale gradient
- `stripes.png` - 64x64 vertical black and white stripes
- `dots.png` - 64x64 grid of red dots on white background

## Generation

These images are created by `scripts/create_sample_images.js`.

To regenerate:
```bash
node scripts/create_sample_images.js
```

## Usage

These images are used for:
- Unit testing image transforms
- API endpoint testing
- Dry-run experiment validation
- Fast local development

## License

CC0-1.0 (Public Domain) - These images are programmatically generated and contain no copyrighted content.

## Notes

- Images are intentionally small (64x64) for fast testing
- All images are PNG format for lossless testing
- Patterns are simple geometric shapes for predictable behavior

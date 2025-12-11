# Datasets Directory

This directory contains dataset loaders and sample images for local steganography experiments.

## Sample Images

The `sample_images/` directory contains 3 minimal placeholder files for testing the pipeline.

**Note:** These are JSON placeholders, not actual images. For real experiments, replace them with actual PNG images using Sharp:

```javascript
const sharp = require('sharp');

// Create a test image
await sharp({
  create: {
    width: 256,
    height: 256,
    channels: 3,
    background: { r: 128, g: 128, b: 128 }
  }
})
.png()
.toFile('datasets/sample_images/sample_1.png');
```

## ImageDataset Class

Use the `ImageDataset` class for efficient image loading:

```javascript
const { ImageDataset } = require('./datasets/loader');

const dataset = new ImageDataset('./datasets/sample_images', {
  limit: 10,
  shuffle: true,
  generatePayloads: true,
  payloadSize: 1024
});

await dataset.load();

// Iterate through images
for await (const image of dataset) {
  console.log(image.name, image.buffer.length);
}
```

## Functions

- **`ensureSampleImages(dest)`** - Copies bundled sample images to destination
- **`loadDataset(name, options)`** - Loads dataset by name
- **`listDatasets()`** - Lists available datasets
- **`fetchExternalDataset(url, dest)`** - Downloads external dataset (requires interactive confirmation)

## No Automatic Downloads

**Important:** No external datasets are downloaded automatically. The `fetchExternalDataset()` function requires explicit user confirmation before downloading anything.

## Adding Your Own Datasets

1. Create a new directory: `datasets/my_dataset/`
2. Add your images (PNG, JPG, JPEG supported)
3. Load with: `loadDataset('my_dataset')`

**Remember:** All datasets are local-only. Do not commit large image files to git.

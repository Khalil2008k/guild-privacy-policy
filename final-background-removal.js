/**
 * Final Background Removal
 * 
 * Creates actual background removal results that you can see
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function finalBackgroundRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Final Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: Brightness-based removal (working)
    console.log('\n🔧 Method 1: Brightness-based Background Removal...');
    const brightnessResult = await brightnessBasedRemoval(imageBuffer, width, height);
    const brightnessPath = path.join(outputDir, 'brightness-removal.jpg');
    fs.writeFileSync(brightnessPath, brightnessResult);
    console.log(`✅ Brightness-based result: ${brightnessPath}`);

    // Method 2: Center-focused removal (working)
    console.log('\n🔧 Method 2: Center-focused Background Removal...');
    const centerResult = await centerFocusedRemoval(imageBuffer, width, height);
    const centerPath = path.join(outputDir, 'center-removal.jpg');
    fs.writeFileSync(centerPath, centerResult);
    console.log(`✅ Center-focused result: ${centerPath}`);

    // Method 3: Edge-based removal
    console.log('\n🔧 Method 3: Edge-based Background Removal...');
    const edgeResult = await edgeBasedRemoval(imageBuffer, width, height);
    const edgePath = path.join(outputDir, 'edge-removal.jpg');
    fs.writeFileSync(edgePath, edgeResult);
    console.log(`✅ Edge-based result: ${edgePath}`);

    // Method 4: Create a side-by-side comparison
    console.log('\n🔧 Method 4: Creating Side-by-Side Comparison...');
    await createSideBySideComparison(imageBuffer, brightnessResult, centerResult, edgeResult, outputDir);

    // Method 5: Create a before/after comparison
    console.log('\n🔧 Method 5: Creating Before/After Comparison...');
    await createBeforeAfterComparison(imageBuffer, brightnessResult, outputDir);

    console.log('\n🎉 Background removal completed!');
    console.log('📸 Check the processed images to see the actual background removal results!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${brightnessPath}`);
    console.log(`   - ${centerPath}`);
    console.log(`   - ${edgePath}`);
    console.log(`   - ${path.join(outputDir, 'side-by-side-comparison.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'before-after-comparison.jpg')}`);

  } catch (error) {
    console.error('❌ Background removal failed:', error.message);
  }
}

async function brightnessBasedRemoval(imageBuffer, width, height) {
  // Convert to grayscale and create mask based on brightness
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create a mask where bright areas (background) are removed
  const mask = await sharp(grayscale)
    .threshold(140) // Adjust this value to control sensitivity
    .toBuffer();

  // Apply mask to original image
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: mask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function centerFocusedRemoval(imageBuffer, width, height) {
  // Create a mask that focuses on the center area
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // Create a circular mask using SVG
  const svgMask = `
    <svg width="${width}" height="${height}">
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:white;stop-opacity:1" />
          <stop offset="70%" style="stop-color:white;stop-opacity:1" />
          <stop offset="100%" style="stop-color:black;stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>`;

  const mask = await sharp(Buffer.from(svgMask))
    .resize(width, height)
    .png()
    .toBuffer();

  // Apply mask to original image
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: mask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function edgeBasedRemoval(imageBuffer, width, height) {
  // Convert to grayscale and apply edge detection
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .blur(1)
    .toBuffer();

  // Apply edge detection using convolution
  const edges = await sharp(grayscale)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
    })
    .normalize()
    .toBuffer();

  // Create mask from edges
  const mask = await sharp(edges)
    .threshold(100)
    .toBuffer();

  // Apply mask to original image
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: mask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function createSideBySideComparison(original, brightnessResult, centerResult, edgeResult, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 200;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const brightnessResized = await sharp(brightnessResult)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const centerResized = await sharp(centerResult)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const edgeResized = await sharp(edgeResult)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    // Create side-by-side comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 4 + 50,
        height: targetHeight + 80,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 40 },
      { input: brightnessResized, left: targetWidth + 20, top: 40 },
      { input: centerResized, left: (targetWidth * 2) + 30, top: 40 },
      { input: edgeResized, left: (targetWidth * 3) + 40, top: 40 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'side-by-side-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Side-by-side comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create side-by-side comparison: ${error.message}`);
  }
}

async function createBeforeAfterComparison(original, processed, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 300;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize both images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const processedResized = await sharp(processed)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    // Create before/after comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 2 + 30,
        height: targetHeight + 80,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 40 },
      { input: processedResized, left: targetWidth + 20, top: 40 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'before-after-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Before/after comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create before/after comparison: ${error.message}`);
  }
}

// Run the final background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

finalBackgroundRemoval(inputPath, outputDir)
  .catch(console.error);













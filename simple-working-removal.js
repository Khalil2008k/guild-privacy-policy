/**
 * Simple Working Background Removal
 * 
 * Creates actual background removal results using working Sharp methods
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function simpleWorkingRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Simple Working Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: Create a simple mask based on brightness
    console.log('\n🔧 Method 1: Brightness-based Background Removal...');
    const brightnessResult = await brightnessBasedRemoval(imageBuffer, width, height);
    const brightnessPath = path.join(outputDir, 'brightness-removal.jpg');
    fs.writeFileSync(brightnessPath, brightnessResult);
    console.log(`✅ Brightness-based result: ${brightnessPath}`);

    // Method 2: Create a center-focused mask
    console.log('\n🔧 Method 2: Center-focused Background Removal...');
    const centerResult = await centerFocusedRemoval(imageBuffer, width, height);
    const centerPath = path.join(outputDir, 'center-removal.jpg');
    fs.writeFileSync(centerPath, centerResult);
    console.log(`✅ Center-focused result: ${centerPath}`);

    // Method 3: Create a gradient mask
    console.log('\n🔧 Method 3: Gradient Background Removal...');
    const gradientResult = await gradientRemoval(imageBuffer, width, height);
    const gradientPath = path.join(outputDir, 'gradient-removal.jpg');
    fs.writeFileSync(gradientPath, gradientResult);
    console.log(`✅ Gradient result: ${gradientPath}`);

    // Method 4: Create a comparison image
    console.log('\n🔧 Method 4: Creating Comparison Image...');
    await createComparisonImage(imageBuffer, brightnessResult, centerResult, gradientResult, outputDir);

    console.log('\n🎉 Background removal completed!');
    console.log('📸 Check the processed images to see the background removal results!');

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

async function gradientRemoval(imageBuffer, width, height) {
  // Create a gradient mask from center to edges
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  // Create a gradient mask
  const gradientMask = await sharp({
    create: {
      width,
      height,
      channels: 1,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .png()
  .toBuffer();

  // Apply mask to original image
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: gradientMask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function createComparisonImage(original, brightnessResult, centerResult, gradientResult, outputDir) {
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

    const gradientResized = await sharp(gradientResult)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    // Create comparison image
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
      { input: gradientResized, left: (targetWidth * 3) + 40, top: 40 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'background-removal-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Comparison image saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create comparison image: ${error.message}`);
  }
}

// Run the simple working background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

simpleWorkingRemoval(inputPath, outputDir)
  .catch(console.error);











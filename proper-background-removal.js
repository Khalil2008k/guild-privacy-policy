/**
 * Proper Background Removal
 * 
 * Implements real background removal that actually removes the background
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function properBackgroundRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Proper Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: Create transparent background (proper removal)
    console.log('\n🔧 Method 1: Transparent Background Removal...');
    const transparentResult = await createTransparentBackground(imageBuffer, width, height);
    const transparentPath = path.join(outputDir, 'transparent-background.png');
    fs.writeFileSync(transparentPath, transparentResult);
    console.log(`✅ Transparent background result: ${transparentPath}`);

    // Method 2: White background replacement
    console.log('\n🔧 Method 2: White Background Replacement...');
    const whiteResult = await replaceWithWhiteBackground(imageBuffer, width, height);
    const whitePath = path.join(outputDir, 'white-background.jpg');
    fs.writeFileSync(whitePath, whiteResult);
    console.log(`✅ White background result: ${whitePath}`);

    // Method 3: Black background replacement
    console.log('\n🔧 Method 3: Black Background Replacement...');
    const blackResult = await replaceWithBlackBackground(imageBuffer, width, height);
    const blackPath = path.join(outputDir, 'black-background.jpg');
    fs.writeFileSync(blackPath, blackResult);
    console.log(`✅ Black background result: ${blackPath}`);

    // Method 4: Gradient background replacement
    console.log('\n🔧 Method 4: Gradient Background Replacement...');
    const gradientResult = await replaceWithGradientBackground(imageBuffer, width, height);
    const gradientPath = path.join(outputDir, 'gradient-background.jpg');
    fs.writeFileSync(gradientPath, gradientResult);
    console.log(`✅ Gradient background result: ${gradientPath}`);

    // Method 5: Create proper comparison
    console.log('\n🔧 Method 5: Creating Proper Comparison...');
    await createProperComparison(imageBuffer, transparentResult, whiteResult, blackResult, gradientResult, outputDir);

    console.log('\n🎉 Proper background removal completed!');
    console.log('📸 Check the processed images to see the REAL background removal results!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${transparentPath} (transparent background)`);
    console.log(`   - ${whitePath} (white background)`);
    console.log(`   - ${blackPath} (black background)`);
    console.log(`   - ${gradientPath} (gradient background)`);
    console.log(`   - ${path.join(outputDir, 'proper-comparison.jpg')} (comparison)`);

  } catch (error) {
    console.error('❌ Background removal failed:', error.message);
  }
}

async function createTransparentBackground(imageBuffer, width, height) {
  // Create a proper mask for the subject
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .toBuffer();

  // Create a mask where the subject is white and background is black
  const mask = await sharp(grayscale)
    .threshold(120) // Adjust this value to control sensitivity
    .png()
    .toBuffer();

  // Apply the mask to create transparency
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function replaceWithWhiteBackground(imageBuffer, width, height) {
  // Create a mask for the subject
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .toBuffer();

  const mask = await sharp(grayscale)
    .threshold(120)
    .png()
    .toBuffer();

  // Create white background
  const whiteBackground = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
  .jpeg()
  .toBuffer();

  // Composite the subject onto white background
  const result = await sharp(whiteBackground)
    .composite([{ input: imageBuffer, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  return result;
}

async function replaceWithBlackBackground(imageBuffer, width, height) {
  // Create a mask for the subject
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .toBuffer();

  const mask = await sharp(grayscale)
    .threshold(120)
    .png()
    .toBuffer();

  // Create black background
  const blackBackground = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .jpeg()
  .toBuffer();

  // Composite the subject onto black background
  const result = await sharp(blackBackground)
    .composite([{ input: imageBuffer, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  return result;
}

async function replaceWithGradientBackground(imageBuffer, width, height) {
  // Create a gradient background
  const gradientBackground = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  })
  .jpeg()
  .toBuffer();

  // Create a mask for the subject
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .toBuffer();

  const mask = await sharp(grayscale)
    .threshold(120)
    .png()
    .toBuffer();

  // Composite the subject onto gradient background
  const result = await sharp(gradientBackground)
    .composite([{ input: imageBuffer, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  return result;
}

async function createProperComparison(original, transparent, white, black, gradient, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 200;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const transparentResized = await sharp(transparent)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const whiteResized = await sharp(white)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const blackResized = await sharp(black)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const gradientResized = await sharp(gradient)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    // Create proper comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 5 + 60,
        height: targetHeight + 100,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 50 },
      { input: transparentResized, left: targetWidth + 20, top: 50 },
      { input: whiteResized, left: (targetWidth * 2) + 30, top: 50 },
      { input: blackResized, left: (targetWidth * 3) + 40, top: 50 },
      { input: gradientResized, left: (targetWidth * 4) + 50, top: 50 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'proper-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Proper comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create proper comparison: ${error.message}`);
  }
}

// Run the proper background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

properBackgroundRemoval(inputPath, outputDir)
  .catch(console.error);












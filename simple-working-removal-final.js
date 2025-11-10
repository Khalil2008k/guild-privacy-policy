/**
 * Simple Working Removal Final
 * 
 * Creates actual background removal that works
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function simpleWorkingRemovalFinal(inputPath, outputDir) {
  try {
    console.log('🎨 Simple Working Removal Final Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: Simple threshold removal
    console.log('\n🔧 Method 1: Simple Threshold Removal...');
    const thresholdResult = await simpleThresholdRemoval(imageBuffer, width, height);
    const thresholdPath = path.join(outputDir, 'simple-threshold.png');
    fs.writeFileSync(thresholdPath, thresholdResult);
    console.log(`✅ Simple threshold result: ${thresholdPath}`);

    // Method 2: Brightness-based removal
    console.log('\n🔧 Method 2: Brightness-based Removal...');
    const brightnessResult = await brightnessBasedRemoval(imageBuffer, width, height);
    const brightnessPath = path.join(outputDir, 'brightness-based.png');
    fs.writeFileSync(brightnessPath, brightnessResult);
    console.log(`✅ Brightness-based result: ${brightnessPath}`);

    // Method 3: Edge-based removal
    console.log('\n🔧 Method 3: Edge-based Removal...');
    const edgeResult = await edgeBasedRemoval(imageBuffer, width, height);
    const edgePath = path.join(outputDir, 'edge-based.png');
    fs.writeFileSync(edgePath, edgeResult);
    console.log(`✅ Edge-based result: ${edgePath}`);

    // Method 4: Create white background versions
    console.log('\n🔧 Method 4: Creating White Background Versions...');
    await createWhiteBackgroundVersions(thresholdResult, brightnessResult, edgeResult, outputDir);

    // Method 5: Create comparison
    console.log('\n🔧 Method 5: Creating Final Comparison...');
    await createFinalComparison(imageBuffer, thresholdResult, brightnessResult, edgeResult, outputDir);

    console.log('\n🎉 Simple working removal completed!');
    console.log('📸 Check the processed images to see the working background removal results!');

  } catch (error) {
    console.error('❌ Simple working removal failed:', error.message);
  }
}

async function simpleThresholdRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create a mask using threshold
  const mask = await sharp(grayscale)
    .threshold(120) // Adjust this value
    .png()
    .toBuffer();

  // Apply mask to create transparency
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function brightnessBasedRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create a mask using brightness threshold
  const mask = await sharp(grayscale)
    .threshold(140) // Adjust this value
    .png()
    .toBuffer();

  // Apply mask to create transparency
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function edgeBasedRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Apply edge detection
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
    .png()
    .toBuffer();

  // Apply mask to create transparency
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function createWhiteBackgroundVersions(thresholdResult, brightnessResult, edgeResult, outputDir) {
  // Get dimensions
  const { width, height } = await sharp(thresholdResult).metadata();
  
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

  // Create white background versions
  const whiteThreshold = await sharp(whiteBackground)
    .composite([{ input: thresholdResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const whiteBrightness = await sharp(whiteBackground)
    .composite([{ input: brightnessResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const whiteEdge = await sharp(whiteBackground)
    .composite([{ input: edgeResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  // Save white background versions
  fs.writeFileSync(path.join(outputDir, 'white-threshold.jpg'), whiteThreshold);
  fs.writeFileSync(path.join(outputDir, 'white-brightness.jpg'), whiteBrightness);
  fs.writeFileSync(path.join(outputDir, 'white-edge.jpg'), whiteEdge);

  console.log(`   ✅ White background versions created`);
}

async function createFinalComparison(original, thresholdResult, brightnessResult, edgeResult, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 200;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const thresholdResized = await sharp(thresholdResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const brightnessResized = await sharp(brightnessResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const edgeResized = await sharp(edgeResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    // Create final comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 4 + 50,
        height: targetHeight + 100,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 50 },
      { input: thresholdResized, left: targetWidth + 20, top: 50 },
      { input: brightnessResized, left: (targetWidth * 2) + 30, top: 50 },
      { input: edgeResized, left: (targetWidth * 3) + 40, top: 50 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'final-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Final comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create final comparison: ${error.message}`);
  }
}

// Run the simple working removal final
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

simpleWorkingRemovalFinal(inputPath, outputDir)
  .catch(console.error);













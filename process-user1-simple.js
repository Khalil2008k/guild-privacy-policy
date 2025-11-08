/**
 * Process User1 Image - Simple Version
 * 
 * Processes the test user1 image with working background removal
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processUser1Simple() {
  try {
    console.log('🎨 Processing Test User1 Image - Simple Version');
    console.log('═'.repeat(60));

    // Load the test user1 image
    const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
    const outputDir = path.join(__dirname, 'processed-images');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!fs.existsSync(inputPath)) {
      console.log('❌ Test user1 image not found at:', inputPath);
      return;
    }

    console.log('✅ Test user1 image found');
    
    // Load image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);
    console.log(`📦 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Method 1: Simple threshold removal
    console.log('\n🔧 Method 1: Simple Threshold Background Removal...');
    const thresholdResult = await createSimpleThresholdRemoval(imageBuffer, width, height);
    const thresholdPath = path.join(outputDir, 'user1-simple-threshold.png');
    fs.writeFileSync(thresholdPath, thresholdResult);
    console.log(`✅ Threshold result: ${thresholdPath}`);

    // Method 2: Brightness-based removal
    console.log('\n🔧 Method 2: Brightness-Based Background Removal...');
    const brightnessResult = await createBrightnessRemoval(imageBuffer, width, height);
    const brightnessPath = path.join(outputDir, 'user1-brightness-removal.png');
    fs.writeFileSync(brightnessPath, brightnessResult);
    console.log(`✅ Brightness result: ${brightnessPath}`);

    // Method 3: Edge-based removal
    console.log('\n🔧 Method 3: Edge-Based Background Removal...');
    const edgeResult = await createEdgeRemoval(imageBuffer, width, height);
    const edgePath = path.join(outputDir, 'user1-edge-removal.png');
    fs.writeFileSync(edgePath, edgeResult);
    console.log(`✅ Edge result: ${edgePath}`);

    // Create white background versions
    console.log('\n🔧 Method 4: Creating White Background Versions...');
    await createWhiteVersions(thresholdResult, brightnessResult, edgeResult, outputDir);

    // Create comparison
    console.log('\n🔧 Method 5: Creating Comparison...');
    await createComparison(thresholdResult, brightnessResult, edgeResult, outputDir);

    console.log('\n🎉 Test user1 image processing completed!');
    console.log('📸 Check the processed images to see the results!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${thresholdPath}`);
    console.log(`   - ${brightnessPath}`);
    console.log(`   - ${edgePath}`);
    console.log(`   - ${path.join(outputDir, 'user1-white-threshold.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'user1-white-brightness.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'user1-white-edge.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'user1-final-comparison.jpg')}`);

  } catch (error) {
    console.error('❌ Image processing failed:', error.message);
  }
}

async function createSimpleThresholdRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create mask using threshold
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

async function createBrightnessRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create mask using brightness threshold
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

async function createEdgeRemoval(imageBuffer, width, height) {
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

async function createWhiteVersions(thresholdResult, brightnessResult, edgeResult, outputDir) {
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
  fs.writeFileSync(path.join(outputDir, 'user1-white-threshold.jpg'), whiteThreshold);
  fs.writeFileSync(path.join(outputDir, 'user1-white-brightness.jpg'), whiteBrightness);
  fs.writeFileSync(path.join(outputDir, 'user1-white-edge.jpg'), whiteEdge);

  console.log(`   ✅ White background versions created`);
}

async function createComparison(thresholdResult, brightnessResult, edgeResult, outputDir) {
  try {
    const { width, height } = await sharp(thresholdResult).metadata();
    const targetHeight = 200;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
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

    // Create comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 3 + 40,
        height: targetHeight + 80,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: thresholdResized, left: 10, top: 40 },
      { input: brightnessResized, left: targetWidth + 20, top: 40 },
      { input: edgeResized, left: (targetWidth * 2) + 30, top: 40 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'user1-final-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Comparison image saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create comparison: ${error.message}`);
  }
}

// Run the processing
processUser1Simple().catch(console.error);












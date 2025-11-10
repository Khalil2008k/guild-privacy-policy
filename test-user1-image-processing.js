/**
 * Test User1 Image Processing
 * 
 * Processes the test user1 image with background removal
 */

const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processUser1Image() {
  try {
    console.log('🎨 Processing Test User1 Image');
    console.log('═'.repeat(60));

    // Initialize TensorFlow.js
    console.log('\n🔄 Initializing TensorFlow.js...');
    await tf.ready();
    console.log('✅ TensorFlow.js ready!');

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

    // Create a simple background removal using Sharp
    console.log('\n🔧 Method 1: Simple Threshold Background Removal...');
    const thresholdResult = await createThresholdRemoval(imageBuffer, width, height);
    const thresholdPath = path.join(outputDir, 'user1-threshold-removal.png');
    fs.writeFileSync(thresholdPath, thresholdResult);
    console.log(`✅ Threshold result: ${thresholdPath}`);

    // Create center-focused removal
    console.log('\n🔧 Method 2: Center-Focused Background Removal...');
    const centerResult = await createCenterFocusedRemoval(imageBuffer, width, height);
    const centerPath = path.join(outputDir, 'user1-center-removal.png');
    fs.writeFileSync(centerPath, centerResult);
    console.log(`✅ Center-focused result: ${centerPath}`);

    // Create edge-based removal
    console.log('\n🔧 Method 3: Edge-Based Background Removal...');
    const edgeResult = await createEdgeBasedRemoval(imageBuffer, width, height);
    const edgePath = path.join(outputDir, 'user1-edge-removal.png');
    fs.writeFileSync(edgePath, edgeResult);
    console.log(`✅ Edge-based result: ${edgePath}`);

    // Create white background versions
    console.log('\n🔧 Method 4: Creating White Background Versions...');
    await createWhiteBackgroundVersions(thresholdResult, centerResult, edgeResult, outputDir);

    // Create comparison image
    console.log('\n🔧 Method 5: Creating Comparison Image...');
    await createComparisonImage(imageBuffer, thresholdResult, centerResult, edgeResult, outputDir);

    console.log('\n🎉 Test user1 image processing completed!');
    console.log('📸 Check the processed images to see the results!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${thresholdPath}`);
    console.log(`   - ${centerPath}`);
    console.log(`   - ${edgePath}`);
    console.log(`   - ${path.join(outputDir, 'user1-white-threshold.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'user1-white-center.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'user1-white-edge.jpg')}`);
    console.log(`   - ${path.join(outputDir, 'user1-comparison.jpg')}`);

  } catch (error) {
    console.error('❌ Image processing failed:', error.message);
  }
}

async function createThresholdRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create mask using threshold
  const mask = await sharp(grayscale)
    .threshold(130) // Adjust this value
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

async function createCenterFocusedRemoval(imageBuffer, width, height) {
  // Create a center-focused mask
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  // Create mask data
  const maskData = Buffer.alloc(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const normalizedDistance = distance / maxRadius;
      
      let maskValue;
      if (normalizedDistance < 0.3) {
        maskValue = 255; // Keep center area
      } else if (normalizedDistance < 0.7) {
        maskValue = 255 - Math.floor((normalizedDistance - 0.3) * 255 / 0.4);
      } else {
        maskValue = 0; // Remove edge areas
      }
      
      maskData[y * width + x] = maskValue;
    }
  }

  // Apply the mask
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: Buffer.from(maskData), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function createEdgeBasedRemoval(imageBuffer, width, height) {
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

async function createWhiteBackgroundVersions(thresholdResult, centerResult, edgeResult, outputDir) {
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

  const whiteCenter = await sharp(whiteBackground)
    .composite([{ input: centerResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const whiteEdge = await sharp(whiteBackground)
    .composite([{ input: edgeResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  // Save white background versions
  fs.writeFileSync(path.join(outputDir, 'user1-white-threshold.jpg'), whiteThreshold);
  fs.writeFileSync(path.join(outputDir, 'user1-white-center.jpg'), whiteCenter);
  fs.writeFileSync(path.join(outputDir, 'user1-white-edge.jpg'), whiteEdge);

  console.log(`   ✅ White background versions created`);
}

async function createComparisonImage(original, thresholdResult, centerResult, edgeResult, outputDir) {
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

    const centerResized = await sharp(centerResult)
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
        width: targetWidth * 4 + 50,
        height: targetHeight + 100,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 50 },
      { input: thresholdResized, left: targetWidth + 20, top: 50 },
      { input: centerResized, left: (targetWidth * 2) + 30, top: 50 },
      { input: edgeResized, left: (targetWidth * 3) + 40, top: 50 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'user1-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Comparison image saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create comparison: ${error.message}`);
  }
}

// Run the processing
processUser1Image().catch(console.error);













/**
 * Working Background Removal
 * 
 * Implements real background removal using working Sharp algorithms
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function workingBackgroundRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Working Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height, channels } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);
    console.log(`🎨 Channels: ${channels}`);

    // Method 1: Simple background removal with color thresholding
    console.log('\n🔧 Method 1: Color Threshold Background Removal...');
    const colorResult = await colorThresholdRemoval(imageBuffer, width, height);
    const colorPath = path.join(outputDir, 'color-threshold-removal.jpg');
    fs.writeFileSync(colorPath, colorResult);
    console.log(`✅ Color threshold result: ${colorPath}`);

    // Method 2: Edge-based background removal
    console.log('\n🔧 Method 2: Edge-based Background Removal...');
    const edgeResult = await edgeBasedRemoval(imageBuffer, width, height);
    const edgePath = path.join(outputDir, 'edge-based-removal.jpg');
    fs.writeFileSync(edgePath, edgeResult);
    console.log(`✅ Edge-based result: ${edgePath}`);

    // Method 3: Center-focused background removal
    console.log('\n🔧 Method 3: Center-focused Background Removal...');
    const centerResult = await centerFocusedRemoval(imageBuffer, width, height);
    const centerPath = path.join(outputDir, 'center-focused-removal.jpg');
    fs.writeFileSync(centerPath, centerResult);
    console.log(`✅ Center-focused result: ${centerPath}`);

    // Method 4: Create transparent background
    console.log('\n🔧 Method 4: Transparent Background Creation...');
    const transparentResult = await createTransparentBackground(imageBuffer, width, height);
    const transparentPath = path.join(outputDir, 'transparent-background.png');
    fs.writeFileSync(transparentPath, transparentResult);
    console.log(`✅ Transparent background result: ${transparentPath}`);

    // Method 5: Create comparison image
    console.log('\n🔧 Method 5: Creating Comparison Image...');
    await createComparisonImage(imageBuffer, colorResult, edgeResult, centerResult, outputDir);

    console.log('\n🎉 Background removal completed!');
    console.log('📸 Check the processed images to see the different background removal methods!');

  } catch (error) {
    console.error('❌ Background removal failed:', error.message);
  }
}

async function colorThresholdRemoval(imageBuffer, width, height) {
  // Get the image data
  const { data } = await sharp(imageBuffer)
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Find the most common color (background)
  const colorCounts = {};
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${Math.floor(r/10)}_${Math.floor(g/10)}_${Math.floor(b/10)}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  const dominantColorKey = Object.keys(colorCounts)
    .sort((a, b) => colorCounts[b] - colorCounts[a])[0];
  const [r, g, b] = dominantColorKey.split('_').map(Number);

  console.log(`   🎨 Dominant background color: RGB(${r*10}, ${g*10}, ${b*10})`);

  // Create mask based on color similarity
  const threshold = 30;
  const maskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const pixelR = data[i];
    const pixelG = data[i + 1];
    const pixelB = data[i + 2];
    
    const distance = Math.sqrt(
      Math.pow(pixelR - r*10, 2) +
      Math.pow(pixelG - g*10, 2) +
      Math.pow(pixelB - b*10, 2)
    );
    
    maskData[i / 3] = distance < threshold ? 0 : 255;
  }

  // Apply mask to original image
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ 
      input: Buffer.from(maskData), 
      blend: 'multiply',
      left: 0,
      top: 0
    }])
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

async function centerFocusedRemoval(imageBuffer, width, height) {
  // Create a mask that focuses on the center area (where the subject likely is)
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;

  // Create a circular mask
  const mask = await sharp({
    create: {
      width,
      height,
      channels: 1,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .composite([{
    input: Buffer.from([255]), // White
    left: Math.floor(centerX - radius),
    top: Math.floor(centerY - radius),
    blend: 'over'
  }])
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

async function createTransparentBackground(imageBuffer, width, height) {
  // Create a mask for the subject
  const mask = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .threshold(120)
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

async function createComparisonImage(original, colorResult, edgeResult, centerResult, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 200;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const colorResized = await sharp(colorResult)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const edgeResized = await sharp(edgeResult)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const centerResized = await sharp(centerResult)
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
      { input: colorResized, left: targetWidth + 20, top: 40 },
      { input: edgeResized, left: (targetWidth * 2) + 30, top: 40 },
      { input: centerResized, left: (targetWidth * 3) + 40, top: 40 }
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

// Run the working background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

workingBackgroundRemoval(inputPath, outputDir)
  .catch(console.error);








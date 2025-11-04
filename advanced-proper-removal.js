/**
 * Advanced Proper Background Removal
 * 
 * Uses sophisticated algorithms for real background removal
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function advancedProperRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Advanced Proper Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: Smart color-based removal
    console.log('\n🔧 Method 1: Smart Color-based Background Removal...');
    const smartColorResult = await smartColorRemoval(imageBuffer, width, height);
    const smartColorPath = path.join(outputDir, 'smart-color-removal.png');
    fs.writeFileSync(smartColorPath, smartColorResult);
    console.log(`✅ Smart color result: ${smartColorPath}`);

    // Method 2: Edge detection + color analysis
    console.log('\n🔧 Method 2: Edge + Color Analysis Removal...');
    const edgeColorResult = await edgeColorRemoval(imageBuffer, width, height);
    const edgeColorPath = path.join(outputDir, 'edge-color-removal.png');
    fs.writeFileSync(edgeColorPath, edgeColorResult);
    console.log(`✅ Edge + color result: ${edgeColorPath}`);

    // Method 3: Center-weighted removal
    console.log('\n🔧 Method 3: Center-weighted Background Removal...');
    const centerWeightedResult = await centerWeightedRemoval(imageBuffer, width, height);
    const centerWeightedPath = path.join(outputDir, 'center-weighted-removal.png');
    fs.writeFileSync(centerWeightedPath, centerWeightedResult);
    console.log(`✅ Center-weighted result: ${centerWeightedPath}`);

    // Method 4: Multi-threshold removal
    console.log('\n🔧 Method 4: Multi-threshold Background Removal...');
    const multiThresholdResult = await multiThresholdRemoval(imageBuffer, width, height);
    const multiThresholdPath = path.join(outputDir, 'multi-threshold-removal.png');
    fs.writeFileSync(multiThresholdPath, multiThresholdResult);
    console.log(`✅ Multi-threshold result: ${multiThresholdPath}`);

    // Method 5: Create advanced comparison
    console.log('\n🔧 Method 5: Creating Advanced Comparison...');
    await createAdvancedComparison(imageBuffer, smartColorResult, edgeColorResult, centerWeightedResult, multiThresholdResult, outputDir);

    console.log('\n🎉 Advanced proper background removal completed!');
    console.log('📸 Check the processed images to see the ADVANCED background removal results!');

  } catch (error) {
    console.error('❌ Advanced background removal failed:', error.message);
  }
}

async function smartColorRemoval(imageBuffer, width, height) {
  // Analyze the image to find background colors
  const { data } = await sharp(imageBuffer)
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Find the most common colors (likely background)
  const colorCounts = {};
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${Math.floor(r/20)}_${Math.floor(g/20)}_${Math.floor(b/20)}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  // Get the top 3 most common colors
  const topColors = Object.keys(colorCounts)
    .sort((a, b) => colorCounts[b] - colorCounts[a])
    .slice(0, 3);

  console.log(`   🎨 Top background colors found: ${topColors.length}`);

  // Create a mask that removes these background colors
  const maskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    let isBackground = false;
    for (const colorKey of topColors) {
      const [cr, cg, cb] = colorKey.split('_').map(Number);
      const distance = Math.sqrt(
        Math.pow(r - cr*20, 2) +
        Math.pow(g - cg*20, 2) +
        Math.pow(b - cb*20, 2)
      );
      
      if (distance < 40) { // Color similarity threshold
        isBackground = true;
        break;
      }
    }
    
    maskData[i / 3] = isBackground ? 0 : 255;
  }

  // Apply the mask to create transparency
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: Buffer.from(maskData), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function edgeColorRemoval(imageBuffer, width, height) {
  // First, detect edges
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  const edges = await sharp(grayscale)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
    })
    .normalize()
    .toBuffer();

  // Create edge mask
  const edgeMask = await sharp(edges)
    .threshold(100)
    .png()
    .toBuffer();

  // Combine with color analysis
  const { data } = await sharp(imageBuffer)
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check if pixel is in edge area or has subject-like colors
    const isEdge = edgeMask[i / 3] > 128;
    const isSubjectColor = r > 100 && g > 100 && b > 100; // Subject-like colors
    
    maskData[i / 3] = (isEdge || isSubjectColor) ? 255 : 0;
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

async function centerWeightedRemoval(imageBuffer, width, height) {
  // Create a center-weighted mask
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  const maskData = Buffer.alloc(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const weight = 1 - (distance / maxDistance);
      const threshold = 0.3 + (weight * 0.4); // Higher threshold near edges
      
      const pixelIndex = (y * width + x) * 3;
      const r = imageBuffer[pixelIndex] || 0;
      const g = imageBuffer[pixelIndex + 1] || 0;
      const b = imageBuffer[pixelIndex + 2] || 0;
      
      const brightness = (r + g + b) / 3 / 255;
      maskData[y * width + x] = brightness > threshold ? 255 : 0;
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

async function multiThresholdRemoval(imageBuffer, width, height) {
  // Use multiple thresholds to create a better mask
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create masks with different thresholds
  const mask1 = await sharp(grayscale)
    .threshold(100)
    .png()
    .toBuffer();

  const mask2 = await sharp(grayscale)
    .threshold(140)
    .png()
    .toBuffer();

  const mask3 = await sharp(grayscale)
    .threshold(180)
    .png()
    .toBuffer();

  // Combine masks
  const { data: data1 } = await sharp(mask1).raw().toBuffer({ resolveWithObject: true });
  const { data: data2 } = await sharp(mask2).raw().toBuffer({ resolveWithObject: true });
  const { data: data3 } = await sharp(mask3).raw().toBuffer({ resolveWithObject: true });

  const combinedMaskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data1.length; i++) {
    // Use the most restrictive mask (most white pixels)
    const value1 = data1[i];
    const value2 = data2[i];
    const value3 = data3[i];
    
    combinedMaskData[i] = Math.max(value1, value2, value3);
  }

  // Apply the combined mask
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: Buffer.from(combinedMaskData), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function createAdvancedComparison(original, smartColor, edgeColor, centerWeighted, multiThreshold, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 200;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const smartColorResized = await sharp(smartColor)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const edgeColorResized = await sharp(edgeColor)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const centerWeightedResized = await sharp(centerWeighted)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const multiThresholdResized = await sharp(multiThreshold)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    // Create advanced comparison
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
      { input: smartColorResized, left: targetWidth + 20, top: 50 },
      { input: edgeColorResized, left: (targetWidth * 2) + 30, top: 50 },
      { input: centerWeightedResized, left: (targetWidth * 3) + 40, top: 50 },
      { input: multiThresholdResized, left: (targetWidth * 4) + 50, top: 50 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'advanced-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Advanced comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create advanced comparison: ${error.message}`);
  }
}

// Run the advanced proper background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

advancedProperRemoval(inputPath, outputDir)
  .catch(console.error);








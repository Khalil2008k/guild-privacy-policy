/**
 * Professional Background Removal
 * 
 * Creates high-quality background removal that preserves image quality
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function professionalBackgroundRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Professional Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: High-quality threshold removal
    console.log('\n🔧 Method 1: High-Quality Threshold Removal...');
    const highQualityResult = await highQualityThresholdRemoval(imageBuffer, width, height);
    const highQualityPath = path.join(outputDir, 'high-quality-removal.png');
    fs.writeFileSync(highQualityPath, highQualityResult);
    console.log(`✅ High-quality result: ${highQualityPath}`);

    // Method 2: Professional edge-based removal
    console.log('\n🔧 Method 2: Professional Edge-based Removal...');
    const professionalEdgeResult = await professionalEdgeRemoval(imageBuffer, width, height);
    const professionalEdgePath = path.join(outputDir, 'professional-edge-removal.png');
    fs.writeFileSync(professionalEdgePath, professionalEdgeResult);
    console.log(`✅ Professional edge result: ${professionalEdgePath}`);

    // Method 3: Smart color-based removal
    console.log('\n🔧 Method 3: Smart Color-based Removal...');
    const smartColorResult = await smartColorRemoval(imageBuffer, width, height);
    const smartColorPath = path.join(outputDir, 'smart-color-removal.png');
    fs.writeFileSync(smartColorPath, smartColorResult);
    console.log(`✅ Smart color result: ${smartColorPath}`);

    // Method 4: Create clean white background versions
    console.log('\n🔧 Method 4: Creating Clean White Background Versions...');
    await createCleanWhiteBackgroundVersions(highQualityResult, professionalEdgeResult, smartColorResult, outputDir);

    // Method 5: Create professional comparison
    console.log('\n🔧 Method 5: Creating Professional Comparison...');
    await createProfessionalComparison(imageBuffer, highQualityResult, professionalEdgeResult, smartColorResult, outputDir);

    console.log('\n🎉 Professional background removal completed!');
    console.log('📸 Check the processed images to see the PROFESSIONAL background removal results!');

  } catch (error) {
    console.error('❌ Professional background removal failed:', error.message);
  }
}

async function highQualityThresholdRemoval(imageBuffer, width, height) {
  // Convert to grayscale with high quality
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .toBuffer();

  // Create a high-quality mask using multiple thresholds
  const mask1 = await sharp(grayscale)
    .threshold(100)
    .png()
    .toBuffer();

  const mask2 = await sharp(grayscale)
    .threshold(150)
    .png()
    .toBuffer();

  const mask3 = await sharp(grayscale)
    .threshold(200)
    .png()
    .toBuffer();

  // Combine masks for better quality
  const { data: data1 } = await sharp(mask1).raw().toBuffer({ resolveWithObject: true });
  const { data: data2 } = await sharp(mask2).raw().toBuffer({ resolveWithObject: true });
  const { data: data3 } = await sharp(mask3).raw().toBuffer({ resolveWithObject: true });

  const combinedMaskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data1.length; i++) {
    // Use the most restrictive mask (most white pixels)
    const value1 = data1[i];
    const value2 = data2[i];
    const value3 = data3[i];
    
    // Average the masks for smoother edges
    combinedMaskData[i] = Math.floor((value1 + value2 + value3) / 3);
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

async function professionalEdgeRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
    .toBuffer();

  // Apply professional edge detection
  const edges = await sharp(grayscale)
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
    })
    .normalize()
    .blur(0.5) // Slight blur for smoother edges
    .toBuffer();

  // Create mask from edges with better quality
  const mask = await sharp(edges)
    .threshold(80)
    .png()
    .toBuffer();

  // Apply mask with better blending
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function smartColorRemoval(imageBuffer, width, height) {
  // Get image data for color analysis
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
    const key = `${Math.floor(r/25)}_${Math.floor(g/25)}_${Math.floor(b/25)}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  // Get the top 2 most common colors
  const topColors = Object.keys(colorCounts)
    .sort((a, b) => colorCounts[b] - colorCounts[a])
    .slice(0, 2);

  console.log(`   🎨 Top background colors found: ${topColors.length}`);

  // Create mask based on color similarity
  const threshold = 60;
  const maskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    let isBackground = false;
    for (const colorKey of topColors) {
      const [cr, cg, cb] = colorKey.split('_').map(Number);
      const distance = Math.sqrt(
        Math.pow(r - cr*25, 2) +
        Math.pow(g - cg*25, 2) +
        Math.pow(b - cb*25, 2)
      );
      
      if (distance < threshold) {
        isBackground = true;
        break;
      }
    }
    
    maskData[i / 3] = isBackground ? 0 : 255;
  }

  // Apply mask
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .png()
    .composite([{ input: Buffer.from(maskData), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return result;
}

async function createCleanWhiteBackgroundVersions(highQualityResult, professionalEdgeResult, smartColorResult, outputDir) {
  // Get dimensions
  const { width, height } = await sharp(highQualityResult).metadata();
  
  // Create clean white background
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

  // Create clean white background versions
  const whiteHighQuality = await sharp(whiteBackground)
    .composite([{ input: highQualityResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const whiteProfessionalEdge = await sharp(whiteBackground)
    .composite([{ input: professionalEdgeResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const whiteSmartColor = await sharp(whiteBackground)
    .composite([{ input: smartColorResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  // Save clean white background versions
  fs.writeFileSync(path.join(outputDir, 'white-high-quality.jpg'), whiteHighQuality);
  fs.writeFileSync(path.join(outputDir, 'white-professional-edge.jpg'), whiteProfessionalEdge);
  fs.writeFileSync(path.join(outputDir, 'white-smart-color.jpg'), whiteSmartColor);

  console.log(`   ✅ Clean white background versions created`);
}

async function createProfessionalComparison(original, highQualityResult, professionalEdgeResult, smartColorResult, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 250;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const highQualityResized = await sharp(highQualityResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const professionalEdgeResized = await sharp(professionalEdgeResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const smartColorResized = await sharp(smartColorResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    // Create professional comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 4 + 60,
        height: targetHeight + 120,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 60 },
      { input: highQualityResized, left: targetWidth + 20, top: 60 },
      { input: professionalEdgeResized, left: (targetWidth * 2) + 30, top: 60 },
      { input: smartColorResized, left: (targetWidth * 3) + 40, top: 60 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'professional-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Professional comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create professional comparison: ${error.message}`);
  }
}

// Run the professional background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

professionalBackgroundRemoval(inputPath, outputDir)
  .catch(console.error);











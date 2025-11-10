/**
 * Effective Background Removal
 * 
 * Creates real background removal that actually works
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function effectiveBackgroundRemoval(inputPath, outputDir) {
  try {
    console.log('🎨 Effective Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Method 1: Simple but effective threshold removal
    console.log('\n🔧 Method 1: Effective Threshold Removal...');
    const thresholdResult = await effectiveThresholdRemoval(imageBuffer, width, height);
    const thresholdPath = path.join(outputDir, 'effective-threshold.png');
    fs.writeFileSync(thresholdPath, thresholdResult);
    console.log(`✅ Effective threshold result: ${thresholdPath}`);

    // Method 2: Center-focused effective removal
    console.log('\n🔧 Method 2: Center-focused Effective Removal...');
    const centerResult = await centerFocusedEffectiveRemoval(imageBuffer, width, height);
    const centerPath = path.join(outputDir, 'center-focused-effective.png');
    fs.writeFileSync(centerPath, centerResult);
    console.log(`✅ Center-focused result: ${centerPath}`);

    // Method 3: Color-based effective removal
    console.log('\n🔧 Method 3: Color-based Effective Removal...');
    const colorResult = await colorBasedEffectiveRemoval(imageBuffer, width, height);
    const colorPath = path.join(outputDir, 'color-based-effective.png');
    fs.writeFileSync(colorPath, colorResult);
    console.log(`✅ Color-based result: ${colorPath}`);

    // Method 4: Create white background versions
    console.log('\n🔧 Method 4: Creating White Background Versions...');
    await createWhiteBackgroundVersions(thresholdResult, centerResult, colorResult, outputDir);

    // Method 5: Create comparison
    console.log('\n🔧 Method 5: Creating Effective Comparison...');
    await createEffectiveComparison(imageBuffer, thresholdResult, centerResult, colorResult, outputDir);

    console.log('\n🎉 Effective background removal completed!');
    console.log('📸 Check the processed images to see the EFFECTIVE background removal results!');

  } catch (error) {
    console.error('❌ Effective background removal failed:', error.message);
  }
}

async function effectiveThresholdRemoval(imageBuffer, width, height) {
  // Convert to grayscale
  const grayscale = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .toBuffer();

  // Create a mask using threshold
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

async function centerFocusedEffectiveRemoval(imageBuffer, width, height) {
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
      
      // Create a smooth transition from center to edges
      let maskValue;
      if (normalizedDistance < 0.3) {
        maskValue = 255; // Keep center area
      } else if (normalizedDistance < 0.7) {
        maskValue = 255 - Math.floor((normalizedDistance - 0.3) * 255 / 0.4); // Gradual transition
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

async function colorBasedEffectiveRemoval(imageBuffer, width, height) {
  // Get image data
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
    const key = `${Math.floor(r/30)}_${Math.floor(g/30)}_${Math.floor(b/30)}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  const dominantColorKey = Object.keys(colorCounts)
    .sort((a, b) => colorCounts[b] - colorCounts[a])[0];
  const [r, g, b] = dominantColorKey.split('_').map(Number);

  console.log(`   🎨 Dominant background color: RGB(${r*30}, ${g*30}, ${b*30})`);

  // Create mask based on color similarity
  const threshold = 50;
  const maskData = Buffer.alloc(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const pixelR = data[i];
    const pixelG = data[i + 1];
    const pixelB = data[i + 2];
    
    const distance = Math.sqrt(
      Math.pow(pixelR - r*30, 2) +
      Math.pow(pixelG - g*30, 2) +
      Math.pow(pixelB - b*30, 2)
    );
    
    maskData[i / 3] = distance < threshold ? 0 : 255;
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

async function createWhiteBackgroundVersions(thresholdResult, centerResult, colorResult, outputDir) {
  // Create white background
  const { width, height } = await sharp(thresholdResult).metadata();
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

  const whiteColor = await sharp(whiteBackground)
    .composite([{ input: colorResult, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  // Save white background versions
  fs.writeFileSync(path.join(outputDir, 'white-threshold.jpg'), whiteThreshold);
  fs.writeFileSync(path.join(outputDir, 'white-center.jpg'), whiteCenter);
  fs.writeFileSync(path.join(outputDir, 'white-color.jpg'), whiteColor);

  console.log(`   ✅ White background versions created`);
}

async function createEffectiveComparison(original, thresholdResult, centerResult, colorResult, outputDir) {
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

    const colorResized = await sharp(colorResult)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    // Create effective comparison
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
      { input: colorResized, left: (targetWidth * 3) + 40, top: 50 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'effective-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Effective comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create effective comparison: ${error.message}`);
  }
}

// Run the effective background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

effectiveBackgroundRemoval(inputPath, outputDir)
  .catch(console.error);













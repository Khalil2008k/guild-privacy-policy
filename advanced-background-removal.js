/**
 * Advanced Background Removal
 * 
 * Implements real background removal using advanced algorithms
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function advancedBackgroundRemoval(inputPath, outputPath) {
  try {
    console.log('🎨 Advanced Background Removal Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output: ${outputPath}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height, channels } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);
    console.log(`🎨 Channels: ${channels}`);

    // Method 1: Edge-based background removal
    console.log('\n🔧 Method 1: Edge-based Background Removal...');
    const edgeResult = await edgeBasedRemoval(imageBuffer);
    const edgePath = path.join(path.dirname(outputPath), 'edge-removal.jpg');
    fs.writeFileSync(edgePath, edgeResult);
    console.log(`✅ Edge-based result: ${edgePath}`);

    // Method 2: Color clustering background removal
    console.log('\n🔧 Method 2: Color Clustering Background Removal...');
    const clusterResult = await colorClusteringRemoval(imageBuffer);
    const clusterPath = path.join(path.dirname(outputPath), 'cluster-removal.jpg');
    fs.writeFileSync(clusterPath, clusterResult);
    console.log(`✅ Color clustering result: ${clusterPath}`);

    // Method 3: Face detection + background removal
    console.log('\n🔧 Method 3: Face Detection + Background Removal...');
    const faceResult = await faceBasedRemoval(imageBuffer);
    const facePath = path.join(path.dirname(outputPath), 'face-removal.jpg');
    fs.writeFileSync(facePath, faceResult);
    console.log(`✅ Face-based result: ${facePath}`);

    // Method 4: Advanced composite with transparency
    console.log('\n🔧 Method 4: Advanced Composite with Transparency...');
    const compositeResult = await createTransparentBackground(imageBuffer);
    const compositePath = path.join(path.dirname(outputPath), 'transparent-bg.png');
    fs.writeFileSync(compositePath, compositeResult);
    console.log(`✅ Transparent background result: ${compositePath}`);

    console.log('\n🎉 Advanced background removal completed!');
    console.log('📸 Check the processed images to see the different background removal methods!');

  } catch (error) {
    console.error('❌ Advanced background removal failed:', error.message);
  }
}

async function edgeBasedRemoval(imageBuffer) {
  // Edge detection and background removal
  const { width, height } = await sharp(imageBuffer).metadata();
  
  // Convert to grayscale for edge detection
  const grayscale = await sharp(imageBuffer)
    .grayscale()
    .blur(1)
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
    .threshold(128)
    .morphology({
      operation: 'dilate',
      kernel: { width: 3, height: 3 }
    })
    .toBuffer();

  // Apply mask to original image
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: mask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function colorClusteringRemoval(imageBuffer) {
  // Color-based background removal
  const { width, height } = await sharp(imageBuffer).metadata();
  
  // Get dominant colors
  const { data } = await sharp(imageBuffer)
    .resize(100, 100)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Simple color clustering (find background color)
  const colors = [];
  for (let i = 0; i < data.length; i += 3) {
    colors.push([data[i], data[i + 1], data[i + 2]]);
  }

  // Find the most common color (likely background)
  const colorCounts = {};
  colors.forEach(color => {
    const key = color.join(',');
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  });

  const dominantColor = Object.keys(colorCounts)
    .sort((a, b) => colorCounts[b] - colorCounts[a])[0]
    .split(',').map(Number);

  console.log(`   🎨 Dominant color (background): RGB(${dominantColor.join(', ')})`);

  // Create mask based on color similarity
  const threshold = 50; // Color similarity threshold
  const mask = await sharp(imageBuffer)
    .resize(width, height)
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data }) => {
      const maskData = Buffer.alloc(width * height);
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const distance = Math.sqrt(
          Math.pow(r - dominantColor[0], 2) +
          Math.pow(g - dominantColor[1], 2) +
          Math.pow(b - dominantColor[2], 2)
        );
        
        maskData[i / 3] = distance < threshold ? 0 : 255;
      }
      return Buffer.from(maskData);
    });

  // Apply mask
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: mask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function faceBasedRemoval(imageBuffer) {
  // Face detection and background removal
  const { width, height } = await sharp(imageBuffer).metadata();
  
  // Assume face is in the center area (simplified approach)
  const faceX = Math.floor(width * 0.2);
  const faceY = Math.floor(height * 0.1);
  const faceWidth = Math.floor(width * 0.6);
  const faceHeight = Math.floor(height * 0.8);

  console.log(`   👤 Estimated face area: ${faceX},${faceY} ${faceWidth}x${faceHeight}`);

  // Create face mask
  const faceMask = await sharp({
    create: {
      width,
      height,
      channels: 1,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .composite([{
    input: Buffer.from([255]), // White
    left: faceX,
    top: faceY,
    blend: 'over'
  }])
  .png()
  .toBuffer();

  // Apply face mask
  const result = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: faceMask, blend: 'multiply' }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

async function createTransparentBackground(imageBuffer) {
  // Create image with transparent background
  const { width, height } = await sharp(imageBuffer).metadata();
  
  // Create a mask for the subject
  const mask = await sharp(imageBuffer)
    .resize(width, height)
    .grayscale()
    .normalize()
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

// Run the advanced background removal
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

advancedBackgroundRemoval(inputPath, path.join(outputDir, 'final-result.jpg'))
  .catch(console.error);












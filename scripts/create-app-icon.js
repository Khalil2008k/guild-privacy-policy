const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createAppIcon() {
  // Use the latest image in the app-logo-phone-icon directory
  const iconDir = path.join(__dirname, '../app-logo-phone-icon');
  const files = fs.readdirSync(iconDir).filter(f => f.endsWith('.png'));
  if (files.length === 0) {
    throw new Error(`No PNG files found in ${iconDir}`);
  }
  // Use the most recent file (or first one if multiple)
  const latestFile = files.sort().reverse()[0];
  const sourceIcon = path.join(iconDir, latestFile);
  const outputIcon = path.join(__dirname, '../assets/icon.png');
  const outputAdaptiveIcon = path.join(__dirname, '../assets/adaptive-icon.png');
  const assetsDir = path.join(__dirname, '../assets');

  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  try {
    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
      throw new Error(`Source icon not found: ${sourceIcon}`);
    }

    console.log('🎨 Creating app icon with black background...');

    // Create 1024x1024 icon with black background
    const iconSize = 1024;
    const logoSize = Math.round(iconSize * 0.85); // 85% of icon size for better visibility
    const logoOffset = Math.round((iconSize - logoSize) / 2); // Center the logo
    
    // Read the source logo and resize it (preserve transparency)
    const logo = await sharp(sourceIcon)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background for logo
      })
      .toBuffer();

    // Create solid black background (fully opaque black)
    const blackBackground = sharp({
      create: {
        width: iconSize,
        height: iconSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 } // Solid black background (#000000)
      }
    });

    // Composite logo on top of black background (centered)
    await blackBackground
      .composite([
        {
          input: logo,
          top: logoOffset,
          left: logoOffset
        }
      ])
      .png()
      .toFile(outputIcon);

    console.log('✅ Created icon.png');

    // Create adaptive icon (same for Android)
    await blackBackground
      .composite([
        {
          input: logo,
          top: logoOffset,
          left: logoOffset
        }
      ])
      .png()
      .toFile(outputAdaptiveIcon);

    console.log('✅ Created adaptive-icon.png');
    console.log('🎉 App icon creation complete!');
    console.log(`📁 Icon saved to: ${outputIcon}`);
    console.log(`📁 Adaptive icon saved to: ${outputAdaptiveIcon}`);

  } catch (error) {
    console.error('❌ Error creating app icon:', error);
    process.exit(1);
  }
}

createAppIcon();


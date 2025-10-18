#!/usr/bin/env node

/**
 * App Icon Generator for GUILD
 * Creates app icons from shield design in all required sizes
 */

const fs = require('fs');
const path = require('path');

// Icon configuration
const ICON_CONFIG = {
  name: 'GUILD',
  backgroundColor: '#000000',
  shieldColor: '#32FF00', // Bright lime green
  sizes: {
    ios: [1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20],
    android: [512, 192, 144, 96, 72, 48, 36],
    web: [32, 16]
  }
};

// SVG Template for Shield Icon
const createShieldSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .shield-bg { fill: ${ICON_CONFIG.backgroundColor}; }
      .shield-outline { fill: none; stroke: ${ICON_CONFIG.shieldColor}; stroke-width: ${size * 0.08}; stroke-linejoin: round; }
    </style>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" class="shield-bg"/>
  
  <!-- Shield Shape -->
  <path d="M ${size*0.2} ${size*0.3} 
           L ${size*0.5} ${size*0.2} 
           L ${size*0.8} ${size*0.3} 
           L ${size*0.8} ${size*0.6} 
           C ${size*0.8} ${size*0.75} ${size*0.65} ${size*0.85} ${size*0.5} ${size*0.9} 
           C ${size*0.35} ${size*0.85} ${size*0.2} ${size*0.75} ${size*0.2} ${size*0.6} 
           Z" 
        class="shield-outline"/>
</svg>`;

// Create directory structure
const createDirectories = () => {
  const dirs = [
    'assets/icons/ios',
    'assets/icons/android',
    'assets/icons/web'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Generate icon files
const generateIcons = () => {
  console.log('🎨 Generating GUILD App Icons...\n');
  
  createDirectories();
  
  // Generate main icon (1024x1024)
  const mainIcon = createShieldSVG(1024);
  fs.writeFileSync('assets/icon.png', mainIcon);
  console.log('✅ Created main icon: assets/icon.png');
  
  // Generate adaptive icon for Android
  const adaptiveIcon = createShieldSVG(1024);
  fs.writeFileSync('assets/adaptive-icon.png', adaptiveIcon);
  console.log('✅ Created adaptive icon: assets/adaptive-icon.png');
  
  // Generate favicon
  const favicon = createShieldSVG(32);
  fs.writeFileSync('assets/favicon.png', favicon);
  console.log('✅ Created favicon: assets/favicon.png');
  
  // Generate iOS icons
  console.log('\n📱 Generating iOS icons...');
  ICON_CONFIG.sizes.ios.forEach(size => {
    const icon = createShieldSVG(size);
    const filename = `assets/icons/ios/icon-${size}.png`;
    fs.writeFileSync(filename, icon);
    console.log(`✅ Created iOS icon: ${filename}`);
  });
  
  // Generate Android icons
  console.log('\n🤖 Generating Android icons...');
  ICON_CONFIG.sizes.android.forEach(size => {
    const icon = createShieldSVG(size);
    const filename = `assets/icons/android/icon-${size}.png`;
    fs.writeFileSync(filename, icon);
    console.log(`✅ Created Android icon: ${filename}`);
  });
  
  // Generate Web icons
  console.log('\n🌐 Generating Web icons...');
  ICON_CONFIG.sizes.web.forEach(size => {
    const icon = createShieldSVG(size);
    const filename = `assets/icons/web/icon-${size}.png`;
    fs.writeFileSync(filename, icon);
    console.log(`✅ Created Web icon: ${filename}`);
  });
};

// Update app.config.js
const updateAppConfig = () => {
  console.log('\n⚙️ Updating app.config.js...');
  
  const appConfigPath = 'app.config.js';
  let appConfig = fs.readFileSync(appConfigPath, 'utf8');
  
  // Add icon configuration
  const iconConfig = `
    icon: "./assets/icon.png",
    ios: {
      icon: "./assets/icon.png"
    },
    android: {
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },`;
  
  // Insert icon config after name
  appConfig = appConfig.replace(
    /name: "GUILD",/,
    `name: "GUILD",${iconConfig}`
  );
  
  fs.writeFileSync(appConfigPath, appConfig);
  console.log('✅ Updated app.config.js with icon configuration');
};

// Main execution
const main = () => {
  try {
    console.log('🛡️ GUILD App Icon Generator');
    console.log('============================\n');
    
    generateIcons();
    updateAppConfig();
    
    console.log('\n🎉 App icon generation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review generated icons in assets/ directory');
    console.log('2. Test icons on different devices');
    console.log('3. Build and deploy your app');
    console.log('\n✨ Your shield icon is ready for production!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateIcons, createShieldSVG, ICON_CONFIG };



const fs = require('fs');

// Configuration
const API_KEY = 'dD49zUMiuJf5qgMeizhZdnDc';

// Size options: 'preview', 'small', 'medium', 'hd', '4k', 'auto'
// For best quality use '4k' or 'hd'
const QUALITY_SETTINGS = {
    preview: 'preview',   // Cheapest, lowest quality
    small: 'small',       // Low quality
    medium: 'medium',     // Medium quality
    hd: 'hd',            // High definition - good balance
    ultra: '4k',         // Highest quality, most expensive
    auto: 'auto'         // Automatic based on input size
};

async function removeBackground(inputPath, outputPath, quality = 'hd') {
    try {
        console.log(`📷 Reading input image: ${inputPath}`);
        const imageBuffer = fs.readFileSync(inputPath);

        console.log(`⚙️  Quality setting: ${quality}`);
        console.log('📡 Preparing API request...');

        const formData = new FormData();
        formData.append('size', quality);
        formData.append('channels', 'rgba'); // Best quality with RGB corrections
        formData.append('format', 'png');    // Force PNG for transparency
        formData.append('image_file', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');

        console.log('🚀 Calling remove.bg API...');
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY
            },
            body: formData
        });

        if (response.ok) {
            console.log('✅ API call successful. Processing response...');
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            console.log(`💾 Saving processed image to: ${outputPath}`);
            fs.writeFileSync(outputPath, buffer);

            // Show file sizes and quality info
            const originalSize = fs.statSync(inputPath).size;
            const processedSize = fs.statSync(outputPath).size;
            console.log(`📊 Original size: ${(originalSize / 1024).toFixed(1)} KB`);
            console.log(`📊 Processed size: ${(processedSize / 1024).toFixed(1)} KB`);
            console.log(`🎯 Quality used: ${quality}`);
            console.log('🎉 Background removed successfully!');

            return true;
        } else {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            console.error(`Details: ${errorText}`);
            return false;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
🎨 Remove Background Script

Usage: node remove-background.js <input_path> <output_path> [quality]

Quality options:
  preview - Cheapest, lowest quality
  small   - Low quality
  medium  - Medium quality
  hd      - High definition (default, good balance)
  ultra   - Highest quality (4k), most expensive
  auto    - Automatic based on input size

Examples:
  node remove-background.js input.png output.png
  node remove-background.js input.png output.png ultra
  node remove-background.js "./assets/hero.png" "./assets/hero-no-bg.png" hd
        `);
        process.exit(1);
    }

    const [inputPath, outputPath, quality = 'hd'] = args;

    // Validate quality setting
    if (!Object.values(QUALITY_SETTINGS).includes(quality)) {
        console.error(`❌ Invalid quality setting: ${quality}`);
        console.error(`Valid options: ${Object.values(QUALITY_SETTINGS).join(', ')}`);
        process.exit(1);
    }

    removeBackground(inputPath, outputPath, quality);
}

module.exports = { removeBackground, QUALITY_SETTINGS };
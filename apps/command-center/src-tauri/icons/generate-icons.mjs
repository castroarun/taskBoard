/**
 * Klarity Icon Generator
 * Converts icon-square.svg to all required Tauri icon formats
 *
 * Usage: node generate-icons.mjs
 *
 * Requires: npm install sharp
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateIcons() {
  console.log('Klarity Icon Generator\n');

  // Check if sharp is available
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.log('Sharp not installed. Installing...\n');
    console.log('Run: npm install sharp');
    console.log('Then re-run: node generate-icons.mjs\n');

    console.log('Alternative: Use the PowerShell script with ImageMagick');
    console.log('  winget install ImageMagick.ImageMagick');
    console.log('  .\\generate-icons.ps1\n');

    console.log('Or use online converter:');
    console.log('  https://realfavicongenerator.net/');
    return;
  }

  const svgPath = join(__dirname, 'icon-square.svg');

  if (!existsSync(svgPath)) {
    console.error('Error: icon-square.svg not found!');
    return;
  }

  const svgBuffer = readFileSync(svgPath);

  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'icon.png', size: 512 },
  ];

  console.log('Generating PNG icons...\n');

  for (const { name, size } of sizes) {
    const outputPath = join(__dirname, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✓ Created ${name} (${size}x${size})`);
  }

  // Generate ICO file (Windows) - requires png-to-ico or similar
  console.log('\nGenerating ICO file...');
  try {
    const pngToIco = (await import('png-to-ico')).default;

    // Create multiple sizes for ICO
    const icoSizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      icoSizes.map(size =>
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    const icoBuffer = await pngToIco(pngBuffers);
    writeFileSync(join(__dirname, 'icon.ico'), icoBuffer);
    console.log('  ✓ Created icon.ico');
  } catch (e) {
    console.log('  ⚠ Could not create icon.ico (install png-to-ico: npm install png-to-ico)');
    console.log('    Alternative: Use https://icoconvert.com/ to convert icon.png');
  }

  // Note about ICNS
  console.log('\nNote: icon.icns (macOS) must be created on a Mac using:');
  console.log('  iconutil -c icns icon.iconset/');
  console.log('  Or use: https://cloudconvert.com/png-to-icns\n');

  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);

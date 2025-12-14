import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon with a target/goal theme
function createSVG(size) {
  const padding = size * 0.1;
  const center = size / 2;
  const maxRadius = (size - padding * 2) / 2;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <circle cx="${center}" cy="${center}" r="${maxRadius * 0.8}" fill="none" stroke="white" stroke-width="${size * 0.04}"/>
  <circle cx="${center}" cy="${center}" r="${maxRadius * 0.5}" fill="none" stroke="white" stroke-width="${size * 0.04}"/>
  <circle cx="${center}" cy="${center}" r="${maxRadius * 0.2}" fill="white"/>
  <path d="M${center - maxRadius * 0.1} ${center - maxRadius * 0.6} L${center} ${center - maxRadius * 0.3} L${center + maxRadius * 0.3} ${center - maxRadius * 0.9}" fill="none" stroke="white" stroke-width="${size * 0.05}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Generate SVG files for each size
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Create a simple HTML file to help convert SVGs to PNGs
const converterHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Converter</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1a1a1a; color: white; }
    .icon-grid { display: flex; flex-wrap: wrap; gap: 20px; }
    .icon-item { text-align: center; }
    img { display: block; margin: 0 auto 10px; }
    a { color: #f97316; }
  </style>
</head>
<body>
  <h1>PWA Icons</h1>
  <p>Right-click each icon and "Save image as..." to save as PNG, or use an online SVG to PNG converter.</p>
  <div class="icon-grid">
    ${sizes.map(size => `
    <div class="icon-item">
      <img src="icons/icon-${size}x${size}.svg" width="${Math.min(size, 128)}" height="${Math.min(size, 128)}">
      <p>${size}x${size}</p>
    </div>`).join('')}
  </div>
  <script>
    // Auto-convert and download PNGs
    async function convertAll() {
      const sizes = ${JSON.stringify(sizes)};
      for (const size of sizes) {
        const img = new Image();
        img.src = \`icons/icon-\${size}x\${size}.svg\`;
        await new Promise(resolve => img.onload = resolve);
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        
        const link = document.createElement('a');
        link.download = \`icon-\${size}x\${size}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  </script>
  <button onclick="convertAll()" style="margin-top: 20px; padding: 10px 20px; background: #f97316; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 16px;">
    Download All as PNG
  </button>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../public/icon-converter.html'), converterHTML);
console.log('\\nGenerated icon-converter.html');
console.log('\\nTo convert SVGs to PNGs:');
console.log('1. Run your dev server: npm run dev');
console.log('2. Open http://localhost:3000/icon-converter.html');
console.log('3. Click "Download All as PNG" button');
console.log('4. Move the downloaded PNGs to public/icons/');


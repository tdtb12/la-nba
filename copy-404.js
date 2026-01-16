import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');

// Handle running from root or scripts dir
const possibleDistPaths = [
    path.resolve('dist'),
    path.resolve('../dist')
];

let foundIndex = false;

for (const dist of possibleDistPaths) {
    const src = path.join(dist, 'index.html');
    if (fs.existsSync(src)) {
        const dest = path.join(dist, '404.html');
        fs.copyFileSync(src, dest);
        console.log(`✅ Success: Copied ${src} to ${dest}`);
        foundIndex = true;
        break;
    }
}

if (!foundIndex) {
    console.error('❌ Error: dist/index.html not found. Build the project first.');
    process.exit(1);
}

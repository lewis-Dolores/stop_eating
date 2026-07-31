import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const modelsDir = path.join(rootDir, 'public', 'models');

// Create models directory
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('📥 Downloading COCO-SSD model...');
    const cocoBase = 'https://tfhub.dev/models/tfjs/coco-ssd/default/1/model.json';
    await downloadFile(cocoBase, path.join(modelsDir, 'coco-ssd', 'model.json'));
    
    // Download shard files for COCO-SSD
    const shardCount = 4;
    for (let i = 0; i < shardCount; i++) {
      const shardUrl = `https://tfhub.dev/models/tfjs/coco-ssd/default/1/group1-shard${i.toString().padStart(2, '0')}_of_${shardCount.toString().padStart(2, '0')}`;
      await downloadFile(shardUrl, path.join(modelsDir, 'coco-ssd', `group1-shard${i.toString().padStart(2, '0')}_of_4`));
    }
    console.log('✅ COCO-SSD downloaded');

    console.log('📥 Downloading MobileNet (lightweight alternative)...');
    // Use MobileNet which is smaller and public
    const mobilenetModel = 'https://tfhub.dev/models/tfjs/mobilenet_v2_100_224/classification/1/model.json';
    await downloadFile(mobilenetModel, path.join(modelsDir, 'mobilenet', 'model.json'));
    console.log('✅ MobileNet downloaded');

    console.log('✨ Models ready!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

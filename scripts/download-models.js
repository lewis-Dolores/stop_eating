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

const cocoSsdDir = path.join(modelsDir, 'coco-ssd');
if (!fs.existsSync(cocoSsdDir)) {
  fs.mkdirSync(cocoSsdDir, { recursive: true });
}

const t5Dir = path.join(modelsDir, 't5-small');
if (!fs.existsSync(t5Dir)) {
  fs.mkdirSync(t5Dir, { recursive: true });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Saved: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadCocoSsd() {
  console.log('📥 Downloading COCO-SSD model...');
  
  const files = [
    'model.json',
    'group1-shard1of1.bin'
  ];
  
  for (const file of files) {
    const url = `https://storage.googleapis.com/tfjs-models/savedmodel/coco-ssd/1/${file}`;
    const dest = path.join(cocoSsdDir, file);
    await downloadFile(url, dest);
  }
}

async function downloadT5Small() {
  console.log('📥 Downloading T5-Small model...');
  const modelId = 'Xenova/t5-small';
  
  const files = [
    'config.json',
    'tokenizer.json', 
    'model.json'
  ];
  
  for (const file of files) {
    const url = `https://huggingface.co/${modelId}/resolve/main/${file}`;
    const dest = path.join(t5Dir, file);
    try {
      await downloadFile(url, dest);
    } catch (err) {
      console.warn(`⚠️ Failed to download ${file}: ${err.message}`);
    }
  }
}

async function main() {
  try {
    await downloadCocoSsd();
    await downloadT5Small();
    console.log('✅ All models downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading models:', error.message);
    process.exit(1);
  }
}

main();

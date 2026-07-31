const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// COCO-SSD 模型檔案列表
const COCO_FILES = [
  'model.json',
  'shard1.bin',
  'shard2.bin',
  'shard3.bin',
  'shard4.bin'
];

// Gemma-2b-it 模型檔案 (使用 Transformers.js 格式)
const GEMMA_FILES = [
  'config.json',
  'tokenizer.json', 
  'tokenizer_config.json',
  'vocab.json',
  'merges.txt'
];

const COCO_BASE_URL = 'https://tfhub.dev/model/tfjs/coco-ssd/1/default/1';
const GEMMA_BASE_URL = 'https://huggingface.co/Xenova/gemma-2b-it/resolve/main';

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
        console.log(`✓ Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadCocoSsd() {
  console.log('📥 Downloading COCO-SSD model...');
  const cocoDir = path.join(MODELS_DIR, 'coco-ssd');
  fs.mkdirSync(cocoDir, { recursive: true });
  
  for (const file of COCO_FILES) {
    const url = `${COCO_BASE_URL}/${file}`;
    const dest = path.join(cocoDir, file);
    await downloadFile(url, dest);
  }
}

async function downloadGemma() {
  console.log('📥 Downloading Gemma-2b-it model...');
  const gemmaDir = path.join(MODELS_DIR, 'gemma-2b-it');
  fs.mkdirSync(gemmaDir, { recursive: true });
  
  for (const file of GEMMA_FILES) {
    const url = `${GEMMA_BASE_URL}/${file}`;
    const dest = path.join(gemmaDir, file);
    await downloadFile(url, dest);
  }
}

async function main() {
  try {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    
    await Promise.all([
      downloadCocoSsd(),
      downloadGemma()
    ]);
    
    console.log('✅ All models downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading models:', error.message);
    process.exit(1);
  }
}

main();

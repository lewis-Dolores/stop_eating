import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

async function main() {
  try {
    console.log('📥 Downloading COCO-SSD model...');
    const cocoDir = path.join(rootDir, 'public', 'models', 'coco-ssd');
    ensureDir(cocoDir);
    
    // Use correct COCO-SSD URLs from tfjs-models repo
    const cocoBaseUrl = 'https://raw.githubusercontent.com/tensorflow/tfjs-models/master/coco-ssd/src/';
    const cocoFiles = ['model.json', 'group1-shard1of1.bin'];
    
    for (const file of cocoFiles) {
      const url = `${cocoBaseUrl}${file}`;
      const dest = path.join(cocoDir, file);
      console.log(`📥 Downloading: ${url}`);
      await downloadFile(url, dest);
    }

    console.log('📥 Downloading T5-Small model...');
    const t5Dir = path.join(rootDir, 'public', 'models', 't5-small');
    ensureDir(t5Dir);
    
    // Use public Xenova/t5-small model
    const t5BaseUrl = 'https://huggingface.co/Xenova/t5-small/resolve/main/';
    const t5Files = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'model.onnx'];
    
    for (const file of t5Files) {
      const url = `${t5BaseUrl}${file}`;
      const dest = path.join(t5Dir, file);
      console.log(`📥 Downloading: ${url}`);
      await downloadFile(url, dest);
    }

    console.log('✅ All models downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading models:', error.message);
    process.exit(1);
  }
}

main();

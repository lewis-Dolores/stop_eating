import * as tf from '@tensorflow/tfjs'

let model = null

/**
 * 載入 YOLO 輕量模型 (COCO-SSD)
 */
export async function loadPersonDetector() {
  if (model) return model
  
  // 使用 COCO-SSD 輕量模型
  model = await tf.loadGraphModel(
    'https://tfhub.dev/deepmind/coco-ssd/1',
    { fromTFHub: true }
  )
  
  return model
}

/**
 * 偵測影像中是否有人形
 * @param {HTMLVideoElement} video - 視訊串流元素
 * @returns {Promise<boolean>} 是否偵測到人
 */
export async function detectPerson(video) {
  if (!model) {
    model = await loadPersonDetector()
  }
  
  const predictions = await model.detect(video)
  
  // COCO-SSD 中 "person" 類別的 id 通常是 0
  const hasPerson = predictions.some(pred => 
    pred.class === 'person' && pred.score > 0.5
  )
  
  return hasPerson
}

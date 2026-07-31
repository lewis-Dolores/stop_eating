import { pipeline } from '@xenova/transformers'

let generator = null

/**
 * 載入 Gemma 輕量模型 (Gemma-2B)
 */
export async function loadGemmaModel() {
  if (generator) return generator
  
  // 使用 Gemma-2B-it 量化模型
  generator = await pipeline(
    'text-generation',
    'Xenova/LaMini-Flan-T5-Small',
    {
      quantized: true,
      device: 'webgpu' // 優先使用 GPU
    }
  )
  
  return generator
}

/**
 * 生成勸阻深夜進食的提示詞
 * @param {string} timeText - 當前時間
 * @returns {Promise<string>} 生成的提示詞
 */
export async function generatePersuasionPrompt(timeText) {
  if (!generator) {
    generator = await loadGemmaModel()
  }
  
  const prompt = `現在是${timeText}，已經是深夜了。請用溫柔但堅定的語氣，說服用戶不要在這個時間吃東西或點外賣。請給出一個簡短（50 字以內）的勸阻理由。`
  
  const output = await generator(prompt, {
    max_new_tokens: 50,
    temperature: 0.7,
    do_sample: true
  })
  
  // 提取生成的文字（移除原始 prompt）
  const generatedText = output[0].generated_text.replace(prompt, '').trim()
  
  return generatedText || '夜深了，讓你的腸胃休息一下吧！明天再享受美食會更健康哦～'
}

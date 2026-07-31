/**
 * 使用 Web Speech API 進行文字轉語音
 */

let synth = null
let isSpeaking = false

/**
 * 初始化 TTS 引擎
 */
export function initTTS() {
  if (typeof window !== 'undefined') {
    synth = window.speechSynthesis
  }
}

/**
 * 朗讀文字
 * @param {string} text - 要朗讀的文字
 * @returns {Promise<void>}
 */
export function speak(text) {
  return new Promise((resolve, reject) => {
    if (!synth) {
      initTTS()
    }
    
    if (isSpeaking) {
      synth.cancel() // 停止當前播放
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // 設定語言為中文
    utterance.lang = 'zh-TW'
    utterance.rate = 1.0 // 正常語速
    utterance.pitch = 1.0 // 正常音調
    
    utterance.onstart = () => {
      isSpeaking = true
    }
    
    utterance.onend = () => {
      isSpeaking = false
      resolve()
    }
    
    utterance.onerror = (event) => {
      isSpeaking = false
      reject(new Error(`TTS Error: ${event.error}`))
    }
    
    synth.speak(utterance)
  })
}

/**
 * 停止朗讀
 */
export function stopSpeaking() {
  if (synth && isSpeaking) {
    synth.cancel()
    isSpeaking = false
  }
}

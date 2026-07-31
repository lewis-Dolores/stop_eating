import { useState, useEffect, useRef } from 'react'
import { isLateNight, getCurrentTimeText } from './utils/timeUtils'
import { detectPerson } from './utils/personDetection'
import { generatePersuasionPrompt } from './utils/gemmaIntegration'
import { speak, stopSpeaking } from './utils/ttsEngine'

export default function App() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [status, setStatus] = useState('就緒')
  const [isLoading, setIsLoading] = useState(true)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const monitorIntervalRef = useRef(null)
  const isProcessingRef = useRef(false)

  // 初始化時載入模型
  useEffect(() => {
    async function initModels() {
      try {
        setStatus('載入模型中...')
        // 預先載入模型（可選）
        await import('./utils/personDetection')
        await import('./utils/gemmaIntegration')
        setIsLoading(false)
        setStatus('就緒')
      } catch (error) {
        console.error('模型載入失敗:', error)
        setStatus('模型載入失敗')
        setIsLoading(false)
      }
    }
    
    initModels()
    
    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current)
      }
      stopSpeaking()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 啟動攝影機
  const startCamera = async () => {
    try {
      setStatus('啟動攝影機...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraOn(true)
        setStatus('攝影機已啟動')
      }
    } catch (error) {
      console.error('攝影機啟動失敗:', error)
      setStatus('攝影機啟動失敗')
    }
  }

  // 停止攝影機
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
    setStatus('攝影機已關閉')
  }

  // 開始監控
  const startMonitoring = () => {
    if (!isCameraOn) {
      alert('請先啟動攝影機')
      return
    }
    
    setIsMonitoring(true)
    setStatus('監控中...')
    
    // 每秒檢查一次
    monitorIntervalRef.current = setInterval(async () => {
      if (isProcessingRef.current) return
      
      // 檢查是否為深夜時段
      if (!isLateNight()) {
        setStatus(`目前不是深夜時段 (${getCurrentTimeText()})`)
        return
      }
      
      isProcessingRef.current = true
      
      try {
        // 偵測是否有人
        if (videoRef.current) {
          const hasPerson = await detectPerson(videoRef.current)
          
          if (hasPerson) {
            setStatus('偵測到人形，生成提示詞...')
            
            // 生成勸阻提示詞
            const timeText = getCurrentTimeText()
            const message = await generatePersuasionPrompt(timeText)
            
            setCurrentMessage(message)
            setStatus('朗讀中...')
            
            // 使用 TTS 朗讀
            await speak(message)
            
            setStatus('完成')
          } else {
            setStatus(`監控中... (${getCurrentTimeText()})`)
          }
        }
      } catch (error) {
        console.error('監控錯誤:', error)
        setStatus(`錯誤：${error.message}`)
      } finally {
        isProcessingRef.current = false
      }
    }, 1000)
  }

  // 停止監控
  const stopMonitoring = () => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current)
      monitorIntervalRef.current = null
    }
    stopSpeaking()
    setIsMonitoring(false)
    setCurrentMessage('')
    setStatus('已停止監控')
  }

  // 切換監控狀態
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring()
    } else {
      startMonitoring()
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>深夜禁食勸阻系統</h1>
        <p>{status}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🌙 深夜禁食勸阻系統</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>當前時間：</strong>{getCurrentTimeText()}</p>
        <p><strong>狀態：</strong>{status}</p>
        <p><strong>深夜時段：</strong>{isLateNight() ? '✅ 是 (21:00-04:00)' : '❌ 否'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          muted
          style={{ 
            width: '100%', 
            maxWidth: '640px', 
            borderRadius: '8px',
            display: isCameraOn ? 'block' : 'none'
          }} 
        />
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {!isCameraOn ? (
          <button 
            onClick={startCamera}
            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📷 啟動攝影機
          </button>
        ) : (
          <button 
            onClick={stopCamera}
            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📷 關閉攝影機
          </button>
        )}

        <button 
          onClick={toggleMonitoring}
          disabled={!isCameraOn || isLoading || !isLateNight()}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: isMonitoring ? '#ff9800' : '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: (isCameraOn && !isLoading && isLateNight()) ? 'pointer' : 'not-allowed',
            opacity: (isCameraOn && !isLoading && isLateNight()) ? 1 : 0.6
          }}
        >
          {isMonitoring ? '⏹️ 停止監控' : '▶️ 開始監控'}
        </button>
      </div>

      {currentMessage && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px', 
          borderLeft: '4px solid #2196F3',
          marginTop: '20px'
        }}>
          <h3>💬 AI 勸阻訊息：</h3>
          <p style={{ fontSize: '18px', lineHeight: '1.6' }}>{currentMessage}</p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', fontSize: '14px' }}>
        <h4>ℹ️ 使用說明：</h4>
        <ul>
          <li>系統僅在 <strong>21:00 - 04:00</strong> 期間運作</li>
          <li>啟動攝影機後點擊「開始監控」</li>
          <li>當偵測到人形時，AI 會生成勸阻訊息並朗讀</li>
          <li>所有處理都在本地瀏覽器完成，保護隱私</li>
          <li>首次使用需下載 AI 模型（約幾百 MB）</li>
        </ul>
      </div>
    </div>
  )
}

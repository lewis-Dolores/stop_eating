import { useEffect, useState } from 'react';
import { pipeline } from '@xenova/transformers';

export default function PromptGenerator({ onGenerate }) {
  const [generator, setGenerator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadModel() {
      try {
        setLoading(true);
        const task = await pipeline('text2text-generation', 'Xenova/t5-small', {
          quantized: true,
          local_model_path: '/models/t5-small'
        });
        setGenerator(task);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadModel();
  }, []);

  const generatePrompt = async (timeRange) => {
    if (!generator) return;
    
    const inputText = `Generate a short, persuasive message in Traditional Chinese to convince someone not to eat late at night. Time range: ${timeRange}. Keep it under 50 characters.`;
    
    try {
      const output = await generator(inputText, {
        max_new_tokens: 60,
        temperature: 0.7,
        do_sample: true
      });
      
      const message = output[0].generated_text.trim();
      onGenerate(message);
      return message;
    } catch (err) {
      console.error('Error generating prompt:', err);
      onGenerate('深夜進食會影響代謝，建議明天早餐再享用美食！');
    }
  };

  if (loading) return <div className="text-sm text-gray-500">載入 AI 模型中...</div>;
  if (error) return <div className="text-sm text-red-500">模型載入失敗：{error}</div>;
  
  return null;
}

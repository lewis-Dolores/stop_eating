import { useEffect, useState } from 'react';
import { pipeline } from '@xenova/transformers';

export default function PromptGenerator({ onGenerate }) {
  const [generator, setGenerator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModel() {
      try {
        const gen = await pipeline('text2text-generation', 'Xenova/t5-small');
        setGenerator(gen);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load model:', error);
        setLoading(false);
      }
    }
    loadModel();
  }, []);

  const generatePrompt = async (context) => {
    if (!generator) return;
    
    const prompt = `Generate a short persuasive message to discourage eating late at night. Context: ${context}`;
    const result = await generator(prompt, {
      max_new_tokens: 50,
      temperature: 0.7,
    });
    
    const message = result[0].generated_text;
    onGenerate(message);
  };

  if (loading) return <div>Loading AI model...</div>;
  
  return null;
}

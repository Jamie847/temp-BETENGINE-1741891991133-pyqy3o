import { useState, useEffect } from 'react';
import { Match, Prediction } from '../types';
import { AIAgent } from '../ai/AIAgent';

const agent = new AIAgent();

export function useAIAgent(match: Match | null) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generatePrediction() {
      if (!match) {
        setPrediction(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newPrediction = await agent.predictMatch(match);
        setPrediction(newPrediction);
      } catch (err) {
        setError('Failed to generate prediction');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    generatePrediction();
  }, [match]);

  return { prediction, isLoading, error };
}
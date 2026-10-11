import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const useAIGeneration = () => {
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState<boolean>(false);
  const [aiGenerationProgress, setAiGenerationProgress] = useState<string>('');

  // Retry logic with exponential backoff
  const callGenerateContentWithRetry = async (
    model: any,
    prompt: string,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<any> => {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        setAiGenerationProgress(`Generating questions... (Attempt ${attempt + 1}/${maxRetries})`);
        const result = await model.generateContent(prompt);
        return result;
      } catch (error) {
        lastError = error;
        const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

        // Only retry on 503 (Service Unavailable) errors
        if (errorMsg.includes('503') || errorMsg.includes('high demand')) {
          if (attempt < maxRetries - 1) {
            const delayMs = initialDelayMs * Math.pow(2, attempt);
            setAiGenerationProgress(`API is busy. Retrying in ${delayMs / 1000}s (Attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
        } else {
          // For other errors, don't retry
          throw error;
        }
      }
    }
    throw lastError;
  };

  const generateWithAI = async (
    apiKey: string,
    prompt: string,
    onSuccess: (response: string) => void,
    onError: (error: string) => void
  ) => {
    if (!apiKey || !prompt.trim()) {
      onError('API key or prompt is missing');
      return;
    }

    setIsGeneratingWithAI(true);
    setAiGenerationProgress('Initializing AI model...');

    try {
      setAiGenerationProgress('Connecting to Gemini API...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      setAiGenerationProgress('Generating questions...');
      const result = await callGenerateContentWithRetry(model, prompt);

      const response = await result.response;

      const text = response.text();

      // Check if response is empty
      if (!text || text.trim().length === 0) {
        const errorMsg = 'API returned empty response. This might indicate: 1) Content policy block, 2) Invalid API key with no proper error, 3) API service issue. Please try a different topic or check your API key.';
        onError(errorMsg);
        return;
      }


      setAiGenerationProgress('Processing response...');
      onSuccess(text);
    } catch (error) {
      console.error('❌ Error generating with AI:', error);
      console.log('📊 Error Type:', error instanceof Error ? 'Error object' : typeof error);

      // Check for token expiration
      let errorMessage = 'Failed to generate';
      let isTokenExpired = false;
      let isInvalidKey = false;
      let isQuotaExceeded = false;

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        const errorFullMsg = error.toString().toLowerCase();

        // Check for various token/auth issues
        if (errorMsg.includes('unauthorized') || errorMsg.includes('unauthenticated') || errorMsg.includes('invalid api key')) {
          isInvalidKey = true;
          errorMessage = '❌ INVALID API KEY - Please verify your Gemini API key is correct and still active';
        } else if (errorMsg.includes('api_key_invalid') || errorMsg.includes('invalid_api_key')) {
          isInvalidKey = true;
          errorMessage = '❌ API KEY VALIDATION FAILED - Your API key may have expired or been revoked';
        } else if (errorMsg.includes('token') && (errorMsg.includes('expire') || errorMsg.includes('invalid'))) {
          isTokenExpired = true;
          errorMessage = '❌ TOKEN EXPIRED - Your API authentication has expired. Please regenerate your API key';
        } else if (errorMsg.includes('quota') || errorMsg.includes('rate_limit')) {
          isQuotaExceeded = true;
          errorMessage = '❌ API QUOTA EXCEEDED - You\'ve reached your daily limit. Please try again tomorrow';
        } else if (errorMsg.includes('503') || errorMsg.includes('high demand')) {
          errorMessage = '⏳ GOOGLE GEMINI API OVERLOADED - Please try again in a few minutes. The AI service is experiencing high demand.';
        } else if (errorMsg.includes('permission denied')) {
          errorMessage = '❌ PERMISSION DENIED - Please check your API key permissions';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = '❌ NETWORK ERROR - Please check your internet connection';
        } else {
          errorMessage = `Failed to generate: ${error.message}`;
        }
      } else {
        errorMessage = 'Failed to generate. Check your API Key or Internet Connection.';
      }

      onError(errorMessage);
    } finally {
      setIsGeneratingWithAI(false);
      setAiGenerationProgress('');
    }
  };

  return {
    isGeneratingWithAI,
    aiGenerationProgress,
    generateWithAI
  };
};

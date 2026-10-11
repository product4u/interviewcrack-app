import { VideoQuestion } from '../types';

/**
 * Generates optimized prompt for video interview questions
 * Minimalist format - no token waste
 */
export const generateVideoInterviewPrompt = (
  topic: string,
  numberOfQuestions: number,
  context?: string
): string => {
  return `Generate exactly ${numberOfQuestions} ${topic} interview questions.

For EACH question use ONLY this format:
---
Q: [Question]
SHORT: [1-2 sentence answer]
FULL: [Short answer with code if needed]
HINT: [A friendly, subtle hint from a supportive colleague; do not reveal the answer]
BUDDY: [Explain conversationally like a friend sitting beside the candidate. Use a concrete analogy and, when useful, a fenced code example. End by encouraging them to answer in their own words.]

Context: ${context || 'A realistic company interview. Ask practical questions with increasing depth.'}
IMPORTANT: Keep SHORT answers to 1-2 sentences max. FULL and BUDDY answers can have code blocks.
Do NOT add extra fields, explanations, or metadata.
Start directly with Q: and use --- as separator.`;
};

/**
 * Parses AI response for video interview format
 * Strict field name matching only
 */
export const parseVideoInterviewResponse = (response: string): VideoQuestion[] => {
  const questions: VideoQuestion[] = [];


  // Split by question separator
  const questionBlocks = response.split(/---+/);

  for (const block of questionBlocks) {
    if (!block.trim()) {
      continue;
    }

    const question = parseQuestionBlock(block);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
};

const parseQuestionBlock = (block: string): VideoQuestion | null => {
  try {
    const lines = block.trim().split('\n');

    const result: any = {};
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // ONLY match these exact field names (case-insensitive)
      const match = trimmed.match(/^(Q|SHORT|FULL|HINT|BUDDY|A|Short|Full|Question|Answer|Expected):\s*(.*)$/i);

      if (match) {
        // Save previous field
        if (currentField && currentValue) {
          result[currentField] = currentValue.trim();
        }

        // Normalize field names
        const fieldName = match[1].toLowerCase();
        currentField = fieldName;
        currentValue = match[2];
      } else if (currentField) {
        // Append to current field value
        currentValue += '\n' + trimmed;
      }
    }

    // Save last field
    if (currentField && currentValue) {
      result[currentField] = currentValue.trim();
    }

    // Extract question - strict matching
    const questionText = result.q || result.question || '';

    // Extract short answer
    const shortAnswerText = result.short || result.short_answer || result.shortanswer || '';

    // Extract full answer
    const fullAnswerText = result.full || result.full_answer || result.fullanswer || result.answer || result.a || '';

    // Validate required fields - must have question and at least one answer
    if (!questionText || (!shortAnswerText && !fullAnswerText)) {
      return null;
    }

    // Extract keywords from short answer for scoring
    const keyWords = (shortAnswerText || fullAnswerText)
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !['the', 'and', 'that', 'with', 'from', 'this', 'when', 'what', 'where', 'code', 'example', 'your'].includes(w.toLowerCase()))
      .slice(0, 5)
      .map((w: string) => w.replace(/[,;.!?`\-_]/g, ''))
      .filter((w: string) => w.length > 0);

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      question: questionText,
      buddyHint: result.hint || undefined,
      buddyExplanation: result.buddy || undefined,
      expectedAnswer: fullAnswerText || shortAnswerText, // Full answer with code blocks if available
      shortAnswer: shortAnswerText || fullAnswerText, // Short answer for feedback section
      keyWords: keyWords.length > 0 ? keyWords : [questionText.split(' ')[0]],
    };
  } catch (error) {
    return null;
  }
};

/**
 * Validates if the response has the correct video interview format
 */
export const validateVideoInterviewResponse = (response: string): boolean => {
  // Check for simple format: Q:, SHORT:, FULL:
  const hasQuestions = /^Q:/im.test(response);
  const hasAnswers = /(SHORT|FULL|A|Answer):/im.test(response);
  const hasSeparators = /---/i.test(response);

  // Must have at least questions and answers
  return hasQuestions && hasAnswers && response.length > 50;
};

/**
 * Cleans and normalizes question data
 */
export const normalizeVideoQuestion = (question: VideoQuestion): VideoQuestion => {
  return {
    ...question,
    question: question.question.trim(),
    expectedAnswer: question.expectedAnswer.trim(),
    shortAnswer: question.shortAnswer.trim(),
    keyWords: question.keyWords.map(k => k.trim()).filter(k => k.length > 0),
  };
};

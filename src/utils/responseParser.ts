import { Question } from '../types';

const normalizeAIResponse = (text: string): string => {
  let normalized = text;

  // 0. Normalize Q[#]: to Q#: format first
  normalized = normalized.replace(/Q\[(\d+)\]:/g, 'Q$1:');

  // 1. Ensure each question starts on a new line
  normalized = normalized.replace(/(Q\d+:)/g, '\n$1');

  // 2. Ensure each option starts on a new line
  normalized = normalized.replace(/\s*([A-D]\))/g, '\n$1');

  // 3. Ensure "Correct Answer:" and "Explanation:" start on new lines
  normalized = normalized.replace(/\s*(Correct Answer:)/gi, '\n$1');
  normalized = normalized.replace(/\s*(Explanation:)/gi, '\n$1');

  // 4. Remove excessive blank lines
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  // 5. Trim leading/trailing whitespace
  normalized = normalized.trim();

  return normalized;
};

export const parseAIResponse = (aiResponseText: string): Question[] => {
  const normalized = normalizeAIResponse(aiResponseText);
  const questions: Question[] = [];
  const lines = normalized.split('\n');
  let currentQuestion: Partial<Question> = {};
  let questionCount = 0;
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLanguage = '';
  let codeBlockTarget: 'question' | 'option1' | 'option2' | 'option3' | 'option4' | 'explanation' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();

    // Check for code block markers
    if (trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockContent = '';
        codeBlockLanguage = trimmedLine.substring(3).trim();
        continue;
      } else {
        inCodeBlock = false;
        const codeBlock = '```' + (codeBlockLanguage ? codeBlockLanguage + '\n' : '\n') + codeBlockContent + '\n```';
        if (codeBlockTarget) {
          if (codeBlockTarget === 'question') {
            currentQuestion.question = (currentQuestion.question || '') + '\n' + codeBlock;
          } else if (codeBlockTarget === 'option1') {
            currentQuestion.option1 = (currentQuestion.option1 || '') + '\n' + codeBlock;
          } else if (codeBlockTarget === 'option2') {
            currentQuestion.option2 = (currentQuestion.option2 || '') + '\n' + codeBlock;
          } else if (codeBlockTarget === 'option3') {
            currentQuestion.option3 = (currentQuestion.option3 || '') + '\n' + codeBlock;
          } else if (codeBlockTarget === 'option4') {
            currentQuestion.option4 = (currentQuestion.option4 || '') + '\n' + codeBlock;
          } else if (codeBlockTarget === 'explanation') {
            currentQuestion.explanation = (currentQuestion.explanation || '') + '\n' + codeBlock;
          }
        }
        codeBlockTarget = null;
        codeBlockLanguage = '';
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? '\n' : '') + line;
      continue;
    }

    // Remove markdown formatting for non-code content
    let cleanLine = trimmedLine.replace(/\*\*/g, '').replace(/\*/g, '');

    // Skip empty lines
    if (!cleanLine) continue;

    try {
      // Question detection (Q1:, Q2:, etc.)
      if (cleanLine.match(/^Q\d+:/i)) {
        // Save previous question if exists
        if (Object.keys(currentQuestion).length > 0 && currentQuestion.question) {
          questions.push({
            id: `q_${questionCount + 1}`,
            question: currentQuestion.question.trim() || '',
            option1: currentQuestion.option1?.trim() || '',
            option2: currentQuestion.option2?.trim() || '',
            option3: currentQuestion.option3?.trim() || '',
            option4: currentQuestion.option4?.trim() || '',
            answer: currentQuestion.answer || 'A',
            explanation: currentQuestion.explanation?.trim() || ''
          });
          questionCount++;
        }

        // Extract question text (everything after "Q#:")
        let questionText = cleanLine.split(':').slice(1).join(':').trim();
        currentQuestion = {
          question: questionText
        };
        codeBlockTarget = 'question';
      }
      // Options detection - must be at start of line
      else if (cleanLine.match(/^A\)\s*/i)) {
        const optionText = cleanLine.substring(cleanLine.indexOf(')') + 1).trim();
        currentQuestion.option1 = optionText;
        codeBlockTarget = 'option1';
      }
      else if (cleanLine.match(/^B\)\s*/i)) {
        const optionText = cleanLine.substring(cleanLine.indexOf(')') + 1).trim();
        currentQuestion.option2 = optionText;
        codeBlockTarget = 'option2';
      }
      else if (cleanLine.match(/^C\)\s*/i)) {
        const optionText = cleanLine.substring(cleanLine.indexOf(')') + 1).trim();
        currentQuestion.option3 = optionText;
        codeBlockTarget = 'option3';
      }
      else if (cleanLine.match(/^D\)\s*/i)) {
        const optionText = cleanLine.substring(cleanLine.indexOf(')') + 1).trim();
        currentQuestion.option4 = optionText;
        codeBlockTarget = 'option4';
      }
      // Correct Answer detection
      else if (cleanLine.toLowerCase().includes('correct answer:')) {
        let answerLetter = null;

        // Try multiple patterns to extract the answer letter
        let answerMatch = cleanLine.match(/correct\s+answer\s*:\s*([ABCD])/i);
        if (answerMatch) {
          answerLetter = answerMatch[1].toUpperCase();
        } else {
          answerMatch = cleanLine.match(/correct\s+answer\s*:\s*([ABCD])\s/i);
          if (answerMatch) {
            answerLetter = answerMatch[1].toUpperCase();
          } else {
            answerMatch = cleanLine.match(/:\s*([ABCD])\s*$/i);
            if (answerMatch) {
              answerLetter = answerMatch[1].toUpperCase();
            } else {
              // Try to extract answer as the first letter after the colon
              const colonIndex = cleanLine.toLowerCase().indexOf('correct answer:');
              if (colonIndex !== -1) {
                const afterColon = cleanLine.substring(colonIndex + 'correct answer:'.length).trim();
                if (afterColon.match(/^[ABCD]/i)) {
                  answerLetter = afterColon.charAt(0).toUpperCase();
                }
              }
            }
          }
        }

        if (answerLetter) {
          currentQuestion.answer = answerLetter;
        }

        // Try to extract explanation if it's on the same line
        const explanationMatch = cleanLine.match(/Explanation:\s*(.+)$/i);
        if (explanationMatch) {
          currentQuestion.explanation = explanationMatch[1].trim();
          codeBlockTarget = null;
        } else {
          codeBlockTarget = null;
        }
      }
      // Explanation detection
      else if (cleanLine.toLowerCase().startsWith('explanation:')) {
        const explanationText = cleanLine.split(':').slice(1).join(':').trim();
        if (explanationText) {
          currentQuestion.explanation = explanationText;
        }
        codeBlockTarget = 'explanation';
      }
      // Continue previous field if we have a target and it's not a new field marker
      else if (codeBlockTarget && cleanLine && !cleanLine.match(/^[ABCD]\)\s*/) && !cleanLine.match(/^Correct\s+Answer:/i) && !cleanLine.match(/^Explanation:/i)) {
        if (codeBlockTarget === 'question') {
          currentQuestion.question = (currentQuestion.question || '') + ' ' + cleanLine;
        } else if (codeBlockTarget === 'option1') {
          currentQuestion.option1 = (currentQuestion.option1 || '') + ' ' + cleanLine;
        } else if (codeBlockTarget === 'option2') {
          currentQuestion.option2 = (currentQuestion.option2 || '') + ' ' + cleanLine;
        } else if (codeBlockTarget === 'option3') {
          currentQuestion.option3 = (currentQuestion.option3 || '') + ' ' + cleanLine;
        } else if (codeBlockTarget === 'option4') {
          currentQuestion.option4 = (currentQuestion.option4 || '') + ' ' + cleanLine;
        } else if (codeBlockTarget === 'explanation') {
          currentQuestion.explanation = (currentQuestion.explanation || '') + ' ' + cleanLine;
        }
      }
    } catch (error) {
    }
  }

  // Add the last question
  if (Object.keys(currentQuestion).length > 0 && currentQuestion.question) {
    questions.push({
      id: `q_${questionCount + 1}`,
      question: currentQuestion.question.trim() || '',
      option1: currentQuestion.option1?.trim() || '',
      option2: currentQuestion.option2?.trim() || '',
      option3: currentQuestion.option3?.trim() || '',
      option4: currentQuestion.option4?.trim() || '',
      answer: currentQuestion.answer || 'A',
      explanation: currentQuestion.explanation?.trim() || ''
    });
  }

  // Filter out questions that are missing any option or explanation
  return questions.filter(
    q =>
      q.option1 &&
      q.option2 &&
      q.option3 &&
      q.option4 &&
      q.explanation &&
      q.answer
  );
};

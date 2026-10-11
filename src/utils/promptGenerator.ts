export const generatePrompt = (topic: string, questionCount: number): string => {
  // Enhanced KBC detection with multiple language support
  const isKBC = /\b(kbc|kaun\s*banega\s*crorepati|केबीसी|कौन\s*बनेगा\s*करोड़पति|करोड़पति|crorepati)\b/i.test(topic);

  // Enhanced Devanagari script detection (Hindi/Marathi/Sanskrit)
  const hindiMarathiPattern = /[\u0900-\u097F\u0980-\u09FF]/;
  const isIndicLanguage = hindiMarathiPattern.test(topic);

  // Enhanced language detection
  const languageMatch = topic.match(/\b(hindi|hinglish|marathi|english|मराठी|हिंदी|इंग्लिश)\b/i);
  const requestedLanguage = languageMatch ? languageMatch[0].toLowerCase() : null;

  // KBC Specific Keywords
  const kbcSpecificKeywords = [
    'kbc', 'केबीसी', 'केबिसी',
    'kaun banega crorepati', 'कौन बनेगा करोड़पति',
    'crorepati', 'करोड़पति', 'करोडपति'
  ];

  const containsKBCSpecific = kbcSpecificKeywords.some(keyword =>
    topic.toLowerCase().includes(keyword.toLowerCase())
  );

  const isKBCStyle = isKBC || containsKBCSpecific;

  // Detect User Preferences
  const hindiKeywords = ['हिंदी', 'हिन्दी', 'hindi', 'सवाल', 'प्रश्न'];
  const wantsHindi = hindiKeywords.some(keyword => topic.toLowerCase().includes(keyword.toLowerCase()));

  const marathiKeywords = ['मराठी', 'marathi', 'मराठी मध्ये'];
  const wantsMarathi = marathiKeywords.some(keyword => topic.toLowerCase().includes(keyword.toLowerCase()));

  const hinglishKeywords = ['hinglish', 'roman', 'romanized'];
  const wantsHinglish = hinglishKeywords.some(keyword => topic.toLowerCase().includes(keyword.toLowerCase()));

  // Determine Final Language
  let finalLanguage = requestedLanguage;
  if (!finalLanguage) {
    if (wantsHindi || (isIndicLanguage && !wantsMarathi)) {
      finalLanguage = 'hindi';
    } else if (wantsMarathi) {
      finalLanguage = 'marathi';
    } else if (wantsHinglish) {
      finalLanguage = 'hinglish';
    }
  }

  let prompt = '';

  if (isKBCStyle) {
    const languageInstruction = finalLanguage === 'hindi' || finalLanguage === 'हिंदी'
      ? '\n- Generate ALL questions in Hindi (Devanagari script)'
      : finalLanguage === 'marathi' || finalLanguage === 'मराठी'
      ? '\n- Generate ALL questions in Marathi (Devanagari script)'
      : finalLanguage === 'hinglish'
      ? '\n- Generate ALL questions in Hinglish (Hindi words in Roman/English script)'
      : wantsHindi
      ? '\n- Generate ALL questions in Hindi (Devanagari script)'
      : wantsMarathi
      ? '\n- Generate ALL questions in Marathi (Devanagari script)'
      : isIndicLanguage
      ? '\n- Generate ALL questions in Hindi (Devanagari script)'
      : '';

    prompt = `Generate ${questionCount} KBC-style (Kaun Banega Crorepati) multiple choice questions about: "${topic}" ${languageInstruction}

        REQUIREMENTS:
        - Exactly ${questionCount} questions
        - General knowledge and trivia format
        - Questions should be factual and verifiable
        - Difficulty progression: easier → harder
        - One clearly correct answer per question
        - Mix of history, geography, science, culture, current affairs, sports

    CRITICAL FORMATTING RULES:
    1. Question line starts with "Q[number]:" followed by the question text ONLY
    2. After question, press ENTER to start new line
    3. Each option (A, B, C, D) MUST be on its OWN separate line
    4. Format: "A) option text" then ENTER
    5. Format: "B) option text" then ENTER
    6. Format: "C) option text" then ENTER
    7. Format: "D) option text" then ENTER
    8. Then "Correct Answer: [Letter]" on new line
    9. Then "Explanation: [text]" on new line
    10. One blank line between questions

    EXACT FORMAT TO FOLLOW:
    Q[#]: [Question text only - no options here]
    A) [First option]
    B) [Second option]
    C) [Third option]
    D) [Fourth option]
    Correct Answer: [Letter]
    Explanation: [Brief fact-based reasoning with optional source]

    [Blank line before next question]

    DO NOT PUT OPTIONS ON SAME LINE AS QUESTION!`;

  } else {
    // Competitive Exams
    const examPattern = /\b(jee|neet|upsc|ias|ips|ifs|ssc|gate|cat|bank\s*po|railway|competitive|entrance|iit|aiims|civil\s*services?)\b/i;
    const isCompetitiveExam = examPattern.test(topic);

    if (isCompetitiveExam) {
      // Software Industry
      const softwarePattern = /\b(javascript|typescript|react|angular|vue|node|express|python|java|c#|csharp|golang|rust|php|ruby|swift|kotlin|sql|database|mongodb|postgresql|docker|kubernetes|aws|azure|gcp|devops|ci\/cd|rest\s*api|graphql|microservices|system\s*design|dsa|data\s*structures|algorithms|frontend|backend|fullstack|web\s*development|mobile\s*app|software\s*engineer|developer|coding|leetcode|hackerrank|interview)\b/i;
      const isSoftwareIndustry = softwarePattern.test(topic);

      if (isSoftwareIndustry) {
        prompt = `Generate ${questionCount} software engineer/developer interview questions about: "${topic}"

        REQUIREMENTS:
        - Exactly ${questionCount} questions
        - Real-world coding scenarios and technical challenges
        - Include code snippets, system design concepts
        - Difficulty progression: Junior → Senior level

    CRITICAL FORMATTING RULES:
    1. Question line starts with "Q[number]:" followed by question text ONLY
    2. Each option (A, B, C, D) MUST be on its OWN separate line
    3. Use code blocks (\`\`\`language\ncode\`\`\`) for code examples

    EXACT FORMAT:
    Q[#]: [Question text]
    A) [First option]
    B) [Second option]
    C) [Third option]
    D) [Fourth option]
    Correct Answer: [Letter]
    Explanation: [Brief technical reasoning]`;

      } else {
        // General Competitive
        prompt = `Generate ${questionCount} competitive exam-style multiple choice questions about: "${topic}"

        REQUIREMENTS:
        - Exactly ${questionCount} questions
        - Exam-level difficulty and complexity

    FORMAT:
    Q[#]: [Question text]
    A) [Option]
    B) [Option]
    C) [Option]
    D) [Option]
    Correct Answer: [Letter]
    Explanation: [Step-by-step solution]`;
      }
    } else {
      // Default Technical/Educational
      prompt = `Generate ${questionCount} multiple choice questions about: "${topic}"

        REQUIREMENTS:
        - Exactly ${questionCount} questions
        - Test understanding, not memorization

    FORMAT:
    Q[#]: [Question text]
    A) [Option]
    B) [Option]
    C) [Option]
    D) [Option]
    Correct Answer: [Letter]
    Explanation: [Brief reasoning]`;
    }
  }

  return prompt;
};

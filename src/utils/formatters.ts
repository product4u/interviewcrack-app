export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatExplanationWithLinks = (text: string) => {
  // Handle markdown links [text](url) and plain URLs
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(markdownLinkRegex, '$2');
};

/**
 * Enhanced formatter for explanations with proper text structure
 * Handles code blocks, paragraphs, lists, and formatting
 * Returns HTML string ready for dangerouslySetInnerHTML
 */
export const formatExplanationText = (text: string): string => {
  if (!text) return '';

  let result = text;

  // Handle code blocks first - show ALL lines with proper styling
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)\n?```/g;
  result = result.replace(codeBlockRegex, (match, language, code) => {
    let cleanedCode = code.trim();
    const escapedCode = cleanedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono border border-gray-700 break-words"><code>${escapedCode}</code></pre>`;
  });

  // Handle bold **text**
  result = result.replace(/\*\*([^\*]+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');

  // Handle italic *text* (but not **)
  result = result.replace(/(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Handle inline code `text`
  result = result.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono text-sm text-red-600">$1</code>');

  // Handle numbered lists - one per line
  result = result.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-6 mb-3 list-decimal text-gray-800 dark:text-gray-200">$1</li>');

  // Handle bullet points - one per line
  result = result.replace(/^\s*[-•*]\s+(.+)$/gm, '<li class="ml-6 mb-3 list-disc text-gray-800 dark:text-gray-200">$1</li>');

  // Wrap consecutive lists in ul - match groups of consecutive <li> elements
  result = result.replace(/(<li[^>]*>[\s\S]*?<\/li>(?:\s*<li[^>]*>[\s\S]*?<\/li>)*)/g, '<ul class="space-y-2 my-3">$1</ul>');

  // Handle line breaks and paragraphs
  // Split by double newlines for paragraphs
  const paragraphs = result.split(/\n\n+/);
  result = paragraphs
    .map((para) => {
      // Skip if it's already a list
      if (para.includes('<li')) return para;
      // Skip if it's a code block
      if (para.includes('<pre')) return para;

      // Add line breaks after sentence-ending punctuation with capital letter following
      // Pattern: punctuation + spaces + capital letter/digit
      // This will break after periods, question marks, and exclamation marks
      para = para.replace(/([.!?])\s+([A-Z0-9])/g, '$1<br />\n$2');

      // Also handle numbered list items like "1. " by adding break before them
      para = para.replace(/(\s)(\d+\.\s+)/g, '$1<br />\n$2');

      // Convert remaining single line breaks to <br />
      para = para.replace(/\n/g, '<br />');

      // Wrap in paragraph with proper styling
      return `<p class="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-normal">${para}</p>`;
    })
    .join('');

  return result;
};

/**
 * Formats markdown text with code blocks
 * Returns HTML string ready for dangerouslySetInnerHTML
 * Shows FULL answer with all code blocks - no truncation
 */
export const formatCodeBlockToHtml = (text: string): string => {
  if (!text) return '';

  let result = text;

  // Handle code blocks - show ALL lines, no truncation
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)\n?```/g;
  result = result.replace(codeBlockRegex, (match, language, code) => {
    // Clean the code and preserve all lines
    let cleanedCode = code.trim();
    const cleanCode2 = cleanedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono border border-gray-700"><code>${cleanCode2}</code></pre>`;
  });

  // Handle bold **text**
  result = result.replace(/\*\*([^\*\*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__([^__]+)__/g, '<strong>$1</strong>');

  // Handle italic *text* (but not **)
  result = result.replace(/(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Handle inline code `text`
  result = result.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono text-sm">$1</code>');

  // Handle bullet points * or -
  result = result.replace(/^\s*[\*\-]\s+(.+)$/gm, '<li class="ml-6 mb-2 list-disc">$1</li>');

  // Handle numbered lists
  result = result.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-6 mb-2 list-decimal">$1</li>');

  // Handle line breaks - preserve multiple line breaks
  result = result.replace(/\n\n+/g, '</p><p class="mb-3">');
  result = result.replace(/\n/g, '<br />');

  // Wrap in paragraph tags if not already wrapped
  if (!result.includes('<p')) {
    result = `<p class="mb-3">${result}</p>`;
  }

  return result;
};

/**
 * Extracts key points from answer text
 * Returns array of short, important statements
 */
export const extractKeyPoints = (text: string): string[] => {
  if (!text) return [];

  const keyPoints: string[] = [];

  // Extract sentences that start with specific keywords indicating importance
  const importantPatterns = [
    /^[•\*\-]\s+(.+?)(?=\n|$)/gm, // Bullet points
    /^\d+\.\s+(.+?)(?=\n|$)/gm, // Numbered lists
    /\*\*(.+?)\*\*[:\s](.+?)(?=\n|$)/gm, // Bold text followed by explanation
  ];

  for (const pattern of importantPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const point = match[1] || match[2] || match[0];
      if (point && point.length > 0 && point.length < 200) {
        // Clean up the point
        const cleaned = point
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .trim();

        if (cleaned.length > 10 && !keyPoints.includes(cleaned)) {
          keyPoints.push(cleaned);
        }
      }
    }
  }

  // If we found key points, return them
  if (keyPoints.length > 0) {
    return keyPoints.slice(0, 5); // Return max 5 key points
  }

  // Fallback: extract first few sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 150)
    .slice(0, 3);

  return sentences;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Checks if text contains code blocks
 */
export const hasCodeBlocks = (text: string): boolean => {
  if (!text) return false;
  return /```[\s\S]*?```/.test(text);
};

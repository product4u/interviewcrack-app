import { QuestionScore } from '../types';
const normalize = (text = '') => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (text = '') => Array.from(new Set(normalize(text).split(/\s+/).filter(Boolean)));
const overlap = (answer: string, reference: string) => {
  const expected = words(reference); const actual = new Set(words(answer));
  return expected.length ? expected.filter(word => actual.has(word)).length / expected.length * 100 : 0;
};
/** Lexical practice aid, not a measure of meaning, correctness, or delivery. */
export function scoreAnswer(userTranscript = '', expectedAnswer = '', keyWords: string[] = []): QuestionScore {
  const transcript = normalize(userTranscript);
  const keywords = Array.from(new Set(keyWords.map(normalize).filter(Boolean)));
  const unavailable = !transcript ? 'transcript-unavailable' : !normalize(expectedAnswer) && !keywords.length ? 'reference-unavailable' : undefined;
  const matchedKeyWords = keywords.filter(key => (` ${transcript} `).includes(` ${key} `));
  const wordMatchPercentage = overlap(transcript, expectedAnswer);
  const keywordScore = keywords.length ? matchedKeyWords.length / keywords.length * 100 : 0;
  const score = unavailable ? 0 : Math.round(keywords.length && normalize(expectedAnswer) ? wordMatchPercentage * .6 + keywordScore * .4 : keywords.length ? keywordScore : wordMatchPercentage);
  const missing = keywords.filter(key => !matchedKeyWords.includes(key));
  const feedback = unavailable === 'transcript-unavailable' ? 'Not scored: no transcript is available. Correct or enter the transcript before scoring; this does not indicate a weak answer.'
    : unavailable ? 'Not scored: no reference answer or keywords are available.'
    : `${score >= 70 ? 'Many reference terms matched.' : 'Some reference terms are missing; a valid paraphrase may also score lower.'} ${missing.length ? 'Review these reference terms: ' + missing.slice(0, 4).join(', ') + '. ' : ''}Explain your reasoning, add one concrete example, and check the reference for accuracy. Listen back to review clarity and pacing; this estimate does not assess meaning or delivery.`;
  return { questionId: '', matchedKeyWords, score, maxScore: 100, wordMatchPercentage, feedback, status: unavailable || 'scored' };
}
export const compareAnswers = (answer: string, expected: string) => Math.round(overlap(answer, expected));
export const extractConcepts = (text: string) => words(text).filter(word => word.length > 3);
export const generateAnswerSummary = (score: number, matched: number, total: number, transcript: string) => !normalize(transcript)
  ? 'No transcript available; answer not scored.'
  : `Reference match estimate: ${score}%. ${total ? `Keywords: ${matched}/${total}.` : 'No keywords supplied.'} Review reasoning, a concrete example, and clarity yourself.`;
export const batchScoreAnswers = (transcripts: string[], expected: string[], keywords: string[][]) => transcripts.map((text, i) => ({ ...scoreAnswer(text, expected[i], keywords[i]), questionId: `q-${i}` }));

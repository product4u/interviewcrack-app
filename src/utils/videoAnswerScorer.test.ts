import { scoreAnswer, generateAnswerSummary, batchScoreAnswers } from './videoAnswerScorer';
test('empty and duplicate keywords never produce NaN or inflate the score', () => {
  expect(scoreAnswer('indexed access', 'indexed access', []).score).toBe(100);
  expect(scoreAnswer('indexed access', 'indexed access', ['', 'access', 'ACCESS']).matchedKeyWords).toEqual(['access']);
  expect(Number.isFinite(scoreAnswer('answer', '', []).score)).toBe(true);
  expect(generateAnswerSummary(0, 0, 0, 'answer')).not.toMatch(/NaN|Infinity/);
});
test('missing transcripts and references are explicitly unscored', () => {
  expect(scoreAnswer('  ', 'answer', ['answer']).status).toBe('transcript-unavailable');
  expect(scoreAnswer('answer', '', []).status).toBe('reference-unavailable');
  expect(scoreAnswer('unrelated', 'answer', ['answer']).status).toBe('scored');
  expect(batchScoreAnswers(['answer'], [], [])[0].status).toBe('reference-unavailable');
});
test('keyword matching respects word boundaries and explains limitations', () => {
  const result = scoreAnswer('cart partial', 'art', ['art']);
  expect(result.matchedKeyWords).toEqual([]);
  expect(result.feedback).toContain('does not assess meaning or delivery');
});

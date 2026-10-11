import { parseVideoInterviewResponse } from './videoInterviewGenerator';

test('parses buddy guidance without mixing it into the expected answer', () => {
  const [question] = parseVideoInterviewResponse('Q: Explain arrays\nSHORT: Indexed storage\nFULL: Detailed answer\nHINT: Think about memory\nBUDDY: Like numbered seats');
  expect(question.expectedAnswer).toBe('Detailed answer');
  expect(question.buddyHint).toBe('Think about memory');
  expect(question.buddyExplanation).toBe('Like numbered seats');
});

test('accepts existing questions without buddy fields', () => {
  const [question] = parseVideoInterviewResponse('Q: Explain arrays\nSHORT: Indexed storage\nFULL: Detailed answer');
  expect(question.shortAnswer).toBe('Indexed storage');
  expect(question.buddyHint).toBeUndefined();
});

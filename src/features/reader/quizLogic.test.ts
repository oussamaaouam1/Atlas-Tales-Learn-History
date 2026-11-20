import { quizMessageKey } from './quizLogic';

test('a perfect score gets the special message; every other score is still encouraged', () => {
  expect(quizMessageKey(3, 3)).toBe('end.scoreGreat');
  expect(quizMessageKey(2, 3)).toBe('end.scoreGood');
  expect(quizMessageKey(0, 3)).toBe('end.scoreGood');
  expect(quizMessageKey(0, 0)).toBe('end.scoreGood');
});

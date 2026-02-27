import { test, expect } from '@playwright/test';
import { calculateExpectedScore, calculateNewElos } from '../lib/adaptive/elo-engine';

test.describe('Adaptive Logic - Elo Engine', () => {
  test('calculateExpectedScore returns correct probabilities', () => {
    // Equal elo -> 50% probability
    const probEqual = calculateExpectedScore(1200, 1200);
    expect(probEqual).toBeCloseTo(0.5);

    // Stronger student -> higher probability
    const probStrongStudent = calculateExpectedScore(1600, 1200);
    expect(probStrongStudent).toBeGreaterThan(0.9);

    // Weaker student -> lower probability
    const probWeakStudent = calculateExpectedScore(1200, 1600);
    expect(probWeakStudent).toBeLessThan(0.1);
  });

  test('calculateNewElos correctly updates ratings for correct answer', () => {
    const studentElo = 1200;
    const questionElo = 1200;
    
    // Student answers correctly
    const { newStudentElo, newQuestionElo } = calculateNewElos(studentElo, questionElo, true);
    
    // Student rating should increase, question rating should decrease
    expect(newStudentElo).toBeGreaterThan(studentElo);
    expect(newQuestionElo).toBeLessThan(questionElo);
    
    // K-factor is 32, for equal ratings probability is 0.5
    // Student change: 32 * (1 - 0.5) = +16
    // Question change: 32 * (0 - 0.5) = -16
    expect(newStudentElo).toBe(1216);
    expect(newQuestionElo).toBe(1184);
  });

  test('calculateNewElos correctly updates ratings for incorrect answer', () => {
    const studentElo = 1200;
    const questionElo = 1200;
    
    // Student answers incorrectly
    const { newStudentElo, newQuestionElo } = calculateNewElos(studentElo, questionElo, false);
    
    // Student rating should decrease, question rating should increase
    expect(newStudentElo).toBeLessThan(studentElo);
    expect(newQuestionElo).toBeGreaterThan(questionElo);
    
    // Expected change is reversed
    expect(newStudentElo).toBe(1184);
    expect(newQuestionElo).toBe(1216);
  });

  test('ratings floor at 100', () => {
    const { newStudentElo } = calculateNewElos(100, 2000, false);
    expect(newStudentElo).toBe(100);
  });
});

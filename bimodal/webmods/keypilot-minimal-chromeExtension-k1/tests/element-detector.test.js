/**
 * Tests for ElementDetector
 */
import { ElementDetector } from '../src/modules/element-detector.js';

describe('ElementDetector', () => {
  let detector;
  
  beforeEach(() => {
    detector = new ElementDetector();
  });

  describe('isLikelyInteractive', () => {
    test('should identify links as interactive', () => {
      const link = document.createElement('a');
      link.href = 'https://example.com';
      expect(detector.isLikelyInteractive(link)).toBe(true);
    });

    test('should identify buttons as interactive', () => {
      const button = document.createElement('button');
      expect(detector.isLikelyInteractive(button)).toBe(true);
    });

    test('should identify ARIA buttons as interactive', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      expect(detector.isLikelyInteractive(div)).toBe(true);
    });

    test('should not identify regular divs as interactive', () => {
      const div = document.createElement('div');
      expect(detector.isLikelyInteractive(div)).toBe(false);
    });
  });

  describe('isTextLike', () => {
    test('should identify text inputs', () => {
      const input = document.createElement('input');
      input.type = 'text';
      expect(detector.isTextLike(input)).toBe(true);
    });

    test('should identify textareas', () => {
      const textarea = document.createElement('textarea');
      expect(detector.isTextLike(textarea)).toBe(true);
    });

    test('should not identify buttons as text-like', () => {
      const button = document.createElement('button');
      expect(detector.isTextLike(button)).toBe(false);
    });
  });
});
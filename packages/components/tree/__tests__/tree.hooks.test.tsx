// @ts-nocheck
import { expect, describe, it } from 'vitest';
import { formatCSSUnit } from '../hooks/useTreeStyles';

describe('Tree Hooks', () => {
  describe('useTreeStyles', () => {
    it('formatCSSUnit should format number to px string', () => {
      expect(formatCSSUnit(100)).toBe('100px');
    });
    it('formatCSSUnit should keep string as is', () => {
      expect(formatCSSUnit('50%')).toBe('50%');
      expect(formatCSSUnit('10rem')).toBe('10rem');
    });
    it('formatCSSUnit should return undefined or null as is', () => {
      expect(formatCSSUnit(undefined)).toBe(undefined);
      expect(formatCSSUnit(null)).toBe(null);
    });
  });
});

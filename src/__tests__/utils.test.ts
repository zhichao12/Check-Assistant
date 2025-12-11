import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatRelativeTime,
  wasVisitedToday,
  getHostname,
  getFaviconUrl,
} from '@/shared/utils';

describe('utils', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with timestamp prefix', () => {
      const id = generateId();
      const parts = id.split('-');

      expect(parts.length).toBe(2);
      expect(Number(parts[0])).toBeGreaterThan(0);
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent timestamps', () => {
      const result = formatRelativeTime(Date.now() - 10000);
      expect(result).toBe('just now');
    });

    it('should return minutes for timestamps within an hour', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5 minutes ago');
    });

    it('should return hours for timestamps within a day', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toBe('2 hours ago');
    });

    it('should return days for older timestamps', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toBe('3 days ago');
    });
  });

  describe('wasVisitedToday', () => {
    it('should return false for undefined timestamp', () => {
      expect(wasVisitedToday(undefined)).toBe(false);
    });

    it('should return true for timestamp from today', () => {
      const now = Date.now();
      expect(wasVisitedToday(now)).toBe(true);
    });

    it('should return false for timestamp from days ago', () => {
      // Use 2 days ago to avoid edge cases around midnight
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      expect(wasVisitedToday(twoDaysAgo)).toBe(false);
    });
  });

  describe('getHostname', () => {
    it('should extract hostname from valid URL', () => {
      expect(getHostname('https://example.com/path')).toBe('example.com');
      expect(getHostname('https://sub.example.com')).toBe('sub.example.com');
    });

    it('should return original string for invalid URL', () => {
      expect(getHostname('not-a-url')).toBe('not-a-url');
    });
  });

  describe('getFaviconUrl', () => {
    it('should return Google favicon service URL', () => {
      const result = getFaviconUrl('https://example.com/page');
      expect(result).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
    });

    it('should return empty string for invalid URL', () => {
      expect(getFaviconUrl('not-a-url')).toBe('');
    });
  });
});

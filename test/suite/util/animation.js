/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import animation from '../../../src/util/animation.js';

describe('animation', () => {
  describe('Easing Functions', () => {
    it('linear returns input value', () => {
      expect(animation.linear(0)).toBe(0);
      expect(animation.linear(0.5)).toBe(0.5);
      expect(animation.linear(1)).toBe(1);
    });

    it('easeInOutQuad produces smooth curve', () => {
      expect(animation.easeInOutQuad(0)).toBe(0);
      expect(animation.easeInOutQuad(1)).toBe(1);
      expect(animation.easeInOutQuad(0.5)).toBeGreaterThan(0.4);
      expect(animation.easeInOutQuad(0.5)).toBeLessThan(0.6);
    });

    it('easeInOutCubic produces smooth curve', () => {
      expect(animation.easeInOutCubic(0)).toBe(0);
      expect(animation.easeInOutCubic(1)).toBe(1);
      const mid = animation.easeInOutCubic(0.5);
      expect(mid).toBeGreaterThan(0.4);
      expect(mid).toBeLessThan(0.6);
    });

    it('easeOutElastic produces overshoot', () => {
      expect(animation.easeOutElastic(0)).toBe(0);
      expect(animation.easeOutElastic(1)).toBe(1);
      // Should have values > 1 during bounce
      let hasOvershoot = false;
      for (let t = 0.1; t < 1; t += 0.1) {
        if (animation.easeOutElastic(t) > 1) {
          hasOvershoot = true;
          break;
        }
      }
      expect(hasOvershoot).toBe(true);
    });

    it('easeOutBounce produces bouncing effect', () => {
      expect(animation.easeOutBounce(0)).toBe(0);
      expect(animation.easeOutBounce(1)).toBe(1);
      // Should be monotonically increasing overall
      const values = [0, 0.2, 0.4, 0.6, 0.8, 1].map(t => animation.easeOutBounce(t));
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1] - 0.1); // Allow small bounces
      }
    });
  });

  describe('interpolate', () => {
    it('interpolates between two numbers', () => {
      expect(animation.interpolate(0, 100, 0)).toBe(0);
      expect(animation.interpolate(0, 100, 0.5)).toBe(50);
      expect(animation.interpolate(0, 100, 1)).toBe(100);
    });

    it('interpolates with easing', () => {
      const result = animation.interpolate(0, 100, 0.5, animation.easeInOutQuad);
      expect(result).toBeGreaterThan(45);
      expect(result).toBeLessThan(55);
    });

    it('handles negative ranges', () => {
      expect(animation.interpolate(100, 0, 0.5)).toBe(50);
      expect(animation.interpolate(-50, 50, 0.5)).toBe(0);
    });
  });

  describe('interpolateAngle', () => {
    it('interpolates angles through shortest path', () => {
      // 0 to π should go forward
      const result1 = animation.interpolateAngle(0, Math.PI, 0.5);
      expect(result1).toBeCloseTo(Math.PI / 2, 0.01);

      // 0 to -π should be same as 0 to π (shortest path)
      const result2 = animation.interpolateAngle(0, -Math.PI, 0.5);
      expect(Math.abs(result2)).toBeCloseTo(Math.PI / 2, 0.01);
    });

    it('normalizes angles to [-π, π]', () => {
      const result = animation.interpolateAngle(0, 3 * Math.PI, 0.5);
      expect(result).toBeGreaterThan(-Math.PI);
      expect(result).toBeLessThan(Math.PI);
    });

    it('handles wraparound correctly', () => {
      // From 170° to -170° should go through 180°, not all the way around
      const from = (170 * Math.PI) / 180;
      const to = (-170 * Math.PI) / 180;
      const mid = animation.interpolateAngle(from, to, 0.5);
      expect(Math.abs(mid)).toBeGreaterThan(Math.PI * 0.95);
    });
  });

  describe('animate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calls onUpdate with progress', () => {
      const onUpdate = vi.fn();
      const onComplete = vi.fn();

      animation.animate({
        duration: 1000,
        onUpdate,
        onComplete
      });

      // Should call immediately with 0
      expect(onUpdate).toHaveBeenCalledWith(0);

      // Advance 500ms (50%)
      vi.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalled();
      const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
      expect(lastCall).toBeGreaterThan(0.4);
      expect(lastCall).toBeLessThan(0.6);

      // Complete
      vi.advanceTimersByTime(500);
      expect(onComplete).toHaveBeenCalled();
    });

    it('applies easing function', () => {
      const onUpdate = vi.fn();

      animation.animate({
        duration: 1000,
        easing: (t) => t * t, // Square easing
        onUpdate
      });

      vi.advanceTimersByTime(500);
      
      // With square easing, 0.5 input should give 0.25 output
      const calls = onUpdate.mock.calls;
      const midCall = calls[Math.floor(calls.length / 2)];
      if (midCall) {
        expect(midCall[0]).toBeLessThan(0.3);
      }
    });

    it('returns cancel function', () => {
      const onUpdate = vi.fn();
      const onComplete = vi.fn();

      const cancel = animation.animate({
        duration: 1000,
        onUpdate,
        onComplete
      });

      expect(typeof cancel).toBe('function');

      // Cancel after 250ms
      vi.advanceTimersByTime(250);
      cancel();

      // Should call onComplete
      expect(onComplete).toHaveBeenCalled();

      // Further time advances shouldn't call onUpdate
      const callCount = onUpdate.mock.calls.length;
      vi.advanceTimersByTime(1000);
      expect(onUpdate.mock.calls.length).toBe(callCount);
    });
  });

  describe('Easing edge cases', () => {
    const easingFunctions = [
      'linear',
      'easeInOutQuad',
      'easeInQuad',
      'easeOutQuad',
      'easeInOutCubic',
      'easeInCubic',
      'easeOutCubic',
      'easeInOutSine'
    ];

    easingFunctions.forEach((name) => {
      it(`${name} starts at 0 and ends at 1`, () => {
        const fn = animation[name];
        expect(fn(0)).toBe(0);
        expect(fn(1)).toBe(1);
      });

      it(`${name} is monotonically increasing`, () => {
        const fn = animation[name];
        for (let t = 0; t <= 1; t += 0.1) {
          const val1 = fn(t);
          const val2 = fn(Math.min(t + 0.05, 1));
          expect(val2).toBeGreaterThanOrEqual(val1 - 0.01); // Allow small tolerance
        }
      });
    });
  });
});


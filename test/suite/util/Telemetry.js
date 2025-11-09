/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import Telemetry from '../../../src/util/Telemetry.js';

describe('Telemetry', () => {
  let telemetry;

  beforeEach(() => {
    telemetry = new Telemetry();
  });

  describe('FPS tracking', () => {
    it('initializes with 0 FPS', () => {
      expect(telemetry.getFPS()).toBe(0);
    });

    it('calculates FPS from frame times', () => {
      // Simulate 60fps (16.67ms per frame)
      telemetry.recordFrame(0);
      telemetry.recordFrame(16.67);
      telemetry.recordFrame(33.33);
      
      // Wait for FPS update interval (500ms)
      for (let i = 0; i < 30; i++) {
        telemetry.recordFrame(i * 16.67);
      }
      
      const fps = telemetry.getFPS();
      expect(fps).toBeGreaterThan(50);
      expect(fps).toBeLessThan(70);
    });
  });

  describe('Dropped frame detection', () => {
    it('initializes with 0 dropped frames', () => {
      expect(telemetry.getDroppedFrames()).toBe(0);
    });

    it('detects dropped frames', () => {
      telemetry.recordFrame(0);
      telemetry.recordFrame(16);   // Normal frame
      telemetry.recordFrame(50);   // Dropped frame (34ms)
      telemetry.recordFrame(66);   // Normal frame
      telemetry.recordFrame(120);  // Dropped frame (54ms)
      
      expect(telemetry.getDroppedFrames()).toBe(2);
    });

    it('resets dropped frame counter', () => {
      telemetry.recordFrame(0);
      telemetry.recordFrame(50); // Dropped
      expect(telemetry.getDroppedFrames()).toBe(1);
      
      telemetry.resetDroppedFrames();
      expect(telemetry.getDroppedFrames()).toBe(0);
    });
  });

  describe('Average frame time', () => {
    it('calculates average frame time', () => {
      telemetry.recordFrame(0);
      telemetry.recordFrame(16);
      telemetry.recordFrame(32);
      telemetry.recordFrame(48);
      
      const avg = telemetry.getAverageFrameTime();
      expect(avg).toBeCloseTo(16, 0.5);
    });

    it('returns 0 when no frames recorded', () => {
      expect(telemetry.getAverageFrameTime()).toBe(0);
    });
  });

  describe('getSample', () => {
    it('returns performance sample', () => {
      telemetry.recordFrame(0);
      telemetry.recordFrame(16);
      
      const sample = telemetry.getSample();
      
      expect(sample).toHaveProperty('fps');
      expect(sample).toHaveProperty('droppedFrames');
      expect(sample).toHaveProperty('avgFrameTime');
      expect(sample).toHaveProperty('timestamp');
    });

    it('includes additional data', () => {
      const sample = telemetry.getSample({ 
        gpuMB: 128, 
        tilesResident: 42 
      });
      
      expect(sample.gpuMB).toBe(128);
      expect(sample.tilesResident).toBe(42);
    });

    it('stores last sample', () => {
      const sample1 = telemetry.getSample({ test: 'value' });
      const sample2 = telemetry.getLastSample();
      
      expect(sample2).toEqual(sample1);
      expect(sample2.test).toBe('value');
    });
  });

  describe('reset', () => {
    it('clears all telemetry data', () => {
      telemetry.recordFrame(0);
      telemetry.recordFrame(16);
      telemetry.recordFrame(50); // Dropped
      
      expect(telemetry.getFPS()).toBeGreaterThanOrEqual(0);
      expect(telemetry.getDroppedFrames()).toBeGreaterThan(0);
      
      telemetry.reset();
      
      expect(telemetry.getFPS()).toBe(0);
      expect(telemetry.getDroppedFrames()).toBe(0);
      expect(telemetry.getAverageFrameTime()).toBe(0);
      expect(telemetry.getLastSample()).toBe(null);
    });
  });
});


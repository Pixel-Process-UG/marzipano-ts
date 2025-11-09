/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

document.addEventListener('DOMContentLoaded', init);

let viewer;
let scene;
let fpsHistory = [];
const maxHistory = 50;
let stressTestInterval = null;

function init() {
  // Create viewer
  viewer = new Marzipano.Viewer(document.getElementById('pano'));

  // Set initial LOD policy
  viewer.setLODPolicy({
    maxGpuMB: 256,
    prefetchAhead: 2,
    evictionStrategy: 'hybrid'
  });

  // Create scene
  const source = Marzipano.ImageUrlSource.fromString(
    'https://www.marzipano.net/media/equirect/{z}.jpg'
  );
  const geometry = new Marzipano.EquirectGeometry([
    { width: 4096 },
    { width: 2048 },
    { width: 1024 }
  ]);
  const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);
  const view = new Marzipano.RectilinearView({ yaw: 0 }, limiter);

  scene = viewer.createScene({
    source: source,
    geometry: geometry,
    view: view
  });

  scene.switchTo();

  // Display backend info
  document.getElementById('backend-value').textContent = viewer.getBackend().toUpperCase();

  // Listen for performance events
  viewer.on('perf', (sample) => {
    updateTelemetry(sample);
  });

  // Set up controls
  setupControls();

  console.log('Performance telemetry demo initialized');
  console.log('Backend:', viewer.getBackend());
}

function setupControls() {
  // Budget slider
  const budgetSlider = document.getElementById('budget-slider');
  budgetSlider.addEventListener('input', (e) => {
    document.getElementById('budget-value').textContent = e.target.value;
  });

  // Prefetch slider
  const prefetchSlider = document.getElementById('prefetch-slider');
  prefetchSlider.addEventListener('input', (e) => {
    document.getElementById('prefetch-value').textContent = e.target.value;
  });

  // Apply LOD policy
  document.getElementById('apply-lod-btn').addEventListener('click', () => {
    const maxGpuMB = parseInt(budgetSlider.value);
    const prefetchAhead = parseInt(prefetchSlider.value);
    const evictionStrategy = document.getElementById('strategy-select').value;

    viewer.setLODPolicy({
      maxGpuMB,
      prefetchAhead,
      evictionStrategy
    });

    console.log('Applied LOD policy:', { maxGpuMB, prefetchAhead, evictionStrategy });
  });

  // Stress test
  document.getElementById('stress-test-btn').addEventListener('click', () => {
    if (stressTestInterval) {
      stopStressTest();
    } else {
      startStressTest();
    }
  });

  // Reset telemetry
  document.getElementById('reset-telemetry-btn').addEventListener('click', () => {
    fpsHistory = [];
    const renderLoop = viewer.renderLoop();
    if (renderLoop.telemetry) {
      renderLoop.telemetry().reset();
    }
    console.log('Telemetry reset');
  });
}

function updateTelemetry(sample) {
  // Update FPS
  document.getElementById('fps-value').textContent = sample.fps || '--';

  // Update GPU memory
  const gpuMB = sample.gpuMB !== undefined ? sample.gpuMB.toFixed(2) : '--';
  document.getElementById('gpu-value').textContent = `${gpuMB} MB`;

  // Update dropped frames
  document.getElementById('dropped-value').textContent = sample.droppedFrames || 0;

  // Update tiles resident
  document.getElementById('tiles-value').textContent = sample.tilesResident || '--';

  // Calculate cache hit rate
  if (sample.tilesHit !== undefined && sample.tilesMiss !== undefined) {
    const total = sample.tilesHit + sample.tilesMiss;
    const hitRate = total > 0 ? ((sample.tilesHit / total) * 100).toFixed(1) : '--';
    document.getElementById('hitrate-value').textContent = `${hitRate} %`;
  }

  // Update FPS history
  if (sample.fps) {
    fpsHistory.push(sample.fps);
    if (fpsHistory.length > maxHistory) {
      fpsHistory.shift();
    }
    drawFPSChart();
  }
}

function drawFPSChart() {
  const canvas = document.getElementById('fps-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, width, height);

  if (fpsHistory.length < 2) return;

  // Draw grid lines
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 60; i += 15) {
    const y = height - (i / 60) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw FPS line
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const stepX = width / (maxHistory - 1);
  
  fpsHistory.forEach((fps, index) => {
    const x = index * stepX;
    const y = height - (fps / 60) * height;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw 60 FPS reference line
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw labels
  ctx.fillStyle = '#0f0';
  ctx.font = '10px SF Mono, monospace';
  ctx.fillText('60', 4, 10);
  ctx.fillText('30', 4, height / 2 + 4);
  ctx.fillText('0', 4, height - 4);
}

function startStressTest() {
  const btn = document.getElementById('stress-test-btn');
  btn.textContent = '⏹ Stop Stress Test';
  btn.style.borderColor = '#f00';
  btn.style.color = '#f00';

  let angle = 0;
  stressTestInterval = setInterval(() => {
    angle += 0.1;
    const params = {
      yaw: angle,
      pitch: Math.sin(angle * 2) * 0.3
    };
    scene.view().setParameters(params);
  }, 16); // ~60fps panning

  console.log('Stress test started');
}

function stopStressTest() {
  if (stressTestInterval) {
    clearInterval(stressTestInterval);
    stressTestInterval = null;

    const btn = document.getElementById('stress-test-btn');
    btn.textContent = '🔥 Stress Test (Rapid Pan)';
    btn.style.borderColor = '#0f0';
    btn.style.color = '#0f0';

    console.log('Stress test stopped');
  }
}

// Export for debugging
window.marzipanoDemo = {
  viewer,
  scene,
  fpsHistory
};


/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

// Import Marzipano (assuming it's in the global scope via script tag)
// In a real app, you would: import * as Marzipano from 'marzipano';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', init);

let viewer;
let scene;
let videoSource;
let videoElement;

function init() {
  // Create viewer
  viewer = new Marzipano.Viewer(document.getElementById('pano'));

  // Enable telemetry for debugging
  viewer.on('perf', (sample) => {
    console.log(`FPS: ${sample.fps}, GPU: ${sample.gpuMB?.toFixed(2)}MB, Tiles: ${sample.tilesResident}`);
  });

  // Create video element
  videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  videoElement.playsInline = true; // Important for mobile
  videoElement.loop = true;
  
  // Use a sample video URL (replace with your own)
  // For demo purposes, using a placeholder
  videoElement.src = 'https://www.marzipano.net/media/video/mercedes-f1-1280x640.mp4';

  // Create video source
  videoSource = new Marzipano.VideoSource(videoElement, 'equirect360', { loop: true });

  // Create geometry for equirect
  const geometry = new Marzipano.EquirectGeometry([{ width: 4096 }]);

  // Create view with FOV limits
  const limiter = Marzipano.RectilinearView.limit.vfov(
    60 * Math.PI / 180,
    120 * Math.PI / 180
  );
  const view = new Marzipano.RectilinearView({ fov: Math.PI / 2 }, limiter);

  // Create scene
  scene = viewer.createScene({
    source: videoSource,
    geometry: geometry,
    view: view
  });

  // Bind video to scene for mediaTime events
  scene.bindVideo(videoSource);

  // Listen for media time updates
  scene.on('mediaTime', (e) => {
    updateTimeDisplay(e.currentTime);
  });

  // Display scene
  scene.switchTo();

  // Set up controls
  setupControls();

  // Wait for video metadata
  videoElement.addEventListener('loadedmetadata', () => {
    const duration = videoElement.duration;
    document.getElementById('video-time').max = duration;
    updateDurationDisplay(duration);
  });

  // Update time as video plays
  videoElement.addEventListener('timeupdate', () => {
    const currentTime = videoElement.currentTime;
    document.getElementById('video-time').value = currentTime;
  });

  console.log('Video 360 demo initialized');
  console.log('Backend:', viewer.getBackend());
}

function setupControls() {
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const timeSlider = document.getElementById('video-time');
  const videoSelect = document.getElementById('video-select');

  // Play button
  playBtn.addEventListener('click', async () => {
    try {
      await videoSource.play();
      playBtn.disabled = true;
      pauseBtn.disabled = false;
    } catch (err) {
      console.error('Failed to play video:', err);
      alert('Failed to play video. Please try again.');
    }
  });

  // Pause button
  pauseBtn.addEventListener('click', () => {
    videoSource.pause();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
  });

  // Time slider
  timeSlider.addEventListener('input', (e) => {
    const time = parseFloat(e.target.value);
    videoSource.seek(time);
  });

  // Video selection
  videoSelect.addEventListener('change', (e) => {
    const projection = e.target.value;
    console.log('Switching to projection:', projection);
    // In a real app, you would reload with different projection
    alert(`Projection change to ${projection} - reload demo with different video source`);
  });
}

function updateTimeDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  document.getElementById('current-time').textContent = 
    `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updateDurationDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  document.getElementById('duration').textContent = 
    `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Export for debugging
window.marzipanoDemo = {
  viewer,
  scene,
  videoSource,
  videoElement
};


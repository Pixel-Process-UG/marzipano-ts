/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

document.addEventListener('DOMContentLoaded', init);

let viewer;
let scene;
let audioContext;
let audioAnchors = [];
let oscillators = [];

function init() {
  // Create viewer
  viewer = new Marzipano.Viewer(document.getElementById('pano'));

  // Create a simple equirect scene
  const source = Marzipano.ImageUrlSource.fromString(
    'https://www.marzipano.net/media/equirect/{z}.jpg'
  );
  const geometry = new Marzipano.EquirectGeometry([
    { width: 4096 },
    { width: 2048 }
  ]);
  const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);
  const view = new Marzipano.RectilinearView({ yaw: 0 }, limiter);

  scene = viewer.createScene({
    source: source,
    geometry: geometry,
    view: view
  });

  scene.switchTo();

  // Set up audio initialization button
  document.getElementById('init-audio-btn').addEventListener('click', initAudio);

  console.log('Spatial audio demo initialized');
}

async function initAudio() {
  try {
    // Get audio context using AudioManager
    audioContext = Marzipano.audioManager.getContext();
    
    // Resume context (required for autoplay policy)
    await Marzipano.audioManager.resume();

    // Create three audio anchors at different positions
    // Left: yaw = -Math.PI/2 (90° left)
    const anchor1 = scene.createAudioAnchor(audioContext, {
      yaw: -Math.PI / 2,
      pitch: 0
    }, {
      distanceModel: 'inverse',
      maxDistance: 10000,
      refDistance: 1,
      rolloffFactor: 1
    });

    // Right: yaw = Math.PI/2 (90° right)
    const anchor2 = scene.createAudioAnchor(audioContext, {
      yaw: Math.PI / 2,
      pitch: 0
    }, {
      distanceModel: 'inverse',
      maxDistance: 10000,
      refDistance: 1,
      rolloffFactor: 1
    });

    // Behind: yaw = Math.PI (180° behind)
    const anchor3 = scene.createAudioAnchor(audioContext, {
      yaw: Math.PI,
      pitch: 0
    }, {
      distanceModel: 'inverse',
      maxDistance: 10000,
      refDistance: 1,
      rolloffFactor: 1
    });

    audioAnchors = [anchor1, anchor2, anchor3];

    // Update UI
    document.getElementById('init-audio-btn').disabled = true;
    document.getElementById('audio-status').textContent = '✓ Audio enabled';
    document.getElementById('audio-status').classList.add('active');
    document.getElementById('audio-controls').style.display = 'block';

    // Set up audio controls
    setupAudioControls();

    console.log('Audio initialized with', audioAnchors.length, 'anchors');
    console.log('Audio context state:', audioContext.state);
  } catch (err) {
    console.error('Failed to initialize audio:', err);
    alert('Failed to initialize audio: ' + err.message);
  }
}

function setupAudioControls() {
  // Play buttons
  document.querySelectorAll('.play-sound').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const anchorIndex = parseInt(e.target.dataset.anchor);
      playSound(anchorIndex);
    });
  });

  // Stop buttons
  document.querySelectorAll('.stop-sound').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const anchorIndex = parseInt(e.target.dataset.anchor);
      stopSound(anchorIndex);
    });
  });

  // Volume sliders
  document.querySelectorAll('.volume').forEach((slider) => {
    slider.addEventListener('input', (e) => {
      const anchorIndex = parseInt(e.target.dataset.anchor);
      const volume = parseFloat(e.target.value);
      audioAnchors[anchorIndex].setVolume(volume);
    });
  });
}

function playSound(anchorIndex) {
  // Stop existing oscillator for this anchor
  if (oscillators[anchorIndex]) {
    oscillators[anchorIndex].stop();
    oscillators[anchorIndex] = null;
  }

  // Create oscillator (simple sine wave for demo)
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  
  // Different frequencies for each anchor
  const frequencies = [220, 330, 440]; // A3, E4, A4
  oscillator.frequency.value = frequencies[anchorIndex];

  // Connect to audio anchor
  audioAnchors[anchorIndex].connect(oscillator);

  // Start playing
  oscillator.start();
  oscillators[anchorIndex] = oscillator;

  console.log(`Playing sound ${anchorIndex + 1} at ${frequencies[anchorIndex]}Hz`);
}

function stopSound(anchorIndex) {
  if (oscillators[anchorIndex]) {
    oscillators[anchorIndex].stop();
    oscillators[anchorIndex].disconnect();
    oscillators[anchorIndex] = null;
    console.log(`Stopped sound ${anchorIndex + 1}`);
  }
}

// Export for debugging
window.marzipanoDemo = {
  viewer,
  scene,
  audioContext,
  audioAnchors,
  oscillators
};


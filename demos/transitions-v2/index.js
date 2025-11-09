/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

document.addEventListener('DOMContentLoaded', init);

let viewer;
let scenes = [];
let currentSceneIndex = 0;

// Sample panorama URLs (using Marzipano demo images)
const panoramas = [
  'https://www.marzipano.net/media/equirect/{z}.jpg',
  'https://www.marzipano.net/media/music-room/{z}/{f}/{y}/{x}.jpg',
  'https://www.marzipano.net/media/equirect/{z}.jpg' // Reuse for demo
];

function init() {
  // Create viewer
  viewer = new Marzipano.Viewer(document.getElementById('pano'));

  // Create three scenes
  panoramas.forEach((url, index) => {
    let source, geometry, view;

    if (index === 1) {
      // Cube map
      source = Marzipano.ImageUrlSource.fromString(url, {
        cubeMapPreviewUrl: 'https://www.marzipano.net/media/music-room/preview.jpg'
      });
      geometry = new Marzipano.CubeGeometry([
        { tileSize: 256, size: 256, fallbackOnly: true },
        { size: 512, tileSize: 512 },
        { size: 1024, tileSize: 512 },
        { size: 2048, tileSize: 512 }
      ]);
    } else {
      // Equirect
      source = Marzipano.ImageUrlSource.fromString(url);
      geometry = new Marzipano.EquirectGeometry([
        { width: 4096 },
        { width: 2048 }
      ]);
    }

    const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);
    view = new Marzipano.RectilinearView({ yaw: index * (Math.PI / 3) }, limiter);

    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view
    });

    scenes.push(scene);
  });

  // Display first scene
  scenes[0].switchTo();
  updateSceneButtons();

  // Set up controls
  setupControls();

  // Listen for transition events
  viewer.on('transitionProgress', (e) => {
    updateProgressBar(e.progress);
  });

  viewer.on('transitionComplete', () => {
    hideProgressBar();
  });

  console.log('Transitions v2 demo initialized');
  console.log('Reduced motion:', Marzipano.util.Accessibility.prefersReducedMotion());
}

function setupControls() {
  // Scene buttons
  document.querySelectorAll('.scene-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetIndex = parseInt(e.target.dataset.scene);
      if (targetIndex !== currentSceneIndex) {
        switchToScene(targetIndex);
      }
    });
  });

  // Duration slider
  const durationSlider = document.getElementById('duration-slider');
  durationSlider.addEventListener('input', (e) => {
    document.getElementById('duration-value').textContent = e.target.value;
  });
}

function switchToScene(targetIndex) {
  const transitionType = document.getElementById('transition-select').value;
  const easingName = document.getElementById('easing-select').value;
  const duration = parseInt(document.getElementById('duration-slider').value);

  // Get easing function
  const easing = Marzipano.util.animation[easingName];

  // Show progress bar
  showProgressBar();

  // Switch scene with transition
  viewer.switchScene(scenes[targetIndex], {
    kind: transitionType,
    duration: duration,
    easing: easing
  }, () => {
    console.log(`Transitioned to scene ${targetIndex + 1}`);
  });

  currentSceneIndex = targetIndex;
  updateSceneButtons();
}

function updateSceneButtons() {
  document.querySelectorAll('.scene-btn').forEach((btn, index) => {
    if (index === currentSceneIndex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.getElementById('current-scene').textContent = `Scene ${currentSceneIndex + 1}`;
}

function showProgressBar() {
  document.getElementById('progress-container').style.display = 'block';
  updateProgressBar(0);
}

function hideProgressBar() {
  setTimeout(() => {
    document.getElementById('progress-container').style.display = 'none';
  }, 500);
}

function updateProgressBar(progress) {
  const percent = Math.round(progress * 100);
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-percent').textContent = `${percent}%`;
}

// Export for debugging
window.marzipanoDemo = {
  viewer,
  scenes,
  currentSceneIndex
};


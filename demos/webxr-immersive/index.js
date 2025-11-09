/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

document.addEventListener('DOMContentLoaded', init);

let viewer;
let scene;
let xrSession = null;

function init() {
  // Create viewer
  viewer = new Marzipano.Viewer(document.getElementById('pano'));

  // Create scene
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

  // Check XR support
  checkXRSupport();

  // Set up controls
  setupControls();

  console.log('WebXR demo initialized');
}

async function checkXRSupport() {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const enterVRBtn = document.getElementById('enter-vr-btn');

  if (!viewer.isXREnabled()) {
    statusIndicator.classList.add('error');
    statusText.textContent = 'WebXR not supported in this browser';
    enterVRBtn.disabled = true;
    console.log('WebXR not available');
    return;
  }

  try {
    // Check if immersive-vr is supported
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
    
    if (supported) {
      statusIndicator.classList.add('supported');
      statusText.textContent = 'WebXR supported - Ready for VR';
      enterVRBtn.disabled = false;
      console.log('WebXR supported');
    } else {
      statusIndicator.classList.add('error');
      statusText.textContent = 'WebXR available but immersive-vr not supported';
      enterVRBtn.disabled = true;
    }
  } catch (err) {
    statusIndicator.classList.add('error');
    statusText.textContent = 'Error checking WebXR support';
    enterVRBtn.disabled = true;
    console.error('XR support check failed:', err);
  }
}

function setupControls() {
  const enterVRBtn = document.getElementById('enter-vr-btn');
  const exitVRBtn = document.getElementById('exit-vr-btn');

  enterVRBtn.addEventListener('click', async () => {
    try {
      await enterVR();
    } catch (err) {
      console.error('Failed to enter VR:', err);
      logEvent(`Error: ${err.message}`, 'error');
      alert('Failed to enter VR: ' + err.message);
    }
  });

  exitVRBtn.addEventListener('click', async () => {
    if (xrSession) {
      await xrSession.end();
    }
  });
}

async function enterVR() {
  const referenceSpace = document.getElementById('reference-space-select').value;
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const enterVRBtn = document.getElementById('enter-vr-btn');
  const exitVRBtn = document.getElementById('exit-vr-btn');

  try {
    // Enter XR
    xrSession = await viewer.enterXR({
      requiredFeatures: [referenceSpace]
    });

    // Update UI
    statusIndicator.classList.remove('supported');
    statusIndicator.classList.add('active');
    statusText.textContent = 'In VR mode';
    enterVRBtn.style.display = 'none';
    exitVRBtn.style.display = 'block';

    // Log events
    logEvent('VR session started', 'success');

    // Listen for controller events
    xrSession.on('select', (event) => {
      const hand = event.inputSource ? event.inputSource.handedness : 'unknown';
      logEvent(`Controller select (${hand})`, 'event');
      console.log('XR select event:', event);
    });

    xrSession.on('squeeze', (event) => {
      const hand = event.inputSource ? event.inputSource.handedness : 'unknown';
      logEvent(`Controller squeeze (${hand})`, 'event');
      console.log('XR squeeze event:', event);
    });

    xrSession.on('end', () => {
      logEvent('VR session ended', 'success');
      
      // Update UI
      statusIndicator.classList.remove('active');
      statusIndicator.classList.add('supported');
      statusText.textContent = 'WebXR supported - Ready for VR';
      enterVRBtn.style.display = 'block';
      exitVRBtn.style.display = 'none';
      
      xrSession = null;
    });

    console.log('Entered VR mode');
  } catch (err) {
    throw new Error(`Failed to enter VR: ${err.message}`);
  }
}

function logEvent(message, type = 'info') {
  const eventLog = document.getElementById('controller-events');
  
  // Remove placeholder
  const placeholder = eventLog.querySelector('.log-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  // Create event entry
  const entry = document.createElement('div');
  entry.className = `event-entry ${type}`;
  
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `
    <span class="time">[${time}]</span> ${message}
  `;

  eventLog.insertBefore(entry, eventLog.firstChild);

  // Limit to 10 entries
  while (eventLog.children.length > 10) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

// Export for debugging
window.marzipanoDemo = {
  viewer,
  scene,
  xrSession
};


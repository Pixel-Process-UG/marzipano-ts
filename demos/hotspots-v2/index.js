/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

document.addEventListener('DOMContentLoaded', init);

let viewer;
let scene;
let hotspotHandles = [];
let hotspotCounter = 0;
let pickMode = false;

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

  // Set up controls
  setupControls();

  console.log('Hotspots v2 demo initialized');
}

function setupControls() {
  const addBtn = document.getElementById('add-hotspot-btn');
  const pickBtn = document.getElementById('pick-mode-btn');
  const panoElement = document.getElementById('pano');

  // Add hotspot at center
  addBtn.addEventListener('click', () => {
    const viewParams = scene.view().parameters();
    addHotspot(viewParams.yaw, viewParams.pitch);
  });

  // Pick mode toggle
  pickBtn.addEventListener('click', () => {
    pickMode = !pickMode;
    if (pickMode) {
      pickBtn.classList.add('active');
      pickBtn.textContent = '✓ Pick Mode (Click in pano)';
      panoElement.classList.add('pick-mode');
    } else {
      pickBtn.classList.remove('active');
      pickBtn.textContent = '🎯 Pick Mode';
      panoElement.classList.remove('pick-mode');
    }
  });

  // Click to pick
  panoElement.addEventListener('click', (e) => {
    if (pickMode) {
      const rect = panoElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const coords = viewer.pick(x, y);
      if (coords) {
        console.log('Picked coordinates:', coords);
        addHotspot(coords.yaw, coords.pitch);
        
        // Turn off pick mode after picking
        pickMode = false;
        pickBtn.classList.remove('active');
        pickBtn.textContent = '🎯 Pick Mode';
        panoElement.classList.remove('pick-mode');
      }
    }
  });
}

function addHotspot(yaw, pitch) {
  hotspotCounter++;

  // Create hotspot element
  const element = document.createElement('div');
  element.className = 'demo-hotspot';
  element.textContent = `Hotspot #${hotspotCounter}`;

  // Get options from UI
  const zIndex = parseInt(document.getElementById('zindex-input').value);
  const kind = document.getElementById('kind-select').value;
  const occlusion = document.getElementById('occlusion-select').value;
  const tabbable = document.getElementById('tabbable-check').checked;

  // Add hotspot using new API
  const handle = scene.addHotspot(element, { yaw, pitch }, {
    kind: kind,
    zIndex: zIndex,
    occlusion: occlusion,
    tabbable: tabbable,
    ariaLabel: `Interactive hotspot number ${hotspotCounter}`
  });

  // Store handle
  hotspotHandles.push({
    id: hotspotCounter,
    handle: handle,
    yaw: yaw,
    pitch: pitch
  });

  // Add click handler
  element.addEventListener('click', () => {
    console.log(`Clicked hotspot #${hotspotCounter}`);
    Marzipano.util.Accessibility.announce(`Activated hotspot ${hotspotCounter}`, 'polite');
  });

  // Update UI
  updateHotspotList();

  console.log(`Added hotspot #${hotspotCounter} at yaw:${yaw.toFixed(2)}, pitch:${pitch.toFixed(2)}`);
}

function updateHotspotList() {
  const listEl = document.getElementById('hotspot-list');
  const countEl = document.getElementById('hotspot-count');

  countEl.textContent = hotspotHandles.length;

  listEl.innerHTML = '';

  hotspotHandles.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'hotspot-item';
    
    const info = document.createElement('span');
    info.textContent = `#${item.id} (${item.yaw.toFixed(2)}, ${item.pitch.toFixed(2)})`;
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      item.handle.destroy();
      hotspotHandles.splice(index, 1);
      updateHotspotList();
    });

    itemEl.appendChild(info);
    itemEl.appendChild(removeBtn);
    listEl.appendChild(itemEl);
  });
}

// Export for debugging
window.marzipanoDemo = {
  viewer,
  scene,
  hotspotHandles
};


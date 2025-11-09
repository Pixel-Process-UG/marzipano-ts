/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { assert } from 'chai';
import sinon from 'sinon';
sinon.assert.expose(assert, { prefix: '' });

import DynamicAsset from '../../../src/assets/Dynamic.js';

function createTestCanvas(width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

describe('DynamicAsset', function () {
  it('element', function () {
    var img = new Image();
    var asset = new DynamicAsset(img);
    assert.strictEqual(asset.element(), img);
  });

  it('image width and height', function (done) {
    var img = new Image(10, 20);
    img.onload = function () {
      var asset = new DynamicAsset(img);
      assert.strictEqual(asset.width(), 12);
      assert.strictEqual(asset.height(), 34);
      done();
    };
    img.src = createTestCanvas(12, 34).toDataURL();
  });

  it('canvas width and height', function () {
    var asset = new DynamicAsset(createTestCanvas(12, 34));
    assert.strictEqual(asset.width(), 12);
    assert.strictEqual(asset.height(), 34);
  });

  it('isDynamic', function () {
    var img = new Image();
    var asset = new DynamicAsset(img);
    assert.isTrue(asset.isDynamic());
  });

  it('mark dirty', function () {
    var img = new Image();
    var asset = new DynamicAsset(img, { dynamic: true });

    var spy = sinon.spy();
    asset.addEventListener('change', spy);

    assert.strictEqual(asset.timestamp(), 0);
    asset.markDirty();
    assert.strictEqual(asset.timestamp(), 1);
    assert.calledOnce(spy);
  });
});

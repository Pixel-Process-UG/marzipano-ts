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

import TileSearcher from '../../src/TileSearcher.js';

import CubeGeometry from '../../src/geometries/Cube.js';
const CubeTile = CubeGeometry.Tile;
import RectilinearView from '../../src/views/Rectilinear.js';

describe('TileSearcher', function () {
  it('none visible', function () {
    const geometry = new CubeGeometry([{ size: 512, tileSize: 512 }]);
    const startingTile = new CubeTile('f', 0, 0, 0, geometry);
    const view = new RectilinearView({
      yaw: Math.PI,
      fov: Math.PI / 4,
      width: 100,
      height: 100,
    });
    const result = [];
    const count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 0);
    assert.isEmpty(result);
  });

  it('one visible', function () {
    const geometry = new CubeGeometry([{ size: 512, tileSize: 512 }]);
    const startingTile = new CubeTile('b', 0, 0, 0, geometry);
    const view = new RectilinearView({
      yaw: Math.PI,
      fov: Math.PI / 4,
      width: 100,
      height: 100,
    });
    const result = [];
    const count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 1);
    assert.lengthOf(result, 1);
    assert.isTrue(result[0].equals(startingTile));
  });

  it('many visible', function () {
    const geometry = new CubeGeometry([{ size: 512, tileSize: 128 }]);
    const startingTile = new CubeTile('f', 1, 1, 0, geometry);
    const expectedTiles = [
      new CubeTile('f', 1, 1, 0, geometry),
      new CubeTile('f', 1, 2, 0, geometry),
      new CubeTile('f', 2, 1, 0, geometry),
      new CubeTile('f', 2, 2, 0, geometry),
    ];
    const view = new RectilinearView({
      yaw: 0,
      fov: Math.PI / 6,
      width: 100,
      height: 100,
    });
    const result = [];
    const count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 4);
    let seen = 0;
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < expectedTiles.length; j++) {
        if (result[i].equals(expectedTiles[j])) {
          seen++;
          continue;
        }
      }
    }
    assert.equal(seen, expectedTiles.length);
  });

  it('preserves existing array members', function () {
    const geometry = new CubeGeometry([{ size: 512, tileSize: 512 }]);
    const startingTile = new CubeTile('b', 0, 0, 0, geometry);
    const view = new RectilinearView({
      yaw: Math.PI,
      fov: Math.PI / 4,
      width: 100,
      height: 100,
    });
    const result = [42];
    const count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 1);
    assert.lengthOf(result, 2);
    assert.equal(result[0], 42);
    assert.isTrue(result[1].equals(startingTile));
  });

  it('consecutive searches work correctly', function () {
    const geometry = new CubeGeometry([{ size: 512, tileSize: 512 }]);
    const startingTile1 = new CubeTile('f', 0, 0, 0, geometry);
    const view1 = new RectilinearView({
      yaw: 0,
      fov: Math.PI / 4,
      width: 100,
      height: 100,
    });
    const startingTile2 = new CubeTile('b', 0, 0, 0, geometry);
    const view2 = new RectilinearView({
      yaw: Math.PI,
      fov: Math.PI / 4,
      width: 100,
      height: 100,
    });
    const searcher = new TileSearcher();
    const result = [];
    const count1 = searcher.search(view1, startingTile1, result);
    const count2 = searcher.search(view2, startingTile2, result);
    assert.equal(count1, 1);
    assert.equal(count2, 1);
    assert.lengthOf(result, 2);
    assert.equal(result[0], startingTile1);
    assert.equal(result[1], startingTile2);
  });
});

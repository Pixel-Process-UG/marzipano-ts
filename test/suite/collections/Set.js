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

import Set from '../../../src/collections/Set.js';

function Item(element) {
  this._element = element;
}

Item.prototype.hash = function () {
  // Finite numbers hash to their absolute value; everything else hashes to 0.
  return isFinite(this._element) ? Math.floor(Math.abs(this._element)) : 0;
};

Item.prototype.equals = function (that) {
  return this._element === that._element;
};

describe('Set', function () {
  describe('add', function () {
    it('single element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 1);
    });

    it('nonexisting element with same hash as existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 2);
    });

    it('nonexisting element with different hash than existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(2);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 2);
    });

    it('existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.strictEqual(set.add(element2), element1);
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 1);
    });
  });

  describe('remove', function () {
    it('existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.strictEqual(set.remove(element2), element1);
      assert.isFalse(set.has(element1));
      assert.strictEqual(set.size(), 0);
    });

    it('nonexisting element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(2);
      set.add(element1);
      assert.isNull(set.remove(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

    it('existing element with same hash as existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      set.add(element1);
      set.add(element2);
      assert.strictEqual(set.remove(element2), element2);
      assert.isFalse(set.has(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

    it('nonexisting element with same hash as existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      set.add(element1);
      assert.isNull(set.remove(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });
  });

  describe('has', function () {
    it('nonexisting element', function () {
      var set = new Set();
      var element = new Item(1);
      assert.isFalse(set.has(element));
    });

    it('nonexisting element with same hash as existing element', function () {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      assert.isNull(set.add(element1));
      assert.isFalse(set.has(element2));
    });
  });

  describe('size', function () {
    it('empty', function () {
      var set = new Set();
      assert.strictEqual(set.size(), 0);
    });

    it('more elements than buckets', function () {
      var set = new Set(16);
      for (var i = 0; i < 32; i++) {
        set.add(new Item(i));
      }
      assert.strictEqual(set.size(), 32);
    });
  });

  describe('clear', function () {
    it('clear', function () {
      var set = new Set();
      for (var i = 0; i < 10; i++) {
        set.add(new Item(i));
      }
      set.clear();
      for (var i = 0; i < 10; i++) {
        assert.isFalse(set.has(new Item(i)));
      }
      assert.strictEqual(set.size(), 0);
    });
  });

  describe('forEach', function () {
    it('empty', function () {
      var set = new Set();
      assert.strictEqual(
        set.forEach(function () {
          assert.fail('unexpected call');
        }),
        0
      );
    });

    it('nonempty', function () {
      var set = new Set();
      var elements = [];
      for (var i = 0; i < 10; i++) {
        var element = new Item(i);
        set.add(element);
        elements.push(element);
      }

      var seenElements = [];
      var count = set.forEach(function (element) {
        seenElements.push(element);
      });

      assert.strictEqual(count, 10);
      assert.sameMembers(elements, seenElements);
    });
  });
});

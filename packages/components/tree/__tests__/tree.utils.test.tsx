// @ts-nocheck
import { expect, describe, it } from 'vitest';
import { getTNode, getNode, pathMatchClass } from '../utils';
import { TreeStore } from '@tdesign/common-js/tree/tree-store';

describe('Tree Utils', () => {
  describe('getTNode', () => {
    it('should return string for string prop', () => {
      const result = getTNode('hello', {});
      expect(result).toBe('hello');
    });
    it('should return VNode for function prop', () => {
      const result = getTNode((h) => h('div', 'test'), { createElement: (tag, child) => ({ tag, child }) });
      expect(result.tag).toBe('div');
    });
  });

  describe('getNode', () => {
    const store = new TreeStore();
    store.append([{ value: '1', label: '1' }]);

    it('should get node by value', () => {
      const node = getNode(store, '1');
      expect(node.value).toBe('1');
    });

    it('should get node by model', () => {
      const model = { value: '1', label: '1' };
      const node = getNode(store, model);
      expect(node.value).toBe('1');
    });
  });

  describe('pathMatchClass', () => {
    it('should return true if class exists in path', () => {
      const root = document.createElement('div');
      const parent = document.createElement('div');
      parent.className = 'target-class';
      const child = document.createElement('span');
      parent.appendChild(child);
      root.appendChild(parent);

      expect(pathMatchClass('target-class', child, root)).toBe(true);
      expect(pathMatchClass('other-class', child, root)).toBe(false);
    });
  });
});

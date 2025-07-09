// @ts-nocheck
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tree } from '@tdesign/components';
import { sleep } from '@tdesign/internal-utils';
import { TreeNodeModel, TreeOptionData } from '../type';
import { Icon } from 'tdesign-icons-vue-next';

const SIMPLE_DATA: TreeOptionData[] = [
  {
    value: '1',
    label: 'node1',
    children: [
      { value: '1.1', label: 'node1.1', children: [{ value: '1.1.1', label: 'node1.1.1' }] },
      { value: '1.2', label: 'node1.2' },
    ],
  },
  {
    value: '2',
    label: 'node2',
    children: [
      { value: '2.1', label: 'node2.1' },
      { value: '2.2', label: 'node2.2' },
    ],
  },
];

describe('Tree Component', () => {
  vi.useRealTimers();

  describe('Props & Behavior', () => {
    describe(':data (Initialization)', () => {
      it('should render default empty content when data is empty or null', () => {
        const wrapper = mount(Tree, { props: { data: [] } });
        const emptyEl = wrapper.find('.t-tree__empty');
        expect(emptyEl.exists()).toBe(true);
        expect(emptyEl.text()).not.toBe('');
      });

      it('should render custom empty content via slot', async () => {
        const wrapper = mount(Tree, {
          props: { data: null },
          slots: {
            empty: '<div class="tree-empty">暂无数据</div>',
          },
        });
        await nextTick();
        expect(wrapper.find('.tree-empty').exists()).toBe(true);
      });

      it('should allow appending to an empty tree', async () => {
        const wrapper = mount(Tree, { props: { data: null } });
        expect(wrapper.find('.t-tree__empty').exists()).toBe(true);
        wrapper.vm.appendTo('', { value: 'insert1' });
        await nextTick();
        expect(wrapper.find('.t-tree__empty').exists()).toBe(false);
        expect(wrapper.find('[data-value="insert1"]').exists()).toBe(true);
      });

      it(':data watcher - should react to prop changes and trigger rebuild', async () => {
        const wrapper = mount(Tree, {
          props: {
            data: JSON.parse(JSON.stringify(SIMPLE_DATA)),
            expandAll: true,
          },
        });
        await sleep(10);
        expect(wrapper.findAll('.t-tree__item').length).toBe(7);

        const newData = [{ value: '3', label: 'node3' }];
        await wrapper.setProps({ data: newData });
        await sleep(10);

        expect(wrapper.findAll('.t-tree__item').length).toBe(1);
        expect(wrapper.find('[data-value="3"]').exists()).toBe(true);
      });
    });

    describe(':checkable & value', () => {
      const data = [{ value: 't1', children: [{ value: 't1.1' }] }];

      it('should not show checkboxes by default', () => {
        const wrapper = mount(Tree, { props: { data, expandAll: true } });
        expect(wrapper.find('[data-value="t1"] input[type=checkbox]').exists()).toBe(false);
      });

      it('should show checkboxes when :checkable is true', () => {
        const wrapper = mount(Tree, { props: { data, checkable: true, expandAll: true } });
        expect(wrapper.find('[data-value="t1"] input[type=checkbox]').exists()).toBe(true);
        expect(wrapper.find('[data-value="t1.1"] input[type=checkbox]').exists()).toBe(true);
      });

      it(':defaultValue - should set initial checked state', async () => {
        const wrapper = mount(Tree, {
          props: {
            data: [{ value: 't1', children: [{ value: 't1.1' }, { value: 't1.2' }] }],
            checkable: true,
            expandAll: true,
            defaultValue: ['t1.1'],
          },
        });
        await nextTick();
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-indeterminate')).toBe(true);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(true);
        expect(wrapper.find('[data-value="t1.2"] .t-checkbox').classes('t-is-checked')).toBe(false);
      });

      it(':value - should control checked state', async () => {
        const value = ref([]);
        const wrapper = mount(Tree, {
          props: {
            data: [{ value: 't1', children: [{ value: 't1.1' }, { value: 't1.2' }] }],
            checkable: true,
            expandAll: true,
            value: value.value,
            'onUpdate:value': (val) => (value.value = val),
          },
        });

        await wrapper.setProps({ value: ['t1.2'] });
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-indeterminate')).toBe(true);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(false);
        expect(wrapper.find('[data-value="t1.2"] .t-checkbox').classes('t-is-checked')).toBe(true);
      });
    });

    describe(':checkStrictly', () => {
      it('should not link parent/child states when true', async () => {
        const wrapper = mount(Tree, {
          props: {
            data: [{ value: 't1', children: [{ value: 't1.1' }, { value: 't1.2' }] }],
            checkable: true,
            expandAll: true,
            checkStrictly: true,
            defaultValue: ['t1.2'],
          },
        });
        await nextTick();
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-checked')).toBe(false);
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-indeterminate')).toBe(false);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(false);
        expect(wrapper.find('[data-value="t1.2"] .t-checkbox').classes('t-is-checked')).toBe(true);
      });
    });

    describe(':valueMode', () => {
      const data = [{ value: 't1', children: [{ value: 't1.1', children: [{ value: 't1.1.1' }] }] }];
      const onChange = vi.fn();

      beforeEach(() => {
        onChange.mockClear();
      });

      it('valueMode="onlyLeaf" - should only include leaf nodes in `change` event', async () => {
        const wrapper = mount(Tree, { props: { data, checkable: true, valueMode: 'onlyLeaf', onChange } });
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked();
        expect(onChange).toHaveBeenCalled();
        const [checked, context] = onChange.mock.calls[0];
        expect(checked).toEqual(['t1.1.1']);
        expect(context.node.value).toEqual('t1');
      });

      it('valueMode="all" - should include all nodes in `change` event', async () => {
        const wrapper = mount(Tree, { props: { data, checkable: true, valueMode: 'all', onChange } });
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked();
        expect(onChange).toHaveBeenCalled();
        const [checked, context] = onChange.mock.calls[0];
        expect(checked).toEqual(['t1', 't1.1', 't1.1.1']);
        expect(context.node.value).toEqual('t1');
      });

      it('valueMode="parentFirst" - should only include parent nodes if children are all selected', async () => {
        const wrapper = mount(Tree, { props: { data, checkable: true, valueMode: 'parentFirst', onChange } });
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked();
        expect(onChange).toHaveBeenCalled();
        const [checked, context] = onChange.mock.calls[0];
        expect(checked).toEqual(['t1']);
        expect(context.node.value).toEqual('t1');
      });
    });

    describe(':activable & actived', () => {
      const data = [{ value: 't1', children: [{ value: 't1.1' }, { value: 't1.2' }] }];

      it('should allow nodes to be activated when :activable is true', async () => {
        const wrapper = mount(Tree, { props: { data, activable: true, expandAll: true } });
        const tree = wrapper.vm;
        tree.setItem('t1.1', { actived: true });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-active')).toBe(true);
      });

      it(':defaultActived - should set initial activated state', async () => {
        const wrapper = mount(Tree, { props: { data, activable: true, expandAll: true, defaultActived: ['t1.1'] } });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-active')).toBe(true);
      });

      it(':actived - should control activated state', async () => {
        const wrapper = mount(Tree, { props: { data, activable: true, expandAll: true, actived: ['t1.1'] } });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-active')).toBe(true);
        await wrapper.setProps({ actived: ['t1.2'] });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-active')).toBe(false);
        expect(wrapper.find('[data-value="t1.2"]').classes('t-is-active')).toBe(true);
      });
    });

    describe(':activeMultiple', () => {
      const data = [{ value: 't1', actived: true, children: [{ value: 't1.1' }, { value: 't1.2' }] }];

      it('should only allow one active node by default', async () => {
        const wrapper = mount(Tree, { props: { data, activable: true, expandAll: true } });
        await sleep(10);
        expect(wrapper.find('[data-value="t1"]').classes('t-is-active')).toBe(true);
        await wrapper.find('[data-value="t1.1"] .t-tree__label').trigger('click');
        await sleep(10);
        expect(wrapper.find('[data-value="t1"]').classes('t-is-active')).toBe(false);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-active')).toBe(true);
      });

      it('should allow multiple active nodes when :activeMultiple is true', async () => {
        const wrapper = mount(Tree, { props: { data, activable: true, expandAll: true, activeMultiple: true } });
        await sleep(10);
        expect(wrapper.find('[data-value="t1"]').classes('t-is-active')).toBe(true);
        await wrapper.find('[data-value="t1.1"] .t-tree__label').trigger('click');
        await sleep(10);
        expect(wrapper.find('[data-value="t1"]').classes('t-is-active')).toBe(true);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-active')).toBe(true);
      });
    });

    describe(':disabled & disableCheck', () => {
      const data = [{ value: 't1', label: 't1', children: [{ value: 't1.1' }, { value: 't1.2' }] }];

      it(':disabled - should disable the entire tree', async () => {
        const wrapper = mount(Tree, { props: { data, disabled: true, checkable: true, expandAll: true } });
        await sleep(10);
        expect(wrapper.find('[data-value="t1"]').classes('t-is-disabled')).toBe(true);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-disabled')).toBe(true);
        await wrapper.find('[data-value="t1.1"] input[type="checkbox"]').setChecked();
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(false);
      });

      it(':disableCheck - should disable specific nodes from being checked', async () => {
        const wrapper = mount(Tree, {
          props: { data, checkable: true, expandAll: true, disableCheck: (node) => node.value === 't1.1' },
        });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-disabled')).toBe(true);
        expect(wrapper.find('[data-value="t1.2"]').classes('t-is-disabled')).toBe(false);
      });

      it('node.disabled - should disable nodes based on data property', async () => {
        const disabledData = [{ value: 't1', children: [{ value: 't1.1', disabled: true }, { value: 't1.2' }] }];
        const wrapper = mount(Tree, { props: { data: disabledData, checkable: true, expandAll: true } });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-is-disabled')).toBe(true);
        expect(wrapper.find('[data-value="t1.2"]').classes('t-is-disabled')).toBe(false);
      });

      it('should not check disabled children when parent is checked', async () => {
        const wrapper = mount(Tree, {
          props: { data, checkable: true, expandAll: true, disableCheck: (node) => node.value === 't1.1' },
        });
        // cannot click here ??
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked(true);
        await sleep(10);
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-indeterminate')).toBe(true);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(false);
        expect(wrapper.find('[data-value="t1.2"] .t-checkbox').classes('t-is-checked')).toBe(true);
      });

      it('should not uncheck checked disabled children when parent is unchecked', async () => {
        const wrapper = mount(Tree, {
          props: {
            data,
            checkable: true,
            expandAll: true,
            defaultValue: ['t1.1', 't1.2'],
            disableCheck: (node) => node.value === 't1.1',
          },
        });
        await sleep(10);
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-checked')).toBe(true);
        // cannot click here ??
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked(false);
        await sleep(10);
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-indeterminate')).toBe(true);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(true); // remains checked
        expect(wrapper.find('[data-value="t1.2"] .t-checkbox').classes('t-is-checked')).toBe(false); // gets unchecked
      });
    });

    describe(':expand*', () => {
      const data = [
        {
          value: 't1',
          children: [{ value: 't1.1', children: [{ value: 't1.1.1' }] }],
        },
        {
          value: 't2',
          children: [{ value: 't2.1' }],
        },
      ];

      it(':expandAll - should expand all nodes', () => {
        const wrapper = mount(Tree, { props: { data, expandAll: true } });
        expect(wrapper.find('[data-value="t1.1.1"]').exists()).toBe(true);
        expect(wrapper.find('[data-value="t2.1"]').exists()).toBe(true);
      });

      it('should not expand nodes by default', () => {
        const wrapper = mount(Tree, { props: { data } });
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(false);
      });

      it(':defaultExpanded - should expand specified nodes initially', () => {
        const wrapper = mount(Tree, { props: { data, defaultExpanded: ['t2'] } });
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(false);
        expect(wrapper.find('[data-value="t2.1"]').exists()).toBe(true);
      });

      it(':expanded - should control expanded state', async () => {
        const wrapper = mount(Tree, { props: { data, expanded: ['t1'] } });
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(true);
        await wrapper.setProps({ expanded: ['t2'] });
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1.1"]').exists()).toBe(false);
        expect(wrapper.find('[data-value="t2.1"]').classes('t-tree__item--visible')).toBe(true);
      });

      it(':expandLevel - should expand nodes to a specific level', () => {
        const wrapper = mount(Tree, { props: { data, expandLevel: 1 } });
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(true);
        expect(wrapper.find('[data-value="t1.1.1"]').exists()).toBe(false);
        expect(wrapper.find('[data-value="t2.1"]').exists()).toBe(true);
      });

      it(':expandMutex - should only allow one sibling node to be expanded at a time', async () => {
        const wrapper = mount(Tree, { props: { data, expandMutex: true } });
        await wrapper.find('[data-value="t1"] .t-tree__icon').trigger('click');
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-tree__item--visible')).toBe(true);
        await wrapper.find('[data-value="t2"] .t-tree__icon').trigger('click');
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').classes('t-tree__item--hidden')).toBe(true);
        expect(wrapper.find('[data-value="t2.1"]').classes('t-tree__item--visible')).toBe(true);
      });

      it(':expandParent - should expand parent nodes when a child is expanded', async () => {
        const wrapper = mount(Tree, { props: { data, expandParent: true } });
        wrapper.vm.setItem('t1.1', { expanded: true });
        await sleep(10);
        expect(wrapper.vm.getItem('t1').expanded).toBe(true);
        expect(wrapper.find('[data-value="t1.1.1"]').exists()).toBe(true);
      });

      it(':expandOnClickNode - should expand/collapse on node label click', async () => {
        const wrapper = mount(Tree, { props: { data, expandOnClickNode: true } });
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(false);
        await wrapper.find('[data-value="t1"] .t-tree__label').trigger('click');
        await sleep(10);
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(true);
      });
    });

    describe(':keys', () => {
      it('should use custom keys for value, label, and children', () => {
        const data = [
          {
            id: 't1',
            name: 'node.t1',
            subnodes: [{ id: 't1.1', name: 'node.t1.1' }],
          },
        ];
        const keys = { value: 'id', label: 'name', children: 'subnodes' };
        const wrapper = mount(Tree, { props: { data, keys, expandAll: true } });
        expect(wrapper.find('[data-value="t1"]').exists()).toBe(true);
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(true);
        expect(wrapper.find('[data-value="t1"]').text()).toBe('node.t1');
        expect(wrapper.find('[data-value="t1.1"]').text()).toBe('node.t1.1');
      });
    });

    describe(':lazy & :load', () => {
      const data = [{ value: 't1', children: true }];
      const load = vi.fn(async (node) => {
        await sleep(10);
        if (node.level < 1) {
          return [{ value: `${node.value}.1`, label: `${node.value}.1`, children: true }];
        }
        return [];
      });
      beforeEach(() => {
        load.mockClear();
      });
      it(':lazy=true - should load data on expand click', async () => {
        const wrapper = mount(Tree, {
          props: { data, lazy: true, load },
        });
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(false);
        await wrapper.find('[data-value="t1"] .t-tree__icon').trigger('click');
        expect(load).toHaveBeenCalled();
        await sleep(20);
        expect(wrapper.find('[data-value="t1.1"]').exists()).toBe(true);
      });

      it(':lazy=false - should load data automatically with expandAll', async () => {
        const loadPromise = new Promise((resolve) => {
          mount(Tree, {
            props: {
              data,
              lazy: false,
              load,
              expandAll: true,
              onLoad: resolve, // 使用 onLoad 事件作为加载完成的信号
            },
          });
        });

        await loadPromise;

        expect(load).toHaveBeenCalled();
      });

      it('should inherit parent checked state when lazily loaded', async () => {
        const checkedValue = ref([]);
        const wrapper = mount(Tree, {
          props: {
            data,
            lazy: true,
            load,
            checkable: true,
            valueMode: 'all', // 关键：确保父节点可以被包含在 value 中
            value: checkedValue.value,
            'onUpdate:value': (newValue) => {
              checkedValue.value = newValue;
            },
          },
        });
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked(true);
        await wrapper.setProps({ value: checkedValue.value });
        expect(wrapper.find('[data-value="t1"] .t-checkbox').classes('t-is-checked')).toBe(true);
        await wrapper.find('[data-value="t1"] .t-tree__icon').trigger('click');
        await sleep(20);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(true);
      });

      it('should not inherit parent checked state when checkStrictly is true', async () => {
        const checkedValue = ref([]);
        const wrapper = mount(Tree, {
          props: {
            data,
            lazy: true,
            load,
            checkable: true,
            checkStrictly: true,
            value: checkedValue.value,
            'onUpdate:value': (newValue) => {
              checkedValue.value = newValue;
            },
          },
        });
        await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked(true);
        await wrapper.setProps({ value: checkedValue.value });
        await wrapper.find('[data-value="t1"] .t-tree__icon').trigger('click');
        await sleep(20);
        expect(wrapper.find('[data-value="t1.1"] .t-checkbox').classes('t-is-checked')).toBe(false);
      });
    });

    describe(':filter (and Empty State)', () => {
      it('should filter nodes and lock parent visibility', async () => {
        const filter = ref(null);
        const wrapper = mount(Tree, {
          props: {
            data: SIMPLE_DATA,
            expandAll: true,
            filter: filter.value,
          },
        });

        // Filter to 'node1.2'
        await wrapper.setProps({ filter: (node) => node.label === 'node1.2' });
        await sleep(10);
        expect(wrapper.find('[data-value="1"]').classes('t-is-disabled')).toBe(true); // Parent is locked
        expect(wrapper.find('[data-value="1.1"]').classes('t-tree__item--visible')).toBe(false);
        expect(wrapper.find('[data-value="1.2"]').classes('t-tree__item--visible')).toBe(true);
        expect(wrapper.find('.t-tree__empty').exists()).toBe(false);

        // Filter to nothing
        await wrapper.setProps({ filter: () => false });
        await sleep(10);
        expect(wrapper.find('.t-tree__empty').exists()).toBe(true);
        expect(wrapper.findAll('.t-tree__item--visible').length).toBe(0);

        // Reset filter
        await wrapper.setProps({ filter: null });
        await sleep(10);
        expect(wrapper.find('.t-tree__empty').exists()).toBe(false);
        expect(wrapper.find('[data-value="1.1"]').classes('t-tree__item--visible')).toBe(true);
      });
    });

    describe('Misc Props', () => {
      it(':transition - should not use TransitionGroup when false', async () => {
        const wrapper = mount(Tree, {
          props: { data: SIMPLE_DATA, transition: false, expandAll: true },
        });
        await sleep(10);
        expect(wrapper.classes()).not.toContain('t-tree--transition');
      });

      it(':icon - should render custom icons', async () => {
        const wrapper = mount(Tree, {
          props: {
            data: SIMPLE_DATA,
            icon: (h, node) => (node.getChildren() ? <Icon name="folder" /> : <Icon name="file" />),
            expandAll: true,
          },
        });
        await nextTick();
        expect(wrapper.find('[data-value="1"] .t-icon-folder').exists()).toBe(true);
        expect(wrapper.find('[data-value="2.1"] .t-icon-file').exists()).toBe(true);
      });
    });
  });

  describe('Events', () => {
    const data = [{ value: 't1', children: [{ value: 't1.1' }] }, { value: 't2' }];

    it('@active - should be emitted on node activation', async () => {
      const onActive = vi.fn();
      const wrapper = mount(Tree, { props: { data, activable: true, onActive } });
      await wrapper.find('[data-value="t2"] .t-tree__label').trigger('click');
      expect(onActive).toHaveBeenCalledOnce();
      const [actived, context] = onActive.mock.calls[0];
      expect(actived).toEqual(['t2']);
      expect(context.node.value).toBe('t2');
    });

    it('@expand - should be emitted on node expand/collapse', async () => {
      const onExpand = vi.fn();
      const wrapper = mount(Tree, { props: { data, onExpand } });
      await wrapper.find('[data-value="t1"] .t-tree__icon').trigger('click');
      expect(onExpand).toHaveBeenCalledOnce();
      const [expanded, context] = onExpand.mock.calls[0];
      expect(expanded).toEqual(['t1']);
      expect(context.node.value).toBe('t1');
    });

    it('@change - should be emitted on checkbox state change', async () => {
      const onChange = vi.fn();
      const wrapper = mount(Tree, { props: { data, checkable: true, onChange } });
      await wrapper.find('[data-value="t1"] input[type="checkbox"]').setChecked();
      expect(onChange).toHaveBeenCalledOnce();
      const [checked, context] = onChange.mock.calls[0];
      expect(checked).toEqual(['t1.1']);
      expect(context.node.value).toBe('t1');
    });

    it('@load - should be emitted when node data is loaded', async () => {
      const onLoad = vi.fn();
      const load = async () => [{ value: 't1.1' }];
      const data = [{ value: 't1', children: true }];
      mount(Tree, { props: { data, load, onLoad, lazy: false, expandAll: true } });
      await sleep(20);
      // How many times should onLoad be called?
      expect(onLoad).toHaveBeenCalled();
      expect(onLoad.mock.calls[0][0].node.value).toBe('t1');
    });
  });

  describe('Instance API', () => {
    let wrapper: VueWrapper;
    let tree: any;

    beforeEach(async () => {
      wrapper = mount(Tree, {
        props: {
          data: JSON.parse(JSON.stringify(SIMPLE_DATA)),
          checkable: true,
          activable: true,
          expandAll: true,
        },
      });
      tree = wrapper.vm;
      await nextTick();
    });

    it(':getItem', () => {
      const node = tree.getItem('1.1');
      expect(node?.value).toBe('1.1');
    });

    it(':getItems', () => {
      const nodes = tree.getItems('1');
      expect(nodes.map((n: TreeNodeModel) => n.value)).toEqual(['1', '1.1', '1.1.1', '1.2']);
    });

    it(':appendTo', async () => {
      tree.appendTo('1.2', { value: '1.2.1' });
      await sleep(10);
      expect(wrapper.find('[data-value="1.2.1"]').exists()).toBe(true);
    });

    it(':insertBefore', async () => {
      tree.insertBefore('1.2', { value: '1.1.5' });
      await sleep(10);
      const parent = tree.getItem('1');
      expect(parent.getChildren().map((n: TreeNodeModel) => n.value)).toEqual(['1.1', '1.1.5', '1.2']);
    });

    it(':insertAfter', async () => {
      tree.insertAfter('1.1', { value: '1.1.5' });
      await sleep(10);
      const parent = tree.getItem('1');
      expect(parent.getChildren().map((n: TreeNodeModel) => n.value)).toEqual(['1.1', '1.1.5', '1.2']);
    });

    it(':remove', async () => {
      tree.remove('1.2');
      await sleep(10);
      expect(wrapper.find('[data-value="1.2"]').exists()).toBe(false);
    });

    it(':setItem', async () => {
      tree.setItem('1.1', { checked: true, label: 'new-label-1.1' });
      await sleep(10);
      expect(tree.getItem('1.1').checked).toBe(true);
      expect(wrapper.find('[data-value="1.1"] .t-tree__label').text()).toContain('new-label-1.1');
    });

    it(':getIndex', () => {
      expect(tree.getIndex('1.2')).toBe(1);
    });

    it(':getParent', () => {
      const parent = tree.getParent('1.1.1');
      expect(parent?.value).toBe('1.1');
      const rootParent = tree.getParent('1');
      expect(rootParent).toBeUndefined();
    });

    it(':getParents', () => {
      const parents = tree.getParents('1.1.1');
      expect(parents.map((p: TreeNodeModel) => p.value)).toEqual(['1.1', '1']);
    });

    it(':getPath', () => {
      const path = tree.getPath('1.1.1');
      expect(path.map((p: TreeNodeModel) => p.value)).toEqual(['1', '1.1', '1.1.1']);
    });

    it(':getTreeData', () => {
      const allTreeData = tree.getTreeData();
      expect(allTreeData.length).toBe(2);
      expect(allTreeData[0].value).toBe('1');
      const subTreeData = tree.getTreeData('1.1');
      expect(subTreeData[0].value).toBe('1.1');
    });
  });

  describe('TreeNodeModel API', () => {
    let wrapper: VueWrapper;
    let tree: any;
    let node1, node11, node12;

    beforeEach(async () => {
      const data = [
        {
          value: 't1',
          children: [{ value: 't1.1' }, { value: 't1.2' }],
        },
        { value: 't2' },
      ];
      wrapper = mount(Tree, { props: { data, expandAll: true } });
      tree = wrapper.vm;
      node1 = tree.getItem('t1');
      node11 = tree.getItem('t1.1');
      node12 = tree.getItem('t1.2');
      await nextTick();
    });

    it('#getLevel', () => {
      expect(node1.getLevel()).toBe(0);
      expect(node11.getLevel()).toBe(1);
    });

    it('#getIndex', () => {
      expect(node1.getIndex()).toBe(0);
      expect(node11.getIndex()).toBe(0);
      expect(node12.getIndex()).toBe(1);
    });

    it('#isFirst/#isLast', () => {
      expect(node11.isFirst()).toBe(true);
      expect(node11.isLast()).toBe(false);
      expect(node12.isFirst()).toBe(false);
      expect(node12.isLast()).toBe(true);
    });

    it('#isLeaf', () => {
      expect(node1.isLeaf()).toBe(false);
      expect(node11.isLeaf()).toBe(true);
    });

    it('#insertBefore/#insertAfter', async () => {
      node12.insertBefore({ value: 't1.1.5' });
      await sleep(10);
      expect(node1.getChildren().map((n) => n.value)).toEqual(['t1.1', 't1.1.5', 't1.2']);
      node12.insertAfter({ value: 't1.3' });
      await sleep(10);
      expect(node1.getChildren().map((n) => n.value)).toEqual(['t1.1', 't1.1.5', 't1.2', 't1.3']);
    });

    it('#appendData', async () => {
      node11.appendData({ value: 't1.1.1' });
      await sleep(10);
      expect(wrapper.find('[data-value="t1.1.1"]').exists()).toBe(true);
      expect(node11.isLeaf()).toBe(false);
    });

    it('#getPath', () => {
      const path = node12.getPath();
      expect(path.map((n) => n.value)).toEqual(['t1', 't1.2']);
    });

    it('#getParent/#getParents/#getRoot', () => {
      expect(node12.getParent().value).toBe('t1');
      expect(node12.getParents().map((n) => n.value)).toEqual(['t1']);
      expect(node12.getRoot().value).toBe('t1');
    });

    it('#getChildren/#getSiblings', () => {
      expect(node1.getChildren().length).toBe(2);
      expect(node11.getSiblings().length).toBe(2);
      expect(node11.getSiblings()[1].value).toBe('t1.2');
    });

    it('#remove', async () => {
      expect(wrapper.find('[data-value="t1.2"]').exists()).toBe(true);
      node12.remove();
      await sleep(10);
      expect(wrapper.find('[data-value="t1.2"]').exists()).toBe(false);
    });

    it('#setData', async () => {
      const label = (h, node) => `${node.value}-${node.data.info}`;
      const data = [{ value: 't1', info: 'a', children: [{ value: 't1.1', info: 'b' }] }];
      const wrapper = mount(Tree, { props: { data, label, expandAll: true } });
      await sleep(10);
      expect(wrapper.find('[data-value="t1.1"]').text()).toBe('t1.1-b');
      wrapper.vm.getItem('t1.1').setData({ info: 'c' });
      await sleep(10);
      expect(wrapper.find('[data-value="t1.1"]').text()).toBe('t1.1-c');
    });
  });
});

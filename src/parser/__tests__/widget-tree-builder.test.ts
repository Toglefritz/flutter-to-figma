import { WidgetTreeBuilder, WidgetTree, WidgetHierarchy } from '../widget-tree-builder';
import { Widget, WidgetType } from '../../schema/types';

describe('WidgetTreeBuilder', () => {
  let builder: WidgetTreeBuilder;

  beforeEach(() => {
    builder = new WidgetTreeBuilder();
  });

  // Helper function to create test widgets
  const createWidget = (
    id: string,
    type: WidgetType,
    children: Widget[] = [],
    properties: any = {}
  ): Widget => ({
    id,
    type,
    properties,
    children,
    styling: { colors: [] }
  });

  describe('Single Tree Building', () => {
    it('should build tree for single widget with no children', () => {
      const widget = createWidget('w1', WidgetType.TEXT);
      const analysis = builder.buildTrees([widget]);

      expect(analysis.trees).toHaveLength(1);
      const tree = analysis.trees[0];
      
      expect(tree.root).toBe(widget);
      expect(tree.allWidgets).toHaveLength(1);
      expect(tree.allWidgets[0]).toBe(widget);
      expect(tree.depth).toBe(0);
      expect(tree.nodeCount).toBe(1);
    });

    it('should build tree for widget with single child', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const parent = createWidget('parent', WidgetType.CONTAINER, [child]);
      
      const analysis = builder.buildTrees([parent]);

      expect(analysis.trees).toHaveLength(1);
      const tree = analysis.trees[0];
      
      expect(tree.root).toBe(parent);
      expect(tree.allWidgets).toHaveLength(2);
      expect(tree.allWidgets).toContain(parent);
      expect(tree.allWidgets).toContain(child);
      expect(tree.depth).toBe(1);
      expect(tree.nodeCount).toBe(2);
    });

    it('should build tree for widget with multiple children', () => {
      const child1 = createWidget('child1', WidgetType.TEXT);
      const child2 = createWidget('child2', WidgetType.TEXT);
      const child3 = createWidget('child3', WidgetType.CONTAINER);
      const parent = createWidget('parent', WidgetType.ROW, [child1, child2, child3]);
      
      const analysis = builder.buildTrees([parent]);

      expect(analysis.trees).toHaveLength(1);
      const tree = analysis.trees[0];
      
      expect(tree.allWidgets).toHaveLength(4);
      expect(tree.depth).toBe(1);
      expect(tree.nodeCount).toBe(4);
    });

    it('should handle deeply nested widget structures', () => {
      const deepChild = createWidget('deep', WidgetType.TEXT);
      const level2 = createWidget('level2', WidgetType.CONTAINER, [deepChild]);
      const level1 = createWidget('level1', WidgetType.COLUMN, [level2]);
      const root = createWidget('root', WidgetType.SCAFFOLD, [level1]);
      
      const analysis = builder.buildTrees([root]);

      expect(analysis.trees).toHaveLength(1);
      const tree = analysis.trees[0];
      
      expect(tree.allWidgets).toHaveLength(4);
      expect(tree.depth).toBe(3);
      expect(tree.nodeCount).toBe(4);
    });
  });

  describe('Multiple Trees Building', () => {
    it('should build multiple independent trees', () => {
      const tree1Root = createWidget('tree1', WidgetType.CONTAINER);
      const tree2Root = createWidget('tree2', WidgetType.ROW);
      const tree3Root = createWidget('tree3', WidgetType.TEXT);
      
      const analysis = builder.buildTrees([tree1Root, tree2Root, tree3Root]);

      expect(analysis.trees).toHaveLength(3);
      expect(analysis.totalNodes).toBe(3);
      expect(analysis.maxDepth).toBe(0);
    });

    it('should handle trees of different depths', () => {
      const shallowTree = createWidget('shallow', WidgetType.TEXT);
      
      const deepChild = createWidget('deep', WidgetType.TEXT);
      const deepParent = createWidget('deepParent', WidgetType.CONTAINER, [deepChild]);
      
      const analysis = builder.buildTrees([shallowTree, deepParent]);

      expect(analysis.trees).toHaveLength(2);
      expect(analysis.totalNodes).toBe(3);
      expect(analysis.maxDepth).toBe(1);
    });
  });

  describe('Hierarchy Information', () => {
    it('should create correct hierarchy for simple parent-child', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const parent = createWidget('parent', WidgetType.CONTAINER, [child]);
      
      const analysis = builder.buildTrees([parent]);

      expect(analysis.hierarchies.size).toBe(2);
      
      const parentHierarchy = analysis.hierarchies.get('parent')!;
      expect(parentHierarchy.widget).toBe(parent);
      expect(parentHierarchy.parent).toBeNull();
      expect(parentHierarchy.children).toHaveLength(1);
      expect(parentHierarchy.children[0]).toBe(child);
      expect(parentHierarchy.depth).toBe(0);
      expect(parentHierarchy.path).toEqual([WidgetType.CONTAINER]);
      expect(parentHierarchy.index).toBe(-1); // No siblings

      const childHierarchy = analysis.hierarchies.get('child')!;
      expect(childHierarchy.widget).toBe(child);
      expect(childHierarchy.parent).toBe(parent);
      expect(childHierarchy.children).toHaveLength(0);
      expect(childHierarchy.depth).toBe(1);
      expect(childHierarchy.path).toEqual([WidgetType.CONTAINER, WidgetType.TEXT]);
      expect(childHierarchy.index).toBe(0);
    });

    it('should handle siblings correctly', () => {
      const child1 = createWidget('child1', WidgetType.TEXT);
      const child2 = createWidget('child2', WidgetType.BUTTON);
      const child3 = createWidget('child3', WidgetType.IMAGE);
      const parent = createWidget('parent', WidgetType.ROW, [child1, child2, child3]);
      
      const analysis = builder.buildTrees([parent]);

      const child1Hierarchy = analysis.hierarchies.get('child1')!;
      expect(child1Hierarchy.siblings).toHaveLength(2);
      expect(child1Hierarchy.siblings).toContain(child2);
      expect(child1Hierarchy.siblings).toContain(child3);
      expect(child1Hierarchy.index).toBe(0);

      const child2Hierarchy = analysis.hierarchies.get('child2')!;
      expect(child2Hierarchy.siblings).toHaveLength(2);
      expect(child2Hierarchy.siblings).toContain(child1);
      expect(child2Hierarchy.siblings).toContain(child3);
      expect(child2Hierarchy.index).toBe(1);

      const child3Hierarchy = analysis.hierarchies.get('child3')!;
      expect(child3Hierarchy.index).toBe(2);
    });

    it('should build correct paths for nested structures', () => {
      const deepChild = createWidget('deep', WidgetType.TEXT);
      const middle = createWidget('middle', WidgetType.CONTAINER, [deepChild]);
      const root = createWidget('root', WidgetType.COLUMN, [middle]);
      
      const analysis = builder.buildTrees([root]);

      const rootHierarchy = analysis.hierarchies.get('root')!;
      expect(rootHierarchy.path).toEqual([WidgetType.COLUMN]);

      const middleHierarchy = analysis.hierarchies.get('middle')!;
      expect(middleHierarchy.path).toEqual([WidgetType.COLUMN, WidgetType.CONTAINER]);

      const deepHierarchy = analysis.hierarchies.get('deep')!;
      expect(deepHierarchy.path).toEqual([WidgetType.COLUMN, WidgetType.CONTAINER, WidgetType.TEXT]);
    });
  });

  describe('Widget Classification', () => {
    it('should classify container and leaf widgets', () => {
      const text = createWidget('text', WidgetType.TEXT);
      const image = createWidget('image', WidgetType.IMAGE);
      const container = createWidget('container', WidgetType.CONTAINER, [text]);
      const row = createWidget('row', WidgetType.ROW, [container, image]);
      
      const analysis = builder.buildTrees([row]);

      expect(analysis.containerWidgets).toHaveLength(2);
      expect(analysis.containerWidgets.map(w => w.id)).toContain('container');
      expect(analysis.containerWidgets.map(w => w.id)).toContain('row');

      expect(analysis.leafWidgets).toHaveLength(2);
      expect(analysis.leafWidgets.map(w => w.id)).toContain('text');
      expect(analysis.leafWidgets.map(w => w.id)).toContain('image');
    });

    it('should handle widgets that are both containers and leaves', () => {
      const emptyContainer = createWidget('empty', WidgetType.CONTAINER, []);
      const button = createWidget('button', WidgetType.BUTTON, []);
      
      const analysis = builder.buildTrees([emptyContainer, button]);

      // Empty container is still a container type but also a leaf
      expect(analysis.containerWidgets.map(w => w.id)).toContain('button');
      expect(analysis.leafWidgets.map(w => w.id)).toContain('empty');
      expect(analysis.leafWidgets.map(w => w.id)).toContain('button');
    });
  });

  describe('Tree Navigation Methods', () => {
    let complexTree: Widget;
    let analysis: any;

    beforeEach(() => {
      // Build a complex tree for navigation tests
      const text1 = createWidget('text1', WidgetType.TEXT);
      const text2 = createWidget('text2', WidgetType.TEXT);
      const button = createWidget('button', WidgetType.BUTTON, [text2]);
      const row = createWidget('row', WidgetType.ROW, [text1, button]);
      const container = createWidget('container', WidgetType.CONTAINER, [row]);
      complexTree = createWidget('scaffold', WidgetType.SCAFFOLD, [container]);
      
      analysis = builder.buildTrees([complexTree]);
    });

    it('should find widgets by type', () => {
      const tree = analysis.trees[0];
      const textWidgets = builder.findWidgetsByType(tree, WidgetType.TEXT);
      
      expect(textWidgets).toHaveLength(2);
      expect(textWidgets.map((w: Widget) => w.id)).toContain('text1');
      expect(textWidgets.map((w: Widget) => w.id)).toContain('text2');
    });

    it('should find widgets by property', () => {
      const widgetWithProp = createWidget('special', WidgetType.CONTAINER, [], { special: true });
      const treeWithProp = builder.buildTrees([widgetWithProp]);
      
      const found = builder.findWidgetsByProperty(treeWithProp.trees[0], 'special', true);
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('special');
    });

    it('should get widget path from root', () => {
      const path = builder.getWidgetPath(analysis.hierarchies, 'text2');
      
      expect(path).toHaveLength(5);
      expect(path.map((w: Widget) => w.id)).toEqual(['scaffold', 'container', 'row', 'button', 'text2']);
    });

    it('should get all descendants', () => {
      const descendants = builder.getDescendants(complexTree);
      
      expect(descendants).toHaveLength(5);
      expect(descendants.map(w => w.id)).toContain('container');
      expect(descendants.map(w => w.id)).toContain('row');
      expect(descendants.map(w => w.id)).toContain('text1');
      expect(descendants.map(w => w.id)).toContain('button');
      expect(descendants.map(w => w.id)).toContain('text2');
    });

    it('should get all ancestors', () => {
      const ancestors = builder.getAncestors(analysis.hierarchies, 'text2');
      
      expect(ancestors).toHaveLength(4);
      expect(ancestors.map((w: Widget) => w.id)).toEqual(['button', 'row', 'container', 'scaffold']);
    });

    it('should check ancestor relationships', () => {
      expect(builder.isAncestor(analysis.hierarchies, 'scaffold', 'text2')).toBe(true);
      expect(builder.isAncestor(analysis.hierarchies, 'row', 'text2')).toBe(true);
      expect(builder.isAncestor(analysis.hierarchies, 'text1', 'text2')).toBe(false);
      expect(builder.isAncestor(analysis.hierarchies, 'text2', 'scaffold')).toBe(false);
    });

    it('should get siblings', () => {
      const siblings = builder.getSiblings(analysis.hierarchies, 'text1');
      
      expect(siblings).toHaveLength(1);
      expect(siblings[0].id).toBe('button');
    });

    it('should get widget at specific path', () => {
      const widget = builder.getWidgetAtPath(complexTree, [0, 0, 1]); // scaffold -> container -> row -> button
      
      expect(widget).not.toBeNull();
      expect(widget!.id).toBe('button');
    });

    it('should return null for invalid path', () => {
      const widget = builder.getWidgetAtPath(complexTree, [0, 0, 5]); // Invalid index
      
      expect(widget).toBeNull();
    });
  });

  describe('Tree Validation', () => {
    it('should validate correct tree structure', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const parent = createWidget('parent', WidgetType.CONTAINER, [child]);
      const tree = builder.buildTrees([parent]).trees[0];
      
      const validation = builder.validateTree(tree);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect duplicate widget IDs', () => {
      const child1 = createWidget('duplicate', WidgetType.TEXT);
      const child2 = createWidget('duplicate', WidgetType.BUTTON); // Same ID
      const parent = createWidget('parent', WidgetType.ROW, [child1, child2]);
      const tree = builder.buildTrees([parent]).trees[0];
      
      const validation = builder.validateTree(tree);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('Duplicate widget ID');
    });

    it('should handle empty trees', () => {
      const emptyWidget = createWidget('empty', WidgetType.CONTAINER, []);
      const tree = builder.buildTrees([emptyWidget]).trees[0];
      
      const validation = builder.validateTree(tree);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Tree Cloning', () => {
    it('should create deep copy of widget tree', () => {
      const child = createWidget('child', WidgetType.TEXT, [], { text: 'Hello' });
      const parent = createWidget('parent', WidgetType.CONTAINER, [child], { width: 100 });
      
      const cloned = builder.cloneTree(parent);
      
      // Should be different objects
      expect(cloned).not.toBe(parent);
      expect(cloned.children[0]).not.toBe(child);
      
      // But should have same structure and data
      expect(cloned.id).toBe(parent.id);
      expect(cloned.type).toBe(parent.type);
      expect(cloned.properties.width).toBe(100);
      expect(cloned.children).toHaveLength(1);
      expect(cloned.children[0].id).toBe(child.id);
      expect(cloned.children[0].properties.text).toBe('Hello');
      
      // Modifying clone should not affect original
      cloned.properties.width = 200;
      expect(parent.properties.width).toBe(100);
    });

    it('should clone complex nested structures', () => {
      const deepChild = createWidget('deep', WidgetType.TEXT);
      const middle = createWidget('middle', WidgetType.CONTAINER, [deepChild]);
      const root = createWidget('root', WidgetType.COLUMN, [middle]);
      
      const cloned = builder.cloneTree(root);
      
      expect(cloned.children[0].children[0].id).toBe('deep');
      expect(cloned.children[0].children[0]).not.toBe(deepChild);
    });
  });

  describe('Complex Nested Widget Scenarios', () => {
    it('should handle Flutter Scaffold with AppBar and body', () => {
      const title = createWidget('title', WidgetType.TEXT, [], { text: 'App Title' });
      const appBar = createWidget('appBar', WidgetType.APP_BAR, [title]);
      
      const bodyText = createWidget('bodyText', WidgetType.TEXT, [], { text: 'Body Content' });
      const bodyContainer = createWidget('bodyContainer', WidgetType.CONTAINER, [bodyText]);
      
      const scaffold = createWidget('scaffold', WidgetType.SCAFFOLD, [appBar, bodyContainer]);
      
      const analysis = builder.buildTrees([scaffold]);
      
      expect(analysis.trees).toHaveLength(1);
      expect(analysis.totalNodes).toBe(5);
      expect(analysis.maxDepth).toBe(2);
      
      // Check hierarchy
      const scaffoldHierarchy = analysis.hierarchies.get('scaffold')!;
      expect(scaffoldHierarchy.children).toHaveLength(2);
      
      const titleHierarchy = analysis.hierarchies.get('title')!;
      expect(titleHierarchy.depth).toBe(2);
      expect(titleHierarchy.path).toEqual([WidgetType.SCAFFOLD, WidgetType.APP_BAR, WidgetType.TEXT]);
    });

    it('should handle Row with multiple Expanded children', () => {
      const text1 = createWidget('text1', WidgetType.TEXT);
      const text2 = createWidget('text2', WidgetType.TEXT);
      const text3 = createWidget('text3', WidgetType.TEXT);
      
      const expanded1 = createWidget('expanded1', WidgetType.CONTAINER, [text1], { flex: 1 });
      const expanded2 = createWidget('expanded2', WidgetType.CONTAINER, [text2], { flex: 2 });
      const expanded3 = createWidget('expanded3', WidgetType.CONTAINER, [text3], { flex: 1 });
      
      const row = createWidget('row', WidgetType.ROW, [expanded1, expanded2, expanded3]);
      
      const analysis = builder.buildTrees([row]);
      
      expect(analysis.totalNodes).toBe(7);
      
      // Check that all expanded widgets are siblings
      const expanded1Hierarchy = analysis.hierarchies.get('expanded1')!;
      expect(expanded1Hierarchy.siblings).toHaveLength(2);
      expect(expanded1Hierarchy.index).toBe(0);
      
      const expanded2Hierarchy = analysis.hierarchies.get('expanded2')!;
      expect(expanded2Hierarchy.index).toBe(1);
    });

    it('should handle Stack with Positioned children', () => {
      const background = createWidget('background', WidgetType.CONTAINER);
      const positioned1 = createWidget('positioned1', WidgetType.TEXT, [], { 
        position: { top: 10, left: 10 } 
      });
      const positioned2 = createWidget('positioned2', WidgetType.BUTTON, [], { 
        position: { bottom: 10, right: 10 } 
      });
      
      const stack = createWidget('stack', WidgetType.STACK, [background, positioned1, positioned2]);
      
      const analysis = builder.buildTrees([stack]);
      
      expect(analysis.totalNodes).toBe(4);
      
      // All children should be siblings in the stack
      const backgroundHierarchy = analysis.hierarchies.get('background')!;
      expect(backgroundHierarchy.siblings).toHaveLength(2);
      
      const positioned1Hierarchy = analysis.hierarchies.get('positioned1')!;
      expect(positioned1Hierarchy.siblings).toHaveLength(2);
      expect(positioned1Hierarchy.parent!.id).toBe('stack');
    });

    it('should handle ListView with multiple children', () => {
      const items = Array.from({ length: 5 }, (_, i) => 
        createWidget(`item${i}`, WidgetType.CONTAINER, [
          createWidget(`text${i}`, WidgetType.TEXT, [], { text: `Item ${i}` })
        ])
      );
      
      const listView = createWidget('listView', WidgetType.CUSTOM, items, { 
        customType: 'ListView' 
      });
      
      const analysis = builder.buildTrees([listView]);
      
      expect(analysis.totalNodes).toBe(11); // 1 ListView + 5 items + 5 texts
      expect(analysis.maxDepth).toBe(2);
      
      // Check that all items are siblings
      const item0Hierarchy = analysis.hierarchies.get('item0')!;
      expect(item0Hierarchy.siblings).toHaveLength(4);
      expect(item0Hierarchy.index).toBe(0);
    });
  });
});
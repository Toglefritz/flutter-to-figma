import { Widget, WidgetType } from '../schema/types';

/**
 * Widget tree structure with hierarchy information
 */
export interface WidgetTree {
  root: Widget;
  allWidgets: Widget[];
  depth: number;
  nodeCount: number;
}

/**
 * Widget hierarchy information
 */
export interface WidgetHierarchy {
  widget: Widget;
  parent: Widget | null;
  children: Widget[];
  depth: number;
  path: string[];
  siblings: Widget[];
  index: number;
}

/**
 * Widget tree analysis result
 */
export interface WidgetTreeAnalysis {
  trees: WidgetTree[];
  hierarchies: Map<string, WidgetHierarchy>;
  maxDepth: number;
  totalNodes: number;
  containerWidgets: Widget[];
  leafWidgets: Widget[];
}

/**
 * Widget hierarchy extractor that constructs parent-child relationships
 * and provides tree analysis capabilities
 */
export class WidgetTreeBuilder {
  
  /**
   * Build widget trees from a list of root widgets
   */
  buildTrees(widgets: Widget[]): WidgetTreeAnalysis {
    const trees: WidgetTree[] = [];
    const hierarchies = new Map<string, WidgetHierarchy>();
    let maxDepth = 0;
    let totalNodes = 0;
    const containerWidgets: Widget[] = [];
    const leafWidgets: Widget[] = [];

    // Build tree for each root widget
    for (const widget of widgets) {
      const tree = this.buildSingleTree(widget);
      trees.push(tree);
      
      // Update analysis metrics
      maxDepth = Math.max(maxDepth, tree.depth);
      totalNodes += tree.nodeCount;
      
      // Build hierarchies for all widgets in this tree
      this.buildHierarchies(tree.root, null, [], 0, hierarchies);
      
      // Classify widgets
      this.classifyWidgets(tree.allWidgets, containerWidgets, leafWidgets);
    }

    return {
      trees,
      hierarchies,
      maxDepth,
      totalNodes,
      containerWidgets,
      leafWidgets
    };
  }

  /**
   * Build a single widget tree from a root widget
   */
  private buildSingleTree(root: Widget): WidgetTree {
    const allWidgets: Widget[] = [];
    const depth = this.calculateTreeDepth(root);
    
    // Collect all widgets in the tree
    this.collectAllWidgets(root, allWidgets);
    
    return {
      root,
      allWidgets,
      depth,
      nodeCount: allWidgets.length
    };
  }

  /**
   * Calculate the maximum depth of a widget tree
   */
  private calculateTreeDepth(widget: Widget, currentDepth: number = 0): number {
    if (widget.children.length === 0) {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;
    for (const child of widget.children) {
      const childDepth = this.calculateTreeDepth(child, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth;
  }

  /**
   * Collect all widgets in a tree using depth-first traversal
   */
  private collectAllWidgets(widget: Widget, collection: Widget[]): void {
    collection.push(widget);
    
    for (const child of widget.children) {
      this.collectAllWidgets(child, collection);
    }
  }

  /**
   * Build hierarchy information for all widgets in a tree
   */
  private buildHierarchies(
    widget: Widget,
    parent: Widget | null,
    path: string[],
    depth: number,
    hierarchies: Map<string, WidgetHierarchy>
  ): void {
    const currentPath = [...path, widget.type];
    const siblings = parent ? parent.children.filter(child => child.id !== widget.id) : [];
    const index = parent ? parent.children.findIndex(sibling => sibling.id === widget.id) : -1;

    const hierarchy: WidgetHierarchy = {
      widget,
      parent,
      children: [...widget.children],
      depth,
      path: currentPath,
      siblings,
      index
    };

    hierarchies.set(widget.id, hierarchy);

    // Recursively build hierarchies for children
    for (const child of widget.children) {
      this.buildHierarchies(child, widget, currentPath, depth + 1, hierarchies);
    }
  }

  /**
   * Classify widgets into containers and leaf widgets
   */
  private classifyWidgets(
    allWidgets: Widget[],
    containerWidgets: Widget[],
    leafWidgets: Widget[]
  ): void {
    for (const widget of allWidgets) {
      if (this.isContainerWidget(widget)) {
        containerWidgets.push(widget);
      }
      
      if (this.isLeafWidget(widget)) {
        leafWidgets.push(widget);
      }
    }
  }

  /**
   * Check if a widget is a container widget (can have children)
   */
  private isContainerWidget(widget: Widget): boolean {
    const containerTypes = [
      WidgetType.CONTAINER,
      WidgetType.ROW,
      WidgetType.COLUMN,
      WidgetType.STACK,
      WidgetType.CARD,
      WidgetType.SCAFFOLD,
      WidgetType.BUTTON
    ];

    return containerTypes.includes(widget.type) || widget.children.length > 0;
  }

  /**
   * Check if a widget is a leaf widget (cannot have children)
   */
  private isLeafWidget(widget: Widget): boolean {
    return widget.children.length === 0;
  }

  /**
   * Find widgets by type in a tree
   */
  findWidgetsByType(tree: WidgetTree, type: WidgetType): Widget[] {
    return tree.allWidgets.filter(widget => widget.type === type);
  }

  /**
   * Find widgets by property value
   */
  findWidgetsByProperty(tree: WidgetTree, propertyName: string, value: any): Widget[] {
    return tree.allWidgets.filter(widget => 
      widget.properties[propertyName] === value
    );
  }

  /**
   * Get widget path from root to a specific widget
   */
  getWidgetPath(hierarchies: Map<string, WidgetHierarchy>, widgetId: string): Widget[] {
    const hierarchy = hierarchies.get(widgetId);
    if (!hierarchy) {
      return [];
    }

    const path: Widget[] = [];
    let current: Widget | null = hierarchy.widget;

    while (current) {
      path.unshift(current);
      const currentHierarchy = hierarchies.get(current.id);
      current = currentHierarchy?.parent || null;
    }

    return path;
  }

  /**
   * Get all descendants of a widget
   */
  getDescendants(widget: Widget): Widget[] {
    const descendants: Widget[] = [];
    
    for (const child of widget.children) {
      descendants.push(child);
      descendants.push(...this.getDescendants(child));
    }

    return descendants;
  }

  /**
   * Get all ancestors of a widget
   */
  getAncestors(hierarchies: Map<string, WidgetHierarchy>, widgetId: string): Widget[] {
    const hierarchy = hierarchies.get(widgetId);
    if (!hierarchy) {
      return [];
    }

    const ancestors: Widget[] = [];
    let current = hierarchy.parent;

    while (current) {
      ancestors.push(current);
      const currentHierarchy = hierarchies.get(current.id);
      current = currentHierarchy?.parent || null;
    }

    return ancestors;
  }

  /**
   * Check if a widget is an ancestor of another widget
   */
  isAncestor(
    hierarchies: Map<string, WidgetHierarchy>,
    ancestorId: string,
    descendantId: string
  ): boolean {
    const ancestors = this.getAncestors(hierarchies, descendantId);
    return ancestors.some(ancestor => ancestor.id === ancestorId);
  }

  /**
   * Get siblings of a widget
   */
  getSiblings(hierarchies: Map<string, WidgetHierarchy>, widgetId: string): Widget[] {
    const hierarchy = hierarchies.get(widgetId);
    if (!hierarchy || !hierarchy.parent) {
      return [];
    }

    return hierarchy.parent.children.filter(child => child.id !== widgetId);
  }

  /**
   * Get widget at specific path
   */
  getWidgetAtPath(root: Widget, path: number[]): Widget | null {
    let current = root;

    for (const index of path) {
      if (index >= current.children.length) {
        return null;
      }
      current = current.children[index];
    }

    return current;
  }

  /**
   * Validate widget tree structure
   */
  validateTree(tree: WidgetTree): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visitedIds = new Set<string>();

    // Check for duplicate IDs
    for (const widget of tree.allWidgets) {
      if (visitedIds.has(widget.id)) {
        errors.push(`Duplicate widget ID found: ${widget.id}`);
      }
      visitedIds.add(widget.id);
    }

    // Check for circular references
    if (this.hasCircularReference(tree.root, new Set())) {
      errors.push('Circular reference detected in widget tree');
    }

    // Check for orphaned widgets
    const reachableWidgets = new Set<string>();
    this.markReachableWidgets(tree.root, reachableWidgets);
    
    for (const widget of tree.allWidgets) {
      if (!reachableWidgets.has(widget.id)) {
        errors.push(`Orphaned widget found: ${widget.id} (${widget.type})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for circular references in widget tree
   */
  private hasCircularReference(widget: Widget, visited: Set<string>): boolean {
    if (visited.has(widget.id)) {
      return true;
    }

    visited.add(widget.id);

    for (const child of widget.children) {
      if (this.hasCircularReference(child, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Mark all reachable widgets from root
   */
  private markReachableWidgets(widget: Widget, reachable: Set<string>): void {
    reachable.add(widget.id);
    
    for (const child of widget.children) {
      this.markReachableWidgets(child, reachable);
    }
  }

  /**
   * Clone a widget tree (deep copy)
   */
  cloneTree(widget: Widget): Widget {
    return {
      ...widget,
      properties: { ...widget.properties },
      styling: {
        ...widget.styling,
        colors: [...widget.styling.colors],
        typography: widget.styling.typography ? { ...widget.styling.typography } : undefined
      },
      layout: widget.layout ? { ...widget.layout } : undefined,
      position: widget.position ? { ...widget.position } : undefined,
      children: widget.children.map(child => this.cloneTree(child))
    };
  }
}
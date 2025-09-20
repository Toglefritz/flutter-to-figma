import { Widget, WidgetType, ReusableWidget, WidgetVariant, WidgetProperties, StyleInfo } from '../schema/types';

/**
 * Component pattern for detecting reusable widgets
 */
export interface ComponentPattern {
  id: string;
  type: WidgetType;
  structureHash: string;
  instances: Widget[];
  variants: ComponentVariant[];
  confidence: number;
  name: string;
}

/**
 * Component variant with differences from base pattern
 */
export interface ComponentVariant {
  id: string;
  name: string;
  widget: Widget;
  propertyDifferences: PropertyDifference[];
  stylingDifferences: StylingDifference[];
  usageCount: number;
}

/**
 * Property difference between variants
 */
export interface PropertyDifference {
  path: string;
  baseValue: any;
  variantValue: any;
  type: 'property' | 'styling' | 'children';
}

/**
 * Styling difference between variants
 */
export interface StylingDifference {
  property: string;
  baseValue: any;
  variantValue: any;
  category: 'color' | 'typography' | 'spacing' | 'border' | 'shadow';
}

/**
 * Component detection result
 */
export interface ComponentDetectionResult {
  patterns: ComponentPattern[];
  reusableWidgets: ReusableWidget[];
  totalInstances: number;
  uniquePatterns: number;
  componentCoverage: number; // Percentage of widgets that could be componentized
}

/**
 * Component detection configuration
 */
export interface ComponentDetectionConfig {
  minInstances: number;          // Minimum instances to consider as component
  minConfidence: number;         // Minimum confidence score (0-1)
  maxVariants: number;           // Maximum variants per component
  ignoreProperties: string[];    // Properties to ignore when comparing
  structuralOnly: boolean;       // Only consider structural similarity
  includeCustomWidgets: boolean; // Include custom widgets in detection
}

/**
 * Default configuration for component detection
 */
const DEFAULT_CONFIG: ComponentDetectionConfig = {
  minInstances: 2,
  minConfidence: 0.7,
  maxVariants: 10,
  ignoreProperties: ['key', 'id'],
  structuralOnly: false,
  includeCustomWidgets: true
};

/**
 * Component detector that identifies repeated widget patterns
 * and creates reusable component candidates
 */
export class ComponentDetector {
  private config: ComponentDetectionConfig;

  constructor(config: Partial<ComponentDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect reusable components from a list of widgets
   */
  detectComponents(widgets: Widget[]): ComponentDetectionResult {
    // Collect all widgets including nested ones
    const allWidgets = this.collectAllWidgets(widgets);
    
    // Group widgets by structural similarity
    const groups = this.groupBySimilarity(allWidgets);
    
    // Analyze each group for component potential
    const patterns: ComponentPattern[] = [];
    
    for (const group of groups) {
      if (group.length >= this.config.minInstances) {
        const pattern = this.analyzeGroup(group);
        if (pattern && pattern.confidence >= this.config.minConfidence) {
          patterns.push(pattern);
        }
      }
    }

    // Convert patterns to reusable widgets
    const reusableWidgets = this.createReusableWidgets(patterns);
    
    // Calculate metrics
    const totalInstances = patterns.reduce((sum, p) => sum + p.instances.length, 0);
    const componentCoverage = allWidgets.length > 0 ? (totalInstances / allWidgets.length) * 100 : 0;

    return {
      patterns,
      reusableWidgets,
      totalInstances,
      uniquePatterns: patterns.length,
      componentCoverage
    };
  }

  /**
   * Collect all widgets from a tree structure
   */
  private collectAllWidgets(widgets: Widget[]): Widget[] {
    const allWidgets: Widget[] = [];
    
    const traverse = (widget: Widget) => {
      allWidgets.push(widget);
      widget.children.forEach(traverse);
    };

    widgets.forEach(traverse);
    return allWidgets;
  }

  /**
   * Group widgets by structural similarity
   */
  private groupBySimilarity(widgets: Widget[]): Widget[][] {
    const groups = new Map<string, Widget[]>();

    for (const widget of widgets) {
      // Skip widgets that shouldn't be componentized
      if (!this.shouldConsiderForComponent(widget)) {
        continue;
      }

      const hash = this.calculateStructureHash(widget);
      
      if (!groups.has(hash)) {
        groups.set(hash, []);
      }
      
      groups.get(hash)!.push(widget);
    }

    return Array.from(groups.values());
  }

  /**
   * Check if widget should be considered for componentization
   */
  private shouldConsiderForComponent(widget: Widget): boolean {
    // Skip custom widgets if not configured to include them
    if (widget.type === WidgetType.CUSTOM && !this.config.includeCustomWidgets) {
      return false;
    }

    // Skip certain widget types that don't make good components
    const skipTypes = [WidgetType.SCAFFOLD, WidgetType.APP_BAR];
    if (skipTypes.includes(widget.type)) {
      return false;
    }

    // Skip leaf widgets that are too simple (only Text and Image with minimal properties)
    if (this.isSimpleLeafWidget(widget)) {
      return false;
    }

    return true;
  }

  /**
   * Check if widget is a simple leaf widget
   */
  private isSimpleLeafWidget(widget: Widget): boolean {
    return (
      widget.children.length === 0 &&
      (widget.type === WidgetType.TEXT || widget.type === WidgetType.IMAGE) &&
      Object.keys(widget.properties).length <= 1 // Only skip if very minimal properties
    );
  }

  /**
   * Calculate structural hash for a widget
   */
  private calculateStructureHash(widget: Widget): string {
    const structure = this.getWidgetStructure(widget);
    return this.hashObject(structure);
  }

  /**
   * Get widget structure for comparison
   */
  private getWidgetStructure(widget: Widget): any {
    const structure: any = {
      type: widget.type,
      childCount: widget.children.length,
      children: widget.children.map(child => this.getWidgetStructure(child))
    };

    // Include layout information if present
    if (widget.layout) {
      structure.layout = {
        type: widget.layout.type,
        direction: widget.layout.direction
      };
    }

    // Include certain properties that affect structure
    const structuralProps = ['customType'];
    for (const prop of structuralProps) {
      if (widget.properties[prop] !== undefined) {
        structure[prop] = widget.properties[prop];
      }
    }

    return structure;
  }

  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Analyze a group of similar widgets to create a component pattern
   */
  private analyzeGroup(widgets: Widget[]): ComponentPattern | null {
    if (widgets.length < this.config.minInstances) {
      return null;
    }

    const baseWidget = widgets[0];
    const structureHash = this.calculateStructureHash(baseWidget);
    
    // Analyze variants
    const variants = this.analyzeVariants(widgets);
    
    // Calculate confidence based on similarity and usage
    const confidence = this.calculateConfidence(widgets, variants);
    
    // Generate component name
    const name = this.generateComponentName(baseWidget, variants);

    return {
      id: `component_${structureHash}`,
      type: baseWidget.type,
      structureHash,
      instances: widgets,
      variants,
      confidence,
      name
    };
  }

  /**
   * Analyze variants within a group of similar widgets
   */
  private analyzeVariants(widgets: Widget[]): ComponentVariant[] {
    const baseWidget = widgets[0];
    const variants: ComponentVariant[] = [];
    const variantMap = new Map<string, ComponentVariant>();

    for (const widget of widgets) {
      const differences = this.findDifferences(baseWidget, widget);
      const variantHash = this.hashDifferences(differences);
      
      if (variantMap.has(variantHash)) {
        // Increment usage count for existing variant
        variantMap.get(variantHash)!.usageCount++;
      } else {
        // Create new variant
        const variant: ComponentVariant = {
          id: `variant_${variantHash}`,
          name: this.generateVariantName(differences),
          widget,
          propertyDifferences: differences.filter(d => d.type === 'property'),
          stylingDifferences: this.extractStylingDifferences(differences),
          usageCount: 1
        };
        
        variantMap.set(variantHash, variant);
      }
    }

    variants.push(...variantMap.values());
    
    // Limit number of variants
    if (variants.length > this.config.maxVariants) {
      // Sort by usage count and take top variants
      variants.sort((a, b) => b.usageCount - a.usageCount);
      return variants.slice(0, this.config.maxVariants);
    }

    return variants;
  }

  /**
   * Find differences between two widgets
   */
  private findDifferences(base: Widget, variant: Widget): PropertyDifference[] {
    const differences: PropertyDifference[] = [];
    
    // Compare properties
    this.compareProperties(base.properties, variant.properties, '', differences);
    
    // Compare styling
    this.compareStyling(base.styling, variant.styling, differences);
    
    // Compare children (structural differences)
    if (base.children.length !== variant.children.length) {
      differences.push({
        path: 'children.length',
        baseValue: base.children.length,
        variantValue: variant.children.length,
        type: 'children'
      });
    }

    return differences;
  }

  /**
   * Compare properties recursively
   */
  private compareProperties(
    baseProps: WidgetProperties,
    variantProps: WidgetProperties,
    path: string,
    differences: PropertyDifference[]
  ): void {
    const allKeys = new Set([...Object.keys(baseProps), ...Object.keys(variantProps)]);
    
    for (const key of allKeys) {
      // Skip ignored properties
      if (this.config.ignoreProperties.includes(key)) {
        continue;
      }

      const currentPath = path ? `${path}.${key}` : key;
      const baseValue = baseProps[key];
      const variantValue = variantProps[key];

      if (baseValue !== variantValue) {
        differences.push({
          path: currentPath,
          baseValue,
          variantValue,
          type: 'property'
        });
      }
    }
  }

  /**
   * Compare styling information
   */
  private compareStyling(
    baseStyling: StyleInfo,
    variantStyling: StyleInfo,
    differences: PropertyDifference[]
  ): void {
    // Compare colors
    if (baseStyling.colors.length !== variantStyling.colors.length) {
      differences.push({
        path: 'styling.colors',
        baseValue: baseStyling.colors,
        variantValue: variantStyling.colors,
        type: 'styling'
      });
    }

    // Compare typography
    if (JSON.stringify(baseStyling.typography) !== JSON.stringify(variantStyling.typography)) {
      differences.push({
        path: 'styling.typography',
        baseValue: baseStyling.typography,
        variantValue: variantStyling.typography,
        type: 'styling'
      });
    }
  }

  /**
   * Extract styling differences from property differences
   */
  private extractStylingDifferences(differences: PropertyDifference[]): StylingDifference[] {
    return differences
      .filter(d => d.type === 'styling')
      .map(d => ({
        property: d.path,
        baseValue: d.baseValue,
        variantValue: d.variantValue,
        category: this.categorizeStylingProperty(d.path)
      }));
  }

  /**
   * Categorize styling property
   */
  private categorizeStylingProperty(path: string): 'color' | 'typography' | 'spacing' | 'border' | 'shadow' {
    if (path.includes('color')) return 'color';
    if (path.includes('typography') || path.includes('font') || path.includes('text')) return 'typography';
    if (path.includes('padding') || path.includes('margin') || path.includes('spacing')) return 'spacing';
    if (path.includes('border')) return 'border';
    if (path.includes('shadow')) return 'shadow';
    return 'color'; // Default
  }

  /**
   * Hash differences to create variant signature
   */
  private hashDifferences(differences: PropertyDifference[]): string {
    const signature = differences
      .map(d => `${d.path}:${d.variantValue}`)
      .sort()
      .join('|');
    
    return this.hashObject(signature);
  }

  /**
   * Calculate confidence score for a component pattern
   */
  private calculateConfidence(widgets: Widget[], variants: ComponentVariant[]): number {
    let score = 0;

    // Base score from instance count (more generous)
    const instanceScore = Math.min(widgets.length / 5, 0.5); // Max 0.5 for instances
    score += instanceScore;

    // Structural complexity score
    const complexityScore = this.calculateComplexityScore(widgets[0]) * 0.3; // Max 0.3
    score += complexityScore;

    // Variant consistency score
    const variantScore = this.calculateVariantScore(variants) * 0.2; // Max 0.2
    score += variantScore;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate complexity score for a widget
   */
  private calculateComplexityScore(widget: Widget): number {
    let score = 0.2; // Base score for any widget

    // Children count
    score += Math.min(widget.children.length / 3, 0.3);

    // Property count
    score += Math.min(Object.keys(widget.properties).length / 5, 0.3);

    // Styling complexity
    if (widget.styling.colors.length > 0) score += 0.1;
    if (widget.styling.typography) score += 0.1;
    if (widget.layout) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate variant score based on variant distribution
   */
  private calculateVariantScore(variants: ComponentVariant[]): number {
    if (variants.length === 0) return 0;
    if (variants.length === 1) return 1.0; // Perfect - no variants needed

    // Prefer fewer variants with higher usage
    const totalUsage = variants.reduce((sum, v) => sum + v.usageCount, 0);
    const averageUsage = totalUsage / variants.length;
    
    // Score based on variant count (fewer is better) and usage distribution
    const variantCountScore = Math.max(0, 1 - (variants.length - 1) / this.config.maxVariants);
    const usageScore = averageUsage / Math.max(...variants.map(v => v.usageCount));
    
    return (variantCountScore + usageScore) / 2;
  }

  /**
   * Generate component name based on widget type and variants
   */
  private generateComponentName(baseWidget: Widget, variants: ComponentVariant[]): string {
    let baseName = this.getWidgetBaseName(baseWidget);
    
    // Add descriptive suffix based on common properties
    const commonProps = this.findCommonProperties(variants);
    if (commonProps.length > 0) {
      const descriptor = commonProps[0];
      baseName += this.capitalizeFirst(descriptor);
    }

    return baseName;
  }

  /**
   * Get base name for widget type
   */
  private getWidgetBaseName(widget: Widget): string {
    switch (widget.type) {
      case WidgetType.BUTTON:
        return 'Button';
      case WidgetType.CARD:
        return 'Card';
      case WidgetType.CONTAINER:
        return 'Container';
      case WidgetType.ROW:
        return 'Row';
      case WidgetType.COLUMN:
        return 'Column';
      case WidgetType.CUSTOM:
        return widget.properties.customType || 'Component';
      default:
        return 'Component';
    }
  }

  /**
   * Find common properties across variants
   */
  private findCommonProperties(variants: ComponentVariant[]): string[] {
    const commonProps: string[] = [];
    
    // Look for properties that vary across variants
    const varyingProps = new Set<string>();
    
    for (const variant of variants) {
      for (const diff of variant.propertyDifferences) {
        varyingProps.add(diff.path);
      }
    }

    // Convert property paths to descriptive names
    for (const prop of varyingProps) {
      if (prop.includes('color')) commonProps.push('color');
      if (prop.includes('size')) commonProps.push('size');
      if (prop.includes('text')) commonProps.push('text');
    }

    return commonProps;
  }

  /**
   * Generate variant name based on differences
   */
  private generateVariantName(differences: PropertyDifference[]): string {
    if (differences.length === 0) {
      return 'Default';
    }

    // Use the most significant difference for naming
    const significantDiff = differences[0];
    
    if (significantDiff.path.includes('color')) {
      return `${significantDiff.variantValue}Color`;
    }
    
    if (significantDiff.path.includes('size')) {
      return `${significantDiff.variantValue}Size`;
    }
    
    if (significantDiff.path.includes('text')) {
      return 'TextVariant';
    }

    return `Variant${differences.length}`;
  }

  /**
   * Convert component patterns to reusable widgets
   */
  private createReusableWidgets(patterns: ComponentPattern[]): ReusableWidget[] {
    return patterns.map(pattern => {
      const baseWidget = pattern.instances[0];
      
      // Create widget variants
      const widgetVariants: WidgetVariant[] = pattern.variants.map(variant => ({
        name: variant.name,
        properties: variant.widget.properties,
        styling: variant.widget.styling
      }));

      const reusableWidget: ReusableWidget = {
        ...baseWidget,
        name: pattern.name,
        variants: widgetVariants,
        usageCount: pattern.instances.length
      };

      return reusableWidget;
    });
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ComponentDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ComponentDetectionConfig {
    return { ...this.config };
  }
}
import { ReusableWidget, WidgetVariant, Widget, WidgetType } from '../schema/types';
import { 
  FigmaComponentSpec, 
  ComponentVariant, 
  ComponentProperty, 
  FigmaNodeSpec 
} from './figma-node-spec';
import { NodeFactory } from './node-factory';

/**
 * VariantManager handles advanced component variant creation and management
 */
export class VariantManager {
  private nodeFactory: NodeFactory;

  constructor(nodeFactory?: NodeFactory) {
    this.nodeFactory = nodeFactory || new NodeFactory();
  }

  /**
   * Create component variants with advanced property-based switching
   */
  createAdvancedVariants(reusableWidget: ReusableWidget): ComponentVariant[] {
    const variants: ComponentVariant[] = [];
    
    // Analyze widget variants to create a property matrix
    const propertyMatrix = this.analyzeVariantProperties(reusableWidget);
    
    // Generate all possible variant combinations
    const variantCombinations = this.generateVariantCombinations(propertyMatrix);
    
    // If no meaningful combinations exist, create a default variant
    if (variantCombinations.length === 0 || 
        (variantCombinations.length === 1 && Object.keys(variantCombinations[0]).length === 0)) {
      variants.push(this.createDefaultVariant(reusableWidget));
    } else {
      // Create variants for each combination
      variantCombinations.forEach((combination, index) => {
        const variant = this.createVariantFromCombination(
          reusableWidget, 
          combination, 
          index
        );
        variants.push(variant);
      });
    }

    return variants;
  }

  /**
   * Create variant naming system based on properties
   */
  createVariantNamingSystem(variants: ComponentVariant[]): ComponentVariant[] {
    return variants.map(variant => ({
      ...variant,
      name: this.generateVariantName(variant.properties)
    }));
  }

  /**
   * Organize variants into logical groups
   */
  organizeVariants(variants: ComponentVariant[]): VariantGroup[] {
    const groups: VariantGroup[] = [];
    
    // Group by primary property (usually the most significant one)
    const primaryProperty = this.identifyPrimaryProperty(variants);
    
    if (primaryProperty) {
      const groupMap = new Map<string, ComponentVariant[]>();
      
      variants.forEach(variant => {
        const groupKey = variant.properties[primaryProperty] as string || 'default';
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, []);
        }
        groupMap.get(groupKey)!.push(variant);
      });

      groupMap.forEach((groupVariants, groupName) => {
        groups.push({
          name: this.capitalizeFirst(groupName),
          property: primaryProperty,
          variants: groupVariants
        });
      });
    } else {
      // Single group if no clear primary property
      groups.push({
        name: 'Default',
        property: 'variant',
        variants: variants
      });
    }

    return groups;
  }

  /**
   * Create component properties with variant switching logic
   */
  createVariantProperties(reusableWidget: ReusableWidget): ComponentProperty[] {
    const properties: ComponentProperty[] = [];
    const propertyMatrix = this.analyzeVariantProperties(reusableWidget);

    // Create properties for each variant dimension
    Object.entries(propertyMatrix).forEach(([propertyName, values]) => {
      const uniqueValues = Array.from(values);
      
      if (uniqueValues.length > 1) {
        if (uniqueValues.every(v => typeof v === 'boolean')) {
          // Boolean toggle property
          properties.push({
            name: this.formatPropertyName(propertyName),
            type: 'BOOLEAN',
            defaultValue: false
          });
        } else if (uniqueValues.every(v => typeof v === 'string')) {
          // Variant selection property
          properties.push({
            name: this.formatPropertyName(propertyName),
            type: 'VARIANT',
            defaultValue: uniqueValues[0] as string,
            variantOptions: uniqueValues as string[]
          });
        } else {
          // Text input property for mixed types
          properties.push({
            name: this.formatPropertyName(propertyName),
            type: 'TEXT',
            defaultValue: String(uniqueValues[0])
          });
        }
      }
    });

    // Add semantic properties based on widget type
    this.addSemanticProperties(properties, reusableWidget);

    // Add content-based properties
    this.addContentProperties(properties, reusableWidget);

    return properties;
  }

  /**
   * Handle property-based variant switching
   */
  handleVariantSwitching(
    componentSpec: FigmaComponentSpec, 
    propertyChanges: Record<string, any>
  ): ComponentVariant | null {
    if (!componentSpec.variants) return null;

    // Find the variant that matches the property changes
    const matchingVariant = componentSpec.variants.find(variant => {
      return Object.entries(propertyChanges).every(([key, value]) => {
        return variant.properties[key] === value;
      });
    });

    return matchingVariant || null;
  }

  /**
   * Analyze variant properties to create a property matrix
   */
  private analyzeVariantProperties(reusableWidget: ReusableWidget): Record<string, Set<any>> {
    const propertyMatrix: Record<string, Set<any>> = {};

    // Analyze base widget properties
    Object.entries(reusableWidget.properties).forEach(([key, value]) => {
      if (!propertyMatrix[key]) {
        propertyMatrix[key] = new Set();
      }
      propertyMatrix[key].add(value);
    });

    // Analyze variant properties
    reusableWidget.variants.forEach(variant => {
      Object.entries(variant.properties).forEach(([key, value]) => {
        if (!propertyMatrix[key]) {
          propertyMatrix[key] = new Set();
        }
        propertyMatrix[key].add(value);
      });
    });

    // Filter out properties with only one value (not variant-worthy)
    Object.keys(propertyMatrix).forEach(key => {
      if (propertyMatrix[key].size <= 1) {
        delete propertyMatrix[key];
      }
    });

    return propertyMatrix;
  }

  /**
   * Generate all possible variant combinations from property matrix
   */
  private generateVariantCombinations(
    propertyMatrix: Record<string, Set<any>>
  ): Record<string, any>[] {
    const properties = Object.keys(propertyMatrix);
    
    if (properties.length === 0) {
      return [{}];
    }

    const combinations: Record<string, any>[] = [];
    
    // Generate cartesian product of all property values
    const generateCombinations = (
      index: number, 
      currentCombination: Record<string, any>
    ) => {
      if (index >= properties.length) {
        combinations.push({ ...currentCombination });
        return;
      }

      const property = properties[index];
      const values = Array.from(propertyMatrix[property]);
      
      values.forEach(value => {
        currentCombination[property] = value;
        generateCombinations(index + 1, currentCombination);
      });
    };

    generateCombinations(0, {});
    
    // Limit combinations to prevent explosion (max 16 variants)
    return combinations.slice(0, 16);
  }

  /**
   * Create a variant from a property combination
   */
  private createVariantFromCombination(
    reusableWidget: ReusableWidget,
    combination: Record<string, any>,
    index: number
  ): ComponentVariant {
    // Find matching widget variant or create synthetic one
    const matchingVariant = reusableWidget.variants.find(variant => {
      return Object.entries(combination).every(([key, value]) => {
        return variant.properties[key] === value;
      });
    });

    if (matchingVariant) {
      return {
        name: matchingVariant.name || this.generateVariantName(combination),
        properties: combination,
        nodeSpec: this.nodeFactory.createNode({
          ...reusableWidget,
          properties: { ...reusableWidget.properties, ...matchingVariant.properties },
          styling: { ...reusableWidget.styling, ...matchingVariant.styling }
        } as Widget)
      };
    }

    // Create synthetic variant
    return {
      name: this.generateVariantName(combination),
      properties: combination,
      nodeSpec: this.nodeFactory.createNode({
        ...reusableWidget,
        properties: { ...reusableWidget.properties, ...combination }
      } as Widget)
    };
  }

  /**
   * Create default variant
   */
  private createDefaultVariant(reusableWidget: ReusableWidget): ComponentVariant {
    return {
      name: 'Default',
      properties: { variant: 'default' },
      nodeSpec: this.nodeFactory.createNode(reusableWidget)
    };
  }

  /**
   * Generate variant name from properties
   */
  private generateVariantName(properties: Record<string, any>): string {
    const significantProps = Object.entries(properties)
      .filter(([key, value]) => key !== 'variant' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));

    if (significantProps.length === 0) {
      return 'Default';
    }

    // Create name from property values
    const nameParts = significantProps.map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? this.capitalizeFirst(key) : `No${this.capitalizeFirst(key)}`;
      }
      return this.capitalizeFirst(String(value));
    });

    return nameParts.join(' ');
  }

  /**
   * Identify the primary property for grouping
   */
  private identifyPrimaryProperty(variants: ComponentVariant[]): string | null {
    if (variants.length === 0) return null;

    // Count property usage frequency
    const propertyFrequency: Record<string, number> = {};
    
    variants.forEach(variant => {
      Object.keys(variant.properties).forEach(prop => {
        if (prop !== 'variant') {
          propertyFrequency[prop] = (propertyFrequency[prop] || 0) + 1;
        }
      });
    });

    // Find most frequent property
    let maxFrequency = 0;
    let primaryProperty: string | null = null;
    
    Object.entries(propertyFrequency).forEach(([prop, frequency]) => {
      if (frequency > maxFrequency) {
        maxFrequency = frequency;
        primaryProperty = prop;
      }
    });

    return primaryProperty;
  }

  /**
   * Format property name for display
   */
  private formatPropertyName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Add semantic properties based on widget type
   */
  private addSemanticProperties(
    properties: ComponentProperty[], 
    reusableWidget: ReusableWidget
  ): void {
    // Add common semantic properties based on widget type
    switch (reusableWidget.type) {
      case WidgetType.BUTTON:
        this.addButtonProperties(properties, reusableWidget);
        break;
      case WidgetType.CARD:
        this.addCardProperties(properties, reusableWidget);
        break;
      case WidgetType.TEXT:
        this.addTextProperties(properties, reusableWidget);
        break;
    }
  }

  /**
   * Add button-specific properties
   */
  private addButtonProperties(
    properties: ComponentProperty[], 
    reusableWidget: ReusableWidget
  ): void {
    // Add state property if not already present
    if (!properties.find(p => p.name === 'State')) {
      properties.push({
        name: 'State',
        type: 'VARIANT',
        defaultValue: 'default',
        variantOptions: ['default', 'hover', 'pressed', 'disabled']
      });
    }

    // Add size property if not already present
    if (!properties.find(p => p.name === 'Size')) {
      properties.push({
        name: 'Size',
        type: 'VARIANT',
        defaultValue: 'medium',
        variantOptions: ['small', 'medium', 'large']
      });
    }
  }

  /**
   * Add card-specific properties
   */
  private addCardProperties(
    properties: ComponentProperty[], 
    reusableWidget: ReusableWidget
  ): void {
    // Add elevation property
    if (!properties.find(p => p.name === 'Elevation')) {
      properties.push({
        name: 'Elevation',
        type: 'VARIANT',
        defaultValue: 'low',
        variantOptions: ['none', 'low', 'medium', 'high']
      });
    }
  }

  /**
   * Add text-specific properties
   */
  private addTextProperties(
    properties: ComponentProperty[], 
    reusableWidget: ReusableWidget
  ): void {
    // Add emphasis property
    if (!properties.find(p => p.name === 'Emphasis')) {
      properties.push({
        name: 'Emphasis',
        type: 'VARIANT',
        defaultValue: 'normal',
        variantOptions: ['normal', 'bold', 'italic']
      });
    }
  }

  /**
   * Add content-based properties (text, icons, etc.)
   */
  private addContentProperties(
    properties: ComponentProperty[], 
    reusableWidget: ReusableWidget
  ): void {
    // Add text property if widget has text content
    if (this.hasTextContent(reusableWidget)) {
      properties.push({
        name: 'Text',
        type: 'TEXT',
        defaultValue: this.extractDefaultText(reusableWidget)
      });
    }

    // Add icon property if widget has icon content
    if (this.hasIconContent(reusableWidget)) {
      properties.push({
        name: 'Icon',
        type: 'INSTANCE_SWAP',
        defaultValue: 'icon-placeholder'
      });
    }
  }

  /**
   * Check if widget has text content
   */
  private hasTextContent(widget: Widget): boolean {
    // Check direct text properties
    if (widget.properties.data || widget.properties.text) {
      return true;
    }

    // Check if widget type is text-related
    if (widget.type === WidgetType.TEXT) {
      return true;
    }

    // Check children for text content recursively
    return widget.children.some(child => this.hasTextContent(child));
  }

  /**
   * Check if widget has icon content
   */
  private hasIconContent(widget: Widget): boolean {
    // Check for icon properties
    if (widget.properties.icon || widget.properties.iconData) {
      return true;
    }

    // Check if widget type is icon-related
    if (widget.type.toString().includes('Icon')) {
      return true;
    }

    return false;
  }

  /**
   * Extract text content from widget
   */
  private extractTextFromWidget(widget: Widget): string | null {
    // Direct text properties
    if (widget.properties.data) {
      return widget.properties.data.toString();
    }
    if (widget.properties.text) {
      return widget.properties.text.toString();
    }

    // Extract from text children recursively
    for (const child of widget.children) {
      const childText = this.extractTextFromWidget(child);
      if (childText) return childText;
    }

    return null;
  }

  /**
   * Extract default text content for component property
   */
  private extractDefaultText(widget: Widget): string {
    const textContent = this.extractTextFromWidget(widget);
    return textContent || 'Text';
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Variant group for organizing related variants
 */
export interface VariantGroup {
  name: string;
  property: string;
  variants: ComponentVariant[];
}
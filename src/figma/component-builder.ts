import { ReusableWidget, Widget, WidgetVariant, WidgetType } from '../schema/types';
import { 
  FigmaNodeSpec, 
  FigmaComponentSpec, 
  ComponentVariant, 
  ComponentProperty, 
  FigmaNodeType 
} from './figma-node-spec';
import { NodeFactory } from './node-factory';
import { VariantManager } from './variant-manager';

/**
 * ComponentBuilder converts reusable Flutter widgets into Figma Components
 * with proper naming, variants, and instances
 */
export class ComponentBuilder {
  private nodeFactory: NodeFactory;
  private variantManager: VariantManager;
  private componentCounter = 0;

  constructor(nodeFactory?: NodeFactory) {
    this.nodeFactory = nodeFactory || new NodeFactory();
    this.variantManager = new VariantManager(this.nodeFactory);
  }

  /**
   * Create a Figma Component from a reusable Flutter widget
   */
  createComponent(reusableWidget: ReusableWidget): FigmaComponentSpec {
    const componentName = this.generateComponentName(reusableWidget);
    
    const componentSpec: FigmaComponentSpec = {
      name: componentName,
      description: this.generateComponentDescription(reusableWidget),
      variants: this.createComponentVariants(reusableWidget),
      properties: this.variantManager.createVariantProperties(reusableWidget)
    };

    return componentSpec;
  }

  /**
   * Create advanced component with enhanced variant support
   */
  createAdvancedComponent(reusableWidget: ReusableWidget): FigmaComponentSpec {
    const componentName = this.generateComponentName(reusableWidget);
    const variants = this.variantManager.createAdvancedVariants(reusableWidget);
    const organizedVariants = this.variantManager.createVariantNamingSystem(variants);
    
    const componentSpec: FigmaComponentSpec = {
      name: componentName,
      description: this.generateComponentDescription(reusableWidget),
      variants: organizedVariants,
      properties: this.variantManager.createVariantProperties(reusableWidget)
    };

    return componentSpec;
  }

  /**
   * Create a Figma Component instance from a widget usage
   */
  createComponentInstance(widget: Widget, componentName: string): FigmaNodeSpec {
    const instanceSpec: FigmaNodeSpec = {
      type: FigmaNodeType.INSTANCE,
      name: this.generateInstanceName(widget, componentName),
      properties: {
        componentId: this.generateComponentId(componentName),
        overrides: this.extractInstanceOverrides(widget),
        ...this.extractInstanceProperties(widget)
      }
    };

    return instanceSpec;
  }

  /**
   * Create component variants from widget variations
   */
  private createComponentVariants(reusableWidget: ReusableWidget): ComponentVariant[] {
    const variants: ComponentVariant[] = [];

    // Create default variant from the base widget
    const defaultVariant: ComponentVariant = {
      name: 'Default',
      properties: this.extractVariantProperties(reusableWidget, 'default'),
      nodeSpec: this.nodeFactory.createNode(reusableWidget)
    };
    variants.push(defaultVariant);

    // Create variants from widget variations
    reusableWidget.variants.forEach((variant, index) => {
      const variantSpec: ComponentVariant = {
        name: variant.name || `Variant ${index + 1}`,
        properties: this.extractVariantProperties(reusableWidget, variant.name, variant),
        nodeSpec: this.createVariantNodeSpec(reusableWidget, variant)
      };
      variants.push(variantSpec);
    });

    return variants;
  }

  /**
   * Create a node spec for a specific variant
   */
  private createVariantNodeSpec(baseWidget: ReusableWidget, variant: WidgetVariant): FigmaNodeSpec {
    // Create a modified widget with variant properties and styling
    const variantWidget: Widget = {
      ...baseWidget,
      properties: { ...baseWidget.properties, ...variant.properties },
      styling: { ...baseWidget.styling, ...variant.styling }
    };

    return this.nodeFactory.createNode(variantWidget);
  }

  /**
   * Extract component properties for variant switching
   */
  private extractComponentProperties(reusableWidget: ReusableWidget): ComponentProperty[] {
    const properties: ComponentProperty[] = [];

    // Analyze variants to determine component properties
    const propertyMap = new Map<string, Set<string | boolean>>();

    reusableWidget.variants.forEach(variant => {
      Object.entries(variant.properties).forEach(([key, value]) => {
        if (!propertyMap.has(key)) {
          propertyMap.set(key, new Set());
        }
        propertyMap.get(key)!.add(value);
      });
    });

    // Create component properties from variant analysis
    propertyMap.forEach((values, propertyName) => {
      const valueArray = Array.from(values);
      
      if (valueArray.every(v => typeof v === 'boolean')) {
        // Boolean property
        properties.push({
          name: propertyName,
          type: 'BOOLEAN',
          defaultValue: false
        });
      } else if (valueArray.every(v => typeof v === 'string')) {
        // Variant property with string options
        properties.push({
          name: propertyName,
          type: 'VARIANT',
          defaultValue: valueArray[0] as string,
          variantOptions: valueArray as string[]
        });
      } else {
        // Text property for mixed types
        properties.push({
          name: propertyName,
          type: 'TEXT',
          defaultValue: String(valueArray[0])
        });
      }
    });

    // Add common component properties
    if (this.hasTextContent(reusableWidget)) {
      properties.push({
        name: 'Text',
        type: 'TEXT',
        defaultValue: this.extractDefaultText(reusableWidget)
      });
    }

    if (this.hasIconContent(reusableWidget)) {
      properties.push({
        name: 'Icon',
        type: 'INSTANCE_SWAP',
        defaultValue: 'icon-placeholder'
      });
    }

    return properties;
  }

  /**
   * Extract variant properties for a specific variant
   */
  private extractVariantProperties(
    reusableWidget: ReusableWidget, 
    variantName: string, 
    variant?: WidgetVariant
  ): Record<string, string | boolean> {
    const properties: Record<string, string | boolean> = {};

    if (variant) {
      // Extract properties that differ from the base widget
      Object.entries(variant.properties).forEach(([key, value]) => {
        if (reusableWidget.properties[key] !== value) {
          properties[key] = value;
        }
      });
    }

    // Add variant identifier
    properties['Variant'] = variantName;

    return properties;
  }

  /**
   * Extract instance overrides for component instances
   */
  private extractInstanceOverrides(widget: Widget): Record<string, any> {
    const overrides: Record<string, any> = {};

    // Extract text overrides
    if (widget.type.toString().includes('Text') || this.hasTextContent(widget)) {
      const textContent = this.extractTextFromWidget(widget);
      if (textContent) {
        overrides['Text'] = textContent;
      }
    }

    // Extract color overrides from styling
    widget.styling.colors.forEach((colorInfo, index) => {
      if (!colorInfo.isThemeReference) {
        overrides[`Color_${index}`] = colorInfo.value;
      }
    });

    // Extract size overrides
    if (widget.properties.width !== undefined) {
      overrides['Width'] = widget.properties.width;
    }
    if (widget.properties.height !== undefined) {
      overrides['Height'] = widget.properties.height;
    }

    return overrides;
  }

  /**
   * Extract instance-specific properties
   */
  private extractInstanceProperties(widget: Widget): Record<string, any> {
    const properties: Record<string, any> = {};

    // Basic positioning and sizing
    if (widget.properties.width !== undefined) {
      properties.width = widget.properties.width;
    }
    if (widget.properties.height !== undefined) {
      properties.height = widget.properties.height;
    }

    // Layout properties for instances in Auto Layout
    if (widget.properties.flex) {
      properties.layoutGrow = widget.properties.flex;
    }

    // Visibility and interaction
    properties.visible = true;
    properties.locked = false;

    return properties;
  }

  /**
   * Generate a descriptive component name
   */
  private generateComponentName(reusableWidget: ReusableWidget): string {
    // Generate name based on widget type and usage
    const baseName = reusableWidget.type.toString();
    const usageContext = this.inferUsageContext(reusableWidget);
    
    if (usageContext) {
      return `${baseName} / ${usageContext}`;
    }

    // Use the widget name if available and different from type
    if (reusableWidget.name && reusableWidget.name !== reusableWidget.type.toString()) {
      return this.sanitizeComponentName(reusableWidget.name);
    }

    return `${baseName} Component`;
  }

  /**
   * Generate component description
   */
  private generateComponentDescription(reusableWidget: ReusableWidget): string {
    const description = [
      `Component generated from ${reusableWidget.type} widget.`,
      `Used ${reusableWidget.usageCount} times in the codebase.`
    ];

    if (reusableWidget.variants.length > 0) {
      description.push(`Has ${reusableWidget.variants.length} variants.`);
    }

    // Add property information
    const propertyCount = Object.keys(reusableWidget.properties).length;
    if (propertyCount > 0) {
      description.push(`Contains ${propertyCount} configurable properties.`);
    }

    return description.join(' ');
  }

  /**
   * Generate instance name
   */
  private generateInstanceName(widget: Widget, componentName: string): string {
    // Use text content if available
    const textContent = this.extractTextFromWidget(widget);
    if (textContent) {
      const truncatedText = textContent.substring(0, 20);
      return `${componentName} "${truncatedText}${textContent.length > 20 ? '...' : ''}"`;
    }

    // Use widget key if available
    if (widget.properties.key) {
      return `${componentName} (${widget.properties.key})`;
    }

    return componentName;
  }

  /**
   * Generate unique component ID
   */
  private generateComponentId(componentName: string): string {
    const sanitizedName = componentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `component-${sanitizedName}-${++this.componentCounter}`;
  }

  /**
   * Sanitize component name for Figma
   */
  private sanitizeComponentName(name: string): string {
    // Remove special characters and normalize spacing
    return name
      .replace(/[^a-zA-Z0-9\s\/\-_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Infer usage context from widget properties
   */
  private inferUsageContext(reusableWidget: ReusableWidget): string | null {
    // Analyze widget properties to infer context
    const properties = reusableWidget.properties;

    // Button context
    if (reusableWidget.type.toString().includes('Button')) {
      if (properties.style === 'primary') return 'Primary';
      if (properties.style === 'secondary') return 'Secondary';
      if (properties.size === 'large') return 'Large';
      if (properties.size === 'small') return 'Small';
    }

    // Card context
    if (reusableWidget.type.toString().includes('Card')) {
      if (properties.elevation) return 'Elevated';
      if (properties.outlined) return 'Outlined';
    }

    // Text context
    if (reusableWidget.type.toString().includes('Text')) {
      if (reusableWidget.styling.typography?.fontSize && reusableWidget.styling.typography.fontSize > 20) {
        return 'Heading';
      }
      if (reusableWidget.styling.typography?.fontWeight === 'bold') {
        return 'Bold';
      }
    }

    return null;
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
}
import { 
  ASTNode, 
  ASTNodeType, 
  ConstructorCallNode, 
  NamedArgumentNode, 
  PositionalArgumentNode,
  LiteralNode,
  IdentifierNode,
  PropertyAccessNode,
  ArrayLiteralNode,
  MethodCallNode
} from './dart-parser';
import { Widget, WidgetType, WidgetProperties, StyleInfo, ColorInfo, TypographyInfo, EdgeInsets, LayoutInfo } from '../schema/types';

/**
 * Widget extraction result
 */
export interface WidgetExtractionResult {
  widgets: Widget[];
  errors: string[];
  warnings: string[];
}

/**
 * Flutter widget detector and property extractor
 */
export class WidgetExtractor {
  private static readonly FLUTTER_WIDGETS = new Set([
    'Container', 'Row', 'Column', 'Stack', 'Text', 'Image', 
    'ElevatedButton', 'TextButton', 'OutlinedButton', 'IconButton',
    'Card', 'Scaffold', 'AppBar', 'Drawer', 'FloatingActionButton',
    'Padding', 'Margin', 'Center', 'Align', 'Positioned',
    'Expanded', 'Flexible', 'Wrap', 'ListView', 'GridView',
    'SingleChildScrollView', 'CustomScrollView', 'SliverList',
    'CupertinoButton', 'CupertinoNavigationBar', 'CupertinoPageScaffold',
    'Material', 'InkWell', 'GestureDetector', 'Hero', 'Transform'
  ]);

  private errors: string[] = [];
  private warnings: string[] = [];
  private widgetIdCounter = 0;

  /**
   * Extract widgets from AST nodes
   */
  extractWidgets(nodes: ASTNode[]): WidgetExtractionResult {
    this.errors = [];
    this.warnings = [];
    this.widgetIdCounter = 0;

    const widgets: Widget[] = [];

    for (const node of nodes) {
      const widget = this.extractWidget(node);
      if (widget) {
        widgets.push(widget);
      }
    }

    return {
      widgets,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Extract a single widget from an AST node
   */
  private extractWidget(node: ASTNode): Widget | null {
    if (node.type === ASTNodeType.CONSTRUCTOR_CALL) {
      const constructorCall = node as ConstructorCallNode;
      
      if (this.isFlutterWidget(constructorCall.name)) {
        return this.createWidget(constructorCall);
      } else {
        this.warnings.push(`Unknown widget type: ${constructorCall.name}`);
        return this.createCustomWidget(constructorCall);
      }
    }

    return null;
  }

  /**
   * Check if a constructor name is a known Flutter widget
   */
  private isFlutterWidget(name: string): boolean {
    return WidgetExtractor.FLUTTER_WIDGETS.has(name);
  }

  /**
   * Create a Widget object from a constructor call
   */
  private createWidget(constructorCall: ConstructorCallNode): Widget {
    const widgetType = this.mapToWidgetType(constructorCall.name);
    const properties = this.extractProperties(constructorCall);
    const children = this.extractChildren(constructorCall);
    const styling = this.extractStyling(constructorCall);
    const layout = this.extractLayout(constructorCall);

    return {
      id: this.generateWidgetId(),
      type: widgetType,
      properties,
      children,
      styling,
      layout
    };
  }

  /**
   * Create a custom widget for unknown types
   */
  private createCustomWidget(constructorCall: ConstructorCallNode): Widget {
    const properties = this.extractProperties(constructorCall);
    const children = this.extractChildren(constructorCall);

    return {
      id: this.generateWidgetId(),
      type: WidgetType.CUSTOM,
      properties: {
        ...properties,
        customType: constructorCall.name
      },
      children,
      styling: { colors: [] }
    };
  }

  /**
   * Map constructor name to WidgetType enum
   */
  private mapToWidgetType(name: string): WidgetType {
    switch (name) {
      case 'Container': return WidgetType.CONTAINER;
      case 'Row': return WidgetType.ROW;
      case 'Column': return WidgetType.COLUMN;
      case 'Stack': return WidgetType.STACK;
      case 'Text': return WidgetType.TEXT;
      case 'Image': return WidgetType.IMAGE;
      case 'ElevatedButton':
      case 'TextButton':
      case 'OutlinedButton':
      case 'IconButton': return WidgetType.BUTTON;
      case 'Card': return WidgetType.CARD;
      case 'Scaffold': return WidgetType.SCAFFOLD;
      case 'AppBar': return WidgetType.APP_BAR;
      case 'CupertinoButton': return WidgetType.CUPERTINO_BUTTON;
      case 'CupertinoNavigationBar': return WidgetType.CUPERTINO_NAV_BAR;
      default: return WidgetType.CUSTOM;
    }
  }

  /**
   * Extract properties from constructor arguments
   */
  private extractProperties(constructorCall: ConstructorCallNode): WidgetProperties {
    const properties: WidgetProperties = {};

    for (const arg of constructorCall.arguments.arguments) {
      if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
        const namedArg = arg as NamedArgumentNode;
        const value = this.extractValue(namedArg.value);
        
        // Skip child/children as they're handled separately
        if (namedArg.name !== 'child' && namedArg.name !== 'children') {
          properties[namedArg.name] = value;
        }
      } else if (arg.type === ASTNodeType.POSITIONAL_ARGUMENT) {
        const positionalArg = arg as PositionalArgumentNode;
        const value = this.extractValue(positionalArg.value);
        
        // Handle positional arguments based on widget type
        if (constructorCall.name === 'Text' && !properties.text) {
          properties.text = value;
        } else if (constructorCall.name === 'Padding' && !properties.padding) {
          properties.padding = value;
        }
      }
    }

    return properties;
  }

  /**
   * Extract child widgets from constructor arguments
   */
  private extractChildren(constructorCall: ConstructorCallNode): Widget[] {
    const children: Widget[] = [];

    for (const arg of constructorCall.arguments.arguments) {
      if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
        const namedArg = arg as NamedArgumentNode;
        
        if (namedArg.name === 'child') {
          const childWidget = this.extractWidget(namedArg.value);
          if (childWidget) {
            children.push(childWidget);
          }
        } else if (namedArg.name === 'children') {
          const childrenWidgets = this.extractChildrenArray(namedArg.value);
          children.push(...childrenWidgets);
        }
      }
    }

    return children;
  }

  /**
   * Extract children from an array literal
   */
  private extractChildrenArray(node: ASTNode): Widget[] {
    if (node.type === ASTNodeType.ARRAY_LITERAL) {
      const arrayLiteral = node as ArrayLiteralNode;
      const children: Widget[] = [];

      for (const element of arrayLiteral.elements) {
        const childWidget = this.extractWidget(element);
        if (childWidget) {
          children.push(childWidget);
        }
      }

      return children;
    }

    return [];
  }

  /**
   * Extract styling information from widget properties
   */
  private extractStyling(constructorCall: ConstructorCallNode): StyleInfo {
    const colors: ColorInfo[] = [];
    let typography: TypographyInfo | undefined;

    for (const arg of constructorCall.arguments.arguments) {
      if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
        const namedArg = arg as NamedArgumentNode;
        
        // Extract color properties
        if (this.isColorProperty(namedArg.name)) {
          const colorInfo = this.extractColorInfo(namedArg.name, namedArg.value);
          if (colorInfo) {
            colors.push(colorInfo);
          }
        }
        
        // Extract typography from style property
        if (namedArg.name === 'style' && constructorCall.name === 'Text') {
          typography = this.extractTypographyInfo(namedArg.value);
        }
      }
    }

    return {
      colors,
      typography
    };
  }

  /**
   * Extract layout information for container widgets
   */
  private extractLayout(constructorCall: ConstructorCallNode): LayoutInfo | undefined {
    const widgetType = constructorCall.name;
    
    if (widgetType === 'Row') {
      return {
        type: 'row',
        direction: 'horizontal',
        ...this.extractAlignmentProperties(constructorCall)
      };
    } else if (widgetType === 'Column') {
      return {
        type: 'column',
        direction: 'vertical',
        ...this.extractAlignmentProperties(constructorCall)
      };
    } else if (widgetType === 'Stack') {
      return {
        type: 'stack'
      };
    }

    return undefined;
  }

  /**
   * Extract alignment properties from Row/Column widgets
   */
  private extractAlignmentProperties(constructorCall: ConstructorCallNode): Partial<LayoutInfo> {
    const layout: Partial<LayoutInfo> = {};

    for (const arg of constructorCall.arguments.arguments) {
      if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
        const namedArg = arg as NamedArgumentNode;
        
        if (namedArg.name === 'mainAxisAlignment') {
          // Extract main axis alignment
          const value = this.extractValue(namedArg.value);
          if (typeof value === 'string') {
            layout.alignment = {
              ...layout.alignment,
              mainAxis: this.mapMainAxisAlignment(value)
            };
          }
        } else if (namedArg.name === 'crossAxisAlignment') {
          // Extract cross axis alignment
          const value = this.extractValue(namedArg.value);
          if (typeof value === 'string') {
            layout.alignment = {
              ...layout.alignment,
              crossAxis: this.mapCrossAxisAlignment(value)
            };
          }
        }
      }
    }

    return layout;
  }

  /**
   * Check if a property name represents a color
   */
  private isColorProperty(name: string): boolean {
    const colorProperties = [
      'color', 'backgroundColor', 'foregroundColor', 'shadowColor',
      'borderColor', 'focusColor', 'hoverColor', 'splashColor'
    ];
    return colorProperties.includes(name);
  }

  /**
   * Extract color information from a property
   */
  private extractColorInfo(propertyName: string, node: ASTNode): ColorInfo | null {
    if (node.type === ASTNodeType.PROPERTY_ACCESS) {
      const propertyAccess = node as PropertyAccessNode;
      
      // Handle Colors.blue, Theme.of(context).primaryColor, etc.
      if (this.isThemeReference(propertyAccess)) {
        return {
          property: propertyName,
          value: this.getThemeReferencePath(propertyAccess),
          isThemeReference: true,
          themePath: this.getThemeReferencePath(propertyAccess)
        };
      } else if (this.isColorsReference(propertyAccess)) {
        return {
          property: propertyName,
          value: this.getColorsValue(propertyAccess),
          isThemeReference: false
        };
      }
    } else if (node.type === ASTNodeType.LITERAL) {
      const literal = node as LiteralNode;
      if (typeof literal.value === 'string') {
        return {
          property: propertyName,
          value: literal.value,
          isThemeReference: false
        };
      }
    }

    return null;
  }

  /**
   * Extract typography information from a style property
   */
  private extractTypographyInfo(node: ASTNode): TypographyInfo | undefined {
    if (node.type === ASTNodeType.PROPERTY_ACCESS) {
      const propertyAccess = node as PropertyAccessNode;
      
      if (this.isThemeReference(propertyAccess)) {
        return {
          isThemeReference: true,
          themePath: this.getThemeReferencePath(propertyAccess)
        };
      }
    }

    // TODO: Handle TextStyle constructor calls
    return undefined;
  }

  /**
   * Check if a property access is a theme reference
   */
  private isThemeReference(node: PropertyAccessNode): boolean {
    // Check for Theme.of(context).something patterns
    if (node.object.type === ASTNodeType.METHOD_CALL) {
      const methodCall = node.object as MethodCallNode;
      if (methodCall.object.type === ASTNodeType.IDENTIFIER) {
        const identifier = methodCall.object as IdentifierNode;
        return identifier.name === 'Theme' && methodCall.method.name === 'of';
      }
    }
    
    // Check for nested property access like Theme.of(context).textTheme.headline1
    if (node.object.type === ASTNodeType.PROPERTY_ACCESS) {
      return this.isThemeReference(node.object as PropertyAccessNode);
    }
    
    return false;
  }

  /**
   * Check if a property access is a Colors reference
   */
  private isColorsReference(node: PropertyAccessNode): boolean {
    if (node.object.type === ASTNodeType.IDENTIFIER) {
      const identifier = node.object as IdentifierNode;
      return identifier.name === 'Colors';
    }
    return false;
  }

  /**
   * Get theme reference path
   */
  private getThemeReferencePath(node: PropertyAccessNode): string {
    if (node.object.type === ASTNodeType.METHOD_CALL) {
      const methodCall = node.object as MethodCallNode;
      if (methodCall.object.type === ASTNodeType.IDENTIFIER) {
        const identifier = methodCall.object as IdentifierNode;
        if (identifier.name === 'Theme' && methodCall.method.name === 'of') {
          return `Theme.of(context).${node.property.name}`;
        }
      }
    }
    
    // Handle nested property access
    if (node.object.type === ASTNodeType.PROPERTY_ACCESS) {
      const parentPath = this.getThemeReferencePath(node.object as PropertyAccessNode);
      return `${parentPath}.${node.property.name}`;
    }
    
    return `${this.extractValue(node.object)}.${node.property.name}`;
  }

  /**
   * Get Colors value
   */
  private getColorsValue(node: PropertyAccessNode): string {
    return `Colors.${node.property.name}`;
  }

  /**
   * Map main axis alignment values
   */
  private mapMainAxisAlignment(value: string): 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' {
    switch (value) {
      case 'MainAxisAlignment.start': return 'start';
      case 'MainAxisAlignment.center': return 'center';
      case 'MainAxisAlignment.end': return 'end';
      case 'MainAxisAlignment.spaceBetween': return 'spaceBetween';
      case 'MainAxisAlignment.spaceAround': return 'spaceAround';
      case 'MainAxisAlignment.spaceEvenly': return 'spaceEvenly';
      default: return 'start';
    }
  }

  /**
   * Map cross axis alignment values
   */
  private mapCrossAxisAlignment(value: string): 'start' | 'center' | 'end' | 'stretch' {
    switch (value) {
      case 'CrossAxisAlignment.start': return 'start';
      case 'CrossAxisAlignment.center': return 'center';
      case 'CrossAxisAlignment.end': return 'end';
      case 'CrossAxisAlignment.stretch': return 'stretch';
      default: return 'start';
    }
  }

  /**
   * Extract value from an AST node
   */
  private extractValue(node: ASTNode): any {
    switch (node.type) {
      case ASTNodeType.LITERAL:
        return (node as LiteralNode).value;
      
      case ASTNodeType.IDENTIFIER:
        return (node as IdentifierNode).name;
      
      case ASTNodeType.PROPERTY_ACCESS:
        const propertyAccess = node as PropertyAccessNode;
        if (this.isThemeReference(propertyAccess)) {
          return this.getThemeReferencePath(propertyAccess);
        } else if (this.isColorsReference(propertyAccess)) {
          return this.getColorsValue(propertyAccess);
        }
        return `${this.extractValue(propertyAccess.object)}.${propertyAccess.property.name}`;
      
      case ASTNodeType.CONSTRUCTOR_CALL:
        // For constructor calls, return a simplified representation
        const constructorCall = node as ConstructorCallNode;
        return {
          type: 'constructor',
          name: constructorCall.name,
          properties: this.extractProperties(constructorCall)
        };
      
      default:
        return null;
    }
  }

  /**
   * Generate unique widget ID
   */
  private generateWidgetId(): string {
    return `widget_${++this.widgetIdCounter}`;
  }
}
import { Widget, WidgetType, StyleInfo, LayoutInfo, PositionInfo } from '../schema/types';
import { 
  FigmaNodeSpec, 
  FigmaNodeType, 
  AutoLayoutSpec, 
  WIDGET_TO_FIGMA_MAPPING,
  LAYOUT_TO_AUTOLAYOUT_MAPPING 
} from './figma-node-spec';

/**
 * Factory class for creating Figma nodes from Flutter widgets
 */
export class NodeFactory {
  private nodeCounter = 0;

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    return `node_${++this.nodeCounter}_${Date.now()}`;
  }

  /**
   * Create a Figma node from a Flutter widget
   */
  createNode(widget: Widget): FigmaNodeSpec {
    const figmaType = this.getFigmaNodeType(widget.type);
    
    switch (figmaType) {
      case FigmaNodeType.FRAME:
        return this.createFrame(widget);
      case FigmaNodeType.TEXT:
        return this.createText(widget);
      case FigmaNodeType.RECTANGLE:
        return this.createRectangle(widget);
      case FigmaNodeType.COMPONENT:
        return this.createComponent(widget);
      default:
        return this.createFrame(widget); // Fallback to frame
    }
  }

  /**
   * Create a Figma frame node from a Flutter widget
   */
  createFrame(widget: Widget): FigmaNodeSpec {
    // Handle Stack widgets with positioned layout
    if (widget.type === WidgetType.STACK || (widget.layout && widget.layout.type === 'stack')) {
      return this.createStackLayout(widget);
    }

    const nodeSpec: FigmaNodeSpec = {
      type: FigmaNodeType.FRAME,
      name: this.generateNodeName(widget),
      properties: this.extractFrameProperties(widget),
      children: widget.children.map(child => {
        const childNode = this.createNode(child);
        
        // Apply flex properties to child nodes
        this.applyFlexProperties(childNode, child, widget.layout);
        this.handleExpandedWidget(childNode, child, widget.layout);
        this.handlePositionedWidget(childNode, child);
        
        return childNode;
      })
    };

    // Add Auto Layout if widget has layout information
    if (widget.layout) {
      this.applyAutoLayout(nodeSpec, widget.layout);
      
      // Handle special layout types
      if (widget.layout.type === 'wrap') {
        this.applyWrapLayout(nodeSpec, widget.layout);
      }
    }

    return nodeSpec;
  }

  /**
   * Create a Figma text node from a Flutter Text widget
   */
  createText(widget: Widget): FigmaNodeSpec {
    const textContent = this.extractTextContent(widget);
    
    return {
      type: FigmaNodeType.TEXT,
      name: this.generateNodeName(widget),
      properties: {
        characters: textContent,
        fontSize: this.extractFontSize(widget),
        fontName: this.extractFontName(widget),
        textAlignHorizontal: this.extractTextAlign(widget),
        fills: this.extractTextFills(widget),
        ...this.extractBasicProperties(widget)
      }
    };
  }

  /**
   * Create a Figma rectangle node (used for images and decorative elements)
   */
  createRectangle(widget: Widget): FigmaNodeSpec {
    return {
      type: FigmaNodeType.RECTANGLE,
      name: this.generateNodeName(widget),
      properties: {
        fills: this.extractFills(widget),
        strokes: this.extractStrokes(widget),
        cornerRadius: this.extractCornerRadius(widget),
        ...this.extractBasicProperties(widget)
      }
    };
  }

  /**
   * Create a Figma component node for reusable widgets
   */
  createComponent(widget: Widget): FigmaNodeSpec {
    return {
      type: FigmaNodeType.COMPONENT,
      name: this.generateComponentName(widget),
      properties: {
        ...this.extractFrameProperties(widget),
        description: `Component generated from ${widget.type} widget`
      },
      children: widget.children.map(child => this.createNode(child))
    };
  }

  /**
   * Create Auto Layout specification from Flutter layout info
   */
  createAutoLayoutSpec(layout: LayoutInfo): AutoLayoutSpec {
    const baseSpec = LAYOUT_TO_AUTOLAYOUT_MAPPING[layout.type] || {};
    
    return {
      layoutMode: baseSpec.layoutMode || 'NONE',
      primaryAxisSizingMode: this.determinePrimaryAxisSizing(layout),
      counterAxisSizingMode: this.determineCounterAxisSizing(layout),
      primaryAxisAlignItems: this.mapMainAxisAlignment(layout.alignment?.mainAxis),
      counterAxisAlignItems: this.mapCrossAxisAlignment(layout.alignment?.crossAxis),
      paddingLeft: layout.padding?.left || 0,
      paddingRight: layout.padding?.right || 0,
      paddingTop: layout.padding?.top || 0,
      paddingBottom: layout.padding?.bottom || 0,
      itemSpacing: layout.spacing || 0
    };
  }

  /**
   * Apply Auto Layout properties to a frame node
   */
  applyAutoLayout(nodeSpec: FigmaNodeSpec, layout: LayoutInfo): void {
    if (nodeSpec.type !== FigmaNodeType.FRAME) {
      return;
    }

    nodeSpec.autoLayout = this.createAutoLayoutSpec(layout);
    
    // Apply layout-specific properties to the frame
    this.applyLayoutConstraints(nodeSpec, layout);
  }

  /**
   * Apply flex properties and sizing constraints to child nodes
   */
  applyFlexProperties(nodeSpec: FigmaNodeSpec, widget: Widget, parentLayout?: LayoutInfo): void {
    if (!parentLayout || !widget.properties.flex) {
      return;
    }

    // Apply flex grow/shrink properties
    const flexValue = widget.properties.flex;
    
    if (parentLayout.type === 'row') {
      nodeSpec.properties.layoutGrow = flexValue;
      nodeSpec.properties.layoutSizingHorizontal = 'FILL';
    } else if (parentLayout.type === 'column') {
      nodeSpec.properties.layoutGrow = flexValue;
      nodeSpec.properties.layoutSizingVertical = 'FILL';
    }
  }

  /**
   * Handle Expanded widget properties
   */
  handleExpandedWidget(nodeSpec: FigmaNodeSpec, widget: Widget, parentLayout?: LayoutInfo): void {
    if (widget.type !== WidgetType.CUSTOM || !widget.properties.isExpanded) {
      return;
    }

    const flex = widget.properties.flex || 1;
    
    if (parentLayout?.type === 'row') {
      nodeSpec.properties.layoutGrow = flex;
      nodeSpec.properties.layoutSizingHorizontal = 'FILL';
    } else if (parentLayout?.type === 'column') {
      nodeSpec.properties.layoutGrow = flex;
      nodeSpec.properties.layoutSizingVertical = 'FILL';
    }
  }

  /**
   * Apply spacing and alignment for Wrap widgets
   */
  applyWrapLayout(nodeSpec: FigmaNodeSpec, layout: LayoutInfo): void {
    if (layout.type !== 'wrap') {
      return;
    }

    // Figma doesn't have native wrap support, so we simulate with nested frames
    nodeSpec.properties.layoutWrap = 'WRAP';
    nodeSpec.properties.itemSpacing = layout.spacing || 0;
    
    // Apply run spacing if available
    if (layout.spacing) {
      nodeSpec.properties.counterAxisSpacing = layout.spacing;
    }
  }

  /**
   * Create positioned layout for Stack widgets
   */
  createStackLayout(widget: Widget): FigmaNodeSpec {
    const nodeSpec: FigmaNodeSpec = {
      type: FigmaNodeType.FRAME,
      name: this.generateNodeName(widget),
      properties: {
        ...this.extractFrameProperties(widget),
        layoutMode: 'NONE', // Disable Auto Layout for absolute positioning
        clipsContent: widget.properties.clipBehavior !== 'none'
      },
      children: widget.children.map((child, index) => {
        const childNode = this.createNode(child);
        this.applyAbsolutePositioning(childNode, child, index);
        return childNode;
      })
    };

    return nodeSpec;
  }

  /**
   * Apply absolute positioning to a child node in a Stack
   */
  applyAbsolutePositioning(nodeSpec: FigmaNodeSpec, widget: Widget, zIndex: number): void {
    // Apply position constraints from Positioned widget or position info
    const position = widget.position || this.extractPositionFromProperties(widget);
    
    if (position) {
      // Apply positioning constraints
      if (position.left !== undefined) {
        nodeSpec.properties.x = position.left;
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'LEFT'
        };
      }
      
      if (position.right !== undefined) {
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'RIGHT'
        };
        // Calculate x position from right constraint
        if (position.width !== undefined) {
          nodeSpec.properties.x = -position.right - position.width;
        }
      }
      
      if (position.top !== undefined) {
        nodeSpec.properties.y = position.top;
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          vertical: 'TOP'
        };
      }
      
      if (position.bottom !== undefined) {
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          vertical: 'BOTTOM'
        };
        // Calculate y position from bottom constraint
        if (position.height !== undefined) {
          nodeSpec.properties.y = -position.bottom - position.height;
        }
      }
      
      // Apply explicit size if provided
      if (position.width !== undefined) {
        nodeSpec.properties.width = position.width;
      }
      
      if (position.height !== undefined) {
        nodeSpec.properties.height = position.height;
      }
    }
    
    // Apply z-index ordering (Figma uses layer order)
    nodeSpec.properties.zIndex = zIndex;
  }

  /**
   * Handle Positioned widget constraints
   */
  handlePositionedWidget(nodeSpec: FigmaNodeSpec, widget: Widget): void {
    if (widget.type !== WidgetType.CUSTOM || !widget.properties.isPositioned) {
      return;
    }

    const positioned = widget.properties.positioned || {};
    
    // Apply positioning from Positioned widget properties
    if (positioned.left !== undefined) {
      nodeSpec.properties.x = positioned.left;
      nodeSpec.properties.constraints = {
        ...nodeSpec.properties.constraints,
        horizontal: 'LEFT'
      };
    }
    
    if (positioned.right !== undefined) {
      nodeSpec.properties.constraints = {
        ...nodeSpec.properties.constraints,
        horizontal: 'RIGHT'
      };
    }
    
    if (positioned.top !== undefined) {
      nodeSpec.properties.y = positioned.top;
      nodeSpec.properties.constraints = {
        ...nodeSpec.properties.constraints,
        vertical: 'TOP'
      };
    }
    
    if (positioned.bottom !== undefined) {
      nodeSpec.properties.constraints = {
        ...nodeSpec.properties.constraints,
        vertical: 'BOTTOM'
      };
    }
    
    if (positioned.width !== undefined) {
      nodeSpec.properties.width = positioned.width;
    }
    
    if (positioned.height !== undefined) {
      nodeSpec.properties.height = positioned.height;
    }
  }

  /**
   * Apply alignment for non-positioned children in Stack
   */
  applyStackAlignment(nodeSpec: FigmaNodeSpec, widget: Widget, stackAlignment?: string): void {
    if (widget.position || widget.properties.isPositioned) {
      return; // Skip alignment for positioned widgets
    }

    // Apply stack-level alignment to non-positioned children
    switch (stackAlignment) {
      case 'topLeft':
        nodeSpec.properties.x = 0;
        nodeSpec.properties.y = 0;
        break;
      case 'topCenter':
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'CENTER'
        };
        nodeSpec.properties.y = 0;
        break;
      case 'topRight':
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'RIGHT'
        };
        nodeSpec.properties.y = 0;
        break;
      case 'centerLeft':
        nodeSpec.properties.x = 0;
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          vertical: 'CENTER'
        };
        break;
      case 'center':
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'CENTER',
          vertical: 'CENTER'
        };
        break;
      case 'centerRight':
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'RIGHT',
          vertical: 'CENTER'
        };
        break;
      case 'bottomLeft':
        nodeSpec.properties.x = 0;
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          vertical: 'BOTTOM'
        };
        break;
      case 'bottomCenter':
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'CENTER',
          vertical: 'BOTTOM'
        };
        break;
      case 'bottomRight':
        nodeSpec.properties.constraints = {
          ...nodeSpec.properties.constraints,
          horizontal: 'RIGHT',
          vertical: 'BOTTOM'
        };
        break;
      default:
        // Default to top-left
        nodeSpec.properties.x = 0;
        nodeSpec.properties.y = 0;
    }
  }

  /**
   * Get the appropriate Figma node type for a Flutter widget
   */
  private getFigmaNodeType(widgetType: WidgetType): FigmaNodeType {
    return WIDGET_TO_FIGMA_MAPPING[widgetType] || FigmaNodeType.FRAME;
  }

  /**
   * Generate a descriptive name for the Figma node
   */
  private generateNodeName(widget: Widget): string {
    const baseName = widget.type.toString();
    
    // Add descriptive suffix based on widget properties
    if (widget.type === WidgetType.TEXT && widget.properties.data) {
      const fullText = widget.properties.data.toString();
      const text = fullText.substring(0, 20);
      return `${baseName} "${text}${fullText.length > 20 ? '...' : ''}"`;
    }
    
    if (widget.properties.key) {
      return `${baseName} (${widget.properties.key})`;
    }
    
    return baseName;
  }

  /**
   * Generate a component name for reusable widgets
   */
  private generateComponentName(widget: Widget): string {
    return `${widget.type} Component`;
  }

  /**
   * Extract basic properties common to all node types
   */
  private extractBasicProperties(widget: Widget): Record<string, any> {
    const properties: Record<string, any> = {};
    
    // Size properties
    if (widget.properties.width !== undefined) {
      properties.width = widget.properties.width;
    }
    if (widget.properties.height !== undefined) {
      properties.height = widget.properties.height;
    }
    
    // Visibility
    properties.visible = true;
    properties.locked = false;
    
    return properties;
  }

  /**
   * Extract frame-specific properties
   */
  private extractFrameProperties(widget: Widget): Record<string, any> {
    const properties = this.extractBasicProperties(widget);
    
    // Background fills
    properties.fills = this.extractFills(widget);
    
    // Strokes/borders
    properties.strokes = this.extractStrokes(widget);
    
    // Corner radius
    const cornerRadius = this.extractCornerRadius(widget);
    if (cornerRadius > 0) {
      properties.cornerRadius = cornerRadius;
    }
    
    // Clipping
    properties.clipsContent = widget.properties.clipBehavior !== 'none';
    
    return properties;
  }

  /**
   * Extract text content from Text widget
   */
  private extractTextContent(widget: Widget): string {
    return widget.properties.data?.toString() || widget.properties.text?.toString() || 'Text';
  }

  /**
   * Extract font size from widget styling
   */
  private extractFontSize(widget: Widget): number {
    return widget.styling.typography?.fontSize || 14;
  }

  /**
   * Extract font name from widget styling
   */
  private extractFontName(widget: Widget): { family: string; style: string } {
    const fontFamily = widget.styling.typography?.fontFamily || 'Inter';
    const fontWeight = widget.styling.typography?.fontWeight || 'Regular';
    
    return {
      family: fontFamily,
      style: this.mapFontWeight(fontWeight)
    };
  }

  /**
   * Extract text alignment
   */
  private extractTextAlign(widget: Widget): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
    const textAlign = widget.properties.textAlign;
    
    switch (textAlign) {
      case 'center': return 'CENTER';
      case 'right': return 'RIGHT';
      case 'justify': return 'JUSTIFIED';
      default: return 'LEFT';
    }
  }

  /**
   * Extract fills for background colors
   */
  private extractFills(widget: Widget): any[] {
    const fills: any[] = [];
    
    // Extract background color from styling
    const backgroundColors = widget.styling.colors.filter(c => 
      c.property === 'backgroundColor' || c.property === 'color'
    );
    
    backgroundColors.forEach(colorInfo => {
      if (colorInfo.value && colorInfo.value !== 'transparent') {
        fills.push({
          type: 'SOLID',
          color: this.hexToRgb(colorInfo.value),
          opacity: 1
        });
      }
    });
    
    // Default transparent fill if no background
    if (fills.length === 0) {
      fills.push({
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 0
      });
    }
    
    return fills;
  }

  /**
   * Extract text fills for text color
   */
  private extractTextFills(widget: Widget): any[] {
    const textColors = widget.styling.colors.filter(c => c.property === 'color');
    
    if (textColors.length > 0 && textColors[0].value) {
      return [{
        type: 'SOLID',
        color: this.hexToRgb(textColors[0].value),
        opacity: 1
      }];
    }
    
    // Default black text
    return [{
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
      opacity: 1
    }];
  }

  /**
   * Extract strokes for borders
   */
  private extractStrokes(widget: Widget): any[] {
    const strokes: any[] = [];
    
    if (widget.styling.borders) {
      const border = widget.styling.borders;
      if (border.width && border.width > 0 && border.color) {
        strokes.push({
          type: 'SOLID',
          color: this.hexToRgb(border.color),
          opacity: 1
        });
      }
    }
    
    return strokes;
  }

  /**
   * Extract corner radius from widget decoration
   */
  private extractCornerRadius(widget: Widget): number {
    if (widget.properties.decoration?.borderRadius) {
      const radius = widget.properties.decoration.borderRadius;
      // Use topLeft as default if uniform radius
      return radius.topLeft || 0;
    }
    
    if (widget.styling.borders?.radius) {
      return widget.styling.borders.radius.topLeft || 0;
    }
    
    return 0;
  }

  /**
   * Map Flutter main axis alignment to Figma
   */
  private mapMainAxisAlignment(alignment?: string): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
    switch (alignment) {
      case 'center': return 'CENTER';
      case 'end': return 'MAX';
      case 'spaceBetween': return 'SPACE_BETWEEN';
      default: return 'MIN';
    }
  }

  /**
   * Map Flutter cross axis alignment to Figma
   */
  private mapCrossAxisAlignment(alignment?: string): 'MIN' | 'CENTER' | 'MAX' {
    switch (alignment) {
      case 'center': return 'CENTER';
      case 'end': return 'MAX';
      default: return 'MIN';
    }
  }

  /**
   * Map Flutter font weight to Figma font style
   */
  private mapFontWeight(fontWeight: string): string {
    const weightMap: Record<string, string> = {
      '100': 'Thin',
      '200': 'Extra Light',
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semi Bold',
      '700': 'Bold',
      '800': 'Extra Bold',
      '900': 'Black',
      'normal': 'Regular',
      'bold': 'Bold'
    };
    
    return weightMap[fontWeight] || 'Regular';
  }

  /**
   * Determine primary axis sizing mode based on layout properties
   */
  private determinePrimaryAxisSizing(layout: LayoutInfo): 'FIXED' | 'AUTO' {
    // If layout has explicit size constraints, use FIXED
    if (layout.type === 'row' && (layout as any).width) {
      return 'FIXED';
    }
    if (layout.type === 'column' && (layout as any).height) {
      return 'FIXED';
    }
    
    // Default to AUTO for flexible sizing
    return 'AUTO';
  }

  /**
   * Determine counter axis sizing mode based on layout properties
   */
  private determineCounterAxisSizing(layout: LayoutInfo): 'FIXED' | 'AUTO' {
    // Check for cross-axis constraints
    if (layout.alignment?.crossAxis === 'stretch') {
      return 'FIXED';
    }
    
    // Check for explicit counter-axis size
    if (layout.type === 'row' && (layout as any).height) {
      return 'FIXED';
    }
    if (layout.type === 'column' && (layout as any).width) {
      return 'FIXED';
    }
    
    return 'AUTO';
  }

  /**
   * Apply layout constraints to frame properties
   */
  private applyLayoutConstraints(nodeSpec: FigmaNodeSpec, layout: LayoutInfo): void {
    // Apply size constraints if specified
    if ((layout as any).width) {
      nodeSpec.properties.width = (layout as any).width;
      nodeSpec.properties.layoutSizingHorizontal = 'FIXED';
    }
    
    if ((layout as any).height) {
      nodeSpec.properties.height = (layout as any).height;
      nodeSpec.properties.layoutSizingVertical = 'FIXED';
    }

    // Apply minimum and maximum constraints
    if ((layout as any).minWidth) {
      nodeSpec.properties.minWidth = (layout as any).minWidth;
    }
    
    if ((layout as any).maxWidth) {
      nodeSpec.properties.maxWidth = (layout as any).maxWidth;
    }
    
    if ((layout as any).minHeight) {
      nodeSpec.properties.minHeight = (layout as any).minHeight;
    }
    
    if ((layout as any).maxHeight) {
      nodeSpec.properties.maxHeight = (layout as any).maxHeight;
    }
  }

  /**
   * Extract position information from widget properties
   */
  private extractPositionFromProperties(widget: Widget): PositionInfo | null {
    // Check for Positioned widget properties
    if (widget.properties.positioned) {
      return {
        left: widget.properties.positioned.left,
        right: widget.properties.positioned.right,
        top: widget.properties.positioned.top,
        bottom: widget.properties.positioned.bottom,
        width: widget.properties.positioned.width,
        height: widget.properties.positioned.height
      };
    }

    // Check for direct position properties
    if (widget.properties.left !== undefined || 
        widget.properties.right !== undefined || 
        widget.properties.top !== undefined || 
        widget.properties.bottom !== undefined) {
      return {
        left: widget.properties.left,
        right: widget.properties.right,
        top: widget.properties.top,
        bottom: widget.properties.bottom,
        width: widget.properties.width,
        height: widget.properties.height
      };
    }

    return null;
  }

  /**
   * Convert hex color to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return { r, g, b };
  }
}
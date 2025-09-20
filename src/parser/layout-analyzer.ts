import { Widget, WidgetType, LayoutInfo, AlignmentInfo, EdgeInsets } from '../schema/types';

/**
 * Layout analysis result for a widget
 */
export interface LayoutAnalysis {
  widget: Widget;
  layoutType: LayoutType;
  direction?: 'horizontal' | 'vertical';
  alignment?: AlignmentInfo;
  spacing?: number;
  padding?: EdgeInsets;
  isAutoLayoutCandidate: boolean;
  constraints?: LayoutConstraints;
  flexProperties?: FlexProperties;
  stackProperties?: StackProperties;
}

/**
 * Layout type enumeration
 */
export enum LayoutType {
  LINEAR = 'linear',        // Row, Column
  STACK = 'stack',          // Stack with positioned children
  FLEX = 'flex',            // Flexible layouts with Expanded/Flexible
  WRAP = 'wrap',            // Wrap widget
  GRID = 'grid',            // GridView-like layouts
  SCROLL = 'scroll',        // ScrollView layouts
  SINGLE = 'single',        // Single child containers
  NONE = 'none'             // No specific layout
}

/**
 * Layout constraints for Auto Layout
 */
export interface LayoutConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

/**
 * Flex properties for flexible layouts
 */
export interface FlexProperties {
  hasFlexChildren: boolean;
  flexChildren: FlexChild[];
  totalFlex: number;
  hasFixedChildren: boolean;
}

/**
 * Flex child information
 */
export interface FlexChild {
  widget: Widget;
  flex: number;
  fit: 'tight' | 'loose';
}

/**
 * Stack properties for positioned layouts
 */
export interface StackProperties {
  hasPositionedChildren: boolean;
  positionedChildren: PositionedChild[];
  stackFit: 'loose' | 'expand' | 'passthrough';
  clipBehavior: 'none' | 'hardEdge' | 'antiAlias' | 'antiAliasWithSaveLayer';
}

/**
 * Positioned child information
 */
export interface PositionedChild {
  widget: Widget;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  width?: number;
  height?: number;
}

/**
 * Layout analysis summary for multiple widgets
 */
export interface LayoutAnalysisSummary {
  analyses: LayoutAnalysis[];
  autoLayoutCandidates: LayoutAnalysis[];
  layoutTypes: Map<LayoutType, LayoutAnalysis[]>;
  complexLayouts: LayoutAnalysis[];
  totalLayouts: number;
}

/**
 * Layout analyzer that detects layout patterns and Auto Layout candidates
 */
export class LayoutAnalyzer {

  /**
   * Analyze layout for multiple widgets
   */
  analyzeLayouts(widgets: Widget[]): LayoutAnalysisSummary {
    const analyses: LayoutAnalysis[] = [];
    const autoLayoutCandidates: LayoutAnalysis[] = [];
    const layoutTypes = new Map<LayoutType, LayoutAnalysis[]>();
    const complexLayouts: LayoutAnalysis[] = [];

    for (const widget of widgets) {
      const analysis = this.analyzeWidget(widget);
      analyses.push(analysis);

      // Categorize analysis
      if (analysis.isAutoLayoutCandidate) {
        autoLayoutCandidates.push(analysis);
      }

      if (!layoutTypes.has(analysis.layoutType)) {
        layoutTypes.set(analysis.layoutType, []);
      }
      layoutTypes.get(analysis.layoutType)!.push(analysis);

      if (this.isComplexLayout(analysis)) {
        complexLayouts.push(analysis);
      }

      // Recursively analyze children
      const childAnalyses = this.analyzeLayouts(widget.children);
      analyses.push(...childAnalyses.analyses);
      autoLayoutCandidates.push(...childAnalyses.autoLayoutCandidates);
      complexLayouts.push(...childAnalyses.complexLayouts);

      // Merge child layout types
      for (const [type, childAnalysesList] of childAnalyses.layoutTypes) {
        if (!layoutTypes.has(type)) {
          layoutTypes.set(type, []);
        }
        layoutTypes.get(type)!.push(...childAnalysesList);
      }
    }

    return {
      analyses,
      autoLayoutCandidates,
      layoutTypes,
      complexLayouts,
      totalLayouts: analyses.length
    };
  }

  /**
   * Analyze layout for a single widget
   */
  analyzeWidget(widget: Widget): LayoutAnalysis {
    const layoutType = this.detectLayoutType(widget);
    const direction = this.extractDirection(widget);
    const alignment = this.extractAlignment(widget);
    const spacing = this.extractSpacing(widget);
    const padding = this.extractPadding(widget);
    const constraints = this.extractConstraints(widget);
    const flexProperties = this.analyzeFlexProperties(widget);
    const stackProperties = this.analyzeStackProperties(widget);
    const isAutoLayoutCandidate = this.isAutoLayoutCandidate(widget, layoutType);

    return {
      widget,
      layoutType,
      direction,
      alignment,
      spacing,
      padding,
      isAutoLayoutCandidate,
      constraints,
      flexProperties,
      stackProperties
    };
  }

  /**
   * Detect the layout type of a widget
   */
  private detectLayoutType(widget: Widget): LayoutType {
    switch (widget.type) {
      case WidgetType.ROW:
        return this.hasFlexChildren(widget) ? LayoutType.FLEX : LayoutType.LINEAR;
      
      case WidgetType.COLUMN:
        return this.hasFlexChildren(widget) ? LayoutType.FLEX : LayoutType.LINEAR;
      
      case WidgetType.STACK:
        return LayoutType.STACK;
      
      case WidgetType.CONTAINER:
        if (widget.children.length === 0) {
          return LayoutType.NONE;
        } else if (widget.children.length === 1) {
          return LayoutType.SINGLE;
        } else {
          // Container with multiple children is unusual, treat as stack
          return LayoutType.STACK;
        }
      
      case WidgetType.CUSTOM:
        return this.detectCustomLayoutType(widget);
      
      default:
        if (widget.children.length === 0) {
          return LayoutType.NONE;
        } else if (widget.children.length === 1) {
          return LayoutType.SINGLE;
        } else {
          return LayoutType.LINEAR; // Default assumption
        }
    }
  }

  /**
   * Detect layout type for custom widgets
   */
  private detectCustomLayoutType(widget: Widget): LayoutType {
    const customType = widget.properties.customType as string;
    
    if (!customType) {
      return LayoutType.NONE;
    }

    // Common Flutter layout widgets
    if (customType.includes('Wrap')) {
      return LayoutType.WRAP;
    } else if (customType.includes('Grid') || customType.includes('GridView')) {
      return LayoutType.GRID;
    } else if (customType.includes('ListView') || customType.includes('ScrollView')) {
      return LayoutType.SCROLL;
    } else if (customType.includes('Flex')) {
      return LayoutType.FLEX;
    }

    // Default based on children count
    if (widget.children.length === 0) {
      return LayoutType.NONE;
    } else if (widget.children.length === 1) {
      return LayoutType.SINGLE;
    } else {
      return LayoutType.LINEAR;
    }
  }

  /**
   * Extract layout direction from widget
   */
  private extractDirection(widget: Widget): 'horizontal' | 'vertical' | undefined {
    if (widget.layout?.direction) {
      return widget.layout.direction;
    }

    switch (widget.type) {
      case WidgetType.ROW:
        return 'horizontal';
      case WidgetType.COLUMN:
        return 'vertical';
      default:
        return undefined;
    }
  }

  /**
   * Extract alignment information from widget
   */
  private extractAlignment(widget: Widget): AlignmentInfo | undefined {
    if (widget.layout?.alignment) {
      return widget.layout.alignment;
    }

    // Extract from properties
    const alignment: AlignmentInfo = {};
    
    if (widget.properties.mainAxisAlignment) {
      alignment.mainAxis = this.mapMainAxisAlignment(widget.properties.mainAxisAlignment);
    }
    
    if (widget.properties.crossAxisAlignment) {
      alignment.crossAxis = this.mapCrossAxisAlignment(widget.properties.crossAxisAlignment);
    }

    return Object.keys(alignment).length > 0 ? alignment : undefined;
  }

  /**
   * Extract spacing information from widget
   */
  private extractSpacing(widget: Widget): number | undefined {
    if (widget.layout?.spacing !== undefined) {
      return widget.layout.spacing;
    }

    // Check for spacing in properties
    if (typeof widget.properties.spacing === 'number') {
      return widget.properties.spacing;
    }

    return undefined;
  }

  /**
   * Extract padding information from widget
   */
  private extractPadding(widget: Widget): EdgeInsets | undefined {
    if (widget.layout?.padding) {
      return widget.layout.padding;
    }

    if (widget.properties.padding) {
      return this.parseEdgeInsets(widget.properties.padding);
    }

    return undefined;
  }

  /**
   * Extract layout constraints from widget
   */
  private extractConstraints(widget: Widget): LayoutConstraints | undefined {
    const constraints: LayoutConstraints = {};

    if (typeof widget.properties.width === 'number') {
      constraints.minWidth = widget.properties.width;
      constraints.maxWidth = widget.properties.width;
    }

    if (typeof widget.properties.height === 'number') {
      constraints.minHeight = widget.properties.height;
      constraints.maxHeight = widget.properties.height;
    }

    if (typeof widget.properties.aspectRatio === 'number') {
      constraints.aspectRatio = widget.properties.aspectRatio;
    }

    return Object.keys(constraints).length > 0 ? constraints : undefined;
  }

  /**
   * Analyze flex properties of a widget
   */
  private analyzeFlexProperties(widget: Widget): FlexProperties | undefined {
    if (widget.type !== WidgetType.ROW && widget.type !== WidgetType.COLUMN) {
      return undefined;
    }

    const flexChildren: FlexChild[] = [];
    let totalFlex = 0;
    let hasFixedChildren = false;

    for (const child of widget.children) {
      if (this.isFlexChild(child)) {
        const flex = this.getFlexValue(child);
        const fit = this.getFlexFit(child);
        
        flexChildren.push({
          widget: child,
          flex,
          fit
        });
        
        totalFlex += flex;
      } else {
        hasFixedChildren = true;
      }
    }

    if (flexChildren.length === 0) {
      return undefined;
    }

    return {
      hasFlexChildren: flexChildren.length > 0,
      flexChildren,
      totalFlex,
      hasFixedChildren
    };
  }

  /**
   * Analyze stack properties of a widget
   */
  private analyzeStackProperties(widget: Widget): StackProperties | undefined {
    if (widget.type !== WidgetType.STACK) {
      return undefined;
    }

    const positionedChildren: PositionedChild[] = [];

    for (const child of widget.children) {
      if (this.isPositionedChild(child)) {
        const positioned = this.extractPositionedProperties(child);
        if (positioned) {
          positionedChildren.push(positioned);
        }
      }
    }

    return {
      hasPositionedChildren: positionedChildren.length > 0,
      positionedChildren,
      stackFit: this.getStackFit(widget),
      clipBehavior: this.getClipBehavior(widget)
    };
  }

  /**
   * Check if widget is a candidate for Auto Layout
   */
  private isAutoLayoutCandidate(widget: Widget, layoutType: LayoutType): boolean {
    // Auto Layout candidates are widgets that can benefit from Figma's Auto Layout
    switch (layoutType) {
      case LayoutType.LINEAR:
      case LayoutType.FLEX:
        return widget.children.length > 0;
      
      case LayoutType.SINGLE:
        return true; // Single child containers can use Auto Layout for padding
      
      case LayoutType.WRAP:
        return true; // Wrap layouts can be approximated with Auto Layout
      
      default:
        return false;
    }
  }

  /**
   * Check if layout is complex
   */
  private isComplexLayout(analysis: LayoutAnalysis): boolean {
    return (
      analysis.layoutType === LayoutType.STACK ||
      analysis.layoutType === LayoutType.GRID ||
      (analysis.flexProperties?.hasFlexChildren && analysis.flexProperties?.hasFixedChildren) ||
      (analysis.stackProperties?.hasPositionedChildren ?? false)
    );
  }

  /**
   * Check if widget has flex children
   */
  private hasFlexChildren(widget: Widget): boolean {
    return widget.children.some(child => this.isFlexChild(child));
  }

  /**
   * Check if child is a flex child (Expanded, Flexible)
   */
  private isFlexChild(widget: Widget): boolean {
    return (
      widget.type === WidgetType.CUSTOM &&
      (widget.properties.customType === 'Expanded' || widget.properties.customType === 'Flexible')
    ) || (
      widget.properties.flex !== undefined
    );
  }

  /**
   * Check if child is positioned
   */
  private isPositionedChild(widget: Widget): boolean {
    return (
      widget.type === WidgetType.CUSTOM &&
      widget.properties.customType === 'Positioned'
    ) || (
      widget.position !== undefined
    ) || (
      // Check if any positioning properties are set directly
      widget.properties.top !== undefined ||
      widget.properties.right !== undefined ||
      widget.properties.bottom !== undefined ||
      widget.properties.left !== undefined
    );
  }

  /**
   * Get flex value from widget
   */
  private getFlexValue(widget: Widget): number {
    if (typeof widget.properties.flex === 'number') {
      return widget.properties.flex;
    }
    return 1; // Default flex value
  }

  /**
   * Get flex fit from widget
   */
  private getFlexFit(widget: Widget): 'tight' | 'loose' {
    if (widget.properties.fit === 'FlexFit.tight') {
      return 'tight';
    }
    return 'loose'; // Default
  }

  /**
   * Extract positioned properties from widget
   */
  private extractPositionedProperties(widget: Widget): PositionedChild | null {
    const positioned: Partial<PositionedChild> = {
      widget
    };

    if (widget.position) {
      positioned.top = widget.position.top;
      positioned.right = widget.position.right;
      positioned.bottom = widget.position.bottom;
      positioned.left = widget.position.left;
      positioned.width = widget.position.width;
      positioned.height = widget.position.height;
    }

    // Extract from properties if available
    if (widget.properties.top !== undefined) positioned.top = widget.properties.top;
    if (widget.properties.right !== undefined) positioned.right = widget.properties.right;
    if (widget.properties.bottom !== undefined) positioned.bottom = widget.properties.bottom;
    if (widget.properties.left !== undefined) positioned.left = widget.properties.left;
    if (widget.properties.width !== undefined) positioned.width = widget.properties.width;
    if (widget.properties.height !== undefined) positioned.height = widget.properties.height;

    // Check if any positioning properties are set
    const hasPositioning = [
      positioned.top, positioned.right, positioned.bottom, 
      positioned.left, positioned.width, positioned.height
    ].some(value => value !== undefined);

    return hasPositioning ? positioned as PositionedChild : null;
  }

  /**
   * Get stack fit property
   */
  private getStackFit(widget: Widget): 'loose' | 'expand' | 'passthrough' {
    const fit = widget.properties.fit;
    if (fit === 'StackFit.expand') return 'expand';
    if (fit === 'StackFit.passthrough') return 'passthrough';
    return 'loose'; // Default
  }

  /**
   * Get clip behavior property
   */
  private getClipBehavior(widget: Widget): 'none' | 'hardEdge' | 'antiAlias' | 'antiAliasWithSaveLayer' {
    const clipBehavior = widget.properties.clipBehavior;
    if (clipBehavior === 'Clip.hardEdge') return 'hardEdge';
    if (clipBehavior === 'Clip.antiAlias') return 'antiAlias';
    if (clipBehavior === 'Clip.antiAliasWithSaveLayer') return 'antiAliasWithSaveLayer';
    return 'none'; // Default
  }

  /**
   * Map main axis alignment string to enum
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
   * Map cross axis alignment string to enum
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
   * Parse EdgeInsets from various formats
   */
  private parseEdgeInsets(padding: any): EdgeInsets | undefined {
    if (typeof padding === 'object' && padding !== null) {
      // Already in EdgeInsets format
      if (typeof padding.top === 'number') {
        return {
          top: padding.top || 0,
          right: padding.right || 0,
          bottom: padding.bottom || 0,
          left: padding.left || 0
        };
      }
    }

    if (typeof padding === 'number') {
      // Uniform padding
      return {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding
      };
    }

    return undefined;
  }

  /**
   * Get layout recommendations for Auto Layout conversion
   */
  getAutoLayoutRecommendations(analysis: LayoutAnalysis): string[] {
    const recommendations: string[] = [];

    if (!analysis.isAutoLayoutCandidate) {
      recommendations.push('Widget is not suitable for Auto Layout conversion');
      return recommendations;
    }

    switch (analysis.layoutType) {
      case LayoutType.LINEAR:
        recommendations.push(`Use ${analysis.direction} Auto Layout`);
        if (analysis.alignment) {
          recommendations.push(`Set alignment: ${JSON.stringify(analysis.alignment)}`);
        }
        if (analysis.spacing) {
          recommendations.push(`Set spacing: ${analysis.spacing}px`);
        }
        break;

      case LayoutType.FLEX:
        recommendations.push(`Use ${analysis.direction} Auto Layout with flex properties`);
        if (analysis.flexProperties) {
          recommendations.push(`Configure ${analysis.flexProperties.flexChildren.length} flex children`);
        }
        break;

      case LayoutType.SINGLE:
        recommendations.push('Use Auto Layout for padding and sizing');
        if (analysis.padding) {
          recommendations.push('Apply padding to Auto Layout frame');
        }
        break;

      case LayoutType.WRAP:
        recommendations.push('Use Auto Layout with wrap enabled (if supported)');
        break;

      default:
        recommendations.push('Consider manual layout or component structure');
    }

    return recommendations;
  }
}
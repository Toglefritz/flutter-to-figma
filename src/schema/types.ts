// Core TypeScript interfaces for the Flutter → Figma plugin

/**
 * Widget representation - core data structure for Flutter widgets
 */
export interface Widget {
  id: string;
  type: WidgetType;
  properties: WidgetProperties;
  children: Widget[];
  styling: StyleInfo;
  layout?: LayoutInfo;
  position?: PositionInfo;
}

/**
 * Widget type enumeration
 */
export enum WidgetType {
  CONTAINER = 'Container',
  ROW = 'Row',
  COLUMN = 'Column',
  STACK = 'Stack',
  TEXT = 'Text',
  IMAGE = 'Image',
  BUTTON = 'ElevatedButton',
  CARD = 'Card',
  SCAFFOLD = 'Scaffold',
  APP_BAR = 'AppBar',
  CUPERTINO_BUTTON = 'CupertinoButton',
  CUPERTINO_NAV_BAR = 'CupertinoNavigationBar',
  CUSTOM = 'Custom'
}

/**
 * Widget properties - flexible structure for widget-specific properties
 */
export interface WidgetProperties {
  [key: string]: any;
  width?: number;
  height?: number;
  padding?: EdgeInsets;
  margin?: EdgeInsets;
  decoration?: BoxDecoration;
  flex?: number;
  isExpanded?: boolean;
  isPositioned?: boolean;
  positioned?: PositionedProperties;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Properties for Positioned widgets
 */
export interface PositionedProperties {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  width?: number;
  height?: number;
}

/**
 * Styling information extracted from Flutter widgets
 */
export interface StyleInfo {
  colors: ColorInfo[];
  typography?: TypographyInfo;
  spacing?: SpacingInfo;
  borders?: BorderInfo;
  shadows?: ShadowInfo[];
}

/**
 * Color information
 */
export interface ColorInfo {
  property: string; // e.g., 'backgroundColor', 'color'
  value: string; // hex color or theme reference
  isThemeReference: boolean;
  themePath?: string; // e.g., 'primaryColor', 'colorScheme.primary'
}

/**
 * Typography information
 */
export interface TypographyInfo {
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  isThemeReference: boolean;
  themePath?: string;
}

/**
 * Spacing information
 */
export interface SpacingInfo {
  padding?: EdgeInsets;
  margin?: EdgeInsets;
}

/**
 * Edge insets for padding/margin
 */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Border information
 */
export interface BorderInfo {
  width?: number;
  color?: string;
  radius?: BorderRadius;
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Border radius
 */
export interface BorderRadius {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

/**
 * Shadow information
 */
export interface ShadowInfo {
  color: string;
  offset: { x: number; y: number };
  blur: number;
  spread?: number;
}

/**
 * Layout information for container widgets
 */
export interface LayoutInfo {
  type: 'row' | 'column' | 'stack' | 'wrap' | 'flex';
  direction?: 'horizontal' | 'vertical';
  alignment?: AlignmentInfo;
  spacing?: number;
  padding?: EdgeInsets;
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

/**
 * Alignment information
 */
export interface AlignmentInfo {
  mainAxis?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  crossAxis?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * Position information for absolutely positioned widgets
 */
export interface PositionInfo {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  width?: number;
  height?: number;
}

/**
 * Box decoration for containers
 */
export interface BoxDecoration {
  color?: string;
  border?: BorderInfo;
  borderRadius?: BorderRadius;
  boxShadow?: ShadowInfo[];
  gradient?: GradientInfo;
}

/**
 * Gradient information
 */
export interface GradientInfo {
  type: 'linear' | 'radial';
  colors: string[];
  stops?: number[];
  begin?: { x: number; y: number };
  end?: { x: number; y: number };
}

/**
 * Reusable widget for component creation
 */
export interface ReusableWidget extends Widget {
  name: string;
  variants: WidgetVariant[];
  usageCount: number;
}

/**
 * Widget variant for component variants
 */
export interface WidgetVariant {
  name: string;
  properties: WidgetProperties;
  styling: StyleInfo;
}
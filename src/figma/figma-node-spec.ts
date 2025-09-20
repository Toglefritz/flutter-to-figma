// Figma-specific node specifications and mappings

/**
 * Figma node specification for creating nodes
 */
export interface FigmaNodeSpec {
  type: FigmaNodeType;
  name: string;
  properties: Record<string, any>;
  autoLayout?: AutoLayoutSpec;
  variables?: VariableBinding[];
  children?: FigmaNodeSpec[];
}

/**
 * Figma node types
 */
export enum FigmaNodeType {
  FRAME = 'FRAME',
  TEXT = 'TEXT',
  RECTANGLE = 'RECTANGLE',
  ELLIPSE = 'ELLIPSE',
  COMPONENT = 'COMPONENT',
  INSTANCE = 'INSTANCE',
  GROUP = 'GROUP',
  VECTOR = 'VECTOR'
}

/**
 * Auto Layout specification for Figma frames
 */
export interface AutoLayoutSpec {
  layoutMode: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisSizingMode: 'FIXED' | 'AUTO';
  counterAxisSizingMode: 'FIXED' | 'AUTO';
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX';
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
}

/**
 * Variable binding for Figma Variables
 */
export interface VariableBinding {
  property: string; // e.g., 'fills', 'fontFamily', 'fontSize'
  variableId: string;
  variableAlias?: string;
}

/**
 * Figma Variable specification
 */
export interface FigmaVariableSpec {
  name: string;
  type: VariableType;
  scopes: VariableScope[];
  values: VariableValue[];
  description?: string;
}

/**
 * Figma Variable types
 */
export enum VariableType {
  COLOR = 'COLOR',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN'
}

/**
 * Figma Variable scopes
 */
export enum VariableScope {
  ALL_FILLS = 'ALL_FILLS',
  FRAME_FILL = 'FRAME_FILL',
  SHAPE_FILL = 'SHAPE_FILL',
  TEXT_FILL = 'TEXT_FILL',
  ALL_STROKES = 'ALL_STROKES',
  STROKE_COLOR = 'STROKE_COLOR',
  FONT_FAMILY = 'FONT_FAMILY',
  FONT_SIZE = 'FONT_SIZE',
  FONT_WEIGHT = 'FONT_WEIGHT',
  LINE_HEIGHT = 'LINE_HEIGHT',
  LETTER_SPACING = 'LETTER_SPACING',
  CORNER_RADIUS = 'CORNER_RADIUS',
  WIDTH_HEIGHT = 'WIDTH_HEIGHT',
  GAP = 'GAP'
}

/**
 * Variable value for different modes
 */
export interface VariableValue {
  modeId: string;
  value: string | number | boolean | RGB;
}

/**
 * RGB color value
 */
export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

/**
 * Figma Component specification
 */
export interface FigmaComponentSpec {
  name: string;
  description?: string;
  variants?: ComponentVariant[];
  properties?: ComponentProperty[];
}

/**
 * Component variant specification
 */
export interface ComponentVariant {
  name: string;
  properties: Record<string, string | boolean>;
  nodeSpec: FigmaNodeSpec;
}

/**
 * Component property specification
 */
export interface ComponentProperty {
  name: string;
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue: string | boolean;
  variantOptions?: string[];
}

/**
 * Widget to Figma node type mapping
 */
export const WIDGET_TO_FIGMA_MAPPING: Record<string, FigmaNodeType> = {
  'Container': FigmaNodeType.FRAME,
  'Row': FigmaNodeType.FRAME,
  'Column': FigmaNodeType.FRAME,
  'Stack': FigmaNodeType.FRAME,
  'Text': FigmaNodeType.TEXT,
  'Image': FigmaNodeType.RECTANGLE,
  'ElevatedButton': FigmaNodeType.COMPONENT,
  'Card': FigmaNodeType.COMPONENT,
  'Scaffold': FigmaNodeType.FRAME,
  'AppBar': FigmaNodeType.COMPONENT,
  'CupertinoButton': FigmaNodeType.COMPONENT,
  'CupertinoNavigationBar': FigmaNodeType.COMPONENT,
  'Custom': FigmaNodeType.FRAME
};

/**
 * Layout type to Auto Layout mapping
 */
export const LAYOUT_TO_AUTOLAYOUT_MAPPING: Record<string, Partial<AutoLayoutSpec>> = {
  'row': {
    layoutMode: 'HORIZONTAL',
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO'
  },
  'column': {
    layoutMode: 'VERTICAL',
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO'
  },
  'stack': {
    layoutMode: 'NONE'
  }
};
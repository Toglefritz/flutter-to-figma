// Figma-specific node specifications and mappings
/**
 * Figma node types
 */
export var FigmaNodeType;
(function (FigmaNodeType) {
    FigmaNodeType["FRAME"] = "FRAME";
    FigmaNodeType["TEXT"] = "TEXT";
    FigmaNodeType["RECTANGLE"] = "RECTANGLE";
    FigmaNodeType["ELLIPSE"] = "ELLIPSE";
    FigmaNodeType["COMPONENT"] = "COMPONENT";
    FigmaNodeType["INSTANCE"] = "INSTANCE";
    FigmaNodeType["GROUP"] = "GROUP";
    FigmaNodeType["VECTOR"] = "VECTOR";
})(FigmaNodeType || (FigmaNodeType = {}));
/**
 * Figma Variable types
 */
export var VariableType;
(function (VariableType) {
    VariableType["COLOR"] = "COLOR";
    VariableType["FLOAT"] = "FLOAT";
    VariableType["STRING"] = "STRING";
    VariableType["BOOLEAN"] = "BOOLEAN";
})(VariableType || (VariableType = {}));
/**
 * Figma Variable scopes
 */
export var VariableScope;
(function (VariableScope) {
    VariableScope["ALL_FILLS"] = "ALL_FILLS";
    VariableScope["FRAME_FILL"] = "FRAME_FILL";
    VariableScope["SHAPE_FILL"] = "SHAPE_FILL";
    VariableScope["TEXT_FILL"] = "TEXT_FILL";
    VariableScope["ALL_STROKES"] = "ALL_STROKES";
    VariableScope["STROKE_COLOR"] = "STROKE_COLOR";
    VariableScope["FONT_FAMILY"] = "FONT_FAMILY";
    VariableScope["FONT_SIZE"] = "FONT_SIZE";
    VariableScope["FONT_WEIGHT"] = "FONT_WEIGHT";
    VariableScope["LINE_HEIGHT"] = "LINE_HEIGHT";
    VariableScope["LETTER_SPACING"] = "LETTER_SPACING";
    VariableScope["CORNER_RADIUS"] = "CORNER_RADIUS";
    VariableScope["WIDTH_HEIGHT"] = "WIDTH_HEIGHT";
    VariableScope["GAP"] = "GAP";
})(VariableScope || (VariableScope = {}));
/**
 * Widget to Figma node type mapping
 */
export const WIDGET_TO_FIGMA_MAPPING = {
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
export const LAYOUT_TO_AUTOLAYOUT_MAPPING = {
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

import { NodeFactory } from '../node-factory';
import { Widget, WidgetType, StyleInfo, LayoutInfo, ColorInfo, TypographyInfo, BorderInfo } from '../../schema/types';
import { FigmaNodeType } from '../figma-node-spec';

describe('NodeFactory', () => {
  let nodeFactory: NodeFactory;

  beforeEach(() => {
    nodeFactory = new NodeFactory();
  });

  describe('createFrame', () => {
    it('should create a basic frame node from a Container widget', () => {
      const widget: Widget = {
        id: 'container-1',
        type: WidgetType.CONTAINER,
        properties: {
          width: 100,
          height: 100
        },
        children: [],
        styling: {
          colors: [{
            property: 'backgroundColor',
            value: '#FF0000',
            isThemeReference: false
          }]
        }
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.type).toBe(FigmaNodeType.FRAME);
      expect(result.name).toBe('Container');
      expect(result.properties.width).toBe(100);
      expect(result.properties.height).toBe(100);
      expect(result.properties.fills).toHaveLength(1);
      expect(result.properties.fills[0].color).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should create frame with Auto Layout for Row widget', () => {
      const widget: Widget = {
        id: 'row-1',
        type: WidgetType.ROW,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout: {
          type: 'row',
          direction: 'horizontal',
          spacing: 8,
          alignment: {
            mainAxis: 'center',
            crossAxis: 'center'
          }
        }
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.autoLayout).toBeDefined();
      expect(result.autoLayout?.layoutMode).toBe('HORIZONTAL');
      expect(result.autoLayout?.itemSpacing).toBe(8);
      expect(result.autoLayout?.primaryAxisAlignItems).toBe('CENTER');
      expect(result.autoLayout?.counterAxisAlignItems).toBe('CENTER');
    });

    it('should create frame with padding from layout info', () => {
      const widget: Widget = {
        id: 'column-1',
        type: WidgetType.COLUMN,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout: {
          type: 'column',
          padding: {
            top: 16,
            right: 12,
            bottom: 16,
            left: 12
          }
        }
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.autoLayout?.paddingTop).toBe(16);
      expect(result.autoLayout?.paddingRight).toBe(12);
      expect(result.autoLayout?.paddingBottom).toBe(16);
      expect(result.autoLayout?.paddingLeft).toBe(12);
    });

    it('should handle nested children', () => {
      const childWidget: Widget = {
        id: 'child-1',
        type: WidgetType.TEXT,
        properties: { data: 'Hello' },
        children: [],
        styling: { colors: [] }
      };

      const parentWidget: Widget = {
        id: 'parent-1',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [childWidget],
        styling: { colors: [] }
      };

      const result = nodeFactory.createFrame(parentWidget);

      expect(result.children).toHaveLength(1);
      expect(result.children![0].type).toBe(FigmaNodeType.TEXT);
    });
  });

  describe('createText', () => {
    it('should create a text node with basic properties', () => {
      const widget: Widget = {
        id: 'text-1',
        type: WidgetType.TEXT,
        properties: {
          data: 'Hello World'
        },
        children: [],
        styling: {
          colors: [{
            property: 'color',
            value: '#333333',
            isThemeReference: false
          }],
          typography: {
            fontSize: 16,
            fontFamily: 'Roboto',
            fontWeight: 'bold',
            isThemeReference: false
          }
        }
      };

      const result = nodeFactory.createText(widget);

      expect(result.type).toBe(FigmaNodeType.TEXT);
      expect(result.properties.characters).toBe('Hello World');
      expect(result.properties.fontSize).toBe(16);
      expect(result.properties.fontName.family).toBe('Roboto');
      expect(result.properties.fontName.style).toBe('Bold');
      expect(result.properties.fills[0].color).toEqual({ 
        r: 0.2, 
        g: 0.2, 
        b: 0.2 
      });
    });

    it('should handle text alignment', () => {
      const widget: Widget = {
        id: 'text-2',
        type: WidgetType.TEXT,
        properties: {
          data: 'Centered Text',
          textAlign: 'center'
        },
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createText(widget);

      expect(result.properties.textAlignHorizontal).toBe('CENTER');
    });

    it('should use default values for missing typography', () => {
      const widget: Widget = {
        id: 'text-3',
        type: WidgetType.TEXT,
        properties: {
          data: 'Default Text'
        },
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createText(widget);

      expect(result.properties.fontSize).toBe(14);
      expect(result.properties.fontName.family).toBe('Inter');
      expect(result.properties.fontName.style).toBe('Regular');
    });

    it('should generate descriptive names for text nodes', () => {
      const widget: Widget = {
        id: 'text-4',
        type: WidgetType.TEXT,
        properties: {
          data: 'This is a very long text that should be truncated'
        },
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createText(widget);

      expect(result.name).toBe('Text "This is a very long ..."');
    });
  });

  describe('createRectangle', () => {
    it('should create a rectangle node for Image widget', () => {
      const widget: Widget = {
        id: 'image-1',
        type: WidgetType.IMAGE,
        properties: {
          width: 200,
          height: 150
        },
        children: [],
        styling: {
          colors: [],
          borders: {
            width: 2,
            color: '#CCCCCC',
            radius: {
              topLeft: 8,
              topRight: 8,
              bottomLeft: 8,
              bottomRight: 8
            }
          }
        }
      };

      const result = nodeFactory.createRectangle(widget);

      expect(result.type).toBe(FigmaNodeType.RECTANGLE);
      expect(result.properties.width).toBe(200);
      expect(result.properties.height).toBe(150);
      expect(result.properties.cornerRadius).toBe(8);
      expect(result.properties.strokes).toHaveLength(1);
      expect(result.properties.strokes[0].color).toEqual({ 
        r: 0.8, 
        g: 0.8, 
        b: 0.8 
      });
    });
  });

  describe('createComponent', () => {
    it('should create a component node for reusable widgets', () => {
      const widget: Widget = {
        id: 'button-1',
        type: WidgetType.BUTTON,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createComponent(widget);

      expect(result.type).toBe(FigmaNodeType.COMPONENT);
      expect(result.name).toBe('ElevatedButton Component');
      expect(result.properties.description).toContain('ElevatedButton widget');
    });
  });

  describe('createAutoLayoutSpec', () => {
    it('should create horizontal Auto Layout for Row', () => {
      const layout: LayoutInfo = {
        type: 'row',
        direction: 'horizontal',
        spacing: 12,
        alignment: {
          mainAxis: 'spaceBetween',
          crossAxis: 'stretch'
        }
      };

      const result = nodeFactory.createAutoLayoutSpec(layout);

      expect(result.layoutMode).toBe('HORIZONTAL');
      expect(result.itemSpacing).toBe(12);
      expect(result.primaryAxisAlignItems).toBe('SPACE_BETWEEN');
      expect(result.counterAxisAlignItems).toBe('MIN'); // stretch maps to MIN
    });

    it('should create vertical Auto Layout for Column', () => {
      const layout: LayoutInfo = {
        type: 'column',
        direction: 'vertical',
        spacing: 8,
        alignment: {
          mainAxis: 'end',
          crossAxis: 'center'
        }
      };

      const result = nodeFactory.createAutoLayoutSpec(layout);

      expect(result.layoutMode).toBe('VERTICAL');
      expect(result.itemSpacing).toBe(8);
      expect(result.primaryAxisAlignItems).toBe('MAX');
      expect(result.counterAxisAlignItems).toBe('CENTER');
    });
  });

  describe('createNode', () => {
    it('should route to correct creation method based on widget type', () => {
      const textWidget: Widget = {
        id: 'text-1',
        type: WidgetType.TEXT,
        properties: { data: 'Test' },
        children: [],
        styling: { colors: [] }
      };

      const frameWidget: Widget = {
        id: 'container-1',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const textResult = nodeFactory.createNode(textWidget);
      const frameResult = nodeFactory.createNode(frameWidget);

      expect(textResult.type).toBe(FigmaNodeType.TEXT);
      expect(frameResult.type).toBe(FigmaNodeType.FRAME);
    });
  });

  describe('color conversion', () => {
    it('should convert hex colors to RGB correctly', () => {
      const widget: Widget = {
        id: 'test-1',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: {
          colors: [
            { property: 'backgroundColor', value: '#FF0000', isThemeReference: false },
            { property: 'backgroundColor', value: '#00FF00', isThemeReference: false },
            { property: 'backgroundColor', value: '#0000FF', isThemeReference: false }
          ]
        }
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.properties.fills[0].color).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should handle 3-digit hex colors', () => {
      const widget: Widget = {
        id: 'test-2',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: {
          colors: [{
            property: 'backgroundColor',
            value: '#F0F',
            isThemeReference: false
          }]
        }
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.properties.fills[0].color).toEqual({ r: 1, g: 0, b: 1 });
    });
  });

  describe('edge cases', () => {
    it('should handle widgets with no styling', () => {
      const widget: Widget = {
        id: 'empty-1',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.properties.fills[0].opacity).toBe(0); // Transparent fill
    });

    it('should handle widgets with missing properties', () => {
      const widget: Widget = {
        id: 'minimal-1',
        type: WidgetType.TEXT,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createText(widget);

      expect(result.properties.characters).toBe('Text'); // Default text
      expect(result.properties.fontSize).toBe(14); // Default font size
    });
  });
});
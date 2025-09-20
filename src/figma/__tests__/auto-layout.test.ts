import { NodeFactory } from '../node-factory';
import { Widget, WidgetType, LayoutInfo } from '../../schema/types';
import { FigmaNodeType } from '../figma-node-spec';

describe('NodeFactory - Auto Layout', () => {
  let nodeFactory: NodeFactory;

  beforeEach(() => {
    nodeFactory = new NodeFactory();
  });

  describe('applyAutoLayout', () => {
    it('should apply horizontal Auto Layout for Row widgets', () => {
      const layout: LayoutInfo = {
        type: 'row',
        direction: 'horizontal',
        spacing: 16,
        alignment: {
          mainAxis: 'spaceBetween',
          crossAxis: 'center'
        },
        padding: {
          top: 8,
          right: 12,
          bottom: 8,
          left: 12
        }
      };

      const widget: Widget = {
        id: 'row-1',
        type: WidgetType.ROW,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.autoLayout?.layoutMode).toBe('HORIZONTAL');
      expect(result.autoLayout?.itemSpacing).toBe(16);
      expect(result.autoLayout?.primaryAxisAlignItems).toBe('SPACE_BETWEEN');
      expect(result.autoLayout?.counterAxisAlignItems).toBe('CENTER');
      expect(result.autoLayout?.paddingTop).toBe(8);
      expect(result.autoLayout?.paddingRight).toBe(12);
      expect(result.autoLayout?.paddingBottom).toBe(8);
      expect(result.autoLayout?.paddingLeft).toBe(12);
    });

    it('should apply vertical Auto Layout for Column widgets', () => {
      const layout: LayoutInfo = {
        type: 'column',
        direction: 'vertical',
        spacing: 12,
        alignment: {
          mainAxis: 'center',
          crossAxis: 'stretch'
        }
      };

      const widget: Widget = {
        id: 'column-1',
        type: WidgetType.COLUMN,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.autoLayout?.layoutMode).toBe('VERTICAL');
      expect(result.autoLayout?.itemSpacing).toBe(12);
      expect(result.autoLayout?.primaryAxisAlignItems).toBe('CENTER');
      expect(result.autoLayout?.counterAxisAlignItems).toBe('MIN'); // stretch maps to MIN
    });

    it('should handle fixed sizing constraints', () => {
      const layout: LayoutInfo = {
        type: 'column',
        width: 300,
        height: 200,
        alignment: {
          crossAxis: 'stretch'
        }
      };

      const widget: Widget = {
        id: 'fixed-column',
        type: WidgetType.COLUMN,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.autoLayout?.counterAxisSizingMode).toBe('FIXED');
      expect(result.properties.width).toBe(300);
      expect(result.properties.height).toBe(200);
      expect(result.properties.layoutSizingHorizontal).toBe('FIXED');
      expect(result.properties.layoutSizingVertical).toBe('FIXED');
    });

    it('should apply min/max constraints', () => {
      const layout: LayoutInfo = {
        type: 'row',
        minWidth: 100,
        maxWidth: 500,
        minHeight: 50,
        maxHeight: 200
      };

      const widget: Widget = {
        id: 'constrained-row',
        type: WidgetType.ROW,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.properties.minWidth).toBe(100);
      expect(result.properties.maxWidth).toBe(500);
      expect(result.properties.minHeight).toBe(50);
      expect(result.properties.maxHeight).toBe(200);
    });
  });

  describe('applyFlexProperties', () => {
    it('should apply flex properties to child widgets in Row', () => {
      const childWidget: Widget = {
        id: 'flex-child',
        type: WidgetType.CONTAINER,
        properties: {
          flex: 2
        },
        children: [],
        styling: { colors: [] }
      };

      const parentWidget: Widget = {
        id: 'row-parent',
        type: WidgetType.ROW,
        properties: {},
        children: [childWidget],
        styling: { colors: [] },
        layout: {
          type: 'row'
        }
      };

      const result = nodeFactory.createFrame(parentWidget);

      expect(result.children![0].properties.layoutGrow).toBe(2);
      expect(result.children![0].properties.layoutSizingHorizontal).toBe('FILL');
    });

    it('should apply flex properties to child widgets in Column', () => {
      const childWidget: Widget = {
        id: 'flex-child',
        type: WidgetType.CONTAINER,
        properties: {
          flex: 3
        },
        children: [],
        styling: { colors: [] }
      };

      const parentWidget: Widget = {
        id: 'column-parent',
        type: WidgetType.COLUMN,
        properties: {},
        children: [childWidget],
        styling: { colors: [] },
        layout: {
          type: 'column'
        }
      };

      const result = nodeFactory.createFrame(parentWidget);

      expect(result.children![0].properties.layoutGrow).toBe(3);
      expect(result.children![0].properties.layoutSizingVertical).toBe('FILL');
    });
  });

  describe('handleExpandedWidget', () => {
    it('should handle Expanded widgets in Row layout', () => {
      const expandedChild: Widget = {
        id: 'expanded-child',
        type: WidgetType.CUSTOM,
        properties: {
          isExpanded: true,
          flex: 1
        },
        children: [],
        styling: { colors: [] }
      };

      const parentWidget: Widget = {
        id: 'row-with-expanded',
        type: WidgetType.ROW,
        properties: {},
        children: [expandedChild],
        styling: { colors: [] },
        layout: {
          type: 'row'
        }
      };

      const result = nodeFactory.createFrame(parentWidget);

      expect(result.children![0].properties.layoutGrow).toBe(1);
      expect(result.children![0].properties.layoutSizingHorizontal).toBe('FILL');
    });

    it('should handle Expanded widgets in Column layout', () => {
      const expandedChild: Widget = {
        id: 'expanded-child',
        type: WidgetType.CUSTOM,
        properties: {
          isExpanded: true,
          flex: 2
        },
        children: [],
        styling: { colors: [] }
      };

      const parentWidget: Widget = {
        id: 'column-with-expanded',
        type: WidgetType.COLUMN,
        properties: {},
        children: [expandedChild],
        styling: { colors: [] },
        layout: {
          type: 'column'
        }
      };

      const result = nodeFactory.createFrame(parentWidget);

      expect(result.children![0].properties.layoutGrow).toBe(2);
      expect(result.children![0].properties.layoutSizingVertical).toBe('FILL');
    });

    it('should default to flex: 1 for Expanded widgets without explicit flex', () => {
      const expandedChild: Widget = {
        id: 'expanded-default',
        type: WidgetType.CUSTOM,
        properties: {
          isExpanded: true
        },
        children: [],
        styling: { colors: [] }
      };

      const parentWidget: Widget = {
        id: 'row-with-default-expanded',
        type: WidgetType.ROW,
        properties: {},
        children: [expandedChild],
        styling: { colors: [] },
        layout: {
          type: 'row'
        }
      };

      const result = nodeFactory.createFrame(parentWidget);

      expect(result.children![0].properties.layoutGrow).toBe(1);
    });
  });

  describe('applyWrapLayout', () => {
    it('should apply wrap layout properties', () => {
      const layout: LayoutInfo = {
        type: 'wrap',
        spacing: 8
      };

      const widget: Widget = {
        id: 'wrap-widget',
        type: WidgetType.CUSTOM,
        properties: {},
        children: [],
        styling: { colors: [] },
        layout
      };

      const result = nodeFactory.createFrame(widget);

      expect(result.properties.layoutWrap).toBe('WRAP');
      expect(result.properties.itemSpacing).toBe(8);
      expect(result.properties.counterAxisSpacing).toBe(8);
    });
  });

  describe('complex layout scenarios', () => {
    it('should handle nested layouts with flex children', () => {
      const flexChild: Widget = {
        id: 'flex-text',
        type: WidgetType.TEXT,
        properties: {
          data: 'Flexible Text',
          flex: 1
        },
        children: [],
        styling: { colors: [] }
      };

      const fixedChild: Widget = {
        id: 'fixed-container',
        type: WidgetType.CONTAINER,
        properties: {
          width: 100
        },
        children: [],
        styling: { colors: [] }
      };

      const rowWidget: Widget = {
        id: 'complex-row',
        type: WidgetType.ROW,
        properties: {},
        children: [flexChild, fixedChild],
        styling: { colors: [] },
        layout: {
          type: 'row',
          spacing: 12,
          alignment: {
            mainAxis: 'spaceBetween',
            crossAxis: 'center'
          }
        }
      };

      const result = nodeFactory.createFrame(rowWidget);

      // Check row properties
      expect(result.autoLayout?.layoutMode).toBe('HORIZONTAL');
      expect(result.autoLayout?.itemSpacing).toBe(12);
      expect(result.autoLayout?.primaryAxisAlignItems).toBe('SPACE_BETWEEN');

      // Check flex child
      expect(result.children![0].properties.layoutGrow).toBe(1);
      expect(result.children![0].properties.layoutSizingHorizontal).toBe('FILL');

      // Check fixed child
      expect(result.children![1].properties.width).toBe(100);
      expect(result.children![1].properties.layoutGrow).toBeUndefined();
    });

    it('should handle alignment variations', () => {
      const alignmentTests = [
        { mainAxis: 'start', expected: 'MIN' },
        { mainAxis: 'center', expected: 'CENTER' },
        { mainAxis: 'end', expected: 'MAX' },
        { mainAxis: 'spaceBetween', expected: 'SPACE_BETWEEN' }
      ];

      alignmentTests.forEach(({ mainAxis, expected }) => {
        const widget: Widget = {
          id: `alignment-${mainAxis}`,
          type: WidgetType.ROW,
          properties: {},
          children: [],
          styling: { colors: [] },
          layout: {
            type: 'row',
            alignment: {
              mainAxis: mainAxis as any
            }
          }
        };

        const result = nodeFactory.createFrame(widget);
        expect(result.autoLayout?.primaryAxisAlignItems).toBe(expected);
      });
    });
  });
});
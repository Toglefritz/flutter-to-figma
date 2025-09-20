import { NodeFactory } from '../node-factory';
import { Widget, WidgetType, PositionInfo } from '../../schema/types';
import { FigmaNodeType, FigmaNodeSpec } from '../figma-node-spec';

describe('NodeFactory - Positioned Layout', () => {
  let nodeFactory: NodeFactory;

  beforeEach(() => {
    nodeFactory = new NodeFactory();
  });

  describe('createStackLayout', () => {
    it('should create a Stack frame with absolute positioning disabled', () => {
      const widget: Widget = {
        id: 'stack-1',
        type: WidgetType.STACK,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const result = nodeFactory.createStackLayout(widget);

      expect(result.type).toBe(FigmaNodeType.FRAME);
      expect(result.properties.layoutMode).toBe('NONE');
      expect(result.properties.clipsContent).toBe(true);
    });

    it('should apply z-index ordering to children', () => {
      const child1: Widget = {
        id: 'child-1',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const child2: Widget = {
        id: 'child-2',
        type: WidgetType.TEXT,
        properties: { data: 'Text' },
        children: [],
        styling: { colors: [] }
      };

      const stackWidget: Widget = {
        id: 'stack-with-children',
        type: WidgetType.STACK,
        properties: {},
        children: [child1, child2],
        styling: { colors: [] }
      };

      const result = nodeFactory.createStackLayout(stackWidget);

      expect(result.children![0].properties.zIndex).toBe(0);
      expect(result.children![1].properties.zIndex).toBe(1);
    });
  });

  describe('applyAbsolutePositioning', () => {
    it('should apply left and top positioning', () => {
      const widget: Widget = {
        id: 'positioned-widget',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] },
        position: {
          left: 20,
          top: 30,
          width: 100,
          height: 80
        }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyAbsolutePositioning(nodeSpec, widget, 0);

      expect(nodeSpec.properties.x).toBe(20);
      expect(nodeSpec.properties.y).toBe(30);
      expect(nodeSpec.properties.width).toBe(100);
      expect(nodeSpec.properties.height).toBe(80);
      expect(nodeSpec.properties.constraints.horizontal).toBe('LEFT');
      expect(nodeSpec.properties.constraints.vertical).toBe('TOP');
    });

    it('should apply right and bottom positioning', () => {
      const widget: Widget = {
        id: 'positioned-widget',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] },
        position: {
          right: 15,
          bottom: 25,
          width: 100,
          height: 80
        }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyAbsolutePositioning(nodeSpec, widget, 1);

      expect(nodeSpec.properties.x).toBe(-115); // -right - width
      expect(nodeSpec.properties.y).toBe(-105); // -bottom - height
      expect(nodeSpec.properties.width).toBe(100);
      expect(nodeSpec.properties.height).toBe(80);
      expect(nodeSpec.properties.constraints.horizontal).toBe('RIGHT');
      expect(nodeSpec.properties.constraints.vertical).toBe('BOTTOM');
      expect(nodeSpec.properties.zIndex).toBe(1);
    });

    it('should handle mixed positioning constraints', () => {
      const widget: Widget = {
        id: 'mixed-positioned',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] },
        position: {
          left: 10,
          bottom: 20,
          width: 150
        }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyAbsolutePositioning(nodeSpec, widget, 0);

      expect(nodeSpec.properties.x).toBe(10);
      expect(nodeSpec.properties.width).toBe(150);
      expect(nodeSpec.properties.constraints.horizontal).toBe('LEFT');
      expect(nodeSpec.properties.constraints.vertical).toBe('BOTTOM');
    });
  });

  describe('handlePositionedWidget', () => {
    it('should handle Positioned widget properties', () => {
      const widget: Widget = {
        id: 'positioned-custom',
        type: WidgetType.CUSTOM,
        properties: {
          isPositioned: true,
          positioned: {
            left: 50,
            top: 60,
            width: 200,
            height: 150
          }
        },
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.handlePositionedWidget(nodeSpec, widget);

      expect(nodeSpec.properties.x).toBe(50);
      expect(nodeSpec.properties.y).toBe(60);
      expect(nodeSpec.properties.width).toBe(200);
      expect(nodeSpec.properties.height).toBe(150);
      expect(nodeSpec.properties.constraints.horizontal).toBe('LEFT');
      expect(nodeSpec.properties.constraints.vertical).toBe('TOP');
    });

    it('should handle right and bottom constraints in Positioned widget', () => {
      const widget: Widget = {
        id: 'positioned-right-bottom',
        type: WidgetType.CUSTOM,
        properties: {
          isPositioned: true,
          positioned: {
            right: 30,
            bottom: 40
          }
        },
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.handlePositionedWidget(nodeSpec, widget);

      expect(nodeSpec.properties.constraints.horizontal).toBe('RIGHT');
      expect(nodeSpec.properties.constraints.vertical).toBe('BOTTOM');
    });

    it('should skip non-positioned widgets', () => {
      const widget: Widget = {
        id: 'regular-widget',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.handlePositionedWidget(nodeSpec, widget);

      expect(nodeSpec.properties.x).toBeUndefined();
      expect(nodeSpec.properties.y).toBeUndefined();
      expect(nodeSpec.properties.constraints).toBeUndefined();
    });
  });

  describe('applyStackAlignment', () => {
    it('should apply topLeft alignment', () => {
      const widget: Widget = {
        id: 'aligned-widget',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyStackAlignment(nodeSpec, widget, 'topLeft');

      expect(nodeSpec.properties.x).toBe(0);
      expect(nodeSpec.properties.y).toBe(0);
    });

    it('should apply center alignment', () => {
      const widget: Widget = {
        id: 'centered-widget',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyStackAlignment(nodeSpec, widget, 'center');

      expect(nodeSpec.properties.constraints.horizontal).toBe('CENTER');
      expect(nodeSpec.properties.constraints.vertical).toBe('CENTER');
    });

    it('should apply bottomRight alignment', () => {
      const widget: Widget = {
        id: 'bottom-right-widget',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyStackAlignment(nodeSpec, widget, 'bottomRight');

      expect(nodeSpec.properties.constraints.horizontal).toBe('RIGHT');
      expect(nodeSpec.properties.constraints.vertical).toBe('BOTTOM');
    });

    it('should skip alignment for positioned widgets', () => {
      const widget: Widget = {
        id: 'positioned-widget',
        type: WidgetType.CONTAINER,
        properties: {
          isPositioned: true
        },
        children: [],
        styling: { colors: [] }
      };

      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test',
        properties: {}
      };

      nodeFactory.applyStackAlignment(nodeSpec, widget, 'center');

      expect(nodeSpec.properties.constraints).toBeUndefined();
    });
  });

  describe('complex positioned layouts', () => {
    it('should handle Stack with mixed positioned and aligned children', () => {
      const positionedChild: Widget = {
        id: 'positioned-child',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] },
        position: {
          right: 20,
          top: 30,
          width: 100,
          height: 50
        }
      };

      const alignedChild: Widget = {
        id: 'aligned-child',
        type: WidgetType.TEXT,
        properties: { data: 'Centered Text' },
        children: [],
        styling: { colors: [] }
      };

      const stackWidget: Widget = {
        id: 'complex-stack',
        type: WidgetType.STACK,
        properties: {
          alignment: 'center'
        },
        children: [positionedChild, alignedChild],
        styling: { colors: [] }
      };

      const result = nodeFactory.createStackLayout(stackWidget);

      // Check positioned child
      expect(result.children![0].properties.constraints.horizontal).toBe('RIGHT');
      expect(result.children![0].properties.constraints.vertical).toBe('TOP');
      expect(result.children![0].properties.width).toBe(100);
      expect(result.children![0].properties.height).toBe(50);

      // Check z-index ordering
      expect(result.children![0].properties.zIndex).toBe(0);
      expect(result.children![1].properties.zIndex).toBe(1);
    });

    it('should handle nested Stack widgets', () => {
      const innerChild: Widget = {
        id: 'inner-child',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [],
        styling: { colors: [] },
        position: {
          left: 10,
          top: 10
        }
      };

      const innerStack: Widget = {
        id: 'inner-stack',
        type: WidgetType.STACK,
        properties: {},
        children: [innerChild],
        styling: { colors: [] }
      };

      const outerStack: Widget = {
        id: 'outer-stack',
        type: WidgetType.STACK,
        properties: {},
        children: [innerStack],
        styling: { colors: [] }
      };

      const result = nodeFactory.createStackLayout(outerStack);

      expect(result.children![0].type).toBe(FigmaNodeType.FRAME);
      expect(result.children![0].properties.layoutMode).toBe('NONE');
      expect(result.children![0].children![0].properties.x).toBe(10);
      expect(result.children![0].children![0].properties.y).toBe(10);
    });
  });

  describe('extractPositionFromProperties', () => {
    it('should extract position from positioned property', () => {
      const widget: Widget = {
        id: 'test-widget',
        type: WidgetType.CUSTOM,
        properties: {
          positioned: {
            left: 25,
            top: 35,
            width: 120,
            height: 90
          }
        },
        children: [],
        styling: { colors: [] }
      };

      const nodeFactory = new NodeFactory();
      const position = (nodeFactory as any).extractPositionFromProperties(widget);

      expect(position).toEqual({
        left: 25,
        top: 35,
        width: 120,
        height: 90,
        right: undefined,
        bottom: undefined
      });
    });

    it('should extract position from direct properties', () => {
      const widget: Widget = {
        id: 'test-widget',
        type: WidgetType.CONTAINER,
        properties: {
          left: 15,
          bottom: 25,
          width: 80
        },
        children: [],
        styling: { colors: [] }
      };

      const nodeFactory = new NodeFactory();
      const position = (nodeFactory as any).extractPositionFromProperties(widget);

      expect(position).toEqual({
        left: 15,
        bottom: 25,
        width: 80,
        right: undefined,
        top: undefined,
        height: undefined
      });
    });

    it('should return null for widgets without position info', () => {
      const widget: Widget = {
        id: 'test-widget',
        type: WidgetType.CONTAINER,
        properties: {
          width: 100,
          height: 100
        },
        children: [],
        styling: { colors: [] }
      };

      const nodeFactory = new NodeFactory();
      const position = (nodeFactory as any).extractPositionFromProperties(widget);

      expect(position).toBeNull();
    });
  });
});
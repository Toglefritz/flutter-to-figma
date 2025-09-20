import { ComponentBuilder } from '../component-builder';
import { NodeFactory } from '../node-factory';
import { ReusableWidget, Widget, WidgetType, WidgetVariant, StyleInfo, ColorInfo, TypographyInfo } from '../../schema/types';
import { FigmaNodeType, FigmaComponentSpec, ComponentVariant } from '../figma-node-spec';

describe('ComponentBuilder', () => {
  let componentBuilder: ComponentBuilder;
  let mockNodeFactory: jest.Mocked<NodeFactory>;

  beforeEach(() => {
    mockNodeFactory = {
      createNode: jest.fn(),
      createFrame: jest.fn(),
      createText: jest.fn(),
      createRectangle: jest.fn(),
      createComponent: jest.fn(),
      createAutoLayoutSpec: jest.fn(),
      applyAutoLayout: jest.fn()
    } as any;

    componentBuilder = new ComponentBuilder(mockNodeFactory);
  });

  describe('createComponent', () => {
    it('should create a basic component from a reusable widget', () => {
      const reusableWidget: ReusableWidget = {
        id: 'button-1',
        type: WidgetType.BUTTON,
        name: 'PrimaryButton',
        properties: {
          width: 120,
          height: 40
        },
        children: [],
        styling: {
          colors: [{
            property: 'backgroundColor',
            value: '#007AFF',
            isThemeReference: false
          }]
        },
        variants: [],
        usageCount: 5
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'PrimaryButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.name).toBe('PrimaryButton');
      expect(result.description).toContain('ElevatedButton widget');
      expect(result.description).toContain('Used 5 times');
      expect(result.variants).toHaveLength(1); // Default variant
      expect(result.variants![0].name).toBe('Default');
    });

    it('should create component with multiple variants', () => {
      const variants: WidgetVariant[] = [
        {
          name: 'Primary',
          properties: { style: 'primary' },
          styling: {
            colors: [{
              property: 'backgroundColor',
              value: '#007AFF',
              isThemeReference: false
            }]
          }
        },
        {
          name: 'Secondary',
          properties: { style: 'secondary' },
          styling: {
            colors: [{
              property: 'backgroundColor',
              value: '#6C757D',
              isThemeReference: false
            }]
          }
        }
      ];

      const reusableWidget: ReusableWidget = {
        id: 'button-2',
        type: WidgetType.BUTTON,
        name: 'ActionButton',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants,
        usageCount: 3
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'ActionButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.variants).toHaveLength(3); // Default + 2 variants
      expect(result.variants![1].name).toBe('Primary');
      expect(result.variants![2].name).toBe('Secondary');
      expect(result.variants![1].properties).toEqual({ style: 'primary', Variant: 'Primary' });
    });

    it('should extract component properties from variants', () => {
      const variants: WidgetVariant[] = [
        {
          name: 'Large',
          properties: { size: 'large', disabled: false },
          styling: { colors: [] }
        },
        {
          name: 'Small',
          properties: { size: 'small', disabled: true },
          styling: { colors: [] }
        }
      ];

      const reusableWidget: ReusableWidget = {
        id: 'button-3',
        type: WidgetType.BUTTON,
        name: 'SizeButton',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants,
        usageCount: 2
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'SizeButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.properties!.length).toBeGreaterThanOrEqual(2);
      
      const sizeProperty = result.properties?.find(p => p.name === 'Size');
      expect(sizeProperty?.type).toBe('VARIANT');
      expect(sizeProperty?.variantOptions).toEqual(['large', 'small']);
      
      const disabledProperty = result.properties?.find(p => p.name === 'Disabled');
      expect(disabledProperty?.type).toBe('BOOLEAN');
    });

    it('should add text property for widgets with text content', () => {
      const textChild: Widget = {
        id: 'text-1',
        type: WidgetType.TEXT,
        properties: { data: 'Button Text' },
        children: [],
        styling: { colors: [] }
      };

      const reusableWidget: ReusableWidget = {
        id: 'text-button-1',
        type: WidgetType.BUTTON,
        name: 'TextButton',
        properties: {},
        children: [textChild],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'TextButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      const textProperty = result.properties?.find(p => p.name === 'Text');
      expect(textProperty?.type).toBe('TEXT');
      expect(textProperty?.defaultValue).toBe('Button Text');
    });

    it('should generate component name from widget type when name is not provided', () => {
      const reusableWidget: ReusableWidget = {
        id: 'card-1',
        type: WidgetType.CARD,
        name: 'Card', // Same as type
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'Card Component',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.name).toBe('Card Component');
    });

    it('should infer usage context for button components', () => {
      const reusableWidget: ReusableWidget = {
        id: 'primary-button-1',
        type: WidgetType.BUTTON,
        name: 'Button',
        properties: { style: 'primary' },
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'ElevatedButton / Primary',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.name).toBe('ElevatedButton / Primary');
    });
  });

  describe('createComponentInstance', () => {
    it('should create a component instance with basic properties', () => {
      const widget: Widget = {
        id: 'button-instance-1',
        type: WidgetType.BUTTON,
        properties: {
          width: 100,
          height: 36,
          flex: 1
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

      const result = componentBuilder.createComponentInstance(widget, 'PrimaryButton');

      expect(result.type).toBe(FigmaNodeType.INSTANCE);
      expect(result.name).toBe('PrimaryButton');
      expect(result.properties.componentId).toContain('component-primarybutton-');
      expect(result.properties.width).toBe(100);
      expect(result.properties.height).toBe(36);
      expect(result.properties.layoutGrow).toBe(1);
    });

    it('should extract text overrides from widget content', () => {
      const textChild: Widget = {
        id: 'text-1',
        type: WidgetType.TEXT,
        properties: { data: 'Click Me' },
        children: [],
        styling: { colors: [] }
      };

      const widget: Widget = {
        id: 'button-instance-2',
        type: WidgetType.BUTTON,
        properties: {},
        children: [textChild],
        styling: { colors: [] }
      };

      const result = componentBuilder.createComponentInstance(widget, 'ActionButton');

      expect(result.properties.overrides.Text).toBe('Click Me');
      expect(result.name).toBe('ActionButton "Click Me"');
    });

    it('should extract color overrides from styling', () => {
      const widget: Widget = {
        id: 'button-instance-3',
        type: WidgetType.BUTTON,
        properties: {},
        children: [],
        styling: {
          colors: [
            {
              property: 'backgroundColor',
              value: '#00FF00',
              isThemeReference: false
            },
            {
              property: 'color',
              value: '#FFFFFF',
              isThemeReference: false
            }
          ]
        }
      };

      const result = componentBuilder.createComponentInstance(widget, 'CustomButton');

      expect(result.properties.overrides.Color_0).toBe('#00FF00');
      expect(result.properties.overrides.Color_1).toBe('#FFFFFF');
    });

    it('should use widget key in instance name when available', () => {
      const widget: Widget = {
        id: 'button-instance-4',
        type: WidgetType.BUTTON,
        properties: { key: 'submit-button' },
        children: [],
        styling: { colors: [] }
      };

      const result = componentBuilder.createComponentInstance(widget, 'SubmitButton');

      expect(result.name).toBe('SubmitButton (submit-button)');
    });

    it('should not include theme-referenced colors in overrides', () => {
      const widget: Widget = {
        id: 'button-instance-5',
        type: WidgetType.BUTTON,
        properties: {},
        children: [],
        styling: {
          colors: [
            {
              property: 'backgroundColor',
              value: 'primaryColor',
              isThemeReference: true,
              themePath: 'colorScheme.primary'
            }
          ]
        }
      };

      const result = componentBuilder.createComponentInstance(widget, 'ThemedButton');

      expect(result.properties.overrides.Color_0).toBeUndefined();
    });
  });

  describe('component naming', () => {
    it('should sanitize component names', () => {
      const reusableWidget: ReusableWidget = {
        id: 'special-1',
        type: WidgetType.BUTTON,
        name: 'My@Special#Button!',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'MySpecialButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.name).toBe('MySpecialButton');
    });

    it('should handle long text content in instance names', () => {
      const textChild: Widget = {
        id: 'long-text-1',
        type: WidgetType.TEXT,
        properties: { data: 'This is a very long text that should be truncated properly' },
        children: [],
        styling: { colors: [] }
      };

      const widget: Widget = {
        id: 'button-long-1',
        type: WidgetType.BUTTON,
        properties: {},
        children: [textChild],
        styling: { colors: [] }
      };

      const result = componentBuilder.createComponentInstance(widget, 'LongTextButton');

      expect(result.name).toBe('LongTextButton "This is a very long ..."');
    });
  });

  describe('variant creation', () => {
    it('should create variant node specs with modified properties', () => {
      const variant: WidgetVariant = {
        name: 'Disabled',
        properties: { disabled: true, opacity: 0.5 },
        styling: {
          colors: [{
            property: 'backgroundColor',
            value: '#CCCCCC',
            isThemeReference: false
          }]
        }
      };

      const reusableWidget: ReusableWidget = {
        id: 'button-variant-1',
        type: WidgetType.BUTTON,
        name: 'VariantButton',
        properties: { disabled: false },
        children: [],
        styling: {
          colors: [{
            property: 'backgroundColor',
            value: '#007AFF',
            isThemeReference: false
          }]
        },
        variants: [variant],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockImplementation((widget: Widget) => ({
        type: FigmaNodeType.COMPONENT,
        name: widget.properties.disabled ? 'Disabled Button' : 'Active Button',
        properties: { disabled: widget.properties.disabled }
      }));

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.variants).toHaveLength(2);
      expect(result.variants![1].name).toBe('Disabled');
      expect(result.variants![1].nodeSpec.name).toBe('Disabled Button');
      expect(result.variants![1].nodeSpec.properties.disabled).toBe(true);
    });
  });

  describe('text and icon detection', () => {
    it('should detect text content in nested children', () => {
      const nestedText: Widget = {
        id: 'nested-text-1',
        type: WidgetType.TEXT,
        properties: { data: 'Nested Text' },
        children: [],
        styling: { colors: [] }
      };

      const container: Widget = {
        id: 'container-1',
        type: WidgetType.CONTAINER,
        properties: {},
        children: [nestedText],
        styling: { colors: [] }
      };

      const reusableWidget: ReusableWidget = {
        id: 'complex-button-1',
        type: WidgetType.BUTTON,
        name: 'ComplexButton',
        properties: {},
        children: [container],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'ComplexButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      const textProperty = result.properties?.find(p => p.name === 'Text');
      expect(textProperty?.type).toBe('TEXT');
      expect(textProperty?.defaultValue).toBe('Nested Text');
    });

    it('should detect icon content', () => {
      const reusableWidget: ReusableWidget = {
        id: 'icon-button-1',
        type: WidgetType.BUTTON,
        name: 'IconButton',
        properties: { icon: 'star' },
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'IconButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      const iconProperty = result.properties?.find(p => p.name === 'Icon');
      expect(iconProperty?.type).toBe('INSTANCE_SWAP');
      expect(iconProperty?.defaultValue).toBe('icon-placeholder');
    });
  });

  describe('edge cases', () => {
    it('should handle widgets with no variants', () => {
      const reusableWidget: ReusableWidget = {
        id: 'simple-1',
        type: WidgetType.CONTAINER,
        name: 'SimpleContainer',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.FRAME,
        name: 'SimpleContainer',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      expect(result.variants).toHaveLength(1); // Only default variant
      expect(result.properties).toHaveLength(0); // No variant-based properties
    });

    it('should handle widgets with empty styling', () => {
      const widget: Widget = {
        id: 'empty-styling-1',
        type: WidgetType.BUTTON,
        properties: {},
        children: [],
        styling: { colors: [] }
      };

      const result = componentBuilder.createComponentInstance(widget, 'EmptyButton');

      expect(Object.keys(result.properties.overrides)).toHaveLength(0);
    });

    it('should handle missing text content gracefully', () => {
      const reusableWidget: ReusableWidget = {
        id: 'no-text-1',
        type: WidgetType.BUTTON,
        name: 'NoTextButton',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'NoTextButton',
        properties: {}
      });

      const result = componentBuilder.createComponent(reusableWidget);

      const textProperty = result.properties?.find(p => p.name === 'Text');
      expect(textProperty).toBeUndefined();
    });
  });
});
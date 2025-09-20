import { VariantManager, VariantGroup } from '../variant-manager';
import { NodeFactory } from '../node-factory';
import { ReusableWidget, Widget, WidgetType, WidgetVariant } from '../../schema/types';
import { FigmaNodeType, ComponentVariant, ComponentProperty } from '../figma-node-spec';

describe('VariantManager', () => {
  let variantManager: VariantManager;
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

    variantManager = new VariantManager(mockNodeFactory);
  });

  describe('createAdvancedVariants', () => {
    it('should create variants from property combinations', () => {
      const variants: WidgetVariant[] = [
        {
          name: 'Primary Large',
          properties: { style: 'primary', size: 'large' },
          styling: { colors: [] }
        },
        {
          name: 'Secondary Small',
          properties: { style: 'secondary', size: 'small' },
          styling: { colors: [] }
        }
      ];

      const reusableWidget: ReusableWidget = {
        id: 'button-1',
        type: WidgetType.BUTTON,
        name: 'VariantButton',
        properties: { style: 'primary', size: 'medium' },
        children: [],
        styling: { colors: [] },
        variants,
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'VariantButton',
        properties: {}
      });

      const result = variantManager.createAdvancedVariants(reusableWidget);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(v => v.properties.style === 'primary')).toBe(true);
      expect(result.some(v => v.properties.size === 'large')).toBe(true);
    });

    it('should create default variant when no variants exist', () => {
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

      const result = variantManager.createAdvancedVariants(reusableWidget);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Default');
      expect(result[0].properties.variant).toBe('default');
    });

    it('should limit variant combinations to prevent explosion', () => {
      // Create many variant properties to test the limit
      const variants: WidgetVariant[] = [];
      for (let i = 0; i < 20; i++) {
        variants.push({
          name: `Variant ${i}`,
          properties: { 
            prop1: `value${i % 3}`, 
            prop2: `value${i % 4}`, 
            prop3: `value${i % 5}` 
          },
          styling: { colors: [] }
        });
      }

      const reusableWidget: ReusableWidget = {
        id: 'complex-1',
        type: WidgetType.BUTTON,
        name: 'ComplexButton',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants,
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.COMPONENT,
        name: 'ComplexButton',
        properties: {}
      });

      const result = variantManager.createAdvancedVariants(reusableWidget);

      // Should be limited to 16 variants max
      expect(result.length).toBeLessThanOrEqual(16);
    });
  });

  describe('createVariantNamingSystem', () => {
    it('should generate descriptive names from properties', () => {
      const variants: ComponentVariant[] = [
        {
          name: '',
          properties: { style: 'primary', size: 'large' },
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        },
        {
          name: '',
          properties: { style: 'secondary', disabled: true },
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        }
      ];

      const result = variantManager.createVariantNamingSystem(variants);

      expect(result[0].name).toBe('Large Primary');
      expect(result[1].name).toBe('Disabled Secondary');
    });

    it('should handle boolean properties in names', () => {
      const variants: ComponentVariant[] = [
        {
          name: '',
          properties: { disabled: true, outlined: false },
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        }
      ];

      const result = variantManager.createVariantNamingSystem(variants);

      expect(result[0].name).toBe('Disabled NoOutlined');
    });

    it('should use Default for empty properties', () => {
      const variants: ComponentVariant[] = [
        {
          name: '',
          properties: {},
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        }
      ];

      const result = variantManager.createVariantNamingSystem(variants);

      expect(result[0].name).toBe('Default');
    });
  });

  describe('organizeVariants', () => {
    it('should group variants by primary property', () => {
      const variants: ComponentVariant[] = [
        {
          name: 'Primary Small',
          properties: { style: 'primary', size: 'small' },
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        },
        {
          name: 'Primary Large',
          properties: { style: 'primary', size: 'large' },
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        },
        {
          name: 'Secondary Small',
          properties: { style: 'secondary', size: 'small' },
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        }
      ];

      const result = variantManager.organizeVariants(variants);

      expect(result.length).toBeGreaterThan(0);
      
      // Should group by the most frequent property (style appears in all variants)
      const styleGroups = result.filter(group => group.property === 'style');
      expect(styleGroups.length).toBeGreaterThan(0);
    });

    it('should create single default group when no clear primary property', () => {
      const variants: ComponentVariant[] = [
        {
          name: 'Variant 1',
          properties: {},
          nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Test', properties: {} }
        }
      ];

      const result = variantManager.organizeVariants(variants);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Default');
      expect(result[0].variants).toHaveLength(1);
    });
  });

  describe('createVariantProperties', () => {
    it('should create boolean properties for boolean variants', () => {
      const reusableWidget: ReusableWidget = {
        id: 'toggle-1',
        type: WidgetType.BUTTON,
        name: 'ToggleButton',
        properties: { disabled: false },
        children: [],
        styling: { colors: [] },
        variants: [
          {
            name: 'Disabled',
            properties: { disabled: true },
            styling: { colors: [] }
          }
        ],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const disabledProperty = result.find(p => p.name === 'Disabled');
      expect(disabledProperty?.type).toBe('BOOLEAN');
      expect(disabledProperty?.defaultValue).toBe(false);
    });

    it('should create variant properties for string options', () => {
      const reusableWidget: ReusableWidget = {
        id: 'style-1',
        type: WidgetType.BUTTON,
        name: 'StyleButton',
        properties: { style: 'primary' },
        children: [],
        styling: { colors: [] },
        variants: [
          {
            name: 'Secondary',
            properties: { style: 'secondary' },
            styling: { colors: [] }
          },
          {
            name: 'Tertiary',
            properties: { style: 'tertiary' },
            styling: { colors: [] }
          }
        ],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const styleProperty = result.find(p => p.name === 'Style');
      expect(styleProperty?.type).toBe('VARIANT');
      expect(styleProperty?.variantOptions).toEqual(['primary', 'secondary', 'tertiary']);
    });

    it('should add semantic properties for button widgets', () => {
      const reusableWidget: ReusableWidget = {
        id: 'button-1',
        type: WidgetType.BUTTON,
        name: 'SemanticButton',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const stateProperty = result.find(p => p.name === 'State');
      expect(stateProperty?.type).toBe('VARIANT');
      expect(stateProperty?.variantOptions).toEqual(['default', 'hover', 'pressed', 'disabled']);

      const sizeProperty = result.find(p => p.name === 'Size');
      expect(sizeProperty?.type).toBe('VARIANT');
      expect(sizeProperty?.variantOptions).toEqual(['small', 'medium', 'large']);
    });

    it('should add semantic properties for card widgets', () => {
      const reusableWidget: ReusableWidget = {
        id: 'card-1',
        type: WidgetType.CARD,
        name: 'SemanticCard',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const elevationProperty = result.find(p => p.name === 'Elevation');
      expect(elevationProperty?.type).toBe('VARIANT');
      expect(elevationProperty?.variantOptions).toEqual(['none', 'low', 'medium', 'high']);
    });

    it('should add semantic properties for text widgets', () => {
      const reusableWidget: ReusableWidget = {
        id: 'text-1',
        type: WidgetType.TEXT,
        name: 'SemanticText',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const emphasisProperty = result.find(p => p.name === 'Emphasis');
      expect(emphasisProperty?.type).toBe('VARIANT');
      expect(emphasisProperty?.variantOptions).toEqual(['normal', 'bold', 'italic']);
    });

    it('should format property names correctly', () => {
      const reusableWidget: ReusableWidget = {
        id: 'camel-1',
        type: WidgetType.BUTTON,
        name: 'CamelCaseButton',
        properties: { isDisabled: false, backgroundColor: 'blue' },
        children: [],
        styling: { colors: [] },
        variants: [
          {
            name: 'Variant',
            properties: { isDisabled: true, backgroundColor: 'red' },
            styling: { colors: [] }
          }
        ],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const disabledProperty = result.find(p => p.name === 'Is Disabled');
      expect(disabledProperty).toBeDefined();

      const backgroundProperty = result.find(p => p.name === 'Background Color');
      expect(backgroundProperty).toBeDefined();
    });
  });

  describe('handleVariantSwitching', () => {
    it('should find matching variant based on property changes', () => {
      const componentSpec = {
        name: 'TestComponent',
        variants: [
          {
            name: 'Primary',
            properties: { style: 'primary', size: 'medium' },
            nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Primary', properties: {} }
          },
          {
            name: 'Secondary Large',
            properties: { style: 'secondary', size: 'large' },
            nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Secondary Large', properties: {} }
          }
        ]
      };

      const result = variantManager.handleVariantSwitching(componentSpec, {
        style: 'secondary',
        size: 'large'
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Secondary Large');
    });

    it('should return null when no matching variant found', () => {
      const componentSpec = {
        name: 'TestComponent',
        variants: [
          {
            name: 'Primary',
            properties: { style: 'primary' },
            nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Primary', properties: {} }
          }
        ]
      };

      const result = variantManager.handleVariantSwitching(componentSpec, {
        style: 'nonexistent'
      });

      expect(result).toBeNull();
    });

    it('should return null when component has no variants', () => {
      const componentSpec = {
        name: 'TestComponent'
      };

      const result = variantManager.handleVariantSwitching(componentSpec, {
        style: 'primary'
      });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle widgets with no properties', () => {
      const reusableWidget: ReusableWidget = {
        id: 'empty-1',
        type: WidgetType.CONTAINER,
        name: 'EmptyContainer',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockNodeFactory.createNode.mockReturnValue({
        type: FigmaNodeType.FRAME,
        name: 'EmptyContainer',
        properties: {}
      });

      const variants = variantManager.createAdvancedVariants(reusableWidget);
      const properties = variantManager.createVariantProperties(reusableWidget);

      expect(variants).toHaveLength(1);
      expect(variants[0].name).toBe('Default');
      expect(properties.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed property types', () => {
      const reusableWidget: ReusableWidget = {
        id: 'mixed-1',
        type: WidgetType.BUTTON,
        name: 'MixedButton',
        properties: { count: 1 },
        children: [],
        styling: { colors: [] },
        variants: [
          {
            name: 'String Variant',
            properties: { count: 'many' },
            styling: { colors: [] }
          }
        ],
        usageCount: 1
      };

      const result = variantManager.createVariantProperties(reusableWidget);

      const countProperty = result.find(p => p.name === 'Count');
      expect(countProperty?.type).toBe('TEXT');
      expect(countProperty?.defaultValue).toBe('1');
    });
  });
});
import { ComponentOrganizer, ComponentLibrary, ComponentCategory, ComponentGroup } from '../component-organizer';
import { ComponentBuilder } from '../component-builder';
import { ReusableWidget, WidgetType, WidgetVariant } from '../../schema/types';
import { FigmaComponentSpec, FigmaNodeType } from '../figma-node-spec';

describe('ComponentOrganizer', () => {
  let componentOrganizer: ComponentOrganizer;
  let mockComponentBuilder: jest.Mocked<ComponentBuilder>;

  beforeEach(() => {
    mockComponentBuilder = {
      createComponent: jest.fn(),
      createAdvancedComponent: jest.fn(),
      createComponentInstance: jest.fn(),
      createNode: jest.fn()
    } as any;

    componentOrganizer = new ComponentOrganizer(mockComponentBuilder);
  });

  describe('organizeComponentLibrary', () => {
    it('should create a structured component library', () => {
      const reusableWidgets: ReusableWidget[] = [
        {
          id: 'button-1',
          type: WidgetType.BUTTON,
          name: 'PrimaryButton',
          properties: { style: 'primary' },
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 5
        },
        {
          id: 'text-1',
          type: WidgetType.TEXT,
          name: 'HeadingText',
          properties: {},
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 3
        }
      ];

      const mockComponents: FigmaComponentSpec[] = [
        {
          name: 'PrimaryButton',
          description: 'Primary button component',
          variants: [],
          properties: []
        },
        {
          name: 'HeadingText',
          description: 'Heading text component',
          variants: [],
          properties: []
        }
      ];

      mockComponentBuilder.createAdvancedComponent.mockImplementation((widget) => 
        mockComponents[reusableWidgets.indexOf(widget)]
      );

      const result = componentOrganizer.organizeComponentLibrary(reusableWidgets);

      expect(result.name).toBe('Flutter Component Library');
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.metadata.totalComponents).toBe(2);
      expect(result.metadata.version).toBe('1.0.0');
    });

    it('should categorize components correctly', () => {
      const reusableWidgets: ReusableWidget[] = [
        {
          id: 'button-1',
          type: WidgetType.BUTTON,
          name: 'ActionButton',
          properties: {},
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 1
        },
        {
          id: 'card-1',
          type: WidgetType.CARD,
          name: 'InfoCard',
          properties: {},
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 1
        }
      ];

      mockComponentBuilder.createAdvancedComponent.mockReturnValue({
        name: 'TestComponent',
        description: 'Test component',
        variants: [],
        properties: []
      });

      const result = componentOrganizer.organizeComponentLibrary(reusableWidgets);

      const buttonCategory = result.categories.find(cat => cat.name === 'Buttons');
      const surfaceCategory = result.categories.find(cat => cat.name === 'Surfaces');

      expect(buttonCategory).toBeDefined();
      expect(surfaceCategory).toBeDefined();
    });

    it('should sort categories by priority', () => {
      const reusableWidgets: ReusableWidget[] = [
        {
          id: 'media-1',
          type: WidgetType.IMAGE,
          name: 'ProfileImage',
          properties: {},
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 1
        },
        {
          id: 'button-1',
          type: WidgetType.BUTTON,
          name: 'SubmitButton',
          properties: {},
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 1
        }
      ];

      mockComponentBuilder.createAdvancedComponent.mockReturnValue({
        name: 'TestComponent',
        description: 'Test component',
        variants: [],
        properties: []
      });

      const result = componentOrganizer.organizeComponentLibrary(reusableWidgets);

      // Buttons should come before Media in priority
      const buttonIndex = result.categories.findIndex(cat => cat.name === 'Buttons');
      const mediaIndex = result.categories.findIndex(cat => cat.name === 'Media');

      expect(buttonIndex).toBeLessThan(mediaIndex);
    });
  });

  describe('createComponentGroups', () => {
    it('should group components by functionality', () => {
      const components: FigmaComponentSpec[] = [
        {
          name: 'Primary Button',
          description: 'Primary button',
          variants: [],
          properties: []
        },
        {
          name: 'Secondary Button',
          description: 'Secondary button',
          variants: [],
          properties: []
        },
        {
          name: 'Icon Button',
          description: 'Icon button',
          variants: [],
          properties: []
        }
      ];

      const result = componentOrganizer.createComponentGroups(components);

      expect(result.length).toBeGreaterThan(0);
      
      const buttonGroups = result.filter(group => 
        group.name.includes('Button') || group.name === 'Buttons'
      );
      expect(buttonGroups.length).toBeGreaterThan(0);
    });

    it('should create sub-groups based on variant complexity', () => {
      const components: FigmaComponentSpec[] = [
        {
          name: 'Simple Button',
          description: 'Simple button',
          variants: [{ name: 'Default', properties: {}, nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Default', properties: {} } }],
          properties: []
        },
        {
          name: 'Complex Button',
          description: 'Complex button',
          variants: [
            { name: 'Primary', properties: { style: 'primary' }, nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Primary', properties: {} } },
            { name: 'Secondary', properties: { style: 'secondary' }, nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Secondary', properties: {} } }
          ],
          properties: []
        }
      ];

      const result = componentOrganizer.createComponentGroups(components);

      const buttonGroup = result.find(group => group.name.includes('Button'));
      expect(buttonGroup?.subGroups.length).toBeGreaterThan(0);
    });

    it('should sort groups by priority', () => {
      const components: FigmaComponentSpec[] = [
        {
          name: 'Secondary Button',
          description: 'Secondary button',
          variants: [],
          properties: []
        },
        {
          name: 'Primary Button',
          description: 'Primary button',
          variants: [],
          properties: []
        }
      ];

      const result = componentOrganizer.createComponentGroups(components);

      // Primary buttons should come before secondary buttons
      const groupNames = result.map(group => group.name);
      const primaryIndex = groupNames.findIndex(name => name.includes('Primary'));
      const secondaryIndex = groupNames.findIndex(name => name.includes('Secondary'));

      if (primaryIndex !== -1 && secondaryIndex !== -1) {
        expect(primaryIndex).toBeLessThan(secondaryIndex);
      }
    });
  });

  describe('addComponentDocumentation', () => {
    it('should enhance component with detailed documentation', () => {
      const component: FigmaComponentSpec = {
        name: 'ActionButton',
        description: 'Basic description',
        variants: [
          { name: 'Default', properties: {}, nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Default', properties: {} } },
          { name: 'Disabled', properties: { disabled: true }, nodeSpec: { type: FigmaNodeType.COMPONENT, name: 'Disabled', properties: {} } }
        ],
        properties: [
          { name: 'State', type: 'VARIANT', defaultValue: 'default', variantOptions: ['default', 'disabled'] }
        ]
      };

      const reusableWidget: ReusableWidget = {
        id: 'button-1',
        type: WidgetType.BUTTON,
        name: 'ActionButton',
        properties: { disabled: false },
        children: [],
        styling: { colors: [] },
        variants: [
          { name: 'Disabled', properties: { disabled: true }, styling: { colors: [] } }
        ],
        usageCount: 8
      };

      const result = componentOrganizer.addComponentDocumentation(component, reusableWidget);

      expect(result.description).toContain('ActionButton component');
      expect(result.description).toContain('Used 8 times');
      expect(result.description).toContain('2 variants');
      expect(result.description).toContain('1 properties');
      expect(result.description).toContain('Complexity:');

      const metadata = (result as any).metadata;
      expect(metadata.category).toBe('Buttons');
      expect(metadata.tags).toContain('elevatedbutton');
      expect(metadata.usageCount).toBe(8);
      expect(metadata.complexity).toMatch(/Simple|Medium|Complex/);
      expect(metadata.examples.length).toBeGreaterThan(0);
    });

    it('should generate appropriate tags based on widget properties', () => {
      const component: FigmaComponentSpec = {
        name: 'InteractiveCard',
        description: 'Interactive card component',
        variants: [],
        properties: []
      };

      const reusableWidget: ReusableWidget = {
        id: 'card-1',
        type: WidgetType.CARD,
        name: 'InteractiveCard',
        properties: { disabled: false },
        children: [
          { id: 'text-1', type: WidgetType.TEXT, properties: {}, children: [], styling: { colors: [] } }
        ],
        styling: { 
          colors: [{ property: 'backgroundColor', value: '#FFFFFF', isThemeReference: false }],
          borders: { width: 1, color: '#CCCCCC' }
        },
        variants: [],
        usageCount: 15
      };

      const result = componentOrganizer.addComponentDocumentation(component, reusableWidget);

      const metadata = (result as any).metadata;
      expect(metadata.tags).toContain('card');
      expect(metadata.tags).toContain('interactive');
      expect(metadata.tags).toContain('colored');
      expect(metadata.tags).toContain('container');
      expect(metadata.tags).toContain('frequently-used');
    });

    it('should assess component complexity correctly', () => {
      const simpleComponent: FigmaComponentSpec = {
        name: 'SimpleText',
        description: 'Simple text',
        variants: [],
        properties: []
      };

      const simpleWidget: ReusableWidget = {
        id: 'text-1',
        type: WidgetType.TEXT,
        name: 'SimpleText',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      const complexComponent: FigmaComponentSpec = {
        name: 'ComplexCard',
        description: 'Complex card',
        variants: [],
        properties: []
      };

      const complexWidget: ReusableWidget = {
        id: 'card-1',
        type: WidgetType.CARD,
        name: 'ComplexCard',
        properties: { elevation: 4, outlined: true, disabled: false },
        children: [
          { id: 'text-1', type: WidgetType.TEXT, properties: {}, children: [], styling: { colors: [] } },
          { id: 'button-1', type: WidgetType.BUTTON, properties: {}, children: [], styling: { colors: [] } }
        ],
        styling: { 
          colors: [
            { property: 'backgroundColor', value: '#FFFFFF', isThemeReference: false },
            { property: 'borderColor', value: '#CCCCCC', isThemeReference: false }
          ],
          borders: { width: 1, color: '#CCCCCC' },
          shadows: [{ color: '#000000', offset: { x: 0, y: 2 }, blur: 4 }]
        },
        variants: [
          { name: 'Elevated', properties: { elevation: 8 }, styling: { colors: [] } },
          { name: 'Outlined', properties: { outlined: true }, styling: { colors: [] } }
        ],
        usageCount: 1
      };

      const simpleResult = componentOrganizer.addComponentDocumentation(simpleComponent, simpleWidget);
      const complexResult = componentOrganizer.addComponentDocumentation(complexComponent, complexWidget);

      const simpleMetadata = (simpleResult as any).metadata;
      const complexMetadata = (complexResult as any).metadata;

      expect(simpleMetadata.complexity).toBe('Simple');
      expect(complexMetadata.complexity).toBe('Complex');
    });
  });

  describe('createLibraryPageStructure', () => {
    it('should create a structured page layout', () => {
      const library: ComponentLibrary = {
        name: 'Test Library',
        description: 'Test component library',
        categories: [
          {
            name: 'Buttons',
            description: 'Button components',
            components: [],
            groups: [],
            metadata: { componentCount: 2, averageUsage: 5, complexity: 'Medium' }
          }
        ],
        metadata: { totalComponents: 2, generatedAt: '2023-01-01', version: '1.0.0' }
      };

      const result = componentOrganizer.createLibraryPageStructure(library);

      expect(result.name).toBe('Test Library');
      expect(result.pages.length).toBeGreaterThan(0);
      
      // Should have overview page
      const overviewPage = result.pages.find(page => page.name.includes('Overview'));
      expect(overviewPage).toBeDefined();
      
      // Should have category pages
      const buttonPage = result.pages.find(page => page.name.includes('Buttons'));
      expect(buttonPage).toBeDefined();
      
      // Should have utilities page
      const utilitiesPage = result.pages.find(page => page.name.includes('Utilities'));
      expect(utilitiesPage).toBeDefined();

      // Should have cover page
      expect(result.coverPage).toBeDefined();
      expect(result.coverPage.title).toBe('Test Library');
      expect(result.coverPage.stats.totalComponents).toBe(2);
    });

    it('should include category icons in page names', () => {
      const library: ComponentLibrary = {
        name: 'Icon Test Library',
        description: 'Test library for icons',
        categories: [
          {
            name: 'Buttons',
            description: 'Button components',
            components: [],
            groups: [],
            metadata: { componentCount: 1, averageUsage: 1, complexity: 'Simple' }
          },
          {
            name: 'Typography',
            description: 'Text components',
            components: [],
            groups: [],
            metadata: { componentCount: 1, averageUsage: 1, complexity: 'Simple' }
          }
        ],
        metadata: { totalComponents: 2, generatedAt: '2023-01-01', version: '1.0.0' }
      };

      const result = componentOrganizer.createLibraryPageStructure(library);

      const buttonPage = result.pages.find(page => page.name.includes('🔘'));
      const typographyPage = result.pages.find(page => page.name.includes('📝'));

      expect(buttonPage).toBeDefined();
      expect(typographyPage).toBeDefined();
    });
  });

  describe('component categorization', () => {
    it('should categorize different widget types correctly', () => {
      const testCases = [
        { type: WidgetType.BUTTON, expectedCategory: 'Buttons' },
        { type: WidgetType.TEXT, expectedCategory: 'Typography' },
        { type: WidgetType.CARD, expectedCategory: 'Surfaces' },
        { type: WidgetType.ROW, expectedCategory: 'Layout' },
        { type: WidgetType.IMAGE, expectedCategory: 'Media' },
        { type: WidgetType.SCAFFOLD, expectedCategory: 'Navigation' }
      ];

      testCases.forEach(({ type, expectedCategory }) => {
        const widget: ReusableWidget = {
          id: 'test-1',
          type: type,
          name: 'TestWidget',
          properties: {},
          children: [],
          styling: { colors: [] },
          variants: [],
          usageCount: 1
        };

        mockComponentBuilder.createAdvancedComponent.mockReturnValue({
          name: 'TestComponent',
          description: 'Test component',
          variants: [],
          properties: []
        });

        const result = componentOrganizer.organizeComponentLibrary([widget]);
        const category = result.categories.find(cat => cat.name === expectedCategory);
        
        expect(category).toBeDefined();
      });
    });

    it('should categorize Container widgets based on usage', () => {
      const surfaceContainer: ReusableWidget = {
        id: 'surface-1',
        type: WidgetType.CONTAINER,
        name: 'SurfaceContainer',
        properties: { decoration: { color: '#FFFFFF' } },
        children: [],
        styling: { 
          colors: [{ property: 'backgroundColor', value: '#FFFFFF', isThemeReference: false }]
        },
        variants: [],
        usageCount: 1
      };

      const layoutContainer: ReusableWidget = {
        id: 'layout-1',
        type: WidgetType.CONTAINER,
        name: 'LayoutContainer',
        properties: { padding: { top: 16, right: 16, bottom: 16, left: 16 } },
        children: [],
        styling: { colors: [] },
        layout: { type: 'column' },
        variants: [],
        usageCount: 1
      };

      mockComponentBuilder.createAdvancedComponent.mockReturnValue({
        name: 'TestComponent',
        description: 'Test component',
        variants: [],
        properties: []
      });

      const surfaceResult = componentOrganizer.organizeComponentLibrary([surfaceContainer]);
      const layoutResult = componentOrganizer.organizeComponentLibrary([layoutContainer]);

      const surfaceCategory = surfaceResult.categories.find(cat => cat.name === 'Surfaces');
      const layoutCategory = layoutResult.categories.find(cat => cat.name === 'Layout');

      expect(surfaceCategory).toBeDefined();
      expect(layoutCategory).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty widget list', () => {
      const result = componentOrganizer.organizeComponentLibrary([]);

      expect(result.name).toBe('Flutter Component Library');
      expect(result.categories).toHaveLength(0);
      expect(result.metadata.totalComponents).toBe(0);
    });

    it('should handle widgets with no variants or properties', () => {
      const widget: ReusableWidget = {
        id: 'minimal-1',
        type: WidgetType.CONTAINER,
        name: 'MinimalContainer',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockComponentBuilder.createAdvancedComponent.mockReturnValue({
        name: 'MinimalContainer',
        description: 'Minimal container',
        variants: [],
        properties: []
      });

      const result = componentOrganizer.organizeComponentLibrary([widget]);

      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.metadata.totalComponents).toBe(1);
    });

    it('should handle components with unknown types', () => {
      const widget: ReusableWidget = {
        id: 'custom-1',
        type: WidgetType.CUSTOM,
        name: 'CustomWidget',
        properties: {},
        children: [],
        styling: { colors: [] },
        variants: [],
        usageCount: 1
      };

      mockComponentBuilder.createAdvancedComponent.mockReturnValue({
        name: 'CustomWidget',
        description: 'Custom widget',
        variants: [],
        properties: []
      });

      const result = componentOrganizer.organizeComponentLibrary([widget]);

      const componentCategory = result.categories.find(cat => cat.name === 'Components');
      expect(componentCategory).toBeDefined();
    });
  });
});
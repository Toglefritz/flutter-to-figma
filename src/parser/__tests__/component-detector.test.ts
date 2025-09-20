import { ComponentDetector, ComponentPattern, ComponentDetectionConfig } from '../component-detector';
import { Widget, WidgetType } from '../../schema/types';

describe('ComponentDetector', () => {
  let detector: ComponentDetector;

  beforeEach(() => {
    detector = new ComponentDetector();
  });

  // Helper function to create test widgets
  const createWidget = (
    id: string,
    type: WidgetType,
    children: Widget[] = [],
    properties: any = {}
  ): Widget => ({
    id,
    type,
    properties,
    children,
    styling: { colors: [] }
  });

  describe('Basic Component Detection', () => {
    it('should detect repeated button patterns', () => {
      const button1 = createWidget('btn1', WidgetType.BUTTON, [
        createWidget('text1', WidgetType.TEXT, [], { text: 'Click Me' })
      ], { color: 'blue' });

      const button2 = createWidget('btn2', WidgetType.BUTTON, [
        createWidget('text2', WidgetType.TEXT, [], { text: 'Submit' })
      ], { color: 'blue' });

      const button3 = createWidget('btn3', WidgetType.BUTTON, [
        createWidget('text3', WidgetType.TEXT, [], { text: 'Cancel' })
      ], { color: 'red' });

      const result = detector.detectComponents([button1, button2, button3]);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].instances).toHaveLength(3);
      expect(result.patterns[0].type).toBe(WidgetType.BUTTON);
      expect(result.reusableWidgets).toHaveLength(1);
    });

    it('should detect repeated card patterns', () => {
      const createCard = (id: string, title: string, subtitle: string) => 
        createWidget(`card${id}`, WidgetType.CARD, [
          createWidget(`title${id}`, WidgetType.TEXT, [], { text: title }),
          createWidget(`subtitle${id}`, WidgetType.TEXT, [], { text: subtitle })
        ]);

      const cards = [
        createCard('1', 'Title 1', 'Subtitle 1'),
        createCard('2', 'Title 2', 'Subtitle 2'),
        createCard('3', 'Title 3', 'Subtitle 3')
      ];

      const result = detector.detectComponents(cards);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].instances).toHaveLength(3);
      expect(result.patterns[0].type).toBe(WidgetType.CARD);
    });

    it('should not detect components with insufficient instances', () => {
      const button = createWidget('btn1', WidgetType.BUTTON, [
        createWidget('text1', WidgetType.TEXT, [], { text: 'Single Button' })
      ]);

      const result = detector.detectComponents([button]);

      expect(result.patterns).toHaveLength(0);
      expect(result.reusableWidgets).toHaveLength(0);
    });

    it('should ignore simple leaf widgets', () => {
      const text1 = createWidget('text1', WidgetType.TEXT, [], { text: 'Hello' });
      const text2 = createWidget('text2', WidgetType.TEXT, [], { text: 'World' });
      const text3 = createWidget('text3', WidgetType.TEXT, [], { text: 'Test' });

      const result = detector.detectComponents([text1, text2, text3]);

      expect(result.patterns).toHaveLength(0);
    });
  });

  describe('Variant Detection', () => {
    it('should detect variants based on property differences', () => {
      const createButton = (id: string, color: string, size: string) =>
        createWidget(`btn${id}`, WidgetType.BUTTON, [
          createWidget(`text${id}`, WidgetType.TEXT, [], { text: 'Button' })
        ], { color, size });

      const buttons = [
        createButton('1', 'blue', 'large'),
        createButton('2', 'blue', 'small'),
        createButton('3', 'red', 'large'),
        createButton('4', 'red', 'small'),
        createButton('5', 'blue', 'large') // Duplicate variant
      ];

      const result = detector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(1);
      const pattern = result.patterns[0];
      
      expect(pattern.variants.length).toBeGreaterThan(1);
      expect(pattern.variants.length).toBeLessThanOrEqual(4);
      
      // Check that variants have different properties
      const hasColorVariants = pattern.variants.some(v => 
        v.propertyDifferences.some(d => d.path === 'color')
      );
      const hasSizeVariants = pattern.variants.some(v => 
        v.propertyDifferences.some(d => d.path === 'size')
      );
      
      expect(hasColorVariants || hasSizeVariants).toBe(true);
    });

    it('should track variant usage counts', () => {
      const createButton = (id: string, color: string) =>
        createWidget(`btn${id}`, WidgetType.BUTTON, [], { color });

      const buttons = [
        createButton('1', 'blue'),
        createButton('2', 'blue'),
        createButton('3', 'blue'), // Blue appears 3 times
        createButton('4', 'red'),
        createButton('5', 'red')   // Red appears 2 times
      ];

      const result = detector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(1);
      const pattern = result.patterns[0];
      
      // Should have variants for blue and red
      expect(pattern.variants).toHaveLength(2);
      
      // Check usage counts
      const blueVariant = pattern.variants.find(v => 
        v.propertyDifferences.some(d => d.variantValue === 'blue')
      );
      const redVariant = pattern.variants.find(v => 
        v.propertyDifferences.some(d => d.variantValue === 'red')
      );
      
      if (blueVariant && redVariant) {
        expect(blueVariant.usageCount + redVariant.usageCount).toBe(5);
      }
    });

    it('should limit number of variants', () => {
      const customConfig: Partial<ComponentDetectionConfig> = {
        maxVariants: 3
      };
      const customDetector = new ComponentDetector(customConfig);

      const buttons = Array.from({ length: 10 }, (_, i) =>
        createWidget(`btn${i}`, WidgetType.BUTTON, [], { color: `color${i}` })
      );

      const result = customDetector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].variants.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Structural Similarity', () => {
    it('should group widgets with same structure', () => {
      const createListItem = (id: string, hasIcon: boolean) => {
        const children = [
          createWidget(`text${id}`, WidgetType.TEXT, [], { text: `Item ${id}` })
        ];
        
        if (hasIcon) {
          children.unshift(createWidget(`icon${id}`, WidgetType.IMAGE));
        }
        
        return createWidget(`item${id}`, WidgetType.ROW, children);
      };

      const itemsWithIcon = [
        createListItem('1', true),
        createListItem('2', true),
        createListItem('3', true)
      ];

      const itemsWithoutIcon = [
        createListItem('4', false),
        createListItem('5', false)
      ];

      const result = detector.detectComponents([...itemsWithIcon, ...itemsWithoutIcon]);

      // Should detect two different patterns based on structure
      expect(result.patterns).toHaveLength(2);
      
      const iconPattern = result.patterns.find(p => p.instances.length === 3);
      const textPattern = result.patterns.find(p => p.instances.length === 2);
      
      expect(iconPattern).toBeDefined();
      expect(textPattern).toBeDefined();
    });

    it('should consider layout information in structure', () => {
      const row1 = createWidget('row1', WidgetType.ROW, [
        createWidget('text1', WidgetType.TEXT)
      ]);
      row1.layout = { type: 'row', direction: 'horizontal' };

      const row2 = createWidget('row2', WidgetType.ROW, [
        createWidget('text2', WidgetType.TEXT)
      ]);
      row2.layout = { type: 'row', direction: 'horizontal' };

      const column1 = createWidget('col1', WidgetType.COLUMN, [
        createWidget('text3', WidgetType.TEXT)
      ]);
      column1.layout = { type: 'column', direction: 'vertical' };

      const result = detector.detectComponents([row1, row2, column1]);

      // Should detect one pattern for rows (columns won't have enough instances)
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].instances).toHaveLength(2);
    });
  });

  describe('Configuration Options', () => {
    it('should respect minimum instances configuration', () => {
      const config: Partial<ComponentDetectionConfig> = {
        minInstances: 4
      };
      const customDetector = new ComponentDetector(config);

      const buttons = Array.from({ length: 3 }, (_, i) =>
        createWidget(`btn${i}`, WidgetType.BUTTON, [])
      );

      const result = customDetector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(0);
    });

    it('should respect minimum confidence configuration', () => {
      const config: Partial<ComponentDetectionConfig> = {
        minConfidence: 0.9
      };
      const customDetector = new ComponentDetector(config);

      // Create simple widgets that would have low confidence
      const simpleWidgets = Array.from({ length: 3 }, (_, i) =>
        createWidget(`simple${i}`, WidgetType.CONTAINER, [])
      );

      const result = customDetector.detectComponents(simpleWidgets);

      // Should filter out low-confidence patterns
      expect(result.patterns.every(p => p.confidence >= 0.9)).toBe(true);
    });

    it('should ignore specified properties', () => {
      const config: Partial<ComponentDetectionConfig> = {
        ignoreProperties: ['id', 'key', 'testProp']
      };
      const customDetector = new ComponentDetector(config);

      const buttons = [
        createWidget('btn1', WidgetType.BUTTON, [], { color: 'blue', testProp: 'ignore1' }),
        createWidget('btn2', WidgetType.BUTTON, [], { color: 'blue', testProp: 'ignore2' })
      ];

      const result = customDetector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(1);
      
      // Should not have variants based on ignored properties
      const pattern = result.patterns[0];
      const hasIgnoredPropDiff = pattern.variants.some(v =>
        v.propertyDifferences.some(d => d.path === 'testProp')
      );
      
      expect(hasIgnoredPropDiff).toBe(false);
    });

    it('should handle custom widgets based on configuration', () => {
      const config: Partial<ComponentDetectionConfig> = {
        includeCustomWidgets: false
      };
      const customDetector = new ComponentDetector(config);

      const customWidgets = Array.from({ length: 3 }, (_, i) =>
        createWidget(`custom${i}`, WidgetType.CUSTOM, [], { customType: 'MyWidget' })
      );

      const result = customDetector.detectComponents(customWidgets);

      expect(result.patterns).toHaveLength(0);
    });
  });

  describe('Component Naming', () => {
    it('should generate appropriate component names', () => {
      const buttons = Array.from({ length: 3 }, (_, i) =>
        createWidget(`btn${i}`, WidgetType.BUTTON, [])
      );

      const result = detector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toBe('Button');
      expect(result.reusableWidgets[0].name).toBe('Button');
    });

    it('should generate names for custom widgets', () => {
      const customWidgets = Array.from({ length: 3 }, (_, i) =>
        createWidget(`custom${i}`, WidgetType.CUSTOM, [], { customType: 'ListItem' })
      );

      const result = detector.detectComponents(customWidgets);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toBe('ListItem');
    });

    it('should generate variant names based on differences', () => {
      const buttons = [
        createWidget('btn1', WidgetType.BUTTON, [], { color: 'primary' }),
        createWidget('btn2', WidgetType.BUTTON, [], { color: 'secondary' })
      ];

      const result = detector.detectComponents(buttons);

      expect(result.patterns).toHaveLength(1);
      const pattern = result.patterns[0];
      
      expect(pattern.variants).toHaveLength(2);
      expect(pattern.variants.some(v => v.name.includes('Color') || v.name === 'Default')).toBe(true);
    });
  });

  describe('Nested Widget Handling', () => {
    it('should detect components in nested structures', () => {
      const createNestedStructure = (id: string) =>
        createWidget(`container${id}`, WidgetType.CONTAINER, [
          createWidget(`row${id}`, WidgetType.ROW, [
            createWidget(`btn${id}`, WidgetType.BUTTON, [
              createWidget(`text${id}`, WidgetType.TEXT, [], { text: 'Button' })
            ])
          ])
        ]);

      const structures = [
        createNestedStructure('1'),
        createNestedStructure('2'),
        createNestedStructure('3')
      ];

      const result = detector.detectComponents(structures);

      // Should detect multiple patterns at different levels
      expect(result.patterns.length).toBeGreaterThan(0);
      
      // Should include buttons, rows, and containers
      const buttonPattern = result.patterns.find(p => p.type === WidgetType.BUTTON);
      const rowPattern = result.patterns.find(p => p.type === WidgetType.ROW);
      const containerPattern = result.patterns.find(p => p.type === WidgetType.CONTAINER);
      
      expect(buttonPattern).toBeDefined();
      expect(rowPattern).toBeDefined();
      expect(containerPattern).toBeDefined();
    });

    it('should handle complex widget trees', () => {
      const createComplexCard = (id: string, hasImage: boolean) => {
        const children = [
          createWidget(`header${id}`, WidgetType.ROW, [
            createWidget(`title${id}`, WidgetType.TEXT, [], { text: `Title ${id}` }),
            createWidget(`subtitle${id}`, WidgetType.TEXT, [], { text: `Subtitle ${id}` })
          ]),
          createWidget(`content${id}`, WidgetType.COLUMN, [
            createWidget(`description${id}`, WidgetType.TEXT, [], { text: `Description ${id}` })
          ])
        ];

        if (hasImage) {
          children.splice(1, 0, createWidget(`image${id}`, WidgetType.IMAGE));
        }

        return createWidget(`card${id}`, WidgetType.CARD, children);
      };

      const cardsWithImage = [
        createComplexCard('1', true),
        createComplexCard('2', true)
      ];

      const cardsWithoutImage = [
        createComplexCard('3', false),
        createComplexCard('4', false)
      ];

      const result = detector.detectComponents([...cardsWithImage, ...cardsWithoutImage]);

      // Should detect different card patterns and nested components
      expect(result.patterns.length).toBeGreaterThan(1);
      
      // Should have patterns for different card structures
      const cardPatterns = result.patterns.filter(p => p.type === WidgetType.CARD);
      expect(cardPatterns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Metrics and Statistics', () => {
    it('should calculate component coverage correctly', () => {
      const buttons = Array.from({ length: 4 }, (_, i) =>
        createWidget(`btn${i}`, WidgetType.BUTTON, [])
      );

      const uniqueWidget = createWidget('unique', WidgetType.TEXT);

      const result = detector.detectComponents([...buttons, uniqueWidget]);

      // 4 out of 5 widgets can be componentized
      expect(result.componentCoverage).toBeCloseTo(80, 0);
      expect(result.totalInstances).toBe(4);
      expect(result.uniquePatterns).toBe(1);
    });

    it('should provide accurate statistics', () => {
      const createButtonGroup = (count: number, prefix: string) =>
        Array.from({ length: count }, (_, i) =>
          createWidget(`${prefix}${i}`, WidgetType.BUTTON, [
            createWidget(`text${prefix}${i}`, WidgetType.TEXT, [], { text: 'Button' })
          ])
        );

      const createCardGroup = (count: number, prefix: string) =>
        Array.from({ length: count }, (_, i) =>
          createWidget(`${prefix}${i}`, WidgetType.CARD, [
            createWidget(`content${prefix}${i}`, WidgetType.TEXT, [], { text: 'Card' })
          ])
        );

      const widgets = [
        ...createButtonGroup(3, 'btn'),
        ...createCardGroup(2, 'card')
      ];

      const result = detector.detectComponents(widgets);

      expect(result.uniquePatterns).toBeGreaterThanOrEqual(1); // At least Button pattern
      expect(result.totalInstances).toBeGreaterThanOrEqual(3);
      expect(result.componentCoverage).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should allow configuration updates', () => {
      const initialConfig = detector.getConfig();
      expect(initialConfig.minInstances).toBe(2);

      detector.updateConfig({ minInstances: 5 });
      
      const updatedConfig = detector.getConfig();
      expect(updatedConfig.minInstances).toBe(5);
    });

    it('should preserve other config values when updating', () => {
      const initialConfig = detector.getConfig();
      const originalMinConfidence = initialConfig.minConfidence;

      detector.updateConfig({ minInstances: 10 });
      
      const updatedConfig = detector.getConfig();
      expect(updatedConfig.minConfidence).toBe(originalMinConfidence);
      expect(updatedConfig.minInstances).toBe(10);
    });
  });
});
import { StyleMapper, StyleMappingConfig, DEFAULT_STYLE_CONFIG } from '../style-mapper';
import { VariableManager } from '../variable-manager';
import { FigmaNodeSpec, FigmaNodeType } from '../figma-node-spec';
import { StyleInfo, ColorInfo, TypographyInfo, SpacingInfo, BorderInfo, ShadowInfo } from '../../schema/types';
import { ThemeData, ColorScheme, TextTheme, FontWeight } from '../../schema/theme-schema';

describe('StyleMapper', () => {
  let styleMapper: StyleMapper;
  let variableManager: VariableManager;

  const mockTheme: ThemeData = {
    colorScheme: {
      brightness: 'light',
      primary: '#6200EE',
      onPrimary: '#FFFFFF',
      secondary: '#03DAC6',
      onSecondary: '#000000',
      error: '#B00020',
      onError: '#FFFFFF',
      background: '#FFFFFF',
      onBackground: '#000000',
      surface: '#FFFFFF',
      onSurface: '#000000'
    },
    textTheme: {
      bodyLarge: {
        fontSize: 16,
        fontWeight: FontWeight.w400,
        fontFamily: 'Roboto'
      },
      headlineLarge: {
        fontSize: 32,
        fontWeight: FontWeight.w700,
        fontFamily: 'Roboto'
      }
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }
  };

  beforeEach(() => {
    variableManager = new VariableManager();
    variableManager.createVariablesFromTheme(mockTheme, 'Default');
    styleMapper = new StyleMapper(variableManager);
  });

  describe('constructor and configuration', () => {
    it('should initialize with default configuration', () => {
      const mapper = new StyleMapper(variableManager);
      expect(mapper.getConfig()).toEqual(DEFAULT_STYLE_CONFIG);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: StyleMappingConfig = {
        useVariables: false,
        fallbackToDirectValues: false,
        collectionPrefix: 'Custom',
        preferMultiMode: true
      };

      const mapper = new StyleMapper(variableManager, customConfig);
      expect(mapper.getConfig()).toEqual(customConfig);
    });

    it('should update configuration', () => {
      styleMapper.updateConfig({ collectionPrefix: 'Updated' });
      expect(styleMapper.getConfig().collectionPrefix).toBe('Updated');
    });
  });

  describe('applyStyles', () => {
    it('should apply complete styling to a frame node', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const styling: StyleInfo = {
        colors: [{
          property: 'backgroundColor',
          value: '#FF0000',
          isThemeReference: false
        }],
        spacing: {
          padding: { top: 16, right: 16, bottom: 16, left: 16 }
        },
        borders: {
          width: 2,
          color: '#CCCCCC',
          radius: { topLeft: 8, topRight: 8, bottomLeft: 8, bottomRight: 8 }
        },
        shadows: [{
          color: '#000000',
          offset: { x: 0, y: 2 },
          blur: 4
        }]
      };

      const result = styleMapper.applyStyles(nodeSpec, styling);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('backgroundColor');
      expect(result.appliedProperties).toContain('border');
      expect(result.appliedProperties).toContain('borderRadius');
      expect(result.appliedProperties).toContain('shadows');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle styling errors gracefully', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      // Mock an error by providing invalid styling
      const styling: StyleInfo = {
        colors: [{
          property: 'backgroundColor',
          value: 'invalid-color-format',
          isThemeReference: false
        }]
      };

      const result = styleMapper.applyStyles(nodeSpec, styling);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('applyColorStyles', () => {
    it('should apply direct color values', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const colors: ColorInfo[] = [{
        property: 'backgroundColor',
        value: '#FF0000',
        isThemeReference: false
      }];

      const result = styleMapper.applyColorStyles(nodeSpec, colors);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('backgroundColor');
      expect(nodeSpec.properties.fills).toHaveLength(1);
      expect(nodeSpec.properties.fills[0].color).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should create variable bindings for theme references', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const colors: ColorInfo[] = [{
        property: 'backgroundColor',
        value: '#6200EE',
        isThemeReference: true,
        themePath: 'colorScheme.primary'
      }];

      const result = styleMapper.applyColorStyles(nodeSpec, colors);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('backgroundColor');
      expect(result.variableBindings).toHaveLength(1);
      expect(result.variableBindings[0].property).toBe('fills');
      expect(result.variableBindings[0].variableAlias).toContain('primary');
    });

    it('should fallback to direct values when variable not found', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const colors: ColorInfo[] = [{
        property: 'backgroundColor',
        value: '#FF0000',
        isThemeReference: true,
        themePath: 'colorScheme.nonExistent'
      }];

      const result = styleMapper.applyColorStyles(nodeSpec, colors);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('backgroundColor');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Variable not found');
      expect(nodeSpec.properties.fills).toHaveLength(1);
    });

    it('should handle multiple color properties', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const colors: ColorInfo[] = [
        {
          property: 'backgroundColor',
          value: '#FF0000',
          isThemeReference: false
        },
        {
          property: 'borderColor',
          value: '#00FF00',
          isThemeReference: false
        }
      ];

      const result = styleMapper.applyColorStyles(nodeSpec, colors);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('backgroundColor');
      expect(result.appliedProperties).toContain('borderColor');
      expect(nodeSpec.properties.fills).toHaveLength(1);
      expect(nodeSpec.properties.strokes).toHaveLength(1);
    });
  });

  describe('applyTypographyStyles', () => {
    it('should apply typography styles to text node', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.TEXT,
        name: 'Test Text',
        properties: {}
      };

      const typography: TypographyInfo = {
        fontSize: 16,
        fontFamily: 'Roboto',
        fontWeight: '700',
        lineHeight: 1.5,
        letterSpacing: 0.5,
        color: '#333333',
        isThemeReference: false
      };

      const result = styleMapper.applyTypographyStyles(nodeSpec, typography);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('fontSize');
      expect(result.appliedProperties).toContain('fontFamily');
      expect(result.appliedProperties).toContain('fontWeight');
      expect(result.appliedProperties).toContain('lineHeight');
      expect(result.appliedProperties).toContain('letterSpacing');
      expect(result.appliedProperties).toContain('color');

      expect(nodeSpec.properties.fontSize).toBe(16);
      expect(nodeSpec.properties.fontName.family).toBe('Roboto');
      expect(nodeSpec.properties.fontName.style).toBe('Bold');
      expect(nodeSpec.properties.lineHeight).toEqual({ unit: 'PERCENT', value: 150 });
      expect(nodeSpec.properties.letterSpacing).toEqual({ unit: 'PIXELS', value: 0.5 });
    });

    it('should warn when applying typography to non-text node', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const typography: TypographyInfo = {
        fontSize: 16,
        isThemeReference: false
      };

      const result = styleMapper.applyTypographyStyles(nodeSpec, typography);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Typography styles can only be applied to TEXT nodes');
    });

    it('should create variable bindings for theme references', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.TEXT,
        name: 'Test Text',
        properties: {}
      };

      const typography: TypographyInfo = {
        fontSize: 16,
        isThemeReference: true,
        themePath: 'textTheme.bodyLarge.fontSize'
      };

      const result = styleMapper.applyTypographyStyles(nodeSpec, typography);

      expect(result.success).toBe(true);
      expect(result.variableBindings).toHaveLength(1);
      expect(result.variableBindings[0].property).toBe('fontSize');
    });

    it('should handle partial typography information', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.TEXT,
        name: 'Test Text',
        properties: {}
      };

      const typography: TypographyInfo = {
        fontSize: 16,
        fontFamily: 'Inter',
        isThemeReference: false
        // Missing other properties
      };

      const result = styleMapper.applyTypographyStyles(nodeSpec, typography);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('fontSize');
      expect(result.appliedProperties).toContain('fontFamily');
      expect(result.appliedProperties).not.toContain('fontWeight');
      expect(result.appliedProperties).not.toContain('lineHeight');
    });
  });

  describe('applySpacingStyles', () => {
    it('should apply padding to auto layout frame', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {},
        autoLayout: {
          layoutMode: 'VERTICAL',
          primaryAxisSizingMode: 'AUTO',
          counterAxisSizingMode: 'AUTO',
          primaryAxisAlignItems: 'MIN',
          counterAxisAlignItems: 'MIN',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          itemSpacing: 0
        }
      };

      const spacing: SpacingInfo = {
        padding: { top: 16, right: 12, bottom: 16, left: 12 }
      };

      const result = styleMapper.applySpacingStyles(nodeSpec, spacing);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('padding');
      expect(nodeSpec.autoLayout!.paddingTop).toBe(16);
      expect(nodeSpec.autoLayout!.paddingRight).toBe(12);
      expect(nodeSpec.autoLayout!.paddingBottom).toBe(16);
      expect(nodeSpec.autoLayout!.paddingLeft).toBe(12);
    });

    it('should apply margin as item spacing', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {},
        autoLayout: {
          layoutMode: 'VERTICAL',
          primaryAxisSizingMode: 'AUTO',
          counterAxisSizingMode: 'AUTO',
          primaryAxisAlignItems: 'MIN',
          counterAxisAlignItems: 'MIN',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          itemSpacing: 0
        }
      };

      const spacing: SpacingInfo = {
        margin: { top: 8, right: 8, bottom: 8, left: 8 }
      };

      const result = styleMapper.applySpacingStyles(nodeSpec, spacing);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('margin');
      expect(nodeSpec.autoLayout!.itemSpacing).toBe(8);
    });

    it('should handle spacing without auto layout', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
        // No autoLayout
      };

      const spacing: SpacingInfo = {
        padding: { top: 16, right: 16, bottom: 16, left: 16 }
      };

      const result = styleMapper.applySpacingStyles(nodeSpec, spacing);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).not.toContain('padding');
    });
  });

  describe('applyBorderStyles', () => {
    it('should apply border width and color', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const borders: BorderInfo = {
        width: 2,
        color: '#CCCCCC'
      };

      const result = styleMapper.applyBorderStyles(nodeSpec, borders);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('border');
      expect(nodeSpec.properties.strokes).toHaveLength(1);
      expect(nodeSpec.properties.strokes[0].color).toEqual({ r: 0.8, g: 0.8, b: 0.8 });
      expect(nodeSpec.properties.strokeWeight).toBe(2);
    });

    it('should apply uniform border radius', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const borders: BorderInfo = {
        radius: { topLeft: 8, topRight: 8, bottomLeft: 8, bottomRight: 8 }
      };

      const result = styleMapper.applyBorderStyles(nodeSpec, borders);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('borderRadius');
      expect(nodeSpec.properties.cornerRadius).toBe(8);
    });

    it('should apply individual corner radii', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const borders: BorderInfo = {
        radius: { topLeft: 4, topRight: 8, bottomLeft: 12, bottomRight: 16 }
      };

      const result = styleMapper.applyBorderStyles(nodeSpec, borders);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('borderRadius');
      expect(nodeSpec.properties.topLeftRadius).toBe(4);
      expect(nodeSpec.properties.topRightRadius).toBe(8);
      expect(nodeSpec.properties.bottomLeftRadius).toBe(12);
      expect(nodeSpec.properties.bottomRightRadius).toBe(16);
    });
  });

  describe('applyShadowStyles', () => {
    it('should apply shadow effects', () => {
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const shadows: ShadowInfo[] = [
        {
          color: '#000000',
          offset: { x: 0, y: 2 },
          blur: 4,
          spread: 1
        },
        {
          color: '#FF0000',
          offset: { x: 2, y: 4 },
          blur: 8
        }
      ];

      const result = styleMapper.applyShadowStyles(nodeSpec, shadows);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toContain('shadows');
      expect(nodeSpec.properties.effects).toHaveLength(2);
      
      expect(nodeSpec.properties.effects[0].type).toBe('DROP_SHADOW');
      expect(nodeSpec.properties.effects[0].color).toEqual({ r: 0, g: 0, b: 0 });
      expect(nodeSpec.properties.effects[0].offset).toEqual({ x: 0, y: 2 });
      expect(nodeSpec.properties.effects[0].radius).toBe(4);
      expect(nodeSpec.properties.effects[0].spread).toBe(1);

      expect(nodeSpec.properties.effects[1].color).toEqual({ r: 1, g: 0, b: 0 });
      expect(nodeSpec.properties.effects[1].spread).toBe(0); // Default value
    });
  });

  describe('utility methods', () => {
    describe('color conversion', () => {
      it('should convert hex colors to RGB correctly', () => {
        const nodeSpec: FigmaNodeSpec = {
          type: FigmaNodeType.FRAME,
          name: 'Test Frame',
          properties: {}
        };

        const colors: ColorInfo[] = [
          { property: 'backgroundColor', value: '#FF0000', isThemeReference: false },
          { property: 'backgroundColor', value: '#00FF00', isThemeReference: false },
          { property: 'backgroundColor', value: '#0000FF', isThemeReference: false },
          { property: 'backgroundColor', value: '#FFF', isThemeReference: false }
        ];

        styleMapper.applyColorStyles(nodeSpec, colors);

        expect(nodeSpec.properties.fills[0].color).toEqual({ r: 1, g: 0, b: 0 });
        expect(nodeSpec.properties.fills[1].color).toEqual({ r: 0, g: 1, b: 0 });
        expect(nodeSpec.properties.fills[2].color).toEqual({ r: 0, g: 0, b: 1 });
        expect(nodeSpec.properties.fills[3].color).toEqual({ r: 1, g: 1, b: 1 });
      });
    });

    describe('font weight mapping', () => {
      it('should map font weights correctly', () => {
        const nodeSpec: FigmaNodeSpec = {
          type: FigmaNodeType.TEXT,
          name: 'Test Text',
          properties: {}
        };

        const typography: TypographyInfo = {
          fontWeight: '700',
          isThemeReference: false
        };

        styleMapper.applyTypographyStyles(nodeSpec, typography);

        expect(nodeSpec.properties.fontName.style).toBe('Bold');
      });
    });
  });

  describe('configuration effects', () => {
    it('should respect useVariables configuration', () => {
      const config: StyleMappingConfig = {
        useVariables: false,
        fallbackToDirectValues: true,
        collectionPrefix: 'Default',
        preferMultiMode: false
      };

      const mapper = new StyleMapper(variableManager, config);
      
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const colors: ColorInfo[] = [{
        property: 'backgroundColor',
        value: '#6200EE',
        isThemeReference: true,
        themePath: 'colorScheme.primary'
      }];

      const result = mapper.applyColorStyles(nodeSpec, colors);

      // Should use direct values instead of variables
      expect(result.variableBindings).toHaveLength(0);
      expect(nodeSpec.properties.fills).toHaveLength(1);
    });

    it('should respect fallbackToDirectValues configuration', () => {
      const config: StyleMappingConfig = {
        useVariables: true,
        fallbackToDirectValues: false,
        collectionPrefix: 'Default',
        preferMultiMode: false
      };

      const mapper = new StyleMapper(variableManager, config);
      
      const nodeSpec: FigmaNodeSpec = {
        type: FigmaNodeType.FRAME,
        name: 'Test Frame',
        properties: {}
      };

      const colors: ColorInfo[] = [{
        property: 'backgroundColor',
        value: '#FF0000',
        isThemeReference: true,
        themePath: 'colorScheme.nonExistent'
      }];

      const result = mapper.applyColorStyles(nodeSpec, colors);

      // Should not fallback to direct values
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Variable not found');
      expect(nodeSpec.properties.fills).toBeUndefined();
    });
  });
});
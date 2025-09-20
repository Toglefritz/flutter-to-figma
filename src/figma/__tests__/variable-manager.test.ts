import { VariableManager, VariableType, VariableScope } from '../variable-manager';
import { ThemeData, ColorScheme, TextTheme, SpacingScale, BorderRadiusScale, FontWeight } from '../../schema/theme-schema';

describe('VariableManager', () => {
  let variableManager: VariableManager;

  beforeEach(() => {
    variableManager = new VariableManager();
  });

  describe('createColorVariables', () => {
    it('should create color variables from ColorScheme', () => {
      const colorScheme: ColorScheme = {
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
      };

      const collection = variableManager.createColorVariables(colorScheme, 'Test Colors');

      expect(collection.name).toBe('Test Colors');
      expect(collection.description).toContain('light mode');
      expect(collection.variables).toHaveLength(10); // 10 required colors

      // Check primary color
      const primaryVar = collection.variables.find(v => v.name === 'primary');
      expect(primaryVar).toBeDefined();
      expect(primaryVar!.type).toBe(VariableType.COLOR);
      expect(primaryVar!.scopes).toContain(VariableScope.ALL_FILLS);
      expect(primaryVar!.scopes).toContain(VariableScope.ALL_STROKES);
      expect(primaryVar!.value.r).toBeCloseTo(0.3843137254901961, 10);
      expect(primaryVar!.value.g).toBe(0);
      expect(primaryVar!.value.b).toBeCloseTo(0.9333333333333333, 10);
      expect(primaryVar!.description).toBe('Primary brand color');

      // Check surface color
      const surfaceVar = collection.variables.find(v => v.name === 'surface');
      expect(surfaceVar).toBeDefined();
      expect(surfaceVar!.scopes).toContain(VariableScope.ALL_FILLS);
      expect(surfaceVar!.scopes).not.toContain(VariableScope.ALL_STROKES);
    });

    it('should handle optional color properties', () => {
      const colorScheme: ColorScheme = {
        brightness: 'dark',
        primary: '#BB86FC',
        onPrimary: '#000000',
        secondary: '#03DAC6',
        onSecondary: '#000000',
        error: '#CF6679',
        onError: '#000000',
        background: '#121212',
        onBackground: '#FFFFFF',
        surface: '#121212',
        onSurface: '#FFFFFF',
        surfaceVariant: '#1E1E1E',
        onSurfaceVariant: '#E0E0E0',
        outline: '#8A8A8A',
        shadow: '#000000'
      };

      const collection = variableManager.createColorVariables(colorScheme, 'Dark Colors');

      expect(collection.variables).toHaveLength(14); // 10 required + 4 optional

      const surfaceVariantVar = collection.variables.find(v => v.name === 'surface-variant');
      expect(surfaceVariantVar).toBeDefined();

      const outlineVar = collection.variables.find(v => v.name === 'outline');
      expect(outlineVar).toBeDefined();
      expect(outlineVar!.scopes).toEqual([VariableScope.ALL_STROKES]);

      const shadowVar = collection.variables.find(v => v.name === 'shadow');
      expect(shadowVar).toBeDefined();
    });

    it('should convert hex colors correctly', () => {
      const colorScheme: ColorScheme = {
        brightness: 'light',
        primary: '#FF0000', // Pure red
        onPrimary: '#00FF00', // Pure green
        secondary: '#0000FF', // Pure blue
        onSecondary: '#FFFFFF', // White
        error: '#000000', // Black
        onError: '#808080', // Gray
        background: '#F5F', // 3-digit hex
        onBackground: '#000',
        surface: '#FFF',
        onSurface: '#333'
      };

      const collection = variableManager.createColorVariables(colorScheme, 'Test Colors');

      const primaryVar = collection.variables.find(v => v.name === 'primary');
      expect(primaryVar!.value).toEqual({ r: 1, g: 0, b: 0 });

      const onPrimaryVar = collection.variables.find(v => v.name === 'on-primary');
      expect(onPrimaryVar!.value).toEqual({ r: 0, g: 1, b: 0 });

      const secondaryVar = collection.variables.find(v => v.name === 'secondary');
      expect(secondaryVar!.value).toEqual({ r: 0, g: 0, b: 1 });

      const backgroundVar = collection.variables.find(v => v.name === 'background');
      expect(backgroundVar!.value).toEqual({ r: 1, g: 0.3333333333333333, b: 1 }); // #FF55FF

      const onSurfaceVar = collection.variables.find(v => v.name === 'on-surface');
      expect(onSurfaceVar!.value).toEqual({ r: 0.2, g: 0.2, b: 0.2 }); // #333333
    });
  });

  describe('createTypographyVariables', () => {
    it('should create typography variables from TextTheme', () => {
      const textTheme: TextTheme = {
        displayLarge: {
          fontSize: 57,
          fontWeight: FontWeight.w400,
          fontFamily: 'Roboto',
          letterSpacing: -0.25,
          height: 1.12
        },
        bodyLarge: {
          fontSize: 16,
          fontWeight: FontWeight.w400,
          fontFamily: 'Roboto',
          letterSpacing: 0.5,
          height: 1.5
        },
        labelSmall: {
          fontSize: 11,
          fontWeight: FontWeight.w500,
          fontFamily: 'Roboto',
          letterSpacing: 0.5
        }
      };

      const collection = variableManager.createTypographyVariables(textTheme, 'Test Typography');

      expect(collection.name).toBe('Test Typography');
      expect(collection.description).toBe('Typography variables from Flutter TextTheme');

      // Should have variables for display-large (5 properties)
      const displayLargeFontSize = collection.variables.find(v => v.name === 'display-large-font-size');
      expect(displayLargeFontSize).toBeDefined();
      expect(displayLargeFontSize!.type).toBe(VariableType.FLOAT);
      expect(displayLargeFontSize!.scopes).toEqual([VariableScope.FONT_SIZE]);
      expect(displayLargeFontSize!.value).toBe(57);

      const displayLargeFontWeight = collection.variables.find(v => v.name === 'display-large-font-weight');
      expect(displayLargeFontWeight).toBeDefined();
      expect(displayLargeFontWeight!.type).toBe(VariableType.STRING);
      expect(displayLargeFontWeight!.value).toBe('Regular');

      const displayLargeFontFamily = collection.variables.find(v => v.name === 'display-large-font-family');
      expect(displayLargeFontFamily).toBeDefined();
      expect(displayLargeFontFamily!.value).toBe('Roboto');

      const displayLargeLetterSpacing = collection.variables.find(v => v.name === 'display-large-letter-spacing');
      expect(displayLargeLetterSpacing).toBeDefined();
      expect(displayLargeLetterSpacing!.value).toBe(-0.25);

      const displayLargeLineHeight = collection.variables.find(v => v.name === 'display-large-line-height');
      expect(displayLargeLineHeight).toBeDefined();
      expect(displayLargeLineHeight!.value).toBe(1.12);

      // Should have variables for body-large (5 properties)
      const bodyLargeFontSize = collection.variables.find(v => v.name === 'body-large-font-size');
      expect(bodyLargeFontSize).toBeDefined();
      expect(bodyLargeFontSize!.value).toBe(16);

      // Should have variables for label-small (4 properties, no height)
      const labelSmallFontSize = collection.variables.find(v => v.name === 'label-small-font-size');
      expect(labelSmallFontSize).toBeDefined();
      expect(labelSmallFontSize!.value).toBe(11);

      const labelSmallLineHeight = collection.variables.find(v => v.name === 'label-small-line-height');
      expect(labelSmallLineHeight).toBeUndefined(); // No height property

      // Total: 5 + 5 + 4 = 14 variables
      expect(collection.variables).toHaveLength(14);
    });

    it('should handle partial text styles', () => {
      const textTheme: TextTheme = {
        bodyMedium: {
          fontSize: 14,
          fontFamily: 'Inter'
          // Missing fontWeight, letterSpacing, height
        },
        titleLarge: {
          fontWeight: FontWeight.w700
          // Missing other properties
        }
      };

      const collection = variableManager.createTypographyVariables(textTheme, 'Partial Typography');

      // Should only create variables for properties that exist
      const bodyMediumFontSize = collection.variables.find(v => v.name === 'body-medium-font-size');
      expect(bodyMediumFontSize).toBeDefined();

      const bodyMediumFontFamily = collection.variables.find(v => v.name === 'body-medium-font-family');
      expect(bodyMediumFontFamily).toBeDefined();

      const bodyMediumFontWeight = collection.variables.find(v => v.name === 'body-medium-font-weight');
      expect(bodyMediumFontWeight).toBeUndefined();

      const titleLargeFontWeight = collection.variables.find(v => v.name === 'title-large-font-weight');
      expect(titleLargeFontWeight).toBeDefined();
      expect(titleLargeFontWeight!.value).toBe('Bold');

      expect(collection.variables).toHaveLength(3); // 2 + 1
    });

    it('should map font weights correctly', () => {
      const textTheme: TextTheme = {
        displayLarge: { fontWeight: FontWeight.w100 },
        displayMedium: { fontWeight: FontWeight.w300 },
        displaySmall: { fontWeight: FontWeight.w500 },
        headlineLarge: { fontWeight: FontWeight.w700 },
        headlineMedium: { fontWeight: FontWeight.w900 }
      };

      const collection = variableManager.createTypographyVariables(textTheme, 'Font Weights');

      const w100 = collection.variables.find(v => v.name === 'display-large-font-weight');
      expect(w100!.value).toBe('Thin');

      const w300 = collection.variables.find(v => v.name === 'display-medium-font-weight');
      expect(w300!.value).toBe('Light');

      const w500 = collection.variables.find(v => v.name === 'display-small-font-weight');
      expect(w500!.value).toBe('Medium');

      const w700 = collection.variables.find(v => v.name === 'headline-large-font-weight');
      expect(w700!.value).toBe('Bold');

      const w900 = collection.variables.find(v => v.name === 'headline-medium-font-weight');
      expect(w900!.value).toBe('Black');
    });
  });

  describe('createSpacingVariables', () => {
    it('should create spacing variables from SpacingScale', () => {
      const spacing: SpacingScale = {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
      };

      const collection = variableManager.createSpacingVariables(spacing, 'Test Spacing');

      expect(collection.name).toBe('Test Spacing');
      expect(collection.description).toBe('Spacing variables from Flutter spacing scale');
      expect(collection.variables).toHaveLength(6);

      const xsVar = collection.variables.find(v => v.name === 'spacing-xs');
      expect(xsVar).toBeDefined();
      expect(xsVar!.type).toBe(VariableType.FLOAT);
      expect(xsVar!.scopes).toContain(VariableScope.GAP);
      expect(xsVar!.scopes).toContain(VariableScope.WIDTH_HEIGHT);
      expect(xsVar!.value).toBe(4);
      expect(xsVar!.description).toBe('Spacing scale xs (4px)');

      const xxlVar = collection.variables.find(v => v.name === 'spacing-xxl');
      expect(xxlVar).toBeDefined();
      expect(xxlVar!.value).toBe(48);
    });

    it('should handle custom spacing keys', () => {
      const spacing: SpacingScale = {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        custom: 64,
        'extra-large': 80
      };

      const collection = variableManager.createSpacingVariables(spacing, 'Custom Spacing');

      expect(collection.variables).toHaveLength(8);

      const customVar = collection.variables.find(v => v.name === 'spacing-custom');
      expect(customVar).toBeDefined();
      expect(customVar!.value).toBe(64);

      const extraLargeVar = collection.variables.find(v => v.name === 'spacing-extra-large');
      expect(extraLargeVar).toBeDefined();
      expect(extraLargeVar!.value).toBe(80);
    });
  });

  describe('createBorderRadiusVariables', () => {
    it('should create border radius variables from BorderRadiusScale', () => {
      const borderRadius: BorderRadiusScale = {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999
      };

      const collection = variableManager.createBorderRadiusVariables(borderRadius, 'Test Border Radius');

      expect(collection.name).toBe('Test Border Radius');
      expect(collection.description).toBe('Border radius variables from Flutter border radius scale');
      expect(collection.variables).toHaveLength(6);

      const noneVar = collection.variables.find(v => v.name === 'border-radius-none');
      expect(noneVar).toBeDefined();
      expect(noneVar!.type).toBe(VariableType.FLOAT);
      expect(noneVar!.scopes).toEqual([VariableScope.CORNER_RADIUS]);
      expect(noneVar!.value).toBe(0);

      const fullVar = collection.variables.find(v => v.name === 'border-radius-full');
      expect(fullVar).toBeDefined();
      expect(fullVar!.value).toBe(9999);
    });
  });

  describe('createVariablesFromTheme', () => {
    it('should create all variable collections from ThemeData', () => {
      const theme: ThemeData = {
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
          }
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32,
          xxl: 48
        },
        borderRadius: {
          none: 0,
          sm: 4,
          md: 8,
          lg: 12,
          xl: 16,
          full: 9999
        }
      };

      const collections = variableManager.createVariablesFromTheme(theme, 'Material');

      expect(collections).toHaveLength(4);
      expect(collections[0].name).toBe('Material Colors');
      expect(collections[1].name).toBe('Material Typography');
      expect(collections[2].name).toBe('Material Spacing');
      expect(collections[3].name).toBe('Material Border Radius');

      // Verify collections are stored
      expect(variableManager.getAllCollections()).toHaveLength(4);
    });

    it('should use default theme name when not provided', () => {
      const theme: ThemeData = {
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
        textTheme: {},
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }
      };

      const collections = variableManager.createVariablesFromTheme(theme);

      expect(collections[0].name).toBe('Default Colors');
      expect(collections[1].name).toBe('Default Typography');
      expect(collections[2].name).toBe('Default Spacing');
      expect(collections[3].name).toBe('Default Border Radius');
    });
  });

  describe('multi-mode variables', () => {
    const lightTheme: ThemeData = {
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
        onSurface: '#000000',
        outline: '#79747E'
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

    const darkTheme: ThemeData = {
      colorScheme: {
        brightness: 'dark',
        primary: '#BB86FC',
        onPrimary: '#000000',
        secondary: '#03DAC6',
        onSecondary: '#000000',
        error: '#CF6679',
        onError: '#000000',
        background: '#121212',
        onBackground: '#FFFFFF',
        surface: '#121212',
        onSurface: '#FFFFFF',
        outline: '#938F99'
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

    describe('createMultiModeVariablesFromThemes', () => {
      it('should create multi-mode variables from light and dark themes', () => {
        const collections = variableManager.createMultiModeVariablesFromThemes(
          [lightTheme, darkTheme],
          ['Light', 'Dark'],
          'Material'
        );

        expect(collections).toHaveLength(4);
        expect(collections[0].name).toBe('Material Colors');
        expect(collections[1].name).toBe('Material Typography');
        expect(collections[2].name).toBe('Material Spacing');
        expect(collections[3].name).toBe('Material Border Radius');

        // Check modes
        collections.forEach(collection => {
          expect(collection.modes).toHaveLength(2);
          expect(collection.modes[0].name).toBe('Light');
          expect(collection.modes[1].name).toBe('Dark');
        });
      });

      it('should throw error when themes and names length mismatch', () => {
        expect(() => {
          variableManager.createMultiModeVariablesFromThemes(
            [lightTheme, darkTheme],
            ['Light'], // Only one name for two themes
            'Test'
          );
        }).toThrow('Number of themes must match number of theme names');
      });
    });

    describe('createMultiModeColorVariables', () => {
      it('should create color variables with values for each mode', () => {
        const modes = [
          { name: 'Light', modeId: 'mode-0' },
          { name: 'Dark', modeId: 'mode-1' }
        ];

        const collection = variableManager.createMultiModeColorVariables(
          [lightTheme, darkTheme],
          ['Light', 'Dark'],
          modes,
          'Test Colors'
        );

        expect(collection.name).toBe('Test Colors');
        expect(collection.modes).toEqual(modes);

        // Check primary color variable
        const primaryVar = collection.variables.find(v => v.name === 'primary');
        expect(primaryVar).toBeDefined();
        expect(primaryVar!.type).toBe(VariableType.COLOR);
        expect(primaryVar!.values).toHaveProperty('Light');
        expect(primaryVar!.values).toHaveProperty('Dark');
        
        // Light theme primary should be #6200EE
        expect(primaryVar!.values.Light.r).toBeCloseTo(0.3843137254901961, 10);
        expect(primaryVar!.values.Light.g).toBe(0);
        expect(primaryVar!.values.Light.b).toBeCloseTo(0.9333333333333333, 10);

        // Dark theme primary should be #BB86FC
        expect(primaryVar!.values.Dark.r).toBeCloseTo(0.7333333333333333, 10);
        expect(primaryVar!.values.Dark.g).toBeCloseTo(0.5254901960784314, 10);
        expect(primaryVar!.values.Dark.b).toBeCloseTo(0.9882352941176471, 10);
      });

      it('should only create variables for properties that exist in at least one theme', () => {
        const lightThemeMinimal: ThemeData = {
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
            // No optional properties
          },
          textTheme: {},
          spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
          borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }
        };

        const modes = [{ name: 'Light', modeId: 'mode-0' }];

        const collection = variableManager.createMultiModeColorVariables(
          [lightThemeMinimal],
          ['Light'],
          modes,
          'Minimal Colors'
        );

        // Should only have the 10 required color properties
        expect(collection.variables).toHaveLength(10);
        
        const surfaceVariantVar = collection.variables.find(v => v.name === 'surface-variant');
        expect(surfaceVariantVar).toBeUndefined();

        const outlineVar = collection.variables.find(v => v.name === 'outline');
        expect(outlineVar).toBeUndefined();
      });

      it('should set correct scopes for different color types', () => {
        const modes = [{ name: 'Light', modeId: 'mode-0' }];

        const collection = variableManager.createMultiModeColorVariables(
          [lightTheme],
          ['Light'],
          modes,
          'Scope Test'
        );

        const outlineVar = collection.variables.find(v => v.name === 'outline');
        expect(outlineVar!.scopes).toEqual([VariableScope.ALL_STROKES]);

        const backgroundVar = collection.variables.find(v => v.name === 'background');
        expect(backgroundVar!.scopes).toEqual([VariableScope.ALL_FILLS]);

        const primaryVar = collection.variables.find(v => v.name === 'primary');
        expect(primaryVar!.scopes).toEqual([VariableScope.ALL_FILLS, VariableScope.ALL_STROKES]);
      });
    });

    describe('createMultiModeTypographyVariables', () => {
      it('should create typography variables with values for each mode', () => {
        const modes = [
          { name: 'Light', modeId: 'mode-0' },
          { name: 'Dark', modeId: 'mode-1' }
        ];

        const collection = variableManager.createMultiModeTypographyVariables(
          [lightTheme, darkTheme],
          ['Light', 'Dark'],
          modes,
          'Test Typography'
        );

        expect(collection.name).toBe('Test Typography');
        expect(collection.modes).toEqual(modes);

        // Should have variables for both bodyLarge and headlineLarge
        const bodyLargeFontSize = collection.variables.find(v => v.name === 'body-large-font-size');
        expect(bodyLargeFontSize).toBeDefined();
        expect(bodyLargeFontSize!.values.Light).toBe(16);
        expect(bodyLargeFontSize!.values.Dark).toBe(16);

        const headlineLargeFontSize = collection.variables.find(v => v.name === 'headline-large-font-size');
        expect(headlineLargeFontSize).toBeDefined();
        expect(headlineLargeFontSize!.values.Light).toBe(32);
        expect(headlineLargeFontSize!.values.Dark).toBe(32);
      });

      it('should handle different typography across modes', () => {
        const lightThemeCustom = {
          ...lightTheme,
          textTheme: {
            bodyLarge: {
              fontSize: 16,
              fontFamily: 'Roboto'
            }
          }
        };

        const darkThemeCustom = {
          ...darkTheme,
          textTheme: {
            bodyLarge: {
              fontSize: 18, // Different font size in dark mode
              fontFamily: 'Inter' // Different font family in dark mode
            }
          }
        };

        const modes = [
          { name: 'Light', modeId: 'mode-0' },
          { name: 'Dark', modeId: 'mode-1' }
        ];

        const collection = variableManager.createMultiModeTypographyVariables(
          [lightThemeCustom, darkThemeCustom],
          ['Light', 'Dark'],
          modes,
          'Custom Typography'
        );

        const fontSizeVar = collection.variables.find(v => v.name === 'body-large-font-size');
        expect(fontSizeVar!.values.Light).toBe(16);
        expect(fontSizeVar!.values.Dark).toBe(18);

        const fontFamilyVar = collection.variables.find(v => v.name === 'body-large-font-family');
        expect(fontFamilyVar!.values.Light).toBe('Roboto');
        expect(fontFamilyVar!.values.Dark).toBe('Inter');
      });
    });

    describe('createMultiModeSpacingVariables', () => {
      it('should create spacing variables (usually same across modes)', () => {
        const modes = [
          { name: 'Light', modeId: 'mode-0' },
          { name: 'Dark', modeId: 'mode-1' }
        ];

        const collection = variableManager.createMultiModeSpacingVariables(
          [lightTheme, darkTheme],
          ['Light', 'Dark'],
          modes,
          'Test Spacing'
        );

        expect(collection.variables).toHaveLength(6); // xs, sm, md, lg, xl, xxl

        const mdVar = collection.variables.find(v => v.name === 'spacing-md');
        expect(mdVar).toBeDefined();
        expect(mdVar!.values.Light).toBe(16);
        expect(mdVar!.values.Dark).toBe(16);
        expect(mdVar!.scopes).toEqual([VariableScope.GAP, VariableScope.WIDTH_HEIGHT]);
      });
    });

    describe('createMultiModeBorderRadiusVariables', () => {
      it('should create border radius variables (usually same across modes)', () => {
        const modes = [
          { name: 'Light', modeId: 'mode-0' },
          { name: 'Dark', modeId: 'mode-1' }
        ];

        const collection = variableManager.createMultiModeBorderRadiusVariables(
          [lightTheme, darkTheme],
          ['Light', 'Dark'],
          modes,
          'Test Border Radius'
        );

        expect(collection.variables).toHaveLength(6); // none, sm, md, lg, xl, full

        const mdVar = collection.variables.find(v => v.name === 'border-radius-md');
        expect(mdVar).toBeDefined();
        expect(mdVar!.values.Light).toBe(8);
        expect(mdVar!.values.Dark).toBe(8);
        expect(mdVar!.scopes).toEqual([VariableScope.CORNER_RADIUS]);
      });
    });

    describe('multi-mode utility methods', () => {
      beforeEach(() => {
        variableManager.createMultiModeVariablesFromThemes(
          [lightTheme, darkTheme],
          ['Light', 'Dark'],
          'Test'
        );
      });

      describe('getMultiModeVariable', () => {
        it('should retrieve multi-mode variable by name from collection', () => {
          const variable = variableManager.getMultiModeVariable('Test Colors', 'primary');

          expect(variable).toBeDefined();
          expect(variable!.name).toBe('primary');
          expect(variable!.type).toBe(VariableType.COLOR);
          expect(variable!.values).toHaveProperty('Light');
          expect(variable!.values).toHaveProperty('Dark');
        });

        it('should return undefined for non-existent variable', () => {
          const variable = variableManager.getMultiModeVariable('Test Colors', 'non-existent');
          expect(variable).toBeUndefined();
        });

        it('should return undefined for non-existent collection', () => {
          const variable = variableManager.getMultiModeVariable('Non-existent', 'primary');
          expect(variable).toBeUndefined();
        });
      });

      describe('getMultiModeVariablesFromCollection', () => {
        it('should return all multi-mode variables from collection', () => {
          const variables = variableManager.getMultiModeVariablesFromCollection('Test Colors');

          expect(variables.length).toBeGreaterThan(0);
          expect(variables.every(v => v.values && typeof v.values === 'object')).toBe(true);
        });

        it('should return empty array for non-existent collection', () => {
          const variables = variableManager.getMultiModeVariablesFromCollection('Non-existent');
          expect(variables).toEqual([]);
        });
      });

      describe('getAllMultiModeCollections', () => {
        it('should return all stored multi-mode collections', () => {
          const collections = variableManager.getAllMultiModeCollections();

          expect(collections).toHaveLength(4);
          expect(collections.map(c => c.name)).toEqual([
            'Test Colors',
            'Test Typography',
            'Test Spacing',
            'Test Border Radius'
          ]);

          collections.forEach(collection => {
            expect(collection.modes).toHaveLength(2);
            expect(collection.modes[0].name).toBe('Light');
            expect(collection.modes[1].name).toBe('Dark');
          });
        });
      });
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      const theme: ThemeData = {
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
          bodyLarge: { fontSize: 16 }
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }
      };

      variableManager.createVariablesFromTheme(theme, 'Test');
    });

    describe('getVariable', () => {
      it('should retrieve variable by name from collection', () => {
        const variable = variableManager.getVariable('Test Colors', 'primary');

        expect(variable).toBeDefined();
        expect(variable!.name).toBe('primary');
        expect(variable!.type).toBe(VariableType.COLOR);
      });

      it('should return undefined for non-existent variable', () => {
        const variable = variableManager.getVariable('Test Colors', 'non-existent');
        expect(variable).toBeUndefined();
      });

      it('should return undefined for non-existent collection', () => {
        const variable = variableManager.getVariable('Non-existent', 'primary');
        expect(variable).toBeUndefined();
      });
    });

    describe('getVariablesFromCollection', () => {
      it('should return all variables from collection', () => {
        const variables = variableManager.getVariablesFromCollection('Test Colors');

        expect(variables).toHaveLength(10); // All color variables
        expect(variables.every(v => v.type === VariableType.COLOR)).toBe(true);
      });

      it('should return empty array for non-existent collection', () => {
        const variables = variableManager.getVariablesFromCollection('Non-existent');
        expect(variables).toEqual([]);
      });
    });

    describe('getAllCollections', () => {
      it('should return all stored collections', () => {
        const collections = variableManager.getAllCollections();

        expect(collections).toHaveLength(4);
        expect(collections.map(c => c.name)).toEqual([
          'Test Colors',
          'Test Typography',
          'Test Spacing',
          'Test Border Radius'
        ]);
      });
    });

    describe('generateVariableName', () => {
      it('should generate variable names from theme paths', () => {
        expect(variableManager.generateVariableName('colorScheme.primary')).toBe('primary');
        expect(variableManager.generateVariableName('colorScheme.onPrimary')).toBe('on-primary');
        expect(variableManager.generateVariableName('textTheme.bodyLarge.fontSize')).toBe('body-large.font-size');
        expect(variableManager.generateVariableName('textTheme.displayLarge')).toBe('display-large');
        expect(variableManager.generateVariableName('primaryColor')).toBe('primary-color');
      });
    });
  });
});
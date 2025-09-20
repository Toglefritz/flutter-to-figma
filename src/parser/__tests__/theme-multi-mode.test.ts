import { ThemeAnalyzer } from '../theme-analyzer';
import { DartParser } from '../dart-parser';
import { ThemeData, ColorScheme, TextTheme, FontWeight } from '../../schema/theme-schema';

describe('ThemeAnalyzer - Multi-Mode Support', () => {
  let analyzer: ThemeAnalyzer;
  let parser: DartParser;

  beforeEach(() => {
    analyzer = new ThemeAnalyzer();
    parser = new DartParser();
  });

  describe('Theme mode detection', () => {
    it('should detect light and dark themes in MaterialApp', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            brightness: Brightness.light,
            colorScheme: ColorScheme.light(
              primary: Colors.blue
            )
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            colorScheme: ColorScheme.dark(
              primary: Colors.purple
            )
          ),
          themeMode: ThemeMode.system
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const detection = analyzer.detectThemeModes(parseResult.ast!.body);
      
      expect(detection.hasLightTheme).toBe(true);
      expect(detection.hasDarkTheme).toBe(true);
      expect(detection.hasSystemMode).toBe(true);
      expect(detection.defaultMode).toBe('system');
    });

    it('should detect individual theme modes', () => {
      const lightCode = `
        ThemeData(
          brightness: Brightness.light,
          colorScheme: ColorScheme.light(primary: Colors.blue)
        )
      `;

      const darkCode = `
        ThemeData(
          brightness: Brightness.dark,
          colorScheme: ColorScheme.dark(primary: Colors.purple)
        )
      `;

      const lightParseResult = parser.parseFile(lightCode);
      const lightDetection = analyzer.detectThemeModes(lightParseResult.ast!.body);
      
      expect(lightDetection.hasLightTheme).toBe(true);
      expect(lightDetection.hasDarkTheme).toBe(false);

      const darkParseResult = parser.parseFile(darkCode);
      const darkDetection = analyzer.detectThemeModes(darkParseResult.ast!.body);
      
      expect(darkDetection.hasLightTheme).toBe(false);
      expect(darkDetection.hasDarkTheme).toBe(true);
    });

    it('should handle different theme mode configurations', () => {
      const systemModeCode = `
        MaterialApp(
          theme: ThemeData(),
          themeMode: ThemeMode.system
        )
      `;

      const lightModeCode = `
        MaterialApp(
          theme: ThemeData(),
          themeMode: ThemeMode.light
        )
      `;

      const darkModeCode = `
        MaterialApp(
          theme: ThemeData(),
          themeMode: ThemeMode.dark
        )
      `;

      for (const [code, expectedMode] of [
        [systemModeCode, 'system'],
        [lightModeCode, 'light'],
        [darkModeCode, 'dark']
      ] as const) {
        const parseResult = parser.parseFile(code);
        const detection = analyzer.detectThemeModes(parseResult.ast!.body);
        expect(detection.defaultMode).toBe(expectedMode);
      }
    });
  });

  describe('Multi-mode theme reference resolution', () => {
    it('should resolve references for both light and dark modes', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.light(
              primary: Colors.blue,
              secondary: Colors.green
            )
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.dark(
              primary: Colors.purple,
              secondary: Colors.orange
            )
          ),
          themeMode: ThemeMode.system
        )
      `;

      const parseResult = parser.parseFile(code);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      const references = [
        { path: 'Theme.of(context).primaryColor' },
        { path: 'Theme.of(context).colorScheme.secondary' }
      ];

      const resolutions = analyzer.resolveMultiModeThemeReferences(
        references, 
        result.themes, 
        result.modes
      );

      expect(resolutions).toHaveLength(2);

      const primaryRes = resolutions.find(r => r.reference.path.includes('primaryColor'));
      expect(primaryRes?.lightValue).toBe('#2196F3'); // Colors.blue
      expect(primaryRes?.darkValue).toBe('#9C27B0'); // Colors.purple
      expect(primaryRes?.preferredMode).toBe('system');

      const secondaryRes = resolutions.find(r => r.reference.path.includes('secondary'));
      expect(secondaryRes?.lightValue).toBe('#4CAF50'); // Colors.green
      expect(secondaryRes?.darkValue).toBe('#FF9800'); // Colors.orange
    });

    it('should handle missing dark theme gracefully', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.light(
              primary: Colors.blue
            )
          ),
          themeMode: ThemeMode.light
        )
      `;

      const parseResult = parser.parseFile(code);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      const references = [
        { path: 'Theme.of(context).primaryColor', fallbackValue: '#000000' }
      ];

      const resolutions = analyzer.resolveMultiModeThemeReferences(
        references, 
        result.themes, 
        result.modes
      );

      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].lightValue).toBe('#2196F3');
      expect(resolutions[0].darkValue).toBe('#000000'); // fallback
      expect(resolutions[0].preferredMode).toBe('light');
    });
  });

  describe('Multi-mode theme resolver utility', () => {
    it('should create a multi-mode resolver with convenience methods', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.light(
              primary: Colors.blue,
              background: Colors.white
            )
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.dark(
              primary: Colors.purple,
              background: Colors.black
            )
          ),
          themeMode: ThemeMode.system
        )
      `;

      const parseResult = parser.parseFile(code);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      const resolver = analyzer.createMultiModeThemeResolver(result.themes, result.modes);

      // Test mode-specific resolution
      expect(resolver.resolve('Theme.of(context).primaryColor', 'light')).toBe('#2196F3');
      expect(resolver.resolve('Theme.of(context).primaryColor', 'dark')).toBe('#9C27B0');
      expect(resolver.resolve('Theme.of(context).backgroundColor', 'light')).toBe('#FFFFFF');
      expect(resolver.resolve('Theme.of(context).backgroundColor', 'dark')).toBe('#000000');

      // Test system mode (should default to light in this case)
      expect(resolver.resolve('Theme.of(context).primaryColor', 'system')).toBe('#2196F3');

      // Test resolveAll method
      const allResolutions = resolver.resolveAll('Theme.of(context).primaryColor');
      expect(allResolutions.lightValue).toBe('#2196F3');
      expect(allResolutions.darkValue).toBe('#9C27B0');
      expect(allResolutions.preferredMode).toBe('system');

      // Test utility methods
      expect(resolver.hasMode('light')).toBe(true);
      expect(resolver.hasMode('dark')).toBe(true);
      expect(resolver.getAvailableModes()).toEqual(['light', 'dark']);
      expect(resolver.getPreferredMode()).toBe('system');
    });

    it('should handle single theme mode correctly', () => {
      const code = `
        ThemeData(
          brightness: Brightness.light,
          colorScheme: ColorScheme.light(
            primary: Colors.blue
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      const resolver = analyzer.createMultiModeThemeResolver(result.themes, result.modes);

      expect(resolver.hasMode('light')).toBe(true);
      expect(resolver.hasMode('dark')).toBe(false);
      expect(resolver.getAvailableModes()).toEqual(['light']);
      expect(resolver.getPreferredMode()).toBe('light');

      // Dark mode should return null or fallback
      expect(resolver.resolve('Theme.of(context).primaryColor', 'light')).toBe('#2196F3');
      expect(resolver.resolve('Theme.of(context).primaryColor', 'dark')).toBeNull();
    });
  });

  describe('Theme mode mappings for Figma Variables', () => {
    it('should generate theme mode mappings for Figma Variables', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.light(
              primary: Colors.blue,
              secondary: Colors.green,
              background: Colors.white
            ),
            textTheme: TextTheme(
              bodyLarge: TextStyle(
                fontSize: 16,
                color: Colors.black
              )
            )
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.dark(
              primary: Colors.purple,
              secondary: Colors.orange,
              background: Colors.black
            ),
            textTheme: TextTheme(
              bodyLarge: TextStyle(
                fontSize: 16,
                color: Colors.white
              )
            )
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      const mappings = analyzer.generateThemeModeMappings(result.themes, result.modes);

      // Check color mappings
      expect(mappings.colorMappings.primary).toEqual({
        light: '#2196F3',
        dark: '#9C27B0'
      });
      expect(mappings.colorMappings.secondary).toEqual({
        light: '#4CAF50',
        dark: '#FF9800'
      });
      expect(mappings.colorMappings.background).toEqual({
        light: '#FFFFFF',
        dark: '#000000'
      });

      // Check typography mappings
      expect(mappings.typographyMappings.bodyLarge).toBeDefined();
      expect(mappings.typographyMappings.bodyLarge.light.fontSize).toBe(16);
      expect(mappings.typographyMappings.bodyLarge.light.color).toBe('#000000');
      expect(mappings.typographyMappings.bodyLarge.dark.fontSize).toBe(16);
      expect(mappings.typographyMappings.bodyLarge.dark.color).toBe('#FFFFFF');

      // Check spacing mappings (should be the same for both modes in this case)
      expect(mappings.spacingMappings.xs).toEqual({
        light: 4,
        dark: 4
      });
      expect(mappings.spacingMappings.md).toEqual({
        light: 16,
        dark: 16
      });
    });

    it('should handle single mode mappings', () => {
      const code = `
        ThemeData(
          brightness: Brightness.light,
          colorScheme: ColorScheme.light(
            primary: Colors.blue,
            secondary: Colors.green
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      const mappings = analyzer.generateThemeModeMappings(result.themes, result.modes);

      // Should only have light mode values
      expect(mappings.colorMappings.primary).toEqual({
        light: '#2196F3',
        dark: undefined
      });
      expect(mappings.colorMappings.secondary).toEqual({
        light: '#4CAF50',
        dark: undefined
      });
    });
  });

  describe('Complex multi-mode scenarios', () => {
    it('should handle comprehensive multi-mode theme configuration', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            brightness: Brightness.light,
            colorScheme: ColorScheme.light(
              primary: Colors.blue,
              secondary: Colors.green,
              background: Colors.white,
              surface: Colors.grey,
              error: Colors.red
            ),
            textTheme: TextTheme(
              headlineLarge: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.black
              ),
              bodyMedium: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.normal,
                color: Colors.black87
              )
            )
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            colorScheme: ColorScheme.dark(
              primary: Colors.purple,
              secondary: Colors.orange,
              background: Colors.black,
              surface: Colors.grey,
              error: Colors.red
            ),
            textTheme: TextTheme(
              headlineLarge: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white
              ),
              bodyMedium: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.normal,
                color: Colors.white70
              )
            )
          ),
          themeMode: ThemeMode.system
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      expect(result.modes).toHaveLength(1);
      expect(result.modes[0].lightTheme).toBeDefined();
      expect(result.modes[0].darkTheme).toBeDefined();

      const detection = analyzer.detectThemeModes(parseResult.ast!.body);
      expect(detection.hasLightTheme).toBe(true);
      expect(detection.hasDarkTheme).toBe(true);
      expect(detection.hasSystemMode).toBe(true);

      const resolver = analyzer.createMultiModeThemeResolver(result.themes, result.modes);
      
      // Test various theme properties in both modes
      expect(resolver.resolve('Theme.of(context).primaryColor', 'light')).toBe('#2196F3');
      expect(resolver.resolve('Theme.of(context).primaryColor', 'dark')).toBe('#9C27B0');
      
      expect(resolver.resolve('Theme.of(context).backgroundColor', 'light')).toBe('#FFFFFF');
      expect(resolver.resolve('Theme.of(context).backgroundColor', 'dark')).toBe('#000000');

      // Test text theme resolution
      const lightHeadlineStyle = resolver.resolveAll('Theme.of(context).textTheme.headlineLarge');
      expect(lightHeadlineStyle.lightValue).toBeNull(); // Complex object, not a simple string
      
      const mappings = analyzer.generateThemeModeMappings(result.themes, result.modes);
      expect(mappings.colorMappings.primary.light).toBe('#2196F3');
      expect(mappings.colorMappings.primary.dark).toBe('#9C27B0');
      expect(mappings.typographyMappings.headlineLarge.light.fontSize).toBe(32);
      expect(mappings.typographyMappings.headlineLarge.dark.fontSize).toBe(32);
      expect(mappings.typographyMappings.headlineLarge.light.color).toBe('#000000');
      expect(mappings.typographyMappings.headlineLarge.dark.color).toBe('#FFFFFF');
    });
  });
});
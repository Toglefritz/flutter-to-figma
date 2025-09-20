import { ThemeAnalyzer } from '../theme-analyzer';
import { DartParser } from '../dart-parser';
import { ThemeData, ColorScheme, TextTheme, FontWeight } from '../../schema/theme-schema';

describe('ThemeAnalyzer', () => {
  let analyzer: ThemeAnalyzer;
  let parser: DartParser;

  beforeEach(() => {
    analyzer = new ThemeAnalyzer();
    parser = new DartParser();
  });

  describe('Basic ThemeData parsing', () => {
    it('should parse simple ThemeData constructor', () => {
      const code = `
        ThemeData(
          primarySwatch: Colors.blue,
          brightness: Brightness.light
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);
      expect(parseResult.ast).toBeDefined();

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      expect(result.themes[0].brightness).toBe('light');
      expect(result.errors).toHaveLength(0);
    });

    it('should parse ThemeData with ColorScheme', () => {
      const code = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.blue,
            secondary: Colors.green,
            background: Colors.white
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      expect(result.themes[0].colorScheme.brightness).toBe('light');
      expect(result.themes[0].colorScheme.primary).toBe('#2196F3');
      expect(result.themes[0].colorScheme.secondary).toBe('#4CAF50');
      expect(result.themes[0].colorScheme.background).toBe('#FFFFFF');
    });

    it('should parse dark ColorScheme', () => {
      const code = `
        ColorScheme.dark(
          primary: Colors.purple,
          surface: Colors.grey
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(0); // ColorScheme alone doesn't create ThemeData
      // But if we had a way to extract standalone ColorSchemes, we would test that
    });
  });

  describe('TextTheme parsing', () => {
    it('should parse TextTheme with TextStyle properties', () => {
      const code = `
        ThemeData(
          textTheme: TextTheme(
            headlineLarge: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.black
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.normal,
              letterSpacing: 0.5
            )
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      const textTheme = result.themes[0].textTheme;
      
      expect(textTheme.headlineLarge).toBeDefined();
      expect(textTheme.headlineLarge!.fontSize).toBe(32);
      expect(textTheme.headlineLarge!.fontWeight).toBe(FontWeight.w700);
      expect(textTheme.headlineLarge!.color).toBe('#000000');
      
      expect(textTheme.bodyMedium).toBeDefined();
      expect(textTheme.bodyMedium!.fontSize).toBe(14);
      expect(textTheme.bodyMedium!.fontWeight).toBe(FontWeight.w400);
      expect(textTheme.bodyMedium!.letterSpacing).toBe(0.5);
    });

    it('should handle all TextTheme style properties', () => {
      const code = `
        TextTheme(
          displayLarge: TextStyle(fontSize: 57),
          displayMedium: TextStyle(fontSize: 45),
          displaySmall: TextStyle(fontSize: 36),
          headlineLarge: TextStyle(fontSize: 32),
          headlineMedium: TextStyle(fontSize: 28),
          headlineSmall: TextStyle(fontSize: 24),
          titleLarge: TextStyle(fontSize: 22),
          titleMedium: TextStyle(fontSize: 16),
          titleSmall: TextStyle(fontSize: 14),
          bodyLarge: TextStyle(fontSize: 16),
          bodyMedium: TextStyle(fontSize: 14),
          bodySmall: TextStyle(fontSize: 12),
          labelLarge: TextStyle(fontSize: 14),
          labelMedium: TextStyle(fontSize: 12),
          labelSmall: TextStyle(fontSize: 11)
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      // Note: This would need to be part of a ThemeData to be extracted
      // For now, we'll test that the parser can handle the structure
      expect(parseResult.errors).toHaveLength(0);
    });
  });

  describe('Color parsing', () => {
    it('should parse Color constructor with hex values', () => {
      const code = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Color(0xFF2196F3),
            secondary: Color(0xFF4CAF50)
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      expect(result.themes[0].colorScheme.primary).toBe('#ff2196f3');
      expect(result.themes[0].colorScheme.secondary).toBe('#ff4caf50');
    });

    it('should parse Colors constants', () => {
      const code = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.blue,
            secondary: Colors.green,
            error: Colors.red,
            background: Colors.white,
            surface: Colors.grey
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      const colorScheme = result.themes[0].colorScheme;
      expect(colorScheme.primary).toBe('#2196F3');
      expect(colorScheme.secondary).toBe('#4CAF50');
      expect(colorScheme.error).toBe('#F44336');
      expect(colorScheme.background).toBe('#FFFFFF');
      expect(colorScheme.surface).toBe('#9E9E9E');
    });
  });

  describe('MaterialApp theme mode parsing', () => {
    it('should parse MaterialApp with light and dark themes', () => {
      const code = `
        MaterialApp(
          theme: ThemeData(
            brightness: Brightness.light,
            primarySwatch: Colors.blue
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            primarySwatch: Colors.purple
          ),
          themeMode: ThemeMode.system
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.modes).toHaveLength(1);
      expect(result.modes[0].mode).toBe('system');
      expect(result.modes[0].lightTheme).toBeDefined();
      expect(result.modes[0].darkTheme).toBeDefined();
      expect(result.modes[0].lightTheme.brightness).toBe('light');
      expect(result.modes[0].darkTheme!.brightness).toBe('dark');
    });

    it('should handle different theme modes', () => {
      const lightCode = `
        MaterialApp(
          theme: ThemeData(),
          themeMode: ThemeMode.light
        )
      `;

      const darkCode = `
        MaterialApp(
          theme: ThemeData(),
          themeMode: ThemeMode.dark
        )
      `;

      const systemCode = `
        MaterialApp(
          theme: ThemeData(),
          themeMode: ThemeMode.system
        )
      `;

      for (const [code, expectedMode] of [
        [lightCode, 'light'],
        [darkCode, 'dark'],
        [systemCode, 'system']
      ] as const) {
        const parseResult = parser.parseFile(code);
        expect(parseResult.success).toBe(true);

        const result = analyzer.extractThemes(parseResult.ast!.body);
        expect(result.modes).toHaveLength(1);
        expect(result.modes[0].mode).toBe(expectedMode);
      }
    });
  });

  describe('Theme references detection', () => {
    it('should detect Theme.of(context) references', () => {
      const code = `
        Container(
          color: Theme.of(context).primaryColor,
          child: Text(
            "Hello",
            style: Theme.of(context).textTheme.bodyLarge
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.references.length).toBeGreaterThan(0);
      
      const primaryColorRef = result.references.find(ref => 
        ref.path.includes('primaryColor')
      );
      expect(primaryColorRef).toBeDefined();
      
      const textStyleRef = result.references.find(ref => 
        ref.path.includes('textTheme.bodyLarge')
      );
      expect(textStyleRef).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle malformed ThemeData gracefully', () => {
      const code = `
        ThemeData(
          invalidProperty: "invalid",
          colorScheme: "not a color scheme"
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      // Should still create a theme with defaults, but may have warnings
      expect(result.themes).toHaveLength(1);
      // Errors or warnings might be present for invalid properties
    });

    it('should handle syntax errors in theme definitions', () => {
      const code = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.blue
            // Missing comma - syntax error
            secondary: Colors.green
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      // This should fail at the parser level
      expect(parseResult.success).toBe(false);
      expect(parseResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex theme configurations', () => {
    it('should parse comprehensive theme configuration', () => {
      const code = `
        ThemeData(
          brightness: Brightness.light,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.deepPurple,
            brightness: Brightness.light
          ),
          textTheme: TextTheme(
            displayLarge: TextStyle(
              fontSize: 57,
              fontWeight: FontWeight.w400,
              letterSpacing: 0.25,
              color: Colors.black87
            ),
            headlineMedium: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w400,
              letterSpacing: 0,
              color: Colors.black87
            ),
            bodyLarge: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              letterSpacing: 0.5,
              color: Colors.black87
            )
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      const theme = result.themes[0];
      
      expect(theme.brightness).toBe('light');
      expect(theme.colorScheme).toBeDefined();
      expect(theme.textTheme).toBeDefined();
      
      // Check text theme details
      expect(theme.textTheme.displayLarge?.fontSize).toBe(57);
      expect(theme.textTheme.displayLarge?.fontWeight).toBe(FontWeight.w400);
      expect(theme.textTheme.displayLarge?.letterSpacing).toBe(0.25);
      
      expect(theme.textTheme.headlineMedium?.fontSize).toBe(28);
      expect(theme.textTheme.bodyLarge?.fontSize).toBe(16);
      expect(theme.textTheme.bodyLarge?.letterSpacing).toBe(0.5);
    });
  });

  describe('Default values', () => {
    it('should provide default values for incomplete themes', () => {
      const code = `
        ThemeData()
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      expect(result.themes).toHaveLength(1);
      const theme = result.themes[0];
      
      // Should have default values
      expect(theme.colorScheme).toBeDefined();
      expect(theme.textTheme).toBeDefined();
      expect(theme.spacing).toBeDefined();
      expect(theme.borderRadius).toBeDefined();
      expect(theme.brightness).toBe('light');
      
      // Check default spacing
      expect(theme.spacing.xs).toBe(4);
      expect(theme.spacing.sm).toBe(8);
      expect(theme.spacing.md).toBe(16);
      expect(theme.spacing.lg).toBe(24);
      expect(theme.spacing.xl).toBe(32);
      expect(theme.spacing.xxl).toBe(48);
      
      // Check default border radius
      expect(theme.borderRadius.none).toBe(0);
      expect(theme.borderRadius.sm).toBe(4);
      expect(theme.borderRadius.md).toBe(8);
      expect(theme.borderRadius.lg).toBe(12);
      expect(theme.borderRadius.xl).toBe(16);
      expect(theme.borderRadius.full).toBe(9999);
    });
  });
});
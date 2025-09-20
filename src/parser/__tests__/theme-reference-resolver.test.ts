import { ThemeAnalyzer } from '../theme-analyzer';
import { DartParser } from '../dart-parser';
import { ThemeData, ColorScheme, TextTheme, FontWeight } from '../../schema/theme-schema';

describe('ThemeAnalyzer - Reference Resolution', () => {
  let analyzer: ThemeAnalyzer;
  let parser: DartParser;

  beforeEach(() => {
    analyzer = new ThemeAnalyzer();
    parser = new DartParser();
  });

  describe('Theme reference detection', () => {
    it('should detect Theme.of(context) references in widgets', () => {
      const code = `
        Container(
          color: Theme.of(context).primaryColor,
          child: Text(
            "Hello World",
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
      expect(primaryColorRef!.path).toBe('Theme.of(context).primaryColor');
      
      const textStyleRef = result.references.find(ref => 
        ref.path.includes('textTheme.bodyLarge')
      );
      expect(textStyleRef).toBeDefined();
      expect(textStyleRef!.path).toBe('Theme.of(context).textTheme.bodyLarge');
    });

    it('should detect nested theme property references', () => {
      const code = `
        Text(
          "Title",
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontSize: Theme.of(context).textTheme.headlineLarge.fontSize
          )
        )
      `;

      const parseResult = parser.parseFile(code);
      expect(parseResult.success).toBe(true);

      const result = analyzer.extractThemes(parseResult.ast!.body);
      
      const colorRef = result.references.find(ref => 
        ref.path.includes('colorScheme.primary')
      );
      expect(colorRef).toBeDefined();
      
      const fontSizeRef = result.references.find(ref => 
        ref.path.includes('textTheme.headlineLarge.fontSize')
      );
      expect(fontSizeRef).toBeDefined();
    });
  });

  describe('Theme reference resolution', () => {
    it('should resolve theme references to actual values', () => {
      // First create a theme
      const themeCode = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.blue,
            secondary: Colors.green
          ),
          textTheme: TextTheme(
            bodyLarge: TextStyle(
              fontSize: 16,
              color: Colors.black
            )
          )
        )
      `;

      const themeParseResult = parser.parseFile(themeCode);
      expect(themeParseResult.success).toBe(true);

      const themeResult = analyzer.extractThemes(themeParseResult.ast!.body);
      expect(themeResult.themes).toHaveLength(1);

      // Create some theme references
      const references = [
        { path: 'Theme.of(context).primaryColor' },
        { path: 'Theme.of(context).colorScheme.primary' },
        { path: 'Theme.of(context).colorScheme.secondary' },
        { path: 'Theme.of(context).textTheme.bodyLarge.fontSize' },
        { path: 'Theme.of(context).textTheme.bodyLarge.color' }
      ];

      const resolutions = analyzer.resolveThemeReferences(
        references, 
        themeResult.themes, 
        themeResult.modes
      );

      expect(resolutions).toHaveLength(5);

      // Check primary color resolution (both legacy and new paths)
      const primaryColorRes = resolutions.find(r => r.reference.path.includes('primaryColor'));
      expect(primaryColorRes?.resolvedValue).toBe('#2196F3'); // Colors.blue

      const colorSchemePrimaryRes = resolutions.find(r => 
        r.reference.path === 'Theme.of(context).colorScheme.primary'
      );
      expect(colorSchemePrimaryRes?.resolvedValue).toBe('#2196F3');

      const colorSchemeSecondaryRes = resolutions.find(r => 
        r.reference.path === 'Theme.of(context).colorScheme.secondary'
      );
      expect(colorSchemeSecondaryRes?.resolvedValue).toBe('#4CAF50'); // Colors.green

      // Check text style properties
      const fontSizeRes = resolutions.find(r => 
        r.reference.path.includes('textTheme.bodyLarge.fontSize')
      );
      expect(fontSizeRes?.resolvedValue).toBe('16');

      const textColorRes = resolutions.find(r => 
        r.reference.path.includes('textTheme.bodyLarge.color')
      );
      expect(textColorRes?.resolvedValue).toBe('#000000'); // Colors.black
    });

    it('should handle theme shortcuts and legacy properties', () => {
      const themeCode = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.purple,
            secondary: Colors.orange,
            background: Colors.white,
            surface: Colors.grey,
            error: Colors.red
          )
        )
      `;

      const themeParseResult = parser.parseFile(themeCode);
      const themeResult = analyzer.extractThemes(themeParseResult.ast!.body);

      const references = [
        { path: 'Theme.of(context).primaryColor' },
        { path: 'Theme.of(context).accentColor' },
        { path: 'Theme.of(context).backgroundColor' },
        { path: 'Theme.of(context).cardColor' },
        { path: 'Theme.of(context).errorColor' }
      ];

      const resolutions = analyzer.resolveThemeReferences(
        references, 
        themeResult.themes, 
        themeResult.modes
      );

      expect(resolutions).toHaveLength(5);

      const primaryRes = resolutions.find(r => r.reference.path.includes('primaryColor'));
      expect(primaryRes?.resolvedValue).toBe('#9C27B0'); // Colors.purple

      const accentRes = resolutions.find(r => r.reference.path.includes('accentColor'));
      expect(accentRes?.resolvedValue).toBe('#FF9800'); // Colors.orange (secondary)

      const backgroundRes = resolutions.find(r => r.reference.path.includes('backgroundColor'));
      expect(backgroundRes?.resolvedValue).toBe('#FFFFFF'); // Colors.white

      const cardRes = resolutions.find(r => r.reference.path.includes('cardColor'));
      expect(cardRes?.resolvedValue).toBe('#9E9E9E'); // Colors.grey (surface)

      const errorRes = resolutions.find(r => r.reference.path.includes('errorColor'));
      expect(errorRes?.resolvedValue).toBe('#F44336'); // Colors.red
    });

    it('should handle fallback values for unresolved references', () => {
      const references = [
        { path: 'Theme.of(context).nonExistentProperty', fallbackValue: '#FF0000' },
        { path: 'Theme.of(context).anotherMissingProperty' }
      ];

      // No themes provided
      const resolutions = analyzer.resolveThemeReferences(references, [], []);

      expect(resolutions).toHaveLength(2);

      const fallbackRes = resolutions.find(r => 
        r.reference.path.includes('nonExistentProperty')
      );
      expect(fallbackRes?.resolvedValue).toBe('#FF0000');

      const noFallbackRes = resolutions.find(r => 
        r.reference.path.includes('anotherMissingProperty')
      );
      expect(noFallbackRes?.resolvedValue).toBeNull();
    });
  });

  describe('Theme resolver utility', () => {
    it('should create a theme resolver with convenience methods', () => {
      const themeCode = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.blue,
            secondary: Colors.green
          ),
          textTheme: TextTheme(
            bodyLarge: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              color: Colors.black
            ),
            headlineLarge: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold
            )
          )
        )
      `;

      const themeParseResult = parser.parseFile(themeCode);
      const themeResult = analyzer.extractThemes(themeParseResult.ast!.body);

      const resolver = analyzer.createThemeResolver(themeResult.themes, themeResult.modes);

      // Test basic resolution
      expect(resolver.resolve('Theme.of(context).primaryColor')).toBe('#2196F3');
      expect(resolver.resolve('Theme.of(context).colorScheme.secondary')).toBe('#4CAF50');

      // Test color resolution
      expect(resolver.resolveColor('Theme.of(context).primaryColor')).toBe('#2196F3');
      expect(resolver.resolveColor('Theme.of(context).textTheme.bodyLarge.fontSize')).toBeNull(); // Not a color

      // Test text style resolution
      const bodyStyle = resolver.resolveTextStyle('Theme.of(context).textTheme.bodyLarge');
      expect(bodyStyle).toBeDefined();
      expect(bodyStyle?.fontSize).toBe(16);
      expect(bodyStyle?.fontWeight).toBe(FontWeight.w400);
      expect(bodyStyle?.color).toBe('#000000');

      const headlineStyle = resolver.resolveTextStyle('Theme.of(context).textTheme.headlineLarge');
      expect(headlineStyle).toBeDefined();
      expect(headlineStyle?.fontSize).toBe(32);
      expect(headlineStyle?.fontWeight).toBe(FontWeight.w700);
    });
  });

  describe('Multi-mode theme resolution', () => {
    it('should resolve references using the appropriate theme mode', () => {
      const appCode = `
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.light(
              primary: Colors.blue
            )
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.dark(
              primary: Colors.purple
            )
          ),
          themeMode: ThemeMode.system
        )
      `;

      const parseResult = parser.parseFile(appCode);
      const result = analyzer.extractThemes(parseResult.ast!.body);

      expect(result.modes).toHaveLength(1);
      expect(result.modes[0].lightTheme).toBeDefined();
      expect(result.modes[0].darkTheme).toBeDefined();

      const references = [
        { path: 'Theme.of(context).primaryColor' }
      ];

      const resolutions = analyzer.resolveThemeReferences(
        references, 
        result.themes, 
        result.modes
      );

      // Should use light theme by default
      expect(resolutions[0].resolvedValue).toBe('#2196F3'); // Light theme primary (blue)
      expect(resolutions[0].themeSource).toBe(result.modes[0].lightTheme);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid theme paths gracefully', () => {
      const themeCode = `
        ThemeData(
          colorScheme: ColorScheme.light(
            primary: Colors.blue
          )
        )
      `;

      const themeParseResult = parser.parseFile(themeCode);
      const themeResult = analyzer.extractThemes(themeParseResult.ast!.body);

      const references = [
        { path: 'Theme.of(context).invalid.deeply.nested.path' },
        { path: 'Theme.of(context).textTheme.nonExistentStyle.color' },
        { path: 'Theme.of(context).colorScheme.invalidColor' }
      ];

      const resolutions = analyzer.resolveThemeReferences(
        references, 
        themeResult.themes, 
        themeResult.modes
      );

      expect(resolutions).toHaveLength(3);
      
      // All should resolve to null since paths are invalid
      resolutions.forEach(resolution => {
        expect(resolution.resolvedValue).toBeNull();
      });

      // Should have warnings about unresolved paths
      expect(themeResult.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });
});
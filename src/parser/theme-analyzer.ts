import {
  ThemeData,
  ColorScheme,
  TextTheme,
  TextStyle,
  FontWeight,
  SpacingScale,
  BorderRadiusScale,
  MaterialColor,
  ThemeReference,
  ExtractedTheme,
  ThemeMode
} from '../schema/theme-schema';
import {
  ASTNode,
  ASTNodeType,
  ConstructorCallNode,
  NamedArgumentNode,
  LiteralNode,
  IdentifierNode,
  PropertyAccessNode,
  MethodCallNode,
  ParseError
} from './dart-parser';

/**
 * Theme extraction result
 */
export interface ThemeExtractionResult {
  themes: ThemeData[];
  references: ThemeReference[];
  modes: ThemeMode[];
  errors: string[];
  warnings: string[];
}

/**
 * Theme reference resolution result
 */
export interface ThemeReferenceResolution {
  reference: ThemeReference;
  resolvedValue: string | null;
  themeSource: ThemeData | null;
}

/**
 * Multi-mode theme resolution result
 */
export interface MultiModeThemeResolution {
  reference: ThemeReference;
  lightValue: string | null;
  darkValue: string | null;
  systemValue: string | null;
  preferredMode: 'light' | 'dark' | 'system';
}

/**
 * Theme mode detection result
 */
export interface ThemeModeDetection {
  hasLightTheme: boolean;
  hasDarkTheme: boolean;
  hasSystemMode: boolean;
  defaultMode: 'light' | 'dark' | 'system';
  conditionalThemes: ConditionalTheme[];
}

/**
 * Conditional theme application
 */
export interface ConditionalTheme {
  condition: string; // e.g., "MediaQuery.of(context).platformBrightness == Brightness.dark"
  theme: ThemeData;
  mode: 'light' | 'dark';
}

/**
 * Theme analyzer for extracting Flutter ThemeData from AST
 */
export class ThemeAnalyzer {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Extract theme data from AST nodes
   */
  extractThemes(nodes: ASTNode[]): ThemeExtractionResult {
    this.errors = [];
    this.warnings = [];

    const themes: ThemeData[] = [];
    const references: ThemeReference[] = [];
    const modes: ThemeMode[] = [];

    for (const node of nodes) {
      this.analyzeNode(node, themes, references, modes);
    }

    return {
      themes,
      references,
      modes,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Analyze a single AST node for theme information
   */
  private analyzeNode(
    node: ASTNode,
    themes: ThemeData[],
    references: ThemeReference[],
    modes: ThemeMode[]
  ): void {
    switch (node.type) {
      case ASTNodeType.CONSTRUCTOR_CALL:
        this.analyzeConstructorCall(node as ConstructorCallNode, themes, references, modes);
        break;
      case ASTNodeType.PROPERTY_ACCESS:
        this.analyzePropertyAccess(node as PropertyAccessNode, references);
        break;
      case ASTNodeType.METHOD_CALL:
        this.analyzeMethodCall(node as MethodCallNode, references);
        break;
    }

    // Recursively analyze child nodes
    this.analyzeChildNodes(node, themes, references, modes);
  }

  /**
   * Analyze constructor calls for ThemeData, ColorScheme, TextTheme, etc.
   */
  private analyzeConstructorCall(
    node: ConstructorCallNode,
    themes: ThemeData[],
    references: ThemeReference[],
    modes: ThemeMode[]
  ): void {
    switch (node.name) {
      case 'ThemeData':
        const themeData = this.parseThemeData(node);
        if (themeData) {
          themes.push(themeData);
        }
        break;
      case 'ColorScheme':
        // ColorScheme constructors can be standalone or part of ThemeData
        break;
      case 'TextTheme':
        // TextTheme constructors
        break;
      case 'MaterialApp':
        this.analyzeMaterialApp(node, themes, modes);
        break;
    }
  }

  /**
   * Parse ThemeData constructor
   */
  private parseThemeData(node: ConstructorCallNode): ThemeData | null {
    try {
      const theme: Partial<ThemeData> = {};

      // Set default values
      theme.colorScheme = this.getDefaultColorScheme('light');
      theme.textTheme = this.getDefaultTextTheme();
      theme.spacing = this.getDefaultSpacing();
      theme.borderRadius = this.getDefaultBorderRadius();
      theme.brightness = 'light';

      // Parse named arguments
      for (const arg of node.arguments.arguments) {
        if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
          const namedArg = arg as NamedArgumentNode;
          this.parseThemeDataProperty(namedArg, theme);
        }
      }

      return theme as ThemeData;
    } catch (error) {
      this.errors.push(`Error parsing ThemeData: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Parse individual ThemeData properties
   */
  private parseThemeDataProperty(arg: NamedArgumentNode, theme: Partial<ThemeData>): void {
    switch (arg.name) {
      case 'colorScheme':
        if (arg.value.type === ASTNodeType.CONSTRUCTOR_CALL) {
          const colorScheme = this.parseColorScheme(arg.value as ConstructorCallNode);
          if (colorScheme) {
            theme.colorScheme = colorScheme;
          }
        } else if (arg.value.type === ASTNodeType.METHOD_CALL) {
          const colorScheme = this.parseColorSchemeFromMethodCall(arg.value as MethodCallNode);
          if (colorScheme) {
            theme.colorScheme = colorScheme;
          }
        }
        break;
      case 'textTheme':
        if (arg.value.type === ASTNodeType.CONSTRUCTOR_CALL) {
          const textTheme = this.parseTextTheme(arg.value as ConstructorCallNode);
          if (textTheme) {
            theme.textTheme = textTheme;
          }
        }
        break;
      case 'brightness':
        if (arg.value.type === ASTNodeType.PROPERTY_ACCESS) {
          const brightness = this.extractBrightness(arg.value as PropertyAccessNode);
          if (brightness) {
            theme.brightness = brightness;
          }
        }
        break;
      case 'primarySwatch':
        if (arg.value.type === ASTNodeType.PROPERTY_ACCESS) {
          const swatch = this.parseMaterialColor(arg.value as PropertyAccessNode);
          if (swatch) {
            theme.primarySwatch = swatch;
          }
        }
        break;
    }
  }

  /**
   * Parse ColorScheme from method call (e.g., ColorScheme.light(), ColorScheme.dark())
   */
  private parseColorSchemeFromMethodCall(node: MethodCallNode): ColorScheme | null {
    if (!this.isColorSchemeFactoryCall(node)) {
      return null;
    }

    try {
      const colorScheme: Partial<ColorScheme> = {};

      // Determine constructor type and set defaults
      if (node.method.name === 'light' || node.method.name === 'fromSeed') {
        colorScheme.brightness = 'light';
        Object.assign(colorScheme, this.getDefaultColorScheme('light'));
      } else if (node.method.name === 'dark') {
        colorScheme.brightness = 'dark';
        Object.assign(colorScheme, this.getDefaultColorScheme('dark'));
      } else {
        colorScheme.brightness = 'light';
        Object.assign(colorScheme, this.getDefaultColorScheme('light'));
      }

      // Parse named arguments
      for (const arg of node.arguments.arguments) {
        if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
          const namedArg = arg as NamedArgumentNode;
          this.parseColorSchemeProperty(namedArg, colorScheme);
        }
      }

      return colorScheme as ColorScheme;
    } catch (error) {
      this.errors.push(`Error parsing ColorScheme method call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Parse ColorScheme constructor
   */
  private parseColorScheme(node: ConstructorCallNode): ColorScheme | null {
    try {
      const colorScheme: Partial<ColorScheme> = {};

      // Determine constructor type and set defaults
      if (node.name === 'ColorScheme.light' || node.name === 'ColorScheme.fromSeed') {
        colorScheme.brightness = 'light';
        Object.assign(colorScheme, this.getDefaultColorScheme('light'));
      } else if (node.name === 'ColorScheme.dark') {
        colorScheme.brightness = 'dark';
        Object.assign(colorScheme, this.getDefaultColorScheme('dark'));
      } else {
        colorScheme.brightness = 'light';
        Object.assign(colorScheme, this.getDefaultColorScheme('light'));
      }

      // Parse named arguments
      for (const arg of node.arguments.arguments) {
        if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
          const namedArg = arg as NamedArgumentNode;
          this.parseColorSchemeProperty(namedArg, colorScheme);
        }
      }

      return colorScheme as ColorScheme;
    } catch (error) {
      this.errors.push(`Error parsing ColorScheme: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Parse ColorScheme properties
   */
  private parseColorSchemeProperty(arg: NamedArgumentNode, colorScheme: Partial<ColorScheme>): void {
    switch (arg.name) {
      case 'brightness':
        if (arg.value.type === ASTNodeType.PROPERTY_ACCESS) {
          const brightness = this.extractBrightness(arg.value as PropertyAccessNode);
          if (brightness) {
            colorScheme.brightness = brightness;
          }
        }
        break;
      default:
        const colorValue = this.extractColorValue(arg.value);
        if (colorValue) {
          switch (arg.name) {
            case 'primary':
              colorScheme.primary = colorValue;
              break;
            case 'onPrimary':
              colorScheme.onPrimary = colorValue;
              break;
            case 'secondary':
              colorScheme.secondary = colorValue;
              break;
            case 'onSecondary':
              colorScheme.onSecondary = colorValue;
              break;
            case 'error':
              colorScheme.error = colorValue;
              break;
            case 'onError':
              colorScheme.onError = colorValue;
              break;
            case 'background':
              colorScheme.background = colorValue;
              break;
            case 'onBackground':
              colorScheme.onBackground = colorValue;
              break;
            case 'surface':
              colorScheme.surface = colorValue;
              break;
            case 'onSurface':
              colorScheme.onSurface = colorValue;
              break;
            case 'surfaceVariant':
              colorScheme.surfaceVariant = colorValue;
              break;
            case 'onSurfaceVariant':
              colorScheme.onSurfaceVariant = colorValue;
              break;
            case 'outline':
              colorScheme.outline = colorValue;
              break;
            case 'shadow':
              colorScheme.shadow = colorValue;
              break;
          }
        }
        break;
    }
  }

  /**
   * Parse TextTheme constructor
   */
  private parseTextTheme(node: ConstructorCallNode): TextTheme | null {
    try {
      const textTheme: Partial<TextTheme> = {};

      // Set defaults
      Object.assign(textTheme, this.getDefaultTextTheme());

      // Parse named arguments
      for (const arg of node.arguments.arguments) {
        if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
          const namedArg = arg as NamedArgumentNode;
          this.parseTextThemeProperty(namedArg, textTheme);
        }
      }

      return textTheme as TextTheme;
    } catch (error) {
      this.errors.push(`Error parsing TextTheme: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Parse TextTheme properties
   */
  private parseTextThemeProperty(arg: NamedArgumentNode, textTheme: Partial<TextTheme>): void {
    if (arg.value.type === ASTNodeType.CONSTRUCTOR_CALL) {
      const textStyle = this.parseTextStyle(arg.value as ConstructorCallNode);
      if (textStyle) {
        switch (arg.name) {
          case 'displayLarge':
            textTheme.displayLarge = textStyle;
            break;
          case 'displayMedium':
            textTheme.displayMedium = textStyle;
            break;
          case 'displaySmall':
            textTheme.displaySmall = textStyle;
            break;
          case 'headlineLarge':
            textTheme.headlineLarge = textStyle;
            break;
          case 'headlineMedium':
            textTheme.headlineMedium = textStyle;
            break;
          case 'headlineSmall':
            textTheme.headlineSmall = textStyle;
            break;
          case 'titleLarge':
            textTheme.titleLarge = textStyle;
            break;
          case 'titleMedium':
            textTheme.titleMedium = textStyle;
            break;
          case 'titleSmall':
            textTheme.titleSmall = textStyle;
            break;
          case 'bodyLarge':
            textTheme.bodyLarge = textStyle;
            break;
          case 'bodyMedium':
            textTheme.bodyMedium = textStyle;
            break;
          case 'bodySmall':
            textTheme.bodySmall = textStyle;
            break;
          case 'labelLarge':
            textTheme.labelLarge = textStyle;
            break;
          case 'labelMedium':
            textTheme.labelMedium = textStyle;
            break;
          case 'labelSmall':
            textTheme.labelSmall = textStyle;
            break;
        }
      }
    }
  }

  /**
   * Parse TextStyle constructor
   */
  private parseTextStyle(node: ConstructorCallNode): TextStyle | null {
    try {
      const textStyle: Partial<TextStyle> = {};

      // Parse named arguments
      for (const arg of node.arguments.arguments) {
        if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
          const namedArg = arg as NamedArgumentNode;
          this.parseTextStyleProperty(namedArg, textStyle);
        }
      }

      return textStyle as TextStyle;
    } catch (error) {
      this.errors.push(`Error parsing TextStyle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Parse TextStyle properties
   */
  private parseTextStyleProperty(arg: NamedArgumentNode, textStyle: Partial<TextStyle>): void {
    switch (arg.name) {
      case 'fontSize':
        if (arg.value.type === ASTNodeType.LITERAL) {
          const literal = arg.value as LiteralNode;
          if (typeof literal.value === 'number') {
            textStyle.fontSize = literal.value;
          }
        }
        break;
      case 'fontWeight':
        if (arg.value.type === ASTNodeType.PROPERTY_ACCESS) {
          const fontWeight = this.extractFontWeight(arg.value as PropertyAccessNode);
          if (fontWeight) {
            textStyle.fontWeight = fontWeight;
          }
        }
        break;
      case 'fontFamily':
        if (arg.value.type === ASTNodeType.LITERAL) {
          const literal = arg.value as LiteralNode;
          if (typeof literal.value === 'string') {
            textStyle.fontFamily = literal.value;
          }
        }
        break;
      case 'letterSpacing':
        if (arg.value.type === ASTNodeType.LITERAL) {
          const literal = arg.value as LiteralNode;
          if (typeof literal.value === 'number') {
            textStyle.letterSpacing = literal.value;
          }
        }
        break;
      case 'wordSpacing':
        if (arg.value.type === ASTNodeType.LITERAL) {
          const literal = arg.value as LiteralNode;
          if (typeof literal.value === 'number') {
            textStyle.wordSpacing = literal.value;
          }
        }
        break;
      case 'height':
        if (arg.value.type === ASTNodeType.LITERAL) {
          const literal = arg.value as LiteralNode;
          if (typeof literal.value === 'number') {
            textStyle.height = literal.value;
          }
        }
        break;
      case 'color':
        const colorValue = this.extractColorValue(arg.value);
        if (colorValue) {
          textStyle.color = colorValue;
        }
        break;
    }
  }

  /**
   * Analyze MaterialApp for theme modes
   */
  private analyzeMaterialApp(
    node: ConstructorCallNode,
    themes: ThemeData[],
    modes: ThemeMode[]
  ): void {
    let lightTheme: ThemeData | undefined;
    let darkTheme: ThemeData | undefined;
    let themeMode: 'light' | 'dark' | 'system' = 'system';

    for (const arg of node.arguments.arguments) {
      if (arg.type === ASTNodeType.NAMED_ARGUMENT) {
        const namedArg = arg as NamedArgumentNode;

        switch (namedArg.name) {
          case 'theme':
            if (namedArg.value.type === ASTNodeType.CONSTRUCTOR_CALL) {
              const parsed = this.parseThemeData(namedArg.value as ConstructorCallNode);
              if (parsed) {
                lightTheme = parsed;
              }
            }
            break;
          case 'darkTheme':
            if (namedArg.value.type === ASTNodeType.CONSTRUCTOR_CALL) {
              const parsed = this.parseThemeData(namedArg.value as ConstructorCallNode);
              if (parsed) {
                darkTheme = parsed;
              }
            }
            break;
          case 'themeMode':
            if (namedArg.value.type === ASTNodeType.PROPERTY_ACCESS) {
              const mode = this.extractThemeMode(namedArg.value as PropertyAccessNode);
              if (mode) {
                themeMode = mode;
              }
            }
            break;
        }
      }
    }

    // Create theme mode configuration
    if (lightTheme) {
      const mode: ThemeMode = {
        mode: themeMode,
        lightTheme,
        darkTheme
      };
      modes.push(mode);
    }
  }

  /**
   * Analyze property access for theme references
   */
  private analyzePropertyAccess(node: PropertyAccessNode, references: ThemeReference[]): void {
    const path = this.buildPropertyPath(node);
    if (path && this.isThemeReference(path)) {
      references.push({
        path,
        fallbackValue: undefined
      });
    }
  }

  /**
   * Analyze method calls for Theme.of(context) patterns and ColorScheme factory methods
   */
  private analyzeMethodCall(node: MethodCallNode, references: ThemeReference[]): void {
    if (this.isThemeOfCall(node)) {
      // This is a Theme.of(context) call, we'll handle the property access separately
      return;
    }

    // Handle ColorScheme factory methods like ColorScheme.light(), ColorScheme.dark()
    if (this.isColorSchemeFactoryCall(node)) {
      // These will be handled when parsing ThemeData properties
      return;
    }
  }

  /**
   * Extract color value from AST node
   */
  private extractColorValue(node: ASTNode): string | null {
    if (node.type === ASTNodeType.PROPERTY_ACCESS) {
      const propertyAccess = node as PropertyAccessNode;
      return this.extractColorFromPropertyAccess(propertyAccess);
    } else if (node.type === ASTNodeType.CONSTRUCTOR_CALL) {
      const constructor = node as ConstructorCallNode;
      return this.extractColorFromConstructor(constructor);
    } else if (node.type === ASTNodeType.LITERAL) {
      const literal = node as LiteralNode;
      if (typeof literal.value === 'number') {
        return `#${literal.value.toString(16).padStart(8, '0')}`;
      }
    }
    return null;
  }

  /**
   * Extract color from property access (e.g., Colors.blue, Colors.red.shade500)
   */
  private extractColorFromPropertyAccess(node: PropertyAccessNode): string | null {
    const path = this.buildPropertyPath(node);
    if (path) {
      return this.resolveColorConstant(path);
    }
    return null;
  }

  /**
   * Extract color from constructor (e.g., Color(0xFF123456))
   */
  private extractColorFromConstructor(node: ConstructorCallNode): string | null {
    if (node.name === 'Color') {
      const args = node.arguments.arguments;
      if (args.length > 0 && args[0].type === ASTNodeType.POSITIONAL_ARGUMENT) {
        const posArg = args[0] as any;
        if (posArg.value.type === ASTNodeType.LITERAL) {
          const literal = posArg.value as LiteralNode;
          if (typeof literal.value === 'string') {
            // Handle hex string literals like "0xFF123456"
            const hexMatch = literal.value.match(/0x([0-9a-fA-F]+)/i);
            if (hexMatch) {
              const hexValue = parseInt(hexMatch[1], 16);
              return `#${hexValue.toString(16).padStart(8, '0').toLowerCase()}`;
            }
          } else if (typeof literal.value === 'number') {
            // Convert number to hex, handling both signed and unsigned values
            let hexValue = literal.value;
            if (hexValue < 0) {
              hexValue = hexValue >>> 0; // Convert to unsigned 32-bit
            }
            return `#${hexValue.toString(16).padStart(8, '0').toLowerCase()}`;
          }
        }
      }
    }
    return null;
  }

  /**
   * Extract brightness from property access
   */
  private extractBrightness(node: PropertyAccessNode): 'light' | 'dark' | null {
    const path = this.buildPropertyPath(node);
    if (path === 'Brightness.light') {
      return 'light';
    } else if (path === 'Brightness.dark') {
      return 'dark';
    }
    return null;
  }

  /**
   * Extract font weight from property access
   */
  private extractFontWeight(node: PropertyAccessNode): FontWeight | null {
    const path = this.buildPropertyPath(node);
    if (path && path.startsWith('FontWeight.')) {
      const weight = path.split('.')[1];
      switch (weight) {
        case 'w100': return FontWeight.w100;
        case 'w200': return FontWeight.w200;
        case 'w300': return FontWeight.w300;
        case 'w400':
        case 'normal': return FontWeight.w400;
        case 'w500': return FontWeight.w500;
        case 'w600': return FontWeight.w600;
        case 'w700':
        case 'bold': return FontWeight.w700;
        case 'w800': return FontWeight.w800;
        case 'w900': return FontWeight.w900;
        default: return null;
      }
    }
    return null;
  }

  /**
   * Extract theme mode from property access
   */
  private extractThemeMode(node: PropertyAccessNode): 'light' | 'dark' | 'system' | null {
    const path = this.buildPropertyPath(node);
    if (path === 'ThemeMode.light') {
      return 'light';
    } else if (path === 'ThemeMode.dark') {
      return 'dark';
    } else if (path === 'ThemeMode.system') {
      return 'system';
    }
    return null;
  }

  /**
   * Parse MaterialColor from property access
   */
  private parseMaterialColor(node: PropertyAccessNode): MaterialColor | null {
    const path = this.buildPropertyPath(node);
    if (path && path.startsWith('Colors.')) {
      return this.getMaterialColorSwatch(path);
    }
    return null;
  }

  /**
   * Build property access path (e.g., "Theme.of(context).primaryColor")
   */
  private buildPropertyPath(node: PropertyAccessNode): string | null {
    const parts: string[] = [];
    let current: ASTNode = node;

    while (current) {
      if (current.type === ASTNodeType.PROPERTY_ACCESS) {
        const propAccess = current as PropertyAccessNode;
        parts.unshift(propAccess.property.name);
        current = propAccess.object;
      } else if (current.type === ASTNodeType.IDENTIFIER) {
        const identifier = current as IdentifierNode;
        parts.unshift(identifier.name);
        break;
      } else if (current.type === ASTNodeType.METHOD_CALL) {
        const methodCall = current as MethodCallNode;
        parts.unshift(`${methodCall.method.name}(context)`);
        current = methodCall.object;
      } else {
        break;
      }
    }

    return parts.length > 0 ? parts.join('.') : null;
  }

  /**
   * Check if a property path is a theme reference
   */
  private isThemeReference(path: string): boolean {
    return path.startsWith('Theme.of(context)') ||
      path.includes('theme.') ||
      path.includes('colorScheme.') ||
      path.includes('textTheme.');
  }

  /**
   * Check if a method call is Theme.of(context)
   */
  private isThemeOfCall(node: MethodCallNode): boolean {
    return node.method.name === 'of' &&
      node.object.type === ASTNodeType.IDENTIFIER &&
      (node.object as IdentifierNode).name === 'Theme';
  }

  /**
   * Check if a method call is a ColorScheme factory method
   */
  private isColorSchemeFactoryCall(node: MethodCallNode): boolean {
    return node.object.type === ASTNodeType.IDENTIFIER &&
      (node.object as IdentifierNode).name === 'ColorScheme' &&
      (node.method.name === 'light' || node.method.name === 'dark' || node.method.name === 'fromSeed');
  }

  /**
   * Recursively analyze child nodes
   */
  private analyzeChildNodes(
    node: ASTNode,
    themes: ThemeData[],
    references: ThemeReference[],
    modes: ThemeMode[]
  ): void {
    // Handle different node types and their children
    switch (node.type) {
      case ASTNodeType.CONSTRUCTOR_CALL:
        const constructorCall = node as ConstructorCallNode;
        this.analyzeNode(constructorCall.arguments, themes, references, modes);
        break;
      case ASTNodeType.ARGUMENT_LIST:
        const argList = node as any;
        for (const arg of argList.arguments) {
          this.analyzeNode(arg, themes, references, modes);
        }
        break;
      case ASTNodeType.NAMED_ARGUMENT:
        const namedArg = node as NamedArgumentNode;
        this.analyzeNode(namedArg.value, themes, references, modes);
        break;
      case ASTNodeType.POSITIONAL_ARGUMENT:
        const posArg = node as any;
        this.analyzeNode(posArg.value, themes, references, modes);
        break;
      case ASTNodeType.ARRAY_LITERAL:
        const arrayLiteral = node as any;
        for (const element of arrayLiteral.elements) {
          this.analyzeNode(element, themes, references, modes);
        }
        break;
      case ASTNodeType.PROPERTY_ACCESS:
        const propAccess = node as PropertyAccessNode;
        this.analyzeNode(propAccess.object, themes, references, modes);
        break;
      case ASTNodeType.METHOD_CALL:
        const methodCall = node as MethodCallNode;
        this.analyzeNode(methodCall.object, themes, references, modes);
        this.analyzeNode(methodCall.arguments, themes, references, modes);
        break;
    }
  }

  /**
   * Get default color scheme
   */
  private getDefaultColorScheme(brightness: 'light' | 'dark'): ColorScheme {
    if (brightness === 'dark') {
      return {
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
        onSurfaceVariant: '#FFFFFF',
        outline: '#8C8C8C',
        shadow: '#000000'
      };
    } else {
      return {
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
        surfaceVariant: '#F5F5F5',
        onSurfaceVariant: '#000000',
        outline: '#737373',
        shadow: '#000000'
      };
    }
  }

  /**
   * Get default text theme
   */
  private getDefaultTextTheme(): TextTheme {
    return {
      displayLarge: { fontSize: 57, fontWeight: FontWeight.w400 },
      displayMedium: { fontSize: 45, fontWeight: FontWeight.w400 },
      displaySmall: { fontSize: 36, fontWeight: FontWeight.w400 },
      headlineLarge: { fontSize: 32, fontWeight: FontWeight.w400 },
      headlineMedium: { fontSize: 28, fontWeight: FontWeight.w400 },
      headlineSmall: { fontSize: 24, fontWeight: FontWeight.w400 },
      titleLarge: { fontSize: 22, fontWeight: FontWeight.w400 },
      titleMedium: { fontSize: 16, fontWeight: FontWeight.w500 },
      titleSmall: { fontSize: 14, fontWeight: FontWeight.w500 },
      bodyLarge: { fontSize: 16, fontWeight: FontWeight.w400 },
      bodyMedium: { fontSize: 14, fontWeight: FontWeight.w400 },
      bodySmall: { fontSize: 12, fontWeight: FontWeight.w400 },
      labelLarge: { fontSize: 14, fontWeight: FontWeight.w500 },
      labelMedium: { fontSize: 12, fontWeight: FontWeight.w500 },
      labelSmall: { fontSize: 11, fontWeight: FontWeight.w500 }
    };
  }

  /**
   * Get default spacing scale
   */
  private getDefaultSpacing(): SpacingScale {
    return {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48
    };
  }

  /**
   * Get default border radius scale
   */
  private getDefaultBorderRadius(): BorderRadiusScale {
    return {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999
    };
  }

  /**
   * Resolve color constant from path
   */
  private resolveColorConstant(path: string): string | null {
    // Basic color constants mapping
    const colorMap: Record<string, string> = {
      'Colors.red': '#F44336',
      'Colors.pink': '#E91E63',
      'Colors.purple': '#9C27B0',
      'Colors.deepPurple': '#673AB7',
      'Colors.indigo': '#3F51B5',
      'Colors.blue': '#2196F3',
      'Colors.lightBlue': '#03A9F4',
      'Colors.cyan': '#00BCD4',
      'Colors.teal': '#009688',
      'Colors.green': '#4CAF50',
      'Colors.lightGreen': '#8BC34A',
      'Colors.lime': '#CDDC39',
      'Colors.yellow': '#FFEB3B',
      'Colors.amber': '#FFC107',
      'Colors.orange': '#FF9800',
      'Colors.deepOrange': '#FF5722',
      'Colors.brown': '#795548',
      'Colors.grey': '#9E9E9E',
      'Colors.blueGrey': '#607D8B',
      'Colors.black': '#000000',
      'Colors.black87': '#DD000000',
      'Colors.black54': '#8A000000',
      'Colors.black45': '#73000000',
      'Colors.black38': '#61000000',
      'Colors.black26': '#42000000',
      'Colors.black12': '#1F000000',
      'Colors.white': '#FFFFFF',
      'Colors.white70': '#B3FFFFFF',
      'Colors.white60': '#99FFFFFF',
      'Colors.white54': '#8AFFFFFF',
      'Colors.white38': '#62FFFFFF',
      'Colors.white30': '#4DFFFFFF',
      'Colors.white24': '#3DFFFFFF',
      'Colors.white12': '#1FFFFFFF',
      'Colors.white10': '#1AFFFFFF',
      'Colors.transparent': '#00000000'
    };

    return colorMap[path] || null;
  }

  /**
   * Get material color swatch
   */
  private getMaterialColorSwatch(path: string): MaterialColor | null {
    // This would contain the full material color swatches
    // For now, return null as this is a complex mapping
    this.warnings.push(`Material color swatch parsing not fully implemented: ${path}`);
    return null;
  }

  /**
   * Resolve theme references to actual values
   */
  resolveThemeReferences(
    references: ThemeReference[],
    themes: ThemeData[],
    modes: ThemeMode[]
  ): ThemeReferenceResolution[] {
    const resolutions: ThemeReferenceResolution[] = [];

    for (const reference of references) {
      const resolution = this.resolveThemeReference(reference, themes, modes);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Resolve a single theme reference
   */
  private resolveThemeReference(
    reference: ThemeReference,
    themes: ThemeData[],
    modes: ThemeMode[]
  ): ThemeReferenceResolution {
    // Try to find the theme to use for resolution
    let themeToUse: ThemeData | null = null;

    // If we have theme modes, use the light theme by default
    if (modes.length > 0) {
      themeToUse = modes[0].lightTheme;
    } else if (themes.length > 0) {
      // Use the first available theme
      themeToUse = themes[0];
    }

    if (!themeToUse) {
      return {
        reference,
        resolvedValue: reference.fallbackValue || null,
        themeSource: null
      };
    }

    const resolvedValue = this.resolveThemePath(reference.path, themeToUse);

    return {
      reference,
      resolvedValue: resolvedValue || reference.fallbackValue || null,
      themeSource: themeToUse
    };
  }

  /**
   * Resolve a theme property path to its actual value
   */
  private resolveThemePath(path: string, theme: ThemeData): string | null {
    // Remove "Theme.of(context)." prefix if present
    const cleanPath = path.replace(/^Theme\.of\(context\)\./, '');

    // Split the path into parts
    const parts = cleanPath.split('.');

    if (parts.length === 0) {
      return null;
    }

    try {
      // Navigate through the theme object
      let current: any = theme;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          // Path not found, try to resolve common theme shortcuts
          return this.resolveThemeShortcut(cleanPath, theme);
        }
      }

      // Convert the final value to string if it's not already
      if (typeof current === 'string') {
        return current;
      } else if (typeof current === 'number') {
        return current.toString();
      } else if (current && typeof current === 'object') {
        // If it's an object, it might be a complex style - return null for now
        return null;
      }

      return current ? current.toString() : null;
    } catch (error) {
      this.warnings.push(`Error resolving theme path "${path}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Resolve common theme shortcuts and legacy property names
   */
  private resolveThemeShortcut(path: string, theme: ThemeData): string | null {
    // Handle common theme property shortcuts
    switch (path) {
      case 'primaryColor':
        return theme.colorScheme.primary;
      case 'accentColor':
      case 'secondaryColor':
        return theme.colorScheme.secondary;
      case 'backgroundColor':
        return theme.colorScheme.background;
      case 'scaffoldBackgroundColor':
        return theme.colorScheme.background;
      case 'cardColor':
        return theme.colorScheme.surface;
      case 'dividerColor':
        return theme.colorScheme.outline || theme.colorScheme.onSurface + '1F';
      case 'errorColor':
        return theme.colorScheme.error;
      case 'disabledColor':
        return theme.colorScheme.onSurface + '61'; // 38% opacity
      case 'highlightColor':
        return theme.colorScheme.primary + '1F'; // 12% opacity
      case 'splashColor':
        return theme.colorScheme.primary + '1F'; // 12% opacity
      case 'selectedRowColor':
        return theme.colorScheme.primary + '1F'; // 12% opacity
      case 'unselectedWidgetColor':
        return theme.colorScheme.onSurface + '61'; // 38% opacity
      case 'focusColor':
        return theme.colorScheme.primary + '1F'; // 12% opacity
      case 'hoverColor':
        return theme.colorScheme.primary + '0A'; // 4% opacity
      default:
        // Try to resolve nested paths
        if (path.includes('.')) {
          return this.resolveNestedThemePath(path, theme);
        }
        return null;
    }
  }

  /**
   * Resolve nested theme paths like "textTheme.bodyLarge.color"
   */
  private resolveNestedThemePath(path: string, theme: ThemeData): string | null {
    const parts = path.split('.');

    if (parts[0] === 'textTheme' && parts.length >= 2) {
      const styleName = parts[1] as keyof TextTheme;
      const textStyle = theme.textTheme[styleName];

      if (textStyle && parts.length >= 3) {
        const property = parts[2] as keyof TextStyle;
        const value = textStyle[property];

        if (typeof value === 'string' || typeof value === 'number') {
          return value.toString();
        }
      }
    } else if (parts[0] === 'colorScheme' && parts.length >= 2) {
      const colorName = parts[1] as keyof ColorScheme;
      const colorValue = theme.colorScheme[colorName];

      if (typeof colorValue === 'string') {
        return colorValue;
      }
    }

    return null;
  }

  /**
   * Create theme reference resolver for widget analysis
   */
  createThemeResolver(themes: ThemeData[], modes: ThemeMode[]) {
    return {
      resolve: (path: string): string | null => {
        const reference: ThemeReference = { path };
        const resolution = this.resolveThemeReference(reference, themes, modes);
        return resolution.resolvedValue;
      },

      resolveColor: (path: string): string | null => {
        const value = this.createThemeResolver(themes, modes).resolve(path);
        // Validate that it's a color value (starts with # or is a known color name)
        if (value && (value.startsWith('#') || this.isKnownColorName(value))) {
          return value;
        }
        return null;
      },

      resolveTextStyle: (path: string): Partial<TextStyle> | null => {
        // Find the theme to use
        let themeToUse: ThemeData | null = null;
        if (modes.length > 0) {
          themeToUse = modes[0].lightTheme;
        } else if (themes.length > 0) {
          themeToUse = themes[0];
        }

        if (!themeToUse) {
          return null;
        }

        // Extract text style from path like "textTheme.bodyLarge"
        const cleanPath = path.replace(/^Theme\.of\(context\)\./, '');
        const parts = cleanPath.split('.');

        if (parts[0] === 'textTheme' && parts.length >= 2) {
          const styleName = parts[1] as keyof TextTheme;
          return themeToUse.textTheme[styleName] || null;
        }

        return null;
      }
    };
  }

  /**
   * Check if a value is a known color name
   */
  private isKnownColorName(value: string): boolean {
    const knownColors = [
      'transparent', 'black', 'white', 'red', 'green', 'blue',
      'yellow', 'cyan', 'magenta', 'orange', 'purple', 'pink',
      'brown', 'grey', 'gray'
    ];
    return knownColors.includes(value.toLowerCase());
  }

  /**
   * Detect theme modes and conditional theme applications
   */
  detectThemeModes(nodes: ASTNode[]): ThemeModeDetection {
    const detection: ThemeModeDetection = {
      hasLightTheme: false,
      hasDarkTheme: false,
      hasSystemMode: false,
      defaultMode: 'light',
      conditionalThemes: []
    };

    // Extract themes and modes first
    const extractionResult = this.extractThemes(nodes);

    // Check for explicit theme modes in MaterialApp
    for (const mode of extractionResult.modes) {
      detection.hasLightTheme = !!mode.lightTheme;
      detection.hasDarkTheme = !!mode.darkTheme;
      detection.hasSystemMode = mode.mode === 'system';
      detection.defaultMode = mode.mode;
    }

    // Check for conditional theme applications
    this.detectConditionalThemes(nodes, detection);

    // If no explicit modes found, check individual themes
    if (!detection.hasLightTheme && !detection.hasDarkTheme) {
      for (const theme of extractionResult.themes) {
        if (theme.brightness === 'light') {
          detection.hasLightTheme = true;
        } else if (theme.brightness === 'dark') {
          detection.hasDarkTheme = true;
        }
      }
    }

    return detection;
  }

  /**
   * Detect conditional theme applications in code
   */
  private detectConditionalThemes(nodes: ASTNode[], detection: ThemeModeDetection): void {
    for (const node of nodes) {
      this.analyzeNodeForConditionalThemes(node, detection);
    }
  }

  /**
   * Analyze a node for conditional theme patterns
   */
  private analyzeNodeForConditionalThemes(node: ASTNode, detection: ThemeModeDetection): void {
    // Look for patterns like:
    // - MediaQuery.of(context).platformBrightness == Brightness.dark
    // - Theme.of(context).brightness == Brightness.dark
    // - Conditional expressions with different themes

    // This is a simplified implementation - in a real scenario, we'd need
    // more sophisticated AST analysis to detect conditional expressions

    // Recursively analyze child nodes
    this.analyzeChildNodesForConditionalThemes(node, detection);
  }

  /**
   * Recursively analyze child nodes for conditional themes
   */
  private analyzeChildNodesForConditionalThemes(node: ASTNode, detection: ThemeModeDetection): void {
    switch (node.type) {
      case ASTNodeType.CONSTRUCTOR_CALL:
        const constructorCall = node as ConstructorCallNode;
        this.analyzeNodeForConditionalThemes(constructorCall.arguments, detection);
        break;
      case ASTNodeType.ARGUMENT_LIST:
        const argList = node as any;
        for (const arg of argList.arguments) {
          this.analyzeNodeForConditionalThemes(arg, detection);
        }
        break;
      case ASTNodeType.NAMED_ARGUMENT:
        const namedArg = node as NamedArgumentNode;
        this.analyzeNodeForConditionalThemes(namedArg.value, detection);
        break;
      case ASTNodeType.POSITIONAL_ARGUMENT:
        const posArg = node as any;
        this.analyzeNodeForConditionalThemes(posArg.value, detection);
        break;
      case ASTNodeType.ARRAY_LITERAL:
        const arrayLiteral = node as any;
        for (const element of arrayLiteral.elements) {
          this.analyzeNodeForConditionalThemes(element, detection);
        }
        break;
      case ASTNodeType.PROPERTY_ACCESS:
        const propAccess = node as PropertyAccessNode;
        this.analyzeNodeForConditionalThemes(propAccess.object, detection);
        break;
      case ASTNodeType.METHOD_CALL:
        const methodCall = node as MethodCallNode;
        this.analyzeNodeForConditionalThemes(methodCall.object, detection);
        this.analyzeNodeForConditionalThemes(methodCall.arguments, detection);
        break;
    }
  }

  /**
   * Resolve theme references for multiple modes
   */
  resolveMultiModeThemeReferences(
    references: ThemeReference[],
    themes: ThemeData[],
    modes: ThemeMode[]
  ): MultiModeThemeResolution[] {
    const resolutions: MultiModeThemeResolution[] = [];

    for (const reference of references) {
      const resolution = this.resolveMultiModeThemeReference(reference, themes, modes);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Resolve a single theme reference for multiple modes
   */
  private resolveMultiModeThemeReference(
    reference: ThemeReference,
    themes: ThemeData[],
    modes: ThemeMode[]
  ): MultiModeThemeResolution {
    let lightValue: string | null = null;
    let darkValue: string | null = null;
    let systemValue: string | null = null;
    let preferredMode: 'light' | 'dark' | 'system' = 'light';

    if (modes.length > 0) {
      const mode = modes[0];
      preferredMode = mode.mode;

      // Resolve for light theme
      if (mode.lightTheme) {
        lightValue = this.resolveThemePath(reference.path, mode.lightTheme);
      }

      // Resolve for dark theme
      if (mode.darkTheme) {
        darkValue = this.resolveThemePath(reference.path, mode.darkTheme);
      }

      // System value depends on the preferred mode
      systemValue = preferredMode === 'dark' ? darkValue : lightValue;
    } else if (themes.length > 0) {
      // No explicit modes, use individual themes
      for (const theme of themes) {
        const value = this.resolveThemePath(reference.path, theme);
        if (theme.brightness === 'light') {
          lightValue = value;
        } else if (theme.brightness === 'dark') {
          darkValue = value;
        }
      }
      systemValue = lightValue; // Default to light
    }

    return {
      reference,
      lightValue: lightValue || reference.fallbackValue || null,
      darkValue: darkValue || reference.fallbackValue || null,
      systemValue: systemValue || reference.fallbackValue || null,
      preferredMode
    };
  }

  /**
   * Create multi-mode theme resolver
   */
  createMultiModeThemeResolver(themes: ThemeData[], modes: ThemeMode[]) {
    return {
      resolve: (path: string, mode?: 'light' | 'dark' | 'system'): string | null => {
        const reference: ThemeReference = { path };
        const resolution = this.resolveMultiModeThemeReference(reference, themes, modes);

        switch (mode || resolution.preferredMode) {
          case 'light':
            return resolution.lightValue;
          case 'dark':
            return resolution.darkValue;
          case 'system':
            return resolution.systemValue;
          default:
            return resolution.lightValue;
        }
      },

      resolveAll: (path: string): MultiModeThemeResolution => {
        const reference: ThemeReference = { path };
        return this.resolveMultiModeThemeReference(reference, themes, modes);
      },

      hasMode: (mode: 'light' | 'dark'): boolean => {
        if (modes.length > 0) {
          const themeMode = modes[0];
          return mode === 'light' ? !!themeMode.lightTheme : !!themeMode.darkTheme;
        }

        return themes.some(theme => theme.brightness === mode);
      },

      getAvailableModes: (): ('light' | 'dark')[] => {
        const availableModes: ('light' | 'dark')[] = [];

        if (modes.length > 0) {
          const themeMode = modes[0];
          if (themeMode.lightTheme) availableModes.push('light');
          if (themeMode.darkTheme) availableModes.push('dark');
        } else {
          const lightTheme = themes.find(t => t.brightness === 'light');
          const darkTheme = themes.find(t => t.brightness === 'dark');

          if (lightTheme) availableModes.push('light');
          if (darkTheme) availableModes.push('dark');
        }

        return availableModes;
      },

      getPreferredMode: (): 'light' | 'dark' | 'system' => {
        if (modes.length > 0) {
          return modes[0].mode;
        }
        return 'light';
      }
    };
  }

  /**
   * Generate theme mode mappings for Figma Variables
   */
  generateThemeModeMappings(themes: ThemeData[], modes: ThemeMode[]): {
    colorMappings: Record<string, { light: string; dark?: string }>;
    typographyMappings: Record<string, { light: any; dark?: any }>;
    spacingMappings: Record<string, { light: number; dark?: number }>;
  } {
    const colorMappings: Record<string, { light: string; dark?: string }> = {};
    const typographyMappings: Record<string, { light: any; dark?: any }> = {};
    const spacingMappings: Record<string, { light: number; dark?: number }> = {};

    if (modes.length > 0) {
      const mode = modes[0];

      // Map color scheme properties
      if (mode.lightTheme) {
        this.mapColorSchemeToMappings(mode.lightTheme.colorScheme, colorMappings, 'light');
        this.mapTextThemeToMappings(mode.lightTheme.textTheme, typographyMappings, 'light');
        this.mapSpacingToMappings(mode.lightTheme.spacing, spacingMappings, 'light');
      }

      if (mode.darkTheme) {
        this.mapColorSchemeToMappings(mode.darkTheme.colorScheme, colorMappings, 'dark');
        this.mapTextThemeToMappings(mode.darkTheme.textTheme, typographyMappings, 'dark');
        this.mapSpacingToMappings(mode.darkTheme.spacing, spacingMappings, 'dark');
      }
    } else {
      // Handle individual themes
      for (const theme of themes) {
        const modeKey = theme.brightness || 'light';
        this.mapColorSchemeToMappings(theme.colorScheme, colorMappings, modeKey);
        this.mapTextThemeToMappings(theme.textTheme, typographyMappings, modeKey);
        this.mapSpacingToMappings(theme.spacing, spacingMappings, modeKey);
      }
    }

    return {
      colorMappings,
      typographyMappings,
      spacingMappings
    };
  }

  /**
   * Map ColorScheme to color mappings
   */
  private mapColorSchemeToMappings(
    colorScheme: ColorScheme,
    mappings: Record<string, { light: string; dark?: string }>,
    mode: 'light' | 'dark'
  ): void {
    const colorProperties = [
      'primary', 'onPrimary', 'secondary', 'onSecondary',
      'error', 'onError', 'background', 'onBackground',
      'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
      'outline', 'shadow'
    ] as const;

    for (const prop of colorProperties) {
      const value = colorScheme[prop];
      if (value) {
        if (!mappings[prop]) {
          mappings[prop] = { light: '', dark: undefined };
        }
        if (mode === 'light') {
          mappings[prop].light = value;
        } else {
          mappings[prop].dark = value;
        }
      }
    }
  }

  /**
   * Map TextTheme to typography mappings
   */
  private mapTextThemeToMappings(
    textTheme: TextTheme,
    mappings: Record<string, { light: any; dark?: any }>,
    mode: 'light' | 'dark'
  ): void {
    const textProperties = [
      'displayLarge', 'displayMedium', 'displaySmall',
      'headlineLarge', 'headlineMedium', 'headlineSmall',
      'titleLarge', 'titleMedium', 'titleSmall',
      'bodyLarge', 'bodyMedium', 'bodySmall',
      'labelLarge', 'labelMedium', 'labelSmall'
    ] as const;

    for (const prop of textProperties) {
      const style = textTheme[prop];
      if (style) {
        if (!mappings[prop]) {
          mappings[prop] = { light: null, dark: undefined };
        }
        if (mode === 'light') {
          mappings[prop].light = style;
        } else {
          mappings[prop].dark = style;
        }
      }
    }
  }

  /**
   * Map spacing to spacing mappings
   */
  private mapSpacingToMappings(
    spacing: SpacingScale,
    mappings: Record<string, { light: number; dark?: number }>,
    mode: 'light' | 'dark'
  ): void {
    for (const [key, value] of Object.entries(spacing)) {
      if (!mappings[key]) {
        mappings[key] = { light: 0, dark: undefined };
      }
      if (mode === 'light') {
        mappings[key].light = value;
      } else {
        mappings[key].dark = value;
      }
    }
  }
}
import { ThemeData, ColorScheme, TextTheme, TextStyle, SpacingScale, BorderRadiusScale } from '../schema/theme-schema';

/**
 * Figma Variable types
 */
export enum VariableType {
  COLOR = 'COLOR',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN'
}

/**
 * Figma Variable scope
 */
export enum VariableScope {
  ALL_FILLS = 'ALL_FILLS',
  ALL_STROKES = 'ALL_STROKES',
  TEXT_CONTENT = 'TEXT_CONTENT',
  CORNER_RADIUS = 'CORNER_RADIUS',
  WIDTH_HEIGHT = 'WIDTH_HEIGHT',
  GAP = 'GAP',
  FONT_SIZE = 'FONT_SIZE',
  FONT_FAMILY = 'FONT_FAMILY',
  FONT_WEIGHT = 'FONT_WEIGHT',
  LINE_HEIGHT = 'LINE_HEIGHT',
  LETTER_SPACING = 'LETTER_SPACING'
}

/**
 * Variable definition for creation
 */
export interface VariableDefinition {
  name: string;
  type: VariableType;
  scopes: VariableScope[];
  value: any;
  description?: string;
  collection?: string;
}

/**
 * Variable collection for organizing variables
 */
export interface VariableCollection {
  name: string;
  description?: string;
  variables: VariableDefinition[];
}

/**
 * Created variable reference
 */
export interface CreatedVariable {
  id: string;
  name: string;
  type: VariableType;
  scopes: VariableScope[];
  collection: string;
}

/**
 * Variable mode definition
 */
export interface VariableMode {
  name: string;
  modeId: string;
}

/**
 * Multi-mode variable definition
 */
export interface MultiModeVariableDefinition extends Omit<VariableDefinition, 'value'> {
  values: Record<string, any>; // mode name -> value
}

/**
 * Multi-mode variable collection
 */
export interface MultiModeVariableCollection {
  name: string;
  description?: string;
  modes: VariableMode[];
  variables: MultiModeVariableDefinition[];
}

/**
 * VariableManager - Creates and manages Figma Variables from Flutter themes
 */
export class VariableManager {
  private collections: Map<string, VariableCollection> = new Map();
  private multiModeCollections: Map<string, MultiModeVariableCollection> = new Map();
  private createdVariables: Map<string, CreatedVariable> = new Map();

  /**
   * Create variables from Flutter ThemeData
   */
  createVariablesFromTheme(theme: ThemeData, themeName: string = 'Default'): VariableCollection[] {
    const collections: VariableCollection[] = [];

    // Create color variables
    const colorCollection = this.createColorVariables(theme.colorScheme, `${themeName} Colors`);
    collections.push(colorCollection);
    this.collections.set(colorCollection.name, colorCollection);

    // Create typography variables
    const typographyCollection = this.createTypographyVariables(theme.textTheme, `${themeName} Typography`);
    collections.push(typographyCollection);
    this.collections.set(typographyCollection.name, typographyCollection);

    // Create spacing variables
    const spacingCollection = this.createSpacingVariables(theme.spacing, `${themeName} Spacing`);
    collections.push(spacingCollection);
    this.collections.set(spacingCollection.name, spacingCollection);

    // Create border radius variables
    const borderRadiusCollection = this.createBorderRadiusVariables(theme.borderRadius, `${themeName} Border Radius`);
    collections.push(borderRadiusCollection);
    this.collections.set(borderRadiusCollection.name, borderRadiusCollection);

    return collections;
  }

  /**
   * Create color variables from ColorScheme
   */
  createColorVariables(colorScheme: ColorScheme, collectionName: string): VariableCollection {
    const variables: VariableDefinition[] = [];

    // Primary colors
    variables.push({
      name: 'primary',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.primary),
      description: 'Primary brand color',
      collection: collectionName
    });

    variables.push({
      name: 'on-primary',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.onPrimary),
      description: 'Color for content on primary background',
      collection: collectionName
    });

    // Secondary colors
    variables.push({
      name: 'secondary',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.secondary),
      description: 'Secondary brand color',
      collection: collectionName
    });

    variables.push({
      name: 'on-secondary',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.onSecondary),
      description: 'Color for content on secondary background',
      collection: collectionName
    });

    // Error colors
    variables.push({
      name: 'error',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.error),
      description: 'Error state color',
      collection: collectionName
    });

    variables.push({
      name: 'on-error',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.onError),
      description: 'Color for content on error background',
      collection: collectionName
    });

    // Surface colors
    variables.push({
      name: 'background',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS],
      value: this.hexToRgb(colorScheme.background),
      description: 'Background color',
      collection: collectionName
    });

    variables.push({
      name: 'on-background',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.onBackground),
      description: 'Color for content on background',
      collection: collectionName
    });

    variables.push({
      name: 'surface',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS],
      value: this.hexToRgb(colorScheme.surface),
      description: 'Surface color for cards and sheets',
      collection: collectionName
    });

    variables.push({
      name: 'on-surface',
      type: VariableType.COLOR,
      scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
      value: this.hexToRgb(colorScheme.onSurface),
      description: 'Color for content on surface',
      collection: collectionName
    });

    // Optional colors
    if (colorScheme.surfaceVariant) {
      variables.push({
        name: 'surface-variant',
        type: VariableType.COLOR,
        scopes: [VariableScope.ALL_FILLS],
        value: this.hexToRgb(colorScheme.surfaceVariant),
        description: 'Surface variant color',
        collection: collectionName
      });
    }

    if (colorScheme.onSurfaceVariant) {
      variables.push({
        name: 'on-surface-variant',
        type: VariableType.COLOR,
        scopes: [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES],
        value: this.hexToRgb(colorScheme.onSurfaceVariant),
        description: 'Color for content on surface variant',
        collection: collectionName
      });
    }

    if (colorScheme.outline) {
      variables.push({
        name: 'outline',
        type: VariableType.COLOR,
        scopes: [VariableScope.ALL_STROKES],
        value: this.hexToRgb(colorScheme.outline),
        description: 'Outline color for borders',
        collection: collectionName
      });
    }

    if (colorScheme.shadow) {
      variables.push({
        name: 'shadow',
        type: VariableType.COLOR,
        scopes: [VariableScope.ALL_FILLS],
        value: this.hexToRgb(colorScheme.shadow),
        description: 'Shadow color',
        collection: collectionName
      });
    }

    return {
      name: collectionName,
      description: `Color variables from Flutter ColorScheme (${colorScheme.brightness} mode)`,
      variables
    };
  }

  /**
   * Create typography variables from TextTheme
   */
  createTypographyVariables(textTheme: TextTheme, collectionName: string): VariableCollection {
    const variables: VariableDefinition[] = [];

    // Helper function to create typography variables for a text style
    const createTextStyleVariables = (styleName: string, textStyle: TextStyle, description: string) => {
      if (textStyle.fontSize) {
        variables.push({
          name: `${styleName}-font-size`,
          type: VariableType.FLOAT,
          scopes: [VariableScope.FONT_SIZE],
          value: textStyle.fontSize,
          description: `${description} font size`,
          collection: collectionName
        });
      }

      if (textStyle.fontFamily) {
        variables.push({
          name: `${styleName}-font-family`,
          type: VariableType.STRING,
          scopes: [VariableScope.FONT_FAMILY],
          value: textStyle.fontFamily,
          description: `${description} font family`,
          collection: collectionName
        });
      }

      if (textStyle.fontWeight) {
        variables.push({
          name: `${styleName}-font-weight`,
          type: VariableType.STRING,
          scopes: [VariableScope.FONT_WEIGHT],
          value: this.mapFontWeight(textStyle.fontWeight),
          description: `${description} font weight`,
          collection: collectionName
        });
      }

      if (textStyle.height) {
        variables.push({
          name: `${styleName}-line-height`,
          type: VariableType.FLOAT,
          scopes: [VariableScope.LINE_HEIGHT],
          value: textStyle.height,
          description: `${description} line height multiplier`,
          collection: collectionName
        });
      }

      if (textStyle.letterSpacing) {
        variables.push({
          name: `${styleName}-letter-spacing`,
          type: VariableType.FLOAT,
          scopes: [VariableScope.LETTER_SPACING],
          value: textStyle.letterSpacing,
          description: `${description} letter spacing`,
          collection: collectionName
        });
      }
    };

    // Create variables for each text style
    if (textTheme.displayLarge) {
      createTextStyleVariables('display-large', textTheme.displayLarge, 'Display Large');
    }
    if (textTheme.displayMedium) {
      createTextStyleVariables('display-medium', textTheme.displayMedium, 'Display Medium');
    }
    if (textTheme.displaySmall) {
      createTextStyleVariables('display-small', textTheme.displaySmall, 'Display Small');
    }
    if (textTheme.headlineLarge) {
      createTextStyleVariables('headline-large', textTheme.headlineLarge, 'Headline Large');
    }
    if (textTheme.headlineMedium) {
      createTextStyleVariables('headline-medium', textTheme.headlineMedium, 'Headline Medium');
    }
    if (textTheme.headlineSmall) {
      createTextStyleVariables('headline-small', textTheme.headlineSmall, 'Headline Small');
    }
    if (textTheme.titleLarge) {
      createTextStyleVariables('title-large', textTheme.titleLarge, 'Title Large');
    }
    if (textTheme.titleMedium) {
      createTextStyleVariables('title-medium', textTheme.titleMedium, 'Title Medium');
    }
    if (textTheme.titleSmall) {
      createTextStyleVariables('title-small', textTheme.titleSmall, 'Title Small');
    }
    if (textTheme.bodyLarge) {
      createTextStyleVariables('body-large', textTheme.bodyLarge, 'Body Large');
    }
    if (textTheme.bodyMedium) {
      createTextStyleVariables('body-medium', textTheme.bodyMedium, 'Body Medium');
    }
    if (textTheme.bodySmall) {
      createTextStyleVariables('body-small', textTheme.bodySmall, 'Body Small');
    }
    if (textTheme.labelLarge) {
      createTextStyleVariables('label-large', textTheme.labelLarge, 'Label Large');
    }
    if (textTheme.labelMedium) {
      createTextStyleVariables('label-medium', textTheme.labelMedium, 'Label Medium');
    }
    if (textTheme.labelSmall) {
      createTextStyleVariables('label-small', textTheme.labelSmall, 'Label Small');
    }

    return {
      name: collectionName,
      description: 'Typography variables from Flutter TextTheme',
      variables
    };
  }

  /**
   * Create spacing variables from SpacingScale
   */
  createSpacingVariables(spacing: SpacingScale, collectionName: string): VariableCollection {
    const variables: VariableDefinition[] = [];

    // Create variables for each spacing value
    Object.entries(spacing).forEach(([key, value]) => {
      variables.push({
        name: `spacing-${key}`,
        type: VariableType.FLOAT,
        scopes: [VariableScope.GAP, VariableScope.WIDTH_HEIGHT],
        value: value,
        description: `Spacing scale ${key} (${value}px)`,
        collection: collectionName
      });
    });

    return {
      name: collectionName,
      description: 'Spacing variables from Flutter spacing scale',
      variables
    };
  }

  /**
   * Create border radius variables from BorderRadiusScale
   */
  createBorderRadiusVariables(borderRadius: BorderRadiusScale, collectionName: string): VariableCollection {
    const variables: VariableDefinition[] = [];

    // Create variables for each border radius value
    Object.entries(borderRadius).forEach(([key, value]) => {
      variables.push({
        name: `border-radius-${key}`,
        type: VariableType.FLOAT,
        scopes: [VariableScope.CORNER_RADIUS],
        value: value,
        description: `Border radius ${key} (${value}px)`,
        collection: collectionName
      });
    });

    return {
      name: collectionName,
      description: 'Border radius variables from Flutter border radius scale',
      variables
    };
  }

  /**
   * Get variable by name from a collection
   */
  getVariable(collectionName: string, variableName: string): VariableDefinition | undefined {
    const collection = this.collections.get(collectionName);
    if (!collection) return undefined;

    return collection.variables.find(v => v.name === variableName);
  }

  /**
   * Get all variables from a collection
   */
  getVariablesFromCollection(collectionName: string): VariableDefinition[] {
    const collection = this.collections.get(collectionName);
    return collection ? collection.variables : [];
  }

  /**
   * Get all collections
   */
  getAllCollections(): VariableCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Create multi-mode variables from multiple themes (e.g., light/dark)
   */
  createMultiModeVariablesFromThemes(themes: ThemeData[], themeNames: string[], collectionName: string): MultiModeVariableCollection[] {
    if (themes.length !== themeNames.length) {
      throw new Error('Number of themes must match number of theme names');
    }

    const collections: MultiModeVariableCollection[] = [];

    // Create modes
    const modes: VariableMode[] = themeNames.map((name, index) => ({
      name: name,
      modeId: `mode-${index}`
    }));

    // Create color variables with modes
    const colorCollection = this.createMultiModeColorVariables(themes, themeNames, modes, `${collectionName} Colors`);
    collections.push(colorCollection);
    this.multiModeCollections.set(colorCollection.name, colorCollection);

    // Create typography variables with modes
    const typographyCollection = this.createMultiModeTypographyVariables(themes, themeNames, modes, `${collectionName} Typography`);
    collections.push(typographyCollection);
    this.multiModeCollections.set(typographyCollection.name, typographyCollection);

    // Create spacing variables with modes (usually same across modes)
    const spacingCollection = this.createMultiModeSpacingVariables(themes, themeNames, modes, `${collectionName} Spacing`);
    collections.push(spacingCollection);
    this.multiModeCollections.set(spacingCollection.name, spacingCollection);

    // Create border radius variables with modes (usually same across modes)
    const borderRadiusCollection = this.createMultiModeBorderRadiusVariables(themes, themeNames, modes, `${collectionName} Border Radius`);
    collections.push(borderRadiusCollection);
    this.multiModeCollections.set(borderRadiusCollection.name, borderRadiusCollection);

    return collections;
  }

  /**
   * Create multi-mode color variables
   */
  createMultiModeColorVariables(themes: ThemeData[], themeNames: string[], modes: VariableMode[], collectionName: string): MultiModeVariableCollection {
    const variables: MultiModeVariableDefinition[] = [];

    // Get all unique color properties across all themes
    const colorProperties = [
      'primary', 'on-primary', 'secondary', 'on-secondary',
      'error', 'on-error', 'background', 'on-background',
      'surface', 'on-surface', 'surface-variant', 'on-surface-variant',
      'outline', 'shadow'
    ];

    colorProperties.forEach(propertyName => {
      const values: Record<string, any> = {};
      let hasAnyValue = false;

      themes.forEach((theme, index) => {
        const colorScheme = theme.colorScheme;
        let colorValue: string | undefined;

        // Map property names to ColorScheme properties
        switch (propertyName) {
          case 'primary': colorValue = colorScheme.primary; break;
          case 'on-primary': colorValue = colorScheme.onPrimary; break;
          case 'secondary': colorValue = colorScheme.secondary; break;
          case 'on-secondary': colorValue = colorScheme.onSecondary; break;
          case 'error': colorValue = colorScheme.error; break;
          case 'on-error': colorValue = colorScheme.onError; break;
          case 'background': colorValue = colorScheme.background; break;
          case 'on-background': colorValue = colorScheme.onBackground; break;
          case 'surface': colorValue = colorScheme.surface; break;
          case 'on-surface': colorValue = colorScheme.onSurface; break;
          case 'surface-variant': colorValue = colorScheme.surfaceVariant; break;
          case 'on-surface-variant': colorValue = colorScheme.onSurfaceVariant; break;
          case 'outline': colorValue = colorScheme.outline; break;
          case 'shadow': colorValue = colorScheme.shadow; break;
        }

        if (colorValue) {
          values[themeNames[index]] = this.hexToRgb(colorValue);
          hasAnyValue = true;
        }
      });

      // Only create variable if at least one theme has this property
      if (hasAnyValue) {
        const scopes = propertyName.includes('outline') 
          ? [VariableScope.ALL_STROKES]
          : propertyName.includes('background') || propertyName.includes('surface') || propertyName === 'shadow'
          ? [VariableScope.ALL_FILLS]
          : [VariableScope.ALL_FILLS, VariableScope.ALL_STROKES];

        variables.push({
          name: propertyName,
          type: VariableType.COLOR,
          scopes,
          values,
          description: `${propertyName.replace('-', ' ')} color across theme modes`,
          collection: collectionName
        });
      }
    });

    return {
      name: collectionName,
      description: `Multi-mode color variables from Flutter ColorSchemes`,
      modes,
      variables
    };
  }

  /**
   * Create multi-mode typography variables
   */
  createMultiModeTypographyVariables(themes: ThemeData[], themeNames: string[], modes: VariableMode[], collectionName: string): MultiModeVariableCollection {
    const variables: MultiModeVariableDefinition[] = [];
    const variableMap = new Map<string, Record<string, any>>();

    // Collect all typography variables across themes
    themes.forEach((theme, themeIndex) => {
      const singleModeCollection = this.createTypographyVariables(theme.textTheme, 'temp');
      
      singleModeCollection.variables.forEach(variable => {
        if (!variableMap.has(variable.name)) {
          variableMap.set(variable.name, {});
        }
        variableMap.get(variable.name)![themeNames[themeIndex]] = variable.value;
      });
    });

    // Convert to multi-mode variables
    variableMap.forEach((values, name) => {
      // Determine scopes based on variable name
      let scopes: VariableScope[];
      if (name.includes('font-size')) {
        scopes = [VariableScope.FONT_SIZE];
      } else if (name.includes('font-family')) {
        scopes = [VariableScope.FONT_FAMILY];
      } else if (name.includes('font-weight')) {
        scopes = [VariableScope.FONT_WEIGHT];
      } else if (name.includes('line-height')) {
        scopes = [VariableScope.LINE_HEIGHT];
      } else if (name.includes('letter-spacing')) {
        scopes = [VariableScope.LETTER_SPACING];
      } else {
        scopes = [VariableScope.FONT_SIZE]; // default
      }

      const type = name.includes('font-family') || name.includes('font-weight') 
        ? VariableType.STRING 
        : VariableType.FLOAT;

      variables.push({
        name,
        type,
        scopes,
        values,
        description: `${name.replace(/-/g, ' ')} across theme modes`,
        collection: collectionName
      });
    });

    return {
      name: collectionName,
      description: `Multi-mode typography variables from Flutter TextThemes`,
      modes,
      variables
    };
  }

  /**
   * Create multi-mode spacing variables (usually same across modes)
   */
  createMultiModeSpacingVariables(themes: ThemeData[], themeNames: string[], modes: VariableMode[], collectionName: string): MultiModeVariableCollection {
    const variables: MultiModeVariableDefinition[] = [];
    
    // Use the first theme's spacing as the base (spacing is usually consistent across modes)
    const baseSpacing = themes[0].spacing;
    
    Object.entries(baseSpacing).forEach(([key, value]) => {
      const values: Record<string, any> = {};
      
      // Check if spacing differs across themes
      themes.forEach((theme, index) => {
        values[themeNames[index]] = theme.spacing[key] || value;
      });

      variables.push({
        name: `spacing-${key}`,
        type: VariableType.FLOAT,
        scopes: [VariableScope.GAP, VariableScope.WIDTH_HEIGHT],
        values,
        description: `Spacing scale ${key} across theme modes`,
        collection: collectionName
      });
    });

    return {
      name: collectionName,
      description: `Multi-mode spacing variables from Flutter spacing scales`,
      modes,
      variables
    };
  }

  /**
   * Create multi-mode border radius variables (usually same across modes)
   */
  createMultiModeBorderRadiusVariables(themes: ThemeData[], themeNames: string[], modes: VariableMode[], collectionName: string): MultiModeVariableCollection {
    const variables: MultiModeVariableDefinition[] = [];
    
    // Use the first theme's border radius as the base
    const baseBorderRadius = themes[0].borderRadius;
    
    Object.entries(baseBorderRadius).forEach(([key, value]) => {
      const values: Record<string, any> = {};
      
      // Check if border radius differs across themes
      themes.forEach((theme, index) => {
        values[themeNames[index]] = theme.borderRadius[key] || value;
      });

      variables.push({
        name: `border-radius-${key}`,
        type: VariableType.FLOAT,
        scopes: [VariableScope.CORNER_RADIUS],
        values,
        description: `Border radius ${key} across theme modes`,
        collection: collectionName
      });
    });

    return {
      name: collectionName,
      description: `Multi-mode border radius variables from Flutter border radius scales`,
      modes,
      variables
    };
  }

  /**
   * Get multi-mode variable by name from collection
   */
  getMultiModeVariable(collectionName: string, variableName: string): MultiModeVariableDefinition | undefined {
    const collection = this.multiModeCollections.get(collectionName);
    if (!collection) return undefined;

    return collection.variables.find(v => v.name === variableName);
  }

  /**
   * Get all multi-mode variables from a collection
   */
  getMultiModeVariablesFromCollection(collectionName: string): MultiModeVariableDefinition[] {
    const collection = this.multiModeCollections.get(collectionName);
    return collection ? collection.variables : [];
  }

  /**
   * Get all multi-mode collections
   */
  getAllMultiModeCollections(): MultiModeVariableCollection[] {
    return Array.from(this.multiModeCollections.values());
  }

  /**
   * Generate variable name from theme path
   */
  generateVariableName(themePath: string): string {
    // Convert theme paths like 'colorScheme.primary' to 'primary'
    // or 'textTheme.bodyLarge.fontSize' to 'body-large-font-size'
    return themePath
      .replace(/^(colorScheme|textTheme)\./, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }

  /**
   * Convert hex color to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace('#', '');

    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    return { r, g, b };
  }

  /**
   * Map Flutter FontWeight to Figma font weight
   */
  private mapFontWeight(fontWeight: string): string {
    const weightMap: Record<string, string> = {
      '100': 'Thin',
      '200': 'Extra Light',
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semi Bold',
      '700': 'Bold',
      '800': 'Extra Bold',
      '900': 'Black'
    };

    return weightMap[fontWeight] || 'Regular';
  }
}
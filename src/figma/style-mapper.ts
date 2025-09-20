import { StyleInfo, ColorInfo, TypographyInfo, SpacingInfo, BorderInfo, ShadowInfo } from '../schema/types';
import { FigmaNodeSpec, FigmaNodeType, VariableBinding, RGB } from './figma-node-spec';
import { VariableManager, VariableDefinition, MultiModeVariableDefinition } from './variable-manager';

/**
 * Style application result
 */
export interface StyleApplicationResult {
  success: boolean;
  appliedProperties: string[];
  variableBindings: VariableBinding[];
  errors: string[];
  warnings: string[];
}

/**
 * Style mapping configuration
 */
export interface StyleMappingConfig {
  useVariables: boolean;
  fallbackToDirectValues: boolean;
  collectionPrefix: string;
  preferMultiMode: boolean;
}

/**
 * Default style mapping configuration
 */
export const DEFAULT_STYLE_CONFIG: StyleMappingConfig = {
  useVariables: true,
  fallbackToDirectValues: true,
  collectionPrefix: 'Default',
  preferMultiMode: false
};

/**
 * StyleMapper - Applies Flutter styling to Figma nodes using Variables
 */
export class StyleMapper {
  private variableManager: VariableManager;
  private config: StyleMappingConfig;

  constructor(variableManager: VariableManager, config: StyleMappingConfig = DEFAULT_STYLE_CONFIG) {
    this.variableManager = variableManager;
    this.config = config;
  }

  /**
   * Apply styling to a Figma node
   */
  applyStyles(nodeSpec: FigmaNodeSpec, styling: StyleInfo): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    try {
      // Apply color styling
      if (styling.colors && styling.colors.length > 0) {
        const colorResult = this.applyColorStyles(nodeSpec, styling.colors);
        this.mergeResults(result, colorResult);
      }

      // Apply typography styling
      if (styling.typography && nodeSpec.type === FigmaNodeType.TEXT) {
        const typographyResult = this.applyTypographyStyles(nodeSpec, styling.typography);
        this.mergeResults(result, typographyResult);
      }

      // Apply spacing styling
      if (styling.spacing) {
        const spacingResult = this.applySpacingStyles(nodeSpec, styling.spacing);
        this.mergeResults(result, spacingResult);
      }

      // Apply border styling
      if (styling.borders) {
        const borderResult = this.applyBorderStyles(nodeSpec, styling.borders);
        this.mergeResults(result, borderResult);
      }

      // Apply shadow styling
      if (styling.shadows) {
        const shadowResult = this.applyShadowStyles(nodeSpec, styling.shadows);
        this.mergeResults(result, shadowResult);
      }

      // Add variable bindings to node spec
      if (result.variableBindings.length > 0) {
        nodeSpec.variables = (nodeSpec.variables || []).concat(result.variableBindings);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to apply styles: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Apply color styles to node
   */
  applyColorStyles(nodeSpec: FigmaNodeSpec, colors: ColorInfo[]): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    colors.forEach(colorInfo => {
      try {
        if (colorInfo.isThemeReference && colorInfo.themePath && this.config.useVariables) {
          // Try to use variable
          const variableBinding = this.createColorVariableBinding(colorInfo);
          if (variableBinding) {
            result.variableBindings.push(variableBinding);
            result.appliedProperties.push(colorInfo.property);
          } else if (this.config.fallbackToDirectValues) {
            // Fallback to direct color value
            this.applyDirectColorValue(nodeSpec, colorInfo);
            result.appliedProperties.push(colorInfo.property);
            result.warnings.push(`Variable not found for ${colorInfo.themePath}, using direct value`);
          } else {
            result.errors.push(`Variable not found for theme path: ${colorInfo.themePath}`);
          }
        } else {
          // Apply direct color value
          this.applyDirectColorValue(nodeSpec, colorInfo);
          result.appliedProperties.push(colorInfo.property);
        }
      } catch (error) {
        result.errors.push(`Failed to apply color ${colorInfo.property}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return result;
  }

  /**
   * Apply typography styles to text node
   */
  applyTypographyStyles(nodeSpec: FigmaNodeSpec, typography: TypographyInfo): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    if (nodeSpec.type !== FigmaNodeType.TEXT) {
      result.warnings.push('Typography styles can only be applied to TEXT nodes');
      return result;
    }

    try {
      // Apply font size
      if (typography.fontSize !== undefined) {
        if (typography.isThemeReference && typography.themePath && this.config.useVariables) {
          const variableBinding = this.createTypographyVariableBinding('fontSize', typography.themePath);
          if (variableBinding) {
            result.variableBindings.push(variableBinding);
            result.appliedProperties.push('fontSize');
          } else if (this.config.fallbackToDirectValues) {
            nodeSpec.properties.fontSize = typography.fontSize;
            result.appliedProperties.push('fontSize');
            result.warnings.push(`Variable not found for ${typography.themePath}, using direct value`);
          }
        } else {
          nodeSpec.properties.fontSize = typography.fontSize;
          result.appliedProperties.push('fontSize');
        }
      }

      // Apply font family
      if (typography.fontFamily) {
        if (typography.isThemeReference && typography.themePath && this.config.useVariables) {
          const variableBinding = this.createTypographyVariableBinding('fontFamily', typography.themePath);
          if (variableBinding) {
            result.variableBindings.push(variableBinding);
            result.appliedProperties.push('fontFamily');
          } else if (this.config.fallbackToDirectValues) {
            this.setFontFamily(nodeSpec, typography.fontFamily);
            result.appliedProperties.push('fontFamily');
            result.warnings.push(`Variable not found for ${typography.themePath}, using direct value`);
          }
        } else {
          this.setFontFamily(nodeSpec, typography.fontFamily);
          result.appliedProperties.push('fontFamily');
        }
      }

      // Apply font weight
      if (typography.fontWeight) {
        if (typography.isThemeReference && typography.themePath && this.config.useVariables) {
          const variableBinding = this.createTypographyVariableBinding('fontWeight', typography.themePath);
          if (variableBinding) {
            result.variableBindings.push(variableBinding);
            result.appliedProperties.push('fontWeight');
          } else if (this.config.fallbackToDirectValues) {
            this.setFontWeight(nodeSpec, typography.fontWeight);
            result.appliedProperties.push('fontWeight');
            result.warnings.push(`Variable not found for ${typography.themePath}, using direct value`);
          }
        } else {
          this.setFontWeight(nodeSpec, typography.fontWeight);
          result.appliedProperties.push('fontWeight');
        }
      }

      // Apply line height
      if (typography.lineHeight !== undefined) {
        if (typography.isThemeReference && typography.themePath && this.config.useVariables) {
          const variableBinding = this.createTypographyVariableBinding('lineHeight', typography.themePath);
          if (variableBinding) {
            result.variableBindings.push(variableBinding);
            result.appliedProperties.push('lineHeight');
          } else if (this.config.fallbackToDirectValues) {
            nodeSpec.properties.lineHeight = { unit: 'PERCENT', value: typography.lineHeight * 100 };
            result.appliedProperties.push('lineHeight');
            result.warnings.push(`Variable not found for ${typography.themePath}, using direct value`);
          }
        } else {
          nodeSpec.properties.lineHeight = { unit: 'PERCENT', value: typography.lineHeight * 100 };
          result.appliedProperties.push('lineHeight');
        }
      }

      // Apply letter spacing
      if (typography.letterSpacing !== undefined) {
        if (typography.isThemeReference && typography.themePath && this.config.useVariables) {
          const variableBinding = this.createTypographyVariableBinding('letterSpacing', typography.themePath);
          if (variableBinding) {
            result.variableBindings.push(variableBinding);
            result.appliedProperties.push('letterSpacing');
          } else if (this.config.fallbackToDirectValues) {
            nodeSpec.properties.letterSpacing = { unit: 'PIXELS', value: typography.letterSpacing };
            result.appliedProperties.push('letterSpacing');
            result.warnings.push(`Variable not found for ${typography.themePath}, using direct value`);
          }
        } else {
          nodeSpec.properties.letterSpacing = { unit: 'PIXELS', value: typography.letterSpacing };
          result.appliedProperties.push('letterSpacing');
        }
      }

      // Apply text color
      if (typography.color) {
        const colorInfo: ColorInfo = {
          property: 'color',
          value: typography.color,
          isThemeReference: typography.isThemeReference,
          themePath: typography.themePath
        };
        const colorResult = this.applyColorStyles(nodeSpec, [colorInfo]);
        this.mergeResults(result, colorResult);
      }

    } catch (error) {
      result.errors.push(`Failed to apply typography styles: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Apply spacing styles to node
   */
  applySpacingStyles(nodeSpec: FigmaNodeSpec, spacing: SpacingInfo): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    try {
      // Apply padding (for Auto Layout frames)
      if (spacing.padding && nodeSpec.autoLayout) {
        const paddingResult = this.applyPaddingStyles(nodeSpec, spacing.padding);
        this.mergeResults(result, paddingResult);
      }

      // Apply margin (converted to gap in Auto Layout)
      if (spacing.margin && nodeSpec.autoLayout) {
        // Margin is typically handled as itemSpacing in Auto Layout
        const marginValue = Math.max(spacing.margin.top, spacing.margin.right, spacing.margin.bottom, spacing.margin.left);
        nodeSpec.autoLayout.itemSpacing = marginValue;
        result.appliedProperties.push('margin');
      }

    } catch (error) {
      result.errors.push(`Failed to apply spacing styles: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Apply border styles to node
   */
  applyBorderStyles(nodeSpec: FigmaNodeSpec, borders: BorderInfo): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    try {
      // Apply border width and color
      if (borders.width && borders.color) {
        nodeSpec.properties.strokes = nodeSpec.properties.strokes || [];
        nodeSpec.properties.strokes.push({
          type: 'SOLID',
          color: this.hexToRgb(borders.color),
          opacity: 1
        });
        nodeSpec.properties.strokeWeight = borders.width;
        result.appliedProperties.push('border');
      }

      // Apply border radius
      if (borders.radius) {
        const radius = borders.radius;
        if (radius.topLeft === radius.topRight && 
            radius.topRight === radius.bottomLeft && 
            radius.bottomLeft === radius.bottomRight) {
          // Uniform radius
          nodeSpec.properties.cornerRadius = radius.topLeft;
        } else {
          // Individual corner radii
          nodeSpec.properties.topLeftRadius = radius.topLeft;
          nodeSpec.properties.topRightRadius = radius.topRight;
          nodeSpec.properties.bottomLeftRadius = radius.bottomLeft;
          nodeSpec.properties.bottomRightRadius = radius.bottomRight;
        }
        result.appliedProperties.push('borderRadius');
      }

    } catch (error) {
      result.errors.push(`Failed to apply border styles: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Apply shadow styles to node
   */
  applyShadowStyles(nodeSpec: FigmaNodeSpec, shadows: ShadowInfo[]): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    try {
      nodeSpec.properties.effects = nodeSpec.properties.effects || [];
      
      shadows.forEach(shadow => {
        nodeSpec.properties.effects.push({
          type: 'DROP_SHADOW',
          color: this.hexToRgb(shadow.color),
          offset: shadow.offset,
          radius: shadow.blur,
          spread: shadow.spread || 0,
          visible: true,
          blendMode: 'NORMAL'
        });
      });

      result.appliedProperties.push('shadows');

    } catch (error) {
      result.errors.push(`Failed to apply shadow styles: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Create color variable binding
   */
  private createColorVariableBinding(colorInfo: ColorInfo): VariableBinding | null {
    if (!colorInfo.themePath) return null;

    const variableName = this.variableManager.generateVariableName(colorInfo.themePath);
    const collectionName = `${this.config.collectionPrefix} Colors`;
    
    // Try multi-mode first if preferred
    if (this.config.preferMultiMode) {
      const multiModeVariable = this.variableManager.getMultiModeVariable(collectionName, variableName);
      if (multiModeVariable) {
        return {
          property: this.mapColorPropertyToFigma(colorInfo.property),
          variableId: `multimode-${collectionName}-${variableName}`,
          variableAlias: `{${collectionName}.${variableName}}`
        };
      }
    }

    // Try single-mode variable
    const variable = this.variableManager.getVariable(collectionName, variableName);
    if (variable) {
      return {
        property: this.mapColorPropertyToFigma(colorInfo.property),
        variableId: `${collectionName}-${variableName}`,
        variableAlias: `{${collectionName}.${variableName}}`
      };
    }

    return null;
  }

  /**
   * Create typography variable binding
   */
  private createTypographyVariableBinding(property: string, themePath: string): VariableBinding | null {
    // For typography, we need to construct the variable name based on the theme path and property
    // e.g., 'textTheme.bodyLarge.fontSize' -> 'body-large-font-size'
    let variableName: string;
    
    if (themePath.includes('textTheme')) {
      // Extract the text style name from the path
      const pathParts = themePath.split('.');
      if (pathParts.length >= 2) {
        const styleName = pathParts[1]; // e.g., 'bodyLarge'
        const kebabStyleName = styleName.replace(/([A-Z])/g, '-$1').toLowerCase(); // 'body-large'
        const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase(); // 'font-size'
        variableName = `${kebabStyleName}-${kebabProperty}`;
      } else {
        variableName = this.variableManager.generateVariableName(themePath);
      }
    } else {
      variableName = this.variableManager.generateVariableName(themePath);
    }
    
    const collectionName = `${this.config.collectionPrefix} Typography`;
    
    // Try multi-mode first if preferred
    if (this.config.preferMultiMode) {
      const multiModeVariable = this.variableManager.getMultiModeVariable(collectionName, variableName);
      if (multiModeVariable) {
        return {
          property: property,
          variableId: `multimode-${collectionName}-${variableName}`,
          variableAlias: `{${collectionName}.${variableName}}`
        };
      }
    }

    // Try single-mode variable
    const variable = this.variableManager.getVariable(collectionName, variableName);
    if (variable) {
      return {
        property: property,
        variableId: `${collectionName}-${variableName}`,
        variableAlias: `{${collectionName}.${variableName}}`
      };
    }

    return null;
  }

  /**
   * Apply direct color value to node
   */
  private applyDirectColorValue(nodeSpec: FigmaNodeSpec, colorInfo: ColorInfo): void {
    const rgbColor = this.hexToRgb(colorInfo.value);
    
    switch (colorInfo.property) {
      case 'backgroundColor':
      case 'color':
        nodeSpec.properties.fills = nodeSpec.properties.fills || [];
        nodeSpec.properties.fills.push({
          type: 'SOLID',
          color: rgbColor,
          opacity: 1
        });
        break;
      case 'borderColor':
        nodeSpec.properties.strokes = nodeSpec.properties.strokes || [];
        nodeSpec.properties.strokes.push({
          type: 'SOLID',
          color: rgbColor,
          opacity: 1
        });
        break;
    }
  }

  /**
   * Apply padding styles with potential variable bindings
   */
  private applyPaddingStyles(nodeSpec: FigmaNodeSpec, padding: any): StyleApplicationResult {
    const result: StyleApplicationResult = {
      success: true,
      appliedProperties: [],
      variableBindings: [],
      errors: [],
      warnings: []
    };

    if (nodeSpec.autoLayout) {
      nodeSpec.autoLayout.paddingTop = padding.top;
      nodeSpec.autoLayout.paddingRight = padding.right;
      nodeSpec.autoLayout.paddingBottom = padding.bottom;
      nodeSpec.autoLayout.paddingLeft = padding.left;
      result.appliedProperties.push('padding');
    }

    return result;
  }

  /**
   * Set font family on text node
   */
  private setFontFamily(nodeSpec: FigmaNodeSpec, fontFamily: string): void {
    nodeSpec.properties.fontName = nodeSpec.properties.fontName || {};
    nodeSpec.properties.fontName.family = fontFamily;
    if (!nodeSpec.properties.fontName.style) {
      nodeSpec.properties.fontName.style = 'Regular';
    }
  }

  /**
   * Set font weight on text node
   */
  private setFontWeight(nodeSpec: FigmaNodeSpec, fontWeight: string): void {
    nodeSpec.properties.fontName = nodeSpec.properties.fontName || {};
    if (!nodeSpec.properties.fontName.family) {
      nodeSpec.properties.fontName.family = 'Inter';
    }
    nodeSpec.properties.fontName.style = this.mapFontWeightToStyle(fontWeight);
  }

  /**
   * Map color property to Figma property
   */
  private mapColorPropertyToFigma(property: string): string {
    const mapping: Record<string, string> = {
      'backgroundColor': 'fills',
      'color': 'fills',
      'borderColor': 'strokes'
    };
    return mapping[property] || 'fills';
  }

  /**
   * Map font weight to Figma font style
   */
  private mapFontWeightToStyle(fontWeight: string): string {
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

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): RGB {
    hex = hex.replace('#', '');
    
    // Validate hex color format
    if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
      throw new Error(`Invalid hex color format: ${hex}`);
    }
    
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Check for NaN values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error(`Invalid hex color values: ${hex}`);
    }
    
    return { r, g, b };
  }

  /**
   * Merge style application results
   */
  private mergeResults(target: StyleApplicationResult, source: StyleApplicationResult): void {
    target.success = target.success && source.success;
    target.appliedProperties.push(...source.appliedProperties);
    target.variableBindings.push(...source.variableBindings);
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);
    
    // If there are errors, mark as unsuccessful
    if (target.errors.length > 0) {
      target.success = false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StyleMappingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): StyleMappingConfig {
    return { ...this.config };
  }
}
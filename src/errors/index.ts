// Error handling types and base classes

/**
 * Base error class for all plugin errors
 */
export abstract class PluginError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Convert error to user-friendly message
   */
  abstract toUserMessage(): string;
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  SYNTAX = 'SYNTAX',
  WIDGET = 'WIDGET', 
  THEME = 'THEME',
  CONVERSION = 'CONVERSION',
  VARIABLE = 'VARIABLE',
  FIGMA_API = 'FIGMA_API',
  VALIDATION = 'VALIDATION'
}

/**
 * Parse error for Dart syntax issues
 */
export class ParseError extends PluginError {
  readonly code = 'PARSE_ERROR';
  readonly category = ErrorCategory.SYNTAX;

  constructor(
    message: string,
    public readonly line?: number,
    public readonly column?: number,
    public readonly sourceCode?: string
  ) {
    super(message, { line, column, sourceCode });
  }

  toUserMessage(): string {
    const location = this.line ? ` at line ${this.line}` : '';
    return `Syntax error${location}: ${this.message}`;
  }
}

/**
 * Widget error for unsupported or invalid widgets
 */
export class WidgetError extends PluginError {
  readonly code = 'WIDGET_ERROR';
  readonly category = ErrorCategory.WIDGET;

  constructor(
    message: string,
    public readonly widgetType?: string,
    public readonly widgetProperties?: Record<string, any>
  ) {
    super(message, { widgetType, widgetProperties });
  }

  toUserMessage(): string {
    const widget = this.widgetType ? ` in ${this.widgetType}` : '';
    return `Widget error${widget}: ${this.message}`;
  }
}

/**
 * Theme error for theme-related issues
 */
export class ThemeError extends PluginError {
  readonly code = 'THEME_ERROR';
  readonly category = ErrorCategory.THEME;

  constructor(
    message: string,
    public readonly themePath?: string
  ) {
    super(message, { themePath });
  }

  toUserMessage(): string {
    const path = this.themePath ? ` (${this.themePath})` : '';
    return `Theme error${path}: ${this.message}`;
  }
}

/**
 * Conversion error for Figma node creation issues
 */
export class ConversionError extends PluginError {
  readonly code = 'CONVERSION_ERROR';
  readonly category = ErrorCategory.CONVERSION;

  constructor(
    message: string,
    public readonly nodeType?: string,
    public readonly originalWidget?: any
  ) {
    super(message, { nodeType, originalWidget });
  }

  toUserMessage(): string {
    const type = this.nodeType ? ` for ${this.nodeType}` : '';
    return `Conversion error${type}: ${this.message}`;
  }
}

/**
 * Variable error for Figma Variable issues
 */
export class VariableError extends PluginError {
  readonly code = 'VARIABLE_ERROR';
  readonly category = ErrorCategory.VARIABLE;

  constructor(
    message: string,
    public readonly variableName?: string,
    public readonly variableType?: string
  ) {
    super(message, { variableName, variableType });
  }

  toUserMessage(): string {
    const name = this.variableName ? ` '${this.variableName}'` : '';
    return `Variable error${name}: ${this.message}`;
  }
}

/**
 * Figma API error for API-related issues
 */
export class FigmaApiError extends PluginError {
  readonly code = 'FIGMA_API_ERROR';
  readonly category = ErrorCategory.FIGMA_API;

  constructor(
    message: string,
    public readonly apiMethod?: string,
    public readonly statusCode?: number
  ) {
    super(message, { apiMethod, statusCode });
  }

  toUserMessage(): string {
    return `Figma API error: ${this.message}`;
  }
}

/**
 * Validation error for input validation issues
 */
export class ValidationError extends PluginError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = ErrorCategory.VALIDATION;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any
  ) {
    super(message, { field, value });
  }

  toUserMessage(): string {
    const field = this.field ? ` in ${this.field}` : '';
    return `Validation error${field}: ${this.message}`;
  }
}

/**
 * Error result type for operations that can fail
 */
export type ErrorResult<T> = {
  success: true;
  data: T;
  warnings?: string[];
} | {
  success: false;
  error: PluginError;
  warnings?: string[];
};

/**
 * Parse result with potential errors and warnings
 */
export interface ParseResult<T> {
  data?: T;
  errors: PluginError[];
  warnings: string[];
  success: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handleError(error: PluginError): void;
  handleParseError(error: ParseError): void;
  handleWidgetError(widget: any, error: WidgetError): void;
  handleConversionError(error: ConversionError): void;
  showUserFeedback(message: string, type: 'error' | 'warning' | 'info'): void;
}

/**
 * Graceful error handler with fallback mechanisms
 */
export class GracefulErrorHandler implements ErrorHandler {
  private errors: PluginError[] = [];
  private warnings: string[] = [];

  handleError(error: PluginError): void {
    this.errors.push(error);
    console.error(`[${error.category}] ${error.code}: ${error.message}`, error.context);
  }

  handleParseError(error: ParseError): void {
    this.handleError(error);
    this.showUserFeedback(error.toUserMessage(), 'error');
  }

  handleWidgetError(widget: any, error: WidgetError): void {
    this.handleError(error);
    // Create fallback placeholder for unsupported widgets
    this.warnings.push(`Created placeholder for unsupported widget: ${widget.type || 'Unknown'}`);
  }

  handleConversionError(error: ConversionError): void {
    this.handleError(error);
    this.showUserFeedback(error.toUserMessage(), 'error');
  }

  showUserFeedback(message: string, type: 'error' | 'warning' | 'info'): void {
    // Implementation will depend on UI framework
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  getErrors(): PluginError[] {
    return [...this.errors];
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}
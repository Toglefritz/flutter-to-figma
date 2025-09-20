// Error handling types and base classes
/**
 * Base error class for all plugin errors
 */
export class PluginError extends Error {
    constructor(message, context) {
        super(message);
        this.context = context;
        this.name = this.constructor.name;
    }
}
/**
 * Error categories for classification
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["SYNTAX"] = "SYNTAX";
    ErrorCategory["WIDGET"] = "WIDGET";
    ErrorCategory["THEME"] = "THEME";
    ErrorCategory["CONVERSION"] = "CONVERSION";
    ErrorCategory["VARIABLE"] = "VARIABLE";
    ErrorCategory["FIGMA_API"] = "FIGMA_API";
    ErrorCategory["VALIDATION"] = "VALIDATION";
})(ErrorCategory || (ErrorCategory = {}));
/**
 * Parse error for Dart syntax issues
 */
export class ParseError extends PluginError {
    constructor(message, line, column, sourceCode) {
        super(message, { line, column, sourceCode });
        this.line = line;
        this.column = column;
        this.sourceCode = sourceCode;
        this.code = 'PARSE_ERROR';
        this.category = ErrorCategory.SYNTAX;
    }
    toUserMessage() {
        const location = this.line ? ` at line ${this.line}` : '';
        return `Syntax error${location}: ${this.message}`;
    }
}
/**
 * Widget error for unsupported or invalid widgets
 */
export class WidgetError extends PluginError {
    constructor(message, widgetType, widgetProperties) {
        super(message, { widgetType, widgetProperties });
        this.widgetType = widgetType;
        this.widgetProperties = widgetProperties;
        this.code = 'WIDGET_ERROR';
        this.category = ErrorCategory.WIDGET;
    }
    toUserMessage() {
        const widget = this.widgetType ? ` in ${this.widgetType}` : '';
        return `Widget error${widget}: ${this.message}`;
    }
}
/**
 * Theme error for theme-related issues
 */
export class ThemeError extends PluginError {
    constructor(message, themePath) {
        super(message, { themePath });
        this.themePath = themePath;
        this.code = 'THEME_ERROR';
        this.category = ErrorCategory.THEME;
    }
    toUserMessage() {
        const path = this.themePath ? ` (${this.themePath})` : '';
        return `Theme error${path}: ${this.message}`;
    }
}
/**
 * Conversion error for Figma node creation issues
 */
export class ConversionError extends PluginError {
    constructor(message, nodeType, originalWidget) {
        super(message, { nodeType, originalWidget });
        this.nodeType = nodeType;
        this.originalWidget = originalWidget;
        this.code = 'CONVERSION_ERROR';
        this.category = ErrorCategory.CONVERSION;
    }
    toUserMessage() {
        const type = this.nodeType ? ` for ${this.nodeType}` : '';
        return `Conversion error${type}: ${this.message}`;
    }
}
/**
 * Variable error for Figma Variable issues
 */
export class VariableError extends PluginError {
    constructor(message, variableName, variableType) {
        super(message, { variableName, variableType });
        this.variableName = variableName;
        this.variableType = variableType;
        this.code = 'VARIABLE_ERROR';
        this.category = ErrorCategory.VARIABLE;
    }
    toUserMessage() {
        const name = this.variableName ? ` '${this.variableName}'` : '';
        return `Variable error${name}: ${this.message}`;
    }
}
/**
 * Figma API error for API-related issues
 */
export class FigmaApiError extends PluginError {
    constructor(message, apiMethod, statusCode) {
        super(message, { apiMethod, statusCode });
        this.apiMethod = apiMethod;
        this.statusCode = statusCode;
        this.code = 'FIGMA_API_ERROR';
        this.category = ErrorCategory.FIGMA_API;
    }
    toUserMessage() {
        return `Figma API error: ${this.message}`;
    }
}
/**
 * Validation error for input validation issues
 */
export class ValidationError extends PluginError {
    constructor(message, field, value) {
        super(message, { field, value });
        this.field = field;
        this.value = value;
        this.code = 'VALIDATION_ERROR';
        this.category = ErrorCategory.VALIDATION;
    }
    toUserMessage() {
        const field = this.field ? ` in ${this.field}` : '';
        return `Validation error${field}: ${this.message}`;
    }
}
/**
 * Graceful error handler with fallback mechanisms
 */
export class GracefulErrorHandler {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }
    handleError(error) {
        this.errors.push(error);
        console.error(`[${error.category}] ${error.code}: ${error.message}`, error.context);
    }
    handleParseError(error) {
        this.handleError(error);
        this.showUserFeedback(error.toUserMessage(), 'error');
    }
    handleWidgetError(widget, error) {
        this.handleError(error);
        // Create fallback placeholder for unsupported widgets
        this.warnings.push(`Created placeholder for unsupported widget: ${widget.type || 'Unknown'}`);
    }
    handleConversionError(error) {
        this.handleError(error);
        this.showUserFeedback(error.toUserMessage(), 'error');
    }
    showUserFeedback(message, type) {
        // Implementation will depend on UI framework
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    getErrors() {
        return [...this.errors];
    }
    getWarnings() {
        return [...this.warnings];
    }
    hasErrors() {
        return this.errors.length > 0;
    }
    clear() {
        this.errors = [];
        this.warnings = [];
    }
}

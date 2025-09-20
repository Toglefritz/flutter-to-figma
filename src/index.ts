// Main entry point for the Flutter → Figma plugin

// Core types and interfaces
export * from './schema';
export * from './figma/figma-node-spec';

// Error handling (use specific exports to avoid conflicts)
export {
  PluginError,
  ErrorCategory,
  ParseError as PluginParseError,
  WidgetError,
  ThemeError,
  ConversionError,
  VariableError,
  FigmaApiError,
  ValidationError,
  ErrorResult,
  ParseResult as PluginParseResult,
  ValidationResult as PluginValidationResult,
  ErrorHandler,
  GracefulErrorHandler
} from './errors';

// Parser module (use specific exports to avoid conflicts)
export {
  DartParser,
  DartLexer,
  WidgetExtractor,
  TokenType,
  Token,
  ASTNodeType,
  ASTNode,
  ConstructorCallNode,
  IdentifierNode,
  LiteralNode,
  PropertyAccessNode,
  MethodCallNode,
  ArrayLiteralNode,
  NamedArgumentNode,
  PositionalArgumentNode,
  ArgumentListNode,
  ProgramNode,
  ExpressionNode,
  LexerResult,
  LexerError,
  ParseResult,
  ParseError,
  ValidationResult,
  EnhancedParseResult,
  WidgetExtractionResult
} from './parser';

// Module exports
export * from './figma';
export * from './ui';

// Re-export key interfaces for easy access
export type {
  Widget,
  WidgetType,
  StyleInfo,
  ThemeData
} from './schema';

export type {
  FigmaNodeSpec
} from './figma/figma-node-spec';
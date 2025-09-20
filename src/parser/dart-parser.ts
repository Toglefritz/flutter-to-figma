/**
 * Token types for Dart lexical analysis
 */
export enum TokenType {
  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  
  // Keywords
  CLASS = 'CLASS',
  CONST = 'CONST',
  FINAL = 'FINAL',
  VAR = 'VAR',
  NEW = 'NEW',
  THIS = 'THIS',
  SUPER = 'SUPER',
  NULL = 'NULL',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  
  // Operators
  ASSIGN = 'ASSIGN',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  DOT = 'DOT',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  QUESTION = 'QUESTION',
  
  // Delimiters
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  LEFT_ANGLE = 'LEFT_ANGLE',
  RIGHT_ANGLE = 'RIGHT_ANGLE',
  
  // Special
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Token representation
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  start: number;
  end: number;
}

/**
 * Lexer result containing tokens and any errors
 */
export interface LexerResult {
  tokens: Token[];
  errors: LexerError[];
}

/**
 * Lexer error information
 */
export interface LexerError {
  message: string;
  line: number;
  column: number;
  position: number;
}

/**
 * Dart lexer for tokenizing Dart source code
 */
export class DartLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];

  // Dart keywords
  private static readonly KEYWORDS = new Set([
    'class', 'const', 'final', 'var', 'new', 'this', 'super',
    'null', 'true', 'false', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'void', 'int', 'double', 'String', 'bool',
    'List', 'Map', 'Set', 'dynamic', 'Object'
  ]);

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the source code
   */
  tokenize(): LexerResult {
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.addToken(TokenType.EOF, '');
    
    return {
      tokens: this.tokens,
      errors: this.errors
    };
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private scanToken(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    const char = this.advance();

    switch (char) {
      case ' ':
      case '\r':
      case '\t':
        // Skip whitespace
        break;
      case '\n':
        this.addToken(TokenType.NEWLINE, char, start, startLine, startColumn);
        this.line++;
        this.column = 1;
        break;
      case '(':
        this.addToken(TokenType.LEFT_PAREN, char, start, startLine, startColumn);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN, char, start, startLine, startColumn);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE, char, start, startLine, startColumn);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE, char, start, startLine, startColumn);
        break;
      case '[':
        this.addToken(TokenType.LEFT_BRACKET, char, start, startLine, startColumn);
        break;
      case ']':
        this.addToken(TokenType.RIGHT_BRACKET, char, start, startLine, startColumn);
        break;
      case '<':
        this.addToken(TokenType.LEFT_ANGLE, char, start, startLine, startColumn);
        break;
      case '>':
        this.addToken(TokenType.RIGHT_ANGLE, char, start, startLine, startColumn);
        break;
      case ',':
        this.addToken(TokenType.COMMA, char, start, startLine, startColumn);
        break;
      case '.':
        this.addToken(TokenType.DOT, char, start, startLine, startColumn);
        break;
      case ':':
        this.addToken(TokenType.COLON, char, start, startLine, startColumn);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON, char, start, startLine, startColumn);
        break;
      case '+':
        this.addToken(TokenType.PLUS, char, start, startLine, startColumn);
        break;
      case '-':
        this.addToken(TokenType.MINUS, char, start, startLine, startColumn);
        break;
      case '*':
        this.addToken(TokenType.MULTIPLY, char, start, startLine, startColumn);
        break;
      case '=':
        this.addToken(TokenType.ASSIGN, char, start, startLine, startColumn);
        break;
      case '?':
        this.addToken(TokenType.QUESTION, char, start, startLine, startColumn);
        break;
      case '/':
        if (this.match('/')) {
          // Single line comment
          this.scanSingleLineComment(start, startLine, startColumn);
        } else if (this.match('*')) {
          // Multi-line comment
          this.scanMultiLineComment(start, startLine, startColumn);
        } else {
          this.addToken(TokenType.DIVIDE, char, start, startLine, startColumn);
        }
        break;
      case '"':
      case "'":
        this.scanString(char, start, startLine, startColumn);
        break;
      default:
        if (this.isDigit(char)) {
          this.scanNumber(start, startLine, startColumn);
        } else if (this.isAlpha(char)) {
          this.scanIdentifier(start, startLine, startColumn);
        } else {
          this.addError(`Unexpected character: ${char}`, startLine, startColumn, start);
        }
        break;
    }
  }

  private advance(): string {
    const char = this.source.charAt(this.position);
    this.position++;
    this.column++;
    return char;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.position) !== expected) return false;
    
    this.position++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.position);
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.position + 1);
  }

  private scanString(quote: string, start: number, startLine: number, startColumn: number): void {
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.addError('Unterminated string', startLine, startColumn, start);
      return;
    }

    // Consume closing quote
    this.advance();

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.STRING, value, start, startLine, startColumn);
  }

  private scanNumber(start: number, startLine: number, startColumn: number): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the '.'
      this.advance();
      
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.NUMBER, value, start, startLine, startColumn);
  }

  private scanIdentifier(start: number, startLine: number, startColumn: number): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    const type = this.getIdentifierType(value);
    this.addToken(type, value, start, startLine, startColumn);
  }

  private scanSingleLineComment(start: number, startLine: number, startColumn: number): void {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.COMMENT, value, start, startLine, startColumn);
  }

  private scanMultiLineComment(start: number, startLine: number, startColumn: number): void {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        // Consume '*/'
        this.advance();
        this.advance();
        break;
      }
      
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.COMMENT, value, start, startLine, startColumn);
  }

  private getIdentifierType(text: string): TokenType {
    if (DartLexer.KEYWORDS.has(text)) {
      switch (text) {
        case 'class': return TokenType.CLASS;
        case 'const': return TokenType.CONST;
        case 'final': return TokenType.FINAL;
        case 'var': return TokenType.VAR;
        case 'new': return TokenType.NEW;
        case 'this': return TokenType.THIS;
        case 'super': return TokenType.SUPER;
        case 'null': return TokenType.NULL;
        case 'true': return TokenType.TRUE;
        case 'false': return TokenType.FALSE;
        default: return TokenType.IDENTIFIER;
      }
    }
    return TokenType.IDENTIFIER;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_' || char === '$';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private addToken(type: TokenType, value: string, start?: number, line?: number, column?: number): void {
    this.tokens.push({
      type,
      value,
      line: line || this.line,
      column: column || this.column,
      start: start || this.position - value.length,
      end: this.position
    });
  }

  private addError(message: string, line: number, column: number, position: number): void {
    this.errors.push({
      message,
      line,
      column,
      position
    });
  }
}

/**
 * Parse result containing parsed data and errors
 */
export interface ParseResult {
  success: boolean;
  errors: ParseError[];
  warnings: string[];
}

/**
 * Parse error information
 */
export interface ParseError {
  message: string;
  line: number;
  column: number;
  position: number;
  type: 'syntax' | 'semantic' | 'lexical';
}

/**
 * Validation result for syntax checking
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ParseError[];
  warnings: string[];
}

/**
 * AST Node types for representing parsed Dart code
 */
export enum ASTNodeType {
  PROGRAM = 'PROGRAM',
  CONSTRUCTOR_CALL = 'CONSTRUCTOR_CALL',
  IDENTIFIER = 'IDENTIFIER',
  LITERAL = 'LITERAL',
  PROPERTY_ACCESS = 'PROPERTY_ACCESS',
  METHOD_CALL = 'METHOD_CALL',
  ARGUMENT_LIST = 'ARGUMENT_LIST',
  NAMED_ARGUMENT = 'NAMED_ARGUMENT',
  POSITIONAL_ARGUMENT = 'POSITIONAL_ARGUMENT',
  ARRAY_LITERAL = 'ARRAY_LITERAL',
  EXPRESSION = 'EXPRESSION'
}

/**
 * Base AST Node interface
 */
export interface ASTNode {
  type: ASTNodeType;
  line: number;
  column: number;
  start: number;
  end: number;
}

/**
 * Program node - root of the AST
 */
export interface ProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM;
  body: ASTNode[];
}

/**
 * Constructor call node (e.g., Container(), Text("hello"))
 */
export interface ConstructorCallNode extends ASTNode {
  type: ASTNodeType.CONSTRUCTOR_CALL;
  name: string;
  arguments: ArgumentListNode;
}

/**
 * Identifier node (variable names, class names, etc.)
 */
export interface IdentifierNode extends ASTNode {
  type: ASTNodeType.IDENTIFIER;
  name: string;
}

/**
 * Literal node (strings, numbers, booleans, null)
 */
export interface LiteralNode extends ASTNode {
  type: ASTNodeType.LITERAL;
  value: string | number | boolean | null;
  raw: string;
}

/**
 * Property access node (e.g., Theme.of(context).primaryColor)
 */
export interface PropertyAccessNode extends ASTNode {
  type: ASTNodeType.PROPERTY_ACCESS;
  object: ASTNode;
  property: IdentifierNode;
}

/**
 * Method call node (e.g., Theme.of(context))
 */
export interface MethodCallNode extends ASTNode {
  type: ASTNodeType.METHOD_CALL;
  object: ASTNode;
  method: IdentifierNode;
  arguments: ArgumentListNode;
}

/**
 * Argument list node
 */
export interface ArgumentListNode extends ASTNode {
  type: ASTNodeType.ARGUMENT_LIST;
  arguments: (NamedArgumentNode | PositionalArgumentNode)[];
}

/**
 * Named argument node (e.g., width: 100)
 */
export interface NamedArgumentNode extends ASTNode {
  type: ASTNodeType.NAMED_ARGUMENT;
  name: string;
  value: ASTNode;
}

/**
 * Positional argument node
 */
export interface PositionalArgumentNode extends ASTNode {
  type: ASTNodeType.POSITIONAL_ARGUMENT;
  value: ASTNode;
}

/**
 * Array literal node (e.g., [Text("a"), Text("b")])
 */
export interface ArrayLiteralNode extends ASTNode {
  type: ASTNodeType.ARRAY_LITERAL;
  elements: ASTNode[];
}

/**
 * Expression node - wrapper for complex expressions
 */
export interface ExpressionNode extends ASTNode {
  type: ASTNodeType.EXPRESSION;
  expression: ASTNode;
}

/**
 * Enhanced parse result with AST
 */
export interface EnhancedParseResult extends ParseResult {
  ast?: ProgramNode;
}

/**
 * AST Parser for building Abstract Syntax Tree from tokens
 */
export class ASTParser {
  private tokens: Token[];
  private current: number = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(token => 
      token.type !== TokenType.WHITESPACE && 
      token.type !== TokenType.COMMENT
    );
    this.current = 0;
    this.errors = [];
  }

  /**
   * Parse tokens into AST
   */
  parse(): { ast: ProgramNode | null; errors: ParseError[] } {
    try {
      const body: ASTNode[] = [];
      
      while (!this.isAtEnd()) {
        // Skip newlines at the top level
        if (this.peek().type === TokenType.NEWLINE) {
          this.advance();
          continue;
        }
        
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
        
        // Skip any trailing newlines after a statement
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      }

      const program: ProgramNode = {
        type: ASTNodeType.PROGRAM,
        body,
        line: 1,
        column: 1,
        start: 0,
        end: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].end : 0
      };

      return { ast: program, errors: this.errors };
    } catch (error) {
      this.addError(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { ast: null, errors: this.errors };
    }
  }

  private parseStatement(): ASTNode | null {
    try {
      return this.parseExpression();
    } catch (error) {
      // Add error for parsing errors that aren't from consume()
      if (error instanceof Error && !error.message.startsWith('CONSUME_ERROR:')) {
        this.addError(error.message);
      }
      this.synchronize();
      return null;
    }
  }

  private parseExpression(): ASTNode {
    return this.parseConstructorCall();
  }

  private parseConstructorCall(): ASTNode {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.check(TokenType.LEFT_PAREN)) {
        // This is a constructor call or method call
        if (expr.type === ASTNodeType.IDENTIFIER) {
          expr = this.finishConstructorCall(expr as IdentifierNode);
        } else if (expr.type === ASTNodeType.PROPERTY_ACCESS) {
          expr = this.finishMethodCall(expr);
        } else {
          break;
        }
      } else if (this.check(TokenType.DOT)) {
        // Continue property access chain
        this.advance(); // consume '.'
        if (this.check(TokenType.IDENTIFIER)) {
          const property = this.advance();
          const propertyNode = this.createIdentifier(property);
          
          expr = {
            type: ASTNodeType.PROPERTY_ACCESS,
            object: expr,
            property: propertyNode,
            line: expr.line,
            column: expr.column,
            start: expr.start,
            end: property.end
          } as PropertyAccessNode;
        } else {
          throw new Error("Expected property name after '.'");
        }
      } else {
        break;
      }
    }
    
    return expr;
  }

  private finishConstructorCall(name: IdentifierNode): ConstructorCallNode {
    const leftParen = this.consume(TokenType.LEFT_PAREN, "Expected '(' after constructor name");
    const args = this.parseArgumentList();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");

    return {
      type: ASTNodeType.CONSTRUCTOR_CALL,
      name: name.name,
      arguments: args,
      line: name.line,
      column: name.column,
      start: name.start,
      end: this.previous().end
    };
  }

  private finishMethodCall(object: ASTNode): MethodCallNode {
    // Extract method name from property access
    let method: IdentifierNode;
    if (object.type === ASTNodeType.PROPERTY_ACCESS) {
      method = (object as PropertyAccessNode).property;
      object = (object as PropertyAccessNode).object;
    } else {
      throw new Error('Invalid method call structure');
    }

    const leftParen = this.consume(TokenType.LEFT_PAREN, "Expected '(' after method name");
    const args = this.parseArgumentList();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");

    return {
      type: ASTNodeType.METHOD_CALL,
      object,
      method,
      arguments: args,
      line: object.line,
      column: object.column,
      start: object.start,
      end: this.previous().end
    };
  }

  private parseArgumentList(): ArgumentListNode {
    const start = this.peek();
    const args: (NamedArgumentNode | PositionalArgumentNode)[] = [];

    // Skip leading newlines
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        // Skip newlines before arguments
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
        
        // Allow trailing comma by checking if we're at the end
        if (this.check(TokenType.RIGHT_PAREN)) {
          break;
        }
        
        const arg = this.parseArgument();
        if (arg) {
          args.push(arg);
        }
        
        // Skip newlines after arguments
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      } while (this.match(TokenType.COMMA));
    }

    // Skip trailing newlines
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }

    return {
      type: ASTNodeType.ARGUMENT_LIST,
      arguments: args,
      line: start.line,
      column: start.column,
      start: start.start,
      end: this.peek().start
    };
  }

  private parseArgument(): NamedArgumentNode | PositionalArgumentNode | null {
    // Skip any leading newlines
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
    
    const start = this.peek();
    
    // Check if this is a named argument (identifier followed by colon)
    if (this.check(TokenType.IDENTIFIER) && this.checkNext(TokenType.COLON)) {
      const name = this.advance().value;
      this.consume(TokenType.COLON, "Expected ':' after parameter name");
      
      // Skip newlines after colon
      while (this.check(TokenType.NEWLINE)) {
        this.advance();
      }
      
      const value = this.parseExpression();
      
      return {
        type: ASTNodeType.NAMED_ARGUMENT,
        name,
        value,
        line: start.line,
        column: start.column,
        start: start.start,
        end: value.end
      };
    } else {
      // Positional argument
      const value = this.parseExpression();
      
      return {
        type: ASTNodeType.POSITIONAL_ARGUMENT,
        value,
        line: start.line,
        column: start.column,
        start: start.start,
        end: value.end
      };
    }
  }

  private parsePrimary(): ASTNode {
    if (this.match(TokenType.TRUE)) {
      const token = this.previous();
      return this.createLiteral(true, token);
    }

    if (this.match(TokenType.FALSE)) {
      const token = this.previous();
      return this.createLiteral(false, token);
    }

    if (this.match(TokenType.NULL)) {
      const token = this.previous();
      return this.createLiteral(null, token);
    }

    if (this.match(TokenType.NUMBER)) {
      const token = this.previous();
      const value = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value);
      return this.createLiteral(value, token);
    }

    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      // Remove quotes from string value
      const value = token.value.slice(1, -1);
      return this.createLiteral(value, token);
    }

    if (this.match(TokenType.LEFT_BRACKET)) {
      return this.parseArrayLiteral();
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      return this.createIdentifier(token);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  private parseArrayLiteral(): ArrayLiteralNode {
    const start = this.previous();
    const elements: ASTNode[] = [];

    // Skip leading newlines
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }

    if (!this.check(TokenType.RIGHT_BRACKET)) {
      do {
        // Skip newlines before elements
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
        
        // Allow trailing comma by checking if we're at the end
        if (this.check(TokenType.RIGHT_BRACKET)) {
          break;
        }
        
        elements.push(this.parseExpression());
        
        // Skip newlines after elements
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      } while (this.match(TokenType.COMMA));
    }

    // Skip trailing newlines
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }

    this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements");

    return {
      type: ASTNodeType.ARRAY_LITERAL,
      elements,
      line: start.line,
      column: start.column,
      start: start.start,
      end: this.previous().end
    };
  }

  private createLiteral(value: string | number | boolean | null, token: Token): LiteralNode {
    return {
      type: ASTNodeType.LITERAL,
      value,
      raw: token.value,
      line: token.line,
      column: token.column,
      start: token.start,
      end: token.end
    };
  }

  private createIdentifier(token: Token): IdentifierNode {
    return {
      type: ASTNodeType.IDENTIFIER,
      name: token.value,
      line: token.line,
      column: token.column,
      start: token.start,
      end: token.end
    };
  }

  // Utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    if (this.tokens[this.current + 1].type === TokenType.EOF) return false;
    return this.tokens[this.current + 1].type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const current = this.peek();
    this.addError(`${message}. Got '${current.value}' at line ${current.line}, column ${current.column}`);
    throw new Error(`CONSUME_ERROR: ${message}`);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.VAR:
        case TokenType.FINAL:
        case TokenType.CONST:
          return;
      }

      this.advance();
    }
  }

  private addError(message: string): void {
    const current = this.peek();
    this.errors.push({
      message,
      line: current.line,
      column: current.column,
      position: current.start,
      type: 'syntax'
    });
  }
}

/**
 * Main Dart parser class
 */
export class DartParser {
  private lexer: DartLexer;

  constructor() {
    this.lexer = new DartLexer('');
  }

  /**
   * Parse Dart source code into AST
   */
  parseFile(content: string): EnhancedParseResult {
    this.lexer = new DartLexer(content);
    const lexerResult = this.lexer.tokenize();

    const errors: ParseError[] = lexerResult.errors.map(error => ({
      message: error.message,
      line: error.line,
      column: error.column,
      position: error.position,
      type: 'lexical' as const
    }));

    // If there are lexical errors, return early
    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings: []
      };
    }

    // Parse tokens into AST
    const astParser = new ASTParser(lexerResult.tokens);
    const parseResult = astParser.parse();

    errors.push(...parseResult.errors);

    return {
      success: errors.length === 0,
      errors,
      warnings: [],
      ast: parseResult.ast || undefined
    };
  }

  /**
   * Parse expressions from source code
   */
  parseExpressions(content: string): ASTNode[] {
    const result = this.parseFile(content);
    if (result.ast) {
      return result.ast.body;
    }
    return [];
  }

  /**
   * Validate Dart syntax
   */
  validateSyntax(content: string): ValidationResult {
    const parseResult = this.parseFile(content);
    
    return {
      isValid: parseResult.success,
      errors: parseResult.errors,
      warnings: parseResult.warnings
    };
  }

  /**
   * Get tokens from source code
   */
  getTokens(content: string): Token[] {
    this.lexer = new DartLexer(content);
    const result = this.lexer.tokenize();
    return result.tokens;
  }

  /**
   * Extract widgets from source code
   */
  extractWidgets(content: string): import('./widget-extractor').WidgetExtractionResult {
    const parseResult = this.parseFile(content);
    
    if (!parseResult.success || !parseResult.ast) {
      return {
        widgets: [],
        errors: parseResult.errors.map(e => e.message),
        warnings: []
      };
    }

    const { WidgetExtractor } = require('./widget-extractor');
    const extractor = new WidgetExtractor();
    return extractor.extractWidgets(parseResult.ast.body);
  }
}
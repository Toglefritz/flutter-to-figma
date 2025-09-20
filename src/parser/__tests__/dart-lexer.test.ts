import { DartLexer, TokenType, Token } from '../dart-parser';

describe('DartLexer', () => {
  let lexer: DartLexer;

  beforeEach(() => {
    lexer = new DartLexer('');
  });

  describe('Basic Tokenization', () => {
    it('should tokenize simple identifiers', () => {
      lexer = new DartLexer('Container widget');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(3); // Container, widget, EOF
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.IDENTIFIER,
        value: 'Container',
        line: 1,
        column: 1
      });
      expect(result.tokens[1]).toMatchObject({
        type: TokenType.IDENTIFIER,
        value: 'widget',
        line: 1,
        column: 11
      });
    });

    it('should tokenize keywords correctly', () => {
      lexer = new DartLexer('class const final var new this super null true false');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      const expectedTypes = [
        TokenType.CLASS, TokenType.CONST, TokenType.FINAL, TokenType.VAR,
        TokenType.NEW, TokenType.THIS, TokenType.SUPER, TokenType.NULL,
        TokenType.TRUE, TokenType.FALSE, TokenType.EOF
      ];
      
      result.tokens.forEach((token, index) => {
        expect(token.type).toBe(expectedTypes[index]);
      });
    });

    it('should tokenize operators and delimiters', () => {
      lexer = new DartLexer('(){}[]<>,.;:+-*/=?');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      const expectedTypes = [
        TokenType.LEFT_PAREN, TokenType.RIGHT_PAREN,
        TokenType.LEFT_BRACE, TokenType.RIGHT_BRACE,
        TokenType.LEFT_BRACKET, TokenType.RIGHT_BRACKET,
        TokenType.LEFT_ANGLE, TokenType.RIGHT_ANGLE,
        TokenType.COMMA, TokenType.DOT, TokenType.SEMICOLON, TokenType.COLON,
        TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE,
        TokenType.ASSIGN, TokenType.QUESTION, TokenType.EOF
      ];
      
      result.tokens.forEach((token, index) => {
        expect(token.type).toBe(expectedTypes[index]);
      });
    });
  });

  describe('String Literals', () => {
    it('should tokenize double-quoted strings', () => {
      lexer = new DartLexer('"Hello World"');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: '"Hello World"',
        line: 1,
        column: 1
      });
    });

    it('should tokenize single-quoted strings', () => {
      lexer = new DartLexer("'Flutter Widget'");
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: "'Flutter Widget'",
        line: 1,
        column: 1
      });
    });

    it('should handle unterminated strings', () => {
      lexer = new DartLexer('"Unterminated string');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Unterminated string');
    });

    it('should handle multi-line strings', () => {
      lexer = new DartLexer('"Multi\nline\nstring"');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: '"Multi\nline\nstring"'
      });
    });
  });

  describe('Number Literals', () => {
    it('should tokenize integers', () => {
      lexer = new DartLexer('123 456 0');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.NUMBER,
        value: '123'
      });
      expect(result.tokens[1]).toMatchObject({
        type: TokenType.NUMBER,
        value: '456'
      });
      expect(result.tokens[2]).toMatchObject({
        type: TokenType.NUMBER,
        value: '0'
      });
    });

    it('should tokenize decimal numbers', () => {
      lexer = new DartLexer('3.14 0.5 100.0');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.NUMBER,
        value: '3.14'
      });
      expect(result.tokens[1]).toMatchObject({
        type: TokenType.NUMBER,
        value: '0.5'
      });
      expect(result.tokens[2]).toMatchObject({
        type: TokenType.NUMBER,
        value: '100.0'
      });
    });
  });

  describe('Comments', () => {
    it('should tokenize single-line comments', () => {
      lexer = new DartLexer('// This is a comment\nContainer()');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.COMMENT,
        value: '// This is a comment'
      });
      expect(result.tokens[1]).toMatchObject({
        type: TokenType.NEWLINE,
        value: '\n'
      });
      expect(result.tokens[2]).toMatchObject({
        type: TokenType.IDENTIFIER,
        value: 'Container'
      });
    });

    it('should tokenize multi-line comments', () => {
      lexer = new DartLexer('/* Multi\nline\ncomment */ Container()');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.COMMENT,
        value: '/* Multi\nline\ncomment */'
      });
      expect(result.tokens[1]).toMatchObject({
        type: TokenType.IDENTIFIER,
        value: 'Container'
      });
    });
  });

  describe('Flutter Widget Syntax', () => {
    it('should tokenize Container widget constructor', () => {
      const code = 'Container(width: 100, height: 200, child: Text("Hello"))';
      lexer = new DartLexer(code);
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      
      const expectedTokens = [
        { type: TokenType.IDENTIFIER, value: 'Container' },
        { type: TokenType.LEFT_PAREN, value: '(' },
        { type: TokenType.IDENTIFIER, value: 'width' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.NUMBER, value: '100' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.IDENTIFIER, value: 'height' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.NUMBER, value: '200' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.IDENTIFIER, value: 'child' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.IDENTIFIER, value: 'Text' },
        { type: TokenType.LEFT_PAREN, value: '(' },
        { type: TokenType.STRING, value: '"Hello"' },
        { type: TokenType.RIGHT_PAREN, value: ')' },
        { type: TokenType.RIGHT_PAREN, value: ')' },
        { type: TokenType.EOF, value: '' }
      ];
      
      expectedTokens.forEach((expected, index) => {
        expect(result.tokens[index]).toMatchObject(expected);
      });
    });

    it('should tokenize Row widget with children array', () => {
      const code = 'Row(children: [Text("First"), Text("Second")])';
      lexer = new DartLexer(code);
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      
      const expectedTokens = [
        { type: TokenType.IDENTIFIER, value: 'Row' },
        { type: TokenType.LEFT_PAREN, value: '(' },
        { type: TokenType.IDENTIFIER, value: 'children' },
        { type: TokenType.COLON, value: ':' },
        { type: TokenType.LEFT_BRACKET, value: '[' },
        { type: TokenType.IDENTIFIER, value: 'Text' },
        { type: TokenType.LEFT_PAREN, value: '(' },
        { type: TokenType.STRING, value: '"First"' },
        { type: TokenType.RIGHT_PAREN, value: ')' },
        { type: TokenType.COMMA, value: ',' },
        { type: TokenType.IDENTIFIER, value: 'Text' },
        { type: TokenType.LEFT_PAREN, value: '(' },
        { type: TokenType.STRING, value: '"Second"' },
        { type: TokenType.RIGHT_PAREN, value: ')' },
        { type: TokenType.RIGHT_BRACKET, value: ']' },
        { type: TokenType.RIGHT_PAREN, value: ')' },
        { type: TokenType.EOF, value: '' }
      ];
      
      expectedTokens.forEach((expected, index) => {
        expect(result.tokens[index]).toMatchObject(expected);
      });
    });

    it('should tokenize Column widget with nested widgets', () => {
      const code = `Column(
        children: [
          Container(child: Text("Title")),
          Row(children: [Text("Left"), Text("Right")])
        ]
      )`;
      lexer = new DartLexer(code);
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      
      // Check key tokens are present
      const tokenValues = result.tokens.map(t => t.value);
      expect(tokenValues).toContain('Column');
      expect(tokenValues).toContain('Container');
      expect(tokenValues).toContain('Row');
      expect(tokenValues).toContain('Text');
      expect(tokenValues).toContain('"Title"');
      expect(tokenValues).toContain('"Left"');
      expect(tokenValues).toContain('"Right"');
    });

    it('should handle theme references', () => {
      const code = 'Theme.of(context).primaryColor';
      lexer = new DartLexer(code);
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      
      const expectedTokens = [
        { type: TokenType.IDENTIFIER, value: 'Theme' },
        { type: TokenType.DOT, value: '.' },
        { type: TokenType.IDENTIFIER, value: 'of' },
        { type: TokenType.LEFT_PAREN, value: '(' },
        { type: TokenType.IDENTIFIER, value: 'context' },
        { type: TokenType.RIGHT_PAREN, value: ')' },
        { type: TokenType.DOT, value: '.' },
        { type: TokenType.IDENTIFIER, value: 'primaryColor' },
        { type: TokenType.EOF, value: '' }
      ];
      
      expectedTokens.forEach((expected, index) => {
        expect(result.tokens[index]).toMatchObject(expected);
      });
    });
  });

  describe('Line and Column Tracking', () => {
    it('should track line numbers correctly', () => {
      const code = `Container(
        width: 100,
        height: 200
      )`;
      lexer = new DartLexer(code);
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      
      // Find tokens on different lines
      const containerToken = result.tokens.find(t => t.value === 'Container');
      const widthToken = result.tokens.find(t => t.value === 'width');
      const heightToken = result.tokens.find(t => t.value === 'height');
      
      expect(containerToken?.line).toBe(1);
      expect(widthToken?.line).toBe(2);
      expect(heightToken?.line).toBe(3);
    });

    it('should track column positions correctly', () => {
      const code = 'Container(width: 100)';
      lexer = new DartLexer(code);
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(0);
      
      expect(result.tokens[0]).toMatchObject({
        type: TokenType.IDENTIFIER,
        value: 'Container',
        line: 1,
        column: 1
      });
      
      expect(result.tokens[2]).toMatchObject({
        type: TokenType.IDENTIFIER,
        value: 'width',
        line: 1,
        column: 11
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected characters', () => {
      lexer = new DartLexer('Container @ widget');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Unexpected character: @');
      expect(result.errors[0].line).toBe(1);
      expect(result.errors[0].column).toBe(11);
    });

    it('should continue parsing after errors', () => {
      lexer = new DartLexer('Container @ Text("Hello")');
      const result = lexer.tokenize();
      
      expect(result.errors).toHaveLength(1);
      expect(result.tokens.length).toBeGreaterThan(1);
      
      // Should still tokenize valid parts
      const tokenValues = result.tokens.map(t => t.value);
      expect(tokenValues).toContain('Container');
      expect(tokenValues).toContain('Text');
      expect(tokenValues).toContain('"Hello"');
    });
  });
});
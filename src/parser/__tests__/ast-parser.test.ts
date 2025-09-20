import { 
  DartParser, 
  ASTParser, 
  ASTNodeType, 
  ConstructorCallNode, 
  IdentifierNode, 
  LiteralNode,
  PropertyAccessNode,
  MethodCallNode,
  NamedArgumentNode,
  PositionalArgumentNode,
  ArrayLiteralNode,
  DartLexer
} from '../dart-parser';

describe('ASTParser', () => {
  let parser: DartParser;

  beforeEach(() => {
    parser = new DartParser();
  });

  describe('Basic Expression Parsing', () => {
    it('should parse simple identifiers', () => {
      const result = parser.parseFile('Container');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.ast!.body).toHaveLength(1);
      
      const node = result.ast!.body[0] as IdentifierNode;
      expect(node.type).toBe(ASTNodeType.IDENTIFIER);
      expect(node.name).toBe('Container');
    });

    it('should parse string literals', () => {
      const result = parser.parseFile('"Hello World"');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as LiteralNode;
      expect(node.type).toBe(ASTNodeType.LITERAL);
      expect(node.value).toBe('Hello World');
      expect(node.raw).toBe('"Hello World"');
    });

    it('should parse number literals', () => {
      const result = parser.parseFile('123');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as LiteralNode;
      expect(node.type).toBe(ASTNodeType.LITERAL);
      expect(node.value).toBe(123);
      expect(node.raw).toBe('123');
    });

    it('should parse decimal numbers', () => {
      const result = parser.parseFile('3.14');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as LiteralNode;
      expect(node.type).toBe(ASTNodeType.LITERAL);
      expect(node.value).toBe(3.14);
      expect(node.raw).toBe('3.14');
    });

    it('should parse boolean literals', () => {
      const result = parser.parseFile('true');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as LiteralNode;
      expect(node.type).toBe(ASTNodeType.LITERAL);
      expect(node.value).toBe(true);
      expect(node.raw).toBe('true');
    });

    it('should parse null literal', () => {
      const result = parser.parseFile('null');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as LiteralNode;
      expect(node.type).toBe(ASTNodeType.LITERAL);
      expect(node.value).toBe(null);
      expect(node.raw).toBe('null');
    });
  });

  describe('Constructor Call Parsing', () => {
    it('should parse simple constructor call without arguments', () => {
      const result = parser.parseFile('Container()');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ConstructorCallNode;
      expect(node.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(node.name).toBe('Container');
      expect(node.arguments.arguments).toHaveLength(0);
    });

    it('should parse constructor call with positional arguments', () => {
      const result = parser.parseFile('Text("Hello")');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ConstructorCallNode;
      expect(node.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(node.name).toBe('Text');
      expect(node.arguments.arguments).toHaveLength(1);
      
      const arg = node.arguments.arguments[0] as PositionalArgumentNode;
      expect(arg.type).toBe(ASTNodeType.POSITIONAL_ARGUMENT);
      
      const value = arg.value as LiteralNode;
      expect(value.type).toBe(ASTNodeType.LITERAL);
      expect(value.value).toBe('Hello');
    });

    it('should parse constructor call with named arguments', () => {
      const result = parser.parseFile('Container(width: 100, height: 200)');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ConstructorCallNode;
      expect(node.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(node.name).toBe('Container');
      expect(node.arguments.arguments).toHaveLength(2);
      
      const widthArg = node.arguments.arguments[0] as NamedArgumentNode;
      expect(widthArg.type).toBe(ASTNodeType.NAMED_ARGUMENT);
      expect(widthArg.name).toBe('width');
      
      const widthValue = widthArg.value as LiteralNode;
      expect(widthValue.value).toBe(100);
      
      const heightArg = node.arguments.arguments[1] as NamedArgumentNode;
      expect(heightArg.type).toBe(ASTNodeType.NAMED_ARGUMENT);
      expect(heightArg.name).toBe('height');
      
      const heightValue = heightArg.value as LiteralNode;
      expect(heightValue.value).toBe(200);
    });

    it('should parse constructor call with mixed arguments', () => {
      const result = parser.parseFile('Padding("content", padding: 16.0)');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ConstructorCallNode;
      expect(node.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(node.name).toBe('Padding');
      expect(node.arguments.arguments).toHaveLength(2);
      
      const positionalArg = node.arguments.arguments[0] as PositionalArgumentNode;
      expect(positionalArg.type).toBe(ASTNodeType.POSITIONAL_ARGUMENT);
      
      const namedArg = node.arguments.arguments[1] as NamedArgumentNode;
      expect(namedArg.type).toBe(ASTNodeType.NAMED_ARGUMENT);
      expect(namedArg.name).toBe('padding');
    });
  });

  describe('Nested Constructor Calls', () => {
    it('should parse nested constructor calls', () => {
      const result = parser.parseFile('Container(child: Text("Hello"))');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const containerNode = result.ast!.body[0] as ConstructorCallNode;
      expect(containerNode.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(containerNode.name).toBe('Container');
      
      const childArg = containerNode.arguments.arguments[0] as NamedArgumentNode;
      expect(childArg.name).toBe('child');
      
      const textNode = childArg.value as ConstructorCallNode;
      expect(textNode.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(textNode.name).toBe('Text');
      
      const textArg = textNode.arguments.arguments[0] as PositionalArgumentNode;
      const textValue = textArg.value as LiteralNode;
      expect(textValue.value).toBe('Hello');
    });

    it('should parse deeply nested constructor calls', () => {
      const result = parser.parseFile('Container(child: Padding(padding: 8.0, child: Text("Nested")))');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const containerNode = result.ast!.body[0] as ConstructorCallNode;
      expect(containerNode.name).toBe('Container');
      
      const childArg = containerNode.arguments.arguments[0] as NamedArgumentNode;
      const paddingNode = childArg.value as ConstructorCallNode;
      expect(paddingNode.name).toBe('Padding');
      
      const paddingChildArg = paddingNode.arguments.arguments[1] as NamedArgumentNode;
      const textNode = paddingChildArg.value as ConstructorCallNode;
      expect(textNode.name).toBe('Text');
    });
  });

  describe('Array Literal Parsing', () => {
    it('should parse empty array', () => {
      const result = parser.parseFile('[]');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ArrayLiteralNode;
      expect(node.type).toBe(ASTNodeType.ARRAY_LITERAL);
      expect(node.elements).toHaveLength(0);
    });

    it('should parse array with literals', () => {
      const result = parser.parseFile('[1, 2, "three"]');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ArrayLiteralNode;
      expect(node.type).toBe(ASTNodeType.ARRAY_LITERAL);
      expect(node.elements).toHaveLength(3);
      
      const first = node.elements[0] as LiteralNode;
      expect(first.value).toBe(1);
      
      const second = node.elements[1] as LiteralNode;
      expect(second.value).toBe(2);
      
      const third = node.elements[2] as LiteralNode;
      expect(third.value).toBe('three');
    });

    it('should parse array with constructor calls', () => {
      const result = parser.parseFile('[Text("First"), Text("Second")]');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as ArrayLiteralNode;
      expect(node.type).toBe(ASTNodeType.ARRAY_LITERAL);
      expect(node.elements).toHaveLength(2);
      
      const first = node.elements[0] as ConstructorCallNode;
      expect(first.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(first.name).toBe('Text');
      
      const second = node.elements[1] as ConstructorCallNode;
      expect(second.type).toBe(ASTNodeType.CONSTRUCTOR_CALL);
      expect(second.name).toBe('Text');
    });
  });

  describe('Property Access Parsing', () => {
    it('should parse simple property access', () => {
      const result = parser.parseFile('Colors.blue');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as PropertyAccessNode;
      expect(node.type).toBe(ASTNodeType.PROPERTY_ACCESS);
      
      const object = node.object as IdentifierNode;
      expect(object.type).toBe(ASTNodeType.IDENTIFIER);
      expect(object.name).toBe('Colors');
      
      expect(node.property.name).toBe('blue');
    });

    it('should parse chained property access', () => {
      const result = parser.parseFile('Theme.of(context).primaryColor');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as PropertyAccessNode;
      expect(node.type).toBe(ASTNodeType.PROPERTY_ACCESS);
      expect(node.property.name).toBe('primaryColor');
      
      const methodCall = node.object as MethodCallNode;
      expect(methodCall.type).toBe(ASTNodeType.METHOD_CALL);
      expect(methodCall.method.name).toBe('of');
      
      const themeObject = methodCall.object as IdentifierNode;
      expect(themeObject.name).toBe('Theme');
    });
  });

  describe('Method Call Parsing', () => {
    it('should parse method call with arguments', () => {
      const result = parser.parseFile('Theme.of(context)');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const node = result.ast!.body[0] as MethodCallNode;
      expect(node.type).toBe(ASTNodeType.METHOD_CALL);
      expect(node.method.name).toBe('of');
      
      const object = node.object as IdentifierNode;
      expect(object.name).toBe('Theme');
      
      expect(node.arguments.arguments).toHaveLength(1);
      const arg = node.arguments.arguments[0] as PositionalArgumentNode;
      const argValue = arg.value as IdentifierNode;
      expect(argValue.name).toBe('context');
    });
  });

  describe('Flutter Widget Patterns', () => {
    it('should parse Row widget with children array', () => {
      const result = parser.parseFile('Row(children: [Text("Left"), Text("Right")])');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const rowNode = result.ast!.body[0] as ConstructorCallNode;
      expect(rowNode.name).toBe('Row');
      
      const childrenArg = rowNode.arguments.arguments[0] as NamedArgumentNode;
      expect(childrenArg.name).toBe('children');
      
      const childrenArray = childrenArg.value as ArrayLiteralNode;
      expect(childrenArray.type).toBe(ASTNodeType.ARRAY_LITERAL);
      expect(childrenArray.elements).toHaveLength(2);
      
      const firstChild = childrenArray.elements[0] as ConstructorCallNode;
      expect(firstChild.name).toBe('Text');
      
      const secondChild = childrenArray.elements[1] as ConstructorCallNode;
      expect(secondChild.name).toBe('Text');
    });

    it('should parse Column widget with multiple children', () => {
      const code = `Column(
        children: [
          Text("Title"),
          Container(height: 20),
          Row(children: [Text("A"), Text("B")])
        ]
      )`;
      
      const result = parser.parseFile(code);
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const columnNode = result.ast!.body[0] as ConstructorCallNode;
      expect(columnNode.name).toBe('Column');
      
      const childrenArg = columnNode.arguments.arguments[0] as NamedArgumentNode;
      const childrenArray = childrenArg.value as ArrayLiteralNode;
      expect(childrenArray.elements).toHaveLength(3);
      
      // Check nested Row
      const rowChild = childrenArray.elements[2] as ConstructorCallNode;
      expect(rowChild.name).toBe('Row');
    });

    it('should parse Container with decoration', () => {
      const result = parser.parseFile('Container(width: 100, height: 100, color: Colors.blue)');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const containerNode = result.ast!.body[0] as ConstructorCallNode;
      expect(containerNode.name).toBe('Container');
      expect(containerNode.arguments.arguments).toHaveLength(3);
      
      const colorArg = containerNode.arguments.arguments[2] as NamedArgumentNode;
      expect(colorArg.name).toBe('color');
      
      const colorValue = colorArg.value as PropertyAccessNode;
      expect(colorValue.type).toBe(ASTNodeType.PROPERTY_ACCESS);
      
      const colorsObject = colorValue.object as IdentifierNode;
      expect(colorsObject.name).toBe('Colors');
      expect(colorValue.property.name).toBe('blue');
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', () => {
      const result = parser.parseFile('Container(width: 100,)'); // trailing comma
      
      // Should still parse successfully as trailing commas are valid in Dart
      expect(result.success).toBe(true);
    });

    it('should handle missing closing parenthesis', () => {
      const result = parser.parseFile('Container(width: 100');
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
    });

    it('should handle invalid property access', () => {
      const result = parser.parseFile('Container.');
      

      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle unterminated array', () => {
      const result = parser.parseFile('[Text("Hello"), Text("World"');
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Complex Flutter Patterns', () => {
    it('should parse theme references in widget properties', () => {
      const result = parser.parseFile('Text("Hello", style: Theme.of(context).textTheme.headline1)');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const textNode = result.ast!.body[0] as ConstructorCallNode;
      expect(textNode.name).toBe('Text');
      
      const styleArg = textNode.arguments.arguments[1] as NamedArgumentNode;
      expect(styleArg.name).toBe('style');
      
      const themeRef = styleArg.value as PropertyAccessNode;
      expect(themeRef.property.name).toBe('headline1');
    });

    it('should parse Scaffold with AppBar and body', () => {
      const code = `Scaffold(
        appBar: AppBar(title: Text("Title")),
        body: Column(children: [Text("Content")])
      )`;
      
      const result = parser.parseFile(code);
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      
      const scaffoldNode = result.ast!.body[0] as ConstructorCallNode;
      expect(scaffoldNode.name).toBe('Scaffold');
      expect(scaffoldNode.arguments.arguments).toHaveLength(2);
      
      const appBarArg = scaffoldNode.arguments.arguments[0] as NamedArgumentNode;
      expect(appBarArg.name).toBe('appBar');
      
      const appBarNode = appBarArg.value as ConstructorCallNode;
      expect(appBarNode.name).toBe('AppBar');
    });
  });
});
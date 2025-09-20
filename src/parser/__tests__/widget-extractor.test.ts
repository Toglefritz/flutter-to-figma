import { DartParser } from '../dart-parser';
import { WidgetExtractor } from '../widget-extractor';
import { WidgetType } from '../../schema/types';

describe('WidgetExtractor', () => {
  let parser: DartParser;
  let extractor: WidgetExtractor;

  beforeEach(() => {
    parser = new DartParser();
    extractor = new WidgetExtractor();
  });

  describe('Basic Widget Detection', () => {
    it('should detect Container widget', () => {
      const result = parser.extractWidgets('Container()');
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.CONTAINER);
      expect(result.widgets[0].id).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should detect Text widget with content', () => {
      const result = parser.extractWidgets('Text("Hello World")');
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.TEXT);
      expect(result.widgets[0].properties.text).toBe('Hello World');
    });

    it('should detect Row widget', () => {
      const result = parser.extractWidgets('Row()');
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.ROW);
      expect(result.widgets[0].layout?.type).toBe('row');
      expect(result.widgets[0].layout?.direction).toBe('horizontal');
    });

    it('should detect Column widget', () => {
      const result = parser.extractWidgets('Column()');
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.COLUMN);
      expect(result.widgets[0].layout?.type).toBe('column');
      expect(result.widgets[0].layout?.direction).toBe('vertical');
    });

    it('should detect Stack widget', () => {
      const result = parser.extractWidgets('Stack()');
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.STACK);
      expect(result.widgets[0].layout?.type).toBe('stack');
    });
  });

  describe('Widget Properties Extraction', () => {
    it('should extract Container properties', () => {
      const code = 'Container(width: 100, height: 200, color: Colors.blue)';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const widget = result.widgets[0];
      
      expect(widget.properties.width).toBe(100);
      expect(widget.properties.height).toBe(200);
      expect(widget.styling.colors).toHaveLength(1);
      expect(widget.styling.colors[0].property).toBe('color');
      expect(widget.styling.colors[0].value).toBe('Colors.blue');
      expect(widget.styling.colors[0].isThemeReference).toBe(false);
    });

    it('should extract Text properties with style', () => {
      const code = 'Text("Hello", style: Theme.of(context).textTheme.headline1)';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const widget = result.widgets[0];
      
      expect(widget.properties.text).toBe('Hello');
      
      expect(widget.styling.typography).toBeDefined();
      expect(widget.styling.typography?.isThemeReference).toBe(true);
      expect(widget.styling.typography?.themePath).toBe('Theme.of(context).textTheme.headline1');
    });

    it('should extract theme color references', () => {
      const code = 'Container(color: Theme.of(context).primaryColor)';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const widget = result.widgets[0];
      
      expect(widget.styling.colors).toHaveLength(1);
      expect(widget.styling.colors[0].isThemeReference).toBe(true);
      expect(widget.styling.colors[0].themePath).toBe('Theme.of(context).primaryColor');
    });

    it('should extract multiple properties', () => {
      const code = `Container(
        width: 150,
        height: 100,
        padding: EdgeInsets.all(16),
        margin: EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(color: Colors.red)
      )`;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const widget = result.widgets[0];
      
      expect(widget.properties.width).toBe(150);
      expect(widget.properties.height).toBe(100);
      expect(widget.properties.padding).toBeDefined();
      expect(widget.properties.margin).toBeDefined();
      expect(widget.properties.decoration).toBeDefined();
    });
  });

  describe('Child Widget Extraction', () => {
    it('should extract single child widget', () => {
      const code = 'Container(child: Text("Child"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const container = result.widgets[0];
      
      expect(container.children).toHaveLength(1);
      expect(container.children[0].type).toBe(WidgetType.TEXT);
      expect(container.children[0].properties.text).toBe('Child');
    });

    it('should extract multiple children from array', () => {
      const code = 'Row(children: [Text("First"), Text("Second"), Container()])';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const row = result.widgets[0];
      
      expect(row.children).toHaveLength(3);
      expect(row.children[0].type).toBe(WidgetType.TEXT);
      expect(row.children[0].properties.text).toBe('First');
      expect(row.children[1].type).toBe(WidgetType.TEXT);
      expect(row.children[1].properties.text).toBe('Second');
      expect(row.children[2].type).toBe(WidgetType.CONTAINER);
    });

    it('should handle nested children', () => {
      const code = `Column(
        children: [
          Container(child: Text("Nested")),
          Row(children: [Text("A"), Text("B")])
        ]
      )`;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const column = result.widgets[0];
      
      expect(column.children).toHaveLength(2);
      
      // First child: Container with nested Text
      const container = column.children[0];
      expect(container.type).toBe(WidgetType.CONTAINER);
      expect(container.children).toHaveLength(1);
      expect(container.children[0].type).toBe(WidgetType.TEXT);
      expect(container.children[0].properties.text).toBe('Nested');
      
      // Second child: Row with two Text widgets
      const row = column.children[1];
      expect(row.type).toBe(WidgetType.ROW);
      expect(row.children).toHaveLength(2);
      expect(row.children[0].properties.text).toBe('A');
      expect(row.children[1].properties.text).toBe('B');
    });
  });

  describe('Layout Information Extraction', () => {
    it('should extract Row alignment properties', () => {
      const code = `Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: []
      )`;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const row = result.widgets[0];
      
      expect(row.layout?.alignment?.mainAxis).toBe('center');
      expect(row.layout?.alignment?.crossAxis).toBe('start');
    });

    it('should extract Column alignment properties', () => {
      const code = `Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: []
      )`;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const column = result.widgets[0];
      
      expect(column.layout?.alignment?.mainAxis).toBe('spaceBetween');
      expect(column.layout?.alignment?.crossAxis).toBe('stretch');
    });
  });

  describe('Button Widget Detection', () => {
    it('should detect ElevatedButton', () => {
      const code = 'ElevatedButton(onPressed: null, child: Text("Click"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.BUTTON);
      expect(result.widgets[0].children).toHaveLength(1);
      expect(result.widgets[0].children[0].type).toBe(WidgetType.TEXT);
    });

    it('should detect TextButton', () => {
      const code = 'TextButton(onPressed: null, child: Text("Cancel"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.BUTTON);
    });

    it('should detect OutlinedButton', () => {
      const code = 'OutlinedButton(onPressed: null, child: Text("Outline"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.BUTTON);
    });
  });

  describe('Material Design Widgets', () => {
    it('should detect Card widget', () => {
      const code = 'Card(child: Text("Card Content"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.CARD);
      expect(result.widgets[0].children).toHaveLength(1);
    });

    it('should detect Scaffold widget', () => {
      const code = `Scaffold(
        appBar: AppBar(title: Text("Title")),
        body: Container()
      )`;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.SCAFFOLD);
      expect(result.widgets[0].properties.appBar).toBeDefined();
      expect(result.widgets[0].properties.body).toBeDefined();
    });

    it('should detect AppBar widget', () => {
      const code = 'AppBar(title: Text("App Title"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.APP_BAR);
      expect(result.widgets[0].properties.title).toBeDefined();
    });
  });

  describe('Cupertino Widgets', () => {
    it('should detect CupertinoButton', () => {
      const code = 'CupertinoButton(onPressed: null, child: Text("iOS Button"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.CUPERTINO_BUTTON);
      expect(result.widgets[0].children).toHaveLength(1);
    });

    it('should detect CupertinoNavigationBar', () => {
      const code = 'CupertinoNavigationBar(middle: Text("iOS Nav"))';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.CUPERTINO_NAV_BAR);
      expect(result.widgets[0].properties.middle).toBeDefined();
    });
  });

  describe('Custom Widget Handling', () => {
    it('should handle unknown widget types', () => {
      const code = 'CustomWidget(customProperty: "value")';
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe(WidgetType.CUSTOM);
      expect(result.widgets[0].properties.customType).toBe('CustomWidget');
      expect(result.widgets[0].properties.customProperty).toBe('value');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unknown widget type: CustomWidget');
    });

    it('should handle widgets with complex properties', () => {
      const code = `MyCustomWidget(
        complexProperty: SomeClass(param: "value"),
        simpleProperty: 42
      )`;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const widget = result.widgets[0];
      
      expect(widget.type).toBe(WidgetType.CUSTOM);
      expect(widget.properties.customType).toBe('MyCustomWidget');
      expect(widget.properties.simpleProperty).toBe(42);
      expect(widget.properties.complexProperty).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', () => {
      const code = 'Container(width: 100,'; // Missing closing parenthesis
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should continue processing after encountering unknown widgets', () => {
      const code = `
        Container()
        UnknownWidget()
        Text("Hello")
      `;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(3);
      expect(result.widgets[0].type).toBe(WidgetType.CONTAINER);
      expect(result.widgets[1].type).toBe(WidgetType.CUSTOM);
      expect(result.widgets[2].type).toBe(WidgetType.TEXT);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('Complex Flutter Patterns', () => {
    it('should handle complete widget tree', () => {
      const code = `
        Scaffold(
          appBar: AppBar(
            title: Text("Flutter App"),
            backgroundColor: Theme.of(context).primaryColor
          ),
          body: Column(
            children: [
              Container(
                padding: EdgeInsets.all(16),
                child: Text(
                  "Welcome",
                  style: Theme.of(context).textTheme.headline1
                )
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton(
                    onPressed: null,
                    child: Text("Button 1")
                  ),
                  ElevatedButton(
                    onPressed: null,
                    child: Text("Button 2")
                  )
                ]
              )
            ]
          )
        )
      `;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      const scaffold = result.widgets[0];
      expect(scaffold.type).toBe(WidgetType.SCAFFOLD);
      
      // Check that all nested widgets are properly extracted
      // This is a complex tree, so we'll just verify the structure exists
      expect(scaffold.properties.appBar).toBeDefined();
      expect(scaffold.properties.body).toBeDefined();
    });

    it('should handle theme references in nested widgets', () => {
      const code = `
        Container(
          color: Theme.of(context).colorScheme.primary,
          child: Text(
            "Themed Text",
            style: Theme.of(context).textTheme.bodyText1
          )
        )
      `;
      
      const result = parser.extractWidgets(code);
      
      expect(result.widgets).toHaveLength(1);
      const container = result.widgets[0];
      
      expect(container.styling.colors).toHaveLength(1);
      expect(container.styling.colors[0].isThemeReference).toBe(true);
      
      expect(container.children).toHaveLength(1);
      const text = container.children[0];
      expect(text.styling.typography?.isThemeReference).toBe(true);
    });
  });
});
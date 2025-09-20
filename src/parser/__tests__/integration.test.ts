import { DartParser } from '../dart-parser';
import { WidgetType } from '../../schema/types';

describe('Integration Tests', () => {
  let parser: DartParser;

  beforeEach(() => {
    parser = new DartParser();
  });

  describe('Complete Flutter Widget Parsing', () => {
    it('should parse and extract a complete Flutter widget tree', () => {
      const flutterCode = `
        Container(
          width: 300,
          height: 200,
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blue,
            borderRadius: BorderRadius.circular(8)
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Welcome to Flutter",
                style: Theme.of(context).textTheme.headline1
              ),
              Container(height: 16),
              Row(
                children: [
                  ElevatedButton(
                    onPressed: null,
                    child: Text("Button 1")
                  ),
                  Container(width: 8),
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

      const result = parser.extractWidgets(flutterCode);

      // Should successfully parse without errors
      expect(result.errors).toHaveLength(0);
      expect(result.widgets).toHaveLength(1);

      const container = result.widgets[0];
      expect(container.type).toBe(WidgetType.CONTAINER);
      expect(container.properties.width).toBe(300);
      expect(container.properties.height).toBe(200);
      // The decoration should be extracted as a constructor call
      expect(container.properties.decoration).toBeDefined();
      const decoration = container.properties.decoration as any;
      expect(decoration.type).toBe('constructor');
      expect(decoration.name).toBe('BoxDecoration');

      // Should have one child (Column)
      expect(container.children).toHaveLength(1);
      const column = container.children[0];
      expect(column.type).toBe(WidgetType.COLUMN);
      expect(column.layout?.type).toBe('column');
      expect(column.layout?.alignment?.mainAxis).toBe('center');
      expect(column.layout?.alignment?.crossAxis).toBe('start');

      // Column should have 3 children: Text, Container (spacer), Row
      expect(column.children).toHaveLength(3);
      
      const text = column.children[0];
      expect(text.type).toBe(WidgetType.TEXT);
      expect(text.properties.text).toBe('Welcome to Flutter');
      expect(text.styling.typography?.isThemeReference).toBe(true);
      expect(text.styling.typography?.themePath).toBe('Theme.of(context).textTheme.headline1');

      const spacer = column.children[1];
      expect(spacer.type).toBe(WidgetType.CONTAINER);
      expect(spacer.properties.height).toBe(16);

      const row = column.children[2];
      expect(row.type).toBe(WidgetType.ROW);
      expect(row.children).toHaveLength(3); // Button, spacer, Button

      const button1 = row.children[0];
      expect(button1.type).toBe(WidgetType.BUTTON);
      expect(button1.children).toHaveLength(1);
      expect(button1.children[0].type).toBe(WidgetType.TEXT);
      expect(button1.children[0].properties.text).toBe('Button 1');

      const buttonSpacer = row.children[1];
      expect(buttonSpacer.type).toBe(WidgetType.CONTAINER);
      expect(buttonSpacer.properties.width).toBe(8);

      const button2 = row.children[2];
      expect(button2.type).toBe(WidgetType.BUTTON);
      expect(button2.children).toHaveLength(1);
      expect(button2.children[0].properties.text).toBe('Button 2');
    });

    it('should handle Material Design widgets', () => {
      const flutterCode = `
        Scaffold(
          appBar: AppBar(
            title: Text("My App"),
            backgroundColor: Theme.of(context).primaryColor
          ),
          body: Card(
            margin: EdgeInsets.all(16),
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text("Card Content")
            )
          )
        )
      `;

      const result = parser.extractWidgets(flutterCode);

      expect(result.errors).toHaveLength(0);
      expect(result.widgets).toHaveLength(1);

      const scaffold = result.widgets[0];
      expect(scaffold.type).toBe(WidgetType.SCAFFOLD);
      expect(scaffold.properties.appBar).toBeDefined();
      expect(scaffold.properties.body).toBeDefined();
    });

    it('should handle Cupertino widgets', () => {
      const flutterCode = `
        CupertinoPageScaffold(
          navigationBar: CupertinoNavigationBar(
            middle: Text("iOS App")
          ),
          child: Center(
            child: CupertinoButton(
              onPressed: null,
              child: Text("iOS Button")
            )
          )
        )
      `;

      const result = parser.extractWidgets(flutterCode);

      expect(result.errors).toHaveLength(0);
      expect(result.widgets).toHaveLength(1);

      const scaffold = result.widgets[0];
      expect(scaffold.type).toBe(WidgetType.CUSTOM); // CupertinoPageScaffold maps to CUSTOM
      // Since it's a known widget, it doesn't get customType property
      expect(scaffold.properties.navigationBar).toBeDefined();
    });

    it('should handle syntax errors gracefully', () => {
      const invalidCode = `
        Container(
          width: 100,
          height: 200,
          child: Text("Missing closing paren"
        )
      `;

      const result = parser.extractWidgets(invalidCode);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.widgets).toHaveLength(0);
    });

    it('should handle unknown widgets with warnings', () => {
      const codeWithCustomWidget = `
        MyCustomWidget(
          customProperty: "value",
          child: Text("Inside custom widget")
        )
      `;

      const result = parser.extractWidgets(codeWithCustomWidget);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unknown widget type: MyCustomWidget');
      
      expect(result.widgets).toHaveLength(1);
      const customWidget = result.widgets[0];
      expect(customWidget.type).toBe(WidgetType.CUSTOM);
      expect(customWidget.properties.customType).toBe('MyCustomWidget');
      expect(customWidget.properties.customProperty).toBe('value');
      expect(customWidget.children).toHaveLength(1);
    });
  });

  describe('Theme Reference Handling', () => {
    it('should correctly identify and extract theme references', () => {
      const codeWithThemes = `
        Container(
          color: Theme.of(context).colorScheme.primary,
          child: Text(
            "Themed content",
            style: Theme.of(context).textTheme.bodyText1
          )
        )
      `;

      const result = parser.extractWidgets(codeWithThemes);

      expect(result.errors).toHaveLength(0);
      expect(result.widgets).toHaveLength(1);

      const container = result.widgets[0];
      expect(container.styling.colors).toHaveLength(1);
      expect(container.styling.colors[0].isThemeReference).toBe(true);
      expect(container.styling.colors[0].themePath).toBe('Theme.of(context).colorScheme.primary');

      const text = container.children[0];
      expect(text.styling.typography?.isThemeReference).toBe(true);
      expect(text.styling.typography?.themePath).toBe('Theme.of(context).textTheme.bodyText1');
    });

    it('should handle Colors references', () => {
      const codeWithColors = `
        Container(
          color: Colors.red,
          child: Container(
            color: Colors.blue
          )
        )
      `;

      const result = parser.extractWidgets(codeWithColors);

      expect(result.errors).toHaveLength(0);
      expect(result.widgets).toHaveLength(1);

      const container = result.widgets[0];
      expect(container.styling.colors).toHaveLength(1);
      expect(container.styling.colors[0].isThemeReference).toBe(false);
      expect(container.styling.colors[0].value).toBe('Colors.red');

      const childContainer = container.children[0];
      expect(childContainer.styling.colors).toHaveLength(1);
      expect(childContainer.styling.colors[0].value).toBe('Colors.blue');
    });
  });

  describe('Layout Information Extraction', () => {
    it('should extract layout information for Row and Column widgets', () => {
      const layoutCode = `
        Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Left"),
                Text("Right")
              ]
            )
          ]
        )
      `;

      const result = parser.extractWidgets(layoutCode);

      expect(result.errors).toHaveLength(0);
      expect(result.widgets).toHaveLength(1);

      const column = result.widgets[0];
      expect(column.layout?.type).toBe('column');
      expect(column.layout?.alignment?.mainAxis).toBe('spaceBetween');
      expect(column.layout?.alignment?.crossAxis).toBe('stretch');

      const row = column.children[0];
      expect(row.layout?.type).toBe('row');
      expect(row.layout?.alignment?.mainAxis).toBe('center');
      expect(row.layout?.alignment?.crossAxis).toBe('start');
    });
  });
});
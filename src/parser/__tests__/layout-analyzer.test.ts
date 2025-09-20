import { LayoutAnalyzer, LayoutType, LayoutAnalysis } from '../layout-analyzer';
import { Widget, WidgetType } from '../../schema/types';

describe('LayoutAnalyzer', () => {
  let analyzer: LayoutAnalyzer;

  beforeEach(() => {
    analyzer = new LayoutAnalyzer();
  });

  // Helper function to create test widgets
  const createWidget = (
    id: string,
    type: WidgetType,
    children: Widget[] = [],
    properties: any = {}
  ): Widget => ({
    id,
    type,
    properties,
    children,
    styling: { colors: [] }
  });

  describe('Layout Type Detection', () => {
    it('should detect Row as linear layout', () => {
      const child1 = createWidget('child1', WidgetType.TEXT);
      const child2 = createWidget('child2', WidgetType.TEXT);
      const row = createWidget('row', WidgetType.ROW, [child1, child2]);

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.layoutType).toBe(LayoutType.LINEAR);
      expect(analysis.direction).toBe('horizontal');
      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should detect Column as linear layout', () => {
      const child1 = createWidget('child1', WidgetType.TEXT);
      const child2 = createWidget('child2', WidgetType.BUTTON);
      const column = createWidget('column', WidgetType.COLUMN, [child1, child2]);

      const analysis = analyzer.analyzeWidget(column);

      expect(analysis.layoutType).toBe(LayoutType.LINEAR);
      expect(analysis.direction).toBe('vertical');
      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should detect Stack as stack layout', () => {
      const background = createWidget('bg', WidgetType.CONTAINER);
      const overlay = createWidget('overlay', WidgetType.TEXT);
      const stack = createWidget('stack', WidgetType.STACK, [background, overlay]);

      const analysis = analyzer.analyzeWidget(stack);

      expect(analysis.layoutType).toBe(LayoutType.STACK);
      expect(analysis.isAutoLayoutCandidate).toBe(false);
    });

    it('should detect Container with single child as single layout', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const container = createWidget('container', WidgetType.CONTAINER, [child]);

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.layoutType).toBe(LayoutType.SINGLE);
      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should detect empty Container as no layout', () => {
      const container = createWidget('container', WidgetType.CONTAINER, []);

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.layoutType).toBe(LayoutType.NONE);
      expect(analysis.isAutoLayoutCandidate).toBe(false);
    });

    it('should detect Row with flex children as flex layout', () => {
      const flexChild = createWidget('flex', WidgetType.CUSTOM, [], { 
        customType: 'Expanded', 
        flex: 2 
      });
      const normalChild = createWidget('normal', WidgetType.TEXT);
      const row = createWidget('row', WidgetType.ROW, [flexChild, normalChild]);

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.layoutType).toBe(LayoutType.FLEX);
      expect(analysis.flexProperties?.hasFlexChildren).toBe(true);
      expect(analysis.flexProperties?.hasFixedChildren).toBe(true);
      expect(analysis.flexProperties?.flexChildren).toHaveLength(1);
      expect(analysis.flexProperties?.totalFlex).toBe(2);
    });
  });

  describe('Custom Widget Layout Detection', () => {
    it('should detect ListView as scroll layout', () => {
      const item1 = createWidget('item1', WidgetType.CONTAINER);
      const item2 = createWidget('item2', WidgetType.CONTAINER);
      const listView = createWidget('list', WidgetType.CUSTOM, [item1, item2], {
        customType: 'ListView'
      });

      const analysis = analyzer.analyzeWidget(listView);

      expect(analysis.layoutType).toBe(LayoutType.SCROLL);
    });

    it('should detect GridView as grid layout', () => {
      const gridView = createWidget('grid', WidgetType.CUSTOM, [], {
        customType: 'GridView'
      });

      const analysis = analyzer.analyzeWidget(gridView);

      expect(analysis.layoutType).toBe(LayoutType.GRID);
    });

    it('should detect Wrap as wrap layout', () => {
      const wrap = createWidget('wrap', WidgetType.CUSTOM, [], {
        customType: 'Wrap'
      });

      const analysis = analyzer.analyzeWidget(wrap);

      expect(analysis.layoutType).toBe(LayoutType.WRAP);
      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should detect Flex as flex layout', () => {
      const flex = createWidget('flex', WidgetType.CUSTOM, [], {
        customType: 'Flex'
      });

      const analysis = analyzer.analyzeWidget(flex);

      expect(analysis.layoutType).toBe(LayoutType.FLEX);
    });
  });

  describe('Alignment Extraction', () => {
    it('should extract alignment from Row properties', () => {
      const row = createWidget('row', WidgetType.ROW, [], {
        mainAxisAlignment: 'MainAxisAlignment.center',
        crossAxisAlignment: 'CrossAxisAlignment.start'
      });

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.alignment?.mainAxis).toBe('center');
      expect(analysis.alignment?.crossAxis).toBe('start');
    });

    it('should extract alignment from Column properties', () => {
      const column = createWidget('column', WidgetType.COLUMN, [], {
        mainAxisAlignment: 'MainAxisAlignment.spaceBetween',
        crossAxisAlignment: 'CrossAxisAlignment.stretch'
      });

      const analysis = analyzer.analyzeWidget(column);

      expect(analysis.alignment?.mainAxis).toBe('spaceBetween');
      expect(analysis.alignment?.crossAxis).toBe('stretch');
    });

    it('should handle all main axis alignment values', () => {
      const alignments = [
        'MainAxisAlignment.start',
        'MainAxisAlignment.center',
        'MainAxisAlignment.end',
        'MainAxisAlignment.spaceBetween',
        'MainAxisAlignment.spaceAround',
        'MainAxisAlignment.spaceEvenly'
      ];

      const expected = ['start', 'center', 'end', 'spaceBetween', 'spaceAround', 'spaceEvenly'];

      alignments.forEach((alignment, index) => {
        const row = createWidget('row', WidgetType.ROW, [], {
          mainAxisAlignment: alignment
        });

        const analysis = analyzer.analyzeWidget(row);
        expect(analysis.alignment?.mainAxis).toBe(expected[index]);
      });
    });

    it('should handle all cross axis alignment values', () => {
      const alignments = [
        'CrossAxisAlignment.start',
        'CrossAxisAlignment.center',
        'CrossAxisAlignment.end',
        'CrossAxisAlignment.stretch'
      ];

      const expected = ['start', 'center', 'end', 'stretch'];

      alignments.forEach((alignment, index) => {
        const column = createWidget('column', WidgetType.COLUMN, [], {
          crossAxisAlignment: alignment
        });

        const analysis = analyzer.analyzeWidget(column);
        expect(analysis.alignment?.crossAxis).toBe(expected[index]);
      });
    });
  });

  describe('Spacing and Padding Extraction', () => {
    it('should extract spacing from properties', () => {
      const row = createWidget('row', WidgetType.ROW, [], {
        spacing: 16
      });

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.spacing).toBe(16);
    });

    it('should extract padding from properties', () => {
      const container = createWidget('container', WidgetType.CONTAINER, [], {
        padding: {
          top: 8,
          right: 16,
          bottom: 8,
          left: 16
        }
      });

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.padding).toEqual({
        top: 8,
        right: 16,
        bottom: 8,
        left: 16
      });
    });

    it('should handle uniform padding', () => {
      const container = createWidget('container', WidgetType.CONTAINER, [], {
        padding: 12
      });

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.padding).toEqual({
        top: 12,
        right: 12,
        bottom: 12,
        left: 12
      });
    });
  });

  describe('Constraints Extraction', () => {
    it('should extract width and height constraints', () => {
      const container = createWidget('container', WidgetType.CONTAINER, [], {
        width: 200,
        height: 100
      });

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.constraints?.minWidth).toBe(200);
      expect(analysis.constraints?.maxWidth).toBe(200);
      expect(analysis.constraints?.minHeight).toBe(100);
      expect(analysis.constraints?.maxHeight).toBe(100);
    });

    it('should extract aspect ratio constraint', () => {
      const container = createWidget('container', WidgetType.CONTAINER, [], {
        aspectRatio: 1.5
      });

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.constraints?.aspectRatio).toBe(1.5);
    });
  });

  describe('Flex Properties Analysis', () => {
    it('should analyze flex properties in Row', () => {
      const expanded1 = createWidget('exp1', WidgetType.CUSTOM, [], {
        customType: 'Expanded',
        flex: 2
      });
      const expanded2 = createWidget('exp2', WidgetType.CUSTOM, [], {
        customType: 'Expanded',
        flex: 1
      });
      const fixed = createWidget('fixed', WidgetType.TEXT);
      
      const row = createWidget('row', WidgetType.ROW, [expanded1, expanded2, fixed]);

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.flexProperties?.hasFlexChildren).toBe(true);
      expect(analysis.flexProperties?.hasFixedChildren).toBe(true);
      expect(analysis.flexProperties?.flexChildren).toHaveLength(2);
      expect(analysis.flexProperties?.totalFlex).toBe(3);
      
      const flexChild1 = analysis.flexProperties?.flexChildren[0];
      expect(flexChild1?.widget.id).toBe('exp1');
      expect(flexChild1?.flex).toBe(2);
      expect(flexChild1?.fit).toBe('loose');
    });

    it('should handle Flexible widgets', () => {
      const flexible = createWidget('flex', WidgetType.CUSTOM, [], {
        customType: 'Flexible',
        flex: 3,
        fit: 'FlexFit.tight'
      });
      
      const column = createWidget('column', WidgetType.COLUMN, [flexible]);

      const analysis = analyzer.analyzeWidget(column);

      expect(analysis.flexProperties?.flexChildren).toHaveLength(1);
      expect(analysis.flexProperties?.flexChildren[0].flex).toBe(3);
      expect(analysis.flexProperties?.flexChildren[0].fit).toBe('tight');
    });

    it('should handle widgets with flex property directly', () => {
      const widget = createWidget('widget', WidgetType.CONTAINER, [], {
        flex: 2
      });
      
      const row = createWidget('row', WidgetType.ROW, [widget]);

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.flexProperties?.flexChildren).toHaveLength(1);
      expect(analysis.flexProperties?.flexChildren[0].flex).toBe(2);
    });
  });

  describe('Stack Properties Analysis', () => {
    it('should analyze positioned children in Stack', () => {
      const positioned1 = createWidget('pos1', WidgetType.CUSTOM, [], {
        customType: 'Positioned',
        top: 10,
        left: 20
      });
      const positioned2 = createWidget('pos2', WidgetType.TEXT, [], {
        bottom: 15,
        right: 25,
        width: 100
      });
      const normal = createWidget('normal', WidgetType.CONTAINER);
      
      const stack = createWidget('stack', WidgetType.STACK, [positioned1, positioned2, normal]);

      const analysis = analyzer.analyzeWidget(stack);

      expect(analysis.stackProperties?.hasPositionedChildren).toBe(true);
      expect(analysis.stackProperties?.positionedChildren).toHaveLength(2);
      
      const pos1 = analysis.stackProperties?.positionedChildren[0];
      expect(pos1?.widget.id).toBe('pos1');
      expect(pos1?.top).toBe(10);
      expect(pos1?.left).toBe(20);
      
      const pos2 = analysis.stackProperties?.positionedChildren[1];
      expect(pos2?.widget.id).toBe('pos2');
      expect(pos2?.bottom).toBe(15);
      expect(pos2?.right).toBe(25);
      expect(pos2?.width).toBe(100);
    });

    it('should handle Stack fit and clip behavior', () => {
      const stack = createWidget('stack', WidgetType.STACK, [], {
        fit: 'StackFit.expand',
        clipBehavior: 'Clip.antiAlias'
      });

      const analysis = analyzer.analyzeWidget(stack);

      expect(analysis.stackProperties?.stackFit).toBe('expand');
      expect(analysis.stackProperties?.clipBehavior).toBe('antiAlias');
    });

    it('should use default values for Stack properties', () => {
      const stack = createWidget('stack', WidgetType.STACK, []);

      const analysis = analyzer.analyzeWidget(stack);

      expect(analysis.stackProperties?.stackFit).toBe('loose');
      expect(analysis.stackProperties?.clipBehavior).toBe('none');
    });
  });

  describe('Auto Layout Candidate Detection', () => {
    it('should identify Row as Auto Layout candidate', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const row = createWidget('row', WidgetType.ROW, [child]);

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should identify Column as Auto Layout candidate', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const column = createWidget('column', WidgetType.COLUMN, [child]);

      const analysis = analyzer.analyzeWidget(column);

      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should identify single child Container as Auto Layout candidate', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const container = createWidget('container', WidgetType.CONTAINER, [child]);

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should identify Wrap as Auto Layout candidate', () => {
      const wrap = createWidget('wrap', WidgetType.CUSTOM, [], {
        customType: 'Wrap'
      });

      const analysis = analyzer.analyzeWidget(wrap);

      expect(analysis.isAutoLayoutCandidate).toBe(true);
    });

    it('should not identify Stack as Auto Layout candidate', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const stack = createWidget('stack', WidgetType.STACK, [child]);

      const analysis = analyzer.analyzeWidget(stack);

      expect(analysis.isAutoLayoutCandidate).toBe(false);
    });

    it('should not identify empty widgets as Auto Layout candidates', () => {
      const empty = createWidget('empty', WidgetType.CONTAINER, []);

      const analysis = analyzer.analyzeWidget(empty);

      expect(analysis.isAutoLayoutCandidate).toBe(false);
    });
  });

  describe('Multiple Widgets Analysis', () => {
    it('should analyze multiple widgets and categorize them', () => {
      const text = createWidget('text', WidgetType.TEXT);
      const row = createWidget('row', WidgetType.ROW, [text]);
      const stack = createWidget('stack', WidgetType.STACK, []);
      const flexChild = createWidget('flexChild', WidgetType.TEXT);
      const flex = createWidget('flex', WidgetType.CUSTOM, [flexChild], { customType: 'Flex' });

      const summary = analyzer.analyzeLayouts([row, stack, flex]);

      expect(summary.totalLayouts).toBe(5); // Including children
      expect(summary.autoLayoutCandidates).toHaveLength(2); // row and flex
      expect(summary.layoutTypes.get(LayoutType.LINEAR)).toHaveLength(1);
      expect(summary.layoutTypes.get(LayoutType.STACK)).toHaveLength(1);
      expect(summary.layoutTypes.get(LayoutType.FLEX)).toHaveLength(1);
      expect(summary.layoutTypes.get(LayoutType.NONE)).toHaveLength(2); // text and flexChild
    });

    it('should identify complex layouts', () => {
      const positioned = createWidget('pos', WidgetType.CUSTOM, [], {
        customType: 'Positioned',
        top: 0
      });
      const stack = createWidget('stack', WidgetType.STACK, [positioned]);

      const summary = analyzer.analyzeLayouts([stack]);

      expect(summary.complexLayouts).toHaveLength(1);
      expect(summary.complexLayouts[0].widget.id).toBe('stack');
    });

    it('should recursively analyze nested widgets', () => {
      const deepText = createWidget('deepText', WidgetType.TEXT);
      const innerRow = createWidget('innerRow', WidgetType.ROW, [deepText]);
      const outerColumn = createWidget('outerColumn', WidgetType.COLUMN, [innerRow]);

      const summary = analyzer.analyzeLayouts([outerColumn]);

      expect(summary.totalLayouts).toBe(3);
      expect(summary.autoLayoutCandidates).toHaveLength(2); // innerRow and outerColumn
    });
  });

  describe('Auto Layout Recommendations', () => {
    it('should provide recommendations for linear layouts', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const row = createWidget('row', WidgetType.ROW, [child], {
        mainAxisAlignment: 'MainAxisAlignment.center',
        spacing: 8
      });

      const analysis = analyzer.analyzeWidget(row);
      const recommendations = analyzer.getAutoLayoutRecommendations(analysis);

      expect(recommendations).toContain('Use horizontal Auto Layout');
      expect(recommendations.some(r => r.includes('alignment'))).toBe(true);
      expect(recommendations.some(r => r.includes('spacing: 8px'))).toBe(true);
    });

    it('should provide recommendations for flex layouts', () => {
      const flexChild = createWidget('flex', WidgetType.CUSTOM, [], {
        customType: 'Expanded',
        flex: 2
      });
      const column = createWidget('column', WidgetType.COLUMN, [flexChild]);

      const analysis = analyzer.analyzeWidget(column);
      const recommendations = analyzer.getAutoLayoutRecommendations(analysis);

      expect(recommendations).toContain('Use vertical Auto Layout with flex properties');
      expect(recommendations.some(r => r.includes('1 flex children'))).toBe(true);
    });

    it('should provide recommendations for single child layouts', () => {
      const child = createWidget('child', WidgetType.TEXT);
      const container = createWidget('container', WidgetType.CONTAINER, [child], {
        padding: 16
      });

      const analysis = analyzer.analyzeWidget(container);
      const recommendations = analyzer.getAutoLayoutRecommendations(analysis);

      expect(recommendations).toContain('Use Auto Layout for padding and sizing');
      expect(recommendations.some(r => r.includes('padding'))).toBe(true);
    });

    it('should provide recommendations for wrap layouts', () => {
      const wrap = createWidget('wrap', WidgetType.CUSTOM, [], {
        customType: 'Wrap'
      });

      const analysis = analyzer.analyzeWidget(wrap);
      const recommendations = analyzer.getAutoLayoutRecommendations(analysis);

      expect(recommendations).toContain('Use Auto Layout with wrap enabled (if supported)');
    });

    it('should handle non-Auto Layout candidates', () => {
      const stack = createWidget('stack', WidgetType.STACK, []);

      const analysis = analyzer.analyzeWidget(stack);
      const recommendations = analyzer.getAutoLayoutRecommendations(analysis);

      expect(recommendations).toContain('Widget is not suitable for Auto Layout conversion');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle widgets with no properties', () => {
      const widget = createWidget('widget', WidgetType.TEXT, []);

      const analysis = analyzer.analyzeWidget(widget);

      expect(analysis.layoutType).toBe(LayoutType.NONE);
      expect(analysis.alignment).toBeUndefined();
      expect(analysis.spacing).toBeUndefined();
      expect(analysis.padding).toBeUndefined();
    });

    it('should handle invalid alignment values', () => {
      const row = createWidget('row', WidgetType.ROW, [], {
        mainAxisAlignment: 'InvalidAlignment'
      });

      const analysis = analyzer.analyzeWidget(row);

      expect(analysis.alignment?.mainAxis).toBe('start'); // Default fallback
    });

    it('should handle invalid padding values', () => {
      const container = createWidget('container', WidgetType.CONTAINER, [], {
        padding: 'invalid'
      });

      const analysis = analyzer.analyzeWidget(container);

      expect(analysis.padding).toBeUndefined();
    });

    it('should handle widgets with null/undefined properties', () => {
      const widget = createWidget('widget', WidgetType.CONTAINER, [], {
        width: null,
        height: undefined,
        padding: null
      });

      const analysis = analyzer.analyzeWidget(widget);

      expect(analysis.constraints).toBeUndefined();
      expect(analysis.padding).toBeUndefined();
    });
  });
});
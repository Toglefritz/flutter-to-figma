import { ConversionSummary, ConversionResult, ConversionStats, CreatedElement } from '../conversion-summary';

describe('ConversionSummary', () => {
  let conversionSummary: ConversionSummary;
  let mockResult: ConversionResult;
  let mockStats: ConversionStats;
  let mockElements: CreatedElement[];

  beforeEach(() => {
    conversionSummary = new ConversionSummary();
    
    mockStats = {
      widgetsFound: 10,
      widgetsConverted: 8,
      componentsCreated: 3,
      variablesCreated: 5,
      framesCreated: 12,
      textNodesCreated: 15,
      unsupportedWidgets: 2,
      processingTime: 2500
    };

    mockElements = [
      {
        id: 'elem1',
        name: 'MyButton',
        type: 'COMPONENT',
        sourceWidget: 'ElevatedButton',
        sourceLine: 15,
        figmaNodeId: 'figma_123'
      },
      {
        id: 'elem2',
        name: 'MainFrame',
        type: 'FRAME',
        sourceWidget: 'Container',
        sourceLine: 8,
        figmaNodeId: 'figma_456'
      },
      {
        id: 'elem3',
        name: 'Title',
        type: 'TEXT',
        sourceWidget: 'Text',
        sourceLine: 12
      },
      {
        id: 'elem4',
        name: 'Primary Color',
        type: 'VARIABLE'
      }
    ];

    mockResult = {
      success: true,
      stats: mockStats,
      elements: mockElements,
      errors: 1,
      warnings: 2,
      startTime: Date.now() - 3000,
      endTime: Date.now(),
      fileName: 'test_widget.dart'
    };
  });

  describe('setResult and getResult', () => {
    it('should set and get conversion result', () => {
      conversionSummary.setResult(mockResult);
      const result = conversionSummary.getResult();

      expect(result).toEqual(mockResult);
    });

    it('should return null when no result is set', () => {
      const result = conversionSummary.getResult();
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear the conversion result', () => {
      conversionSummary.setResult(mockResult);
      expect(conversionSummary.getResult()).not.toBeNull();

      conversionSummary.clear();
      expect(conversionSummary.getResult()).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return stats when result is set', () => {
      conversionSummary.setResult(mockResult);
      const stats = conversionSummary.getStats();

      expect(stats).toEqual(mockStats);
    });

    it('should return null when no result is set', () => {
      const stats = conversionSummary.getStats();
      expect(stats).toBeNull();
    });
  });

  describe('getElementsByType', () => {
    beforeEach(() => {
      conversionSummary.setResult(mockResult);
    });

    it('should group elements by type', () => {
      const grouped = conversionSummary.getElementsByType();

      expect(grouped['COMPONENT']).toHaveLength(1);
      expect(grouped['FRAME']).toHaveLength(1);
      expect(grouped['TEXT']).toHaveLength(1);
      expect(grouped['VARIABLE']).toHaveLength(1);
      expect(grouped['COMPONENT'][0].name).toBe('MyButton');
    });

    it('should return empty object when no result', () => {
      conversionSummary.clear();
      const grouped = conversionSummary.getElementsByType();

      expect(grouped).toEqual({});
    });
  });

  describe('getLinkableElements', () => {
    beforeEach(() => {
      conversionSummary.setResult(mockResult);
    });

    it('should return elements that can be linked to in Figma', () => {
      const linkable = conversionSummary.getLinkableElements();

      expect(linkable).toHaveLength(2);
      expect(linkable[0].name).toBe('MyButton');
      expect(linkable[1].name).toBe('MainFrame');
      expect(linkable.every(el => el.figmaNodeId)).toBe(true);
    });

    it('should return empty array when no result', () => {
      conversionSummary.clear();
      const linkable = conversionSummary.getLinkableElements();

      expect(linkable).toEqual([]);
    });
  });

  describe('formatProcessingTime', () => {
    it('should format time in milliseconds', () => {
      const result = { ...mockResult, startTime: 1000, endTime: 1500 };
      conversionSummary.setResult(result);

      const formatted = conversionSummary.formatProcessingTime();
      expect(formatted).toBe('500ms');
    });

    it('should format time in seconds', () => {
      const result = { ...mockResult, startTime: 1000, endTime: 3500 };
      conversionSummary.setResult(result);

      const formatted = conversionSummary.formatProcessingTime();
      expect(formatted).toBe('2.5s');
    });

    it('should format time in minutes and seconds', () => {
      const result = { ...mockResult, startTime: 1000, endTime: 125000 };
      conversionSummary.setResult(result);

      const formatted = conversionSummary.formatProcessingTime();
      expect(formatted).toBe('2m 4.0s');
    });

    it('should return 0ms when no result', () => {
      const formatted = conversionSummary.formatProcessingTime();
      expect(formatted).toBe('0ms');
    });
  });

  describe('getSuccessRate', () => {
    it('should calculate success rate correctly', () => {
      conversionSummary.setResult(mockResult);
      const successRate = conversionSummary.getSuccessRate();

      expect(successRate).toBe(80); // 8/10 * 100 = 80%
    });

    it('should return 0 when no widgets found', () => {
      const result = { ...mockResult, stats: { ...mockStats, widgetsFound: 0 } };
      conversionSummary.setResult(result);

      const successRate = conversionSummary.getSuccessRate();
      expect(successRate).toBe(0);
    });

    it('should return 0 when no result', () => {
      const successRate = conversionSummary.getSuccessRate();
      expect(successRate).toBe(0);
    });
  });

  describe('getSummaryMessage', () => {
    it('should return success message for 100% success rate', () => {
      const result = { ...mockResult, stats: { ...mockStats, widgetsConverted: 10 } };
      conversionSummary.setResult(result);

      const message = conversionSummary.getSummaryMessage();
      expect(message).toBe('Conversion completed successfully! All 10 widgets converted.');
    });

    it('should return partial success message', () => {
      conversionSummary.setResult(mockResult);

      const message = conversionSummary.getSummaryMessage();
      expect(message).toBe('Conversion completed with 80% success rate. 8 of 10 widgets converted.');
    });

    it('should return failure message for failed conversion', () => {
      const result = { ...mockResult, success: false };
      conversionSummary.setResult(result);

      const message = conversionSummary.getSummaryMessage();
      expect(message).toBe('Conversion failed. 8 of 10 widgets processed.');
    });

    it('should return no results message when no result', () => {
      const message = conversionSummary.getSummaryMessage();
      expect(message).toBe('No conversion results available.');
    });
  });

  describe('generateHTML', () => {
    it('should generate HTML for empty summary', () => {
      const html = conversionSummary.generateHTML();
      expect(html).toContain('conversion-summary empty');
      expect(html).toContain('No conversion results to display');
    });

    it('should generate HTML with conversion results', () => {
      conversionSummary.setResult(mockResult);
      const html = conversionSummary.generateHTML();

      expect(html).toContain('conversion-summary');
      expect(html).toContain('Conversion Summary');
      expect(html).toContain('summary-stats');
      expect(html).toContain('10'); // widgets found
      expect(html).toContain('8'); // widgets converted
      expect(html).toContain('80%'); // success rate
    });

    it('should include created elements in HTML', () => {
      conversionSummary.setResult(mockResult);
      const html = conversionSummary.generateHTML();

      expect(html).toContain('Created Elements');
      expect(html).toContain('MyButton');
      expect(html).toContain('MainFrame');
      expect(html).toContain('Components');
      expect(html).toContain('Frames');
    });

    it('should include performance information', () => {
      conversionSummary.setResult(mockResult);
      const html = conversionSummary.generateHTML();

      expect(html).toContain('Processing Time');
      expect(html).toContain('test_widget.dart');
      expect(html).toContain('1 error');
      expect(html).toContain('2 warnings');
    });

    it('should show success status for successful conversion', () => {
      conversionSummary.setResult(mockResult);
      const html = conversionSummary.generateHTML();

      expect(html).toContain('summary-status success');
      expect(html).toContain('✅');
    });

    it('should show error status for failed conversion', () => {
      const result = { ...mockResult, success: false };
      conversionSummary.setResult(result);
      const html = conversionSummary.generateHTML();

      expect(html).toContain('summary-status error');
      expect(html).toContain('❌');
    });
  });

  describe('static factory methods', () => {
    describe('createResult', () => {
      it('should create a conversion result', () => {
        const stats = ConversionSummary.createEmptyStats();
        const elements: CreatedElement[] = [];
        const startTime = Date.now();
        const endTime = startTime + 1000;

        const result = ConversionSummary.createResult(
          'test.dart',
          true,
          stats,
          elements,
          0,
          1,
          startTime,
          endTime
        );

        expect(result.fileName).toBe('test.dart');
        expect(result.success).toBe(true);
        expect(result.stats).toBe(stats);
        expect(result.elements).toBe(elements);
        expect(result.errors).toBe(0);
        expect(result.warnings).toBe(1);
        expect(result.startTime).toBe(startTime);
        expect(result.endTime).toBe(endTime);
      });
    });

    describe('createEmptyStats', () => {
      it('should create empty stats with all zeros', () => {
        const stats = ConversionSummary.createEmptyStats();

        expect(stats.widgetsFound).toBe(0);
        expect(stats.widgetsConverted).toBe(0);
        expect(stats.componentsCreated).toBe(0);
        expect(stats.variablesCreated).toBe(0);
        expect(stats.framesCreated).toBe(0);
        expect(stats.textNodesCreated).toBe(0);
        expect(stats.unsupportedWidgets).toBe(0);
        expect(stats.processingTime).toBe(0);
      });
    });

    describe('createSampleElement', () => {
      it('should create a sample element', () => {
        const element = ConversionSummary.createSampleElement(
          'Test Element',
          'COMPONENT',
          'Container',
          15
        );

        expect(element.name).toBe('Test Element');
        expect(element.type).toBe('COMPONENT');
        expect(element.sourceWidget).toBe('Container');
        expect(element.sourceLine).toBe(15);
        expect(element.id).toBeDefined();
        expect(element.figmaNodeId).toBeDefined(); // Should have figmaNodeId for COMPONENT
      });

      it('should not set figmaNodeId for VARIABLE type', () => {
        const element = ConversionSummary.createSampleElement(
          'Test Variable',
          'VARIABLE'
        );

        expect(element.type).toBe('VARIABLE');
        expect(element.figmaNodeId).toBeUndefined();
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow', () => {
      // Create and set result
      const stats = ConversionSummary.createEmptyStats();
      stats.widgetsFound = 5;
      stats.widgetsConverted = 4;
      stats.componentsCreated = 2;

      const elements = [
        ConversionSummary.createSampleElement('Button', 'COMPONENT', 'ElevatedButton', 10),
        ConversionSummary.createSampleElement('Container', 'FRAME', 'Container', 5)
      ];

      const result = ConversionSummary.createResult(
        'my_widget.dart',
        true,
        stats,
        elements,
        0,
        1
      );

      conversionSummary.setResult(result);

      // Test various methods
      expect(conversionSummary.getSuccessRate()).toBe(80);
      expect(conversionSummary.getLinkableElements()).toHaveLength(2);
      expect(conversionSummary.getElementsByType()['COMPONENT']).toHaveLength(1);
      expect(conversionSummary.getElementsByType()['FRAME']).toHaveLength(1);

      // Test HTML generation
      const html = conversionSummary.generateHTML();
      expect(html).toContain('Button');
      expect(html).toContain('Container');
      expect(html).toContain('80%');
      expect(html).toContain('my_widget.dart');

      // Test summary message
      const message = conversionSummary.getSummaryMessage();
      expect(message).toContain('80% success rate');
    });

    it('should handle empty conversion result', () => {
      const emptyStats = ConversionSummary.createEmptyStats();
      const emptyResult = ConversionSummary.createResult(
        'empty.dart',
        true,
        emptyStats,
        [],
        0,
        0
      );

      conversionSummary.setResult(emptyResult);

      expect(conversionSummary.getSuccessRate()).toBe(0);
      expect(conversionSummary.getLinkableElements()).toHaveLength(0);
      expect(conversionSummary.getElementsByType()).toEqual({});

      const html = conversionSummary.generateHTML();
      expect(html).toContain('conversion-summary');
      expect(html).not.toContain('Created Elements');
    });
  });
});
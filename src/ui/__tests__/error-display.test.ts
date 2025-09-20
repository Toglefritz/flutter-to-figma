import { ErrorDisplay, ErrorMessage } from '../error-display';

describe('ErrorDisplay', () => {
  let errorDisplay: ErrorDisplay;

  beforeEach(() => {
    errorDisplay = new ErrorDisplay();
  });

  describe('addError', () => {
    it('should add an error message', () => {
      const error: ErrorMessage = {
        type: 'error',
        message: 'Test error',
        line: 10
      };

      errorDisplay.addError(error);
      const errors = errorDisplay.getErrors();

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(error);
    });

    it('should limit the number of errors', () => {
      const errorDisplayWithLimit = new ErrorDisplay({ maxErrors: 2 });
      
      errorDisplayWithLimit.addError({ type: 'error', message: 'Error 1' });
      errorDisplayWithLimit.addError({ type: 'error', message: 'Error 2' });
      errorDisplayWithLimit.addError({ type: 'error', message: 'Error 3' });

      const errors = errorDisplayWithLimit.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Error 2');
      expect(errors[1].message).toBe('Error 3');
    });
  });

  describe('addErrors', () => {
    it('should add multiple error messages', () => {
      const errors: ErrorMessage[] = [
        { type: 'error', message: 'Error 1' },
        { type: 'warning', message: 'Warning 1' }
      ];

      errorDisplay.addErrors(errors);
      const allErrors = errorDisplay.getErrors();

      expect(allErrors).toHaveLength(2);
      expect(allErrors[0].message).toBe('Error 1');
      expect(allErrors[1].message).toBe('Warning 1');
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      errorDisplay.addError({ type: 'error', message: 'Test error' });
      expect(errorDisplay.getErrors()).toHaveLength(1);

      errorDisplay.clearErrors();
      expect(errorDisplay.getErrors()).toHaveLength(0);
    });
  });

  describe('getErrorsByType', () => {
    beforeEach(() => {
      errorDisplay.addErrors([
        { type: 'error', message: 'Error 1' },
        { type: 'error', message: 'Error 2' },
        { type: 'warning', message: 'Warning 1' },
        { type: 'info', message: 'Info 1' }
      ]);
    });

    it('should group errors by type', () => {
      const grouped = errorDisplay.getErrorsByType();

      expect(grouped.errors).toHaveLength(2);
      expect(grouped.warnings).toHaveLength(1);
      expect(grouped.info).toHaveLength(1);
    });
  });

  describe('getErrorCounts', () => {
    beforeEach(() => {
      errorDisplay.addErrors([
        { type: 'error', message: 'Error 1' },
        { type: 'error', message: 'Error 2' },
        { type: 'warning', message: 'Warning 1' },
        { type: 'info', message: 'Info 1' }
      ]);
    });

    it('should return correct error counts', () => {
      const counts = errorDisplay.getErrorCounts();

      expect(counts.errors).toBe(2);
      expect(counts.warnings).toBe(1);
      expect(counts.info).toBe(1);
      expect(counts.total).toBe(4);
    });
  });

  describe('formatError', () => {
    it('should format error with file and line', () => {
      const error: ErrorMessage = {
        type: 'error',
        message: 'Test error',
        file: 'test.dart',
        line: 10,
        column: 5,
        code: 'E001'
      };

      const formatted = errorDisplay.formatError(error);
      expect(formatted).toBe('test.dart:10:5 - Test error (E001)');
    });

    it('should format error with line only', () => {
      const error: ErrorMessage = {
        type: 'error',
        message: 'Test error',
        line: 10
      };

      const formatted = errorDisplay.formatError(error);
      expect(formatted).toBe('Line 10: Test error');
    });

    it('should format error with message only', () => {
      const error: ErrorMessage = {
        type: 'error',
        message: 'Test error'
      };

      const formatted = errorDisplay.formatError(error);
      expect(formatted).toBe('Test error');
    });
  });

  describe('formatSummary', () => {
    it('should return no errors message when empty', () => {
      const summary = errorDisplay.formatSummary();
      expect(summary).toBe('No errors or warnings.');
    });

    it('should format summary with errors and warnings', () => {
      errorDisplay.addErrors([
        { type: 'error', message: 'Error 1' },
        { type: 'error', message: 'Error 2' },
        { type: 'warning', message: 'Warning 1' },
        { type: 'info', message: 'Info 1' }
      ]);

      const summary = errorDisplay.formatSummary();
      expect(summary).toBe('2 errors, 1 warning, 1 info message');
    });

    it('should format summary with single error', () => {
      errorDisplay.addError({ type: 'error', message: 'Single error' });

      const summary = errorDisplay.formatSummary();
      expect(summary).toBe('1 error');
    });
  });

  describe('generateHTML', () => {

    it('should generate HTML for no errors', () => {
      const html = errorDisplay.generateHTML();
      expect(html).toContain('no-errors');
      expect(html).toContain('No errors or warnings');
    });

    it('should generate HTML with error summary', () => {
      errorDisplay.addErrors([
        { type: 'error', message: 'Error 1' },
        { type: 'warning', message: 'Warning 1' }
      ]);

      const html = errorDisplay.generateHTML();
      expect(html).toContain('error-display');
      expect(html).toContain('error-summary');
      expect(html).toContain('1 errors');
      expect(html).toContain('1 warnings');
    });
  });

  describe('static factory methods', () => {
    describe('fromValidationResults', () => {
      it('should create error messages from validation results', () => {
        const validations = [
          { type: 'error', message: 'Validation error', line: 5 },
          { type: 'warning', message: 'Validation warning' }
        ];

        const errors = ErrorDisplay.fromValidationResults(validations);

        expect(errors).toHaveLength(2);
        expect(errors[0].type).toBe('error');
        expect(errors[0].message).toBe('Validation error');
        expect(errors[0].line).toBe(5);
        expect(errors[1].type).toBe('warning');
        expect(errors[1].message).toBe('Validation warning');
      });
    });

    describe('createUnsupportedFeatureError', () => {
      it('should create unsupported feature error', () => {
        const error = ErrorDisplay.createUnsupportedFeatureError('CustomPaint', 10);

        expect(error.type).toBe('warning');
        expect(error.message).toBe('Unsupported feature: CustomPaint');
        expect(error.line).toBe(10);
        expect(error.suggestion).toContain('placeholder');
      });
    });

    describe('createSyntaxError', () => {
      it('should create syntax error', () => {
        const error = ErrorDisplay.createSyntaxError('Missing semicolon', 15, 20);

        expect(error.type).toBe('error');
        expect(error.message).toBe('Syntax error: Missing semicolon');
        expect(error.line).toBe(15);
        expect(error.column).toBe(20);
        expect(error.suggestion).toContain('fix the syntax error');
      });
    });

    describe('createWidgetError', () => {
      it('should create widget conversion error', () => {
        const error = ErrorDisplay.createWidgetError('Container', 'Invalid property', 25);

        expect(error.type).toBe('warning');
        expect(error.message).toBe('Widget conversion issue (Container): Invalid property');
        expect(error.line).toBe(25);
        expect(error.suggestion).toContain('default properties');
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complete error workflow', () => {
      // Add various types of errors
      errorDisplay.addError(ErrorDisplay.createSyntaxError('Missing brace', 10));
      errorDisplay.addError(ErrorDisplay.createUnsupportedFeatureError('CustomPaint', 20));
      errorDisplay.addError(ErrorDisplay.createWidgetError('Container', 'Invalid color', 30));

      // Check counts
      const counts = errorDisplay.getErrorCounts();
      expect(counts.errors).toBe(1);
      expect(counts.warnings).toBe(2);
      expect(counts.total).toBe(3);

      // Check summary
      const summary = errorDisplay.formatSummary();
      expect(summary).toBe('1 error, 2 warnings');

      // Check grouped errors
      const grouped = errorDisplay.getErrorsByType();
      expect(grouped.errors[0].message).toContain('Syntax error');
      expect(grouped.warnings[0].message).toContain('Unsupported feature');
      expect(grouped.warnings[1].message).toContain('Widget conversion issue');
    });
  });
});
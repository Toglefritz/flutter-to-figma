import { FileHandler, FileValidationResult, ValidationItem } from '../file-handler';

// Mock FileReader for Node.js environment
const mockFileReader = {
  onload: null as ((event: any) => void) | null,
  onerror: null as (() => void) | null,
  result: null as string | null,
  readAsText: jest.fn()
};

// Mock global FileReader
(global as any).FileReader = jest.fn(() => mockFileReader);

describe('FileHandler', () => {
  let fileHandler: FileHandler;

  beforeEach(() => {
    fileHandler = new FileHandler();
  });

  describe('validateFile', () => {
    it('should validate a valid Dart file', () => {
      const mockFile = new File(['test content'], 'test.dart', { type: 'text/plain' });
      
      const result = fileHandler.validateFile(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.validations).toHaveLength(2);
      expect(result.validations[0].type).toBe('success');
      expect(result.validations[0].message).toBe('Valid Dart file format');
    });

    it('should reject non-Dart files', () => {
      const mockFile = new File(['test content'], 'test.js', { type: 'text/javascript' });
      
      const result = fileHandler.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.validations.some(v => v.type === 'error' && v.message.includes('Unsupported file type'))).toBe(true);
    });

    it('should reject files that are too large', () => {
      // Create a mock file that's larger than 5MB
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const mockFile = new File([largeContent], 'large.dart', { type: 'text/plain' });
      
      const result = fileHandler.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.validations.some(v => v.type === 'error' && v.message.includes('exceeds'))).toBe(true);
    });

    it('should reject empty files', () => {
      const mockFile = new File([''], 'empty.dart', { type: 'text/plain' });
      
      const result = fileHandler.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.validations.some(v => v.type === 'error' && v.message === 'File is empty')).toBe(true);
    });
  });

  describe('validateDartContent', () => {
    it('should validate content with Flutter widgets', () => {
      const content = `
        import 'package:flutter/material.dart';
        
        class MyWidget extends StatelessWidget {
          @override
          Widget build(BuildContext context) {
            return Container(
              child: Text('Hello World'),
            );
          }
        }
      `;
      
      const result = fileHandler.validateDartContent(content, 'test.dart');
      
      expect(result.isValid).toBe(true);
      expect(result.validations.some(v => v.type === 'success' && v.message.includes('Flutter widget'))).toBe(true);
    });

    it('should detect theme usage', () => {
      const content = `
        Container(
          color: Theme.of(context).primaryColor,
          child: Text('Themed text'),
        )
      `;
      
      const result = fileHandler.validateDartContent(content, 'test.dart');
      
      expect(result.validations.some(v => v.message.includes('Theme usage detected'))).toBe(true);
    });

    it('should detect unsupported features', () => {
      const content = `
        CustomPaint(
          painter: MyCustomPainter(),
        )
      `;
      
      const result = fileHandler.validateDartContent(content, 'test.dart');
      
      expect(result.validations.some(v => v.type === 'warning' && v.message.includes('CustomPaint'))).toBe(true);
    });

    it('should detect syntax errors', () => {
      const content = `
        Container(
          child: Text('Hello World'
        // Missing closing parenthesis
      `;
      
      const result = fileHandler.validateDartContent(content, 'test.dart');
      
      expect(result.isValid).toBe(false);
      expect(result.validations.some(v => v.type === 'error' && v.message.includes('Unmatched'))).toBe(true);
    });

    it('should handle empty content', () => {
      const result = fileHandler.validateDartContent('', 'test.dart');
      
      expect(result.isValid).toBe(false);
      expect(result.validations.some(v => v.type === 'error' && v.message === 'File content is empty')).toBe(true);
    });
  });

  describe('createFilePreview', () => {
    it('should create preview for short content', () => {
      const content = 'Short content';
      const mockFile = new File([content], 'test.dart', { type: 'text/plain' });
      
      const preview = fileHandler.createFilePreview(mockFile, content);
      
      expect(preview.name).toBe('test.dart');
      expect(preview.content).toBe(content);
      expect(preview.preview).toBe(content);
    });

    it('should truncate long content in preview', () => {
      const longContent = 'x'.repeat(1000);
      const mockFile = new File([longContent], 'test.dart', { type: 'text/plain' });
      
      const preview = fileHandler.createFilePreview(mockFile, longContent);
      
      expect(preview.content).toBe(longContent);
      expect(preview.preview).toHaveLength(503); // 500 chars + '...'
      expect(preview.preview.endsWith('...')).toBe(true);
    });
  });

  describe('readFileAsText', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should read file content as text', async () => {
      const content = 'Test file content';
      const mockFile = new File([content], 'test.dart', { type: 'text/plain' });
      
      // Mock successful file reading
      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          mockFileReader.onload?.({ target: { result: content } });
        }, 0);
      });
      
      const result = await fileHandler.readFileAsText(mockFile);
      
      expect(result).toBe(content);
    });

    it('should handle file reading errors', async () => {
      const mockFile = new File([''], 'error.dart', { type: 'text/plain' });
      
      // Mock file reading error
      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          mockFileReader.onerror?.();
        }, 0);
      });
      
      await expect(fileHandler.readFileAsText(mockFile)).rejects.toThrow('File reading error occurred');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(fileHandler.formatFileSize(0)).toBe('0 Bytes');
      expect(fileHandler.formatFileSize(1024)).toBe('1 KB');
      expect(fileHandler.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(fileHandler.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('detectFlutterWidgets', () => {
    it('should detect common Flutter widgets', () => {
      const content = `
        Container(
          child: Row(
            children: [
              Text('Hello'),
              ElevatedButton(onPressed: () {}, child: Text('Click')),
            ],
          ),
        )
      `;
      
      const result = fileHandler.validateDartContent(content, 'test.dart');
      const widgetValidation = result.validations.find(v => v.message.includes('Flutter widget'));
      
      expect(widgetValidation).toBeDefined();
      expect(widgetValidation?.message).toContain('Container');
      expect(widgetValidation?.message).toContain('Row');
      expect(widgetValidation?.message).toContain('Text');
    });
  });

  describe('integration tests', () => {
    it('should handle complete file upload workflow', async () => {
      const content = `
        import 'package:flutter/material.dart';
        
        class MyApp extends StatelessWidget {
          @override
          Widget build(BuildContext context) {
            return MaterialApp(
              theme: ThemeData(
                primarySwatch: Colors.blue,
              ),
              home: Scaffold(
                appBar: AppBar(title: Text('My App')),
                body: Container(
                  color: Theme.of(context).primaryColor,
                  child: Column(
                    children: [
                      Text('Hello World'),
                      ElevatedButton(
                        onPressed: () {},
                        child: Text('Click me'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }
        }
      `;
      
      const mockFile = new File([content], 'my_app.dart', { type: 'text/plain' });
      
      // Step 1: Validate file
      const fileValidation = fileHandler.validateFile(mockFile);
      expect(fileValidation.isValid).toBe(true);
      
      // Step 2: Read content (mock the file reading)
      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          mockFileReader.onload?.({ target: { result: content } });
        }, 0);
      });
      
      const readContent = await fileHandler.readFileAsText(mockFile);
      expect(readContent).toBe(content);
      
      // Step 3: Validate content
      const contentValidation = fileHandler.validateDartContent(readContent, mockFile.name);
      expect(contentValidation.isValid).toBe(true);
      
      // Step 4: Create preview
      const preview = fileHandler.createFilePreview(mockFile, readContent);
      expect(preview.name).toBe('my_app.dart');
      expect(preview.content).toBe(content);
      
      // Verify expected validations
      expect(contentValidation.validations.some(v => v.message.includes('Flutter widget'))).toBe(true);
      expect(contentValidation.validations.some(v => v.message.includes('Theme usage detected'))).toBe(true);
    });

    it('should handle file with errors gracefully', () => {
      const invalidContent = `
        Container(
          child: Text('Hello'
        // Missing closing parenthesis and brace
      `;
      
      const mockFile = new File([invalidContent], 'invalid.dart', { type: 'text/plain' });
      
      // File itself should be valid (correct extension, size)
      const fileValidation = fileHandler.validateFile(mockFile);
      expect(fileValidation.isValid).toBe(true);
      
      // But content should be invalid
      const contentValidation = fileHandler.validateDartContent(invalidContent, mockFile.name);
      expect(contentValidation.isValid).toBe(false);
      expect(contentValidation.validations.some(v => v.type === 'error')).toBe(true);
    });
  });
});
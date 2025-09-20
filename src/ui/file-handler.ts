// File handler implementation for Flutter/Dart file processing
export interface FileValidationResult {
  isValid: boolean;
  validations: ValidationItem[];
}

export interface ValidationItem {
  type: 'success' | 'warning' | 'error';
  message: string;
  line?: number;
}

export interface FilePreview {
  name: string;
  size: number;
  content: string;
  preview: string;
}

export class FileHandler {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly SUPPORTED_EXTENSIONS = ['.dart'];
  private readonly PREVIEW_LENGTH = 500;

  /**
   * Validates a file for Flutter/Dart processing
   */
  validateFile(file: File): FileValidationResult {
    const validations: ValidationItem[] = [];

    // Check file extension
    const hasValidExtension = this.SUPPORTED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (hasValidExtension) {
      validations.push({
        type: 'success',
        message: 'Valid Dart file format'
      });
    } else {
      validations.push({
        type: 'error',
        message: `Unsupported file type. Supported: ${this.SUPPORTED_EXTENSIONS.join(', ')}`
      });
    }

    // Check file size
    if (file.size <= this.MAX_FILE_SIZE) {
      validations.push({
        type: 'success',
        message: `File size: ${this.formatFileSize(file.size)}`
      });
    } else {
      validations.push({
        type: 'error',
        message: `File size (${this.formatFileSize(file.size)}) exceeds ${this.formatFileSize(this.MAX_FILE_SIZE)} limit`
      });
    }

    // Check if file is empty
    if (file.size === 0) {
      validations.push({
        type: 'error',
        message: 'File is empty'
      });
    }

    const hasErrors = validations.some(v => v.type === 'error');

    return {
      isValid: !hasErrors,
      validations
    };
  }

  /**
   * Validates Dart file content for Flutter widgets
   */
  validateDartContent(content: string, fileName: string): FileValidationResult {
    const validations: ValidationItem[] = [];

    // Basic syntax checks
    if (content.trim().length === 0) {
      validations.push({
        type: 'error',
        message: 'File content is empty'
      });
      return { isValid: false, validations };
    }

    // Check for basic Dart syntax
    const hasDartSyntax = this.checkBasicDartSyntax(content);
    if (hasDartSyntax.isValid) {
      validations.push({
        type: 'success',
        message: 'Valid Dart syntax detected'
      });
    } else {
      validations.push({
        type: 'error',
        message: hasDartSyntax.message,
        line: hasDartSyntax.line
      });
    }

    // Check for Flutter widgets
    const flutterWidgets = this.detectFlutterWidgets(content);
    if (flutterWidgets.length > 0) {
      validations.push({
        type: 'success',
        message: `Found ${flutterWidgets.length} Flutter widget(s): ${flutterWidgets.slice(0, 3).join(', ')}${flutterWidgets.length > 3 ? '...' : ''}`
      });
    } else {
      validations.push({
        type: 'warning',
        message: 'No Flutter widgets detected. Make sure the file contains widget definitions.'
      });
    }

    // Check for theme usage
    const hasThemeUsage = this.detectThemeUsage(content);
    if (hasThemeUsage) {
      validations.push({
        type: 'success',
        message: 'Theme usage detected - will create Figma Variables'
      });
    }

    // Check for unsupported features
    const unsupportedFeatures = this.detectUnsupportedFeatures(content);
    unsupportedFeatures.forEach(feature => {
      validations.push({
        type: 'warning',
        message: `Unsupported feature detected: ${feature}. Will use fallback representation.`
      });
    });

    const hasErrors = validations.some(v => v.type === 'error');

    return {
      isValid: !hasErrors,
      validations
    };
  }

  /**
   * Creates a file preview with truncated content
   */
  createFilePreview(file: File, content: string): FilePreview {
    const preview = content.length > this.PREVIEW_LENGTH 
      ? content.substring(0, this.PREVIEW_LENGTH) + '...'
      : content;

    return {
      name: file.name,
      size: file.size,
      content,
      preview
    };
  }

  /**
   * Reads file content as text
   */
  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if FileReader is available (browser environment)
      if (typeof FileReader === 'undefined') {
        reject(new Error('FileReader not available in this environment'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading error occurred'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Formats file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Basic Dart syntax validation
   */
  private checkBasicDartSyntax(content: string): { isValid: boolean; message: string; line?: number } {
    const lines = content.split('\n');
    
    // Check for unmatched braces
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces, parentheses, and brackets
      for (const char of line) {
        switch (char) {
          case '{': braceCount++; break;
          case '}': braceCount--; break;
          case '(': parenCount++; break;
          case ')': parenCount--; break;
          case '[': bracketCount++; break;
          case ']': bracketCount--; break;
        }
        
        // Check for negative counts (closing before opening)
        if (braceCount < 0) {
          return {
            isValid: false,
            message: 'Unmatched closing brace',
            line: i + 1
          };
        }
        if (parenCount < 0) {
          return {
            isValid: false,
            message: 'Unmatched closing parenthesis',
            line: i + 1
          };
        }
        if (bracketCount < 0) {
          return {
            isValid: false,
            message: 'Unmatched closing bracket',
            line: i + 1
          };
        }
      }
    }
    
    // Check for unmatched opening symbols
    if (braceCount > 0) {
      return {
        isValid: false,
        message: 'Unmatched opening brace'
      };
    }
    if (parenCount > 0) {
      return {
        isValid: false,
        message: 'Unmatched opening parenthesis'
      };
    }
    if (bracketCount > 0) {
      return {
        isValid: false,
        message: 'Unmatched opening bracket'
      };
    }
    
    return {
      isValid: true,
      message: 'Basic syntax appears valid'
    };
  }

  /**
   * Detects Flutter widgets in the content
   */
  private detectFlutterWidgets(content: string): string[] {
    const commonWidgets = [
      'Container', 'Row', 'Column', 'Stack', 'Text', 'Image', 'Icon',
      'ElevatedButton', 'TextButton', 'OutlinedButton', 'IconButton',
      'Card', 'ListTile', 'AppBar', 'Scaffold', 'FloatingActionButton',
      'TextField', 'Checkbox', 'Radio', 'Switch', 'Slider',
      'Expanded', 'Flexible', 'Positioned', 'Align', 'Center',
      'Padding', 'Margin', 'SizedBox', 'AspectRatio', 'FractionallySizedBox',
      'ListView', 'GridView', 'SingleChildScrollView', 'PageView',
      'TabBar', 'TabBarView', 'BottomNavigationBar', 'Drawer'
    ];

    const foundWidgets: string[] = [];
    
    commonWidgets.forEach(widget => {
      // Look for widget constructor calls
      const regex = new RegExp(`\\b${widget}\\s*\\(`, 'g');
      if (regex.test(content)) {
        foundWidgets.push(widget);
      }
    });

    return foundWidgets;
  }

  /**
   * Detects theme usage in the content
   */
  private detectThemeUsage(content: string): boolean {
    const themePatterns = [
      /Theme\.of\(context\)/g,
      /ThemeData\s*\(/g,
      /ColorScheme\./g,
      /TextTheme\./g,
      /\.primaryColor/g,
      /\.accentColor/g,
      /\.backgroundColor/g,
      /\.textTheme/g
    ];

    return themePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detects unsupported features that will need fallbacks
   */
  private detectUnsupportedFeatures(content: string): string[] {
    const unsupportedFeatures: string[] = [];
    
    // Custom painters
    if (/CustomPainter|CustomPaint/.test(content)) {
      unsupportedFeatures.push('CustomPaint widgets');
    }
    
    // Animations
    if (/AnimationController|Tween|AnimatedBuilder/.test(content)) {
      unsupportedFeatures.push('Animations');
    }
    
    // Complex gestures
    if (/GestureDetector|InkWell|onTap|onPressed/.test(content)) {
      unsupportedFeatures.push('Interactive gestures');
    }
    
    // Platform-specific code
    if (/Platform\.is|defaultTargetPlatform/.test(content)) {
      unsupportedFeatures.push('Platform-specific code');
    }
    
    // Complex layouts
    if (/Transform|Matrix4|CustomScrollView/.test(content)) {
      unsupportedFeatures.push('Complex transforms/scrolling');
    }

    return unsupportedFeatures;
  }
}
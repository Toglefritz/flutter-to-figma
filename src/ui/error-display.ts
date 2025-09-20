// Error display implementation for showing conversion errors and warnings
export interface ErrorMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  file?: string;
  code?: string;
  suggestion?: string;
}

export interface ErrorDisplayOptions {
  showLineNumbers: boolean;
  maxErrors: number;
  groupByType: boolean;
}

export class ErrorDisplay {
  private errors: ErrorMessage[] = [];
  private options: ErrorDisplayOptions;

  constructor(options: Partial<ErrorDisplayOptions> = {}) {
    this.options = {
      showLineNumbers: true,
      maxErrors: 50,
      groupByType: true,
      ...options
    };
  }

  /**
   * Adds an error message to the display
   */
  addError(error: ErrorMessage): void {
    this.errors.push(error);
    
    // Limit the number of errors to prevent UI overflow
    if (this.errors.length > this.options.maxErrors) {
      this.errors = this.errors.slice(-this.options.maxErrors);
    }
  }

  /**
   * Adds multiple error messages
   */
  addErrors(errors: ErrorMessage[]): void {
    errors.forEach(error => this.addError(error));
  }

  /**
   * Clears all error messages
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Gets all error messages
   */
  getErrors(): ErrorMessage[] {
    return [...this.errors];
  }

  /**
   * Gets errors grouped by type
   */
  getErrorsByType(): { errors: ErrorMessage[]; warnings: ErrorMessage[]; info: ErrorMessage[] } {
    return {
      errors: this.errors.filter(e => e.type === 'error'),
      warnings: this.errors.filter(e => e.type === 'warning'),
      info: this.errors.filter(e => e.type === 'info')
    };
  }

  /**
   * Gets error count by type
   */
  getErrorCounts(): { errors: number; warnings: number; info: number; total: number } {
    const grouped = this.getErrorsByType();
    return {
      errors: grouped.errors.length,
      warnings: grouped.warnings.length,
      info: grouped.info.length,
      total: this.errors.length
    };
  }

  /**
   * Formats an error message for display
   */
  formatError(error: ErrorMessage): string {
    let formatted = '';
    
    // Add file and line information if available
    if (error.file) {
      formatted += `${error.file}`;
      if (error.line) {
        formatted += `:${error.line}`;
        if (error.column) {
          formatted += `:${error.column}`;
        }
      }
      formatted += ' - ';
    } else if (error.line) {
      formatted += `Line ${error.line}`;
      if (error.column) {
        formatted += `, Column ${error.column}`;
      }
      formatted += ': ';
    }

    // Add the main message
    formatted += error.message;

    // Add error code if available
    if (error.code) {
      formatted += ` (${error.code})`;
    }

    return formatted;
  }

  /**
   * Formats all errors as a text summary
   */
  formatSummary(): string {
    if (this.errors.length === 0) {
      return 'No errors or warnings.';
    }

    const counts = this.getErrorCounts();
    let summary = '';

    if (counts.errors > 0) {
      summary += `${counts.errors} error${counts.errors > 1 ? 's' : ''}`;
    }

    if (counts.warnings > 0) {
      if (summary) summary += ', ';
      summary += `${counts.warnings} warning${counts.warnings > 1 ? 's' : ''}`;
    }

    if (counts.info > 0) {
      if (summary) summary += ', ';
      summary += `${counts.info} info message${counts.info > 1 ? 's' : ''}`;
    }

    return summary;
  }

  /**
   * Generates HTML for error display
   */
  generateHTML(): string {
    if (this.errors.length === 0) {
      return '<div class="no-errors">No errors or warnings.</div>';
    }

    let html = '<div class="error-display">';
    
    // Add summary
    const counts = this.getErrorCounts();
    html += `<div class="error-summary">`;
    html += `<span class="error-count ${counts.errors > 0 ? 'has-errors' : ''}">${counts.errors} errors</span>`;
    html += `<span class="warning-count ${counts.warnings > 0 ? 'has-warnings' : ''}">${counts.warnings} warnings</span>`;
    html += `<span class="info-count">${counts.info} info</span>`;
    html += `</div>`;

    if (this.options.groupByType) {
      html += this.generateGroupedHTML();
    } else {
      html += this.generateLinearHTML();
    }

    html += '</div>';
    return html;
  }

  /**
   * Generates HTML with errors grouped by type
   */
  private generateGroupedHTML(): string {
    let html = '';
    const grouped = this.getErrorsByType();

    // Show errors first
    if (grouped.errors.length > 0) {
      html += '<div class="error-group errors">';
      html += '<h4 class="error-group-title">Errors</h4>';
      grouped.errors.forEach(error => {
        html += this.generateErrorHTML(error);
      });
      html += '</div>';
    }

    // Then warnings
    if (grouped.warnings.length > 0) {
      html += '<div class="error-group warnings">';
      html += '<h4 class="error-group-title">Warnings</h4>';
      grouped.warnings.forEach(error => {
        html += this.generateErrorHTML(error);
      });
      html += '</div>';
    }

    // Finally info messages
    if (grouped.info.length > 0) {
      html += '<div class="error-group info">';
      html += '<h4 class="error-group-title">Information</h4>';
      grouped.info.forEach(error => {
        html += this.generateErrorHTML(error);
      });
      html += '</div>';
    }

    return html;
  }

  /**
   * Generates HTML with errors in chronological order
   */
  private generateLinearHTML(): string {
    let html = '<div class="error-list">';
    this.errors.forEach(error => {
      html += this.generateErrorHTML(error);
    });
    html += '</div>';
    return html;
  }

  /**
   * Generates HTML for a single error
   */
  private generateErrorHTML(error: ErrorMessage): string {
    let html = `<div class="error-item ${error.type}">`;
    
    // Error icon
    html += `<div class="error-icon">${this.getErrorIcon(error.type)}</div>`;
    
    // Error content
    html += '<div class="error-content">';
    
    // Location info
    if (error.file || error.line) {
      html += '<div class="error-location">';
      if (error.file) {
        html += `<span class="error-file">${this.escapeHtml(error.file)}</span>`;
      }
      if (error.line) {
        html += `<span class="error-line">Line ${error.line}</span>`;
        if (error.column) {
          html += `<span class="error-column">Col ${error.column}</span>`;
        }
      }
      html += '</div>';
    }
    
    // Main message
    html += `<div class="error-message">${this.escapeHtml(error.message)}</div>`;
    
    // Error code
    if (error.code) {
      html += `<div class="error-code">${this.escapeHtml(error.code)}</div>`;
    }
    
    // Suggestion
    if (error.suggestion) {
      html += `<div class="error-suggestion">💡 ${this.escapeHtml(error.suggestion)}</div>`;
    }
    
    html += '</div>'; // error-content
    html += '</div>'; // error-item
    
    return html;
  }

  /**
   * Gets the appropriate icon for an error type
   */
  private getErrorIcon(type: string): string {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  }

  /**
   * Escapes HTML characters
   */
  private escapeHtml(text: string): string {
    if (typeof document === 'undefined') {
      // Fallback for Node.js environment (testing)
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Creates error messages from parsing results
   */
  static fromParsingErrors(errors: any[]): ErrorMessage[] {
    return errors.map(error => ({
      type: error.severity === 'error' ? 'error' : 'warning',
      message: error.message || 'Unknown parsing error',
      line: error.line,
      column: error.column,
      file: error.file,
      code: error.code,
      suggestion: error.suggestion
    }));
  }

  /**
   * Creates error messages from validation results
   */
  static fromValidationResults(validations: any[]): ErrorMessage[] {
    return validations.map(validation => ({
      type: validation.type,
      message: validation.message,
      line: validation.line,
      suggestion: validation.suggestion
    }));
  }

  /**
   * Creates common error messages for unsupported features
   */
  static createUnsupportedFeatureError(feature: string, line?: number): ErrorMessage {
    return {
      type: 'warning',
      message: `Unsupported feature: ${feature}`,
      line,
      suggestion: 'This feature will be represented with a placeholder in Figma'
    };
  }

  /**
   * Creates syntax error messages
   */
  static createSyntaxError(message: string, line?: number, column?: number): ErrorMessage {
    return {
      type: 'error',
      message: `Syntax error: ${message}`,
      line,
      column,
      suggestion: 'Please fix the syntax error and try again'
    };
  }

  /**
   * Creates widget conversion error messages
   */
  static createWidgetError(widgetType: string, message: string, line?: number): ErrorMessage {
    return {
      type: 'warning',
      message: `Widget conversion issue (${widgetType}): ${message}`,
      line,
      suggestion: 'Widget will be converted with default properties'
    };
  }
}
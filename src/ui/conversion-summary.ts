// Conversion summary implementation for displaying conversion results
export interface ConversionStats {
  widgetsFound: number;
  widgetsConverted: number;
  componentsCreated: number;
  variablesCreated: number;
  framesCreated: number;
  textNodesCreated: number;
  unsupportedWidgets: number;
  processingTime: number; // in milliseconds
}

export interface CreatedElement {
  id: string;
  name: string;
  type: 'COMPONENT' | 'FRAME' | 'TEXT' | 'VARIABLE' | 'INSTANCE';
  sourceWidget?: string;
  sourceLine?: number;
  figmaNodeId?: string;
  parentId?: string;
  properties?: Record<string, any>;
}

export interface ConversionResult {
  success: boolean;
  stats: ConversionStats;
  elements: CreatedElement[];
  errors: number;
  warnings: number;
  startTime: number;
  endTime: number;
  fileName: string;
}

export class ConversionSummary {
  private result: ConversionResult | null = null;

  /**
   * Sets the conversion result
   */
  setResult(result: ConversionResult): void {
    this.result = result;
  }

  /**
   * Gets the current conversion result
   */
  getResult(): ConversionResult | null {
    return this.result;
  }

  /**
   * Clears the conversion result
   */
  clear(): void {
    this.result = null;
  }

  /**
   * Gets conversion statistics
   */
  getStats(): ConversionStats | null {
    return this.result?.stats || null;
  }

  /**
   * Gets created elements grouped by type
   */
  getElementsByType(): Record<string, CreatedElement[]> {
    if (!this.result) return {};

    const grouped: Record<string, CreatedElement[]> = {};
    
    this.result.elements.forEach(element => {
      if (!grouped[element.type]) {
        grouped[element.type] = [];
      }
      grouped[element.type].push(element);
    });

    return grouped;
  }

  /**
   * Gets elements that can be linked to in Figma
   */
  getLinkableElements(): CreatedElement[] {
    if (!this.result) return [];

    return this.result.elements.filter(element => 
      element.figmaNodeId && 
      (element.type === 'COMPONENT' || element.type === 'FRAME')
    );
  }

  /**
   * Formats the processing time in a human-readable format
   */
  formatProcessingTime(): string {
    if (!this.result) return '0ms';

    const totalTime = this.result.endTime - this.result.startTime;
    
    if (totalTime < 1000) {
      return `${totalTime}ms`;
    } else if (totalTime < 60000) {
      return `${(totalTime / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(totalTime / 60000);
      const seconds = ((totalTime % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Calculates conversion success rate
   */
  getSuccessRate(): number {
    if (!this.result || this.result.stats.widgetsFound === 0) return 0;

    return Math.round(
      (this.result.stats.widgetsConverted / this.result.stats.widgetsFound) * 100
    );
  }

  /**
   * Gets a summary message
   */
  getSummaryMessage(): string {
    if (!this.result) return 'No conversion results available.';

    const stats = this.result.stats;
    const successRate = this.getSuccessRate();

    if (!this.result.success) {
      return `Conversion failed. ${stats.widgetsConverted} of ${stats.widgetsFound} widgets processed.`;
    }

    if (successRate === 100) {
      return `Conversion completed successfully! All ${stats.widgetsFound} widgets converted.`;
    } else {
      return `Conversion completed with ${successRate}% success rate. ${stats.widgetsConverted} of ${stats.widgetsFound} widgets converted.`;
    }
  }

  /**
   * Generates HTML for the summary display
   */
  generateHTML(): string {
    if (!this.result) {
      return '<div class="conversion-summary empty">No conversion results to display.</div>';
    }

    let html = '<div class="conversion-summary">';

    // Header
    html += '<div class="summary-header">';
    html += `<h3>Conversion Summary</h3>`;
    html += `<div class="summary-status ${this.result.success ? 'success' : 'error'}">`;
    html += `${this.result.success ? '✅' : '❌'} ${this.getSummaryMessage()}`;
    html += '</div>';
    html += '</div>';

    // Stats overview
    html += this.generateStatsHTML();

    // Created elements
    if (this.result.elements.length > 0) {
      html += this.generateElementsHTML();
    }

    // Performance info
    html += this.generatePerformanceHTML();

    html += '</div>';
    return html;
  }

  /**
   * Generates HTML for statistics overview
   */
  private generateStatsHTML(): string {
    if (!this.result) return '';

    const stats = this.result.stats;
    
    let html = '<div class="summary-stats">';
    html += '<div class="stats-grid">';

    // Widgets
    html += '<div class="stat-item">';
    html += '<div class="stat-value">' + stats.widgetsFound + '</div>';
    html += '<div class="stat-label">Widgets Found</div>';
    html += '</div>';

    html += '<div class="stat-item">';
    html += '<div class="stat-value">' + stats.widgetsConverted + '</div>';
    html += '<div class="stat-label">Widgets Converted</div>';
    html += '</div>';

    // Components
    html += '<div class="stat-item">';
    html += '<div class="stat-value">' + stats.componentsCreated + '</div>';
    html += '<div class="stat-label">Components Created</div>';
    html += '</div>';

    // Variables
    html += '<div class="stat-item">';
    html += '<div class="stat-value">' + stats.variablesCreated + '</div>';
    html += '<div class="stat-label">Variables Created</div>';
    html += '</div>';

    // Frames
    html += '<div class="stat-item">';
    html += '<div class="stat-value">' + stats.framesCreated + '</div>';
    html += '<div class="stat-label">Frames Created</div>';
    html += '</div>';

    // Text nodes
    html += '<div class="stat-item">';
    html += '<div class="stat-value">' + stats.textNodesCreated + '</div>';
    html += '<div class="stat-label">Text Nodes</div>';
    html += '</div>';

    html += '</div>'; // stats-grid

    // Success rate
    const successRate = this.getSuccessRate();
    html += '<div class="success-rate">';
    html += '<div class="success-rate-bar">';
    html += `<div class="success-rate-fill" style="width: ${successRate}%"></div>`;
    html += '</div>';
    html += `<div class="success-rate-text">${successRate}% Success Rate</div>`;
    html += '</div>';

    html += '</div>'; // summary-stats
    return html;
  }

  /**
   * Generates HTML for created elements list
   */
  private generateElementsHTML(): string {
    if (!this.result) return '';

    const grouped = this.getElementsByType();
    
    let html = '<div class="summary-elements">';
    html += '<h4>Created Elements</h4>';

    // Show each type group
    Object.entries(grouped).forEach(([type, elements]) => {
      html += `<div class="element-group">`;
      html += `<div class="element-group-header">`;
      html += `<span class="element-type">${this.formatElementType(type)}</span>`;
      html += `<span class="element-count">${elements.length}</span>`;
      html += `</div>`;

      html += `<div class="element-list">`;
      elements.slice(0, 5).forEach(element => { // Show first 5 elements
        html += this.generateElementHTML(element);
      });

      if (elements.length > 5) {
        html += `<div class="element-item more">... and ${elements.length - 5} more</div>`;
      }

      html += `</div>`; // element-list
      html += `</div>`; // element-group
    });

    html += '</div>'; // summary-elements
    return html;
  }

  /**
   * Generates HTML for a single element
   */
  private generateElementHTML(element: CreatedElement): string {
    let html = '<div class="element-item">';
    
    // Element icon
    html += `<div class="element-icon">${this.getElementIcon(element.type)}</div>`;
    
    // Element info
    html += '<div class="element-info">';
    html += `<div class="element-name">${this.escapeHtml(element.name)}</div>`;
    
    if (element.sourceWidget) {
      html += `<div class="element-source">from ${element.sourceWidget}`;
      if (element.sourceLine) {
        html += ` (line ${element.sourceLine})`;
      }
      html += '</div>';
    }
    html += '</div>';

    // Link to Figma (if available)
    if (element.figmaNodeId) {
      html += `<div class="element-link">`;
      html += `<button class="link-button" onclick="parent.postMessage({pluginMessage: {type: 'focus-node', nodeId: '${element.figmaNodeId}'}}, '*')">`;
      html += `📍 View`;
      html += `</button>`;
      html += `</div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Generates HTML for performance information
   */
  private generatePerformanceHTML(): string {
    if (!this.result) return '';

    let html = '<div class="summary-performance">';
    html += '<div class="performance-item">';
    html += '<span class="performance-label">Processing Time:</span>';
    html += `<span class="performance-value">${this.formatProcessingTime()}</span>`;
    html += '</div>';

    html += '<div class="performance-item">';
    html += '<span class="performance-label">File:</span>';
    html += `<span class="performance-value">${this.escapeHtml(this.result.fileName)}</span>`;
    html += '</div>';

    if (this.result.errors > 0 || this.result.warnings > 0) {
      html += '<div class="performance-item">';
      html += '<span class="performance-label">Issues:</span>';
      html += '<span class="performance-value">';
      if (this.result.errors > 0) {
        html += `${this.result.errors} error${this.result.errors > 1 ? 's' : ''}`;
      }
      if (this.result.warnings > 0) {
        if (this.result.errors > 0) html += ', ';
        html += `${this.result.warnings} warning${this.result.warnings > 1 ? 's' : ''}`;
      }
      html += '</span>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Formats element type for display
   */
  private formatElementType(type: string): string {
    switch (type) {
      case 'COMPONENT': return 'Components';
      case 'FRAME': return 'Frames';
      case 'TEXT': return 'Text Nodes';
      case 'VARIABLE': return 'Variables';
      case 'INSTANCE': return 'Instances';
      default: return type;
    }
  }

  /**
   * Gets icon for element type
   */
  private getElementIcon(type: string): string {
    switch (type) {
      case 'COMPONENT': return '🧩';
      case 'FRAME': return '🖼️';
      case 'TEXT': return '📝';
      case 'VARIABLE': return '🎨';
      case 'INSTANCE': return '📋';
      default: return '📄';
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
   * Creates a conversion result from basic stats
   */
  static createResult(
    fileName: string,
    success: boolean,
    stats: ConversionStats,
    elements: CreatedElement[] = [],
    errors: number = 0,
    warnings: number = 0,
    startTime: number = Date.now(),
    endTime: number = Date.now()
  ): ConversionResult {
    return {
      success,
      stats,
      elements,
      errors,
      warnings,
      startTime,
      endTime,
      fileName
    };
  }

  /**
   * Creates empty stats
   */
  static createEmptyStats(): ConversionStats {
    return {
      widgetsFound: 0,
      widgetsConverted: 0,
      componentsCreated: 0,
      variablesCreated: 0,
      framesCreated: 0,
      textNodesCreated: 0,
      unsupportedWidgets: 0,
      processingTime: 0
    };
  }

  /**
   * Creates a sample element for testing
   */
  static createSampleElement(
    name: string,
    type: CreatedElement['type'],
    sourceWidget?: string,
    sourceLine?: number
  ): CreatedElement {
    return {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      sourceWidget,
      sourceLine,
      figmaNodeId: type === 'COMPONENT' || type === 'FRAME' ? `figma_${Date.now()}` : undefined
    };
  }
}
// Progress indicator implementation for showing conversion progress
export interface ProgressStep {
  id: string;
  name: string;
  description?: string;
  weight: number; // Relative weight for progress calculation
}

export interface ProgressState {
  currentStep: string;
  progress: number; // 0-100
  message: string;
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export class ProgressIndicator {
  private steps: ProgressStep[] = [];
  private currentStepIndex: number = 0;
  private currentStepProgress: number = 0;
  private state: ProgressState;
  private callbacks: ((state: ProgressState) => void)[] = [];

  constructor() {
    this.state = {
      currentStep: '',
      progress: 0,
      message: 'Ready',
      isComplete: false,
      hasError: false
    };
  }

  /**
   * Defines the steps for the progress indicator
   */
  setSteps(steps: ProgressStep[]): void {
    this.steps = steps;
    this.currentStepIndex = 0;
    this.currentStepProgress = 0;
    this.updateState();
  }

  /**
   * Starts the progress indicator
   */
  start(message: string = 'Starting...'): void {
    this.currentStepIndex = 0;
    this.currentStepProgress = 0;
    this.state = {
      currentStep: this.steps[0]?.id || '',
      progress: 0,
      message,
      isComplete: false,
      hasError: false
    };
    this.notifyCallbacks();
  }

  /**
   * Updates progress for the current step
   */
  updateStep(stepProgress: number, message?: string): void {
    this.currentStepProgress = Math.max(0, Math.min(100, stepProgress));
    
    if (message) {
      this.state.message = message;
    }
    
    this.updateState();
    this.notifyCallbacks();
  }

  /**
   * Moves to the next step
   */
  nextStep(message?: string): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.currentStepProgress = 0;
      
      const currentStep = this.steps[this.currentStepIndex];
      this.state.currentStep = currentStep.id;
      this.state.message = message || currentStep.description || currentStep.name;
      
      this.updateState();
      this.notifyCallbacks();
    }
  }

  /**
   * Completes the progress indicator
   */
  complete(message: string = 'Complete!'): void {
    this.currentStepIndex = this.steps.length - 1;
    this.currentStepProgress = 100;
    this.state = {
      currentStep: this.steps[this.currentStepIndex]?.id || '',
      progress: 100,
      message,
      isComplete: true,
      hasError: false
    };
    this.notifyCallbacks();
  }

  /**
   * Sets an error state
   */
  setError(errorMessage: string): void {
    this.state.hasError = true;
    this.state.errorMessage = errorMessage;
    this.state.message = `Error: ${errorMessage}`;
    this.notifyCallbacks();
  }

  /**
   * Resets the progress indicator
   */
  reset(): void {
    this.currentStepIndex = 0;
    this.currentStepProgress = 0;
    this.state = {
      currentStep: '',
      progress: 0,
      message: 'Ready',
      isComplete: false,
      hasError: false
    };
    this.notifyCallbacks();
  }

  /**
   * Gets the current state
   */
  getState(): ProgressState {
    return { ...this.state };
  }

  /**
   * Adds a callback for state changes
   */
  onStateChange(callback: (state: ProgressState) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Removes a callback
   */
  removeCallback(callback: (state: ProgressState) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Updates the overall progress state
   */
  private updateState(): void {
    if (this.steps.length === 0) {
      this.state.progress = 0;
      return;
    }

    // Calculate total weight
    const totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0);
    
    // Calculate progress for completed steps
    let completedWeight = 0;
    for (let i = 0; i < this.currentStepIndex; i++) {
      completedWeight += this.steps[i].weight;
    }
    
    // Add progress for current step
    const currentStep = this.steps[this.currentStepIndex];
    if (currentStep) {
      completedWeight += (currentStep.weight * this.currentStepProgress) / 100;
    }
    
    // Calculate overall progress percentage
    this.state.progress = Math.round((completedWeight / totalWeight) * 100);
    this.state.currentStep = currentStep?.id || '';
  }

  /**
   * Notifies all callbacks of state changes
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  /**
   * Generates HTML for progress display
   */
  generateHTML(): string {
    const state = this.getState();
    
    let html = '<div class="progress-indicator">';
    
    // Progress bar
    html += '<div class="progress-bar">';
    html += `<div class="progress-fill" style="width: ${state.progress}%"></div>`;
    html += '</div>';
    
    // Progress text
    html += `<div class="progress-text">${state.progress}% - ${this.escapeHtml(state.message)}</div>`;
    
    // Step indicators
    if (this.steps.length > 1) {
      html += '<div class="progress-steps">';
      this.steps.forEach((step, index) => {
        const isActive = index === this.currentStepIndex;
        const isComplete = index < this.currentStepIndex || state.isComplete;
        const stepClass = `progress-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`;
        
        html += `<div class="${stepClass}">`;
        html += `<div class="step-indicator">${isComplete ? '✓' : index + 1}</div>`;
        html += `<div class="step-name">${this.escapeHtml(step.name)}</div>`;
        html += '</div>';
      });
      html += '</div>';
    }
    
    // Error message
    if (state.hasError && state.errorMessage) {
      html += `<div class="progress-error">❌ ${this.escapeHtml(state.errorMessage)}</div>`;
    }
    
    html += '</div>';
    return html;
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
   * Creates default steps for Flutter conversion
   */
  static createFlutterConversionSteps(): ProgressStep[] {
    return [
      {
        id: 'validation',
        name: 'Validation',
        description: 'Validating Dart file...',
        weight: 10
      },
      {
        id: 'parsing',
        name: 'Parsing',
        description: 'Parsing Flutter widgets...',
        weight: 25
      },
      {
        id: 'analysis',
        name: 'Analysis',
        description: 'Analyzing widget tree...',
        weight: 20
      },
      {
        id: 'theme-extraction',
        name: 'Theme',
        description: 'Extracting theme data...',
        weight: 15
      },
      {
        id: 'figma-creation',
        name: 'Creation',
        description: 'Creating Figma elements...',
        weight: 25
      },
      {
        id: 'finalization',
        name: 'Finalization',
        description: 'Organizing and finalizing...',
        weight: 5
      }
    ];
  }

  /**
   * Creates a simple progress indicator for basic operations
   */
  static createSimpleProgress(): ProgressIndicator {
    const indicator = new ProgressIndicator();
    indicator.setSteps([
      {
        id: 'processing',
        name: 'Processing',
        description: 'Processing...',
        weight: 100
      }
    ]);
    return indicator;
  }
}
import { ProgressIndicator, ProgressStep, ProgressState } from '../progress-indicator';

describe('ProgressIndicator', () => {
  let progressIndicator: ProgressIndicator;
  let mockCallback: jest.Mock;

  const testSteps: ProgressStep[] = [
    { id: 'step1', name: 'Step 1', description: 'First step', weight: 30 },
    { id: 'step2', name: 'Step 2', description: 'Second step', weight: 50 },
    { id: 'step3', name: 'Step 3', description: 'Third step', weight: 20 }
  ];

  beforeEach(() => {
    progressIndicator = new ProgressIndicator();
    mockCallback = jest.fn();
    progressIndicator.onStateChange(mockCallback);
  });

  describe('setSteps', () => {
    it('should set steps and reset state', () => {
      progressIndicator.setSteps(testSteps);
      const state = progressIndicator.getState();

      expect(state.currentStep).toBe('step1');
      expect(state.progress).toBe(0);
      expect(state.isComplete).toBe(false);
    });
  });

  describe('start', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
    });

    it('should start progress with default message', () => {
      progressIndicator.start();
      const state = progressIndicator.getState();

      expect(state.currentStep).toBe('step1');
      expect(state.progress).toBe(0);
      expect(state.message).toBe('Starting...');
      expect(state.isComplete).toBe(false);
      expect(state.hasError).toBe(false);
    });

    it('should start progress with custom message', () => {
      progressIndicator.start('Custom start message');
      const state = progressIndicator.getState();

      expect(state.message).toBe('Custom start message');
    });

    it('should notify callbacks', () => {
      progressIndicator.start();
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        currentStep: 'step1',
        progress: 0,
        isComplete: false
      }));
    });
  });

  describe('updateStep', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
    });

    it('should update current step progress', () => {
      progressIndicator.updateStep(50, 'Half way through step 1');
      const state = progressIndicator.getState();

      expect(state.currentStep).toBe('step1');
      expect(state.message).toBe('Half way through step 1');
      // 30% weight * 50% progress = 15% overall
      expect(state.progress).toBe(15);
    });

    it('should clamp progress between 0 and 100', () => {
      progressIndicator.updateStep(-10);
      expect(progressIndicator.getState().progress).toBe(0);

      progressIndicator.updateStep(150);
      // 30% weight * 100% progress = 30% overall
      expect(progressIndicator.getState().progress).toBe(30);
    });

    it('should update message only if provided', () => {
      const originalMessage = progressIndicator.getState().message;
      progressIndicator.updateStep(25);
      
      expect(progressIndicator.getState().message).toBe(originalMessage);
    });
  });

  describe('nextStep', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
    });

    it('should move to next step', () => {
      progressIndicator.nextStep('Moving to step 2');
      const state = progressIndicator.getState();

      expect(state.currentStep).toBe('step2');
      expect(state.message).toBe('Moving to step 2');
      expect(state.progress).toBe(30); // First step completed (30% weight)
    });

    it('should use step description if no message provided', () => {
      progressIndicator.nextStep();
      const state = progressIndicator.getState();

      expect(state.message).toBe('Second step');
    });

    it('should not move beyond last step', () => {
      // Move to last step
      progressIndicator.nextStep();
      progressIndicator.nextStep();
      
      const beforeState = progressIndicator.getState();
      expect(beforeState.currentStep).toBe('step3');

      // Try to move beyond
      progressIndicator.nextStep();
      const afterState = progressIndicator.getState();
      
      expect(afterState.currentStep).toBe('step3');
    });
  });

  describe('complete', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
    });

    it('should complete progress', () => {
      progressIndicator.complete('All done!');
      const state = progressIndicator.getState();

      expect(state.progress).toBe(100);
      expect(state.message).toBe('All done!');
      expect(state.isComplete).toBe(true);
      expect(state.hasError).toBe(false);
    });

    it('should use default message if none provided', () => {
      progressIndicator.complete();
      const state = progressIndicator.getState();

      expect(state.message).toBe('Complete!');
    });
  });

  describe('setError', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
    });

    it('should set error state', () => {
      progressIndicator.setError('Something went wrong');
      const state = progressIndicator.getState();

      expect(state.hasError).toBe(true);
      expect(state.errorMessage).toBe('Something went wrong');
      expect(state.message).toBe('Error: Something went wrong');
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
      progressIndicator.updateStep(50);
    });

    it('should reset to initial state', () => {
      progressIndicator.reset();
      const state = progressIndicator.getState();

      expect(state.currentStep).toBe('');
      expect(state.progress).toBe(0);
      expect(state.message).toBe('Ready');
      expect(state.isComplete).toBe(false);
      expect(state.hasError).toBe(false);
    });
  });

  describe('callback management', () => {
    it('should add and remove callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      progressIndicator.onStateChange(callback1);
      progressIndicator.onStateChange(callback2);

      progressIndicator.setSteps(testSteps);
      progressIndicator.start();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      // Remove one callback
      progressIndicator.removeCallback(callback1);
      callback1.mockClear();
      callback2.mockClear();

      progressIndicator.updateStep(50);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      progressIndicator.onStateChange(errorCallback);
      progressIndicator.onStateChange(normalCallback);

      // Should not throw despite callback error
      expect(() => {
        progressIndicator.setSteps(testSteps);
        progressIndicator.start();
      }).not.toThrow();

      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('progress calculation', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
    });

    it('should calculate progress correctly across steps', () => {
      // Complete first step (30% weight)
      progressIndicator.updateStep(100);
      expect(progressIndicator.getState().progress).toBe(30);

      // Move to second step and complete 50%
      progressIndicator.nextStep();
      progressIndicator.updateStep(50);
      // 30% (first step) + 50% weight * 50% progress = 30% + 25% = 55%
      expect(progressIndicator.getState().progress).toBe(55);

      // Complete second step
      progressIndicator.updateStep(100);
      expect(progressIndicator.getState().progress).toBe(80); // 30% + 50%

      // Move to third step and complete
      progressIndicator.nextStep();
      progressIndicator.updateStep(100);
      expect(progressIndicator.getState().progress).toBe(100); // 30% + 50% + 20%
    });

    it('should handle empty steps', () => {
      const emptyIndicator = new ProgressIndicator();
      emptyIndicator.setSteps([]);
      emptyIndicator.start();

      expect(emptyIndicator.getState().progress).toBe(0);
    });
  });

  describe('generateHTML', () => {
    beforeEach(() => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
    });

    it('should generate HTML with progress bar', () => {
      progressIndicator.updateStep(50);
      const html = progressIndicator.generateHTML();

      expect(html).toContain('progress-indicator');
      expect(html).toContain('progress-bar');
      expect(html).toContain('progress-fill');
      expect(html).toContain('width: 15%'); // 30% weight * 50% = 15%
    });

    it('should generate HTML with step indicators', () => {
      const html = progressIndicator.generateHTML();

      expect(html).toContain('progress-steps');
      expect(html).toContain('Step 1');
      expect(html).toContain('Step 2');
      expect(html).toContain('Step 3');
    });

    it('should show error message in HTML', () => {
      progressIndicator.setError('Test error');
      const html = progressIndicator.generateHTML();

      expect(html).toContain('progress-error');
      expect(html).toContain('Test error');
    });
  });

  describe('static factory methods', () => {
    describe('createFlutterConversionSteps', () => {
      it('should create Flutter conversion steps', () => {
        const steps = ProgressIndicator.createFlutterConversionSteps();

        expect(steps).toHaveLength(6);
        expect(steps[0].id).toBe('validation');
        expect(steps[1].id).toBe('parsing');
        expect(steps[2].id).toBe('analysis');
        expect(steps[3].id).toBe('theme-extraction');
        expect(steps[4].id).toBe('figma-creation');
        expect(steps[5].id).toBe('finalization');

        // Check total weight is 100
        const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
        expect(totalWeight).toBe(100);
      });
    });

    describe('createSimpleProgress', () => {
      it('should create simple progress indicator', () => {
        const indicator = ProgressIndicator.createSimpleProgress();
        const state = indicator.getState();

        expect(state.currentStep).toBe('processing');
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow', () => {
      const states: ProgressState[] = [];
      progressIndicator.onStateChange((state) => {
        states.push({ ...state });
      });

      // Set up and start
      progressIndicator.setSteps(testSteps);
      progressIndicator.start('Starting workflow');

      // Progress through steps
      progressIndicator.updateStep(50, 'Half way step 1');
      progressIndicator.nextStep('Moving to step 2');
      progressIndicator.updateStep(100, 'Completed step 2');
      progressIndicator.nextStep('Final step');
      progressIndicator.complete('All done!');

      // Verify state progression
      expect(states).toHaveLength(6);
      expect(states[0].progress).toBe(0);
      expect(states[1].progress).toBe(15); // 30% * 50%
      expect(states[2].progress).toBe(30); // First step complete
      expect(states[3].progress).toBe(80); // First + second steps
      expect(states[4].progress).toBe(80); // Moving to third step
      expect(states[5].progress).toBe(100); // Complete
      expect(states[5].isComplete).toBe(true);
    });

    it('should handle error during workflow', () => {
      progressIndicator.setSteps(testSteps);
      progressIndicator.start();
      progressIndicator.updateStep(25);
      
      progressIndicator.setError('Network error');
      const state = progressIndicator.getState();

      expect(state.hasError).toBe(true);
      expect(state.errorMessage).toBe('Network error');
      expect(state.progress).toBe(8); // 30% * 25% = 7.5% rounded to 8%
    });
  });
});
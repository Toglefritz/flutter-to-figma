// Flutter → Figma Plugin Main Entry Point
// This file holds the main code for the plugin with access to the Figma document

import { GracefulErrorHandler } from './src/errors';
import { FileHandler } from './src/ui/file-handler';
import { ErrorDisplay } from './src/ui/error-display';
import { ProgressIndicator } from './src/ui/progress-indicator';
import { ConversionSummary } from './src/ui/conversion-summary';

// Initialize error handler, file handler, and UI components
const errorHandler = new GracefulErrorHandler();
const fileHandler = new FileHandler();
const errorDisplay = new ErrorDisplay();
const progressIndicator = new ProgressIndicator();
const conversionSummary = new ConversionSummary();

// Plugin main function
async function main() {
  try {
    // Show plugin UI for file upload
    figma.showUI(__html__, { 
      width: 400, 
      height: 600,
      title: 'Flutter → Figma Converter'
    });

    // Listen for messages from UI
    figma.ui.onmessage = async (msg) => {
      try {
        switch (msg.type) {
          case 'validate-dart-file':
            await handleDartFileValidation(msg.content, msg.fileName);
            break;
          case 'convert-flutter-code':
            await handleFlutterCodeConversion(msg.content, msg.fileName);
            break;
          case 'close-plugin':
            figma.closePlugin();
            break;
          default:
            console.warn('Unknown message type:', msg.type);
        }
      } catch (error) {
        errorHandler.handleError(error as any);
        figma.ui.postMessage({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    };

  } catch (error) {
    errorHandler.handleError(error as any);
    figma.closePlugin('An error occurred while initializing the plugin');
  }
}

// Handle Dart file validation
async function handleDartFileValidation(content: string, fileName: string) {
  try {
    // Clear previous errors
    errorDisplay.clearErrors();
    
    // Set up progress
    progressIndicator.setSteps([
      { id: 'validation', name: 'Validation', description: 'Validating Dart content...', weight: 100 }
    ]);
    progressIndicator.start('Starting validation...');

    // Send progress update
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: 20,
      text: 'Validating Dart content...'
    });

    // Validate the Dart content
    const validationResult = fileHandler.validateDartContent(content, fileName);
    
    // Add validation results to error display
    const errorMessages = ErrorDisplay.fromValidationResults(validationResult.validations);
    errorDisplay.addErrors(errorMessages);
    
    // Update progress
    progressIndicator.updateStep(80, 'Processing validation results...');
    
    // Send validation results back to UI
    figma.ui.postMessage({
      type: 'validation-result',
      validations: validationResult.validations,
      isValid: validationResult.isValid,
      errorSummary: errorDisplay.formatSummary(),
      errorCount: errorDisplay.getErrorCounts()
    });

    // Complete progress
    progressIndicator.complete('Validation complete');
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: 100,
      text: 'Validation complete'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    
    // Add error to display
    errorDisplay.addError({
      type: 'error',
      message: `Validation failed: ${errorMessage}`,
      file: fileName
    });
    
    // Set progress error
    progressIndicator.setError(errorMessage);
    
    figma.ui.postMessage({
      type: 'error',
      message: `Validation failed: ${errorMessage}`,
      errorSummary: errorDisplay.formatSummary()
    });
  }
}

// Handle Flutter code conversion (placeholder for now)
async function handleFlutterCodeConversion(content: string, fileName: string) {
  try {
    // Clear previous errors and set up progress
    errorDisplay.clearErrors();
    progressIndicator.setSteps(ProgressIndicator.createFlutterConversionSteps());
    progressIndicator.start('Starting conversion...');

    // Send initial progress
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: 5,
      text: 'Starting conversion...'
    });

    // Step 1: Validation
    progressIndicator.updateStep(50, 'Validating file...');
    const validationResult = fileHandler.validateDartContent(content, fileName);
    
    if (!validationResult.isValid) {
      const errorMessages = ErrorDisplay.fromValidationResults(validationResult.validations);
      errorDisplay.addErrors(errorMessages);
      
      const errorMessage = 'File validation failed. Please fix errors before converting.';
      progressIndicator.setError(errorMessage);
      
      figma.ui.postMessage({
        type: 'error',
        message: errorMessage,
        errorSummary: errorDisplay.formatSummary(),
        errorCount: errorDisplay.getErrorCounts()
      });
      return;
    }

    // Add any warnings from validation
    const warningMessages = ErrorDisplay.fromValidationResults(
      validationResult.validations.filter(v => v.type === 'warning')
    );
    errorDisplay.addErrors(warningMessages);

    // Step 2: Parsing
    progressIndicator.nextStep('Parsing Flutter widgets...');
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: progressIndicator.getState().progress,
      text: 'Parsing Flutter widgets...'
    });

    // Simulate parsing work
    await new Promise(resolve => setTimeout(resolve, 500));
    progressIndicator.updateStep(100);

    // Step 3: Analysis
    progressIndicator.nextStep('Analyzing widget tree...');
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: progressIndicator.getState().progress,
      text: 'Analyzing widget tree...'
    });

    // This will be implemented in subsequent tasks
    console.log('Flutter code received for conversion:', fileName, content.length, 'characters');
    
    // Simulate analysis work
    await new Promise(resolve => setTimeout(resolve, 300));
    progressIndicator.updateStep(100);

    // Step 4: Theme extraction
    progressIndicator.nextStep('Extracting theme data...');
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: progressIndicator.getState().progress,
      text: 'Extracting theme data...'
    });

    await new Promise(resolve => setTimeout(resolve, 200));
    progressIndicator.updateStep(100);

    // Step 5: Figma creation
    progressIndicator.nextStep('Creating Figma elements...');
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: progressIndicator.getState().progress,
      text: 'Creating Figma elements...'
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    progressIndicator.updateStep(100);

    // Step 6: Finalization
    progressIndicator.nextStep('Organizing and finalizing...');
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: progressIndicator.getState().progress,
      text: 'Organizing and finalizing...'
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Complete
    progressIndicator.complete('Conversion complete!');
    
    // Create conversion summary
    const endTime = Date.now();
    const stats = ConversionSummary.createEmptyStats();
    // TODO: These will be populated by actual conversion logic in future tasks
    stats.widgetsFound = 5; // Mock data for demonstration
    stats.widgetsConverted = 4;
    stats.componentsCreated = 2;
    stats.variablesCreated = 3;
    stats.framesCreated = 6;
    stats.textNodesCreated = 8;
    stats.unsupportedWidgets = 1;

    const sampleElements = [
      ConversionSummary.createSampleElement('MyButton', 'COMPONENT', 'ElevatedButton', 15),
      ConversionSummary.createSampleElement('MainContainer', 'FRAME', 'Container', 8),
      ConversionSummary.createSampleElement('Title Text', 'TEXT', 'Text', 12),
      ConversionSummary.createSampleElement('Primary Color', 'VARIABLE', 'ThemeData'),
      ConversionSummary.createSampleElement('Card Component', 'COMPONENT', 'Card', 25)
    ];

    const conversionResult = ConversionSummary.createResult(
      fileName,
      true,
      stats,
      sampleElements,
      errorDisplay.getErrorCounts().errors,
      errorDisplay.getErrorCounts().warnings,
      progressIndicator.getState().progress, // Using progress as mock start time
      endTime
    );

    conversionSummary.setResult(conversionResult);
    
    // Send completion message with summary
    figma.ui.postMessage({
      type: 'conversion-complete',
      message: 'Code structure analysis complete. Full implementation coming in next tasks.',
      summary: {
        widgetsFound: stats.widgetsFound,
        componentsCreated: stats.componentsCreated,
        variablesCreated: stats.variablesCreated
      },
      summaryHTML: conversionSummary.generateHTML(),
      errorSummary: errorDisplay.formatSummary(),
      errorCount: errorDisplay.getErrorCounts()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
    
    // Add error to display
    errorDisplay.addError({
      type: 'error',
      message: `Conversion failed: ${errorMessage}`,
      file: fileName
    });
    
    // Set progress error
    progressIndicator.setError(errorMessage);
    
    figma.ui.postMessage({
      type: 'error',
      message: `Conversion failed: ${errorMessage}`,
      errorSummary: errorDisplay.formatSummary(),
      errorCount: errorDisplay.getErrorCounts()
    });
  }
}

// Start the plugin
main();

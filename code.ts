// Flutter → Figma Plugin Main Entry Point
// This file holds the main code for the plugin with access to the Figma document

import { GracefulErrorHandler } from './src/errors';

// Initialize error handler
const errorHandler = new GracefulErrorHandler();

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
          case 'convert-flutter-code':
            await handleFlutterCodeConversion(msg.code);
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

// Handle Flutter code conversion (placeholder for now)
async function handleFlutterCodeConversion(code: string) {
  // This will be implemented in subsequent tasks
  console.log('Flutter code received:', code);
  
  // For now, just show a success message
  figma.ui.postMessage({
    type: 'conversion-complete',
    message: 'Code structure analysis complete. Implementation coming in next tasks.'
  });
}

// Start the plugin
main();

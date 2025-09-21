import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Global error handler for the Flutter Examples application.
///
/// This utility class provides centralized error handling and logging
/// functionality for the entire application. It handles both caught
/// exceptions and uncaught Flutter framework errors, ensuring that
/// users receive appropriate feedback and developers get detailed
/// error information for debugging.
///
/// Key Features:
/// * Centralized error logging with debug information
/// * User-friendly error messages for different error types
/// * Development vs production error handling modes
/// * Integration with Flutter's error reporting system
/// * Graceful degradation for recoverable errors
///
/// Usage:
/// ```dart
/// // Handle caught exceptions
/// try {
///   riskyOperation();
/// } catch (error, stackTrace) {
///   ErrorHandler.handleError(error, stackTrace);
/// }
///
/// // Initialize global error handling
/// ErrorHandler.initialize();
/// ```
class ErrorHandler {
  /// Initializes global error handling for the application.
  ///
  /// This method sets up Flutter's global error handlers to catch
  /// uncaught exceptions and framework errors. It should be called
  /// early in the application lifecycle, typically in main().
  ///
  /// The handler distinguishes between debug and release modes:
  /// * Debug mode: Shows detailed error information for developers
  /// * Release mode: Shows user-friendly messages and logs errors
  static void initialize() {
    // Handle Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      _logError(
        'Flutter Framework Error',
        details.exception,
        details.stack,
        details.context?.toString(),
      );
    };

    // Handle errors outside of Flutter framework
    PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
      _logError('Platform Error', error, stack, null);
      return true;
    };
  }

  /// Handles application-specific errors with appropriate user feedback.
  ///
  /// This method processes caught exceptions and provides appropriate
  /// user feedback based on the error type. It logs detailed information
  /// for debugging while showing user-friendly messages in the UI.
  ///
  /// Parameters:
  /// * [error] - The exception or error object that occurred
  /// * [stackTrace] - Stack trace information for debugging
  /// * [context] - Optional build context for showing user feedback
  /// * [userMessage] - Optional custom message to show to users
  ///
  /// Error Types Handled:
  /// * Network errors: Connection and timeout issues
  /// * Validation errors: Invalid user input
  /// * State errors: Invalid application state
  /// * Generic errors: Fallback handling for unknown errors
  static void handleError(
    Object error,
    StackTrace? stackTrace, {
    BuildContext? context,
    String? userMessage,
  }) {
    // Log the error for debugging
    _logError('Application Error', error, stackTrace, null);

    // Show user-friendly feedback if context is available
    if (context != null && context.mounted) {
      final String message = userMessage ?? _getUserFriendlyMessage(error);
      _showErrorSnackBar(context, message);
    }
  }

  /// Handles validation errors with field-specific feedback.
  ///
  /// This specialized error handler is designed for form validation
  /// and user input errors. It provides specific feedback about
  /// what went wrong and how users can fix the issue.
  ///
  /// Parameters:
  /// * [fieldName] - Name of the field that failed validation
  /// * [errorMessage] - Specific validation error message
  /// * [context] - Build context for showing user feedback
  /// * [value] - The invalid value that caused the error
  static void handleValidationError(
    String fieldName,
    String errorMessage,
    BuildContext context, {
    dynamic value,
  }) {
    final String logMessage = 'Validation Error in $fieldName: $errorMessage';
    if (value != null) {
      debugPrint('$logMessage (Value: $value)');
    } else {
      debugPrint(logMessage);
    }

    if (context.mounted) {
      _showErrorSnackBar(
        context,
        'Invalid $fieldName: $errorMessage',
        duration: const Duration(seconds: 4),
      );
    }
  }

  /// Handles calculator-specific errors with appropriate feedback.
  ///
  /// This method handles mathematical errors that can occur during
  /// calculator operations, such as division by zero or overflow
  /// conditions. It provides clear feedback to users about what
  /// went wrong and how to recover.
  ///
  /// Parameters:
  /// * [operation] - The mathematical operation that failed
  /// * [error] - The specific error that occurred
  /// * [context] - Build context for showing user feedback
  static void handleCalculatorError(
    String operation,
    String error,
    BuildContext context,
  ) {
    debugPrint('Calculator Error during $operation: $error');

    if (context.mounted) {
      _showErrorSnackBar(
        context,
        'Calculator Error: $error',
        duration: const Duration(seconds: 3),
      );
    }
  }

  /// Logs error information with appropriate detail level.
  ///
  /// This private method handles the actual logging of error information
  /// with different detail levels based on the build mode. In debug mode,
  /// it provides full stack traces and context information. In release
  /// mode, it logs essential information without overwhelming detail.
  ///
  /// Parameters:
  /// * [category] - Category of error for organization
  /// * [error] - The error object or exception
  /// * [stackTrace] - Stack trace information
  /// * [additionalContext] - Additional context information
  static void _logError(
    String category,
    Object error,
    StackTrace? stackTrace,
    String? additionalContext,
  ) {
    if (kDebugMode) {
      debugPrint('=== $category ===');
      debugPrint('Error: $error');
      if (additionalContext != null) {
        debugPrint('Context: $additionalContext');
      }
      if (stackTrace != null) {
        debugPrint('Stack Trace:\n$stackTrace');
      }
      debugPrint('==================');
    } else {
      // In release mode, log essential information only
      debugPrint('$category: ${error.toString()}');
    }
  }

  /// Generates user-friendly error messages based on error type.
  ///
  /// This method analyzes the error object and returns an appropriate
  /// user-friendly message that explains what went wrong without
  /// exposing technical details or sensitive information.
  ///
  /// Parameters:
  /// * [error] - The error object to analyze
  ///
  /// Returns a user-friendly error message string.
  static String _getUserFriendlyMessage(Object error) {
    final String errorString = error.toString().toLowerCase();

    if (errorString.contains('network') || errorString.contains('connection')) {
      return 'Network connection error. Please check your internet connection.';
    }

    if (errorString.contains('timeout')) {
      return 'Operation timed out. Please try again.';
    }

    if (errorString.contains('format') || errorString.contains('parse')) {
      return 'Invalid data format. Please check your input.';
    }

    if (errorString.contains('permission')) {
      return 'Permission denied. Please check app permissions.';
    }

    if (errorString.contains('storage') || errorString.contains('disk')) {
      return 'Storage error. Please check available space.';
    }

    // Generic fallback message
    return 'An unexpected error occurred. Please try again.';
  }

  /// Shows an error message to the user via SnackBar.
  ///
  /// This method displays user-friendly error messages using Material
  /// Design SnackBar components. The SnackBar includes appropriate
  /// styling and duration based on the error severity.
  ///
  /// Parameters:
  /// * [context] - Build context for showing the SnackBar
  /// * [message] - User-friendly error message to display
  /// * [duration] - How long to show the message (default: 3 seconds)
  static void _showErrorSnackBar(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.error_outline,
              color: Colors.white,
              size: 20.0,
            ),
            const Padding(padding: EdgeInsets.only(left: 8.0)),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade600,
        duration: duration,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8.0),
        ),
        action: SnackBarAction(
          label: 'Dismiss',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
  }
}

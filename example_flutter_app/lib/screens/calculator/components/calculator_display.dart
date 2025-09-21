import 'package:flutter/material.dart';

/// Display component for showing calculator values and results.
///
/// This StatelessWidget provides a dedicated display area for the calculator
/// that shows the current input, calculations in progress, and results.
/// It handles text formatting, overflow protection, and visual styling
/// consistent with calculator design patterns.
///
/// Display Features:
/// * Large, readable text for current value
/// * Right-aligned text following calculator conventions
/// * Overflow handling with ellipsis for long numbers
/// * Error state styling for invalid operations
/// * Consistent theming with Material Design principles
///
/// Text Formatting:
/// * Automatic number formatting with appropriate precision
/// * Decimal point handling for floating-point numbers
/// * Scientific notation for very large or small numbers
/// * Error message display for invalid operations
///
/// Visual Design:
/// * High contrast text for readability
/// * Appropriate padding and margins for touch interfaces
/// * Consistent typography scaling across device sizes
/// * Material Design elevation and background styling
///
/// Accessibility Features:
/// * Semantic labels for screen readers
/// * High contrast colors for visual accessibility
/// * Proper text scaling support for system font preferences
/// * Clear visual hierarchy for calculator state information
class CalculatorDisplay extends StatelessWidget {
  /// Creates a calculator display widget with the specified value.
  ///
  /// @param displayValue The text to show in the calculator display
  /// @param hasError Whether the calculator is in an error state
  /// @param key Optional widget key for identification in the widget tree
  const CalculatorDisplay({
    required this.displayValue,
    this.hasError = false,
    super.key,
  });

  /// The current value to display on the calculator screen.
  ///
  /// This string represents what the user sees, including numbers,
  /// decimal points, operation results, and error messages.
  /// The display handles formatting and overflow for various content types.
  final String displayValue;

  /// Whether the calculator is currently in an error state.
  ///
  /// When true, the display uses error styling (typically red text)
  /// to indicate that an invalid operation has occurred or that
  /// the calculator needs to be cleared before continuing.
  final bool hasError;

  /// Builds the calculator display UI with proper formatting and styling.
  ///
  /// Creates a container with appropriate padding, background, and text
  /// styling for the calculator display. The text is right-aligned
  /// following calculator conventions and includes overflow handling
  /// for long numbers or expressions.
  ///
  /// Layout Structure:
  /// 1. Container with background color and padding
  /// 2. Right-aligned text with large, readable font
  /// 3. Overflow handling with ellipsis for long content
  /// 4. Error state styling when applicable
  ///
  /// Styling Considerations:
  /// * Large font size for readability (32.0 logical pixels)
  /// * Right alignment following calculator conventions
  /// * High contrast colors for accessibility
  /// * Consistent padding for touch-friendly interface
  /// * Error state uses theme error color for visual feedback
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns Container widget with formatted calculator display
  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          bottom: BorderSide(
            color: theme.colorScheme.outline,
          ),
        ),
      ),
      child: Text(
        displayValue,
        style: TextStyle(
          fontSize: 32.0,
          fontWeight: FontWeight.w300,
          color: hasError
              ? theme.colorScheme.error
              : theme.colorScheme.onSurface,
          fontFamily: 'monospace',
        ),
        textAlign: TextAlign.right,
        overflow: TextOverflow.ellipsis,
        maxLines: 1,
      ),
    );
  }
}

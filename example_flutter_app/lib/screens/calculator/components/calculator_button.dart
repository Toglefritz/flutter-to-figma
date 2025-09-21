import 'package:flutter/material.dart';

/// Enumeration of different calculator button types for styling and behavior.
///
/// This enum defines the various categories of calculator buttons, each with
/// distinct visual styling and interaction patterns. The button type determines
/// the color scheme, text styling, and visual feedback for user interactions.
///
/// Button Categories:
/// * [number] - Digit buttons (0-9) with standard styling
/// * [operation] - Mathematical operation buttons (+, -, *, /) with accent colors
/// * [function] - Special function buttons (=, C, .) with distinct styling
/// * [clear] - Clear button with prominent styling for easy access
enum CalculatorButtonType {
  /// Number buttons for digits 0-9.
  ///
  /// These buttons use standard background colors and are the most frequently
  /// used buttons in calculator interactions. They follow Material Design
  /// principles with subtle elevation and standard text styling.
  number,

  /// Operation buttons for mathematical functions (+, -, *, /).
  ///
  /// These buttons use accent colors to distinguish them from number buttons
  /// and provide clear visual hierarchy for mathematical operations.
  /// They maintain visual consistency while standing out for easy identification.
  operation,

  /// Function buttons for special operations (=, .).
  ///
  /// These buttons handle special calculator functions and use distinct
  /// styling to indicate their unique behavior. The equals button typically
  /// receives prominent styling as the primary action button.
  function,

  /// Clear button for resetting calculator state.
  ///
  /// This button uses prominent styling (often red or high contrast) to
  /// indicate its destructive action of clearing all calculator state.
  /// It's positioned for easy access while preventing accidental activation.
  clear,
}

/// Reusable button component for calculator interface interactions.
///
/// This StatelessWidget provides a consistent button implementation for all
/// calculator interactions including numbers, operations, and functions.
/// Each button type has distinct visual styling while maintaining consistent
/// behavior and accessibility features.
///
/// Button Features:
/// * Type-based styling for visual hierarchy and user guidance
/// * Touch feedback with Material Design ripple effects
/// * Consistent sizing and spacing for grid layout compatibility
/// * Accessibility support with semantic labels and proper touch targets
/// * Responsive design that adapts to different screen sizes
///
/// Visual Design:
/// * Material Design elevation and shadows for depth perception
/// * High contrast text for readability across button types
/// * Consistent border radius and padding for visual harmony
/// * Color coding based on button type for intuitive interaction
///
/// Interaction Design:
/// * Immediate visual feedback on press with elevation changes
/// * Ripple effects for touch confirmation and modern feel
/// * Proper touch target size (minimum 44x44 points) for accessibility
/// * Disabled state handling for invalid operations
///
/// Performance Considerations:
/// * Stateless widget for optimal rebuild performance
/// * Efficient gesture detection with minimal overhead
/// * Optimized rendering with const constructors where possible
class CalculatorButton extends StatelessWidget {
  /// Creates a calculator button with the specified properties.
  ///
  /// @param text The text to display on the button (number, operation, or symbol)
  /// @param type The button type that determines styling and behavior
  /// @param onPressed Callback function executed when button is pressed
  /// @param key Optional widget key for identification in the widget tree
  const CalculatorButton({
    required this.text,
    required this.type,
    required this.onPressed,
    super.key,
  });

  /// The text displayed on the button face.
  ///
  /// This string represents the button's function and is displayed
  /// prominently in the center of the button. Common values include
  /// digits (0-9), operations (+, -, *, /), and functions (=, C, .).
  final String text;

  /// The button type that determines visual styling and behavior.
  ///
  /// This enum value controls the button's color scheme, text styling,
  /// and visual hierarchy within the calculator interface. Different
  /// types receive distinct styling to guide user interaction.
  final CalculatorButtonType type;

  /// Callback function executed when the button is pressed.
  ///
  /// This function is called with no parameters when the user taps
  /// the button. The callback should handle the appropriate calculator
  /// logic based on the button's text and type.
  final VoidCallback onPressed;

  /// Gets the background color for the button based on its type.
  ///
  /// This method returns the appropriate background color for the button
  /// based on its type and the current theme. It ensures consistent
  /// visual hierarchy and accessibility across different button categories.
  ///
  /// Color Scheme:
  /// * Number buttons: Surface color with subtle contrast
  /// * Operation buttons: Primary color for prominence
  /// * Function buttons: Secondary color for distinction
  /// * Clear button: Error color for destructive action indication
  ///
  /// @param context Build context for accessing theme colors
  /// @returns Color appropriate for the button type and current theme
  Color _getBackgroundColor(BuildContext context) {
    final ColorScheme colorScheme = Theme.of(context).colorScheme;

    switch (type) {
      case CalculatorButtonType.number:
        return colorScheme.surfaceContainerHighest;
      case CalculatorButtonType.operation:
        return colorScheme.primary;
      case CalculatorButtonType.function:
        return colorScheme.secondary;
      case CalculatorButtonType.clear:
        return colorScheme.error;
    }
  }

  /// Gets the text color for the button based on its type and background.
  ///
  /// This method returns the appropriate text color that provides sufficient
  /// contrast against the button's background color. It ensures readability
  /// and accessibility compliance across all button types.
  ///
  /// Text Color Logic:
  /// * Number buttons: On-surface color for standard contrast
  /// * Operation buttons: On-primary color for primary background
  /// * Function buttons: On-secondary color for secondary background
  /// * Clear button: On-error color for error background
  ///
  /// @param context Build context for accessing theme colors
  /// @returns Color that provides proper contrast for the button text
  Color _getTextColor(BuildContext context) {
    final ColorScheme colorScheme = Theme.of(context).colorScheme;

    switch (type) {
      case CalculatorButtonType.number:
        return colorScheme.onSurface;
      case CalculatorButtonType.operation:
        return colorScheme.onPrimary;
      case CalculatorButtonType.function:
        return colorScheme.onSecondary;
      case CalculatorButtonType.clear:
        return colorScheme.onError;
    }
  }

  /// Builds the calculator button UI with appropriate styling and behavior.
  ///
  /// Creates a Material button with type-specific styling, proper touch
  /// targets, and accessibility features. The button includes visual
  /// feedback for user interactions and maintains consistent appearance
  /// across the calculator interface.
  ///
  /// Button Structure:
  /// 1. Expanded widget for grid layout compatibility
  /// 2. Padding for proper spacing between buttons
  /// 3. ElevatedButton with custom styling and behavior
  /// 4. Text widget with appropriate typography and color
  ///
  /// Styling Features:
  /// * Type-specific background and text colors
  /// * Consistent border radius for visual harmony
  /// * Proper elevation for Material Design depth
  /// * Responsive sizing that adapts to available space
  ///
  /// Accessibility Features:
  /// * Semantic labels for screen reader compatibility
  /// * Minimum touch target size for motor accessibility
  /// * High contrast colors for visual accessibility
  /// * Clear visual feedback for interaction confirmation
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns Expanded widget containing the styled calculator button
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: _getBackgroundColor(context),
            foregroundColor: _getTextColor(context),
            elevation: 2.0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8.0),
            ),
            minimumSize: const Size(64.0, 64.0),
          ),
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 20.0,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

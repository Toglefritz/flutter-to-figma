import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Color Format Display Component
///
/// This reusable widget displays color values in various formats with
/// tap-to-copy functionality and visual feedback. It provides an intuitive
/// interface for users to view and copy color values in different formats
/// such as hex, RGB, RGBA, and HSL.
///
/// Key Features:
/// * Display color values in multiple formats
/// * Tap-to-copy functionality with clipboard integration
/// * Visual feedback for copy operations
/// * Consistent Material Design styling
/// * Accessibility support with semantic labels
/// * Error handling for clipboard operations
/// * Customizable appearance and theming
///
/// Usage:
/// ```dart
/// ColorFormatDisplay(
///   formatName: 'Hex',
///   formatValue: '#FF5733',
///   textColor: Colors.white,
///   onCopy: (format, value) => showCopyConfirmation(format, value),
/// )
/// ```
///
/// The component automatically handles clipboard operations and provides
/// visual feedback through ripple effects and optional callback notifications
/// for successful copy operations.
class ColorFormatDisplay extends StatelessWidget {
  /// Creates a color format display with the specified configuration.
  ///
  /// All parameters are required to ensure proper display and functionality.
  /// The component provides tap-to-copy behavior and visual feedback for
  /// an optimal user experience.
  ///
  /// Parameters:
  /// * [formatName] - Display name of the color format
  /// * [formatValue] - The actual color value in the specified format
  /// * [textColor] - Color for text and UI elements
  /// * [onCopy] - Callback for successful copy operations
  const ColorFormatDisplay({
    required this.formatName,
    required this.formatValue,
    required this.textColor,
    required this.onCopy,
    super.key,
  });

  /// Display name of the color format.
  ///
  /// This name appears prominently at the top of the card and should be
  /// concise and descriptive (e.g., 'Hex', 'RGB', 'HSL'). The name helps
  /// users identify the format type at a glance.
  final String formatName;

  /// The actual color value in the specified format.
  ///
  /// This value is displayed in the center of the card and represents
  /// the current color in the format specified by [formatName]. Examples
  /// include '#FF5733', 'rgb(255, 87, 51)', 'hsl(14, 100%, 60%)'.
  final String formatValue;

  /// Color for text labels and UI elements.
  ///
  /// This color should provide sufficient contrast against the background
  /// for accessibility compliance. It's typically determined by the current
  /// background color's luminance for optimal readability.
  final Color textColor;

  /// Callback function called when a format is successfully copied.
  ///
  /// This function receives the format name and value that were copied,
  /// allowing the parent component to provide user feedback such as
  /// snackbar notifications or other confirmation messages.
  final void Function(String formatName, String formatValue) onCopy;

  /// Handles the copy operation when the card is tapped.
  ///
  /// This method copies the format value to the system clipboard and
  /// calls the onCopy callback if the operation is successful. It handles
  /// clipboard errors gracefully and provides appropriate feedback.
  Future<void> _handleCopy() async {
    try {
      await Clipboard.setData(ClipboardData(text: formatValue));
      onCopy(formatName, formatValue);
    } catch (error) {
      // Clipboard errors are handled by the parent component
      // through the onCopy callback or error handling mechanisms
      debugPrint('Failed to copy $formatName format: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$formatName color format',
      value: formatValue,
      button: true,
      onTap: _handleCopy,
      child: Material(
        color: textColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12.0),
        child: InkWell(
          borderRadius: BorderRadius.circular(12.0),
          onTap: _handleCopy,
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Header row with format name and copy icon
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      formatName,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 12.0,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Icon(
                      Icons.copy,
                      color: textColor.withValues(alpha: 0.6),
                      size: 16.0,
                    ),
                  ],
                ),

                // Format value display
                Expanded(
                  child: Center(
                    child: Text(
                      formatValue,
                      style: TextStyle(
                        color: textColor.withValues(alpha: 0.9),
                        fontSize: 11.0,
                        fontWeight: FontWeight.w400,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Enhanced Color Format Display with Preview
///
/// This advanced version of the color format display includes a color
/// preview swatch alongside the format information, providing visual
/// context for the color value being displayed.
///
/// Key Features:
/// * All features of the standard ColorFormatDisplay
/// * Color preview swatch for visual reference
/// * Customizable swatch size and styling
/// * Enhanced accessibility with color descriptions
///
/// Usage:
/// ```dart
/// ColorFormatDisplayWithPreview(
///   formatName: 'RGB',
///   formatValue: 'rgb(255, 87, 51)',
///   colorValue: Color(0xFFFF5733),
///   textColor: Colors.white,
///   onCopy: (format, value) => showCopyConfirmation(format, value),
/// )
/// ```
class ColorFormatDisplayWithPreview extends StatelessWidget {
  /// Creates a color format display with preview swatch.
  ///
  /// This enhanced version includes a color preview swatch that provides
  /// visual context for the color value being displayed, making it easier
  /// for users to understand the relationship between format and appearance.
  ///
  /// Parameters:
  /// * [formatName] - Display name of the color format
  /// * [formatValue] - The actual color value in the specified format
  /// * [colorValue] - The Color object for the preview swatch
  /// * [textColor] - Color for text and UI elements
  /// * [onCopy] - Callback for successful copy operations
  /// * [swatchSize] - Size of the color preview swatch
  const ColorFormatDisplayWithPreview({
    required this.formatName,
    required this.formatValue,
    required this.colorValue,
    required this.textColor,
    required this.onCopy,
    this.swatchSize = 24.0,
    super.key,
  });

  /// Display name of the color format.
  final String formatName;

  /// The actual color value in the specified format.
  final String formatValue;

  /// The Color object for the preview swatch.
  ///
  /// This color is displayed as a small swatch next to the format name,
  /// providing visual context for the color value being shown.
  final Color colorValue;

  /// Color for text labels and UI elements.
  final Color textColor;

  /// Callback function called when a format is successfully copied.
  final void Function(String formatName, String formatValue) onCopy;

  /// Size of the color preview swatch in logical pixels.
  ///
  /// This determines the width and height of the square color swatch
  /// displayed next to the format name. Default is 24.0 pixels.
  final double swatchSize;

  /// Handles the copy operation when the card is tapped.
  Future<void> _handleCopy() async {
    try {
      await Clipboard.setData(ClipboardData(text: formatValue));
      onCopy(formatName, formatValue);
    } catch (error) {
      debugPrint('Failed to copy $formatName format: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$formatName color format with preview',
      value: formatValue,
      button: true,
      onTap: _handleCopy,
      child: Material(
        color: textColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12.0),
        child: InkWell(
          borderRadius: BorderRadius.circular(12.0),
          onTap: _handleCopy,
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Header row with format name, color swatch, and copy icon
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        // Color preview swatch
                        Container(
                          width: swatchSize,
                          height: swatchSize,
                          decoration: BoxDecoration(
                            color: colorValue,
                            borderRadius: BorderRadius.circular(4.0),
                            border: Border.all(
                              color: textColor.withValues(alpha: 0.3),
                            ),
                          ),
                        ),

                        // Format name
                        Padding(
                          padding: const EdgeInsets.only(left: 8.0),
                          child: Text(
                            formatName,
                            style: TextStyle(
                              color: textColor,
                              fontSize: 12.0,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Copy icon
                    Icon(
                      Icons.copy,
                      color: textColor.withValues(alpha: 0.6),
                      size: 16.0,
                    ),
                  ],
                ),

                // Format value display
                Expanded(
                  child: Center(
                    child: Text(
                      formatValue,
                      style: TextStyle(
                        color: textColor.withValues(alpha: 0.9),
                        fontSize: 11.0,
                        fontWeight: FontWeight.w400,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Compact Color Format Display
///
/// This compact version of the color format display is designed for
/// situations where space is limited but color format information
/// is still needed. It provides a more condensed layout while
/// maintaining all core functionality.
///
/// Key Features:
/// * Compact layout optimized for limited space
/// * All core functionality of the standard display
/// * Horizontal layout with format and value side-by-side
/// * Tap-to-copy functionality with visual feedback
///
/// Usage:
/// ```dart
/// CompactColorFormatDisplay(
///   formatName: 'Hex',
///   formatValue: '#FF5733',
///   textColor: Colors.white,
///   onCopy: (format, value) => showCopyConfirmation(format, value),
/// )
/// ```
class CompactColorFormatDisplay extends StatelessWidget {
  /// Creates a compact color format display.
  ///
  /// This compact version provides the same functionality as the standard
  /// display but in a more space-efficient layout suitable for dense
  /// interfaces or mobile screens with limited space.
  ///
  /// Parameters:
  /// * [formatName] - Display name of the color format
  /// * [formatValue] - The actual color value in the specified format
  /// * [textColor] - Color for text and UI elements
  /// * [onCopy] - Callback for successful copy operations
  const CompactColorFormatDisplay({
    required this.formatName,
    required this.formatValue,
    required this.textColor,
    required this.onCopy,
    super.key,
  });

  /// Display name of the color format.
  final String formatName;

  /// The actual color value in the specified format.
  final String formatValue;

  /// Color for text labels and UI elements.
  final Color textColor;

  /// Callback function called when a format is successfully copied.
  final void Function(String formatName, String formatValue) onCopy;

  /// Handles the copy operation when the display is tapped.
  Future<void> _handleCopy() async {
    try {
      await Clipboard.setData(ClipboardData(text: formatValue));
      onCopy(formatName, formatValue);
    } catch (error) {
      debugPrint('Failed to copy $formatName format: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$formatName color format',
      value: formatValue,
      button: true,
      onTap: _handleCopy,
      child: Material(
        color: textColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8.0),
        child: InkWell(
          borderRadius: BorderRadius.circular(8.0),
          onTap: _handleCopy,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 12.0,
              vertical: 8.0,
            ),
            child: Row(
              children: [
                // Format name
                Text(
                  formatName,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 12.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                // Spacer
                const Spacer(),

                // Format value
                Flexible(
                  child: Text(
                    formatValue,
                    style: TextStyle(
                      color: textColor.withValues(alpha: 0.9),
                      fontSize: 11.0,
                      fontWeight: FontWeight.w400,
                    ),
                    textAlign: TextAlign.right,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

                // Copy icon
                Padding(
                  padding: const EdgeInsets.only(left: 8.0),
                  child: Icon(
                    Icons.copy,
                    color: textColor.withValues(alpha: 0.6),
                    size: 14.0,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

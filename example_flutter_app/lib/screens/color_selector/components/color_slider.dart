import 'package:flutter/material.dart';

/// Color Slider Component
///
/// This reusable widget provides a customizable slider for color component
/// manipulation with real-time value updates, visual feedback, and accessibility
/// support. It's designed for use in both RGB and HSL color control interfaces
/// with smooth interactions and proper semantic labeling.
///
/// Key Features:
/// * Real-time value updates with smooth slider interactions
/// * Customizable color theming and accent colors
/// * Value labels with optional suffix support (%, °)
/// * Accessibility support with semantic labels and value indicators
/// * Consistent Material Design styling
/// * Responsive layout with proper touch targets
///
/// Usage:
/// ```dart
/// ColorSlider(
///   label: 'Red',
///   value: 255.0,
///   min: 0.0,
///   max: 255.0,
///   divisions: 255,
///   accentColor: Colors.red,
///   textColor: Colors.white,
///   onChanged: (value) => updateRed(value.round()),
/// )
/// ```
///
/// The component automatically handles value formatting, accessibility
/// labels, and visual feedback for an optimal user experience across
/// different color manipulation scenarios.
class ColorSlider extends StatelessWidget {
  /// Creates a color slider with the specified configuration.
  ///
  /// All parameters except [suffix] are required to ensure proper
  /// slider configuration and functionality. The slider provides
  /// real-time feedback and smooth interactions for color manipulation.
  ///
  /// Parameters:
  /// * [label] - Display label for the color component
  /// * [value] - Current slider value
  /// * [min] - Minimum allowed value
  /// * [max] - Maximum allowed value
  /// * [divisions] - Number of discrete slider positions
  /// * [accentColor] - Color for slider thumb and active track
  /// * [textColor] - Color for text labels and values
  /// * [onChanged] - Callback for value changes
  /// * [suffix] - Optional suffix for value display (e.g., '°', '%')
  const ColorSlider({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.divisions,
    required this.accentColor,
    required this.textColor,
    required this.onChanged,
    this.suffix = '',
    super.key,
  });

  /// Display label for the color component.
  ///
  /// This label appears above the slider and describes the color
  /// component being controlled (e.g., 'Red', 'Hue', 'Saturation').
  /// The label is styled with medium weight typography for clarity.
  final String label;

  /// Current value of the slider.
  ///
  /// This value is displayed next to the label and determines the
  /// current position of the slider thumb. The value should be
  /// within the specified min/max range for proper display.
  final double value;

  /// Minimum allowed value for the slider.
  ///
  /// This defines the leftmost position of the slider and the
  /// minimum value that can be selected. Typically 0 for most
  /// color components.
  final double min;

  /// Maximum allowed value for the slider.
  ///
  /// This defines the rightmost position of the slider and the
  /// maximum value that can be selected. Common values include
  /// 255 for RGB components, 360 for hue, and 100 for percentages.
  final double max;

  /// Number of discrete positions on the slider.
  ///
  /// This determines how many distinct values the slider can
  /// represent between min and max. Higher values provide finer
  /// control but may impact performance on some devices.
  final int divisions;

  /// Accent color for the slider thumb and active track.
  ///
  /// This color provides visual association with the color component
  /// being controlled. For example, red sliders use red accents,
  /// while hue sliders might use purple or rainbow colors.
  final Color accentColor;

  /// Color for text labels and value displays.
  ///
  /// This color should provide sufficient contrast against the
  /// background for accessibility compliance. It's typically
  /// determined by the current background color's luminance.
  final Color textColor;

  /// Callback function called when the slider value changes.
  ///
  /// This function receives the new slider value and should update
  /// the parent component's state to reflect the color change.
  /// The callback is called continuously during slider dragging
  /// for real-time color updates.
  final ValueChanged<double> onChanged;

  /// Optional suffix for value display.
  ///
  /// This suffix is appended to the numeric value display to
  /// provide context about the value's unit or meaning.
  /// Common suffixes include '°' for degrees and '%' for percentages.
  final String suffix;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label slider',
      value: '${value.round()}$suffix',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label and value row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: textColor,
                  fontSize: 16.0,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '${value.round()}$suffix',
                style: TextStyle(
                  color: textColor.withValues(alpha: 0.8),
                  fontSize: 14.0,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),

          // Slider with custom theming
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                // Active track styling
                activeTrackColor: accentColor.withValues(alpha: 0.8),
                inactiveTrackColor: textColor.withValues(alpha: 0.2),

                // Thumb styling
                thumbColor: accentColor,
                thumbShape: const RoundSliderThumbShape(
                  enabledThumbRadius: 12.0,
                ),

                // Overlay styling for touch feedback
                overlayColor: accentColor.withValues(alpha: 0.2),
                overlayShape: const RoundSliderOverlayShape(
                  overlayRadius: 20.0,
                ),

                // Value indicator styling
                valueIndicatorColor: accentColor,
                valueIndicatorTextStyle: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                  fontSize: 14.0,
                ),
                valueIndicatorShape: const PaddleSliderValueIndicatorShape(),

                // Track styling
                trackHeight: 4.0,
                trackShape: const RoundedRectSliderTrackShape(),

                // Tick mark styling (if divisions are used)
                tickMarkShape: const RoundSliderTickMarkShape(
                  tickMarkRadius: 2.0,
                ),
                activeTickMarkColor: accentColor.withValues(alpha: 0.6),
                inactiveTickMarkColor: textColor.withValues(alpha: 0.1),
              ),
              child: Slider(
                value: value,
                min: min,
                max: max,
                divisions: divisions,
                label: '${value.round()}$suffix',
                onChanged: onChanged,
                semanticFormatterCallback: (double value) {
                  return '${value.round()}$suffix';
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Enhanced Color Slider with Gradient Track
///
/// This advanced version of the color slider includes a gradient track
/// that visually represents the color range being adjusted. It's particularly
/// useful for hue sliders where the track can show the full color spectrum,
/// or for RGB sliders where the track shows the color intensity range.
///
/// Key Features:
/// * Gradient track showing color range preview
/// * All features of the standard ColorSlider
/// * Customizable gradient colors
/// * Smooth visual feedback for color selection
///
/// Usage:
/// ```dart
/// GradientColorSlider(
///   label: 'Hue',
///   value: 180.0,
///   min: 0.0,
///   max: 360.0,
///   divisions: 360,
///   textColor: Colors.white,
///   gradientColors: [
///     Colors.red,
///     Colors.yellow,
///     Colors.green,
///     Colors.cyan,
///     Colors.blue,
///     Colors.magenta,
///     Colors.red,
///   ],
///   onChanged: (value) => updateHue(value),
/// )
/// ```
class GradientColorSlider extends StatelessWidget {
  /// Creates a gradient color slider with the specified configuration.
  ///
  /// This enhanced slider includes a gradient track that provides visual
  /// feedback about the color range being adjusted, making it easier for
  /// users to understand the relationship between slider position and color.
  ///
  /// Parameters:
  /// * [label] - Display label for the color component
  /// * [value] - Current slider value
  /// * [min] - Minimum allowed value
  /// * [max] - Maximum allowed value
  /// * [divisions] - Number of discrete slider positions
  /// * [textColor] - Color for text labels and values
  /// * [gradientColors] - Colors for the gradient track
  /// * [onChanged] - Callback for value changes
  /// * [suffix] - Optional suffix for value display
  const GradientColorSlider({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.divisions,
    required this.textColor,
    required this.gradientColors,
    required this.onChanged,
    this.suffix = '',
    super.key,
  });

  /// Display label for the color component.
  final String label;

  /// Current value of the slider.
  final double value;

  /// Minimum allowed value for the slider.
  final double min;

  /// Maximum allowed value for the slider.
  final double max;

  /// Number of discrete positions on the slider.
  final int divisions;

  /// Color for text labels and value displays.
  final Color textColor;

  /// Colors for the gradient track background.
  ///
  /// These colors are used to create a linear gradient that represents
  /// the color range being adjusted. For hue sliders, this typically
  /// includes the full color spectrum. For RGB sliders, it might show
  /// the intensity range from black to the full color.
  final List<Color> gradientColors;

  /// Callback function called when the slider value changes.
  final ValueChanged<double> onChanged;

  /// Optional suffix for value display.
  final String suffix;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label slider with gradient preview',
      value: '${value.round()}$suffix',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label and value row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: textColor,
                  fontSize: 16.0,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '${value.round()}$suffix',
                style: TextStyle(
                  color: textColor.withValues(alpha: 0.8),
                  fontSize: 14.0,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),

          // Gradient track with slider overlay
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Stack(
              children: [
                // Gradient background
                Container(
                  height: 32.0,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16.0),
                    gradient: LinearGradient(
                      colors: gradientColors,
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    border: Border.all(
                      color: textColor.withValues(alpha: 0.2),
                    ),
                  ),
                ),

                // Slider overlay
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    // Make track transparent to show gradient
                    activeTrackColor: Colors.transparent,
                    inactiveTrackColor: Colors.transparent,

                    // Thumb styling with border for visibility
                    thumbColor: Colors.white,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 14.0,
                    ),

                    // Overlay styling
                    overlayColor: Colors.white.withValues(alpha: 0.2),
                    overlayShape: const RoundSliderOverlayShape(
                      overlayRadius: 22.0,
                    ),

                    // Value indicator styling
                    valueIndicatorColor: textColor,
                    valueIndicatorTextStyle: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                      fontSize: 14.0,
                    ),

                    // Track height to match container
                    trackHeight: 32.0,
                    trackShape: const RoundedRectSliderTrackShape(),
                  ),
                  child: Slider(
                    value: value,
                    min: min,
                    max: max,
                    divisions: divisions,
                    label: '${value.round()}$suffix',
                    onChanged: onChanged,
                    semanticFormatterCallback: (double value) {
                      return '${value.round()}$suffix';
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

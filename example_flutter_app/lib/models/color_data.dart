import 'package:flutter/material.dart';

/// Immutable color data container supporting both RGB and HSL color spaces.
///
/// This class represents a color value in both RGB and HSL formats simultaneously,
/// providing convenient access to multiple color representations and format
/// conversions. The dual representation allows users to manipulate colors
/// in their preferred color space while maintaining consistency.
///
/// Color Space Details:
/// * RGB: Red (0-255), Green (0-255), Blue (0-255)
/// * HSL: Hue (0-360°), Saturation (0-100%), Lightness (0-100%)
///
/// Format Support:
/// The class provides getters for common color format strings including
/// hexadecimal, RGB, RGBA, HSL, and Flutter Color objects for direct use
/// in widgets and styling.
///
/// Thread Safety: This class is immutable and therefore thread-safe.
/// All modifications create new instances via the [copyWith] method.
class ColorData {
  /// Creates a new color data instance with RGB and HSL values.
  ///
  /// Both RGB and HSL values must be provided to ensure complete color
  /// representation. The caller is responsible for ensuring the RGB and HSL
  /// values represent the same color, as this class does not perform
  /// automatic conversion between color spaces.
  ///
  /// @param red Red component (0-255)
  /// @param green Green component (0-255)
  /// @param blue Blue component (0-255)
  /// @param hue Hue component in degrees (0-360)
  /// @param saturation Saturation percentage (0-100)
  /// @param lightness Lightness percentage (0-100)
  const ColorData({
    required this.red,
    required this.green,
    required this.blue,
    required this.hue,
    required this.saturation,
    required this.lightness,
  });

  /// Red component of the RGB color representation.
  ///
  /// Valid range: 0-255 (8-bit unsigned integer)
  /// This value directly corresponds to the red channel in RGB color space
  /// and is used for generating hex strings and Flutter Color objects.
  final int red;

  /// Green component of the RGB color representation.
  ///
  /// Valid range: 0-255 (8-bit unsigned integer)
  /// This value directly corresponds to the green channel in RGB color space
  /// and is used for generating hex strings and Flutter Color objects.
  final int green;

  /// Blue component of the RGB color representation.
  ///
  /// Valid range: 0-255 (8-bit unsigned integer)
  /// This value directly corresponds to the blue channel in RGB color space
  /// and is used for generating hex strings and Flutter Color objects.
  final int blue;

  /// Hue component of the HSL color representation.
  ///
  /// Valid range: 0.0-360.0 degrees
  /// Represents the color's position on the color wheel:
  /// * 0° = Red
  /// * 120° = Green
  /// * 240° = Blue
  /// * 360° = Red (full circle)
  final double hue;

  /// Saturation component of the HSL color representation.
  ///
  /// Valid range: 0.0-100.0 percent
  /// Represents the color's intensity or purity:
  /// * 0% = Grayscale (no color)
  /// * 100% = Full saturation (vivid color)
  final double saturation;

  /// Lightness component of the HSL color representation.
  ///
  /// Valid range: 0.0-100.0 percent
  /// Represents the color's brightness:
  /// * 0% = Black
  /// * 50% = Normal color
  /// * 100% = White
  final double lightness;

  /// Hexadecimal color string representation.
  ///
  /// Returns a standard 6-digit hexadecimal color string with hash prefix,
  /// suitable for use in web development, CSS, and color specifications.
  /// Each RGB component is converted to a 2-digit hexadecimal value.
  ///
  /// Format: "#RRGGBB" (e.g., "#FF5733", "#000000", "#FFFFFF")
  ///
  /// Example:
  /// ```dart
  /// final color = ColorData(red: 255, green: 87, blue: 51, ...);
  /// print(color.hexString); // "#FF5733"
  /// ```
  String get hexString {
    return '#${red.toRadixString(16).padLeft(2, '0')}'
        '${green.toRadixString(16).padLeft(2, '0')}'
        '${blue.toRadixString(16).padLeft(2, '0')}';
  }

  /// CSS-compatible RGB color string representation.
  ///
  /// Returns a CSS rgb() function string that can be used directly in
  /// web styling or copied to clipboard for use in other applications.
  ///
  /// Format: "rgb(r, g, b)" where r, g, b are 0-255 integers
  ///
  /// Example:
  /// ```dart
  /// final color = ColorData(red: 255, green: 87, blue: 51, ...);
  /// print(color.rgbString); // "rgb(255, 87, 51)"
  /// ```
  String get rgbString {
    return 'rgb($red, $green, $blue)';
  }

  /// CSS-compatible RGBA color string representation with full opacity.
  ///
  /// Returns a CSS rgba() function string with alpha channel set to 1.0
  /// (fully opaque). This format is useful when transparency support
  /// is needed but the current color should be fully opaque.
  ///
  /// Format: "rgba(r, g, b, 1.0)" where r, g, b are 0-255 integers
  ///
  /// Example:
  /// ```dart
  /// final color = ColorData(red: 255, green: 87, blue: 51, ...);
  /// print(color.rgbaString); // "rgba(255, 87, 51, 1.0)"
  /// ```
  String get rgbaString {
    return 'rgba($red, $green, $blue, 1.0)';
  }

  /// CSS-compatible HSL color string representation.
  ///
  /// Returns a CSS hsl() function string using the HSL color values.
  /// Values are rounded to integers for cleaner output and better
  /// compatibility with CSS specifications.
  ///
  /// Format: "hsl(h, s%, l%)" where h is 0-360 degrees, s and l are 0-100%
  ///
  /// Example:
  /// ```dart
  /// final color = ColorData(hue: 9.0, saturation: 100.0, lightness: 60.0, ...);
  /// print(color.hslString); // "hsl(9, 100%, 60%)"
  /// ```
  String get hslString {
    return 'hsl(${hue.round()}, ${saturation.round()}%, ${lightness.round()}%)';
  }

  /// Flutter Color object for direct use in widgets.
  ///
  /// Converts the RGB values to a Flutter Color object that can be used
  /// directly in widget styling, themes, and color properties. The color
  /// is created with full opacity (alpha = 255).
  ///
  /// This getter provides seamless integration with Flutter's color system
  /// without requiring manual conversion or additional dependencies.
  ///
  /// Example:
  /// ```dart
  /// final colorData = ColorData(red: 255, green: 87, blue: 51, ...);
  /// Container(
  ///   color: colorData.flutterColor,
  ///   child: Text('Colored container'),
  /// )
  /// ```
  Color get flutterColor {
    return Color.fromARGB(255, red, green, blue);
  }

  /// Creates a copy of this color data with optionally updated values.
  ///
  /// This method implements the immutable update pattern by creating a new
  /// [ColorData] instance with the specified changes while preserving
  /// unchanged values from the current instance.
  ///
  /// This is the primary method for updating color values in response to
  /// user interactions with color sliders, pickers, or input fields.
  /// Each color change creates a new instance, ensuring predictable behavior
  /// and supporting Flutter's reactive updates.
  ///
  /// @param red New red component (preserves current if null)
  /// @param green New green component (preserves current if null)
  /// @param blue New blue component (preserves current if null)
  /// @param hue New hue component (preserves current if null)
  /// @param saturation New saturation component (preserves current if null)
  /// @param lightness New lightness component (preserves current if null)
  /// @returns New ColorData instance with updated values
  ///
  /// Example:
  /// ```dart
  /// final newColor = currentColor.copyWith(
  ///   red: 128,
  ///   saturation: 75.0,
  /// );
  /// ```
  ColorData copyWith({
    int? red,
    int? green,
    int? blue,
    double? hue,
    double? saturation,
    double? lightness,
  }) {
    return ColorData(
      red: red ?? this.red,
      green: green ?? this.green,
      blue: blue ?? this.blue,
      hue: hue ?? this.hue,
      saturation: saturation ?? this.saturation,
      lightness: lightness ?? this.lightness,
    );
  }
}

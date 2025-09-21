import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Color Data Model
///
/// This model provides comprehensive color representation and conversion
/// utilities for the color selector example. It supports both RGB and HSL
/// color spaces with bidirectional conversion, validation, and formatting
/// for various display formats.
///
/// Key Components:
/// * [ColorData] - Immutable color representation with RGB and HSL values
/// * Color format conversion methods (hex, RGB, RGBA, HSL strings)
/// * Flutter Color object generation
/// * Color validation and clamping utilities
/// * Bidirectional RGB ↔ HSL conversion algorithms

/// Represents a color with both RGB and HSL representations.
///
/// This immutable class maintains color information in both RGB (Red, Green, Blue)
/// and HSL (Hue, Saturation, Lightness) color spaces, ensuring consistency
/// between representations through automatic conversion. All color values
/// are validated and clamped to their respective valid ranges.
///
/// RGB values are integers in the range 0-255, while HSL values use:
/// * Hue: 0-360 degrees
/// * Saturation: 0-100 percent
/// * Lightness: 0-100 percent
///
/// The class provides various string representations suitable for different
/// contexts (CSS, Flutter, design tools) and includes utilities for
/// clipboard integration and user interface display.
class ColorData {
  /// Red component of the color (0-255).
  ///
  /// This value represents the intensity of red in the RGB color model.
  /// Values are automatically clamped to the valid range during construction
  /// to prevent invalid color states.
  final int red;

  /// Green component of the color (0-255).
  ///
  /// This value represents the intensity of green in the RGB color model.
  /// Values are automatically clamped to the valid range during construction
  /// to prevent invalid color states.
  final int green;

  /// Blue component of the color (0-255).
  ///
  /// This value represents the intensity of blue in the RGB color model.
  /// Values are automatically clamped to the valid range during construction
  /// to prevent invalid color states.
  final int blue;

  /// Hue component of the color (0-360 degrees).
  ///
  /// This value represents the color's position on the color wheel in the
  /// HSL color model. 0° is red, 120° is green, 240° is blue, and 360°
  /// wraps back to red. Values are automatically normalized to this range.
  final double hue;

  /// Saturation component of the color (0-100 percent).
  ///
  /// This value represents the intensity or purity of the color in the
  /// HSL color model. 0% is completely desaturated (grayscale), while
  /// 100% is fully saturated (vivid color). Values are clamped to this range.
  final double saturation;

  /// Lightness component of the color (0-100 percent).
  ///
  /// This value represents the brightness of the color in the HSL color model.
  /// 0% is black, 50% is the pure color, and 100% is white. Values are
  /// automatically clamped to this range during construction.
  final double lightness;

  /// Creates a new ColorData instance from RGB values.
  ///
  /// This constructor creates a color from RGB components and automatically
  /// calculates the corresponding HSL values. All RGB values are clamped
  /// to the valid range (0-255) to ensure color validity.
  ///
  /// Parameters:
  /// * [red] - Red component (0-255, will be clamped)
  /// * [green] - Green component (0-255, will be clamped)
  /// * [blue] - Blue component (0-255, will be clamped)
  ///
  /// The HSL values are computed using standard color space conversion
  /// algorithms to maintain color accuracy across representations.
  ColorData.fromRgb({
    required int red,
    required int green,
    required int blue,
  }) : red = _clampInt(red, 0, 255),
       green = _clampInt(green, 0, 255),
       blue = _clampInt(blue, 0, 255),
       hue = _calculateHue(red, green, blue),
       saturation = _calculateSaturation(red, green, blue),
       lightness = _calculateLightness(red, green, blue);

  /// Creates a new ColorData instance from HSL values.
  ///
  /// This constructor creates a color from HSL components and automatically
  /// calculates the corresponding RGB values. HSL values are normalized
  /// and clamped to their valid ranges to ensure color validity.
  ///
  /// Parameters:
  /// * [hue] - Hue in degrees (0-360, will be normalized)
  /// * [saturation] - Saturation percentage (0-100, will be clamped)
  /// * [lightness] - Lightness percentage (0-100, will be clamped)
  ///
  /// The RGB values are computed using standard HSL-to-RGB conversion
  /// algorithms to maintain color accuracy and consistency.
  ColorData.fromHsl({
    required double hue,
    required double saturation,
    required double lightness,
  }) : hue = _normalizeHue(hue),
       saturation = _clampDouble(saturation, 0.0, 100.0),
       lightness = _clampDouble(lightness, 0.0, 100.0),
       red = _hslToRgb(hue, saturation, lightness)[0],
       green = _hslToRgb(hue, saturation, lightness)[1],
       blue = _hslToRgb(hue, saturation, lightness)[2];

  /// Creates a ColorData instance from a hexadecimal color string.
  ///
  /// This factory constructor parses hex color strings in various formats:
  /// * "#RRGGBB" - Standard 6-digit hex with hash
  /// * "RRGGBB" - 6-digit hex without hash
  /// * "#RGB" - 3-digit shorthand with hash (expanded to RRGGBB)
  /// * "RGB" - 3-digit shorthand without hash
  ///
  /// Parameters:
  /// * [hexString] - Hexadecimal color string to parse
  ///
  /// Returns a ColorData instance representing the parsed color.
  ///
  /// Throws [ArgumentError] if the hex string format is invalid or
  /// contains non-hexadecimal characters.
  factory ColorData.fromHex(String hexString) {
    // Remove hash prefix if present
    String hex = hexString.replaceFirst('#', '');

    // Validate hex string format
    if (!RegExp(r'^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$').hasMatch(hex)) {
      throw ArgumentError('Invalid hex color format: $hexString');
    }

    // Expand 3-digit hex to 6-digit
    if (hex.length == 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }

    // Parse RGB components
    final int red = int.parse(hex.substring(0, 2), radix: 16);
    final int green = int.parse(hex.substring(2, 4), radix: 16);
    final int blue = int.parse(hex.substring(4, 6), radix: 16);

    return ColorData.fromRgb(red: red, green: green, blue: blue);
  }

  /// Creates a ColorData instance from a Flutter Color object.
  ///
  /// This factory constructor extracts RGB values from a Flutter Color
  /// and creates a corresponding ColorData instance. This is useful for
  /// converting between Flutter's color system and the app's color model.
  ///
  /// Parameters:
  /// * [color] - Flutter Color object to convert
  ///
  /// Returns a ColorData instance representing the same color.
  factory ColorData.fromFlutterColor(Color color) {
    return ColorData.fromRgb(
      red: color.red,
      green: color.green,
      blue: color.blue,
    );
  }

  /// Returns the color as a hexadecimal string.
  ///
  /// This getter provides the color in standard CSS hex format (#RRGGBB)
  /// with uppercase letters. The format is suitable for web development,
  /// CSS styling, and general color representation.
  ///
  /// Example: "#FF5733" for an orange color
  String get hexString {
    return '#${red.toRadixString(16).padLeft(2, '0').toUpperCase()}'
        '${green.toRadixString(16).padLeft(2, '0').toUpperCase()}'
        '${blue.toRadixString(16).padLeft(2, '0').toUpperCase()}';
  }

  /// Returns the color as an RGB string.
  ///
  /// This getter provides the color in CSS rgb() function format,
  /// suitable for web development and CSS styling. The format includes
  /// the function name and comma-separated values.
  ///
  /// Example: "rgb(255, 87, 51)" for an orange color
  String get rgbString {
    return 'rgb($red, $green, $blue)';
  }

  /// Returns the color as an RGBA string with full opacity.
  ///
  /// This getter provides the color in CSS rgba() function format
  /// with alpha channel set to 1.0 (fully opaque). This format is
  /// useful when working with systems that expect RGBA values.
  ///
  /// Example: "rgba(255, 87, 51, 1.0)" for an orange color
  String get rgbaString {
    return 'rgba($red, $green, $blue, 1.0)';
  }

  /// Returns the color as an HSL string.
  ///
  /// This getter provides the color in CSS hsl() function format,
  /// suitable for web development and design tools that work with
  /// HSL color space. Values are rounded for readability.
  ///
  /// Example: "hsl(14, 100%, 60%)" for an orange color
  String get hslString {
    return 'hsl(${hue.round()}, ${saturation.round()}%, ${lightness.round()}%)';
  }

  /// Returns the color as a Flutter Color object.
  ///
  /// This getter creates a Flutter Color instance from the RGB values,
  /// enabling integration with Flutter's widget system and painting
  /// operations. The alpha channel is set to fully opaque (255).
  ///
  /// Returns a Color object suitable for use in Flutter widgets.
  Color get flutterColor {
    return Color.fromARGB(255, red, green, blue);
  }

  /// Determines if this color would require light text for readability.
  ///
  /// This method calculates the relative luminance of the color and
  /// determines whether light or dark text would provide better contrast.
  /// This is essential for dynamic UI theming and accessibility compliance.
  ///
  /// The calculation uses the WCAG (Web Content Accessibility Guidelines)
  /// formula for relative luminance, which accounts for human perception
  /// of different color channels.
  ///
  /// Returns true if light text should be used, false for dark text.
  bool get requiresLightText {
    // Calculate relative luminance using WCAG formula
    final double r = _linearizeColorComponent(red / 255.0);
    final double g = _linearizeColorComponent(green / 255.0);
    final double b = _linearizeColorComponent(blue / 255.0);

    final double luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Threshold of 0.5 provides good contrast in most cases
    return luminance < 0.5;
  }

  /// Creates a copy of this color with updated RGB values.
  ///
  /// This method enables immutable updates to RGB components while
  /// automatically recalculating the corresponding HSL values to
  /// maintain consistency between color representations.
  ///
  /// Parameters (all optional):
  /// * [red] - New red component (0-255)
  /// * [green] - New green component (0-255)
  /// * [blue] - New blue component (0-255)
  ///
  /// Returns a new ColorData instance with updated RGB values.
  ColorData copyWithRgb({
    int? red,
    int? green,
    int? blue,
  }) {
    return ColorData.fromRgb(
      red: red ?? this.red,
      green: green ?? this.green,
      blue: blue ?? this.blue,
    );
  }

  /// Creates a copy of this color with updated HSL values.
  ///
  /// This method enables immutable updates to HSL components while
  /// automatically recalculating the corresponding RGB values to
  /// maintain consistency between color representations.
  ///
  /// Parameters (all optional):
  /// * [hue] - New hue value (0-360 degrees)
  /// * [saturation] - New saturation value (0-100 percent)
  /// * [lightness] - New lightness value (0-100 percent)
  ///
  /// Returns a new ColorData instance with updated HSL values.
  ColorData copyWithHsl({
    double? hue,
    double? saturation,
    double? lightness,
  }) {
    return ColorData.fromHsl(
      hue: hue ?? this.hue,
      saturation: saturation ?? this.saturation,
      lightness: lightness ?? this.lightness,
    );
  }

  /// Validates that RGB values are within the valid range (0-255).
  ///
  /// This static method checks if the provided RGB values are within
  /// the standard 8-bit color range. It's useful for input validation
  /// before creating ColorData instances.
  ///
  /// Parameters:
  /// * [red] - Red component to validate
  /// * [green] - Green component to validate
  /// * [blue] - Blue component to validate
  ///
  /// Returns true if all values are valid, false otherwise.
  static bool isValidRgb(int red, int green, int blue) {
    return red >= 0 &&
        red <= 255 &&
        green >= 0 &&
        green <= 255 &&
        blue >= 0 &&
        blue <= 255;
  }

  /// Validates that HSL values are within their respective valid ranges.
  ///
  /// This static method checks if the provided HSL values are within
  /// their standard ranges. It's useful for input validation before
  /// creating ColorData instances from HSL values.
  ///
  /// Parameters:
  /// * [hue] - Hue value to validate (should be 0-360)
  /// * [saturation] - Saturation value to validate (should be 0-100)
  /// * [lightness] - Lightness value to validate (should be 0-100)
  ///
  /// Returns true if all values are valid, false otherwise.
  static bool isValidHsl(double hue, double saturation, double lightness) {
    return hue >= 0.0 &&
        hue <= 360.0 &&
        saturation >= 0.0 &&
        saturation <= 100.0 &&
        lightness >= 0.0 &&
        lightness <= 100.0;
  }

  /// Clamps an integer value to the specified range.
  ///
  /// This utility method ensures that integer values stay within
  /// acceptable bounds, preventing invalid color component values.
  ///
  /// Parameters:
  /// * [value] - Value to clamp
  /// * [min] - Minimum allowed value
  /// * [max] - Maximum allowed value
  ///
  /// Returns the clamped value within the specified range.
  static int _clampInt(int value, int min, int max) {
    return math.max(min, math.min(max, value));
  }

  /// Clamps a double value to the specified range.
  ///
  /// This utility method ensures that floating-point values stay within
  /// acceptable bounds, preventing invalid HSL component values.
  ///
  /// Parameters:
  /// * [value] - Value to clamp
  /// * [min] - Minimum allowed value
  /// * [max] - Maximum allowed value
  ///
  /// Returns the clamped value within the specified range.
  static double _clampDouble(double value, double min, double max) {
    return math.max(min, math.min(max, value));
  }

  /// Normalizes a hue value to the 0-360 degree range.
  ///
  /// This method handles hue values outside the standard range by
  /// wrapping them around the color wheel. Negative values are
  /// converted to their positive equivalents, and values over 360
  /// are wrapped back to the beginning.
  ///
  /// Parameters:
  /// * [hue] - Hue value to normalize
  ///
  /// Returns normalized hue value in the range 0-360.
  static double _normalizeHue(double hue) {
    hue = hue % 360.0;
    return hue < 0 ? hue + 360.0 : hue;
  }

  /// Calculates the hue component from RGB values.
  ///
  /// This method implements the standard RGB-to-HSL conversion algorithm
  /// for the hue component. It determines the color's position on the
  /// color wheel based on the relative intensities of RGB components.
  ///
  /// Parameters:
  /// * [r] - Red component (0-255)
  /// * [g] - Green component (0-255)
  /// * [b] - Blue component (0-255)
  ///
  /// Returns hue value in degrees (0-360).
  static double _calculateHue(int r, int g, int b) {
    final double red = r / 255.0;
    final double green = g / 255.0;
    final double blue = b / 255.0;

    final double max = math.max(red, math.max(green, blue));
    final double min = math.min(red, math.min(green, blue));
    final double delta = max - min;

    if (delta == 0) return 0.0; // Achromatic (gray)

    double hue = 0.0;
    if (max == red) {
      hue = ((green - blue) / delta) % 6.0;
    } else if (max == green) {
      hue = (blue - red) / delta + 2.0;
    } else {
      hue = (red - green) / delta + 4.0;
    }

    hue *= 60.0;
    return hue < 0 ? hue + 360.0 : hue;
  }

  /// Calculates the saturation component from RGB values.
  ///
  /// This method implements the standard RGB-to-HSL conversion algorithm
  /// for the saturation component. It determines the color's purity or
  /// intensity based on the difference between maximum and minimum RGB values.
  ///
  /// Parameters:
  /// * [r] - Red component (0-255)
  /// * [g] - Green component (0-255)
  /// * [b] - Blue component (0-255)
  ///
  /// Returns saturation value as percentage (0-100).
  static double _calculateSaturation(int r, int g, int b) {
    final double red = r / 255.0;
    final double green = g / 255.0;
    final double blue = b / 255.0;

    final double max = math.max(red, math.max(green, blue));
    final double min = math.min(red, math.min(green, blue));
    final double delta = max - min;

    if (delta == 0) return 0.0; // Achromatic (gray)

    final double lightness = (max + min) / 2.0;
    final double saturation = lightness > 0.5
        ? delta / (2.0 - max - min)
        : delta / (max + min);

    return saturation * 100.0;
  }

  /// Calculates the lightness component from RGB values.
  ///
  /// This method implements the standard RGB-to-HSL conversion algorithm
  /// for the lightness component. It determines the color's brightness
  /// based on the average of maximum and minimum RGB values.
  ///
  /// Parameters:
  /// * [r] - Red component (0-255)
  /// * [g] - Green component (0-255)
  /// * [b] - Blue component (0-255)
  ///
  /// Returns lightness value as percentage (0-100).
  static double _calculateLightness(int r, int g, int b) {
    final double red = r / 255.0;
    final double green = g / 255.0;
    final double blue = b / 255.0;

    final double max = math.max(red, math.max(green, blue));
    final double min = math.min(red, math.min(green, blue));
    final double lightness = (max + min) / 2.0;

    return lightness * 100.0;
  }

  /// Converts HSL values to RGB components.
  ///
  /// This method implements the standard HSL-to-RGB conversion algorithm,
  /// transforming hue, saturation, and lightness values into their
  /// corresponding red, green, and blue components.
  ///
  /// Parameters:
  /// * [h] - Hue in degrees (0-360)
  /// * [s] - Saturation as percentage (0-100)
  /// * [l] - Lightness as percentage (0-100)
  ///
  /// Returns a list containing [red, green, blue] values (0-255).
  static List<int> _hslToRgb(double h, double s, double l) {
    final double hue = h / 360.0;
    final double saturation = s / 100.0;
    final double lightness = l / 100.0;

    if (saturation == 0) {
      // Achromatic (gray)
      final int gray = (lightness * 255).round();
      return [gray, gray, gray];
    }

    final double q = lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    final double p = 2 * lightness - q;

    final double red = _hueToRgb(p, q, hue + 1 / 3);
    final double green = _hueToRgb(p, q, hue);
    final double blue = _hueToRgb(p, q, hue - 1 / 3);

    return [
      (red * 255).round(),
      (green * 255).round(),
      (blue * 255).round(),
    ];
  }

  /// Helper method for HSL to RGB conversion.
  ///
  /// This method handles the conversion of individual hue components
  /// to RGB values as part of the HSL-to-RGB algorithm. It applies
  /// the appropriate mathematical transformations based on the hue position.
  ///
  /// Parameters:
  /// * [p] - Calculated p value from HSL algorithm
  /// * [q] - Calculated q value from HSL algorithm
  /// * [t] - Normalized hue component
  ///
  /// Returns RGB component value (0.0-1.0).
  static double _hueToRgb(double p, double q, double t) {
    double hue = t;
    if (hue < 0) hue += 1;
    if (hue > 1) hue -= 1;
    if (hue < 1 / 6) return p + (q - p) * 6 * hue;
    if (hue < 1 / 2) return q;
    if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
    return p;
  }

  /// Linearizes a color component for luminance calculation.
  ///
  /// This method applies the sRGB gamma correction formula to convert
  /// color values from gamma-corrected space to linear space, which
  /// is required for accurate luminance calculations.
  ///
  /// Parameters:
  /// * [component] - Color component value (0.0-1.0)
  ///
  /// Returns linearized component value for luminance calculation.
  static double _linearizeColorComponent(double component) {
    return component <= 0.03928
        ? component / 12.92
        : math.pow((component + 0.055) / 1.055, 2.4).toDouble();
  }

  /// Provides a string representation of the color data.
  ///
  /// This method returns a comprehensive string representation that
  /// includes both RGB and HSL values, making it useful for debugging
  /// and logging color information during development.
  ///
  /// Returns a formatted string describing the color in both color spaces.
  @override
  String toString() {
    return 'ColorData('
        'RGB: ($red, $green, $blue), '
        'HSL: (${hue.toStringAsFixed(1)}, '
        '${saturation.toStringAsFixed(1)}%, '
        '${lightness.toStringAsFixed(1)}%)'
        ')';
  }

  /// Compares this color with another for equality.
  ///
  /// Two ColorData instances are considered equal if all their RGB
  /// components match exactly. HSL values are derived from RGB, so
  /// RGB equality ensures complete color equality.
  ///
  /// Parameters:
  /// * [other] - Object to compare with this color
  ///
  /// Returns true if colors are equal, false otherwise.
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ColorData &&
        other.red == red &&
        other.green == green &&
        other.blue == blue;
  }

  /// Generates a hash code for this color.
  ///
  /// The hash code is computed from RGB values to ensure that
  /// equal colors have equal hash codes, which is important for
  /// using colors in collections and for performance optimization.
  ///
  /// Returns an integer hash code for this color.
  @override
  int get hashCode {
    return Object.hash(red, green, blue);
  }
}

import 'package:flutter/material.dart';
import 'color_selector_controller.dart';

/// Color Selector Route
///
/// This route serves as the entry point for the color selector example,
/// demonstrating complex interactive widgets and dynamic styling capabilities.
/// The color selector provides real-time color manipulation through RGB and HSL
/// controls with live background updates and multiple format displays.
///
/// Key Features:
/// * Real-time color manipulation with RGB and HSL sliders
/// * Dynamic background color updates with contrast-aware text
/// * Multiple color format displays (hex, RGB, RGBA, HSL)
/// * Tap-to-copy functionality with clipboard integration
/// * Smooth color transition animations
/// * Input validation with visual feedback
///
/// This example showcases advanced Flutter UI patterns including:
/// * Complex state management with bidirectional data binding
/// * Custom widget composition and reusability
/// * Dynamic theming and contrast calculations
/// * Clipboard integration and user feedback
/// * Real-time input validation and error handling
class ColorSelectorRoute extends StatefulWidget {
  /// Creates a new color selector route.
  ///
  /// This route demonstrates complex UI interactions and serves as a
  /// comprehensive example for testing Flutter-to-Figma conversion
  /// of advanced widget patterns and dynamic styling.
  const ColorSelectorRoute({super.key});

  @override
  State<ColorSelectorRoute> createState() => ColorSelectorController();
}

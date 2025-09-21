import 'package:flutter/material.dart';
import 'color_selector_controller.dart';

/// Route entry point for the color selector example screen.
///
/// This StatefulWidget serves as the entry point for the color selector example following
/// the MVC architecture pattern. It creates and returns a ColorSelectorController instance
/// that manages the complex color state and manipulation operations.
///
/// The color selector example demonstrates advanced Flutter concepts:
/// * Advanced state management with dual color space representation
/// * Real-time UI updates with slider interactions and color preview
/// * Color format conversion between RGB, HSL, hex, and CSS formats
/// * Clipboard integration for copying color values
/// * Complex UI layouts with sliders, displays, and interactive elements
///
/// Architecture:
/// * Route (this class) - Entry point and widget lifecycle management
/// * Controller - Business logic, color calculations, and state management
/// * View - UI presentation with sliders, color preview, and format display
/// * Model - Immutable color data container (ColorData) with format conversions
///
/// Learning Objectives:
/// This example teaches developers how to create interactive UI components
/// with real-time feedback, manage complex state with multiple representations,
/// and implement advanced features like clipboard integration and format conversion.
class ColorSelectorRoute extends StatefulWidget {
  /// Creates the color selector route widget.
  ///
  /// The [key] parameter is used for widget identification in the widget tree
  /// and is typically provided by the Flutter framework for optimization purposes.
  const ColorSelectorRoute({super.key});

  /// Creates the controller state for this route.
  ///
  /// Returns a ColorSelectorController instance that extends State&lt;ColorSelectorRoute&gt; and
  /// handles all business logic, state management, and color manipulation operations for the
  /// color selector example. The controller follows the MVC pattern by managing complex
  /// color state and delegating UI presentation to the ColorSelectorView.
  ///
  /// @returns ColorSelectorController instance for managing this route's state and logic
  @override
  State<ColorSelectorRoute> createState() => ColorSelectorController();
}

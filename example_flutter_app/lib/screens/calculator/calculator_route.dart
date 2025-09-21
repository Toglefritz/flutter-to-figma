import 'package:flutter/material.dart';
import 'calculator_controller.dart';

/// Route entry point for the calculator example screen.
///
/// This StatefulWidget serves as the entry point for the calculator example following
/// the MVC architecture pattern. It creates and returns a CalculatorController instance
/// that manages the complex calculator state and mathematical operations.
///
/// The calculator example demonstrates advanced Flutter concepts:
/// * Complex state management with immutable state objects
/// * Mathematical operations with proper order of operations
/// * Grid-based UI layout with responsive design
/// * Error handling for edge cases (division by zero, overflow)
/// * User input validation and state transitions
///
/// Architecture:
/// * Route (this class) - Entry point and widget lifecycle management
/// * Controller - Business logic, state management, and mathematical operations
/// * View - UI presentation with grid layout and button interactions
/// * Model - Immutable state container (CalculatorState) for predictable updates
///
/// Learning Objectives:
/// This example teaches developers how to manage complex state in Flutter
/// applications, implement mathematical operations with proper error handling,
/// and create responsive grid layouts for optimal user experience.
class CalculatorRoute extends StatefulWidget {
  /// Creates the calculator route widget.
  ///
  /// The [key] parameter is used for widget identification in the widget tree
  /// and is typically provided by the Flutter framework for optimization purposes.
  const CalculatorRoute({super.key});

  /// Creates the controller state for this route.
  ///
  /// Returns a CalculatorController instance that extends State&lt;CalculatorRoute&gt; and
  /// handles all business logic, state management, and mathematical operations for the
  /// calculator example. The controller follows the MVC pattern by managing complex
  /// state through immutable objects and delegating UI presentation to the CalculatorView.
  ///
  /// @returns CalculatorController instance for managing this route's state and logic
  @override
  State<CalculatorRoute> createState() => CalculatorController();
}

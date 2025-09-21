import 'package:flutter/material.dart';
import 'counter_controller.dart';

/// Route entry point for the counter example screen.
///
/// This StatefulWidget serves as the entry point for the counter example following
/// the MVC architecture pattern. It creates and returns a CounterController instance
/// that manages the counter state and business logic.
///
/// The counter example demonstrates fundamental Flutter concepts:
/// * State management using setState() for reactive UI updates
/// * User interaction handling through button presses
/// * Proper separation of concerns with MVC architecture
/// * Material Design components and theming
///
/// Architecture:
/// * Route (this class) - Entry point and widget lifecycle management
/// * Controller - Business logic, state management, and event handling
/// * View - UI presentation and user interaction forwarding
///
/// Learning Objectives:
/// This example teaches developers how to manage simple state in Flutter
/// applications and demonstrates the reactive nature of Flutter's UI framework
/// where state changes automatically trigger UI rebuilds.
class CounterRoute extends StatefulWidget {
  /// Creates the counter route widget.
  ///
  /// The [key] parameter is used for widget identification in the widget tree
  /// and is typically provided by the Flutter framework for optimization purposes.
  const CounterRoute({super.key});

  /// Creates the controller state for this route.
  ///
  /// Returns a CounterController instance that extends State&lt;CounterRoute&gt; and
  /// handles all business logic, state management, and event handling for the
  /// counter example. The controller follows the MVC pattern by managing state
  /// and delegating UI presentation to the CounterView.
  ///
  /// @returns CounterController instance for managing this route's state and logic
  @override
  State<CounterRoute> createState() => CounterController();
}

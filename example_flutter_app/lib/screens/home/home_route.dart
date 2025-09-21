import 'package:flutter/material.dart';
import 'home_controller.dart';

/// Route entry point for the home navigation screen.
///
/// This StatefulWidget serves as the entry point for the home screen following
/// the MVC architecture pattern. It creates and returns a HomeController instance
/// that manages the business logic and state for the home navigation interface.
///
/// The home screen provides the main navigation interface for the Flutter Examples
/// app, displaying available examples in a grid layout with navigation cards.
/// Users can tap on cards to navigate to specific example screens.
///
/// Architecture:
/// * Route (this class) - Entry point and widget lifecycle management
/// * Controller - Business logic, navigation, and state management
/// * View - UI presentation and user interaction handling
///
/// Navigation Pattern:
/// Uses MaterialPageRoute for type-safe navigation without named routes,
/// following Flutter best practices for parameter passing and navigation stack management.
class HomeRoute extends StatefulWidget {
  /// Creates the home route widget.
  ///
  /// The [key] parameter is used for widget identification in the widget tree
  /// and is typically provided by the Flutter framework for optimization purposes.
  const HomeRoute({super.key});

  /// Creates the controller state for this route.
  ///
  /// Returns a HomeController instance that extends State&lt;HomeRoute&gt; and
  /// handles all business logic, navigation, and state management for the home screen.
  /// The controller follows the MVC pattern by managing state and delegating
  /// UI presentation to the HomeView.
  ///
  /// @returns HomeController instance for managing this route's state and logic
  @override
  State<HomeRoute> createState() => HomeController();
}

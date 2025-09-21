import 'package:flutter/material.dart';

import '../calculator/calculator_route.dart';
import '../color_selector/color_selector_route.dart';
import '../counter/counter_route.dart';
import 'home_route.dart';
import 'home_view.dart';

/// Controller for the home navigation screen business logic and state management.
///
/// This controller extends State&lt;HomeRoute&gt; and implements the controller layer
/// of the MVC pattern. It handles navigation actions to different example screens
/// and manages any state related to the home screen functionality.
///
/// Navigation Strategy:
/// Uses MaterialPageRoute for direct route construction rather than named routes,
/// providing type safety and enabling parameter passing between screens.
/// Each navigation method creates a new route and pushes it onto the Flutter
/// navigation stack, allowing users to return via the back button.
///
/// State Management:
/// Currently stateless as the home screen only provides navigation functionality.
/// Future enhancements could include tracking visited examples, user preferences,
/// or dynamic example loading.
///
/// Thread Safety: All navigation operations are performed on the main UI thread
/// through Flutter's Navigator, ensuring thread-safe navigation stack management.
class HomeController extends State<HomeRoute> {
  /// Navigates to the counter example screen.
  ///
  /// Creates a new MaterialPageRoute for the CounterRoute and pushes it onto
  /// the navigation stack. The counter example demonstrates basic state management
  /// with increment functionality and reset capabilities.
  ///
  /// Navigation is asynchronous and returns a Future that completes when the
  /// user returns from the counter screen. The return value can be used to
  /// handle any data passed back from the counter screen.
  ///
  /// Error Handling: Navigation errors are handled by the Flutter framework
  /// and typically indicate issues with route construction or navigation state.
  void navigateToCounter() {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (BuildContext context) => const CounterRoute(),
      ),
    );
  }

  /// Navigates to the calculator example screen.
  ///
  /// Creates a new MaterialPageRoute for the CalculatorRoute and pushes it onto
  /// the navigation stack. The calculator example demonstrates grid-based layout
  /// with mathematical operations and complex state management.
  ///
  /// The calculator supports basic arithmetic operations (+, -, *, /) with
  /// proper order of operations and error handling for edge cases like
  /// division by zero.
  ///
  /// Error Handling: Navigation errors are handled by the Flutter framework
  /// and typically indicate issues with route construction or navigation state.
  void navigateToCalculator() {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (BuildContext context) => const CalculatorRoute(),
      ),
    );
  }

  /// Navigates to the color selector example screen.
  ///
  /// Creates a new MaterialPageRoute for the ColorSelectorRoute and pushes it onto
  /// the navigation stack. The color selector example demonstrates advanced UI
  /// components with real-time updates and multiple color format support.
  ///
  /// The color selector supports both RGB and HSL color manipulation with
  /// live preview, format conversion, and clipboard integration for copying
  /// color values in various formats (hex, RGB, HSL).
  ///
  /// Error Handling: Navigation errors are handled by the Flutter framework
  /// and typically indicate issues with route construction or navigation state.
  void navigateToColorSelector() {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (BuildContext context) => const ColorSelectorRoute(),
      ),
    );
  }

  /// Builds the home screen UI by delegating to HomeView.
  ///
  /// This method implements the MVC pattern by creating a HomeView instance
  /// and passing this controller as a parameter. The view handles all UI
  /// presentation while the controller manages business logic and navigation.
  ///
  /// The build method is called by Flutter whenever the widget needs to be
  /// rendered or updated, typically in response to state changes or parent
  /// widget updates.
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns HomeView widget configured with this controller instance
  @override
  Widget build(BuildContext context) => HomeView(this);
}

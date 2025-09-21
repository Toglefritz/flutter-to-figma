import 'package:flutter/material.dart';
import 'counter_route.dart';
import 'counter_view.dart';

/// Controller for the counter example business logic and state management.
///
/// This controller extends State&lt;CounterRoute&gt; and implements the controller layer
/// of the MVC pattern. It manages the counter value state and provides methods
/// for user interactions while ensuring the UI stays synchronized with state changes.
///
/// State Management Strategy:
/// Uses Flutter's setState() method for simple, predictable state updates.
/// Each state change triggers a rebuild of the UI components that depend on
/// the counter value, demonstrating Flutter's reactive programming model.
///
/// Business Logic:
/// * Increment: Increases counter by 1 with bounds checking (prevents overflow)
/// * Reset: Sets counter back to 0 for starting fresh
/// * State synchronization: Automatic UI updates through setState()
///
/// Thread Safety: All state modifications occur on the main UI thread through
/// setState(), ensuring thread-safe state management and UI consistency.
///
/// Performance: The simple integer state and targeted setState() calls provide
/// optimal performance for this use case with minimal computational overhead.
class CounterController extends State<CounterRoute> {
  /// Current counter value displayed in the UI.
  ///
  /// This integer represents the current state of the counter and is
  /// automatically synchronized with the UI through setState() calls.
  /// The value starts at 0 and can be incremented or reset by user actions.
  ///
  /// Range: 0 to maximum integer value (2^63 - 1 on 64-bit platforms)
  /// The implementation includes overflow protection to prevent unexpected behavior.
  int counter = 0;

  /// Increments the counter value by 1 and updates the UI.
  ///
  /// This method increases the counter value by 1 and triggers a UI rebuild
  /// through setState(). The increment operation includes overflow protection
  /// to prevent integer overflow on platforms with limited integer ranges.
  ///
  /// State Changes:
  /// * counter value increases by 1
  /// * UI automatically rebuilds to show new value
  /// * FloatingActionButton remains enabled for continued interaction
  ///
  /// Performance: O(1) operation with minimal computational overhead.
  /// The setState() call is optimized by Flutter to only rebuild widgets
  /// that depend on the changed state.
  ///
  /// Error Handling: Includes overflow protection to prevent unexpected
  /// behavior when approaching maximum safe integer values. Uses a safe
  /// maximum value that works across all platforms including web (JavaScript).
  void incrementCounter() {
    setState(() {
      // Overflow protection: prevent increment if at maximum safe value
      // Using Number.MAX_SAFE_INTEGER equivalent (2^53 - 1) for web compatibility
      const int maxSafeInteger = 9007199254740991;
      if (counter < maxSafeInteger) {
        counter++;
      }
    });
  }

  /// Resets the counter value to 0 and updates the UI.
  ///
  /// This method sets the counter back to its initial value of 0 and triggers
  /// a UI rebuild through setState(). This provides users with a way to start
  /// fresh without navigating away from the screen.
  ///
  /// State Changes:
  /// * counter value set to 0
  /// * UI automatically rebuilds to show reset value
  /// * All interaction buttons remain functional
  ///
  /// Use Cases:
  /// * Starting a new counting session
  /// * Clearing accumulated count for fresh start
  /// * Demonstrating state reset functionality
  ///
  /// Performance: O(1) operation with immediate UI feedback through setState().
  void resetCounter() {
    setState(() {
      counter = 0;
    });
  }

  /// Builds the counter screen UI by delegating to CounterView.
  ///
  /// This method implements the MVC pattern by creating a CounterView instance
  /// and passing this controller as a parameter. The view handles all UI
  /// presentation while the controller manages business logic and state.
  ///
  /// The build method is called by Flutter whenever the widget needs to be
  /// rendered or updated, typically in response to setState() calls or parent
  /// widget updates.
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns CounterView widget configured with this controller instance
  @override
  Widget build(BuildContext context) => CounterView(this);
}

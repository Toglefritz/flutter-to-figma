import 'package:flutter/material.dart';
import 'counter_controller.dart';

/// View layer for the counter example UI presentation.
///
/// This StatelessWidget implements the view layer of the MVC pattern,
/// handling only UI presentation and user interaction forwarding.
/// All business logic and state management is delegated to the CounterController
/// passed as a constructor parameter.
///
/// Layout Design:
/// * AppBar with title, theme-consistent styling, and reset action
/// * Centered body with descriptive text and prominent counter display
/// * FloatingActionButton for primary increment action
/// * Material Design theming throughout for consistent visual language
///
/// User Experience:
/// * Clear visual hierarchy with large, bold counter display
/// * Intuitive interaction patterns (FAB for primary action, icon for secondary)
/// * Immediate visual feedback for all user actions
/// * Accessible design with proper tooltips and semantic structure
///
/// Accessibility Features:
/// * Semantic labels and tooltips for screen readers
/// * High contrast colors following Material Design guidelines
/// * Proper touch targets meeting minimum size requirements
/// * Clear visual hierarchy for users with visual impairments
///
/// Performance:
/// * Stateless widget for optimal rebuild performance
/// * Minimal widget tree depth for fast rendering
/// * Efficient text rendering with theme-based styling
class CounterView extends StatelessWidget {
  /// Creates the counter view with the specified controller.
  ///
  /// @param state The CounterController instance that manages business logic
  /// @param key Optional widget key for identification in the widget tree
  const CounterView(this.state, {super.key});

  /// Controller instance that handles business logic and state management.
  ///
  /// This controller provides the current counter value and methods for
  /// incrementing and resetting the counter. The view accesses the counter
  /// value for display and calls controller methods in response to user actions.
  final CounterController state;

  /// Builds the counter screen UI with centered layout and Material Design components.
  ///
  /// Creates a Scaffold with an AppBar containing a reset action, a centered body
  /// displaying the current counter value with descriptive text, and a
  /// FloatingActionButton for incrementing the counter.
  ///
  /// Layout Structure:
  /// 1. AppBar with title and reset IconButton in actions
  /// 2. Centered body with Column containing:
  ///    - Descriptive text explaining the counter functionality
  ///    - Large, bold counter value with theme-consistent styling
  /// 3. FloatingActionButton for primary increment action
  ///
  /// Visual Hierarchy:
  /// * AppBar provides context and secondary actions
  /// * Body centers attention on the counter value
  /// * Counter value uses large, bold typography for prominence
  /// * Primary color theming creates visual consistency
  /// * Proper spacing creates breathing room and clear relationships
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns Scaffold widget containing the complete counter screen UI
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Counter Example'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          Semantics(
            button: true,
            label: 'Reset counter to zero',
            child: IconButton(
              onPressed: state.resetCounter,
              icon: const Icon(Icons.refresh),
              tooltip: 'Reset Counter',
            ),
          ),
        ],
      ),
      body: Semantics(
        label: 'Counter display area',
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Semantics(
                label: 'Counter description',
                child: const Text(
                  'You have pushed the button this many times:',
                  style: TextStyle(fontSize: 16.0),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 16.0),
                child: Semantics(
                  label: 'Current counter value: ${state.counter}',
                  liveRegion: true,
                  child: Text(
                    '${state.counter}',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: Semantics(
        button: true,
        label: 'Increment counter by one',
        child: FloatingActionButton(
          onPressed: state.incrementCounter,
          tooltip: 'Increment',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

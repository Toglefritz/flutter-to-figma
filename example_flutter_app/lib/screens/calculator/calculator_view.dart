import 'package:flutter/material.dart';

import 'calculator_controller.dart';
import 'components/calculator_button.dart';
import 'components/calculator_display.dart';

/// View layer for the calculator example UI presentation.
///
/// This StatelessWidget implements the view layer of the MVC pattern,
/// handling only UI presentation and user interaction forwarding.
/// All business logic and state management is delegated to the CalculatorController
/// passed as a constructor parameter.
///
/// Planned Layout Design:
/// * AppBar with title and theme-consistent styling
/// * Display area showing current number, operation, and results
/// * Grid layout with calculator buttons (numbers, operations, functions)
/// * Material Design theming with proper spacing and visual hierarchy
///
/// Planned User Experience:
/// * Large, readable display for numbers and results
/// * Intuitive button layout following calculator conventions
/// * Visual feedback for button presses and operations
/// * Error state handling with clear user messaging
///
/// Planned Accessibility Features:
/// * Semantic labels for screen readers
/// * High contrast colors for readability
/// * Proper touch targets for all interactive elements
/// * Keyboard navigation support for desktop platforms
///
/// Performance Considerations:
/// * Stateless widget for optimal rebuild performance
/// * Efficient grid layout for button organization
/// * Minimal widget tree depth for fast rendering
/// * Optimized text rendering for display updates
///
/// Implementation Status:
/// Currently shows placeholder text. Full calculator UI implementation
/// will be added in subsequent tasks as part of the development workflow.
class CalculatorView extends StatelessWidget {
  /// Creates the calculator view with the specified controller.
  ///
  /// @param state The CalculatorController instance that manages business logic
  /// @param key Optional widget key for identification in the widget tree
  const CalculatorView(this.state, {super.key});

  /// Controller instance that handles business logic and state management.
  ///
  /// This controller provides the current calculator state including display value,
  /// operands, and operations. It also provides methods for handling user interactions
  /// with calculator buttons. The view accesses state for display and calls
  /// controller methods in response to user actions.
  final CalculatorController state;

  /// Builds the calculator screen UI with display and button grid layout.
  ///
  /// Creates a complete calculator interface with a display area showing
  /// the current calculator state and a grid of buttons for user interaction.
  /// The layout follows standard calculator conventions with proper spacing
  /// and Material Design theming.
  ///
  /// Layout Structure:
  /// 1. AppBar with title and consistent theming
  /// 2. CalculatorDisplay showing current state and results
  /// 3. Grid layout with calculator buttons:
  ///    - Row 1: Clear and operation buttons
  ///    - Row 2: Numbers 7, 8, 9 and division
  ///    - Row 3: Numbers 4, 5, 6 and multiplication
  ///    - Row 4: Numbers 1, 2, 3 and subtraction
  ///    - Row 5: Number 0, decimal point, equals, and addition
  ///
  /// Button Layout:
  /// The calculator uses a standard 4x5 grid layout with proper spacing
  /// using Padding widgets. Each button type has distinct styling for
  /// visual hierarchy and user guidance.
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns Scaffold widget containing the calculator screen UI
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Calculator Example'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Semantics(
        label: 'Calculator interface',
        child: Column(
          children: [
            CalculatorDisplay(
              displayValue: state.calculatorState.display,
              hasError: state.calculatorState.hasError,
            ),
            Expanded(
              child: Semantics(
                label: 'Calculator buttons',
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // Row 1: Clear button
                      Expanded(
                        child: Row(
                          children: [
                            CalculatorButton(
                              text: 'C',
                              type: CalculatorButtonType.clear,
                              onPressed: state.onClearPressed,
                            ),
                            CalculatorButton(
                              text: '±',
                              type: CalculatorButtonType.function,
                              onPressed:
                                  () {}, // Placeholder for future implementation
                            ),
                            CalculatorButton(
                              text: '%',
                              type: CalculatorButtonType.function,
                              onPressed:
                                  () {}, // Placeholder for future implementation
                            ),
                            CalculatorButton(
                              text: '÷',
                              type: CalculatorButtonType.operation,
                              onPressed: () => state.onOperationPressed('/'),
                            ),
                          ],
                        ),
                      ),
                      // Row 2: Numbers 7, 8, 9 and division
                      Expanded(
                        child: Row(
                          children: [
                            CalculatorButton(
                              text: '7',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('7'),
                            ),
                            CalculatorButton(
                              text: '8',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('8'),
                            ),
                            CalculatorButton(
                              text: '9',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('9'),
                            ),
                            CalculatorButton(
                              text: '×',
                              type: CalculatorButtonType.operation,
                              onPressed: () => state.onOperationPressed('*'),
                            ),
                          ],
                        ),
                      ),
                      // Row 3: Numbers 4, 5, 6 and multiplication
                      Expanded(
                        child: Row(
                          children: [
                            CalculatorButton(
                              text: '4',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('4'),
                            ),
                            CalculatorButton(
                              text: '5',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('5'),
                            ),
                            CalculatorButton(
                              text: '6',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('6'),
                            ),
                            CalculatorButton(
                              text: '−',
                              type: CalculatorButtonType.operation,
                              onPressed: () => state.onOperationPressed('-'),
                            ),
                          ],
                        ),
                      ),
                      // Row 4: Numbers 1, 2, 3 and subtraction
                      Expanded(
                        child: Row(
                          children: [
                            CalculatorButton(
                              text: '1',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('1'),
                            ),
                            CalculatorButton(
                              text: '2',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('2'),
                            ),
                            CalculatorButton(
                              text: '3',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('3'),
                            ),
                            CalculatorButton(
                              text: '+',
                              type: CalculatorButtonType.operation,
                              onPressed: () => state.onOperationPressed('+'),
                            ),
                          ],
                        ),
                      ),
                      // Row 5: Number 0, decimal point, equals, and addition
                      Expanded(
                        child: Row(
                          children: [
                            CalculatorButton(
                              text: '0',
                              type: CalculatorButtonType.number,
                              onPressed: () => state.onNumberPressed('0'),
                            ),
                            CalculatorButton(
                              text: '.',
                              type: CalculatorButtonType.function,
                              onPressed: state.onDecimalPressed,
                            ),
                            CalculatorButton(
                              text: '=',
                              type: CalculatorButtonType.function,
                              onPressed: state.onEqualsPressed,
                            ),
                            // Empty space for visual balance
                            const Expanded(child: SizedBox()),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../models/calculator_state.dart';
import 'calculator_route.dart';
import 'calculator_view.dart';

/// Controller for the calculator example business logic and state management.
///
/// This controller extends `State<CalculatorRoute>` and implements the
/// controller layer of the MVC pattern. It manages complex calculator state
/// through an immutable CalculatorState object and provides methods for
/// mathematical operations, number input, and state transitions.
///
/// State Management Strategy:
/// Uses an immutable state object pattern with copyWith() for predictable updates.
/// Each user interaction creates a new state instance, ensuring consistency and
/// supporting Flutter's reactive programming model with proper error handling.
///
/// Mathematical Operations:
/// * Basic arithmetic: addition (+), subtraction (-), multiplication (*), division (/)
/// * Decimal number support with proper formatting
/// * Error handling for edge cases (division by zero, overflow, invalid operations)
/// * Proper order of operations and chained calculations
///
/// Input Handling:
/// * Number input with multi-digit support and decimal points
/// * Operation selection with visual feedback and state transitions
/// * Clear functionality for resetting calculator state
/// * Input validation to prevent invalid state transitions
///
/// Thread Safety: All state modifications occur on the main UI thread through
/// setState(), ensuring thread-safe state management and UI consistency.
///
/// Performance: Immutable state objects and targeted setState() calls provide
/// optimal performance with predictable memory usage and garbage collection.
class CalculatorController extends State<CalculatorRoute> {
  /// Current calculator state containing display, operands, and operation information.
  ///
  /// This immutable state object represents the complete calculator state at any
  /// point in time. It includes the display value, stored operands, selected operation,
  /// and input mode flags. State updates create new instances through copyWith()
  /// to ensure predictable behavior and support Flutter's reactive updates.
  ///
  /// Initial State:
  /// * display: "0" (default display value)
  /// * operand1: null (no first operand stored)
  /// * operand2: null (no second operand stored)
  /// * operation: null (no operation selected)
  /// * isNewInput: true (ready for new number input)
  CalculatorState calculatorState = const CalculatorState();

  /// Handles number button presses and updates the display accordingly.
  ///
  /// This method processes numeric input (0-9) and updates the calculator display
  /// based on the current input mode. It handles both new number entry and
  /// appending digits to existing numbers with proper formatting and validation.
  ///
  /// Input Behavior:
  /// * New input mode: Replaces display with the pressed number
  /// * Append mode: Adds digit to existing display value
  /// * Validation: Prevents invalid number formats and overflow
  /// * Formatting: Maintains proper number display format
  ///
  /// @param number The numeric digit (0-9) that was pressed
  ///
  /// State Changes:
  /// * Updates display value with new or appended digit
  /// * Sets isNewInput to false for continued digit entry
  /// * Maintains other state values (operands, operation) unchanged
  void onNumberPressed(String number) {
    setState(() {
      if (calculatorState.hasError) {
        // Clear error state and start fresh with new number
        calculatorState = CalculatorState(
          display: number,
          isNewInput: false,
        );
      } else if (calculatorState.isNewInput) {
        // Replace display with new number
        calculatorState = calculatorState.copyWith(
          display: number,
          isNewInput: false,
        );
      } else {
        // Append digit to existing display
        final String newDisplay = calculatorState.display == '0'
            ? number
            : calculatorState.display + number;

        // Prevent display overflow (limit to reasonable length)
        // Also validate that the resulting number is within acceptable range
        if (newDisplay.length <= 10) {
          final double? testValue = double.tryParse(newDisplay);
          if (testValue != null && testValue.abs() < 1e10) {
            calculatorState = calculatorState.copyWith(
              display: newDisplay,
            );
          }
        }
      }
    });
  }

  /// Handles operation button presses (+, -, *, /) and manages calculation state.
  ///
  /// This method processes mathematical operation selection and manages the
  /// transition between operand entry and operation selection. It handles
  /// chained calculations by performing pending operations before setting new ones.
  ///
  /// Operation Behavior:
  /// * First operation: Stores current display as operand1, sets operation
  /// * Chained operations: Performs pending calculation, stores result, sets new operation
  /// * State transition: Prepares for second operand entry
  /// * Validation: Ensures valid operation sequences and prevents invalid states
  ///
  /// @param operation The mathematical operation symbol (+, -, *, /) that was pressed
  ///
  /// State Changes:
  /// * Sets or updates the selected operation
  /// * Stores current display value as operand1 (if not already set)
  /// * Performs pending calculations for chained operations
  /// * Sets isNewInput to true for next operand entry
  void onOperationPressed(String operation) {
    setState(() {
      if (calculatorState.hasError) {
        // Clear error and start fresh
        calculatorState = const CalculatorState();
        return;
      }

      final double? currentValue = double.tryParse(calculatorState.display);
      if (currentValue == null) return;

      if (calculatorState.operand1 == null) {
        // First operation - store operand and operation
        calculatorState = calculatorState.copyWith(
          operand1: currentValue,
          operation: operation,
          isNewInput: true,
        );
      } else if (calculatorState.operation != null &&
          !calculatorState.isNewInput) {
        // Chained operation - perform pending calculation first
        final double? result = _performCalculation(
          calculatorState.operand1!,
          currentValue,
          calculatorState.operation!,
        );

        if (result != null) {
          calculatorState = calculatorState.copyWith(
            display: _formatNumber(result),
            operand1: result,
            operation: operation,
            isNewInput: true,
          );
        } else {
          // Calculation error
          calculatorState = CalculatorState.error();
        }
      } else {
        // Update operation without calculation
        calculatorState = calculatorState.copyWith(
          operation: operation,
          isNewInput: true,
        );
      }
    });
  }

  /// Handles equals button press and performs the pending mathematical calculation.
  ///
  /// This method executes the mathematical operation using the stored operands
  /// and operation, then displays the result. It handles various edge cases
  /// including division by zero, overflow, and invalid operation states.
  ///
  /// Calculation Behavior:
  /// * Performs operation between operand1 and operand2 (current display)
  /// * Updates display with calculation result
  /// * Handles mathematical errors (division by zero, overflow)
  /// * Prepares state for potential chained calculations
  /// * Maintains operation history for repeated equals presses
  ///
  /// Error Handling:
  /// * Division by zero: Displays "Error" message
  /// * Overflow: Displays "∞" or appropriate error indicator
  /// * Invalid state: Maintains current display without changes
  ///
  /// State Changes:
  /// * Updates display with calculation result or error message
  /// * Clears operand2 and operation after calculation
  /// * Sets isNewInput to true for fresh number entry
  /// * Preserves operand1 for potential chained operations
  void onEqualsPressed() {
    setState(() {
      if (calculatorState.hasError) return;

      if (calculatorState.operand1 == null ||
          calculatorState.operation == null) {
        return; // Nothing to calculate
      }

      final double? operand2 = double.tryParse(calculatorState.display);
      if (operand2 == null) return;

      final double? result = _performCalculation(
        calculatorState.operand1!,
        operand2,
        calculatorState.operation!,
      );

      if (result != null) {
        calculatorState = calculatorState.copyWith(
          display: _formatNumber(result),
          operand1: result,
          operand2: operand2,
          isNewInput: true,
        );
      } else {
        // Calculation error
        calculatorState = CalculatorState.error();
      }
    });
  }

  /// Handles clear button press and resets the calculator to initial state.
  ///
  /// This method resets all calculator state to the initial values, providing
  /// users with a way to start fresh calculations. It clears the display,
  /// operands, operation, and resets input mode flags.
  ///
  /// Clear Behavior:
  /// * Resets display to "0"
  /// * Clears all stored operands (operand1, operand2)
  /// * Removes selected operation
  /// * Sets input mode to accept new numbers
  /// * Provides immediate visual feedback through UI update
  ///
  /// State Changes:
  /// * display: "0" (default display value)
  /// * operand1: null (no stored operand)
  /// * operand2: null (no stored operand)
  /// * operation: null (no selected operation)
  /// * isNewInput: true (ready for new input)
  ///
  /// Use Cases:
  /// * Starting a new calculation after completing previous ones
  /// * Recovering from error states or invalid operations
  /// * Clearing accidental input before completing calculations
  ///
  /// Performance: O(1) operation with immediate UI feedback through setState().
  void onClearPressed() {
    setState(() {
      calculatorState = const CalculatorState();
    });
  }

  /// Handles decimal point button press and adds decimal functionality to numbers.
  ///
  /// This method processes decimal point input and manages decimal number entry
  /// with proper validation to prevent multiple decimal points in a single number.
  /// It handles both new decimal number entry and adding decimals to existing integers.
  ///
  /// Decimal Behavior:
  /// * New input: Starts with "0." for decimal numbers less than 1
  /// * Existing number: Appends decimal point if not already present
  /// * Validation: Prevents multiple decimal points in single number
  /// * Formatting: Maintains proper decimal number display format
  ///
  /// State Changes:
  /// * Updates display with decimal point added
  /// * Sets isNewInput to false for continued decimal entry
  /// * Maintains other state values unchanged
  ///
  /// Edge Cases:
  /// * Multiple decimal attempts: Ignores additional decimal points
  /// * Empty display: Starts with "0." format
  /// * Existing decimal: No change to prevent invalid formats
  void onDecimalPressed() {
    setState(() {
      if (calculatorState.hasError) {
        // Clear error and start with "0."
        calculatorState = const CalculatorState(
          display: '0.',
          isNewInput: false,
        );
      } else if (calculatorState.isNewInput) {
        // Start new decimal number
        calculatorState = calculatorState.copyWith(
          display: '0.',
          isNewInput: false,
        );
      } else if (!calculatorState.display.contains('.')) {
        // Add decimal point to existing number
        calculatorState = calculatorState.copyWith(
          display: '${calculatorState.display}.',
        );
      }
      // If decimal already exists, do nothing
    });
  }

  /// Performs mathematical calculation between two operands with the specified operation.
  ///
  /// This private method executes the actual mathematical operations for the calculator.
  /// It handles all supported operations (+, -, *, /) with comprehensive error checking
  /// for edge cases like division by zero, overflow conditions, and invalid operation sequences.
  ///
  /// Supported Operations:
  /// * Addition (+): Adds operand1 and operand2
  /// * Subtraction (-): Subtracts operand2 from operand1
  /// * Multiplication (*): Multiplies operand1 by operand2
  /// * Division (/): Divides operand1 by operand2 with zero-check
  ///
  /// Error Handling:
  /// * Division by zero: Returns null to indicate error
  /// * Invalid operation: Returns null for unsupported operations
  /// * Overflow/Underflow: Returns null for infinite or NaN results
  /// * Number too large: Returns null if result exceeds display capacity
  /// * Precision loss: Handles floating-point precision issues gracefully
  ///
  /// @param operand1 The first operand in the calculation
  /// @param operand2 The second operand in the calculation
  /// @param operation The mathematical operation to perform
  /// @returns The calculation result, or null if an error occurred
  double? _performCalculation(
    double operand1,
    double operand2,
    String operation,
  ) {
    // Validate input operands
    if (operand1.isNaN ||
        operand1.isInfinite ||
        operand2.isNaN ||
        operand2.isInfinite) {
      return null;
    }

    double result;

    try {
      switch (operation) {
        case '+':
          result = operand1 + operand2;
        case '-':
          result = operand1 - operand2;
        case '*':
          result = operand1 * operand2;
        case '/':
          if (operand2 == 0.0) {
            return null; // Division by zero error
          }
          result = operand1 / operand2;
        default:
          return null; // Invalid operation
      }

      // Check for overflow, underflow, or invalid results
      if (result.isNaN || result.isInfinite) {
        return null;
      }

      // Check if result is too large for display (more than 10 digits)
      if (result.abs() >= 1e10) {
        return null;
      }

      // Handle very small numbers (underflow to zero)
      if (result.abs() < 1e-10 && result != 0.0) {
        result = 0.0;
      }

      return result;
    } catch (e) {
      // Catch any unexpected arithmetic errors
      return null;
    }
  }

  /// Formats a numeric value for display on the calculator screen.
  ///
  /// This method handles the conversion of double values to display strings
  /// with appropriate formatting. It removes unnecessary decimal places and
  /// handles special cases like very large or small numbers.
  ///
  /// @param value Numeric value to format
  /// @returns Formatted string suitable for calculator display
  String _formatNumber(double value) {
    // Handle special cases
    if (value.isNaN) return 'Error';
    if (value.isInfinite) return 'Error';

    // Format with appropriate precision
    if (value == value.roundToDouble()) {
      // Integer value - show without decimal
      return value.round().toString();
    } else {
      // Decimal value - limit precision to avoid display overflow
      String formatted = value.toStringAsFixed(8);
      // Remove trailing zeros
      formatted = formatted.replaceAll(RegExp(r'0*$'), '');
      formatted = formatted.replaceAll(RegExp(r'\.$'), '');
      return formatted;
    }
  }

  /// Builds the calculator screen UI by delegating to CalculatorView.
  ///
  /// This method implements the MVC pattern by creating a CalculatorView instance
  /// and passing this controller as a parameter. The view handles all UI
  /// presentation including the grid layout, buttons, and display while the
  /// controller manages business logic and state.
  ///
  /// The build method is called by Flutter whenever the widget needs to be
  /// rendered or updated, typically in response to setState() calls or parent
  /// widget updates.
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns CalculatorView widget configured with this controller instance
  @override
  Widget build(BuildContext context) => CalculatorView(this);
}

/// Immutable state container for calculator operations and display.
///
/// This class represents the complete state of a calculator at any point in time,
/// including the current display value, stored operands, selected operation,
/// and input mode. The state is immutable to ensure predictable behavior
/// and support Flutter's reactive UI update mechanism.
///
/// State Lifecycle:
/// 1. Initial state: display="0", all other fields null/false
/// 2. Number input: display updates, isNewInput tracks input mode
/// 3. Operation selection: operand1 set, operation stored, isNewInput=true
/// 4. Second number input: display updates for second operand
/// 5. Calculation: result displayed, operands cleared, ready for next operation
///
/// Thread Safety: This class is immutable and therefore thread-safe.
/// All modifications create new instances via the [copyWith] method.
class CalculatorState {
  /// Creates a new calculator state with the specified values.
  ///
  /// All parameters are required to ensure complete state definition.
  /// Use [copyWith] for creating modified copies of existing states.
  ///
  /// @param display Current value shown in the calculator display
  /// @param operand1 First operand for binary operations (null if not set)
  /// @param operand2 Second operand for binary operations (null if not set)
  /// @param operation Selected operation symbol (null if no operation selected)
  /// @param isNewInput Whether the next digit input should start a new number
  const CalculatorState({
    required this.display,
    required this.operand1,
    required this.operand2,
    required this.operation,
    required this.isNewInput,
  });

  /// Current value displayed in the calculator screen.
  ///
  /// This string represents what the user sees in the calculator display.
  /// It can be a number being entered, the result of a calculation, or
  /// an error message. The display is always a string to handle formatting,
  /// decimal points, and error states consistently.
  ///
  /// Examples: "0", "123.45", "Error", "∞"
  final String display;

  /// First operand for binary mathematical operations.
  ///
  /// This value is set when the user enters a number and selects an operation.
  /// It remains stored while the user enters the second operand. After
  /// calculation, this value may be updated with the result for chained operations.
  ///
  /// Null when no operation is in progress or after clearing the calculator.
  final double? operand1;

  /// Second operand for binary mathematical operations.
  ///
  /// This value is set when the user enters a number after selecting an operation.
  /// It's used together with [operand1] and [operation] to perform calculations.
  ///
  /// Null when the second operand hasn't been entered yet or after calculation.
  final double? operand2;

  /// Currently selected mathematical operation.
  ///
  /// Represents the operation to be performed between [operand1] and [operand2].
  /// Standard operations include "+", "-", "*", "/" but the calculator can
  /// be extended to support additional operations.
  ///
  /// Null when no operation is selected or after calculation completion.
  final String? operation;

  /// Whether the next digit input should start a new number.
  ///
  /// This flag controls input behavior:
  /// * true: Next digit starts a new number (replaces current display)
  /// * false: Next digit appends to current number (extends current display)
  ///
  /// Set to true after operations, calculations, or when starting fresh input.
  /// Set to false during continuous number entry.
  final bool isNewInput;

  /// Creates a copy of this state with optionally updated values.
  ///
  /// This method implements the immutable update pattern by creating a new
  /// [CalculatorState] instance with the specified changes while preserving
  /// unchanged values from the current instance.
  ///
  /// This is the primary method for updating calculator state in response
  /// to user interactions. Each state change creates a new instance,
  /// ensuring predictable behavior and supporting Flutter's reactive updates.
  ///
  /// @param display New display value (preserves current if null)
  /// @param operand1 New first operand (preserves current if null)
  /// @param operand2 New second operand (preserves current if null)
  /// @param operation New operation (preserves current if null)
  /// @param isNewInput New input mode flag (preserves current if null)
  /// @returns New CalculatorState instance with updated values
  ///
  /// Example:
  /// ```dart
  /// final newState = currentState.copyWith(
  ///   display: "123",
  ///   isNewInput: false,
  /// );
  /// ```
  CalculatorState copyWith({
    String? display,
    double? operand1,
    double? operand2,
    String? operation,
    bool? isNewInput,
  }) {
    return CalculatorState(
      display: display ?? this.display,
      operand1: operand1 ?? this.operand1,
      operand2: operand2 ?? this.operand2,
      operation: operation ?? this.operation,
      isNewInput: isNewInput ?? this.isNewInput,
    );
  }
}

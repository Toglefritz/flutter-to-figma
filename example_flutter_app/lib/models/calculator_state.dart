/// Calculator State Model
///
/// This model represents the complete state of a calculator application,
/// including the current display value, stored operands, selected operation,
/// and input state flags. The class is immutable to ensure predictable
/// state management and follows Flutter best practices.
///
/// Key Components:
/// * [CalculatorState] - Immutable state representation
/// * Factory constructors for common calculator states
/// * Validation methods for calculator operations
/// * State transition helpers for calculator logic

/// Represents the complete state of a calculator at any point in time.
///
/// This immutable class encapsulates all information needed to represent
/// the calculator's current state, including display value, operands,
/// operation, and input flags. All state changes create new instances
/// rather than modifying existing ones.
///
/// The state model supports standard calculator operations (+, -, *, /)
/// with proper validation and error handling for edge cases like
/// division by zero and invalid operation sequences.
class CalculatorState {
  /// The current value displayed on the calculator screen.
  ///
  /// This string represents what the user sees, including numbers,
  /// decimal points, and error messages. For numeric values, this
  /// should be a valid string representation of a number.
  final String display;

  /// The first operand stored for binary operations.
  ///
  /// This value is set when the user enters a number and selects
  /// an operation. It remains stored until the calculation is
  /// completed or the calculator is cleared.
  final double? operand1;

  /// The second operand for binary operations.
  ///
  /// This value is set when the user enters a second number after
  /// selecting an operation. It's used together with operand1
  /// and the operation to perform calculations.
  final double? operand2;

  /// The currently selected mathematical operation.
  ///
  /// Valid values are '+', '-', '*', '/' or null when no operation
  /// is selected. This determines how operand1 and operand2 will
  /// be combined when equals is pressed.
  final String? operation;

  /// Whether the calculator is ready for new input.
  ///
  /// When true, the next number input will replace the current display.
  /// When false, number input will be appended to the current display.
  /// This flag is typically set after operations or equals.
  final bool isNewInput;

  /// Whether the calculator is currently in an error state.
  ///
  /// When true, the calculator should ignore most input until cleared.
  /// This typically occurs after invalid operations like division by zero
  /// or when the result exceeds the display capacity.
  final bool hasError;

  /// Creates a new calculator state with the specified values.
  ///
  /// All parameters have sensible defaults for a fresh calculator state.
  /// The display defaults to "0", and all other values indicate no
  /// operation is in progress.
  ///
  /// Parameters:
  /// * [display] - Text to show on calculator screen
  /// * [operand1] - First operand for calculations
  /// * [operand2] - Second operand for calculations
  /// * [operation] - Current mathematical operation
  /// * [isNewInput] - Whether next input should replace display
  /// * [hasError] - Whether calculator is in error state
  const CalculatorState({
    this.display = '0',
    this.operand1,
    this.operand2,
    this.operation,
    this.isNewInput = true,
    this.hasError = false,
  });

  /// Creates a fresh calculator state with default values.
  ///
  /// This factory constructor returns a calculator in its initial state:
  /// - Display shows "0"
  /// - No operands or operations stored
  /// - Ready for new input
  /// - No error condition
  ///
  /// Use this when initializing a new calculator or after clearing.
  factory CalculatorState.initial() {
    return const CalculatorState();
  }

  /// Creates a calculator state with an error condition.
  ///
  /// This factory constructor creates a state that represents an error
  /// condition, such as division by zero or invalid operations.
  /// The calculator will display the error message and ignore most
  /// input until cleared.
  ///
  /// Parameters:
  /// * [errorMessage] - Message to display (defaults to "Error")
  ///
  /// Returns a CalculatorState in error condition with specified message.
  factory CalculatorState.error([String errorMessage = 'Error']) {
    return CalculatorState(
      display: errorMessage,
      hasError: true,
      isNewInput: true,
    );
  }

  /// Creates a calculator state with a specific display value.
  ///
  /// This factory constructor is useful for setting the calculator
  /// to show a specific number or result. The state will be ready
  /// for new input, making it suitable for displaying calculation
  /// results or initial values.
  ///
  /// Parameters:
  /// * [value] - Numeric value to display
  ///
  /// Returns a CalculatorState showing the specified value.
  factory CalculatorState.withValue(double value) {
    return CalculatorState(
      display: _formatNumber(value),
      isNewInput: true,
    );
  }

  /// Creates a calculator state with an operation in progress.
  ///
  /// This factory constructor represents the state after a user has
  /// entered a number and selected an operation. The first operand
  /// and operation are stored, and the calculator is ready for the
  /// second operand.
  ///
  /// Parameters:
  /// * [firstOperand] - The first number in the operation
  /// * [operation] - The mathematical operation (+, -, *, /)
  ///
  /// Returns a CalculatorState with operation in progress.
  factory CalculatorState.withOperation(double firstOperand, String operation) {
    return CalculatorState(
      display: _formatNumber(firstOperand),
      operand1: firstOperand,
      operation: operation,
      isNewInput: true,
    );
  }

  /// Validates whether the specified operation is supported.
  ///
  /// This method checks if the given operation string represents
  /// a valid mathematical operation that the calculator can perform.
  ///
  /// Parameters:
  /// * [op] - Operation string to validate
  ///
  /// Returns true if the operation is valid, false otherwise.
  ///
  /// Supported operations: '+', '-', '*', '/'
  bool isValidOperation(String op) {
    const List<String> validOperations = ['+', '-', '*', '/'];
    return validOperations.contains(op);
  }

  /// Validates whether a calculation can be performed with current state.
  ///
  /// This method checks if the calculator has all necessary components
  /// to perform a calculation: two operands and a valid operation.
  /// It also checks for error conditions that would prevent calculation.
  ///
  /// Returns true if calculation is possible, false otherwise.
  ///
  /// Requirements for valid calculation:
  /// * No error state
  /// * Valid operation selected
  /// * Both operands available
  /// * Not division by zero
  bool canPerformCalculation() {
    if (hasError) return false;
    if (operation == null) return false;
    if (operand1 == null || operand2 == null) return false;

    // Check for division by zero
    if (operation == '/' && operand2 == 0.0) return false;

    return true;
  }

  /// Validates whether the current display represents a valid number.
  ///
  /// This method checks if the display string can be parsed as a
  /// valid double value. It handles edge cases like empty strings,
  /// multiple decimal points, and non-numeric characters.
  ///
  /// Returns true if display is a valid number, false otherwise.
  bool isValidNumber() {
    if (hasError) return false;
    if (display.isEmpty) return false;

    try {
      double.parse(display);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Validates whether a decimal point can be added to current display.
  ///
  /// This method checks if adding a decimal point to the current display
  /// would result in a valid number format. It prevents multiple decimal
  /// points and ensures proper decimal formatting.
  ///
  /// Returns true if decimal point can be added, false otherwise.
  bool canAddDecimal() {
    if (hasError) return false;
    if (display.contains('.')) return false;
    if (isNewInput) return true;

    return true;
  }

  /// Creates a copy of this state with updated values.
  ///
  /// This method enables immutable state updates by creating a new
  /// CalculatorState instance with specified changes while preserving
  /// all other values from the current state.
  ///
  /// Parameters (all optional):
  /// * [display] - New display value
  /// * [operand1] - New first operand
  /// * [operand2] - New second operand
  /// * [operation] - New operation
  /// * [isNewInput] - New input state flag
  /// * [hasError] - New error state flag
  ///
  /// Returns a new CalculatorState with updated values.
  CalculatorState copyWith({
    String? display,
    double? operand1,
    double? operand2,
    String? operation,
    bool? isNewInput,
    bool? hasError,
  }) {
    return CalculatorState(
      display: display ?? this.display,
      operand1: operand1 ?? this.operand1,
      operand2: operand2 ?? this.operand2,
      operation: operation ?? this.operation,
      isNewInput: isNewInput ?? this.isNewInput,
      hasError: hasError ?? this.hasError,
    );
  }

  /// Formats a numeric value for display on the calculator screen.
  ///
  /// This static method handles the conversion of double values to
  /// display strings with appropriate formatting. It removes unnecessary
  /// decimal places and handles special cases like very large or small numbers.
  ///
  /// Parameters:
  /// * [value] - Numeric value to format
  ///
  /// Returns formatted string suitable for calculator display.
  static String _formatNumber(double value) {
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

  /// Provides a string representation of the calculator state.
  ///
  /// This method returns a human-readable representation of the state
  /// that includes all relevant information for debugging and logging.
  /// It's particularly useful during development and testing.
  ///
  /// Returns a formatted string describing the current state.
  @override
  String toString() {
    return 'CalculatorState('
        'display: $display, '
        'operand1: $operand1, '
        'operand2: $operand2, '
        'operation: $operation, '
        'isNewInput: $isNewInput, '
        'hasError: $hasError'
        ')';
  }

  /// Compares this state with another for equality.
  ///
  /// Two CalculatorState instances are considered equal if all their
  /// properties have the same values. This is important for state
  /// management and testing.
  ///
  /// Parameters:
  /// * [other] - Object to compare with this state
  ///
  /// Returns true if states are equal, false otherwise.
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CalculatorState &&
        other.display == display &&
        other.operand1 == operand1 &&
        other.operand2 == operand2 &&
        other.operation == operation &&
        other.isNewInput == isNewInput &&
        other.hasError == hasError;
  }

  /// Generates a hash code for this state.
  ///
  /// The hash code is computed from all properties to ensure that
  /// equal states have equal hash codes, which is important for
  /// using states in collections and for performance optimization.
  ///
  /// Returns an integer hash code for this state.
  @override
  int get hashCode {
    return Object.hash(
      display,
      operand1,
      operand2,
      operation,
      isNewInput,
      hasError,
    );
  }
}

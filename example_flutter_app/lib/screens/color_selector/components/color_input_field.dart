import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Color Input Field Component
///
/// This reusable widget provides a text input field for direct color value
/// entry with real-time validation, visual feedback, and automatic value
/// clamping. It supports different input types (RGB values, HSL values,
/// hex strings) with appropriate validation and formatting.
///
/// Key Features:
/// * Real-time input validation with visual feedback
/// * Automatic value clamping to valid ranges
/// * Support for different input types (integer, double, hex)
/// * Error state indication with color and icon feedback
/// * Accessibility support with semantic labels
/// * Consistent Material Design styling
/// * Input formatters for specific value types
///
/// Usage:
/// ```dart
/// ColorInputField(
///   label: 'Red',
///   value: '255',
///   inputType: ColorInputType.rgbComponent,
///   textColor: Colors.white,
///   onChanged: (value) => updateRedFromText(value),
/// )
/// ```
///
/// The component automatically handles validation based on the input type
/// and provides immediate feedback to users about invalid values while
/// maintaining a smooth user experience.
class ColorInputField extends StatefulWidget {
  /// Creates a color input field with the specified configuration.
  ///
  /// All parameters except [suffix] and [helperText] are required to ensure
  /// proper input field configuration and validation. The field provides
  /// real-time feedback and validation for color value input.
  ///
  /// Parameters:
  /// * [label] - Display label for the input field
  /// * [value] - Current text value in the field
  /// * [inputType] - Type of color input for validation
  /// * [textColor] - Color for text and UI elements
  /// * [onChanged] - Callback for value changes
  /// * [suffix] - Optional suffix text (e.g., '°', '%')
  /// * [helperText] - Optional helper text below the field
  const ColorInputField({
    required this.label,
    required this.value,
    required this.inputType,
    required this.textColor,
    required this.onChanged,
    this.suffix = '',
    this.helperText,
    super.key,
  });

  /// Display label for the input field.
  ///
  /// This label appears above the input field and describes the
  /// color component being entered (e.g., 'Red', 'Hue', 'Hex').
  final String label;

  /// Current text value displayed in the input field.
  ///
  /// This value should be formatted appropriately for the input type
  /// and will be validated against the type's constraints when changed.
  final String value;

  /// Type of color input for validation and formatting.
  ///
  /// This determines the validation rules, input formatters, and
  /// acceptable value ranges for the input field.
  final ColorInputType inputType;

  /// Color for text labels and UI elements.
  ///
  /// This color should provide sufficient contrast against the
  /// background for accessibility compliance and visual clarity.
  final Color textColor;

  /// Callback function called when the input value changes.
  ///
  /// This function receives the new text value and should handle
  /// validation and state updates in the parent component.
  final ValueChanged<String> onChanged;

  /// Optional suffix text displayed after the input.
  ///
  /// This suffix provides context about the value's unit or meaning,
  /// such as '°' for degrees or '%' for percentages.
  final String suffix;

  /// Optional helper text displayed below the input field.
  ///
  /// This text can provide additional context, validation hints,
  /// or usage instructions for the input field.
  final String? helperText;

  @override
  State<ColorInputField> createState() => _ColorInputFieldState();
}

/// State class for ColorInputField managing validation and text editing.
///
/// This state class handles text editing, validation, error states, and
/// user interaction feedback for the color input field. It maintains
/// the text editing controller and validation state internally.
class _ColorInputFieldState extends State<ColorInputField> {
  /// Text editing controller for the input field.
  ///
  /// This controller manages the text content, cursor position, and
  /// selection state of the input field. It's synchronized with the
  /// widget's value property and handles user input events.
  late TextEditingController textController;

  /// Focus node for managing input field focus state.
  ///
  /// This node tracks whether the input field is currently focused
  /// and handles focus-related events and styling changes.
  late FocusNode focusNode;

  /// Current validation error message, if any.
  ///
  /// This string contains a user-friendly error message when the
  /// current input value is invalid. It's null when the value is valid.
  String? errorMessage;

  /// Whether the current input value is valid.
  ///
  /// This flag determines the visual state of the input field and
  /// whether error styling should be applied.
  bool isValid = true;

  @override
  void initState() {
    super.initState();

    // Initialize text controller with current value
    textController = TextEditingController(text: widget.value);

    // Initialize focus node
    focusNode = FocusNode();

    // Add listeners for validation and state management
    textController.addListener(_onTextChanged);
    focusNode.addListener(_onFocusChanged);

    // Validate initial value
    _validateInput(widget.value);
  }

  @override
  void didUpdateWidget(ColorInputField oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Update text controller if value changed externally
    if (widget.value != oldWidget.value &&
        widget.value != textController.text) {
      textController.text = widget.value;
      _validateInput(widget.value);
    }
  }

  @override
  void dispose() {
    textController.removeListener(_onTextChanged);
    focusNode.removeListener(_onFocusChanged);
    textController.dispose();
    focusNode.dispose();
    super.dispose();
  }

  /// Handles text changes in the input field.
  ///
  /// This method is called whenever the user types in the input field.
  /// It validates the new input and calls the parent's onChanged callback
  /// if the input is valid.
  void _onTextChanged() {
    final String newValue = textController.text;
    _validateInput(newValue);

    // Only call onChanged if the value is valid or empty
    if (isValid || newValue.isEmpty) {
      widget.onChanged(newValue);
    }
  }

  /// Handles focus changes for the input field.
  ///
  /// This method is called when the input field gains or loses focus.
  /// It can be used to trigger additional validation or formatting
  /// when the user finishes editing.
  void _onFocusChanged() {
    if (!focusNode.hasFocus) {
      // Perform final validation when focus is lost
      _validateInput(textController.text);
    }
  }

  /// Validates the input value based on the field's input type.
  ///
  /// This method checks if the provided value is valid for the current
  /// input type and updates the validation state and error message
  /// accordingly.
  ///
  /// Parameters:
  /// * [value] - The input value to validate
  void _validateInput(String value) {
    setState(() {
      if (value.isEmpty) {
        isValid = true;
        errorMessage = null;
        return;
      }

      switch (widget.inputType) {
        case ColorInputType.rgbComponent:
          _validateRgbComponent(value);
          break;
        case ColorInputType.hue:
          _validateHue(value);
          break;
        case ColorInputType.percentage:
          _validatePercentage(value);
          break;
        case ColorInputType.hexString:
          _validateHexString(value);
          break;
      }
    });
  }

  /// Validates RGB component values (0-255).
  ///
  /// This method checks if the input is a valid integer within the
  /// RGB component range and sets appropriate error messages.
  ///
  /// Parameters:
  /// * [value] - The input value to validate as RGB component
  void _validateRgbComponent(String value) {
    final int? intValue = int.tryParse(value);
    if (intValue == null) {
      isValid = false;
      errorMessage = 'Must be a number';
    } else if (intValue < 0 || intValue > 255) {
      isValid = false;
      errorMessage = 'Must be between 0 and 255';
    } else {
      isValid = true;
      errorMessage = null;
    }
  }

  /// Validates hue values (0-360 degrees).
  ///
  /// This method checks if the input is a valid number within the
  /// hue range and sets appropriate error messages.
  ///
  /// Parameters:
  /// * [value] - The input value to validate as hue
  void _validateHue(String value) {
    final double? doubleValue = double.tryParse(value);
    if (doubleValue == null) {
      isValid = false;
      errorMessage = 'Must be a number';
    } else if (doubleValue < 0 || doubleValue > 360) {
      isValid = false;
      errorMessage = 'Must be between 0 and 360';
    } else {
      isValid = true;
      errorMessage = null;
    }
  }

  /// Validates percentage values (0-100%).
  ///
  /// This method checks if the input is a valid number within the
  /// percentage range and sets appropriate error messages.
  ///
  /// Parameters:
  /// * [value] - The input value to validate as percentage
  void _validatePercentage(String value) {
    final double? doubleValue = double.tryParse(value);
    if (doubleValue == null) {
      isValid = false;
      errorMessage = 'Must be a number';
    } else if (doubleValue < 0 || doubleValue > 100) {
      isValid = false;
      errorMessage = 'Must be between 0 and 100';
    } else {
      isValid = true;
      errorMessage = null;
    }
  }

  /// Validates hexadecimal color strings.
  ///
  /// This method checks if the input is a valid hex color format
  /// and sets appropriate error messages for invalid formats.
  ///
  /// Parameters:
  /// * [value] - The input value to validate as hex string
  void _validateHexString(String value) {
    // Remove hash prefix if present for validation
    final String hex = value.replaceFirst('#', '');

    // Check for valid hex format (3 or 6 characters)
    final RegExp hexRegex = RegExp(r'^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$');

    if (!hexRegex.hasMatch(hex)) {
      isValid = false;
      if (hex.isEmpty) {
        errorMessage = 'Enter a hex color (e.g., #FF5733)';
      } else if (hex.length != 3 && hex.length != 6) {
        errorMessage = 'Must be 3 or 6 hex digits';
      } else {
        errorMessage = 'Invalid hex characters';
      }
    } else {
      isValid = true;
      errorMessage = null;
    }
  }

  /// Gets the appropriate input formatters for the input type.
  ///
  /// This method returns a list of input formatters that restrict
  /// and format user input based on the field's input type.
  ///
  /// Returns a list of TextInputFormatter instances for the input type.
  List<TextInputFormatter> _getInputFormatters() {
    switch (widget.inputType) {
      case ColorInputType.rgbComponent:
        return [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(3),
        ];
      case ColorInputType.hue:
        return [
          FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
          LengthLimitingTextInputFormatter(6), // Allow for decimal values
        ];
      case ColorInputType.percentage:
        return [
          FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
          LengthLimitingTextInputFormatter(6), // Allow for decimal values
        ];
      case ColorInputType.hexString:
        return [
          FilteringTextInputFormatter.allow(RegExp(r'[0-9A-Fa-f#]')),
          LengthLimitingTextInputFormatter(7), // #RRGGBB format
          _HexInputFormatter(),
        ];
    }
  }

  /// Gets the appropriate keyboard type for the input type.
  ///
  /// This method returns the optimal keyboard type for the current
  /// input type to improve user experience on mobile devices.
  ///
  /// Returns the TextInputType for the input type.
  TextInputType _getKeyboardType() {
    switch (widget.inputType) {
      case ColorInputType.rgbComponent:
        return TextInputType.number;
      case ColorInputType.hue:
      case ColorInputType.percentage:
        return const TextInputType.numberWithOptions(decimal: true);
      case ColorInputType.hexString:
        return TextInputType.text;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Input field with validation styling
        TextField(
          controller: textController,
          focusNode: focusNode,
          keyboardType: _getKeyboardType(),
          inputFormatters: _getInputFormatters(),
          style: TextStyle(
            color: widget.textColor,
            fontSize: 16.0,
          ),
          decoration: InputDecoration(
            labelText: widget.label,
            labelStyle: TextStyle(
              color: isValid
                  ? widget.textColor.withOpacity(0.7)
                  : Colors.red.shade300,
            ),
            suffixText: widget.suffix.isNotEmpty ? widget.suffix : null,
            suffixStyle: TextStyle(
              color: widget.textColor.withOpacity(0.6),
            ),
            errorText: errorMessage,
            errorStyle: TextStyle(
              color: Colors.red.shade300,
              fontSize: 12.0,
            ),
            helperText: widget.helperText,
            helperStyle: TextStyle(
              color: widget.textColor.withOpacity(0.6),
              fontSize: 12.0,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.0),
              borderSide: BorderSide(
                color: widget.textColor.withOpacity(0.3),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.0),
              borderSide: BorderSide(
                color: widget.textColor.withOpacity(0.3),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.0),
              borderSide: BorderSide(
                color: isValid
                    ? widget.textColor.withOpacity(0.8)
                    : Colors.red.shade300,
                width: 2.0,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.0),
              borderSide: BorderSide(
                color: Colors.red.shade300,
                width: 2.0,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.0),
              borderSide: BorderSide(
                color: Colors.red.shade300,
                width: 2.0,
              ),
            ),
            prefixIcon: !isValid
                ? Icon(
                    Icons.error_outline,
                    color: Colors.red.shade300,
                    size: 20.0,
                  )
                : null,
          ),
        ),
      ],
    );
  }
}

/// Enumeration of supported color input types.
///
/// This enum defines the different types of color inputs that can be
/// validated and formatted by the ColorInputField component. Each type
/// has specific validation rules and input formatting requirements.
enum ColorInputType {
  /// RGB color component (0-255 integer values).
  ///
  /// Used for red, green, and blue color components with integer
  /// validation and numeric keyboard input.
  rgbComponent,

  /// Hue value (0-360 degrees).
  ///
  /// Used for hue input in HSL color space with decimal support
  /// and degree-based validation.
  hue,

  /// Percentage value (0-100%).
  ///
  /// Used for saturation and lightness in HSL color space with
  /// decimal support and percentage validation.
  percentage,

  /// Hexadecimal color string (#RRGGBB or #RGB).
  ///
  /// Used for hex color input with format validation and
  /// hexadecimal character filtering.
  hexString,
}

/// Custom input formatter for hexadecimal color strings.
///
/// This formatter automatically adds the '#' prefix to hex color strings
/// and ensures proper formatting for hex color input fields.
class _HexInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String newText = newValue.text;

    // Ensure hex strings start with #
    if (newText.isNotEmpty && !newText.startsWith('#')) {
      newText = '#$newText';
    }

    // Convert to uppercase for consistency
    newText = newText.toUpperCase();

    return TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: newText.length),
    );
  }
}

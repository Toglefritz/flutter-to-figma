import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/color_data.dart';
import 'color_selector_route.dart';
import 'color_selector_view.dart';

/// Color Selector Controller
///
/// This controller manages the state and business logic for the color selector
/// example, handling color manipulation, format conversion, and user interactions.
/// It demonstrates complex state management with bidirectional data binding
/// between RGB and HSL color spaces while maintaining UI responsiveness.
///
/// Key Responsibilities:
/// * Color state management with RGB and HSL synchronization
/// * Real-time color updates and validation
/// * Clipboard integration for color format copying
/// * User feedback through snackbar notifications
/// * Input validation with error handling
/// * Dynamic background and text color calculations
///
/// State Management:
/// * [currentColor] - Current color data with RGB and HSL values
/// * [selectedTab] - Currently active color control tab (RGB/HSL)
/// * Color update methods for individual components
/// * Format copying with user feedback
///
/// The controller ensures that RGB and HSL values remain synchronized
/// through the ColorData model's automatic conversion capabilities,
/// providing a seamless user experience across different color representations.
class ColorSelectorController extends State<ColorSelectorRoute>
    with TickerProviderStateMixin {
  /// Current color data containing RGB and HSL values.
  ///
  /// This represents the user's currently selected color and serves as
  /// the single source of truth for all color-related UI updates.
  /// The ColorData model automatically maintains synchronization between
  /// RGB and HSL representations, ensuring consistency across all controls.
  late ColorData currentColor;

  /// Currently selected tab index for color controls.
  ///
  /// 0 = RGB controls (Red, Green, Blue sliders)
  /// 1 = HSL controls (Hue, Saturation, Lightness sliders)
  ///
  /// This determines which set of color manipulation controls are
  /// currently visible to the user in the tabbed interface.
  int selectedTab = 0;

  /// Tab controller for managing the RGB/HSL tab interface.
  ///
  /// This controller handles tab switching animations and state management
  /// for the tabbed color control interface, providing smooth transitions
  /// between RGB and HSL control modes.
  late TabController tabController;

  /// Animation controller for smooth color transitions.
  ///
  /// This controller manages the animation timing for background color
  /// changes, providing smooth visual transitions when colors are updated
  /// to enhance the user experience and visual feedback.
  late AnimationController colorAnimationController;

  /// Color animation for smooth background transitions.
  ///
  /// This animation interpolates between color values to provide smooth
  /// visual transitions when the background color changes, creating a
  /// more polished and responsive user interface.
  late Animation<Color?> colorAnimation;

  /// Previous color for animation interpolation.
  ///
  /// This stores the previous color value to enable smooth transitions
  /// between color states, ensuring that background changes are visually
  /// smooth rather than jarring instant updates.
  Color? previousColor;

  @override
  void initState() {
    super.initState();

    // Initialize with a default orange color for demonstration
    currentColor = ColorData.fromRgb(red: 255, green: 87, blue: 51);

    // Initialize tab controller for RGB/HSL tabs
    tabController = TabController(length: 2, vsync: this);
    tabController.addListener(_onTabChanged);

    // Initialize color animation controller
    colorAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    // Initialize color animation
    colorAnimation =
        ColorTween(
          begin: currentColor.flutterColor,
          end: currentColor.flutterColor,
        ).animate(
          CurvedAnimation(
            parent: colorAnimationController,
            curve: Curves.easeInOut,
          ),
        );

    previousColor = currentColor.flutterColor;
  }

  @override
  void dispose() {
    tabController.removeListener(_onTabChanged);
    tabController.dispose();
    colorAnimationController.dispose();
    super.dispose();
  }

  /// Handles tab change events for RGB/HSL switching.
  ///
  /// This method updates the selected tab index when users switch between
  /// RGB and HSL control modes, ensuring the UI reflects the current
  /// control mode and maintains proper state synchronization.
  void _onTabChanged() {
    if (tabController.indexIsChanging) {
      setState(() {
        selectedTab = tabController.index;
      });
    }
  }

  /// Updates the red component of the current color.
  ///
  /// This method creates a new color with the updated red value while
  /// maintaining the existing green and blue components. The HSL values
  /// are automatically recalculated to maintain color space consistency.
  ///
  /// Parameters:
  /// * [value] - New red component value (0-255)
  ///
  /// The UI is updated immediately to reflect the color change, and
  /// smooth animations are triggered for visual feedback.
  void updateRed(int value) {
    final ColorData newColor = currentColor.copyWithRgb(red: value);
    _updateColorWithAnimation(newColor);
  }

  /// Updates the red component from text input.
  ///
  /// This method parses text input for the red component and updates
  /// the color if the input is valid. Invalid input is ignored to
  /// prevent errors during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the red value
  void updateRedFromText(String text) {
    final int? value = int.tryParse(text);
    if (value != null && value >= 0 && value <= 255) {
      updateRed(value);
    }
  }

  /// Updates the green component of the current color.
  ///
  /// This method creates a new color with the updated green value while
  /// maintaining the existing red and blue components. The HSL values
  /// are automatically recalculated to maintain color space consistency.
  ///
  /// Parameters:
  /// * [value] - New green component value (0-255)
  ///
  /// The UI is updated immediately to reflect the color change, and
  /// smooth animations are triggered for visual feedback.
  void updateGreen(int value) {
    final ColorData newColor = currentColor.copyWithRgb(green: value);
    _updateColorWithAnimation(newColor);
  }

  /// Updates the green component from text input.
  ///
  /// This method parses text input for the green component and updates
  /// the color if the input is valid. Invalid input is ignored to
  /// prevent errors during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the green value
  void updateGreenFromText(String text) {
    final int? value = int.tryParse(text);
    if (value != null && value >= 0 && value <= 255) {
      updateGreen(value);
    }
  }

  /// Updates the blue component of the current color.
  ///
  /// This method creates a new color with the updated blue value while
  /// maintaining the existing red and green components. The HSL values
  /// are automatically recalculated to maintain color space consistency.
  ///
  /// Parameters:
  /// * [value] - New blue component value (0-255)
  ///
  /// The UI is updated immediately to reflect the color change, and
  /// smooth animations are triggered for visual feedback.
  void updateBlue(int value) {
    final ColorData newColor = currentColor.copyWithRgb(blue: value);
    _updateColorWithAnimation(newColor);
  }

  /// Updates the blue component from text input.
  ///
  /// This method parses text input for the blue component and updates
  /// the color if the input is valid. Invalid input is ignored to
  /// prevent errors during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the blue value
  void updateBlueFromText(String text) {
    final int? value = int.tryParse(text);
    if (value != null && value >= 0 && value <= 255) {
      updateBlue(value);
    }
  }

  /// Updates the hue component of the current color.
  ///
  /// This method creates a new color with the updated hue value while
  /// maintaining the existing saturation and lightness components. The RGB
  /// values are automatically recalculated to maintain color space consistency.
  ///
  /// Parameters:
  /// * [value] - New hue value in degrees (0-360)
  ///
  /// The UI is updated immediately to reflect the color change, and
  /// smooth animations are triggered for visual feedback.
  void updateHue(double value) {
    final ColorData newColor = currentColor.copyWithHsl(hue: value);
    _updateColorWithAnimation(newColor);
  }

  /// Updates the hue component from text input.
  ///
  /// This method parses text input for the hue component and updates
  /// the color if the input is valid. Invalid input is ignored to
  /// prevent errors during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the hue value
  void updateHueFromText(String text) {
    final double? value = double.tryParse(text);
    if (value != null && value >= 0 && value <= 360) {
      updateHue(value);
    }
  }

  /// Updates the saturation component of the current color.
  ///
  /// This method creates a new color with the updated saturation value while
  /// maintaining the existing hue and lightness components. The RGB values
  /// are automatically recalculated to maintain color space consistency.
  ///
  /// Parameters:
  /// * [value] - New saturation value as percentage (0-100)
  ///
  /// The UI is updated immediately to reflect the color change, and
  /// smooth animations are triggered for visual feedback.
  void updateSaturation(double value) {
    final ColorData newColor = currentColor.copyWithHsl(saturation: value);
    _updateColorWithAnimation(newColor);
  }

  /// Updates the saturation component from text input.
  ///
  /// This method parses text input for the saturation component and updates
  /// the color if the input is valid. Invalid input is ignored to
  /// prevent errors during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the saturation value
  void updateSaturationFromText(String text) {
    final double? value = double.tryParse(text);
    if (value != null && value >= 0 && value <= 100) {
      updateSaturation(value);
    }
  }

  /// Updates the lightness component of the current color.
  ///
  /// This method creates a new color with the updated lightness value while
  /// maintaining the existing hue and saturation components. The RGB values
  /// are automatically recalculated to maintain color space consistency.
  ///
  /// Parameters:
  /// * [value] - New lightness value as percentage (0-100)
  ///
  /// The UI is updated immediately to reflect the color change, and
  /// smooth animations are triggered for visual feedback.
  void updateLightness(double value) {
    final ColorData newColor = currentColor.copyWithHsl(lightness: value);
    _updateColorWithAnimation(newColor);
  }

  /// Updates the lightness component from text input.
  ///
  /// This method parses text input for the lightness component and updates
  /// the color if the input is valid. Invalid input is ignored to
  /// prevent errors during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the lightness value
  void updateLightnessFromText(String text) {
    final double? value = double.tryParse(text);
    if (value != null && value >= 0 && value <= 100) {
      updateLightness(value);
    }
  }

  /// Updates the color from hex string input.
  ///
  /// This method parses hex color string input and updates the color
  /// if the input is valid. Invalid input is ignored to prevent errors
  /// during user typing.
  ///
  /// Parameters:
  /// * [text] - Text input containing the hex color string
  void updateFromHexString(String text) {
    try {
      final ColorData newColor = ColorData.fromHex(text);
      _updateColorWithAnimation(newColor);
    } catch (e) {
      // Ignore invalid hex strings during typing
    }
  }

  /// Updates the current color with smooth animation transitions.
  ///
  /// This internal method handles color updates with smooth visual transitions
  /// by animating between the previous and new color values. It ensures that
  /// background color changes are visually smooth and provides better user
  /// experience during color manipulation.
  ///
  /// Parameters:
  /// * [newColor] - The new ColorData to transition to
  ///
  /// The method updates the color animation and triggers a rebuild to
  /// reflect the new color state throughout the UI.
  void _updateColorWithAnimation(ColorData newColor) {
    setState(() {
      previousColor = currentColor.flutterColor;
      currentColor = newColor;

      // Update color animation
      colorAnimation =
          ColorTween(
            begin: previousColor,
            end: currentColor.flutterColor,
          ).animate(
            CurvedAnimation(
              parent: colorAnimationController,
              curve: Curves.easeInOut,
            ),
          );

      // Start animation
      colorAnimationController.forward(from: 0.0);
    });
  }

  /// Copies the specified color format to the system clipboard.
  ///
  /// This method handles clipboard integration for color format copying,
  /// allowing users to easily copy color values in different formats
  /// (hex, RGB, RGBA, HSL) for use in other applications or code.
  ///
  /// Parameters:
  /// * [format] - The color format to copy ('hex', 'rgb', 'rgba', 'hsl')
  ///
  /// After copying, a confirmation snackbar is displayed to provide
  /// user feedback about the successful copy operation. The method
  /// handles clipboard errors gracefully and provides appropriate feedback.
  Future<void> copyColorFormat(String format) async {
    String colorValue;
    String formatName;

    // Determine the color value and format name based on the requested format
    switch (format.toLowerCase()) {
      case 'hex':
        colorValue = currentColor.hexString;
        formatName = 'Hex';
        break;
      case 'rgb':
        colorValue = currentColor.rgbString;
        formatName = 'RGB';
        break;
      case 'rgba':
        colorValue = currentColor.rgbaString;
        formatName = 'RGBA';
        break;
      case 'hsl':
        colorValue = currentColor.hslString;
        formatName = 'HSL';
        break;
      default:
        _showErrorMessage('Unknown color format: $format');
        return;
    }

    try {
      // Copy to clipboard
      await Clipboard.setData(ClipboardData(text: colorValue));

      // Show success confirmation
      _showCopyConfirmation(formatName, colorValue);
    } catch (error) {
      // Handle clipboard errors gracefully
      _showErrorMessage('Failed to copy color format: $error');
    }
  }

  /// Displays a confirmation message when a color format is successfully copied.
  ///
  /// This method shows a snackbar notification to inform the user that
  /// the color format has been successfully copied to the clipboard.
  /// The message includes the format name and value for clarity.
  ///
  /// Parameters:
  /// * [formatName] - Human-readable name of the copied format
  /// * [colorValue] - The actual color value that was copied
  ///
  /// The snackbar is styled to match the current color theme and
  /// provides clear feedback about the copy operation.
  void _showCopyConfirmation(String formatName, String colorValue) {
    final SnackBar snackBar = SnackBar(
      content: Text(
        '$formatName copied: $colorValue',
        style: const TextStyle(color: Colors.white),
      ),
      backgroundColor: Colors.green.shade600,
      duration: const Duration(seconds: 2),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.0),
      ),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  /// Displays an error message when an operation fails.
  ///
  /// This method shows a snackbar notification to inform the user about
  /// errors that occur during color operations, such as clipboard failures
  /// or invalid format requests. The error message is user-friendly and
  /// provides guidance when possible.
  ///
  /// Parameters:
  /// * [message] - The error message to display to the user
  ///
  /// The snackbar is styled with error colors to clearly indicate
  /// that an error has occurred and requires user attention.
  void _showErrorMessage(String message) {
    final SnackBar snackBar = SnackBar(
      content: Text(
        message,
        style: const TextStyle(color: Colors.white),
      ),
      backgroundColor: Colors.red.shade600,
      duration: const Duration(seconds: 3),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8.0),
      ),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  /// Gets the appropriate text color for the current background.
  ///
  /// This method determines whether light or dark text should be used
  /// based on the current background color to ensure optimal readability
  /// and accessibility compliance. It uses the ColorData model's built-in
  /// contrast calculation capabilities.
  ///
  /// Returns [Colors.white] for dark backgrounds and [Colors.black]
  /// for light backgrounds, ensuring sufficient contrast for text readability.
  Color get textColor {
    return currentColor.requiresLightText ? Colors.white : Colors.black;
  }

  /// Gets the current background color for animations.
  ///
  /// This getter provides the current animated background color value,
  /// which may be interpolated between the previous and current colors
  /// during transition animations. It ensures smooth visual transitions
  /// when colors are updated.
  ///
  /// Returns the current color from the animation, or falls back to
  /// the static current color if no animation is active.
  Color get animatedBackgroundColor {
    return colorAnimation.value ?? currentColor.flutterColor;
  }

  @override
  Widget build(BuildContext context) => ColorSelectorView(this);
}

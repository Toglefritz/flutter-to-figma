import 'package:flutter/material.dart';
import 'color_selector_controller.dart';
import 'components/color_slider.dart';
import 'components/color_input_field.dart';
import 'components/color_format_display.dart';

/// Color Selector View
///
/// This view provides the user interface for the color selector example,
/// demonstrating complex interactive widgets with dynamic styling and
/// real-time color manipulation capabilities. The interface includes
/// tabbed controls for RGB and HSL color spaces, format displays,
/// and dynamic background theming.
///
/// Key UI Components:
/// * Dynamic background that changes with selected color
/// * Tabbed interface for RGB and HSL controls
/// * Color sliders with real-time value updates
/// * Color format display cards with tap-to-copy functionality
/// * Contrast-aware text styling for accessibility
/// * Smooth animations for color transitions
///
/// Layout Structure:
/// * AppBar with dynamic theming
/// * Animated background container
/// * TabBar for RGB/HSL switching
/// * TabBarView with color control sliders
/// * Color format display section
/// * Responsive layout with proper spacing
///
/// The view is purely presentational and delegates all business logic
/// to the ColorSelectorController, maintaining clean separation of
/// concerns and testability.
class ColorSelectorView extends StatelessWidget {
  /// Creates a new color selector view.
  ///
  /// This view receives the controller instance to access state and
  /// methods for color manipulation and user interactions. The view
  /// is stateless and rebuilds when the controller state changes.
  ///
  /// Parameters:
  /// * [state] - The ColorSelectorController managing this view's state
  const ColorSelectorView(this.state, {super.key});

  /// The controller instance managing color state and business logic.
  ///
  /// This provides access to the current color data, update methods,
  /// clipboard functionality, and other business logic required for
  /// the color selector interface.
  final ColorSelectorController state;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: state.colorAnimation,
      builder: (BuildContext context, Widget? child) {
        return Scaffold(
          backgroundColor: state.animatedBackgroundColor,
          appBar: AppBar(
            title: Text(
              'Color Selector',
              style: TextStyle(
                color: state.textColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            backgroundColor: state.animatedBackgroundColor,
            elevation: 0,
            iconTheme: IconThemeData(color: state.textColor),
            bottom: TabBar(
              controller: state.tabController,
              labelColor: state.textColor,
              unselectedLabelColor: state.textColor.withValues(alpha: 0.6),
              indicatorColor: state.textColor,
              tabs: const [
                Tab(
                  text: 'RGB',
                  icon: Icon(Icons.palette),
                ),
                Tab(
                  text: 'HSL',
                  icon: Icon(Icons.color_lens),
                ),
              ],
            ),
          ),
          body: SafeArea(
            child: Column(
              children: [
                // Color controls section - takes remaining space with scrolling
                Expanded(
                  child: TabBarView(
                    controller: state.tabController,
                    children: [
                      _buildRgbControls(),
                      _buildHslControls(),
                    ],
                  ),
                ),

                // Color format displays section - pinned to bottom
                _buildColorFormats(),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Builds the RGB color control sliders and input fields.
  ///
  /// This widget creates sliders and input fields for red, green, and blue
  /// color components with real-time value updates and visual feedback.
  /// Users can adjust values using either sliders or direct text input.
  ///
  /// Returns a column containing RGB controls with sliders and input fields.
  Widget _buildRgbControls() {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Red controls
          _buildColorControlRow(
            slider: ColorSlider(
              label: 'Red',
              value: state.currentColor.red.toDouble(),
              min: 0.0,
              max: 255.0,
              divisions: 255,
              accentColor: Colors.red,
              textColor: state.textColor,
              onChanged: (double value) => state.updateRed(value.round()),
            ),
            inputField: ColorInputField(
              label: 'Red',
              value: state.currentColor.red.toString(),
              inputType: ColorInputType.rgbComponent,
              textColor: state.textColor,
              onChanged: state.updateRedFromText,
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(top: 24.0),
            child: _buildColorControlRow(
              slider: ColorSlider(
                label: 'Green',
                value: state.currentColor.green.toDouble(),
                min: 0.0,
                max: 255.0,
                divisions: 255,
                accentColor: Colors.green,
                textColor: state.textColor,
                onChanged: (double value) => state.updateGreen(value.round()),
              ),
              inputField: ColorInputField(
                label: 'Green',
                value: state.currentColor.green.toString(),
                inputType: ColorInputType.rgbComponent,
                textColor: state.textColor,
                onChanged: state.updateGreenFromText,
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(top: 24.0),
            child: _buildColorControlRow(
              slider: ColorSlider(
                label: 'Blue',
                value: state.currentColor.blue.toDouble(),
                min: 0.0,
                max: 255.0,
                divisions: 255,
                accentColor: Colors.blue,
                textColor: state.textColor,
                onChanged: (double value) => state.updateBlue(value.round()),
              ),
              inputField: ColorInputField(
                label: 'Blue',
                value: state.currentColor.blue.toString(),
                inputType: ColorInputType.rgbComponent,
                textColor: state.textColor,
                onChanged: state.updateBlueFromText,
              ),
            ),
          ),

          // Hex input field
          Padding(
            padding: const EdgeInsets.only(top: 32.0),
            child: ColorInputField(
              label: 'Hex Color',
              value: state.currentColor.hexString,
              inputType: ColorInputType.hexString,
              textColor: state.textColor,
              onChanged: state.updateFromHexString,
              helperText: 'Enter hex color (e.g., #FF5733)',
            ),
          ),
        ],
      ),
    );
  }

  /// Builds the HSL color control sliders and input fields.
  ///
  /// This widget creates sliders and input fields for hue, saturation, and
  /// lightness color components with real-time value updates and visual feedback.
  /// Users can adjust values using either sliders or direct text input.
  ///
  /// Returns a column containing HSL controls with sliders and input fields.
  Widget _buildHslControls() {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Hue controls
          _buildColorControlRow(
            slider: ColorSlider(
              label: 'Hue',
              value: state.currentColor.hue,
              min: 0.0,
              max: 360.0,
              divisions: 360,
              accentColor: Colors.purple,
              textColor: state.textColor,
              onChanged: state.updateHue,
              suffix: '°',
            ),
            inputField: ColorInputField(
              label: 'Hue',
              value: state.currentColor.hue.round().toString(),
              inputType: ColorInputType.hue,
              textColor: state.textColor,
              onChanged: state.updateHueFromText,
              suffix: '°',
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(top: 24.0),
            child: _buildColorControlRow(
              slider: ColorSlider(
                label: 'Saturation',
                value: state.currentColor.saturation,
                min: 0.0,
                max: 100.0,
                divisions: 100,
                accentColor: Colors.orange,
                textColor: state.textColor,
                onChanged: state.updateSaturation,
                suffix: '%',
              ),
              inputField: ColorInputField(
                label: 'Saturation',
                value: state.currentColor.saturation.round().toString(),
                inputType: ColorInputType.percentage,
                textColor: state.textColor,
                onChanged: state.updateSaturationFromText,
                suffix: '%',
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(top: 24.0),
            child: _buildColorControlRow(
              slider: ColorSlider(
                label: 'Lightness',
                value: state.currentColor.lightness,
                min: 0.0,
                max: 100.0,
                divisions: 100,
                accentColor: Colors.amber,
                textColor: state.textColor,
                onChanged: state.updateLightness,
                suffix: '%',
              ),
              inputField: ColorInputField(
                label: 'Lightness',
                value: state.currentColor.lightness.round().toString(),
                inputType: ColorInputType.percentage,
                textColor: state.textColor,
                onChanged: state.updateLightnessFromText,
                suffix: '%',
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Builds a row containing a slider and input field for color control.
  ///
  /// This helper method creates a responsive layout that displays both
  /// a slider and input field for the same color component, allowing
  /// users to choose their preferred input method.
  ///
  /// Parameters:
  /// * [slider] - The ColorSlider widget for this component
  /// * [inputField] - The ColorInputField widget for this component
  ///
  /// Returns a row with slider and input field in responsive layout.
  Widget _buildColorControlRow({
    required Widget slider,
    required Widget inputField,
  }) {
    return Row(
      children: [
        // Slider takes most of the space
        Expanded(
          flex: 3,
          child: slider,
        ),

        // Input field takes smaller space
        Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: SizedBox(
            width: 80.0,
            child: inputField,
          ),
        ),
      ],
    );
  }

  /// Builds the color format display section.
  ///
  /// This widget creates cards showing the current color in different
  /// formats (hex, RGB, RGBA, HSL) with tap-to-copy functionality.
  /// The section is pinned to the bottom of the screen with a fixed height
  /// to ensure it's always visible regardless of screen size.
  ///
  /// Returns a fixed-height section containing format display cards in
  /// a horizontal scrollable layout for optimal space usage.
  Widget _buildColorFormats() {
    return Container(
      height: 120.0, // Fixed height to ensure visibility
      decoration: BoxDecoration(
        color: state.textColor.withValues(alpha: 0.1),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24.0),
          topRight: Radius.circular(24.0),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Color Formats',
              style: TextStyle(
                color: state.textColor,
                fontSize: 14.0,
                fontWeight: FontWeight.w600,
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildCompactFormatCard(
                        'Hex',
                        state.currentColor.hexString,
                      ),
                      const SizedBox(width: 12.0),
                      _buildCompactFormatCard(
                        'RGB',
                        state.currentColor.rgbString,
                      ),
                      const SizedBox(width: 12.0),
                      _buildCompactFormatCard(
                        'RGBA',
                        state.currentColor.rgbaString,
                      ),
                      const SizedBox(width: 12.0),
                      _buildCompactFormatCard(
                        'HSL',
                        state.currentColor.hslString,
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

  /// Builds a compact format card for the horizontal layout.
  ///
  /// This creates a smaller, more compact version of the color format display
  /// that works well in a horizontal scrolling layout at the bottom of the screen.
  ///
  /// Parameters:
  /// * [formatName] - The name of the color format (e.g., 'Hex', 'RGB')
  /// * [formatValue] - The color value in the specified format
  ///
  /// Returns a compact card widget with tap-to-copy functionality.
  Widget _buildCompactFormatCard(String formatName, String formatValue) {
    return GestureDetector(
      onTap: () => state.copyColorFormat(formatName.toLowerCase()),
      child: Container(
        width: 120.0,
        padding: const EdgeInsets.all(8.0),
        decoration: BoxDecoration(
          color: state.textColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(
            color: state.textColor.withValues(alpha: 0.2),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  formatName,
                  style: TextStyle(
                    color: state.textColor,
                    fontSize: 11.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Icon(
                  Icons.copy,
                  color: state.textColor.withValues(alpha: 0.6),
                  size: 12.0,
                ),
              ],
            ),
            const SizedBox(height: 4.0),
            Expanded(
              child: Center(
                child: Text(
                  formatValue,
                  style: TextStyle(
                    color: state.textColor.withValues(alpha: 0.9),
                    fontSize: 9.0,
                    fontWeight: FontWeight.w400,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

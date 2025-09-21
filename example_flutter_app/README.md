# Flutter Examples App

A comprehensive Flutter application designed to test and demonstrate the **Flutter → Figma Plugin** capabilities. This app showcases various Flutter widget types, layout patterns, and UI complexities to validate how different Flutter code structures translate into Figma designs.

## Purpose

This example app serves as a test case for the Flutter-to-Figma plugin, demonstrating how various Flutter UI patterns and widget hierarchies can be automatically converted into editable Figma designs. The app includes three distinct examples that progressively increase in complexity:

### 🔢 Counter Example
- **Complexity Level:** Basic
- **Purpose:** Tests simple widget conversion and state management
- **Features:** 
  - Basic increment functionality with FloatingActionButton
  - Centered text display with theme-based styling
  - AppBar with reset action
  - Simple state management using setState()

### 🧮 Calculator Example  
- **Complexity Level:** Moderate
- **Purpose:** Tests grid-based layouts and button interactions
- **Features:**
  - Grid layout with number and operation buttons
  - Mathematical operations (+, -, *, /, =)
  - Clear and reset functionality
  - Error handling for invalid operations
  - Responsive button layout

### 🎨 Color Selector Example
- **Complexity Level:** Advanced  
- **Purpose:** Tests complex interactive widgets and dynamic styling
- **Features:**
  - RGB, HSL, and hex color controls
  - Real-time color preview and background updates
  - Multiple color format displays (hex, RGB, RGBA, HSL)
  - Clipboard integration for color values
  - Dynamic contrast adjustments for text readability
  - Smooth slider interactions and color transitions

## Testing the Flutter → Figma Plugin

This app is specifically designed to validate the plugin's ability to handle:

### Widget Conversion
- **Basic Widgets:** Container, Text, Icon, Button components
- **Layout Widgets:** Column, Row, Stack, Positioned layouts
- **Material Design:** AppBar, FloatingActionButton, Card, Slider components
- **Interactive Elements:** Buttons, sliders, and gesture handling

### Layout Patterns
- **Simple Layouts:** Centered content with basic hierarchy
- **Grid Layouts:** Calculator button grid with consistent spacing
- **Complex Layouts:** Multi-section color selector with various input types
- **Navigation:** Screen-to-screen navigation patterns

### Styling and Theming
- **Theme Integration:** Material Design 3 with teal color scheme
- **Dark/Light Modes:** Automatic theme switching support
- **Typography:** Various text styles and hierarchies
- **Spacing:** Consistent padding and margin patterns using Flutter best practices

### State Management
- **Simple State:** Counter increment/decrement operations
- **Moderate State:** Calculator operations and display management
- **Complex State:** Real-time color manipulation and format conversion

## How to Use for Plugin Testing

### 1. Run the Flutter App
```bash
cd example_flutter_app
flutter run
```

### 2. Test Individual Screens
Navigate through each example to understand the UI structure:
- **Home Screen:** Grid navigation layout
- **Counter Screen:** Basic state management and actions
- **Calculator Screen:** Grid layout with multiple button types
- **Color Selector Screen:** Advanced controls and real-time updates

### 3. Plugin Conversion Testing
Use the Flutter → Figma Plugin to convert different parts of the app:

#### Test Single Widgets
- Convert individual widget files (e.g., `counter_view.dart`)
- Validate component creation and styling accuracy
- Check theme variable mapping

#### Test Complete Screens  
- Convert full screen implementations
- Verify layout hierarchy preservation
- Test navigation structure representation

#### Test Complex Interactions
- Convert the color selector for advanced widget handling
- Validate slider and dynamic content conversion
- Test real-time state change representation

### 4. Validation Checklist
When testing the plugin with this app, verify:

- [ ] **Widget Hierarchy:** Proper parent-child relationships maintained
- [ ] **Layout Accuracy:** Spacing, alignment, and positioning preserved
- [ ] **Theme Conversion:** Colors, typography, and spacing tokenized as Figma Variables
- [ ] **Component Creation:** Reusable widgets converted to Figma Components
- [ ] **Auto Layout:** Flutter layout widgets properly converted to Figma Auto Layout
- [ ] **Interactive Elements:** Buttons and controls represented appropriately
- [ ] **Error Handling:** Graceful handling of unsupported widgets

## Architecture

This app follows Flutter best practices and the MVC pattern:

- **Routes:** Entry point widgets (`*_route.dart`)
- **Controllers:** Business logic and state management (`*_controller.dart`)  
- **Views:** UI presentation layer (`*_view.dart`)
- **Models:** Data structures for state management

This architecture ensures clean separation of concerns and provides clear examples for the plugin to parse and convert.

## Getting Started with Flutter

If you're new to Flutter development, here are some helpful resources:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)
- [Flutter Documentation](https://docs.flutter.dev/) - Comprehensive guides and API reference

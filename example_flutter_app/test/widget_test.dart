import 'package:example_flutter_app/main.dart';
import 'package:flutter_test/flutter_test.dart';

/// Test suite for Flutter Examples application widget functionality.
///
/// This test suite verifies the basic application startup and home screen
/// navigation interface. It ensures that the app launches successfully
/// and displays all expected navigation options for the example screens.
///
/// Test Coverage:
/// * Application widget creation and rendering
/// * Home screen title display
/// * Navigation card presence for all examples
/// * Text content verification for user interface elements
///
/// Mock Dependencies: None required for basic widget rendering tests.
/// The tests use the actual application widgets without mocking.
void main() {
  /// Verifies that the application launches with proper home navigation interface.
  ///
  /// This test creates the root FlutterExampleApp widget and verifies that
  /// the home screen loads correctly with all expected navigation elements.
  /// It checks for the presence of the application title and all example
  /// navigation cards (Counter, Calculator, Color Selector).
  ///
  /// Test Steps:
  /// 1. Create and pump the FlutterExampleApp widget
  /// 2. Verify the application title "Flutter Examples" is displayed
  /// 3. Verify all example navigation cards are present:
  ///    - Counter example card with title
  ///    - Calculator example card with title
  ///    - Color Selector example card with title
  ///
  /// Expected Behavior:
  /// * App launches without errors or exceptions
  /// * Home screen displays with proper title
  /// * All three example navigation cards are visible
  /// * Text content matches expected values
  ///
  /// Error Conditions:
  /// * Widget creation failures indicate structural issues
  /// * Missing text elements suggest UI rendering problems
  /// * Multiple matches indicate duplicate widgets or layout issues
  testWidgets('App launches with home navigation', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const FlutterExampleApp());

    // Verify that the home screen loads with navigation cards.
    expect(find.text('Flutter Examples'), findsOneWidget);
    expect(find.text('Counter'), findsOneWidget);
    expect(find.text('Calculator'), findsOneWidget);
    expect(find.text('Color Selector'), findsOneWidget);
  });
}

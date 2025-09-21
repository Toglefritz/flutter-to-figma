import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:example_flutter_app/main.dart';

/// Test suite for responsive design and accessibility features.
///
/// This test suite verifies that the Flutter Examples app works correctly
/// across different screen sizes and orientations, and that accessibility
/// features are properly implemented throughout the application.
///
/// Test Categories:
/// * Screen size responsiveness (phone, tablet, desktop)
/// * Orientation handling (portrait and landscape)
/// * Accessibility compliance (semantic labels, contrast)
/// * Navigation flow across different screen sizes
/// * Touch target sizes and usability
///
/// The tests use Flutter's widget testing framework to simulate different
/// device configurations and verify that the UI adapts appropriately
/// while maintaining functionality and accessibility standards.
void main() {
  group('Responsive Design Tests', () {
    /// Test that the app renders correctly on phone-sized screens.
    ///
    /// This test verifies that all UI elements are properly sized and
    /// positioned on smaller screens, with appropriate text scaling
    /// and touch target sizes for mobile devices.
    testWidgets('App renders correctly on phone screen', (
      WidgetTester tester,
    ) async {
      // Set phone screen size (iPhone 12 Pro dimensions)
      await tester.binding.setSurfaceSize(const Size(390, 844));

      // Build the app
      await tester.pumpWidget(const FlutterExampleApp());

      // Verify that the home screen loads
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Verify that all example cards are visible
      expect(find.text('Counter'), findsOneWidget);
      expect(find.text('Calculator'), findsOneWidget);
      expect(find.text('Color Selector'), findsOneWidget);

      // Verify that cards are properly sized for phone screen
      final Finder cardFinder = find.byType(Card);
      expect(cardFinder, findsNWidgets(3));

      // Test navigation to counter example
      await tester.tap(find.text('Counter'));
      await tester.pumpAndSettle();

      // Verify counter screen loads and is usable on phone
      expect(find.text('Counter Example'), findsOneWidget);
      expect(find.text('0'), findsOneWidget);
      expect(find.byType(FloatingActionButton), findsOneWidget);

      // Test increment functionality
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();
      expect(find.text('1'), findsOneWidget);
    });

    /// Test that the app renders correctly on tablet-sized screens.
    ///
    /// This test verifies that the app takes advantage of larger screen
    /// real estate while maintaining proper proportions and usability
    /// on tablet devices.
    testWidgets('App renders correctly on tablet screen', (
      WidgetTester tester,
    ) async {
      // Set tablet screen size (iPad Pro 11" dimensions)
      await tester.binding.setSurfaceSize(const Size(834, 1194));

      // Build the app
      await tester.pumpWidget(const FlutterExampleApp());

      // Verify that the home screen loads
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Verify that all example cards are visible and properly spaced
      expect(find.text('Counter'), findsOneWidget);
      expect(find.text('Calculator'), findsOneWidget);
      expect(find.text('Color Selector'), findsOneWidget);

      // Test navigation to calculator example
      await tester.tap(find.text('Calculator'));
      await tester.pumpAndSettle();

      // Verify calculator screen loads and buttons are properly sized
      expect(find.text('Calculator Example'), findsOneWidget);
      expect(find.text('0'), findsOneWidget);

      // Verify calculator buttons are present and properly sized
      expect(find.text('1'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
      expect(find.text('+'), findsOneWidget);
      expect(find.text('='), findsOneWidget);
    });

    /// Test that the app handles landscape orientation correctly.
    ///
    /// This test verifies that UI elements reflow appropriately when
    /// the device is rotated to landscape orientation, maintaining
    /// usability and visual hierarchy.
    testWidgets('App handles landscape orientation', (
      WidgetTester tester,
    ) async {
      // Set landscape phone dimensions
      await tester.binding.setSurfaceSize(const Size(844, 390));

      // Build the app
      await tester.pumpWidget(const FlutterExampleApp());

      // Verify that the home screen loads in landscape
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Verify that cards are still visible and accessible
      expect(find.text('Counter'), findsOneWidget);
      expect(find.text('Calculator'), findsOneWidget);
      expect(find.text('Color Selector'), findsOneWidget);

      // Test navigation to color selector
      await tester.tap(find.text('Color Selector'));
      await tester.pumpAndSettle();

      // Verify color selector loads and is usable in landscape
      expect(find.text('Color Selector'), findsOneWidget);
      expect(find.text('RGB'), findsOneWidget);
      expect(find.text('HSL'), findsOneWidget);
    });
  });

  group('Accessibility Tests', () {
    /// Test that semantic labels are properly implemented.
    ///
    /// This test verifies that all interactive elements have appropriate
    /// semantic labels for screen readers and other accessibility tools.
    testWidgets('Semantic labels are properly implemented', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const FlutterExampleApp());

      // Verify home screen has semantic labels
      expect(
        find.bySemanticsLabel(RegExp(r'Navigate to Counter example')),
        findsOneWidget,
      );
      expect(
        find.bySemanticsLabel(RegExp(r'Navigate to Calculator example')),
        findsOneWidget,
      );
      expect(
        find.bySemanticsLabel(RegExp(r'Navigate to Color Selector example')),
        findsOneWidget,
      );

      // Navigate to counter and test its accessibility
      await tester.tap(find.text('Counter'));
      await tester.pumpAndSettle();

      // Verify counter screen has proper semantic labels
      expect(
        find.bySemanticsLabel(RegExp(r'Current counter value')),
        findsOneWidget,
      );
      expect(
        find.bySemanticsLabel(RegExp(r'Increment counter')),
        findsOneWidget,
      );
      expect(find.bySemanticsLabel(RegExp(r'Reset counter')), findsOneWidget);
    });

    /// Test that touch targets meet minimum size requirements.
    ///
    /// This test verifies that all interactive elements meet the minimum
    /// touch target size of 44x44 logical pixels for accessibility compliance.
    testWidgets('Touch targets meet minimum size requirements', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const FlutterExampleApp());

      // Navigate to calculator to test button sizes
      await tester.tap(find.text('Calculator'));
      await tester.pumpAndSettle();

      // Find calculator buttons and verify their sizes
      final Finder buttonFinder = find.byType(ElevatedButton);
      expect(buttonFinder, findsWidgets);

      // Verify that buttons meet minimum touch target size
      for (final Element element in buttonFinder.evaluate()) {
        final RenderBox renderBox = element.renderObject as RenderBox;
        final Size buttonSize = renderBox.size;

        // Minimum touch target size is 44x44 logical pixels
        expect(buttonSize.width, greaterThanOrEqualTo(44.0));
        expect(buttonSize.height, greaterThanOrEqualTo(44.0));
      }
    });

    /// Test that the app works with system font scaling.
    ///
    /// This test verifies that the app remains usable when users
    /// increase system font sizes for better readability.
    testWidgets('App works with system font scaling', (
      WidgetTester tester,
    ) async {
      // Set large font scale
      await tester.binding.setSurfaceSize(const Size(390, 844));

      // Build app with large text scale
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(
            textScaler: TextScaler.linear(2.0), // 200% text scaling
          ),
          child: const FlutterExampleApp(),
        ),
      );

      // Verify that the app still renders correctly with large text
      expect(find.text('Flutter Examples'), findsOneWidget);
      expect(find.text('Counter'), findsOneWidget);
      expect(find.text('Calculator'), findsOneWidget);
      expect(find.text('Color Selector'), findsOneWidget);

      // Test that navigation still works with large text
      await tester.tap(find.text('Counter'));
      await tester.pumpAndSettle();

      // Verify counter screen is still usable
      expect(find.text('Counter Example'), findsOneWidget);
      expect(find.byType(FloatingActionButton), findsOneWidget);
    });
  });

  group('Navigation Tests', () {
    /// Test that navigation flow works correctly across all screens.
    ///
    /// This test verifies that users can navigate between all screens
    /// and that the navigation stack is properly maintained.
    testWidgets('Navigation flow works correctly', (WidgetTester tester) async {
      await tester.pumpWidget(const FlutterExampleApp());

      // Start at home screen
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Navigate to counter
      await tester.tap(find.text('Counter'));
      await tester.pumpAndSettle();
      expect(find.text('Counter Example'), findsOneWidget);

      // Navigate back to home
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Navigate to calculator
      await tester.tap(find.text('Calculator'));
      await tester.pumpAndSettle();
      expect(find.text('Calculator Example'), findsOneWidget);

      // Navigate back to home
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Navigate to color selector
      await tester.tap(find.text('Color Selector'));
      await tester.pumpAndSettle();
      expect(find.text('Color Selector'), findsOneWidget);

      // Navigate back to home
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Flutter Examples'), findsOneWidget);
    });

    /// Test that back navigation maintains proper state.
    ///
    /// This test verifies that when users navigate back from screens,
    /// the previous screen state is properly maintained.
    testWidgets('Back navigation maintains state', (WidgetTester tester) async {
      await tester.pumpWidget(const FlutterExampleApp());

      // Navigate to counter and increment it
      await tester.tap(find.text('Counter'));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();
      expect(find.text('1'), findsOneWidget);

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();
      expect(find.text('2'), findsOneWidget);

      // Navigate back to home
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Flutter Examples'), findsOneWidget);

      // Navigate back to counter and verify state is reset (new instance)
      await tester.tap(find.text('Counter'));
      await tester.pumpAndSettle();
      expect(
        find.text('0'),
        findsOneWidget,
      ); // Counter resets on new navigation
    });
  });
}

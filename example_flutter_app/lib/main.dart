import 'package:flutter/material.dart';
import 'screens/home/home_route.dart';
import 'utils/error_handler.dart';

/// Application entry point that initializes and runs the Flutter Examples app.
///
/// This function is called by the Flutter framework when the app starts.
/// It creates the root widget and begins the widget tree rendering process.
/// The function also initializes global error handling to ensure proper
/// error reporting and user feedback throughout the application.
///
/// The app uses Material Design 3 theming with a teal color scheme
/// and provides navigation to various Flutter UI examples.
///
/// Error Handling:
/// Global error handlers are initialized to catch both Flutter framework
/// errors and uncaught exceptions, providing appropriate user feedback
/// and detailed logging for debugging purposes.
void main() {
  // Initialize global error handling
  ErrorHandler.initialize();

  runApp(const FlutterExampleApp());
}

/// Root application widget that configures the Material Design theme and navigation.
///
/// This widget serves as the top-level container for the entire application,
/// providing consistent theming and navigation structure. It uses Material Design 3
/// with a deep purple color scheme and sets up the home screen navigation.
///
/// The app demonstrates three main example categories:
/// * Counter - Simple state management with increment functionality
/// * Calculator - Grid-based layout with mathematical operations
/// * Color Selector - Advanced color manipulation with real-time updates
///
/// Navigation is handled through direct MaterialPageRoute construction
/// rather than named routes, following Flutter best practices for
/// type-safe navigation with parameter passing.
class FlutterExampleApp extends StatelessWidget {
  /// Creates the root application widget.
  ///
  /// The [key] parameter is used for widget identification in the widget tree
  /// and is typically provided by the Flutter framework.
  const FlutterExampleApp({super.key});

  /// Builds the root MaterialApp widget with theme and navigation configuration.
  ///
  /// This method configures:
  /// * Application title for platform integration
  /// * Material Design 3 theme with deep purple color scheme
  /// * Home screen route as the initial navigation destination
  ///
  /// The theme uses Material Design 3 (useMaterial3: true) for modern
  /// visual components and follows Material Design guidelines for
  /// consistent user experience across platforms.
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns MaterialApp widget configured with theme and navigation
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Examples',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.dark,
          seedColor: Colors.teal,
        ),
      ),
      home: const HomeRoute(),
    );
  }
}

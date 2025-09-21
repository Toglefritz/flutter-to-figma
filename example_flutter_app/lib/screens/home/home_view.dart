import 'package:flutter/material.dart';
import 'home_controller.dart';

/// View layer for the home navigation screen UI presentation.
///
/// This StatelessWidget implements the view layer of the MVC pattern,
/// handling only UI presentation and user interaction forwarding.
/// All business logic and navigation is delegated to the HomeController
/// passed as a constructor parameter.
///
/// Layout Design:
/// * AppBar with application title and theme-consistent styling
/// * Grid layout with 2 columns for optimal space utilization
/// * Responsive spacing and padding for consistent visual hierarchy
/// * Material Design cards with elevation and ripple effects
///
/// Accessibility:
/// * Semantic labels for screen readers
/// * Proper touch targets (minimum 48x48 logical pixels)
/// * High contrast colors following Material Design guidelines
/// * Text overflow handling for different screen sizes and font scales
///
/// Performance:
/// * Stateless widget for optimal rebuild performance
/// * Efficient grid layout with fixed cross-axis count
/// * Minimal widget tree depth for fast rendering
class HomeView extends StatelessWidget {
  /// Creates the home view with the specified controller.
  ///
  /// @param state The HomeController instance that manages business logic
  /// @param key Optional widget key for identification in the widget tree
  const HomeView(this.state, {super.key});

  /// Controller instance that handles business logic and navigation.
  ///
  /// This controller provides navigation methods that are called when
  /// users tap on example cards. The view delegates all business logic
  /// to this controller while focusing purely on UI presentation.
  final HomeController state;

  /// Builds the home screen UI with navigation cards in a grid layout.
  ///
  /// Creates a Scaffold with an AppBar and body containing a grid of
  /// example cards. Each card represents a different Flutter example
  /// and includes an icon, title, description, and tap handler.
  ///
  /// Layout Structure:
  /// 1. AppBar with title and theme-consistent background color
  /// 2. Padded body with 16px margins for visual breathing room
  /// 3. 2-column grid with 16px spacing between cards
  /// 4. Example cards with Material Design elevation and ripple effects
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns Scaffold widget containing the complete home screen UI
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Examples'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Semantics(
        label: 'Flutter examples navigation screen',
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              // Calculate responsive grid parameters
              final double availableWidth = constraints.maxWidth;
              final int crossAxisCount = availableWidth > 600 ? 3 : 2;
              final double childAspectRatio = availableWidth > 600 ? 1.2 : 1.0;

              return GridView.count(
                crossAxisCount: crossAxisCount,
                crossAxisSpacing: 16.0,
                mainAxisSpacing: 16.0,
                childAspectRatio: childAspectRatio,
                semanticChildCount: 3,
                children: [
                  _ExampleCard(
                    title: 'Counter',
                    description: 'Simple counter with increment functionality',
                    icon: Icons.add_circle_outline,
                    onTap: state.navigateToCounter,
                  ),
                  _ExampleCard(
                    title: 'Calculator',
                    description: 'Basic calculator with grid layout',
                    icon: Icons.calculate_outlined,
                    onTap: state.navigateToCalculator,
                  ),
                  _ExampleCard(
                    title: 'Color Selector',
                    description: 'Advanced color picker with real-time updates',
                    icon: Icons.palette_outlined,
                    onTap: state.navigateToColorSelector,
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Private widget for displaying individual example cards in the navigation grid.
///
/// This reusable card widget presents information about each Flutter example
/// with consistent styling and interaction patterns. Cards include visual
/// hierarchy through typography, iconography, and Material Design elevation.
///
/// Design Features:
/// * Material Design Card with 4.0 elevation for depth perception
/// * InkWell with rounded corners for Material ripple effects
/// * Centered column layout with proper spacing between elements
/// * Icon with theme-consistent primary color
/// * Title with bold typography for visual hierarchy
/// * Description with smaller text and overflow handling
///
/// Interaction:
/// * Tap gesture handling through InkWell with visual feedback
/// * Rounded border radius matching card corners for seamless ripple
/// * VoidCallback for flexible action handling
///
/// Accessibility:
/// * Semantic structure with proper text hierarchy
/// * Touch target meets minimum 48x48 logical pixel requirement
/// * High contrast colors for readability
/// * Text overflow with ellipsis for long descriptions
class _ExampleCard extends StatelessWidget {
  /// Creates an example card with the specified content and interaction.
  ///
  /// All parameters are required to ensure complete card configuration
  /// with proper content and interaction handling.
  ///
  /// @param title Display title for the example (shown in bold)
  /// @param description Brief description of the example functionality
  /// @param icon Material Design icon representing the example type
  /// @param onTap Callback function executed when the card is tapped
  const _ExampleCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.onTap,
  });

  /// Display title for the example shown in the card.
  ///
  /// This title appears prominently below the icon and should be
  /// concise and descriptive of the example's primary functionality.
  /// Text is styled with bold typography for visual hierarchy.
  final String title;

  /// Brief description of the example's functionality and features.
  ///
  /// This description provides additional context about what users
  /// can expect from the example. Text is limited to 2 lines with
  /// ellipsis overflow handling for consistent card sizing.
  final String description;

  /// Material Design icon representing the example type or functionality.
  ///
  /// The icon is displayed prominently at the top of the card with
  /// the theme's primary color and 48px size for optimal visibility
  /// and touch target accessibility.
  final IconData icon;

  /// Callback function executed when the user taps the card.
  ///
  /// This callback typically triggers navigation to the specific
  /// example screen and is provided by the HomeController to
  /// maintain separation between view and business logic.
  final VoidCallback onTap;

  /// Builds the card UI with icon, title, description, and tap handling.
  ///
  /// Creates a Material Design card with elevation, rounded corners,
  /// and ripple effect interaction. The content is arranged in a
  /// centered column with proper spacing and typography hierarchy.
  ///
  /// Visual Structure:
  /// 1. Card container with 4.0 elevation and rounded corners
  /// 2. InkWell for tap handling with matching border radius
  /// 3. Padded content area with 16px margins
  /// 4. Centered column with icon, title, and description
  /// 5. Proper spacing between elements using Padding widgets
  ///
  /// @param context The build context provided by the Flutter framework
  /// @returns Card widget containing the complete example card UI
  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Navigate to $title example. $description',
      onTap: onTap,
      child: Card(
        elevation: 4.0,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12.0),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Semantics(
                  label: '$title example icon',
                  child: Icon(
                    icon,
                    size: 32.0, // Reduced size for better fit
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 6.0),
                  child: Semantics(
                    header: true,
                    child: Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 4.0),
                  child: Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontSize: 10.0, // Smaller font for better fit
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

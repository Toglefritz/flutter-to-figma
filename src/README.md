# Flutter → Figma Plugin Source Structure

This directory contains the source code for the Flutter → Figma plugin, organized into modular components.

## Directory Structure

```
src/
├── parser/          # Dart code analysis and widget tree extraction
├── schema/          # Core type definitions and data structures  
├── figma/           # Figma node creation and management
├── ui/              # Plugin user interface components
├── errors/          # Error handling and validation
└── index.ts         # Main entry point and exports
```

## Core Interfaces

### Widget (`src/schema/types.ts`)
- `Widget`: Core data structure representing Flutter widgets
- `WidgetType`: Enumeration of supported Flutter widget types
- `StyleInfo`: Styling information extracted from widgets
- `LayoutInfo`: Layout properties for container widgets

### Theme (`src/schema/theme-schema.ts`)
- `ThemeData`: Flutter theme representation
- `ColorScheme`: Flutter color scheme structure
- `TextTheme`: Typography definitions
- `SpacingScale`: Consistent spacing measurements

### Figma (`src/figma/figma-node-spec.ts`)
- `FigmaNodeSpec`: Specification for creating Figma nodes
- `AutoLayoutSpec`: Auto Layout configuration
- `VariableBinding`: Figma Variable connections
- `FigmaComponentSpec`: Component creation specifications

### Error Handling (`src/errors/index.ts`)
- `PluginError`: Base error class with categorization
- `ParseError`: Dart syntax and parsing errors
- `WidgetError`: Widget-specific conversion issues
- `ConversionError`: Figma node creation problems
- `GracefulErrorHandler`: Error handler with fallback mechanisms

## Module Responsibilities

- **Parser**: Analyzes Dart/Flutter code and extracts widget information
- **Schema**: Defines data structures and type definitions
- **Figma**: Creates and manages Figma nodes, variables, and components
- **UI**: Handles file upload, progress display, and user interaction
- **Errors**: Provides comprehensive error handling and user feedback

## Implementation Status

✅ **Task 1 Complete**: Project structure and core interfaces established
- Directory structure created
- TypeScript interfaces defined
- Error handling framework implemented
- Build system configured

🔄 **Next Tasks**: Implementation of individual modules (Tasks 2-11)
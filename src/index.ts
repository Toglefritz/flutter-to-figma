// Main entry point for the Flutter → Figma plugin

// Core types and interfaces
export * from './schema';
export * from './figma/figma-node-spec';
export * from './errors';

// Module exports
export * from './parser';
export * from './figma';
export * from './ui';

// Re-export key interfaces for easy access
export type {
  Widget,
  WidgetType,
  StyleInfo,
  ThemeData
} from './schema';

export type {
  FigmaNodeSpec
} from './figma/figma-node-spec';

export type {
  PluginError
} from './errors';
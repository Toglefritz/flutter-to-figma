// Theme data structures for Flutter theme extraction

/**
 * Flutter ThemeData representation
 */
export interface ThemeData {
  colorScheme: ColorScheme;
  textTheme: TextTheme;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  brightness?: 'light' | 'dark';
  primarySwatch?: MaterialColor;
}

/**
 * Flutter ColorScheme
 */
export interface ColorScheme {
  brightness: 'light' | 'dark';
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  error: string;
  onError: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant?: string;
  onSurfaceVariant?: string;
  outline?: string;
  shadow?: string;
}

/**
 * Flutter TextTheme
 */
export interface TextTheme {
  displayLarge?: TextStyle;
  displayMedium?: TextStyle;
  displaySmall?: TextStyle;
  headlineLarge?: TextStyle;
  headlineMedium?: TextStyle;
  headlineSmall?: TextStyle;
  titleLarge?: TextStyle;
  titleMedium?: TextStyle;
  titleSmall?: TextStyle;
  bodyLarge?: TextStyle;
  bodyMedium?: TextStyle;
  bodySmall?: TextStyle;
  labelLarge?: TextStyle;
  labelMedium?: TextStyle;
  labelSmall?: TextStyle;
}

/**
 * Flutter TextStyle
 */
export interface TextStyle {
  fontSize?: number;
  fontWeight?: FontWeight;
  fontFamily?: string;
  letterSpacing?: number;
  wordSpacing?: number;
  height?: number; // line height multiplier
  color?: string;
  decoration?: TextDecoration;
  decorationColor?: string;
  decorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
}

/**
 * Flutter FontWeight enumeration
 */
export enum FontWeight {
  w100 = '100',
  w200 = '200',
  w300 = '300',
  w400 = '400', // normal
  w500 = '500',
  w600 = '600',
  w700 = '700', // bold
  w800 = '800',
  w900 = '900'
}

/**
 * Text decoration types
 */
export enum TextDecoration {
  none = 'none',
  underline = 'underline',
  overline = 'overline',
  lineThrough = 'lineThrough'
}

/**
 * Spacing scale for consistent measurements
 */
export interface SpacingScale {
  xs: number;    // 4
  sm: number;    // 8
  md: number;    // 16
  lg: number;    // 24
  xl: number;    // 32
  xxl: number;   // 48
  [key: string]: number;
}

/**
 * Border radius scale
 */
export interface BorderRadiusScale {
  none: number;     // 0
  sm: number;       // 4
  md: number;       // 8
  lg: number;       // 12
  xl: number;       // 16
  full: number;     // 9999
  [key: string]: number;
}

/**
 * Material color swatch
 */
export interface MaterialColor {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // primary shade
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Theme mode configuration
 */
export interface ThemeMode {
  mode: 'light' | 'dark' | 'system';
  lightTheme: ThemeData;
  darkTheme?: ThemeData;
}

/**
 * Theme reference for widgets that use Theme.of(context)
 */
export interface ThemeReference {
  path: string; // e.g., 'primaryColor', 'textTheme.bodyLarge.color'
  fallbackValue?: string;
}

/**
 * Extracted theme information from parsing
 */
export interface ExtractedTheme {
  themes: ThemeData[];
  references: ThemeReference[];
  modes: ThemeMode[];
}
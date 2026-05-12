/**
 * Kasirpuintar Flat Design System — Color Tokens
 * Based on design.xml: vibrant, confident palette with high contrast.
 * NO shadows. Color-as-structure philosophy.
 */

export const Colors = {
  background: "#FFFFFF",
  foreground: "#111827",

  primary: {
    DEFAULT: "#3B82F6",
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
  },

  secondary: {
    DEFAULT: "#10B981",
    50: "#ECFDF5",
    100: "#D1FAE5",
    500: "#10B981",
    600: "#059669",
  },

  accent: {
    DEFAULT: "#F59E0B",
    50: "#FFFBEB",
    100: "#FEF3C7",
    500: "#F59E0B",
    600: "#D97706",
  },

  muted: "#F3F4F6",
  border: "#E5E7EB",

  // Semantic colors for status
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",

  // Gray scale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
} as const;

export default Colors;

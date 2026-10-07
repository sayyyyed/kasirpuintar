/**
 * Kasirpuintar semantic design tokens.
 * The names describe a role, not a hue, so screens stay consistent as the palette evolves.
 */

export const Colors = {
  kumo: {
    canvas: "#FAFAFA",
    elevated: "#F8F8F8",
    recessed: "#F3F3F3",
    base: "#FFFFFF",
    tint: "#F7F7F7",
    overlay: "#FAFAFA",
    control: "#FFFFFF",
    contrast: "#161616",
    interact: "#DEDEDE",
    fill: "#F5F5F5",
    fillHover: "#F8F8F8",
    brand: "#056DFF",
    brandHover: "#005EE6",
    info: "#2563EB",
    infoTint: "#EFF6FF",
    success: "#047857",
    successTint: "#ECFDF5",
    warning: "#B45309",
    warningTint: "#FFFBEB",
    danger: "#B91C1C",
    dangerTint: "#FEF2F2",
    default: "#2D2D2D",
    strong: "#232323",
    subtle: "#808080",
    inactive: "#B8B8B8",
    placeholder: "#B5B5B5",
    inverse: "#F7F7F7",
    link: "#2563EB",
    line: "#DCDCDC",
    hairline: "#E5E5E5",
  },
  canvas: "#FAFAFA",
  elevated: "#FFFFFF",
  recessed: "#F3F4F6",
  base: "#FFFFFF",
  tint: "#F7F7F8",
  control: "#FFFFFF",
  contrast: "#161616",
  background: "#FAFAFA",
  foreground: "#171717",

  primary: {
    DEFAULT: "#056DFF",
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
  },

  secondary: {
    DEFAULT: "#047857",
    50: "#ECFDF5",
    100: "#D1FAE5",
    500: "#10B981",
    600: "#059669",
  },

  accent: {
    DEFAULT: "#B45309",
    50: "#FFFBEB",
    100: "#FEF3C7",
    500: "#F59E0B",
    600: "#D97706",
  },

  muted: "#E5E7EB",
  fill: "#E5E7EB",
  border: "#D1D5DB",
  line: "#D1D5DB",
  hairline: "#E5E7EB",
  subtle: "#6B7280",
  inactive: "#9CA3AF",
  placeholder: "#9CA3AF",
  inverse: "#FAFAFA",
  link: "#2563EB",
  info: "#2563EB",

  // Semantic colors for status
  success: "#047857",
  warning: "#B45309",
  danger: "#B91C1C",

  // Gray scale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#6B7280",
    500: "#4B5563",
    600: "#374151",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
} as const;

export default Colors;

import { Platform } from "react-native";

/**
 * Android-only subview clipping for lists.
 *
 * When true, React Native detaches off-screen cells from the native view
 * hierarchy instead of keeping them mounted and drawn. On Android that can be a
 * real win on long lists; on iOS it is unnecessary and historically buggy, so it
 * is left off there.
 *
 * Known caveat: on Android this is a documented source of blank cells, most
 * often with absolutely-positioned children, rows whose height the list cannot
 * resolve, and nested scroll containers. If a list starts rendering empty rows
 * while scrolling fast, this flag is the first thing to switch off for that
 * list.
 *
 * Platform.OS cannot change at runtime, so this resolves once at module load.
 */
export const REMOVE_CLIPPED_SUBVIEWS = Platform.OS === "android";

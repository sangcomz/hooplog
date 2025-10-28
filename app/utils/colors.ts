/**
 * Color utility functions for consistent styling across the app
 * All colors are defined in globals.css as CSS variables
 */

/**
 * Get tier badge color classes
 */
export function getTierColor(tier: string): string {
  switch (tier) {
    case "A":
      return "bg-tier-a-bg text-tier-a-text border-tier-a-border"
    case "B":
      return "bg-tier-b-bg text-tier-b-text border-tier-b-border"
    case "C":
      return "bg-tier-c-bg text-tier-c-text border-tier-c-border"
    default:
      return "bg-tier-c-bg text-tier-c-text border-tier-c-border"
  }
}

/**
 * Get role badge color classes
 */
export function getRoleColor(role: string): string {
  return role === "MANAGER"
    ? "bg-role-manager-bg text-role-manager-text"
    : "bg-role-member-bg text-role-member-text"
}

/**
 * Get attendance status badge color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "attend":
      return "bg-success-bg text-success-text"
    case "absent":
      return "bg-error-bg text-error-text"
    case "pending":
      return "bg-warning-bg text-warning-text"
    default:
      return "bg-tier-c-bg text-tier-c-text"
  }
}

/**
 * Get status text label
 */
export function getStatusText(status: string): string {
  switch (status) {
    case "attend":
      return "참석"
    case "absent":
      return "불참"
    case "pending":
      return "미정"
    default:
      return status
  }
}

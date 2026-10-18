const darkPalette = {
  primary: "#7c8dff", secondary: "#45a7ff", enabled: "#6dffb0", disabled: "#69738a",
  warning: "#f0bd78", targeting: "#aeb2ff", accent: "#d58cff", grid: "rgba(255,255,255,.07)",
  axis: "#69738a", tick: "#8b95ab", tooltipBackground: "#151c2c", tooltipText: "#f5f7ff",
  tooltipBorder: "1px solid rgba(255,255,255,.12)", cursor: "rgba(124,141,255,.08)",
};

const lightPalette = {
  primary: "#5368e8", secondary: "#1678c2", enabled: "#157347", disabled: "#738198",
  warning: "#9a6700", targeting: "#6558c9", accent: "#a43cc4", grid: "rgba(30,50,80,.12)",
  axis: "#738198", tick: "#5c6a82", tooltipBackground: "#ffffff", tooltipText: "#162033",
  tooltipBorder: "1px solid rgba(30,50,80,.18)", cursor: "rgba(83,104,232,.10)",
};

export const chartPalettes = { dark: darkPalette, light: lightPalette };
export const chartPalette = darkPalette;
export function getChartPalette(theme = "dark") { return chartPalettes[theme] || darkPalette; }

function semanticColors(palette) { return { "User ID": palette.secondary, user: palette.secondary, user_id: palette.secondary, Group: palette.targeting, group: palette.targeting, Percentage: palette.primary, percentage: palette.primary }; }
function statusColors(palette) { return { Enabled: palette.enabled, enabled: palette.enabled, Active: palette.enabled, active: palette.enabled, Healthy: palette.enabled, healthy: palette.enabled, "Enabled treatment": palette.enabled, Disabled: palette.disabled, disabled: palette.disabled, Inactive: palette.disabled, inactive: palette.disabled, "Disabled treatment": palette.disabled }; }
export const ruleTypeColors = semanticColors(darkPalette);
export const statusColorMap = statusColors(darkPalette);
function rolloutBucketColorsFor(palette) { return { "0–25%": palette.secondary, "26–50%": palette.primary, "51–75%": palette.targeting, "76–100%": palette.accent, "0-25%": palette.secondary, "26-50%": palette.primary, "51-75%": palette.targeting, "76-100%": palette.accent, "0Ã¢â‚¬â€œ25%": palette.secondary, "26Ã¢â‚¬â€œ50%": palette.primary, "51Ã¢â‚¬â€œ75%": palette.targeting, "76Ã¢â‚¬â€œ100%": palette.accent }; }
function auditActionColorsFor(palette) { return { Create: palette.secondary, Update: palette.primary, Enable: palette.enabled, Disable: palette.disabled, Delete: palette.warning, "Rule create": palette.targeting, "Rule update": palette.accent, "Rule delete": palette.warning }; }
const categoryColorsFor = (palette) => [palette.primary, palette.secondary, palette.targeting, palette.accent, palette.warning];

function stableCategoryIndex(value, palette = darkPalette) {
  const normalized = String(value || "").trim().toLowerCase(); let hash = 2166136261;
  for (const character of normalized) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) % categoryColorsFor(palette).length;
}

function entryValue(entry, fields = []) {
  if (entry && typeof entry === "object") { for (const field of fields) if (entry[field]) return entry[field]; }
  return entry;
}

export function createStableCategoryColorMap(identities, palette = darkPalette) {
  const categoryColors = categoryColorsFor(palette);
  const normalizedIdentities = [...new Set((identities || []).map((identity) => String(identity || "").trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  const assignedColors = new Map(); const usedSlots = new Set();
  normalizedIdentities.forEach((identity) => {
    const preferredSlot = stableCategoryIndex(identity, palette); let slot = preferredSlot;
    for (let offset = 0; offset < categoryColors.length; offset += 1) { const candidate = (preferredSlot + offset) % categoryColors.length; if (!usedSlots.has(candidate)) { slot = candidate; break; } }
    assignedColors.set(identity, categoryColors[slot]);
    if (usedSlots.size < categoryColors.length) usedSlots.add(slot);
  });
  return assignedColors;
}

export function resolveCategoryColor(value, index = 0, palette = darkPalette) { const resolvedValue = entryValue(value, ["fullName", "name"]); return semanticColors(palette)[resolvedValue] || statusColors(palette)[resolvedValue] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue || index, palette)]; }
export function resolveRuleTypeColor(value, palette = darkPalette) { const resolvedValue = entryValue(value, ["ruleType", "name", "type"]); return semanticColors(palette)[resolvedValue] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue, palette)]; }
export function resolveStatusColor(value, index = 0, palette = darkPalette) { const resolvedValue = entryValue(value, ["status", "name"]); return statusColors(palette)[resolvedValue] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue || index, palette)]; }
export function resolveEnvironmentColor(value, palette = darkPalette) { const resolvedValue = entryValue(value, ["fullName", "environment", "name"]); const common = { development: palette.secondary, staging: palette.targeting, production: palette.primary, testing: palette.accent, local: palette.warning }; return common[String(resolvedValue || "").trim().toLowerCase()] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue, palette)]; }
export function resolveFlagTypeColor(value, palette = darkPalette) { const resolvedValue = entryValue(value, ["type", "name"]); const types = { boolean: palette.secondary, string: palette.targeting, number: palette.accent }; return types[String(resolvedValue || "").toLowerCase()] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue, palette)]; }
export function resolveRolloutColor(value, palette = darkPalette) { const resolvedValue = entryValue(value, ["name"]); const normalizedBucket = String(resolvedValue || "").match(/(\d+)[^\d]+(\d+)%/); const bucketKey = normalizedBucket ? `${normalizedBucket[1]}-${normalizedBucket[2]}%` : resolvedValue; return rolloutBucketColorsFor(palette)[bucketKey] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue, palette)]; }
export function resolveAuditActionColor(value, palette = darkPalette) { const resolvedValue = entryValue(value, ["action", "name"]); return auditActionColorsFor(palette)[resolvedValue] || categoryColorsFor(palette)[stableCategoryIndex(resolvedValue, palette)]; }
export function resolveFlagColor(value, palette = darkPalette) { const resolvedValue = entryValue(value, ["fullName", "flagKey", "name"]); const normalized = String(resolvedValue || "").trim().toLowerCase(); if (["development", "staging", "production", "testing", "local"].includes(normalized)) return resolveEnvironmentColor(resolvedValue, palette); return categoryColorsFor(palette)[stableCategoryIndex(resolvedValue, palette)]; }

export const tooltipStyle = { background: darkPalette.tooltipBackground, border: darkPalette.tooltipBorder, borderRadius: 8, color: darkPalette.tooltipText };
export function getTooltipStyle(theme = "dark") { const palette = getChartPalette(theme); return { background: palette.tooltipBackground, border: palette.tooltipBorder, borderRadius: 8, color: palette.tooltipText }; }

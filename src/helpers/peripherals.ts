export const NavPeripheralType = {
  progressForward:  "th_nav_progress_forward",
  progressBackward: "th_nav_progress_backward",
  moveRight:        "th_nav_move_right",
  moveLeft:         "th_nav_move_left",
  moveUp:           "th_nav_move_up",
  moveDown:         "th_nav_move_down",
  moveHome:         "th_nav_move_home",
  moveEnd:          "th_nav_move_end",
} as const;

export const ACTION_PERIPHERAL_PREFIX = "th_action_" as const;

export const toActionPeripheralType = (key: string) => `${ ACTION_PERIPHERAL_PREFIX }${ key }`;

export const fromActionPeripheralType = (type: string): string | null =>
  type.startsWith(ACTION_PERIPHERAL_PREFIX) ? type.slice(ACTION_PERIPHERAL_PREFIX.length) : null;

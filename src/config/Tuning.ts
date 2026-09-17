/** Every game-feel number lives here. The debug panel edits these live. */
export const T = {
  GRAVITY: 1800,
  FALL_MULT: 1.6,
  APEX_MULT: 0.55,
  APEX_WINDOW: 60,
  JUMP_V: 620,
  JUMP_CUT: 0.4,
  COYOTE_MS: 100,
  BUFFER_MS: 120,
  WALK_MAX: 130,
  RUN_MAX: 240,
  GROUND_ACC: 1600,
  GROUND_FRIC: 1800,
  AIR_ACC: 900,
  AIR_DRAG: 400,
  TURN_BOOST: 1.6,
  TERMINAL_V: 900,
  CAM_LERP: 0.12,
  CAM_LOOKAHEAD: 36,
  CAM_DEADZONE_W: 60,
  CAM_DEADZONE_H: 40,
  HITSTOP_MS: 60,
  STICK_RADIUS: 46,
  STICK_DEADZONE: 0.12,
  RUN_THRESHOLD: 0.6,
};

export type TuningKey = keyof typeof T;
export const DEFAULTS: Record<TuningKey, number> = { ...T };

/** key -> [min, max, step] for the debug sliders */
export const TUNING_META: Partial<Record<TuningKey, [number, number, number]>> = {
  GRAVITY: [600, 3000, 50], FALL_MULT: [1, 2.5, 0.05], APEX_MULT: [0.2, 1, 0.05], APEX_WINDOW: [0, 200, 10],
  JUMP_V: [300, 900, 10], JUMP_CUT: [0.1, 1, 0.05], COYOTE_MS: [0, 250, 10], BUFFER_MS: [0, 250, 10],
  WALK_MAX: [60, 240, 10], RUN_MAX: [120, 400, 10], GROUND_ACC: [400, 4000, 100], GROUND_FRIC: [400, 4000, 100],
  AIR_ACC: [200, 2000, 50], AIR_DRAG: [0, 1500, 50], TURN_BOOST: [1, 3, 0.1],
  CAM_LERP: [0.02, 0.3, 0.01], CAM_LOOKAHEAD: [0, 100, 4], CAM_DEADZONE_W: [0, 200, 10], CAM_DEADZONE_H: [0, 200, 10],
  STICK_RADIUS: [24, 90, 2], STICK_DEADZONE: [0, 0.4, 0.02], RUN_THRESHOLD: [0.3, 0.95, 0.05],
};

export const GAME_H = 360;
export const TILE = 32;

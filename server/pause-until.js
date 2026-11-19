const { setTimeout, clearTimeout } = require("unlimited-timeout");
const dayjs = require("dayjs");
const { log } = require("../src/util");

/** @type {Map<number, ReturnType<typeof setTimeout>>} */
const pauseUntilTimers = new Map();

/**
 * Cancel a pending auto-resume timer for a monitor.
 * @param {number} monitorID Monitor ID
 * @returns {void}
 */
function clearPauseUntilTimer(monitorID) {
    const timer = pauseUntilTimers.get(monitorID);
    if (timer) {
        clearTimeout(timer);
        pauseUntilTimers.delete(monitorID);
    }
}

/**
 * Schedule auto-resume when pause_until is reached.
 * If the deadline is already past, resume immediately.
 * @param {number} monitorID Monitor ID
 * @param {string|Date} pauseUntil Deadline
 * @param {(monitorID: number) => Promise<void>} onResume Resume callback
 * @returns {void}
 */
function schedulePauseUntil(monitorID, pauseUntil, onResume) {
    clearPauseUntilTimer(monitorID);

    if (!pauseUntil) {
        return;
    }

    const ms = dayjs(pauseUntil).diff(dayjs());

    if (ms <= 0) {
        log.info("manage", `Pause until already expired for monitor ${monitorID}, resuming now`);
        Promise.resolve(onResume(monitorID)).catch((e) => {
            log.error("manage", `Failed to auto-resume monitor ${monitorID}: ${e.message}`);
        });
        return;
    }

    log.info("manage", `Scheduled auto-resume for monitor ${monitorID} in ${Math.round(ms / 1000)}s`);

    const timer = setTimeout(() => {
        pauseUntilTimers.delete(monitorID);
        Promise.resolve(onResume(monitorID)).catch((e) => {
            log.error("manage", `Failed to auto-resume monitor ${monitorID}: ${e.message}`);
        });
    }, ms);

    pauseUntilTimers.set(monitorID, timer);
}

/**
 * Allowed timed-pause durations in seconds.
 * Keep in sync with the Details.vue dropdown presets.
 */
const PAUSE_DURATION_PRESETS_SECONDS = Object.freeze([
    10 * 60,
    30 * 60,
    60 * 60,
    2 * 60 * 60,
    6 * 60 * 60,
    24 * 60 * 60,
]);

/**
 * Validate an optional pause duration (seconds).
 * @param {unknown} durationSeconds Duration in seconds, or null/undefined for indefinite
 * @returns {number|null} Validated duration or null
 */
function normalizePauseDuration(durationSeconds) {
    if (durationSeconds == null || durationSeconds === "") {
        return null;
    }

    const value = Number(durationSeconds);
    if (!Number.isFinite(value) || !PAUSE_DURATION_PRESETS_SECONDS.includes(value)) {
        throw new Error("Invalid pause duration");
    }

    return value;
}

module.exports = {
    clearPauseUntilTimer,
    schedulePauseUntil,
    normalizePauseDuration,
    PAUSE_DURATION_PRESETS_SECONDS,
};

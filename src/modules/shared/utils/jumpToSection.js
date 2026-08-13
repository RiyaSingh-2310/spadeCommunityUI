/**
 * Jump the viewport to a rendered section by element id or DOM node.
 * Prefer this over fixed pixel scrolls.
 *
 * @param {string|Element|null|undefined} target
 * @param {{ behavior?: ScrollBehavior, block?: ScrollLogicalPosition }} [options]
 * @returns {boolean}
 */
export function jumpToSection(target, options = {}) {
  const { behavior = "smooth", block = "start" } = options;
  const element =
    typeof target === "string"
      ? typeof document !== "undefined"
        ? document.getElementById(target)
        : null
      : target;

  if (!element || typeof element.scrollIntoView !== "function") {
    return false;
  }

  element.scrollIntoView({ behavior, block });
  return true;
}

/**
 * Wait for paint, then jump. Use after state updates that render the target.
 * @param {string|Element|null|undefined|() => string|Element|null|undefined} target
 * @param {{ behavior?: ScrollBehavior, block?: ScrollLogicalPosition, delayMs?: number }} [options]
 */
export function jumpToSectionAfterRender(target, options = {}) {
  const { delayMs = 50, ...scrollOptions } = options;

  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const resolved = typeof target === "function" ? target() : target;
      jumpToSection(resolved, scrollOptions);
    }, delayMs);
  });
}

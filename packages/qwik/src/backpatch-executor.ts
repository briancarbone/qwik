/**
 * Qwik Backpatch Executor
 *
 * This script executes the backpatch operations by finding the backpatch data script within the
 * same container and applying the patches to the DOM elements.
 *
 * This is the inline script version that auto-executes when loaded in the browser. The actual logic
 * is in backpatch-executor-shared.ts for reusability.
 */

import { executeBackpatch, RESUMABLE_CONTAINER_SELECTOR } from './backpatch-executor-shared';

// When executed as an inline script in the browser
const executorScript = document.currentScript;
if (executorScript) {
  const container = executorScript.closest(RESUMABLE_CONTAINER_SELECTOR);
  if (container) {
    executeBackpatch(document, container);
  }
}

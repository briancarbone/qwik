/**
 * Shared backpatch executor logic that can be imported by both the inline script
 * (backpatch-executor.ts) and test utilities.
 */

const BACKPATCH_DATA_SELECTOR = 'script[type="qwik/backpatch"]';
const ANY_CONTAINER_SELECTOR = '[q\\:container]';
export const RESUMABLE_CONTAINER_SELECTOR =
  ANY_CONTAINER_SELECTOR + ':not([q\\:container=html]):not([q\\:container=text])';
const CONTAINER_ATTR = 'q:container';
const Q_PROPS_SEPARATOR = ':';

/** Element numbering counts a nested container element but never its contents. */
function nextElementInContainer(walker: TreeWalker, container: Element): Element | null {
  const currentNode = walker.currentNode as Element;
  if (currentNode !== container && currentNode.hasAttribute(CONTAINER_ATTR)) {
    let sibling = walker.nextSibling();
    while (!sibling && walker.parentNode()) {
      sibling = walker.nextSibling();
    }
    return sibling as Element | null;
  }
  return walker.nextNode() as Element | null;
}

function findOwnBackpatchScript(container: Element): Element | null {
  const scripts = container.querySelectorAll(BACKPATCH_DATA_SELECTOR);
  for (let i = scripts.length - 1; i >= 0; i--) {
    if (scripts[i].closest(ANY_CONTAINER_SELECTOR) === container) {
      return scripts[i];
    }
  }
  return null;
}

/**
 * Execute backpatch operations on a document.
 *
 * @param doc - The document to execute backpatch on
 * @param containerElement - Optional specific container element (if not provided, will search for
 *   it)
 */
export function executeBackpatch(doc: Document, containerElement?: Element | null) {
  const container = containerElement || doc.querySelector(RESUMABLE_CONTAINER_SELECTOR);
  if (!container) {
    return;
  }

  const script = findOwnBackpatchScript(container);
  if (!script) {
    return;
  }

  const data = JSON.parse(script.textContent || '[]');
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let currentNode: Element | null = container;
  let currentNodeIdx = container.hasAttribute(Q_PROPS_SEPARATOR) ? 0 : -1;

  for (let i = 0; i < data.length; i += 3) {
    const elementIdx = data[i];
    const attrName = data[i + 1];
    let value = data[i + 2];

    while (currentNodeIdx < elementIdx) {
      currentNode = nextElementInContainer(walker, container);
      if (!currentNode) {
        break;
      }
      if (currentNode.hasAttribute(Q_PROPS_SEPARATOR)) {
        currentNodeIdx++;
      }
    }

    const element = currentNode as Element;
    if (value == null || value === false) {
      element.removeAttribute(attrName);
    } else {
      if (typeof value === 'boolean') {
        // only true value can be here
        value = '';
      }
      element.setAttribute(attrName, value);
    }
  }
}

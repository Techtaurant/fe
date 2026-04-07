const HEADER_SELECTOR = "[data-app-header='true']";
const HEADER_GAP_PX = 0;

function getHeaderHeight() {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
  return header?.getBoundingClientRect().height ?? 0;
}

function getHeaderBottom() {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
  return header?.getBoundingClientRect().bottom ?? getHeaderHeight();
}

export function scrollToElementBelowHeader(
  element: HTMLElement,
  behavior: ScrollBehavior,
) {
  const delta = element.getBoundingClientRect().top - getHeaderBottom() - HEADER_GAP_PX;

  if (Math.abs(delta) < 1) {
    return;
  }

  window.scrollBy({ top: delta, behavior });
}

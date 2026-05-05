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

  if (behavior === "auto") {
    const root = document.documentElement;
    const body = document.body;
    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;

    root.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";
    window.scrollTo({ top: window.scrollY + delta, behavior: "auto" });

    window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousRootScrollBehavior;
      body.style.scrollBehavior = previousBodyScrollBehavior;
    });
    return;
  }

  window.scrollBy({ top: delta, behavior });
}

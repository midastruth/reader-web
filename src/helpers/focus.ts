export const isActiveElement = (el: Element | undefined | null) => {
  if (el) return document.activeElement === el;
  return false;
}

export const isKeyboardTriggered = (el: Element | undefined | null) => {
  if (el) return el.matches(":focus-visible");
  return false;
}
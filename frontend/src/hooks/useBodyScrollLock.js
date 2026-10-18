import { useLayoutEffect } from "react";

let activeLocks = 0;
let savedStyles = null;
let savedScrollY = 0;

function lockBodyScroll() {
  if (activeLocks === 0) {
    const { body, documentElement } = document;
    savedScrollY = window.scrollY;
    savedStyles = {
      body: {
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        paddingRight: body.style.paddingRight,
      },
      documentElementOverflow: documentElement.style.overflow,
    };

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.width = "100%";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    documentElement.style.overflow = "hidden";
  }
  activeLocks += 1;
}

function unlockBodyScroll() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks !== 0 || !savedStyles) return;

  const { body, documentElement } = document;
  body.style.position = savedStyles.body.position;
  body.style.top = savedStyles.body.top;
  body.style.width = savedStyles.body.width;
  body.style.paddingRight = savedStyles.body.paddingRight;
  documentElement.style.overflow = savedStyles.documentElementOverflow;
  window.scrollTo(0, savedScrollY);
  savedStyles = null;
}

export default function useBodyScrollLock(locked = true) {
  useLayoutEffect(() => {
    if (!locked) return undefined;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [locked]);
}

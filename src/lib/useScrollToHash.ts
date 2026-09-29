import * as React from "react";
import { useLocation } from "react-router-dom";

// Scrolls the element with this id into view when the URL's hash points at
// it (e.g. /settings/advanced#quiet-hours), once `ready` -- pass the
// loading flag so it waits for the content to exist. Used for the links
// between the punch card and the quiet-hours setting.
//
// Other cards on the same page can finish loading afterwards and push the
// target down, so it re-aims a couple of times while the page settles --
// unless the user has started scrolling on their own.
export function useScrollToHash(id: string, ready = true) {
  const { hash } = useLocation();
  React.useEffect(() => {
    if (!ready || hash !== `#${id}`) return;
    let userScrolled = false;
    const stop = () => {
      userScrolled = true;
    };
    const aim = (behavior: ScrollBehavior) => {
      if (!userScrolled) document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    aim("smooth");
    const timers = [600, 1500].map((ms) => window.setTimeout(() => aim("auto"), ms));
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
    };
  }, [hash, id, ready]);
}

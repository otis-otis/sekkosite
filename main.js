(() => {
  const pages = {
    home: document.getElementById("home"),
    shop: document.getElementById("shop")
  };
  const links = [...document.querySelectorAll(".nav a")];

  const show = (name) => {
    const tab = pages[name] ? name : "home";
    Object.entries(pages).forEach(([key, el]) => {
      el.classList.toggle("is-on", key === tab);
    });
    links.forEach((a) => {
      a.classList.toggle("is-on", a.dataset.tab === tab);
    });
    document.body.dataset.tab = tab;
    if (tab === "home") requestAnimationFrame(() => layout(false));
  };

  const fromHash = () => show((location.hash || "#home").slice(1));

  const home = document.getElementById("home");
  const pan = document.getElementById("home-pan");
  const img = pan && pan.querySelector("img");
  if (!home || !pan || !img) return;

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  let x = 0;
  let minX = 0;
  let maxX = 0;
  let startX = 0;
  let origin = 0;
  let dragging = false;
  let ready = false;
  let pointerId = null;

  const apply = () => {
    img.style.transform = `translate3d(${x}px, -50%, 0)`;
  };

  const layout = (reset) => {
    const vw = home.clientWidth;
    const vh = home.clientHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih || !vw || !vh) return;

    const scale = Math.max(vw / iw, vh / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    img.style.width = `${dw}px`;
    img.style.height = `${dh}px`;

    minX = Math.min(0, vw - dw);
    maxX = 0;

    if (reset || !ready) {
      x = 0.85 * (vw - dw);
      ready = true;
    }
    x = clamp(x, minX, maxX);
    apply();
  };

  img.addEventListener("load", () => layout(true));
  if (img.complete) layout(true);
  window.addEventListener("resize", () => layout(false));

  pan.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    if (maxX === minX) return;
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    origin = x;
    pan.classList.add("is-dragging");
    pan.setPointerCapture(e.pointerId);
  });

  pan.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    x = clamp(origin + (e.clientX - startX), minX, maxX);
    apply();
  });

  const endDrag = (e) => {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    pointerId = null;
    pan.classList.remove("is-dragging");
  };

  pan.addEventListener("pointerup", endDrag);
  pan.addEventListener("pointercancel", endDrag);

  window.addEventListener("hashchange", fromHash);
  fromHash();
})();


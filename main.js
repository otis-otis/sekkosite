(() => {
  const photos = [
    "9ceda807-1274-470d-bd91-f53fe50b2594", "IMG_0167", "IMG_0852", "IMG_1025",
    "IMG_1399", "IMG_1561", "IMG_1649", "IMG_1812", "IMG_2088", "IMG_2195",
    "IMG_2317", "IMG_2381", "IMG_2885", "IMG_2958", "IMG_3098", "IMG_3275",
    "IMG_3333", "IMG_5452", "IMG_5501", "IMG_6680", "IMG_6882", "IMG_8193",
    "IMG_9693", "IN"
  ];

  const folders = {
    Frankfurt: [...photos, "IMG_7279"],
    Hannover: [...photos, "IMG_7275"]
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- bouncing logo ---

  const hero = document.querySelector(".hero");
  const logo = document.querySelector(".logo");
  const roamMQ = window.matchMedia("(max-width: 760px)");

  const bounce = () => {
    const speed = 42; // px per second
    const angle = (Math.random() * 0.5 + 0.5) * (Math.PI / 4);
    let x = 0;
    let y = 0;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let maxX = 0;
    let maxY = 0;
    let gap = 0;
    let last = performance.now();
    let running = true;

    const measure = () => {
      // On mobile the logo roams the whole viewport (fixed); on desktop it stays in the hero.
      const roam = roamMQ.matches;
      logo.classList.toggle("roaming", roam);
      const boundsW = roam ? window.innerWidth : hero.clientWidth;
      const boundsH = roam ? window.innerHeight : hero.clientHeight;
      maxX = Math.max(0, boundsW - logo.offsetWidth);
      maxY = Math.max(0, boundsH - logo.offsetHeight);
      const shortest = Math.min(maxX, maxY);
      gap = Math.min(Math.max(40, shortest * 0.18), shortest * 0.35);
      x = Math.min(Math.max(x, 0), maxX);
      y = Math.min(Math.max(y, 0), maxY);
    };

    // Would this heading reach the next wall inside a corner's "keep-out" zone?
    const wouldHitCorner = (dx, dy) => {
      const tx = dx > 0 ? (maxX - x) / dx : dx < 0 ? -x / dx : Infinity;
      const ty = dy > 0 ? (maxY - y) / dy : dy < 0 ? -y / dy : Infinity;
      if (tx < ty) {
        const ny = y + dy * tx;
        return ny < gap || ny > maxY - gap;
      }
      const nx = x + dx * ty;
      return nx < gap || nx > maxX - gap;
    };

    // Nudge the angle just enough that the next wall hit lands away from a corner.
    const steer = () => {
      if (!wouldHitCorner(vx, vy)) return;
      const sx = Math.sign(vx) || 1;
      const sy = Math.sign(vy) || 1;
      const base = Math.atan2(Math.abs(vy), Math.abs(vx));
      for (let step = 1; step <= 40; step++) {
        for (const dir of [1, -1]) {
          const a = base + dir * step * 0.02;
          if (a < 0.35 || a > 1.22) continue; // keep a lively diagonal
          const dx = sx * Math.cos(a) * speed;
          const dy = sy * Math.sin(a) * speed;
          if (!wouldHitCorner(dx, dy)) {
            vx = dx;
            vy = dy;
            return;
          }
        }
      }
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (running) {
        x += vx * dt;
        y += vy * dt;

        let bounced = false;
        if (x <= 0 || x >= maxX) {
          x = x <= 0 ? 0 : maxX;
          vx = -vx;
          bounced = true;
        }
        if (y <= 0 || y >= maxY) {
          y = y <= 0 ? 0 : maxY;
          vy = -vy;
          bounced = true;
        }
        if (bounced) steer();

        logo.style.transform = `translate3d(${x}px, ${y}px, 0) scaleY(0.9)`;
      }

      requestAnimationFrame(tick);
    };

    x = hero.clientWidth * 0.04;
    y = hero.clientHeight * 0.02;
    measure();
    steer();

    window.addEventListener("resize", measure);
    roamMQ.addEventListener("change", measure);
    logo.complete ? measure() : logo.addEventListener("load", measure);

    // Pause off-screen only on desktop; on mobile it roams the whole page, so keep going.
    new IntersectionObserver(([entry]) => {
      running = roamMQ.matches || entry.isIntersecting;
      last = performance.now();
    }).observe(hero);

    requestAnimationFrame(tick);
  };

  if (!reduceMotion) bounce();

  // --- past dates ---

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll(".dates time").forEach((el) => {
    const [yy, mm, dd] = el.getAttribute("datetime").split("-").map(Number);
    if (new Date(yy, mm - 1, dd) < today) el.parentElement.classList.add("past");
  });

  // --- image trail (one continuous layer across both sections) ---

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!finePointer || reduceMotion) return;

  const zone = document.querySelector("main");
  if (!zone) return;

  const VISIBLE = 3;
  const SPACING = 110;
  const LIFETIME = 1100;

  const srcs = Object.entries(folders).flatMap(([folder, names]) =>
    names.map((name) => `${folder}/${name}.webp`)
  );

  const preload = (list) => list.forEach((src) => { new Image().src = src; });

  const layer = document.createElement("div");
  layer.className = "trail";
  layer.setAttribute("aria-hidden", "true");
  zone.prepend(layer);

  const pool = Array.from({ length: VISIBLE + 3 }, () => {
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    layer.appendChild(img);
    return img;
  });

  const order = srcs.slice().sort(() => Math.random() - 0.5);
  let next = 0;
  let slot = 0;
  let z = 1;
  let lastX = null;
  let lastY = null;
  const live = [];

  const hide = (img) => {
    img.classList.remove("is-on");
    clearTimeout(img._timer);
  };

  const clear = () => {
    live.splice(0).forEach(hide);
    lastX = lastY = null;
  };

  const drop = (px, py) => {
    const img = pool[slot];
    slot = (slot + 1) % pool.length;

    img.onload = () => {
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      img.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px)`;
      img.style.zIndex = z++;
      img.classList.add("is-on");
    };
    img.src = order[next];
    next = (next + 1) % order.length;
    if (img.complete) img.onload();

    const i = live.indexOf(img);
    if (i > -1) live.splice(i, 1);
    live.push(img);
    while (live.length > VISIBLE) hide(live.shift());

    clearTimeout(img._timer);
    img._timer = setTimeout(() => {
      hide(img);
      const j = live.indexOf(img);
      if (j > -1) live.splice(j, 1);
    }, LIFETIME);
  };

  zone.addEventListener("pointermove", (e) => {
    if (e.target.closest(".title, .list li")) {
      clear();
      return;
    }

    const box = zone.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;

    if (lastX === null || Math.hypot(px - lastX, py - lastY) > SPACING) {
      drop(px, py);
      lastX = px;
      lastY = py;
    }
  });

  zone.addEventListener("pointerleave", clear);

  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    preload(srcs);
    observer.disconnect();
  }, { rootMargin: "200px" }).observe(zone);
})();

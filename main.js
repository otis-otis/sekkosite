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
  };

  const fromHash = () => show((location.hash || "#home").slice(1));

  window.addEventListener("hashchange", fromHash);
  fromHash();
})();

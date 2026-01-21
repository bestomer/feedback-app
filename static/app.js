(function () {
  const GOOD = [
    { id: "got_my_taste", label: "Got my taste", icon: "tongue-icon.svg" },
    {
      id: "bought_something",
      label: "Bought\nSomething",
      icon: "shopping-bag-icon.svg",
    },
    {
      id: "found_cool",
      label: "Found\nSomething\nCool!",
      icon: "diamond-icon.svg",
    },
    { id: "pretty_slick", label: "Pretty\nSlick", icon: "eyes-icon.svg" },
    {
      id: "would_love_if",
      label: "Would love\nit if...",
      icon: "lightbulb-icon.svg",
    },
    { id: "no_ads", label: "No Ads,\nHell Yeah!", icon: "ad-icon.svg" },
    { id: "easy_explore", label: "Easy\nto Explore", icon: "abc-icon.svg" },
    {
      id: "something_else",
      label: "Something\nElse...",
      icon: "thought-bubble-icon.svg",
    },
  ];

  const TOUGH = [
    {
      id: "didnt_nail_taste",
      label: "Didn't nail\nmy taste",
      icon: "tongue-crossed-icon.svg",
    },
    {
      id: "not_sure_what_to_do",
      label: "Not Sure\nWhat To Do",
      icon: "not-sure-icon.svg",
    },
    {
      id: "wish_it_had",
      label: "I wish it\nhad...",
      icon: "wish-it-had-icon.svg",
    },
    {
      id: "needs_more_variety",
      label: "Needs More\nVariety",
      icon: "needs-variety-icon.svg",
    },
    {
      id: "way_too_slow",
      label: "Was Way\nToo Slow",
      icon: "too-slow-icon.svg",
    },
    {
      id: "tech_issue",
      label: "Had a Tech Issue..",
      icon: "tech-issue-icon.svg",
    },
    {
      id: "didnt_find_anything",
      label: "Didn't Find\nAnything\nFor Me",
      icon: "didnt-find-icon.svg",
    },
    {
      id: "something_else",
      label: "Something\nElse...",
      icon: "thought-bubble-tough-icon.svg",
    },
  ];

  const tileGrid = document.getElementById("tileGrid");
  const modeToggle = document.getElementById("modeToggle");
  const toggleKnob = document.getElementById("toggleKnob");
  const labelGood = document.getElementById("labelGood");
  const labelTough = document.getElementById("labelTough");
  const submitBtn = document.getElementById("submitBtn");
  const notesModal = document.getElementById("notesModal");
  const notesEl = document.getElementById("notes");
  const modalClose = document.getElementById("modalClose");
  const modalCancel = document.getElementById("modalCancel");
  const modalSave = document.getElementById("modalSave");

  if (!tileGrid) return;

  let mode = "good"; // "good" | "tough"
  let selected = new Set();

  function iconSvg(name) {
    // All icons are now SVGs in the icons directory
    return `<img src="/static/icons/${name}" alt="icon" />`;
  }

  function openModal() {
    notesModal.classList.add("show");
    notesEl.focus();
  }

  function closeModal() {
    notesModal.classList.remove("show");
  }

  function render() {
    // labels + toggle
    const isTough = mode === "tough";
    labelGood.classList.toggle("active", !isTough);
    labelTough.classList.toggle("active", isTough);
    toggleKnob.style.transform = isTough
      ? "translateX(24px)"
      : "translateX(0px)";
    modeToggle.setAttribute("aria-checked", isTough ? "true" : "false");

    // tiles
    const items = isTough ? TOUGH : GOOD;
    tileGrid.innerHTML = "";

    items.forEach((item) => {
      const tile = document.createElement("div");
      tile.className = `tile ${mode} ${selected.has(item.id) ? "selected" : ""}`;
      tile.dataset.id = item.id;

      const icon = document.createElement("div");
      icon.className = "icon";
      icon.innerHTML = iconSvg(item.icon);

      const label = document.createElement("div");
      label.className = "label";
      label.textContent = item.label;

      tile.appendChild(icon);
      tile.appendChild(label);

      tile.addEventListener("click", () => {
        if (item.id === "something_else") {
          // Special handling for "Something Else" - open modal
          if (selected.has(item.id)) {
            // Already selected, clicking again opens modal to edit
            openModal();
          } else {
            // Not selected, add it and open modal
            selected.add(item.id);
            openModal();
            render();
          }
        } else {
          // Normal tile toggle
          if (selected.has(item.id)) {
            selected.delete(item.id);
          } else {
            selected.add(item.id);
          }
          updateSubmitState();
          render();
        }
      });

      tileGrid.appendChild(tile);
    });

    updateSubmitState();
  }

  function updateSubmitState() {
    submitBtn.disabled = selected.size === 0;
  }

  function setMode(next) {
    mode = next;
    selected = new Set(); // reset selections on mode swap (matches "separate screen" feel)
    notesEl.value = "";
    render();
  }

  function toggleMode() {
    setMode(mode === "good" ? "tough" : "good");
  }

  // Modal handlers
  modalClose.addEventListener("click", () => {
    // Close without saving - remove selection if no notes
    if (!notesEl.value.trim()) {
      selected.delete("something_else");
      render();
    }
    closeModal();
  });

  modalCancel.addEventListener("click", () => {
    // Cancel - remove selection and clear notes
    selected.delete("something_else");
    notesEl.value = "";
    closeModal();
    render();
  });

  modalSave.addEventListener("click", () => {
    // Save - keep selection and close modal
    if (!selected.has("something_else")) {
      selected.add("something_else");
    }
    closeModal();
    render();
  });

  // Close modal when clicking overlay
  notesModal.addEventListener("click", (e) => {
    if (e.target === notesModal) {
      // Close without saving - remove selection if no notes
      if (!notesEl.value.trim()) {
        selected.delete("something_else");
        render();
      }
      closeModal();
    }
  });

  modeToggle.addEventListener("click", toggleMode);
  modeToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMode();
    }
  });

  labelGood.addEventListener("click", () => setMode("good"));
  labelTough.addEventListener("click", () => setMode("tough"));

  submitBtn.addEventListener("click", async () => {
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;

    const body = {
      mode,
      selections: Array.from(selected),
      notes: notesEl.value || "",
    };

    try {
      const res = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "submit failed");
      window.location.href = data.redirect || "/thanks";
    } catch (err) {
      // basic inline fallback
      alert("Submit failed. Please try again.");
      submitBtn.disabled = false;
    }
  });

  render();
})();

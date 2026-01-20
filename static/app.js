(function () {
  const GOOD = [
    { id: "got_my_taste", label: "Got my taste", icon: "GotMyTaste.png" },
    { id: "bought_something", label: "Bought\nSomething", icon: "bag" },
    { id: "found_cool", label: "Found\nSomething\nCool!", icon: "FoundSomethingCool.png" },
    { id: "pretty_slick", label: "Pretty\nSlick", icon: "prettyslick.png" },
    { id: "would_love_if", label: "Would love\nit if...", icon: "WouldLoveIf.png" },
    { id: "no_ads", label: "No Ads,\nHell Yeah!", icon: "NoAds.png" },
    { id: "easy_explore", label: "Easy\nto Explore", icon: "ABC.png" },
    { id: "something_else", label: "Something\nElse...", icon: "SOmethijngElse.png" },
  ];

  const TOUGH = [
    { id: "didnt_nail_taste", label: "Didn't nail\nmy taste", icon: "DidntNail.png" },
    { id: "not_sure_what_to_do", label: "Not Sure\nWhat To Do", icon: "NotSureWhatToDo.png" },
    { id: "wish_it_had", label: "I wish it\nhad...", icon: "IWishItHad.png" },
    { id: "needs_more_variety", label: "Needs More\nVariety", icon: "NeedsMore.png" },
    { id: "way_too_slow", label: "Was Way\nToo Slow", icon: "tooslow.png" },
    { id: "tech_issue", label: "Had a\nTech Issue..", icon: "HadTechIssue.png" },
    { id: "didnt_find_anything", label: "Didn't Find\nAnything\nFor Me", icon: "DidntFInd.png" },
    { id: "something_else", label: "Something\nElse...", icon: "SomethingElseBad.png" },
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
    // Check if it's a PNG file
    if (name.endsWith('.png')) {
      return `<img src="/static/icons/${name}" alt="icon" />`;
    }

    // Fallback to SVG for icons without PNG (like "bag")
    const common = `stroke-linecap="round" stroke-linejoin="round"`;
    switch (name) {
      case "bag":
        return `<svg viewBox="0 0 24 24"><path ${common} d="M7 8h10l1 13H6L7 8z"/><path ${common} d="M9 8a3 3 0 0 1 6 0"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24"><path ${common} d="M12 5v14"/><path ${common} d="M5 12h14"/></svg>`;
    }
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
    toggleKnob.style.transform = isTough ? "translateX(24px)" : "translateX(0px)";
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

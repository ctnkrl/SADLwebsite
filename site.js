"use strict";

(() => {
  const $ = (query) => document.querySelector(query);
  const $$ = (query) => Array.from(document.querySelectorAll(query));
  const original = new Map($$("[data-t]").map((node) => [node, node.innerHTML]));
  let language = "en";
  let epoch = 2;
  let toastTimer;

  const chinese = {
    "nav.insight": "问题", "nav.method": "方法", "nav.results": "实验", "nav.video": "视频", "nav.code": "代码",
    "scene.label": "表征空间", "scene.collapsed": "坍塌", "scene.expanded": "展开", "scene.note": "概念动画示意",
    "video.label": "SADL / 视频", "video.title": "用影像讲述 SADL。", "video.placeholder": "视频即将发布",
    "hero.description": "投影输出满足约束，还不够。<br>编码器也要保留不同输入之间的差异。",
    "hero.paper": "论文", "hero.code": "代码 · Coming soon",
    "hero.caption": "不同的输出几何，同一套供需约束。<span>真实训练得到的表征 · 单 seed 字形目标实验</span>",
    "hero.explore": "了解这项研究", "authors.corresponding": "† 通讯作者",
    "section.insight": "研究动机", "section.method": "方法", "section.results": "实验结果", "section.geometry": "输出几何", "section.code": "代码", "section.citation": "引用",
    "metric.collapse": "坍塌率", "metric.collapseNote": "LeWM · Flash + SIGReg · 10 个 seed",
    "metric.rank": "编码器有效秩", "metric.rankNote": "同组实验 · 第 1 个 epoch 的固定 probe",
    "metric.success": "控制成功率", "metric.successNote": "INTACT · Flash · 第 2 个 epoch · 3 个 seed",
    "label.baseline": "仅输出正则化",
    "insight.title": "输出变好了，<br>编码器却仍可能丢失差异。",
    "insight.p1": "在联合嵌入预测架构（JEPA）中，编码器把观测映射为 <em>H</em>，投影器再把 <em>H</em> 映射为 <em>Z</em>。预测与控制需要这些表征能够区分不同状态。",
    "insight.p2": "从初始化开始，不同输入共享的公共分量就占据了 <em>H</em> 的大部分能量。投影器中的批归一化会减去 batch 均值，因此投影之后的损失无法纠正 <em>H</em> 中跨样本相同的偏移。",
    "insight.p3": "投影器可以放大已有的差异，<br>却无法恢复编码器已经丢失的信息。",
    "insight.chartTitle": "多少能量真正承载了样本差异？",
    "insight.note": "Flash + SIGReg；跨任务及 10 个训练 seed 的固定 probe 中位数。灰色部分为公共分量的能量。见论文表 1。",
    "insight.figcaption": "原有任务损失和输出正则项保持不变。当供给不足时，SADL 直接对编码器增加约束。",
    "method.title": "保留差异，传递差异，<br>在供给不足时纠正编码器。",
    "method.description": "供需损失（Supply And Demand Loss）比较输出所需的差异与编码器能够保留和传递的差异。",
    "method.s1title": "读取需求", "method.s1": "读取输出对正则项的满足程度，以及输出已经具备的样本差异，合成为需求 <em>q</em>。",
    "method.s2title": "测量较弱的供给", "method.s2": "测量 <em>H</em> 中的样本差异，以及它们向 <em>Z</em> 的传递。取两者中较弱的一项，作为供给 <em>k</em>。",
    "method.s3title": "直接纠正编码器", "method.s3": "当供给低于需求时，单边惩罚直接作用于 <em>H</em>；当供给满足需求时，额外惩罚归零。",
    "method.property1": "不增加可训练参数", "method.property2": "不引入辅助网络", "method.property3": "保留原有架构与推理方式",
    "gate.label": "单边约束", "gate.title": "供需关系如何控制惩罚", "gate.description": "供给缺口越大，惩罚越大；供给达到需求后，惩罚归零。",
    "gate.note": "这里展示标量惩罚函数，不是训练实测数据。更新编码器时，需求端停止梯度。",
    "gate.demand": "需求 q", "gate.supply": "供给 k", "gate.penalty": "惩罚 S",
    "results.title": "改善表征，<br>让学习更稳定。", "results.control": "世界模型控制", "results.image": "图像表征学习",
    "results.controlTitle": "相同后端，相同更新预算。", "results.controlDescription": "PushT、Cube、Reacher、TwoRoom 四任务宏平均成功率。",
    "results.controlNote": "3 个训练 seed 的均值 ± 样本标准差。INTACT 使用免搜索的 Direct 控制；LeWM 使用 Pure-CEM。每组对照使用相同后端与评估协议。数据来自论文附录的匹配后端表。",
    "results.data": "查看准确数值与标准差", "results.tableCaption": "四任务宏平均成功率（%）",
    "results.imageTitle": "看学习过程，也看训练终点。", "results.imageDescription": "ImageNet-LT、Galaxy10、CIFAR-10 和 Imagenette。",
    "results.imageNote": "收益随数据集和训练阶段变化。Imagenette 在 epoch 20 提高 8.91 个百分点，epoch 800 提高 0.44 个百分点；CIFAR-10 的收益主要出现在早期。",
    "results.updatesTitle": "Imagenette · 达到基线最终精度所需更新数", "results.updatesNote": "减少约 23% 的更新 · 3 个训练 seed 的中位数",
    "results.ltTitle": "ImageNet-LT · 达到基线最终精度 90% 所需更新数", "results.ltNote": "减少约 10% 的更新 · 3 个训练 seed 的中位数",
    "geometry.title": "输出目标可以不同，<br>供需约束仍然适用。", "geometry.description": "SADL 保留选定的输出正则项。测试的八个目标使 INTACT 在一个 epoch 后达到 92.33–95.81% 的平均免搜索成功率，其中七个超过 95%。",
    "geometry.note": "颜色对应 PushT、Cube、Reacher 和 TwoRoom。最下面一行为单 seed 的字形目标实验，用于展示目标的灵活性。",
    "code.title": "代码即将发布。", "code.status": "Coming soon",
    "citation.title": "引用", "citation.description": "SADL: On the Demand-Supply Geometry of Representation Collapse",
    "footer.description": "供需损失 · Supply And Demand Loss<br>On the Demand-Supply Geometry of Representation Collapse", "footer.paper": "论文", "footer.citation": "引用"
  };

  const controls = [
    { model: "INTACT", backend: "MATH", values: { 1: [40.5, 8.5, 94.9, 0.4], 2: [70.0, 6.1, 96.3, 0.6] } },
    { model: "INTACT", backend: "Flash", values: { 1: [45.8, 2.6, 95.4, 0.2], 2: [66.1, 34.5, 96.3, 0.1] } },
    { model: "LeWM", backend: "MATH", values: { 1: [30.9, 0.8, 63.9, 1.2], 2: [46.0, 6.0, 70.4, 1.6] } },
    { model: "LeWM", backend: "Flash", values: { 1: [32.1, 4.9, 63.4, 5.7], 2: [31.4, 15.8, 69.1, 2.9] } }
  ];
  const citation = `@misc{sun2026sadl,
  title  = {{SADL}: On the Demand-Supply Geometry of Representation Collapse},
  author = {Junhan Sun and Yigui Feng and Mingzhe Liu and Haoyan Xu and
            Lei Ye and Ziqi Han and Hanru Bai and Yanzhao Zhang and
            Hao Zhao and Guofeng Zhang},
  year   = {2026},
  note   = {Preprint}
}`;

  function drawControls() {
    const chart = $("#control-chart");
    const table = $("#control-table");
    chart.replaceChildren();
    table.replaceChildren();
    for (const { model, backend, values } of controls) {
      const [baseline, baselineSD, sadl, sadlSD] = values[epoch];
      const group = document.createElement("div");
      group.className = "control-group";
      group.innerHTML = `<div class="control-group-label"><h4>${model} / ${backend}</h4><span>+${(sadl - baseline).toFixed(1)} pp</span></div>`;
      for (const [value, active] of [[baseline, false], [sadl, true]]) {
        const row = document.createElement("div");
        row.className = `bar-row${active ? " is-sadl" : ""}`;
        row.innerHTML = `<span>${active ? "+ SADL" : language === "zh" ? "基线" : "Baseline"}</span><div class="track"><b class="fill ${active ? "sadl-fill" : "baseline-fill"}" style="width:${value}%"></b></div><strong>${value.toFixed(1)}%</strong>`;
        group.append(row);
      }
      chart.append(group);
      const row = document.createElement("tr");
      [model, backend, `${baseline.toFixed(1)} ± ${baselineSD.toFixed(1)}`, `${sadl.toFixed(1)} ± ${sadlSD.toFixed(1)}`].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });
      table.append(row);
    }
    $$("[data-epoch]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.epoch) === epoch));
      button.textContent = language === "zh" ? `第 ${button.dataset.epoch} 个 epoch` : `Epoch ${button.dataset.epoch}`;
    });
  }

  function updateGate() {
    const demand = Number($("#demand").value);
    const supply = Number($("#supply").value);
    const penalty = Math.max(Math.log(demand + 1e-6) - Math.log(supply + 1e-6), 0) ** 2;
    $("#demand-value").textContent = demand.toFixed(2);
    $("#supply-value").textContent = supply.toFixed(2);
    $("#penalty").textContent = penalty.toFixed(3);
    $("#gate-state").textContent = supply >= demand
      ? language === "zh" ? "供给已满足需求" : "Supply sufficient"
      : language === "zh" ? "对编码器施加约束" : "Correction active";
    $("#gate-state").classList.toggle("sufficient", supply >= demand);
  }

  function setLanguage(next) {
    language = next;
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    original.forEach((english, node) => { node.innerHTML = next === "zh" ? chinese[node.dataset.t] || english : english; });
    $("#language").textContent = next === "zh" ? "EN" : "中文";
    $("#language").setAttribute("aria-label", next === "zh" ? "Switch to English" : "切换为中文");
    drawControls();
    updateGate();
    try { localStorage.setItem("sadl-language", next); } catch (_) { /* Storage may be disabled for local files. */ }
  }

  function activateTab(button, groupSelector, selector, onSelect) {
    const buttons = $$(groupSelector + " [role=tab]");
    buttons.forEach((item) => {
      const selected = item === button;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    onSelect(button.dataset[selector]);
  }

  function wireTabs(groupSelector, selector, onSelect) {
    const buttons = $$(groupSelector + " [role=tab]");
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => activateTab(button, groupSelector, selector, onSelect));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        if (event.key === "ArrowLeft") next = (index + buttons.length - 1) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        buttons[next].focus();
        activateTab(buttons[next], groupSelector, selector, onSelect);
      });
    });
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2600);
  }

  async function copy(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(area);
      area.select();
      const success = document.execCommand("copy");
      area.remove();
      if (!success) {
        showToast(language === "zh" ? "请选择文本后复制" : "Select the text to copy it");
        return;
      }
    }
    showToast(language === "zh" ? "已复制" : "Copied to clipboard");
  }

  const progress = document.createElement("div");
  progress.className = "page-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);
  let scrolling = false;
  function updateScroll() {
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
    $(".site-header").classList.toggle("is-scrolled", scrollY > 80);
    scrolling = false;
  }
  addEventListener("scroll", () => {
    if (!scrolling) { scrolling = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("motion-enabled");
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    $$(".section-heading, .insight-grid, .wide-figure, .method-steps, .gate-demo, .video-placeholder, .geometry-figure").forEach(element => {
      element.classList.add("reveal");
      reveal.observe(element);
    });
  }
  $("#language").addEventListener("click", () => setLanguage(language === "en" ? "zh" : "en"));
  $$("[data-epoch]").forEach((button) => button.addEventListener("click", () => { epoch = Number(button.dataset.epoch); drawControls(); }));
  ["demand", "supply"].forEach((id) => $("#" + id).addEventListener("input", updateGate));
  wireTabs(".tabs", "panel", (panel) => {
    ["control-panel", "image-panel"].forEach((id) => { $("#" + id).hidden = id !== panel; });
  });
  $("#citation-text").textContent = citation;
  $("#copy-citation").addEventListener("click", () => copy(citation));

  function closeMenu() {
    $("#navigation").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  }
  $("#menu-toggle").addEventListener("click", () => {
    const open = $("#navigation").classList.toggle("open");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
  });
  $$("#navigation a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  document.addEventListener("click", (event) => { if (!event.target.closest(".site-header")) closeMenu(); });

  const dialog = $("#figure-dialog");
  function setFigureZoom(zoomed) {
    dialog.classList.toggle("is-zoomed", zoomed);
    const button = $("#figure-size");
    const label = zoomed ? "Fit image" : "Zoom in";
    button.setAttribute("aria-pressed", String(zoomed));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = `<i data-lucide="${zoomed ? "minimize" : "zoom-in"}"></i>`;
    window.lucide?.createIcons();
  }
  $$("[data-zoom]").forEach((button) => button.addEventListener("click", () => {
    $("#dialog-image").src = button.dataset.zoom;
    $("#dialog-image").alt = button.querySelector("img").alt;
    $("#original-figure").href = button.dataset.zoom;
    $("#dialog-caption").textContent = button.dataset.caption;
    setFigureZoom(false);
    dialog.showModal();
    $(".figure-canvas").scrollTo(0, 0);
    document.body.classList.add("modal-open");
  }));
  $("#figure-size").addEventListener("click", () => setFigureZoom(!dialog.classList.contains("is-zoomed")));
  $("#close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$("#navigation a").forEach((link) => link.classList.toggle("active", link.hash === "#" + entry.target.id));
      });
    }, { rootMargin: "-15% 0px -65% 0px" });
    $$("#insight, #method, #results, #video, #code").forEach((section) => observer.observe(section));
  }
  window.lucide?.createIcons();
  try { if (localStorage.getItem("sadl-language") === "zh") language = "zh"; } catch (_) { /* Use English by default. */ }
  setLanguage(language);
})();

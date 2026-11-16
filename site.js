"use strict";

(() => {
  const $ = (query) => document.querySelector(query);
  const $$ = (query) => Array.from(document.querySelectorAll(query));
  const original = new Map($$("[data-t]").map((node) => [node, node.innerHTML]));
  let language = "en";
  let epoch = 2;
  let toastTimer;

  const chinese = {
    "nav.insight": "问题", "nav.method": "方法", "nav.results": "控制", "nav.images": "图像", "nav.video": "视频", "nav.code": "代码",
    "scene.label": "表征空间", "scene.collapsed": "坍塌", "scene.expanded": "展开", "scene.note": "概念动画示意",
    "video.label": "SADL / 视频", "video.title": "SADL 视频", "video.placeholder": "视频即将发布",
    "hero.description": "让编码器保留<br>不同输入之间的差异。",
    "hero.paper": "论文", "hero.code": "代码 · Coming soon",
    "hero.caption": "不同的输出几何，同一套供需约束。<span>真实训练得到的表征 · 单 seed 字形目标实验</span>",
    "hero.explore": "了解这项研究", "authors.corresponding": "† 通讯作者",
    "summary.title": "SADL 是什么？",
    "summary.p1": "供需损失（Supply And Demand Loss，SADL）是用于联合嵌入预测架构（JEPA）的训练损失。它将投影器输出所需要的表征差异，与编码器能够保留并传递的差异进行比较，在供给不足时直接对编码器增加约束。",
    "summary.p2": "我们在 LeWM、INTACT 的世界模型控制任务，以及四个图像数据集的表征学习任务上验证了 SADL。",
    "section.insight": "研究动机", "section.method": "方法", "section.results": "世界模型控制", "section.geometry": "输出几何", "section.images": "图像表征学习", "section.analysis": "补充分析", "section.code": "代码", "section.citation": "引用",
    "metric.collapse": "LeWM 坍塌率", "metric.rank": "LeWM 编码器有效秩", "metric.success": "INTACT 控制成功率",
    "label.baseline": "仅输出正则化", "label.model": "模型", "label.backend": "编码器后端",
    "insight.title": "只约束输出，<br>可能漏掉编码器内部的坍塌。",
    "insight.p1": "在 JEPA 中，编码器把观测映射为 <em>H</em>，投影器再把 <em>H</em> 映射为 <em>Z</em>。预测与控制需要这些表征能够区分不同状态。",
    "insight.p2": "在我们研究的模型中，不同输入共享的公共分量从初始化开始就主导了 <em>H</em>。训练时，投影器中的批归一化会去除所有样本共有的偏移，因此作用于 <em>Z</em> 的损失无法抑制 <em>H</em> 中的这一公共分量。",
    "insight.variation": "剩余的样本差异主要依靠任务梯度增长，且集中在少数方向上。投影器可以放大已有的差异，却无法恢复编码器已经丢失的信息。",
    "insight.p3": "SADL 直接作用于 <em>H</em>：抑制公共分量的主导作用，同时促进较弱差异方向的增长。",
    "insight.chartTitle": "多少能量真正承载了样本差异？",
    "insight.note": "Flash + SIGReg；跨任务及 10 个训练 seed 的固定 probe 中位数。灰色部分为公共分量的能量。见论文表 1。",
    "insight.figcaption": "保留原有任务损失和输出正则项。SADL 直接在编码器表征上增加供给正则项。",
    "method.title": "比较需求与供给，<br>在需要时纠正编码器。",
    "method.description": "需求从投影器输出中读取；供给衡量编码器保留了多少样本差异，以及这些差异能否传递到输出。",
    "method.s1title": "读取需求", "method.s1": "读取 <em>Z</em> 对正则项的满足程度，以及它包含的样本差异，合成为需求 <em>q</em>。需求随当前输出自适应调整。",
    "method.s2title": "测量较弱的供给", "method.s2": "测量 <em>H</em> 中的样本差异，以及这些差异向 <em>Z</em> 的传递。取较弱的一项作为供给 <em>k</em>。",
    "method.s3title": "直接纠正编码器", "method.s3": "当供给低于需求时，单边惩罚直接作用于 <em>H</em>；当供给满足需求时，额外惩罚归零。",
    "method.objectiveTitle": "在训练损失中增加一项",
    "method.objectiveNote": "任务损失和选定的输出正则项仍按原方式训练。在新增项中，sg 阻止梯度经由 <em>Z</em> 反传，使供给约束直接作用于 <em>H</em>。",
    "method.adaptiveTitle": "自适应需求省去单独搜索阈值。",
    "method.adaptiveNote": "合适的常数需求也能取得相近表现，但需要针对每个设置重新搜索。在五组控制和图像实验对比中，自适应需求无需单独搜索阈值，就能取得接近最佳已调常数的表现。",
    "method.adaptiveSource": "论文 · 表 3", "method.details": "需求、供给与单边门控",
    "method.demandFormula": "从输出读取需求", "method.supplyFormula": "测量编码器供给",
    "method.demandDefinition": "<em>q</em><sub>reg</sub> 读取输出对正则项的满足程度；<em>q</em><sub>exc</sub> 读取 <em>Z</em> 中的样本差异。",
    "method.supplyDefinition": "<em>k</em><sub>exc</sub> 衡量 <em>H</em> 中样本差异的能量占比和方向分布；<em>k</em><sub>tr</sub> 通过正则化典型相关衡量 <em>H</em> 与 <em>Z</em> 的线性关联。",
    "method.property1": "不增加可训练参数", "method.property2": "不引入辅助网络", "method.property3": "保留原有架构与推理方式",
    "gate.label": "单边约束", "gate.title": "供需关系如何控制惩罚", "gate.description": "供给缺口越大，惩罚越大；供给达到需求后，惩罚归零。",
    "gate.note": "这里展示标量惩罚函数，不是训练实测数据。更新编码器时，需求端停止梯度。",
    "gate.demand": "需求 q", "gate.supply": "供给 k", "gate.penalty": "惩罚 S",
    "results.title": "提高控制成功率，<br>减少训练更新。",
    "results.description": "我们在 PushT、Cube、Reacher 和 TwoRoom 上评估 LeWM 与 INTACT，报告四个任务的平均控制成功率。",
    "results.controlTitle": "训练一个和两个 epoch 后的控制成功率",
    "results.controlTakeaway": "在两种模型、两种后端下，SADL 训练一个 epoch 的成功率均超过基线训练两个 epoch 的结果。第 2 个 epoch，INTACT + SADL 在 MATH 和 Flash 下的平均成功率均达到 96.3%。",
    "results.controlNote": "采用 SIGReg，报告 3 个训练 seed 的均值 ± 样本标准差。INTACT 使用免搜索的 Direct 控制；LeWM 使用 Pure-CEM。每组对照的后端、更新预算和评估方式均一致。基线保留任务损失和输出正则项，不增加 SADL。",
    "results.controlSource": "论文 · 表 40",
    "results.data": "准确数值与实验设置", "results.tableCaption": "四任务宏平均成功率（%）",
    "analysis.title": "供给约束如何影响训练", "analysis.description": "通过编码器正则化对照，分析权重敏感性和两项供给的作用。",
    "ablation.details": "直接编码器正则化与权重敏感性",
    "ablation.title": "为什么只在供给不足时施加约束？",
    "ablation.description": "直接约束 <em>H</em>，在权重合适时也能取得好结果。区别在于结果有多依赖权重。常开编码率对照使用与 SADL 完全相同的激发函数，但采用固定权重，不使用需求和单边门控。",
    "ablation.caption": "INTACT + SIGReg · 第 1 个 epoch · 每种方法测试 5 个权重，每个权重 3 个训练 seed",
    "ablation.method": "作用于 H 的约束", "ablation.range": "权重范围", "ablation.best": "最佳平均成功率（%）", "ablation.worst": "最差 seed 成功率（%）",
    "ablation.alwaysOn": "常开编码率", "ablation.vcreg": "直接作用于 H 的 VCReg",
    "ablation.note": "最佳均值取自表现最好的已测权重；最差 seed 是五个权重下所有 seed 的最低成功率。SADL 的权重跨越 100 倍，15 次运行的表征和控制均正常。",
    "ablation.source": "论文 · 表 2",
    "ablation.branch": "在 INTACT 默认控制权重下，编码器激发是瓶颈，因此仅激发版本与完整 SADL 一致。当权重增大时，传递项可能成为瓶颈；取较弱供给，使 SADL 能够随之调整。",
    "results.imageTitle": "用更少更新，<br>达到目标精度。", "results.imageDescription": "在 ImageNet-LT、Galaxy10、CIFAR-10 和 Imagenette 上进行配对训练，检验 SADL 在控制任务之外的表现。",
    "images.attentionTitle": "图像实验中的注意力示例", "images.attentionNote": "论文选取的输入与注意力图对照，依次为输入、VISReg 基线和 SADL + VISReg。见论文图 3。",
    "results.imageTakeaway": "SADL 在四个数据集上都改善了早期学习。Imagenette 在 epoch 20 提高 8.91 个百分点，到 epoch 800 时差距缩小至 0.44 个百分点。CIFAR-10 的主要收益也在早期，最终 epoch 的变化很小。",
    "results.imageNote": "上排为分类精度，下排为 SADL 相对配对基线的精度差，单位为百分点。依次报告 3、3、10、7 个 seed 的均值 ± 标准差。CIFAR-10 使用独立留出的 ridge 读出，其余数据集使用在线分类头。见论文图 7。",
    "results.updatesTitle": "Imagenette · 达到基线最终精度所需更新数", "results.updatesNote": "减少约 23% 的更新 · 3 个训练 seed 的中位数",
    "results.ltTitle": "ImageNet-LT · 达到基线最终精度 90% 所需更新数", "results.ltNote": "减少约 10% 的更新 · 3 个训练 seed 的中位数",
    "results.targetNote": "达到目标精度所需的更新数，来自另一组 3 个 seed 的对照实验。每个目标均以该组基线的最终精度定义。",
    "geometry.title": "同一供给约束，<br>适配不同输出正则项。", "geometry.description": "SADL 保留选定的输出正则项，不规定唯一的目标形状。搭配八种正则项，INTACT 在一个 epoch 后的平均免搜索成功率为 92.33–95.81%，其中七种超过 95%。",
    "geometry.note": "真实训练得到的表征。上两排为八种正则项下的三维 PCA 视图，成功率是 3 个 seed 的四任务均值；下排是独立训练的二维字形目标，成功率来自单个 seed。颜色区分四个控制任务。见论文图 5、表 5。",
    "geometry.conclusion": "输出几何可以改变，供给约束保持相同。字形目标实验进一步展示了八种正则项之外的灵活性。",
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
        const section = entry.target.id === "geometry" ? "results" : entry.target.id;
        $$("#navigation a").forEach((link) => link.classList.toggle("active", link.hash === "#" + section));
      });
    }, { rootMargin: "-15% 0px -65% 0px" });
    $$("#insight, #method, #results, #geometry, #images, #video, #code").forEach((section) => observer.observe(section));
  }
  window.lucide?.createIcons();
  try { if (localStorage.getItem("sadl-language") === "zh") language = "zh"; } catch (_) { /* Use English by default. */ }
  setLanguage(language);
})();

"use strict";

(() => {
  const $ = (query) => document.querySelector(query);
  const $$ = (query) => Array.from(document.querySelectorAll(query));
  const original = new Map($$("[data-t]").map((node) => [node, node.innerHTML]));
  let language = "en";
  let epoch = 2;
  let toastTimer;
  let geometryFamily = "regularizer";
  let geometrySelection = "sigreg";
  let geometryPlaying = false;
  let geometryTimer;
  const energyValues = { H: [3.3, 98.6], Z: [35.5, 99.0] };

  const chinese = {
    'geometry.paperView': '原图',
    'geometry.pcaNote': '留出观测的端点表征 · 训练 seed 0 · 4,096 个观测 · 四任务联合拟合 PCA。左侧控制成功率为三个训练 seed 的平均。',
    "curves.all": "全部四个数据集",
    "nav.insight": "问题", "nav.method": "方法", "nav.results": "控制", "nav.geometry": "几何", "nav.images": "图像", "nav.video": "视频", "nav.code": "代码",
    "explorer.regularizers": "正则项", "explorer.glyphs": "字形目标", "explorer.setting": "输出约束", "explorer.success": "第 1 个 epoch 的控制成功率", "explorer.fullFigure": "全部输出几何",
    "attention.dataset": "数据集", "attention.sample": "样本", "attention.input": "输入", "energy.readout": "样本差异能量占比：",
    "results.modelFilter": "模型", "results.backendFilter": "编码器后端", "results.allModels": "两种模型", "results.allBackends": "两种后端",
    "scene.label": "表征空间", "scene.collapsed": "坍塌", "scene.expanded": "展开", "scene.note": "概念动画示意",
    "video.label": "SADL / 视频", "video.title": "SADL 视频", "video.placeholder": "视频即将发布",
    "hero.description": "自适应、单边的供给正则项，<br>用于稳定的表征学习。",
    "hero.paper": "论文", "hero.code": "代码 · Coming soon",
    "hero.caption": "不同的输出几何，同一套供需约束。<span>真实训练得到的表征 · 单 seed 字形目标实验</span>",
    "hero.explore": "了解这项研究", "authors.corresponding": "† 通讯作者",
    "summary.title": "摘要",
    "summary.p1": "我们提出供需损失（Supply And Demand Loss，SADL）。它保留原有训练目标，并在需要时直接约束编码器。SADL 将投影输出所需要的表征差异，与编码器能够保留并传递给投影器的差异进行比较；只有当供给不足以满足需求时，才对编码器施加额外约束。",
    "summary.p2": "该方法可以适配不同的需求正则项，无需引入辅助网络、增加可训练参数或修改模型架构。我们在 LeWorldModel（LeWM）和 INTACT 的单任务及四任务联合训练中评估 SADL，并考察其在图像分类中的泛化表现。",
    "section.insight": "研究动机", "section.method": "方法", "section.results": "世界模型控制", "section.geometry": "输出几何", "section.images": "图像表征学习", "section.code": "代码", "section.citation": "引用",
    "metric.collapse": "LeWM 坍塌率", "metric.rank": "LeWM 编码器有效秩", "metric.success": "INTACT 控制成功率",
    "label.baseline": "仅输出正则化", "label.model": "模型", "label.backend": "编码器后端",
    "insight.title": "即使投影输出受到良好约束，<br>也不一定能防止表征坍塌。",
    "insight.p1": "联合嵌入预测架构（JEPA）通过预测潜在表征，而非逐像素重建，从图像和视频中学习。编码器将输入映射为表征 <em>H</em>，投影器再将其映射为端点 <em>Z</em>；现有需求正则项通常约束 <em>Z</em> 的几何结构。",
    "insight.p2": "在 LeWM 和 INTACT 中，从初始化开始，编码器表征 <em>H</em> 就被所有输入共享的公共分量主导。投影器中的批归一化会减去 batch 均值。在训练模式下，向 <em>H</em> 的每一行加上相同向量不会改变 <em>Z</em>，因此需求正则项以及任何基于 <em>Z</em> 计算的损失都无法作用于 <em>H</em> 的公共分量。",
    "insight.variation": "剩余的差异主要依靠任务梯度增长，且集中在少数方向上。投影器可以重新混合和放大已有差异，以满足需求正则项的要求，但无法恢复 <em>H</em> 已经丢失的信息。",
    "insight.p3": "在公共分量方向上，SADL 提供其他损失所缺少的非零梯度；在其余方向上，它使较弱的差异方向更快增长。",
    "insight.chartTitle": "样本差异的能量占比",
    "insight.note": "Flash + SIGReg；跨任务及 10 个训练 seed 的固定 probe 中位数。灰色部分为公共分量的能量。",
    "insight.figcaption": "保留原有任务损失和输出正则项。SADL 直接在编码器表征上增加供给正则项。",
    "method.title": "需求容量与供给容量",
    "method.description": "SADL 读取停止梯度的需求容量 <em>q</em>，测量 <em>H</em> 的供给容量 <em>k</em>，仅在 <em>k</em> &lt; <em>q</em> 时通过供给正则项约束 <em>H</em>。",
    "method.s1title": "需求容量", "method.s1": "需求容量结合端点停止梯度后的两项读数：<em>q</em><sub>reg</sub> 随需求正则项的满足程度提高而增大，<em>q</em><sub>exc</sub> 衡量端点当前的样本差异。需求容量取两者的几何平均。",
    "method.s2title": "供给容量", "method.s2": "SADL 将 <em>H</em> 中的样本差异（激发）及其向 <em>Z</em> 的传递中较弱的一项作为供给容量 <em>k</em>。因此，<em>k</em> ≥ <em>q</em> 要求两项均达到 <em>q</em>，使较弱的供给也能满足需求。",
    "method.s3title": "单边供给正则项", "method.s3": "我们通过单边供给正则项惩罚供给容量不足。它同时涵盖激发与传递，并在供给容量满足需求容量时归零。",
    "method.objectiveTitle": "训练目标",
    "method.objectiveNote": "任务损失和选定的输出正则项仍按原方式训练。在新增项中，sg 阻止梯度经由 <em>Z</em> 反传，使供给约束直接作用于 <em>H</em>。",
    "method.adaptiveTitle": "自适应需求",
    "method.adaptiveNote": "常数需求需要针对每个设置重新调节，而自适应 <em>q</em> 无需调节。在五组控制和图像实验设置中，自适应 <em>q</em> 与最佳常数的表现差异均处于 seed 波动范围内。",
    "method.details": "需求与供给的定义",
    "method.demandFormula": "从输出读取需求", "method.supplyFormula": "测量编码器供给",
    "method.demandDefinition": "<em>q</em><sub>reg</sub> 读取输出对正则项的满足程度；<em>q</em><sub>exc</sub> 读取 <em>Z</em> 中的样本差异。",
    "method.supplyDefinition": "<em>k</em><sub>exc</sub> 衡量 <em>H</em> 中样本差异的能量占比和方向分布；<em>k</em><sub>tr</sub> 通过正则化典型相关衡量 <em>H</em> 与 <em>Z</em> 的线性关联。",
    "method.property1": "不增加可训练参数", "method.property2": "不引入辅助网络", "method.property3": "保留原有架构与推理方式",
    "gate.label": "单边约束", "gate.title": "单边惩罚", "gate.description": "供给缺口越大，惩罚越大；供给达到需求后，惩罚归零。",
    "gate.note": "这里展示标量惩罚函数，不是训练实测数据。更新编码器时，需求端停止梯度。",
    "gate.demand": "需求 q", "gate.supply": "供给 k", "gate.penalty": "惩罚 S",
    "results.title": "收敛速度与表征质量",
    "results.description": "我们在 PushT、Cube、Reacher 和 TwoRoom 上评估 LeWM 与 INTACT，报告四个任务的平均控制成功率。",
    "results.controlTitle": "训练一个和两个 epoch 后的控制成功率",
    "results.controlTakeaway": "在两种模型、两种后端下，SADL 训练一个 epoch 的成功率均超过基线训练两个 epoch 的结果。第 2 个 epoch，INTACT + SADL 在 MATH 和 Flash 下的平均成功率均达到 96.3%。",
    "results.controlNote": "采用 SIGReg，报告 3 个训练 seed 的均值 ± 样本标准差。INTACT 使用免搜索的 Direct 控制；LeWM 使用 Pure-CEM。每组对照的后端、更新预算和评估方式均一致。基线保留任务损失和输出正则项，不增加 SADL。",
    "results.data": "准确数值与实验设置", "results.tableCaption": "四任务宏平均成功率（%）",
    "results.imageTitle": "图像任务泛化", "results.imageDescription": "除控制任务外，我们还在 ImageNet-LT、Galaxy10、CIFAR-10 和 Imagenette 上，以相同预算和需求正则项评估 SADL。",
    "images.attentionTitle": "图像实验中的注意力示例", "images.attentionNote": "输入图像，以及 VISReg 与 SADL + VISReg 的注意力图对照。",
    "results.imageTakeaway": "SADL 在四个数据集上都改善了早期学习。Imagenette 在 epoch 20 提高 8.91 个百分点，到 epoch 800 时差距缩小至 0.44 个百分点。CIFAR-10 的主要收益也在早期，最终 epoch 的变化很小。",
    "results.imageNote": "上排为分类精度，下排为 SADL 相对配对基线的精度差，单位为百分点。依次报告 3、3、10、7 个 seed 的均值 ± 标准差。CIFAR-10 使用独立留出的 ridge 读出，其余数据集使用在线分类头。",
    "results.updatesTitle": "Imagenette · 达到基线最终精度所需更新数", "results.updatesNote": "减少约 23% 的更新 · 3 个训练 seed 的中位数",
    "results.ltTitle": "ImageNet-LT · 达到基线最终精度 90% 所需更新数", "results.ltNote": "减少约 10% 的更新 · 3 个训练 seed 的中位数",
    "results.targetNote": "达到目标精度所需的更新数，来自另一组 3 个 seed 的对照实验。每个目标均以该组基线的最终精度定义。",
    "geometry.title": "跨需求正则项的适配", "geometry.description": "我们使用八种需求正则项测试 SADL，而非假设单一高斯目标。训练一个 epoch 后，八种设置下 INTACT 的免搜索 Direct 成功率均超过 92%，其中七种达到 95.03–95.81%。",
    "geometry.note": "真实训练得到的表征。八种正则项展示三维 PCA 视图，成功率是 3 个 seed 的四任务均值；独立训练的二维字形目标，成功率来自单个 seed。颜色区分四个控制任务。",
    "geometry.conclusion": "Student-t、GMM-Ring、Sphere shell 和 VIC moments 涵盖非高斯或未指定密度的约束。独立训练的字形目标进一步展示了对不同端点几何的适配。",
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
  const geometryFigures = [
    { id: "sigreg", label: "SIGReg", success: 95.58 },
    { id: "visreg", label: "VISReg", success: 95.08 },
    { id: "qqworld", label: "QQWorld", success: 95.81 },
    { id: "energy-gaussian", label: "Energy-Gaussian", success: 95.33 },
    { id: "vic-moments", label: "VIC moments", success: 95.03 },
    { id: "student-t5", label: "Student-t5", success: 92.33 },
    { id: "gmm-ring", label: "GMM-Ring", success: 95.11 },
    { id: "sphere-shell", label: "Sphere shell", success: 95.44 },
    { id: "glyph-j", label: "J", success: 94.00 },
    { id: "glyph-e", label: "E", success: 92.75 },
    { id: "glyph-p", label: "P", success: 93.25 },
    { id: "glyph-a", label: "A", success: 94.75 }
  ];

  function drawGeometry() {
    const figures = geometryFigures.filter(item => item.id.startsWith("glyph-") === (geometryFamily === "glyph"));
    const index = Math.max(0, figures.findIndex(item => item.id === geometrySelection));
    const selected = figures[index];
    geometrySelection = selected.id;
    const select = $("#geometry-select");
    select.replaceChildren(...figures.map(item => new Option(item.label, item.id)));
    select.value = selected.id;
    $$("[data-geometry-family]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.geometryFamily === geometryFamily)));
    $("#geometry-position").textContent = `${index + 1} / ${figures.length}`;
    $("#geometry-success").innerHTML = `${selected.success.toFixed(2)}<span>%</span>`;
    $("#geometry-cohort").textContent = geometryFamily === "glyph"
      ? language === "zh" ? "INTACT · 单个训练 seed · 四任务平均" : "INTACT · single training seed · four-task mean"
      : language === "zh" ? "INTACT · 3 个训练 seed · 四任务平均" : "INTACT · 3 training seeds · four-task mean";
    const path = `assets/figures/geometry-${selected.id}.webp`;
    const image = $("#geometry-panel-image");
    if (image.getAttribute("src") !== path) {
      image.src = path;
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) image.animate([{ opacity: .55 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    }
    image.alt = `${selected.label} · INTACT epoch 1`;
    $("#geometry-panel").dataset.zoom = path;
    $("#geometry-panel").dataset.caption = `${selected.label} · ${selected.success.toFixed(2)}%`;
    window.dispatchEvent(new CustomEvent('sadl-geometry-change', { detail: { id: selected.id, label: selected.label, language } }));
    for (const [id, en, zh] of [["geometry-previous", "Previous setting", "上一项"], ["geometry-next", "Next setting", "下一项"]]) {
      $("#" + id).title = language === "zh" ? zh : en;
      $("#" + id).setAttribute("aria-label", language === "zh" ? zh : en);
    }
  }

  function stepGeometry(direction) {
    const figures = geometryFigures.filter(item => item.id.startsWith("glyph-") === (geometryFamily === "glyph"));
    const current = figures.findIndex(item => item.id === geometrySelection);
    geometrySelection = figures[(current + direction + figures.length) % figures.length].id;
    drawGeometry();
  }

  function syncGeometryPlayback() {
    clearTimeout(geometryTimer);
    const button = $("#geometry-play");
    const label = geometryPlaying
      ? language === "zh" ? "暂停轮播" : "Pause figure sequence"
      : language === "zh" ? "播放图形序列" : "Play figure sequence";
    button.setAttribute("aria-pressed", String(geometryPlaying));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = `<i data-lucide="${geometryPlaying ? "pause" : "play"}"></i>`;
    window.lucide?.createIcons();
    if (geometryPlaying && !document.hidden) geometryTimer = setTimeout(() => {
      stepGeometry(1);
      syncGeometryPlayback();
    }, 2800);
  }

  function stopGeometryPlayback() {
    geometryPlaying = false;
    syncGeometryPlayback();
  }

  function drawImageCurve() {
    const select = $("#curve-dataset");
    const combined = select.value === "all";
    const path = combined ? "assets/figures/image-curves.webp" : `assets/figures/image-curve-${select.value}.webp`;
    const image = $("#curve-image");
    image.src = path;
    image.width = combined ? 3000 : 750;
    image.height = combined ? 1139 : 1074;
    image.alt = `${select.selectedOptions[0].textContent} · Accuracy and paired gain`;
    $("#curve-zoom").dataset.zoom = path;
    $("#curve-zoom").dataset.caption = image.alt;
    $(".curve-figure").classList.toggle("is-single-dataset", !combined);
  }

  function drawAttention() {
    const dataset = $("#attention-dataset").value;
    const sample = $("#attention-sample").value;
    for (const kind of ["input", "baseline", "sadl"]) {
      const image = $("#attention-" + kind + "-image");
      image.src = `assets/figures/attention-${dataset}-${sample}-${kind}.webp`;
      const name = dataset === "imagenet" ? "ImageNet-LT" : "Galaxy10";
      image.alt = `${name} · sample ${sample} · ${kind === "input" ? "Input" : kind === "baseline" ? "VISReg" : "SADL + VISReg"}`;
    }
    updateAttentionSplit();
  }

  function drawEnergy(level = document.querySelector("[data-energy-level][aria-pressed='true']")?.dataset.energyLevel || "H") {
    const [baseline, sadl] = energyValues[level];
    $("#energy-level").textContent = level;
    $("#energy-baseline").style.width = `${baseline}%`;
    $("#energy-sadl").style.width = `${sadl}%`;
    $("#energy-baseline-value").textContent = `${baseline.toFixed(1)}%`;
    $("#energy-sadl-value").textContent = `${sadl.toFixed(1)}%`;
    const delta = sadl - baseline;
    $("#energy-delta").textContent = language === "zh" ? `SADL 提高 ${delta.toFixed(1)} 个百分点` : `+${delta.toFixed(1)} pp with SADL`;
    $$('[data-energy-level]').forEach(button => button.setAttribute("aria-pressed", String(button.dataset.energyLevel === level)));
  }

  function updateAttentionSplit() {
    const split = Number($("#attention-split").value);
    $("#attention-reveal").style.setProperty("--split", `${split}%`);
    $("#attention-split").setAttribute("aria-valuetext", `VISReg ${split}%, SADL + VISReg ${100 - split}%`);
  }
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
      if ($("#control-model").value !== "all" && $("#control-model").value !== model) continue;
      if ($("#control-backend").value !== "all" && $("#control-backend").value !== backend) continue;
      const [baseline, baselineSD, sadl, sadlSD] = values[epoch];
      const group = document.createElement("div");
      group.className = "control-group";
      group.innerHTML = `<div class="control-group-label"><h4>${model} / ${backend}</h4><span>+${(sadl - baseline).toFixed(1)} pp</span></div>`;
      for (const [value, sd, active] of [[baseline, baselineSD, false], [sadl, sadlSD, true]]) {
        const row = document.createElement("div");
        row.className = `bar-row${active ? " is-sadl" : ""}`;
        const label = active ? "+ SADL" : language === "zh" ? "基线" : "Baseline";
        const tooltipId = `result-${model}-${backend}-${active ? "sadl" : "baseline"}`;
        const low = Math.max(0, value - sd);
        const high = Math.min(100, value + sd);
        row.tabIndex = 0;
        row.setAttribute("aria-describedby", tooltipId);
        row.innerHTML = `<span>${label}</span><div class="track"><b class="fill ${active ? "sadl-fill" : "baseline-fill"}" style="width:${value}%"></b><span class="error-range" style="left:${low}%;width:${high - low}%" aria-hidden="true"></span></div><strong>${value.toFixed(1)}%</strong><span class="result-tooltip" role="tooltip" id="${tooltipId}">${model} · ${backend} · ${label}<br>${value.toFixed(1)} ± ${sd.toFixed(1)}% · ${language === "zh" ? "3 个训练 seed" : "3 training seeds"}</span>`;
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
    const resetLabel = language === 'zh' ? '重置供给与需求' : 'Reset demand and supply';
    $("#gate-reset").title = resetLabel;
    $("#gate-reset").setAttribute('aria-label', resetLabel);
    drawGateCurve();
  }

  function drawGateCurve() {
    const canvas = $("#gate-curve");
    const width = canvas.clientWidth;
    if (!width) return;
    const height = canvas.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    const q = Number($("#demand").value);
    const k = Number($("#supply").value);
    const penalty = value => Math.max(Math.log(q + 1e-6) - Math.log(value + 1e-6), 0) ** 2;
    const maxY = Math.max(1, Math.ceil(penalty(0.05)));
    const box = { left: 42, top: 32, right: width - 20, bottom: height - 45 };
    const x = value => box.left + (value - 0.05) / 0.95 * (box.right - box.left);
    const y = value => box.bottom - value / maxY * (box.bottom - box.top);
    ctx.font = '14px "Times New Roman", "Microsoft YaHei", serif';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const value = maxY * i / 4;
      ctx.strokeStyle = '#dfe5e2';
      ctx.beginPath(); ctx.moveTo(box.left, y(value)); ctx.lineTo(box.right, y(value)); ctx.stroke();
      ctx.fillStyle = '#687474'; ctx.textAlign = 'right';
      ctx.fillText(Number(value.toFixed(2)).toString(), box.left - 9, y(value) + 4);
    }
    ctx.textAlign = 'center';
    for (const value of [0.05, 0.25, 0.5, 0.75, 1]) ctx.fillText(value.toString(), x(value), box.bottom + 23);
    ctx.textAlign = 'left'; ctx.fillText('S', box.left, 18);
    ctx.textAlign = 'right'; ctx.fillText(language === 'zh' ? '供给 k' : 'Supply k', box.right, height - 3);
    ctx.setLineDash([4, 5]); ctx.strokeStyle = '#b54b69';
    ctx.beginPath(); ctx.moveTo(x(q), box.top); ctx.lineTo(x(q), box.bottom); ctx.stroke();
    ctx.setLineDash([]); ctx.textAlign = 'center'; ctx.fillStyle = '#b54b69';
    ctx.fillText(`q = ${q.toFixed(2)}`, Math.max(box.left + 28, Math.min(box.right - 28, x(q))), 18);
    ctx.beginPath(); ctx.moveTo(x(0.05), box.bottom);
    for (let i = 0; i <= 200; i++) { const value = 0.05 + i / 200 * 0.95; ctx.lineTo(x(value), y(penalty(value))); }
    ctx.lineTo(x(1), box.bottom); ctx.closePath(); ctx.fillStyle = '#087f6f12'; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const value = 0.05 + i / 200 * 0.95; if (i === 0) ctx.moveTo(x(value), y(penalty(value))); else ctx.lineTo(x(value), y(penalty(value))); }
    ctx.strokeStyle = '#087f6f'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x(k), y(penalty(k)), 6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#087f6f'; ctx.lineWidth = 2; ctx.stroke();
    canvas.setAttribute('aria-label', language === 'zh' ? `供需惩罚曲线，需求 ${q.toFixed(2)}，供给 ${k.toFixed(2)}，惩罚 ${penalty(k).toFixed(3)}` : `Supply penalty curve: demand ${q.toFixed(2)}, supply ${k.toFixed(2)}, penalty ${penalty(k).toFixed(3)}`);
  }

  function setLanguage(next) {
    language = next;
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    original.forEach((english, node) => { node.innerHTML = next === "zh" ? chinese[node.dataset.t] || english : english; });
    $("#language").textContent = next === "zh" ? "EN" : "中文";
    $("#language").setAttribute("aria-label", next === "zh" ? "Switch to English" : "切换为中文");
    $$('[data-energy-level]').forEach(button => {
      const label = button.dataset.energyLevel === "H" ? (language === "zh" ? "编码器 " : "Encoder ") : (language === "zh" ? "端点 " : "Endpoint ");
      if (button.firstChild?.nodeType === Node.TEXT_NODE) button.firstChild.textContent = label;
    });
    drawControls();
    updateGate();
    drawGeometry();
    drawAttention();
    drawEnergy();
    drawImageCurve();
    syncGeometryPlayback();
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
  ["control-model", "control-backend"].forEach(id => $("#" + id).addEventListener("change", drawControls));
  $$("[data-geometry-family]").forEach(button => button.addEventListener("click", () => {
    stopGeometryPlayback();
    geometryFamily = button.dataset.geometryFamily;
    geometrySelection = geometryFamily === "glyph" ? "glyph-j" : "sigreg";
    drawGeometry();
  }));
  $("#geometry-select").addEventListener("change", event => { stopGeometryPlayback(); geometrySelection = event.target.value; drawGeometry(); });
  $("#geometry-previous").addEventListener("click", () => { stopGeometryPlayback(); stepGeometry(-1); });
  $("#geometry-next").addEventListener("click", () => { stopGeometryPlayback(); stepGeometry(1); });
  $("#geometry-play").addEventListener("click", () => { geometryPlaying = !geometryPlaying; syncGeometryPlayback(); });
  document.addEventListener("visibilitychange", syncGeometryPlayback);
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && geometryPlaying) stopGeometryPlayback();
  }).observe($(".geometry-explorer"));
  $("#curve-dataset").addEventListener("change", drawImageCurve);
  if (matchMedia("(max-width: 700px)").matches) $("#curve-dataset").value = "imagenet";
  drawImageCurve();
  ["attention-dataset", "attention-sample"].forEach(id => $("#" + id).addEventListener("change", drawAttention));
  $("#attention-split").addEventListener("input", updateAttentionSplit);
  $$('[data-energy-level]').forEach(button => button.addEventListener("click", () => drawEnergy(button.dataset.energyLevel)));
  ["demand", "supply"].forEach((id) => $("#" + id).addEventListener("input", updateGate));
  $("#gate-reset").addEventListener("click", () => {
    $("#demand").value = '0.65'; $("#supply").value = '0.30'; updateGate();
  });
  new ResizeObserver(drawGateCurve).observe($("#gate-curve"));
  function setSupplyFromPointer(event) {
    const bounds = $("#gate-curve").getBoundingClientRect();
    const value = 0.05 + (event.clientX - bounds.left - 42) / (bounds.width - 62) * 0.95;
    $("#supply").value = Math.max(0.05, Math.min(1, value)).toFixed(2);
    updateGate();
  }
  $("#gate-curve").addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    $("#gate-curve").setPointerCapture(event.pointerId); setSupplyFromPointer(event);
  });
  $("#gate-curve").addEventListener("pointermove", event => {
    if ($("#gate-curve").hasPointerCapture(event.pointerId)) setSupplyFromPointer(event);
  });
  $("#gate-curve").addEventListener("pointerup", event => {
    if ($("#gate-curve").hasPointerCapture(event.pointerId)) $("#gate-curve").releasePointerCapture(event.pointerId);
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
    stopGeometryPlayback();
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
  const figureCanvas = $(".figure-canvas");
  let figureDrag;
  figureCanvas.addEventListener("dblclick", () => setFigureZoom(!dialog.classList.contains("is-zoomed")));
  figureCanvas.addEventListener("pointerdown", event => {
    if (!dialog.classList.contains("is-zoomed") || event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    figureDrag = { x: event.clientX, y: event.clientY, left: figureCanvas.scrollLeft, top: figureCanvas.scrollTop };
    figureCanvas.setPointerCapture(event.pointerId);
    figureCanvas.classList.add("is-dragging");
  });
  figureCanvas.addEventListener("pointermove", event => {
    if (!figureDrag) return;
    figureCanvas.scrollLeft = figureDrag.left - (event.clientX - figureDrag.x);
    figureCanvas.scrollTop = figureDrag.top - (event.clientY - figureDrag.y);
  });
  figureCanvas.addEventListener("lostpointercapture", () => { figureDrag = undefined; figureCanvas.classList.remove("is-dragging"); });
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  // Animate connected particles without resampling the learned logo's colors.
  function initLogoParticles() {
    const host = $("#logo-particle-button");
    const canvas = host?.querySelector(".hero-logo-particles");
    const sourcePath = host?.dataset.particleSource;
    if (!host || !canvas || !sourcePath || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    const atlas = document.createElement("canvas");
    const points = [];
    const pointer = { x: 0, y: 0, active: false };
    let width = 0, height = 0, fit = 1, offsetX = 0, offsetY = 0;
    let hovering = false, ready = false, frame = 0, previousTime = 0;

    function resize() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      fit = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      offsetX = (width - image.naturalWidth * fit) / 2;
      offsetY = (height - image.naturalHeight * fit) / 2;
      points.forEach(point => {
        point.currentX = offsetX + point.x * fit;
        point.currentY = offsetY + point.y * fit;
        point.currentScale = 1;
      });
      if (ready) startAnimation();
    }

    function sample() {
      const w = image.naturalWidth, h = image.naturalHeight;
      const buffer = document.createElement("canvas");
      buffer.width = w; buffer.height = h;
      const bufferContext = buffer.getContext("2d", { willReadFrequently: true });
      if (!bufferContext) return;
      bufferContext.drawImage(image, 0, 0);
      const source = bufferContext.getImageData(0, 0, w, h).data;
      const seen = new Uint8Array(w * h);
      const components = [];

      // Isolate the original dots and touching clusters, retaining every visible pixel.
      for (let p = 0; p < w * h; p++) {
        if (seen[p] || !source[p * 4 + 3]) continue;
        const stack = [p], pixels = [];
        let minX = w, minY = h, maxX = 0, maxY = 0;
        seen[p] = 1;
        while (stack.length) {
          const index = stack.pop(), x = index % w, y = Math.floor(index / w);
          pixels.push(index);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          const neighbors = [];
          if (x) neighbors.push(index - 1);
          if (x + 1 < w) neighbors.push(index + 1);
          if (y) neighbors.push(index - w);
          if (y + 1 < h) neighbors.push(index + w);
          for (const next of neighbors) {
            if (seen[next] || !source[next * 4 + 3]) continue;
            seen[next] = 1; stack.push(next);
          }
        }
        components.push({ minX, minY, width: maxX - minX + 1, height: maxY - minY + 1, pixels });
      }

      // Pack masked sprites so overlapping bounding boxes never duplicate another dot.
      atlas.width = 2048;
      let left = 1, top = 1, rowHeight = 0;
      for (const component of components) {
        if (left + component.width + 1 > atlas.width) {
          left = 1; top += rowHeight + 2; rowHeight = 0;
        }
        component.sx = left; component.sy = top;
        left += component.width + 2;
        rowHeight = Math.max(rowHeight, component.height);
      }
      atlas.height = top + rowHeight + 1;
      const atlasContext = atlas.getContext("2d");
      if (!atlasContext) return;
      const texture = atlasContext.createImageData(atlas.width, atlas.height);
      for (const component of components) {
        for (const p of component.pixels) {
          const x = p % w - component.minX + component.sx;
          const y = Math.floor(p / w) - component.minY + component.sy;
          const target = (y * atlas.width + x) * 4;
          for (let channel = 0; channel < 4; channel++) texture.data[target + channel] = source[p * 4 + channel];
        }
        points.push({
          x: component.minX + component.width / 2,
          y: component.minY + component.height / 2,
          sx: component.sx, sy: component.sy,
          width: component.width, height: component.height,
          currentX: 0, currentY: 0, currentScale: 1
        });
      }
      atlasContext.putImageData(texture, 0, 0);
      ready = points.length > 0;
      resize();
    }

    function animate(now) {
      frame = 0;
      if (!ready) return;
      const delta = Math.min((now - previousTime) / 16.67 || 1, 3);
      previousTime = now;
      const ease = 1 - Math.pow(.82, delta);
      let moving = false;
      context.clearRect(0, 0, width, height);
      for (const point of points) {
        const baseX = offsetX + point.x * fit, baseY = offsetY + point.y * fit;
        let targetX = baseX, targetY = baseY, targetScale = 1;
        if (hovering && pointer.active) {
          const dx = baseX - pointer.x, dy = baseY - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = Math.min(230, Math.max(110, width * .21));
          if (distance < radius) {
            const influence = Math.pow(1 - distance / radius, 2);
            const force = 34 * influence;
            if (distance > .01) {
              targetX += dx / distance * force;
              targetY += dy / distance * force;
            }
            targetScale = 1 + .8 * influence;
          }
        }
        point.currentX += (targetX - point.currentX) * ease;
        point.currentY += (targetY - point.currentY) * ease;
        point.currentScale += (targetScale - point.currentScale) * ease;
        const spriteWidth = point.width * fit * point.currentScale;
        const spriteHeight = point.height * fit * point.currentScale;
        context.drawImage(atlas, point.sx, point.sy, point.width, point.height,
          point.currentX - spriteWidth / 2, point.currentY - spriteHeight / 2, spriteWidth, spriteHeight);
        moving ||= Math.abs(point.currentX - baseX) > .02 || Math.abs(point.currentY - baseY) > .02 || Math.abs(point.currentScale - 1) > .002;
      }
      host.classList.add("is-particle-ready");
      if (hovering || moving) frame = requestAnimationFrame(animate);
      else previousTime = 0;
    }

    function startAnimation() {
      if (ready && !frame) frame = requestAnimationFrame(animate);
    }
    function movePointer(event) {
      const bounds = host.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left; pointer.y = event.clientY - bounds.top;
      pointer.active = true;
      startAnimation();
    }

    image.onload = sample;
    image.src = sourcePath;
    host.addEventListener("pointerenter", event => {
      hovering = true; movePointer(event);
    });
    host.addEventListener("pointermove", movePointer);
    host.addEventListener("pointerleave", () => {
      hovering = false; pointer.active = false; startAnimation();
    });
    new ResizeObserver(resize).observe(host);
  }
  initLogoParticles();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target.id;
        $$("#navigation a").forEach((link) => link.classList.toggle("active", link.hash === "#" + section));
      });
    }, { rootMargin: "-15% 0px -65% 0px" });
    $$("#insight, #method, #results, #geometry, #images, #video, #code").forEach((section) => observer.observe(section));
  }
  window.lucide?.createIcons();
  try { if (localStorage.getItem("sadl-language") === "zh") language = "zh"; } catch (_) { /* Use English by default. */ }
  setLanguage(language);
})();

/* 問題図と解説の分野情報を、CBT・一問練習の両方で表示する。 */
(() => {
  "use strict";
  const svgNS = "http://www.w3.org/2000/svg";
  const $svg = (tag, attributes = {}) => {
    const element = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
    return element;
  };

  function renderNetwork(diagram, container) {
    const figure = document.createElement("figure");
    figure.className = "exam-diagram network-diagram";
    const caption = document.createElement("figcaption");
    caption.textContent = diagram.title;
    const width = Math.max(...diagram.nodes.map(node => node[1])) + 35;
    const height = Math.max(...diagram.nodes.map(node => node[2])) + 35;
    const svg = $svg("svg", { viewBox:`0 0 ${width} ${height}`, role:"img", "aria-label":diagram.title });
    const defs = $svg("defs");
    const marker = $svg("marker", { id:"exam-arrowhead", viewBox:"0 0 10 10", refX:9, refY:5, markerWidth:7, markerHeight:7, orient:"auto-start-reverse" });
    marker.append($svg("path", { d:"M 0 0 L 10 5 L 0 10 z", fill:"#40597c" }));
    defs.append(marker);
    svg.append(defs);
    const nodes = new Map(diagram.nodes.map(([id,x,y], i) => [id,{ x,y,label:id === "s" ? "開始" : id === "e" ? "終了" : String(i) }]));
    for (const [fromId, toId, name, days, dummy] of diagram.edges) {
      const a = nodes.get(fromId), b = nodes.get(toId);
      const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx,dy);
      const ux = dx / length, uy = dy / length;
      const line = $svg("line", { x1:a.x+ux*17, y1:a.y+uy*17, x2:b.x-ux*20, y2:b.y-uy*20, stroke:dummy ? "#8192aa" : "#40597c", "stroke-width":dummy ? 1.7 : 2.5, "stroke-dasharray":dummy ? "6 5" : "", "marker-end":"url(#exam-arrowhead)" });
      svg.append(line);
      if (!dummy) {
        const text = $svg("text", { x:(a.x+b.x)/2-uy*12, y:(a.y+b.y)/2+ux*12-3, "text-anchor":"middle", "font-size":15, "font-weight":"700", fill:"#19324b", stroke:"#ffffff", "stroke-width":4, "paint-order":"stroke" });
        text.textContent = `${name} ${days}日`;
        svg.append(text);
      }
    }
    for (const node of nodes.values()) {
      svg.append($svg("circle", { cx:node.x, cy:node.y, r:15, fill:"#ffffff", stroke:"#315bff", "stroke-width":2.5 }));
      const text = $svg("text", { x:node.x, y:node.y+5, "text-anchor":"middle", "font-size":node.label.length > 1 ? 10 : 13, "font-weight":"700", fill:"#1b3157" });
      text.textContent = node.label;
      svg.append(text);
    }
    figure.append(caption, svg);
    container.append(figure);
  }

  function renderFpTable(diagram, container) {
    const figure = document.createElement("figure");
    figure.className = "exam-diagram fp-diagram";
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = diagram.title;
    const thead = document.createElement("thead");
    const head = document.createElement("tr");
    for (const title of ["機能分類", "件数", "重み（FP/件）"]) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = title;
      head.append(th);
    }
    thead.append(head);
    const tbody = document.createElement("tbody");
    for (const row of diagram.rows) {
      const tr = document.createElement("tr");
      for (const cell of row) {
        const td = document.createElement("td");
        td.textContent = String(cell);
        tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(caption, thead, tbody);
    figure.append(table);
    container.append(figure);
  }

  window.FE_RENDER_DIAGRAM = (question, container) => {
    container.replaceChildren();
    const diagram = question.meta?.diagram;
    container.hidden = !diagram;
    if (!diagram) return;
    if (diagram.type === "network") renderNetwork(diagram, container);
    if (diagram.type === "fp-table") renderFpTable(diagram, container);
  };

  window.FE_RENDER_CONTEXT = (question, container) => {
    container.replaceChildren();
    const meta = question.meta;
    if (!meta) return;
    const add = (label, value) => {
      const row = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label + "：";
      row.append(strong, document.createTextNode(value));
      container.append(row);
    };
    add("出題分野", `${meta.major} ＞ ${meta.field}`);
    add("扱う図法・方法・用語", meta.method);
    if (meta.purpose) add("この計算で分かること", meta.purpose);
  };
})();

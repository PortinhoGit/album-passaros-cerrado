/* ──────────────────────────────────────────────────────────────────────────
   Álbum de Pássaros do Cerrado — plataforma drag-and-drop
   Estado salvo em localStorage. 15 páginas iguais ao PDF impresso.
   ────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "album-passaros-cerrado-v1";
const TOTAL_PAGINAS = 15;

const estado = {
  nome: "",
  paginaAtual: 0,        // índice (0 = capa interna, 14 = créditos)
  drops: {},             // { slugAve: slugFotoColocada }
  textos: {},            // { campo: valor }
};

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function carregar() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    Object.assign(estado, JSON.parse(raw));
  } catch (_) {}
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const toastEl = document.getElementById("toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

/* ─── Tela inicial ───────────────────────────────────────────────────────── */
const telaCapa = document.getElementById("telaCapa");
const app = document.getElementById("app");
const inputNome = document.getElementById("inputNome");

document.getElementById("btnComecar").addEventListener("click", () => {
  const nome = inputNome.value.trim() || "amiga";
  estado.nome = nome;
  salvar();
  iniciarApp();
});

inputNome.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btnComecar").click();
});

function iniciarApp() {
  document.getElementById("nomeUsuario").textContent = estado.nome || "amiga";
  telaCapa.style.display = "none";
  app.classList.add("ativo");
  renderBanco();
  renderPagina();
  bindDrawer();
}

/* Drawer mobile: abre/fecha sidebar */
let drawerAbrir = () => {};
let drawerFechar = () => {};
let dragDropCorreto = false;

function isMobile() { return window.innerWidth <= 768; }

function bindDrawer() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const btnAbrir = document.getElementById("btnAbrirBanco");
  const btnFechar = document.getElementById("btnFecharBanco");
  drawerAbrir = () => { sidebar.classList.add("aberta"); overlay.classList.add("ativo"); };
  drawerFechar = () => { sidebar.classList.remove("aberta"); overlay.classList.remove("ativo"); };
  btnAbrir && btnAbrir.addEventListener("click", drawerAbrir);
  btnFechar && btnFechar.addEventListener("click", drawerFechar);
  overlay && overlay.addEventListener("click", drawerFechar);
}

/* ─── Sidebar / banco de fotos ───────────────────────────────────────────── */
const bancoEl = document.getElementById("bancoAves");
const buscaEl = document.getElementById("busca");

function renderBanco(filtro = "") {
  const f = filtro.trim().toLowerCase();
  bancoEl.innerHTML = "";
  BANCO_AVES
    .filter((a) => !f || a.nome.toLowerCase().includes(f) || a.slug.includes(f))
    .forEach((a) => {
      const usada = Object.values(estado.drops).includes(a.slug);
      const div = document.createElement("div");
      div.className = "figurinha" + (usada ? " usada" : "");
      div.draggable = !usada;
      div.dataset.slug = a.slug;
      div.innerHTML = `
        <img src="banco-aves/${a.slug}.jpg" alt="${a.nome}">
        <div class="nome">${a.nome}</div>
      `;
      div.addEventListener("dragstart", (e) => {
        if (usada) { e.preventDefault(); return; }
        e.dataTransfer.setData("text/plain", a.slug);
        div.classList.add("dragging");
        dragDropCorreto = false;
        // mobile: recolhe o drawer para liberar a área de drop
        if (isMobile()) drawerFechar();
      });
      div.addEventListener("dragend", () => {
        div.classList.remove("dragging");
        // mobile: se o drop não acertou (cancelado ou slug errado), reabre o drawer
        if (isMobile() && !dragDropCorreto) drawerAbrir();
      });
      bancoEl.appendChild(div);
    });
}

buscaEl.addEventListener("input", (e) => renderBanco(e.target.value));

/* ─── Navegação ──────────────────────────────────────────────────────────── */
const stage = document.getElementById("stage");
const indicador = document.getElementById("indicador");
document.getElementById("btnAnt").addEventListener("click", () => navegar(-1));
document.getElementById("btnProx").addEventListener("click", () => navegar(1));

function navegar(delta) {
  const nova = estado.paginaAtual + delta;
  if (nova < 0 || nova >= TOTAL_PAGINAS) return;
  estado.paginaAtual = nova;
  salvar();
  renderPagina();
  stage.scrollTop = 0;
}

document.addEventListener("keydown", (e) => {
  if (telaCapa.style.display !== "none") return;
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.key === "ArrowLeft") navegar(-1);
  if (e.key === "ArrowRight") navegar(1);
});

/* ─── Imprimir ───────────────────────────────────────────────────────────── */
document.getElementById("btnImprimir").addEventListener("click", () => {
  // monta todas as páginas no stage para impressão completa
  renderTodasParaImpressao();
  setTimeout(() => {
    window.print();
    setTimeout(renderPagina, 500);
  }, 200);
});

function renderTodasParaImpressao() {
  stage.innerHTML = "";
  for (let i = 0; i < TOTAL_PAGINAS; i++) {
    stage.appendChild(criarPagina(i));
  }
}

/* ─── Render da página atual ─────────────────────────────────────────────── */
function renderPagina() {
  stage.innerHTML = "";
  stage.appendChild(criarPagina(estado.paginaAtual));
  indicador.textContent = `${estado.paginaAtual + 1} / ${TOTAL_PAGINAS}`;
  document.getElementById("btnAnt").disabled = estado.paginaAtual === 0;
  document.getElementById("btnProx").disabled = estado.paginaAtual === TOTAL_PAGINAS - 1;
}

/* ─── Builders de cada página ────────────────────────────────────────────── */
function criarPagina(idx) {
  const div = document.createElement("div");
  div.className = "pagina";

  if (idx === 0)        construirCapaInterna(div);
  else if (idx === 1)   construirBoasvindas(div);
  else if (idx >= 2 && idx <= 7)  construirEspecie(div, AVES_DETALHADAS[idx - 2]);
  else if (idx === 8)   construirDiario(div);
  else if (idx === 9)   construirMapa(div);
  else if (idx === 10)  construirGaleria(div);
  else if (idx === 11)  construirIndice(div);
  else if (idx === 12)  construirAssinatura(div);
  else if (idx === 13)  construirSobre(div);
  else if (idx === 14)  construirCreditos(div);

  // rodapé (exceto na capa interna)
  if (idx !== 0) {
    const rod = document.createElement("div");
    rod.className = "pagina-rodape";
    rod.innerHTML = `
      Desenvolvido por <a href="https://wa.me/5511999381625" target="_blank">Ylvorix Digital Ltda</a>
      &nbsp;·&nbsp; ${idx + 1}/${TOTAL_PAGINAS}
    `;
    div.appendChild(rod);
  }
  return div;
}

/* — Capa interna — */
function construirCapaInterna(p) {
  p.classList.add("pag-capa-interna");
  p.innerHTML = `
    <h1>MEU ÁLBUM DE PÁSSAROS<br>DO CERRADO</h1>
    <div class="faixa-verde" style="margin: 14px auto 22px;"></div>
    <p style="font-style: italic; color: var(--texto-claro);">Uma viagem com asas pelo coração do Brasil</p>
    <div style="margin-top: 26px; width: 200px; height: 200px; border-radius: 50%; background: url('banco-aves/seriema.jpg') center/cover; border: 4px solid var(--vermelho); box-shadow: 0 0 0 10px rgba(160,57,46,0.06);"></div>
    <p class="nome-crianca">Este álbum é de <span data-text-id="nomeCapa" contenteditable="true" style="border-bottom: 2px dashed var(--linha); padding: 0 8px; min-width: 180px; display: inline-block;">${escapeHtml(estado.textos.nomeCapa || estado.nome || "")}</span></p>
  `;
  bindContenteditable(p);
}

/* — Boas-vindas — */
function construirBoasvindas(p) {
  p.classList.add("pag-texto");
  p.innerHTML = `
    <h1>Olá!</h1>
    <div class="faixa"></div>
    <p>Você está prestes a conhecer alguns dos pássaros mais incríveis do Brasil. Eles vivem no <strong>cerrado</strong>, que é uma das paisagens mais antigas do nosso país — cheia de céu aberto, árvores tortas e flores que só nascem aqui.</p>
    <p>Durante suas sessões de tratamento, você vai poder vê-los voando bem perto de você, através dos óculos de realidade virtual. E neste álbum, você vai poder colecionar cada um deles. Vai escrever o que viu, o que sentiu, o que descobriu.</p>
    <p>No fim, este álbum vai virar <em>seu</em> — só seu. Com sua história dentro.</p>
  `;
}

/* — Página de Espécie — */
function construirEspecie(p, ave) {
  p.classList.add("pag-especie");
  const droppedSlug = estado.drops[ave.slug];
  p.innerHTML = `
    <div class="header-num">${ave.numero}</div>
    <div class="faixa-cor" style="background: ${ave.cor_destaque};"></div>
    <div class="corpo">
      <div class="coluna-esq">
        <div class="dropzone" data-target="${ave.slug}">
          ${droppedSlug
            ? `<img src="banco-aves/${droppedSlug}.jpg" alt="">`
            : `<div class="placeholder"><span>📷</span>Arraste a foto<br>do <strong>${ave.nome}</strong> aqui</div>`}
        </div>
        <div class="ficha">
          <div><strong>Tamanho:</strong> ${ave.tamanho}</div>
          <div><strong>Cor:</strong> ${ave.cor}</div>
          <div><strong>Som:</strong> ${ave.som}</div>
          ${droppedSlug ? `<div class="credito">Foto: ${ave.credito}</div>` : ""}
        </div>
      </div>
      <div class="info">
        <div class="nome-popular" style="color: ${ave.cor_destaque};">${ave.nome.toUpperCase()}</div>
        <div class="cientifico">${ave.cientifico}</div>
        ${ave.ameacado ? `<div class="selo-ameacado">ESPÉCIE AMEAÇADA</div>` : ""}
        <h3>Você sabia?</h3>
        <p>${ave.fato}</p>
        <div class="box-curiosidade" style="border-color: ${ave.cor_destaque}; background: ${hexLight(ave.cor_destaque, 0.92)};">
          <div class="titulo" style="color: ${ave.cor_destaque};">Curiosidade</div>
          ${ave.curiosidade}
        </div>
        <div class="interativo">
          <label>Eu vi este pássaro em:</label>
          <input type="text" data-text-id="${ave.slug}_local" value="${escapeHtml(estado.textos[ave.slug + "_local"] || "")}" placeholder="lugar e data">
          <label>Como me senti:</label>
          <input type="text" data-text-id="${ave.slug}_sentimento" value="${escapeHtml(estado.textos[ave.slug + "_sentimento"] || "")}" placeholder="o que senti vendo este pássaro">
        </div>
        ${(ave.prompts || []).map((p, i) => `
          <div class="box-livre" style="border-color: ${ave.cor_destaque}; background: ${hexLight(ave.cor_destaque, 0.95)};">
            <div class="titulo-pergunta" style="color: ${ave.cor_destaque};">${p.titulo}</div>
            <p class="prompt-texto">${p.texto}</p>
            <textarea data-text-id="${ave.slug}_p${i}" placeholder="escreva, desenhe com palavras, invente...">${escapeHtml(estado.textos[ave.slug + "_p" + i] || "")}</textarea>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  bindDropzones(p, ave);
  bindTextInputs(p);
}

/* — Diário — */
function construirDiario(p) {
  p.classList.add("pag-diario");
  p.innerHTML = `
    <h1>MEU DIÁRIO DE VIAGEM</h1>
    <div class="faixa"></div>
    <p style="text-align: center; font-style: italic; color: var(--texto-claro); margin-bottom: 18px; font-size: 0.85rem;">Aqui você pode escrever, desenhar, colar — o que quiser.</p>
    <div class="area-livre">
      <textarea data-text-id="diario_livre" placeholder="Escreva ou cole o que você quiser aqui...">${escapeHtml(estado.textos.diario_livre || "")}</textarea>
    </div>
    ${[
      ["O que mais te chamou atenção hoje?", "diario_q1"],
      ["Que som você ouviria se pudesse?", "diario_q2"],
      ["Se você fosse um pássaro do cerrado, qual seria? Por quê?", "diario_q3"]
    ].map(([q, id]) => `
      <div class="pergunta">
        <label>${q}</label>
        <textarea data-text-id="${id}" placeholder="...">${escapeHtml(estado.textos[id] || "")}</textarea>
      </div>
    `).join("")}
  `;
  bindTextInputs(p);
}

/* — Mapa — */
function construirMapa(p) {
  p.classList.add("pag-mapa");
  p.innerHTML = `
    <h1>ONDE VIVEM ESSES PÁSSAROS</h1>
    <div class="faixa"></div>
    <img class="img-mapa" src="banco-mapa/mapa-cerrado.webp" alt="Mapa do Cerrado brasileiro">
    <p style="text-align: center;">O cerrado é a savana mais rica do mundo. Ele cobre quase um quarto do Brasil e abriga mais de <strong>800 espécies de pássaros</strong>. Cada uma delas tem um jeito de viver, comer, cantar e se esconder. E muitas só existem aqui — em nenhum outro lugar do planeta.</p>
  `;
}

/* — Galeria (slots por espécie detalhada) — */
function construirGaleria(p) {
  p.classList.add("pag-galeria");
  p.innerHTML = `
    <h1>MINHA COLEÇÃO</h1>
    <div class="faixa"></div>
    <div class="galeria-grid">
      ${AVES_DETALHADAS.map(a => {
        const drop = estado.drops[a.slug];
        return `
          <div class="slot ${drop ? "preenchido" : ""}" data-nome="${a.nome.toUpperCase()}">
            ${drop ? `<img src="banco-aves/${drop}.jpg" alt="${a.nome}">` : `<span style="font-size: 0.7rem; color: var(--texto-claro);">[ ${a.nome} ]</span>`}
          </div>
        `;
      }).join("")}
    </div>
    <p style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: var(--texto-claro); font-style: italic;">As figurinhas vão aparecendo aqui à medida que você as encontra no álbum.</p>
  `;
}

/* — Índice 34 espécies — */
function construirIndice(p) {
  p.classList.add("pag-indice");
  const detalhadasSlugs = AVES_DETALHADAS.map(a => a.slug);
  const corMap = {};
  AVES_DETALHADAS.forEach(a => corMap[a.slug] = a.cor_destaque);

  p.innerHTML = `
    <h1>TODAS AS AVES DO ÁLBUM</h1>
    <div class="faixa"></div>
    <p class="intro">Este álbum reúne <strong>34 aves do cerrado brasileiro</strong> para colecionar. Algumas você já encontrou neste mockup. Outras virão à medida que novas sessões de realidade virtual acontecerem.</p>
    <div class="grid">
      ${BANCO_AVES.map(a => {
        const det = detalhadasSlugs.includes(a.slug);
        const drop = det && estado.drops[a.slug];
        let cls = "cell";
        let style = "";
        if (drop) {
          cls += " detalhada preenchida";
          style = `background-image: url('banco-aves/${drop}.jpg'); border-color: ${corMap[a.slug]};`;
        } else if (det) {
          cls += " detalhada";
          style = `border-color: ${corMap[a.slug]};`;
        }
        return `<div class="${cls}" style="${style}"><div class="nome-cell">${a.nome}</div></div>`;
      }).join("")}
    </div>
    <p style="margin-top: 16px; font-size: 0.65rem; font-style: italic; color: var(--texto-claro);">Curadoria baseada em fontes técnicas: Brasil Escola, Avoar Cerrado/UnB, Funed-MG e WikiAves.</p>
  `;
}

/* — Assinatura — */
function construirAssinatura(p) {
  p.classList.add("pag-assinatura");
  p.innerHTML = `
    <h1>ESTE ÁLBUM É MEU</h1>
    <div class="faixa"></div>
    <p>Você completou sua jornada pelo cerrado.</p>
    <p>Este álbum é seu — com tudo o que você viu, escreveu e sentiu.</p>
    <p>Escreva seu nome aqui embaixo. Ele fica registrado para sempre.</p>
    <div class="linha-nome" data-text-id="nomeFinal" contenteditable="true">${escapeHtml(estado.textos.nomeFinal || estado.nome || "")}</div>
    <div class="label-nome">Nome</div>
    <div class="linha-data" data-text-id="dataFinal" contenteditable="true">${escapeHtml(estado.textos.dataFinal || "")}</div>
    <div class="label-data">Data</div>
  `;
  bindContenteditable(p);
}

/* — Sobre — */
function construirSobre(p) {
  p.classList.add("pag-sobre");
  p.innerHTML = `
    <h1>SOBRE O PROJETO</h1>
    <div class="faixa"></div>
    <p>Este álbum faz parte de um projeto que une ciência, saúde e natureza. A pesquisa investiga os benefícios do contato com a natureza no bem-estar de crianças em tratamento oncológico — e desenvolve formas de levar a natureza até elas, mesmo quando elas não podem sair do hospital.</p>
    <h3>Equipe e parceiros</h3>
    <ul>
      <li><strong>Luiza</strong> — concepção do álbum e diário, pesquisa quali-quanti com crianças e famílias.</li>
      <li><strong>Débora</strong> — médica oncologista, doutoranda na Unesp, marcadores laboratoriais.</li>
      <li><strong>Universidade Cornell</strong> — desenvolvimento da realidade virtual com pássaros do cerrado.</li>
      <li><strong>Unesp</strong> — instituição parceira da pesquisa.</li>
    </ul>
    <h3>Um álbum que cresce com a criança</h3>
    <p>Este álbum não é fechado. Novas espécies vão sendo adicionadas conforme novas sessões de realidade virtual acontecem e novos pássaros são modelados pela equipe da Cornell. Cada visita ao cerrado é uma nova chance de descobrir, escrever, colecionar.</p>
  `;
}

/* — Créditos — */
function construirCreditos(p) {
  p.classList.add("pag-creditos");
  p.innerHTML = `
    <h1>CRÉDITOS E REFERÊNCIAS</h1>
    <div class="faixa"></div>
    <h3>Créditos das fotografias</h3>
    <p style="font-size: 0.78rem;">Todas as imagens foram obtidas do Wikimedia Commons sob licenças livres (CC BY / CC BY-SA). Atribuição completa por espécie disponível em <code>creditos-imagens.md</code>.</p>
    <h3>Fontes técnicas da curadoria</h3>
    <ul>
      <li><strong>Brasil Escola</strong> — <a href="https://brasilescola.uol.com.br/brasil/aves-cerrado.htm" target="_blank">Aves do Cerrado</a></li>
      <li><strong>Avoar Cerrado / UnB</strong> — <a href="https://avoarcerrado.unb.br/index.php/passarinhar/mini-guia" target="_blank">Mini-guia de aves</a></li>
      <li><strong>Funed-MG</strong> — <a href="https://www.funed.mg.gov.br" target="_blank">Guia de Aves</a></li>
      <li><strong>WikiAves</strong> — <a href="https://www.wikiaves.com.br/wiki/biomas:bioma_cerrado" target="_blank">Bioma Cerrado</a></li>
      <li><strong>PAN Aves do Cerrado e Pantanal (2023-2028)</strong> — <a href="https://www.gov.br" target="_blank">Ministério do Meio Ambiente</a></li>
    </ul>
    <h3>Sobre o mockup</h3>
    <p style="font-size: 0.78rem;">Plataforma desenvolvida como mockup de discussão. Versão 1 — dados salvos localmente no navegador. Não envia informações para nenhum servidor.</p>
    <h3>Privacidade</h3>
    <p style="font-size: 0.78rem;">Veja a <a href="privacidade.html" target="_blank">política de privacidade completa</a>: quem é responsável pela pesquisa (Luiza Campos, equipe Unesp), pela infra técnica (Ylvorix Digital Ltda, doação) e o que a plataforma faz (e não faz) com dados.</p>
  `;
}

/* ─── Drag & Drop nas dropzones ──────────────────────────────────────────── */
function bindDropzones(container, ave) {
  container.querySelectorAll(".dropzone").forEach((dz) => {
    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("over");
    });
    dz.addEventListener("dragleave", () => dz.classList.remove("over"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("over");
      const slug = e.dataTransfer.getData("text/plain");
      const target = dz.dataset.target;
      if (slug === target) {
        dragDropCorreto = true;
        estado.drops[target] = slug;
        salvar();
        toast(`Boa! Você encontrou a ${nomeFromSlug(slug)} 🪶`);
        renderPagina();
        renderBanco(buscaEl.value);
      } else {
        dz.classList.add("errado");
        toast(`Hmm, essa não é a ${nomeFromSlug(target)}. Tenta outra!`);
        setTimeout(() => dz.classList.remove("errado"), 500);
      }
    });
  });
}

function nomeFromSlug(slug) {
  const a = BANCO_AVES.find((x) => x.slug === slug);
  return a ? a.nome : slug;
}

/* ─── Bind dos inputs/textareas/contenteditable ──────────────────────────── */
function bindTextInputs(container) {
  container.querySelectorAll("[data-text-id]").forEach((el) => {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.addEventListener("input", () => {
        estado.textos[el.dataset.textId] = el.value;
        salvar();
      });
    }
  });
}

function bindContenteditable(container) {
  container.querySelectorAll("[contenteditable]").forEach((el) => {
    el.addEventListener("input", () => {
      estado.textos[el.dataset.textId] = el.textContent;
      salvar();
    });
  });
}

/* ─── Util ───────────────────────────────────────────────────────────────── */
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function hexLight(hex, mix = 0.92) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const lr = Math.round(r + (255 - r) * mix);
  const lg = Math.round(g + (255 - g) * mix);
  const lb = Math.round(b + (255 - b) * mix);
  return `rgb(${lr},${lg},${lb})`;
}

/* ─── Boot ───────────────────────────────────────────────────────────────── */
carregar();
if (estado.nome) {
  inputNome.value = estado.nome;
  iniciarApp();
}

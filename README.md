# Álbum de Pássaros do Cerrado — Plataforma

Mockup interativo de álbum de figurinhas digital. A criança arrasta fotos de aves para os slots correspondentes e completa o álbum com seus sentimentos e descobertas. Ao final, pode imprimir o álbum personalizado em A4.

**Online:** https://passaroscerrado.portinho.me

## Como testar localmente

```bash
# Servir os arquivos (qualquer servidor estático)
python3 -m http.server 8000
# abrir http://localhost:8000
```

Não pode ser aberto via `file://` porque o navegador bloqueia drag-and-drop com algumas operações. Use sempre um servidor.

## Estrutura

```
.
├── index.html        # Página única (SPA)
├── style.css         # Identidade visual + print A4
├── app.js            # Lógica drag-drop, navegação, persistência
├── aves.js           # Dados das 6 espécies detalhadas + 34 do banco
├── banco-aves/       # 34 fotos das espécies (Wikimedia Commons / CC)
├── banco-mapa/       # Mapa do Cerrado
├── CNAME             # passaroscerrado.portinho.me (GitHub Pages)
└── README.md
```

## Funcionalidades

- 15 páginas navegáveis (capa, boas-vindas, 6 espécies, diário, mapa, galeria, índice das 34, assinatura, sobre, créditos)
- Drag-and-drop: arrastar foto da sidebar para o slot correto
- Validação: foto errada não cola; foto certa "fica"
- Campos editáveis: local, sentimento, comentário livre
- Estado persistido em `localStorage` (sem servidor)
- Botão "Imprimir álbum" → A4 pronto para impressão

## Deploy (GitHub Pages)

1. Repo: `portinhogit/album-passaros-cerrado`
2. Settings → Pages → branch `main`, pasta `/` (raiz)
3. Domínio personalizado: configurado via arquivo `CNAME`
4. Hostinger → DNS → adicionar registro `CNAME` apontando `passaroscerrado` → `portinhogit.github.io`

## Créditos das fotos

Todas as fotos do `banco-aves/` vieram do Wikimedia Commons sob licenças livres (CC BY / CC BY-SA). Lista detalhada de autores e licenças em `creditos.json` (na raiz do banco) e na página 15 do álbum.

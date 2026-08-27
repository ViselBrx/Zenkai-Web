# Zenkai

<p align="center">
  <img src="./assets/tryhard.png" alt="Logo da Zenkai" width="110" />
</p>

<p align="center">
  <strong>Uma plataforma pessoal para organizar, acompanhar e explorar animes, desenhos, filmes, mangás, HQs e vídeos.</strong>
</p>

<p align="center">
  <i class="fa-solid fa-folder-tree"></i> Organizada &nbsp;•&nbsp;
  <i class="fa-solid fa-lock"></i> Privada &nbsp;•&nbsp;
  <i class="fa-solid fa-house-laptop"></i> Local &nbsp;•&nbsp;
  <i class="fa-solid fa-chart-line"></i> Gamificada
</p>

> <i class="fa-solid fa-shield-halved"></i> Projeto voltado a estudo e uso pessoal, executado localmente.

---

## <i class="fa-solid fa-compass"></i> Visão geral

A Zenkai reúne catálogos de entretenimento em uma única interface. Usuários autenticados podem acompanhar o progresso, acumular XP, personalizar o perfil, manter histórico e utilizar ferramentas como a ZenkAI.

Visitantes podem explorar as vitrines e os catálogos, mas precisam entrar para acessar reprodução, leitores, progresso, perfil, comunidade, jogos e áreas administrativas.

## <i class="fa-solid fa-layer-group"></i> Recursos

- <i class="fa-solid fa-film"></i> Catálogos de animes, desenhos, filmes, YouTube, mangás e HQs, com busca, filtros e detalhes.
- <i class="fa-solid fa-list-check"></i> Progresso por episódios, filmes, volumes e vídeos, com marcação de conteúdo assistido ou lido.
- <i class="fa-solid fa-star"></i> Sistema de XP, níveis, ranks e estatísticas pessoais.
- <i class="fa-solid fa-store"></i> SenseiMod Store para conversão de XP em fichas e compra de cosméticos.
- <i class="fa-solid fa-wand-magic-sparkles"></i> Personalização com banners, auras, títulos, coroas, molduras e temas.
- <i class="fa-solid fa-palette"></i> Temas visuais neon, incluindo Ciano, Dourado, Verde, Vermelho, Roxo, Laranja, Azul, Branco, Verde-escuro, Aqua-verde, Cromático e Abismo Estelar.
- <i class="fa-solid fa-clock-rotate-left"></i> Histórico por usuário com busca e retomada de conteúdo.
- <i class="fa-solid fa-user-gear"></i> Perfil com dashboard, XP total, nível, rank, inventário e estatísticas.
- <i class="fa-solid fa-pen-to-square"></i> Área administrativa para cadastrar e editar animes, desenhos, filmes e playlists.
- <i class="fa-solid fa-robot"></i> ZenkAI com chat, análise de imagens e comparação de personagens.
- <i class="fa-solid fa-user-shield"></i> Autenticação por e-mail e OTP via Supabase, com isolamento de dados por usuário.

## <i class="fa-solid fa-screwdriver-wrench"></i> Tecnologias

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <br />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
</p>

| Tecnologia | Uso no projeto |
|---|---|
| HTML, CSS e JavaScript | Interface sem framework e interações da aplicação |
| Node.js e Express | Servidor local, arquivos estáticos, uploads e proxy de IA |
| Supabase | Autenticação, banco de dados, perfis e armazenamento |
| Groq / provedores de IA | Respostas e recursos da ZenkAI |
| Cloudflare | Integrações de IA, CDN e roteamento quando configurado |
| Dotenv | Leitura de variáveis de ambiente |
| Electron | Empacotamento do aplicativo desktop para Windows |

## <i class="fa-solid fa-rocket"></i> Começando

### Pré-requisitos

- Node.js instalado.
- Um projeto Supabase configurado, caso queira usar autenticação e dados remotos.
- Chaves de IA, caso queira habilitar todos os recursos da ZenkAI.

### Instalação

```bash
npm install
```

Crie ou atualize o arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

### Executar localmente

```bash
npm start
```

No Windows, também é possível iniciar com:

```bat
iniciar.bat
```

Abra [http://localhost:3000](http://localhost:3000).

## <i class="fa-solid fa-window-maximize"></i> Páginas principais

| Página | Finalidade |
|---|---|
| `index.html` | Portal inicial, atalhos e apresentação da plataforma |
| `login.html` / `registro.html` | Autenticação por e-mail, OTP e acesso à conta |
| `perfil.html` | Dashboard de perfil, nível, XP, inventário, histórico e estatísticas |
| `animes.html` / `desenhos.html` | Catálogos e detalhes de animes e desenhos |
| `anime-episodios.html` / `episodios-desenhos.html` | Temporadas, episódios e acompanhamento de progresso |
| `filmes.html` | Catálogo e player de filmes |
| `youtube.html` / `youtube-videos.html` | Playlists, vídeos e progresso do YouTube |
| `mangas.html` | Organizador e leitor de mangás por volume |
| `hq.html` | Visualizador de HQs em PDF com anotações |
| `loja.html` | SenseiMod Store e cosméticos |
| `zenkai.html` | ZenkAI: chat, visão e comparador de personagens |
| `painel-cadastros.html` e páginas `cadastro-*.html` | Administração e cadastro de conteúdo |
| `usuarios.html` | Comunidade, conexões e perfis de usuários |
| `agradecimento.html` | Créditos e agradecimentos |

## <i class="fa-solid fa-star"></i> XP, ranks e SenseiMod Store

O XP é atribuído às atividades concluídas pelo usuário.

| Atividade | XP |
|---|---:|
| Episódio de anime assistido | +10 XP |
| Episódio de desenho assistido | +10 XP |
| Volume de mangá lido | +15 XP |
| Edição de HQ lida | +15 XP |
| Filme assistido | +50 XP |
| Vídeo do YouTube assistido | +5 XP |

Na SenseiMod Store, o XP pode ser convertido em fichas para adquirir cosméticos.

| Ficha | Custo | Requisito |
|---|---:|---|
| Ouro | 100 XP | Rank Prata |
| Diamante | 250 XP | Rank Mestre |
| Esmeralda | 500 XP | Rank Guardião |

Progressão de ranks: Bronze → Prata → Ouro → Mestre → Lenda → Guardião → Hokage → Imortal.

## <i class="fa-solid fa-plug"></i> API local

O servidor em `server.js` disponibiliza os endpoints abaixo.

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/data` | `GET` | Retorna os dados disponíveis no sistema |
| `/api/save` | `POST` | Persiste alterações no estado local |
| `/api/upload` | `POST` | Recebe imagens e retorna a URL do upload |
| `/api/ai/proxy` | `POST` | Encaminha solicitações de chat, visão e comparação para a IA |

## <i class="fa-solid fa-desktop"></i> Aplicativo desktop

O diretório `electron/` contém o empacotamento do cliente Windows.

```bash
cd electron
npm install
npm start
```

Para gerar uma versão portátil para Windows x64:

```bash
npm run build
```

## <i class="fa-solid fa-database"></i> Dados e segurança

- Dados de perfil e cosméticos são associados ao usuário autenticado no Supabase.
- Chaves locais utilizam sufixo de usuário quando aplicável, evitando compartilhamento de estado entre contas.
- Visitantes podem ver as vitrines, mas recursos de reprodução, leitura, progresso, perfil, comunidade, jogos, loja e administração exigem autenticação.
- Mantenha o terminal/servidor em execução enquanto usar a versão local.

## <i class="fa-solid fa-scale-balanced"></i> Aviso legal

Este projeto é destinado a estudo e uso pessoal em ambiente local. Cada pessoa responsável pela execução deve respeitar os termos dos serviços integrados e a legislação aplicável ao conteúdo acessado.

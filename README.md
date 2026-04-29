# 🎬🍿 Anime House — Player Local

<p align="center">
  <img src="./assets/tryhard.png" alt="Anime House Logo" width="110" />
</p>

<p align="center">
  <strong>Plataforma pessoal para organizar, assistir e gamificar animes, desenhos, filmes, mangás e YouTube</strong><br />
  com autenticação, perfil de usuário, histórico, loja de cosméticos e integração com Supabase.
</p>

<p align="center">
  🎞️ Organizado &nbsp;•&nbsp; 🔐 Privado &nbsp;•&nbsp; ⚡ Local &nbsp;•&nbsp; 🎮 Gamificado
</p>

> 🔒 Projeto pensado para uso local e pessoal.

---

## ✨ O que o projeto oferece

- **Catálogos completos** para animes, desenhos, filmes, YouTube e mangás com busca, filtros e modais de detalhes.
- **Sistema de Episódios** com marcação de assistidos, barra de progresso por temporada e sincronismo de XP.
- **Sistema de XP e gamificação** calculado automaticamente pelas atividades do usuário (animes, filmes, mangás, YouTube).
- **SenseiMod Store** — loja interna onde XP pode ser convertido em Fichas de Ouro, Diamante e Esmeralda para comprar cosméticos exclusivos.
- **Cosméticos e customização de perfil**: banners, auras, títulos, coroa, frame dourado, tema cromático e muito mais.
- **Sistema de Temas Neon** com 10+ temas visuais (Dourado, Ciano, Verde, Vermelho, Roxo, Laranja, Azul, Branco, Verde Escuro, Aqua Verde, Cromático).
- **Histórico de uso** por usuário com busca, listagem por data e retomada de conteúdo.
- **Perfil de usuário** completo com dashboard de estatísticas, gráfico de saldo, XP total, nível e rank.
- **Área administrativa** (CRUD) para cadastro de animes, desenhos, filmes e YouTube com upload de capas.
- **Open Anime Agent** — IA integrada com chat, análise de imagem e duelo de personagens (Google Gemini).
- **Autenticação segura** com Supabase Auth (e-mail + OTP), isolamento de dados por usuário.
- **Deploy configurado** para Vercel com `vercel.json`.

---

## 🧰 Tecnologias usadas

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <br />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <br />
  <img src="https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=000" alt="dotenv" />
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  <img src="https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="VS Code" />
</p>

- **HTML, CSS & JavaScript** — stack frontal puro, sem frameworks
- **Node.js** — servidor local com proxy de IA e upload de arquivos
- **Supabase** — banco de dados, autenticação e armazenamento de perfis
- **Groq** — backend de IA de alta velocidade para o Open Anime Agent
- **Cloudflare** — proteção, CDN e roteamento de requisições
- **Dotenv** — gestão de variáveis de ambiente
- **Git & GitHub** — controle de versão

---

## ⚙️ Configuração

Configure o arquivo `.env` com as chaves necessárias antes de iniciar:

```env
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

---

## ▶️ Como rodar

```bash
node server.js
```

No Windows, você também pode usar:

```bat
iniciar.bat
```

Acesse: `http://localhost:3000`

---

## 🌐 Páginas e funcionalidades

| Página | Descrição |
|---|---|
| `index.html` | Portal principal com atalhos para catálogos e área de status do usuário |
| `login.html` / `registro.html` | Autenticação segura com Supabase Auth e confirmação por e-mail (OTP) |
| `perfil.html` | Dashboard completo: XP, nível, rank, estatísticas, histórico, cosméticos e inventário |
| `loja.html` | **SenseiMod Store** — troca XP por fichas e compra banners, auras, títulos, temas e mais |
| `animes.html` | Catálogo de animes com busca, filtros por estúdio/temporadas e favoritos |
| `catalogo-desenhos.html` | Catálogo de desenhos com cards, filtros e modal de detalhes |
| `anime-episodios.html` | Player de episódios com marcação de assistido e progresso por temporada |
| `desenhos.html` | Player de episódios de desenhos com barra de progresso |
| `filmes.html` | Catálogo e player de filmes com checklist de assistidos |
| `youtube.html` | Catálogo de playlists do YouTube |
| `youtube-videos.html` | Player de vídeos do YouTube com progresso |
| `mangas.html` | Leitor/organizador de mangás por volume com links externos |
| `open-anime.html` | **Open Anime Agent** — IA com chat, visão e comparação de personagens |
| `cadastro*.html` | CRUD administrativo para animes, desenhos, filmes e YouTube |
| `agradecimento.html` | Tela de créditos e agradecimentos |

---

## 🎮 Sistema de XP e SenseiMod Store

O XP é calculado automaticamente pelas atividades do usuário:

| Atividade | XP |
|---|---|
| Episódio de anime assistido | +10 XP |
| Episódio de desenho assistido | +10 XP |
| Volume de mangá lido | +15 XP |
| Filme assistido | +50 XP |
| Vídeo do YouTube assistido | +5 XP |

O XP pode ser convertido em **fichas** na SenseiMod Store para comprar cosméticos:

| Ficha | Custo | Requisito |
|---|---|---|
| 🥇 Ouro | 100 XP | Rank Prata |
| 💎 Diamante | 250 XP | Rank Mestre |
| 💚 Esmeralda | 500 XP | Rank Guardião |

**Ranks** (por nível): Bronze → Prata → Ouro → Mestre → Lenda → Guardião → Hokage → Imortal

---

## 🔌 API disponível (server.js)

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/data` | `GET` | Retorna os dados do sistema |
| `/api/save` | `POST` | Salva alterações no estado local |
| `/api/upload` | `POST` | Faz upload de imagem e retorna URL |
| `/api/ai/proxy` | `POST` | Proxy para o Google Gemini (chat, visão, comparação) |

---

## 📌 Observações

- O sistema foi projetado para execução local contínua; mantenha o terminal aberto.
- Dados de catálogos são persistidos em arquivos locais e sincronizados com Supabase.
- O isolamento de dados por usuário é feito via chaves de localStorage `{chave}_{userId}`.
- O sistema de cosméticos é persistido em `store_data` no perfil do Supabase.

---

## 📜 Aviso legal

Projeto voltado para estudo e uso pessoal em ambiente local. Respeite os termos de serviço e a legislação aplicável ao conteúdo acessado.

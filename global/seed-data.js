// seed-data.js — Dados para cadastro global em massa (Filtrado apenas para JoJo e Titã Simbiótico)
const SEED_ANIMES = [
  {
    nome: "JoJo's Bizarre Adventure",
    estudio: "David Production",
    genero: "Ação, Aventura, Fantasia, Sobrenatural",
    temporadas: 6,
    capa: "https://cdn.myanimelist.net/images/anime/3/40407l.jpg"
  }
];

const SEED_DESENHOS = [
  {
    nome: "Titã Simbiótico",
    produtora: "Cartoon Network",
    temporadas: 1
  }
];

const SEED_FILMES = [];
const SEED_MANGAS = [];
const SEED_HQS = [];

// Alias de busca no TMDB para evitar ambiguidade por nome local.
// Usado pela Fase 2 para encontrar a série correta.
const SEED_TMDB_SEARCH_ALIASES = {
  // Desenhos
  "Titã Simbiótico": "Sym-Bionic Titan",
  // Animes
  "JoJo's Bizarre Adventure": "JoJo's Bizarre Adventure"
};

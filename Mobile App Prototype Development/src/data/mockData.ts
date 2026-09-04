export type MediaType = 'anime' | 'desenho' | 'filme';
export type Rarity = 'comum' | 'raro' | 'épico' | 'lendário';
export type Currency = 'ouro' | 'diamante' | 'esmeralda';
export type ShopCategory = 'banners' | 'auras' | 'titulos' | 'temas' | 'cursores' | 'exclusivos';

export interface MediaItem {
  id: number;
  title: string;
  genre: string[];
  year: number;
  episodes: number;
  seasons: number;
  rating: number;
  colorA: string;
  colorB: string;
  synopsis: string;
  type: MediaType;
  dubbed?: boolean;
  subbed?: boolean;
}

export const animes: MediaItem[] = [
  { id: 1, title: "Fullmetal Alchemist: Brotherhood", genre: ["Ação", "Aventura", "Fantasia"], year: 2009, episodes: 64, seasons: 1, rating: 9.1, colorA: "#1a0800", colorB: "#7c3d00", synopsis: "Dois irmãos alquimistas buscam a Pedra Filosofal para recuperar seus corpos após uma transmutação humana proibida.", type: 'anime', dubbed: true, subbed: true },
  { id: 2, title: "Death Note", genre: ["Mistério", "Thriller", "Sobrenatural"], year: 2006, episodes: 37, seasons: 1, rating: 8.9, colorA: "#08081a", colorB: "#2a1860", synopsis: "Um estudante gênio encontra um caderno capaz de matar qualquer pessoa cujo nome for escrito nele.", type: 'anime', dubbed: true, subbed: true },
  { id: 3, title: "Steins;Gate", genre: ["Sci-Fi", "Thriller", "Drama"], year: 2011, episodes: 24, seasons: 1, rating: 9.0, colorA: "#051505", colorB: "#165216", synopsis: "Um cientista amador descobre como enviar mensagens ao passado e enfrenta as consequências de alterar a história.", type: 'anime', dubbed: false, subbed: true },
  { id: 4, title: "Code Geass", genre: ["Ação", "Mecha", "Drama"], year: 2006, episodes: 25, seasons: 2, rating: 8.8, colorA: "#180008", colorB: "#680020", synopsis: "Um príncipe exilado obtém o poder do Geass e lidera uma rebelião contra o Império Britânico para libertar o Japão.", type: 'anime', dubbed: true, subbed: true },
  { id: 5, title: "Cowboy Bebop", genre: ["Ação", "Sci-Fi", "Space Opera"], year: 1998, episodes: 26, seasons: 1, rating: 8.9, colorA: "#180e00", colorB: "#4a2800", synopsis: "Caçadores de recompensas vagam pelo sistema solar em busca de fugitivos, tentando fugir de seus próprios passados.", type: 'anime', dubbed: true, subbed: true },
  { id: 6, title: "Mob Psycho 100", genre: ["Ação", "Comédia", "Sobrenatural"], year: 2016, episodes: 12, seasons: 3, rating: 8.7, colorA: "#08081a", colorB: "#003060", synopsis: "Um garoto com poderes psíquicos imensos tenta viver uma vida normal enquanto trabalha para um charlatão.", type: 'anime', dubbed: true, subbed: true },
  { id: 7, title: "Vinland Saga", genre: ["Ação", "Aventura", "Histórico"], year: 2019, episodes: 24, seasons: 2, rating: 8.8, colorA: "#0a1000", colorB: "#1c3800", synopsis: "Um jovem viking em busca de vingança embarca em uma jornada que o levará a questionar sua razão de existir.", type: 'anime', dubbed: false, subbed: true },
  { id: 8, title: "Jujutsu Kaisen", genre: ["Ação", "Sobrenatural", "Horror"], year: 2020, episodes: 24, seasons: 2, rating: 8.6, colorA: "#180010", colorB: "#580038", synopsis: "Um jovem ingere um dedo amaldiçoado e passa a hospedar o rei das maldições, tornando-se exorcista.", type: 'anime', dubbed: true, subbed: true },
  { id: 9, title: "My Hero Academia", genre: ["Ação", "Super-herói", "Escola"], year: 2016, episodes: 25, seasons: 7, rating: 7.9, colorA: "#001818", colorB: "#005050", synopsis: "Em um mundo de super-heróis, um garoto sem poderes recebe a habilidade do maior herói e persegue seu sonho.", type: 'anime', dubbed: true, subbed: true },
  { id: 10, title: "Naruto Shippuden", genre: ["Ação", "Aventura", "Ninja"], year: 2007, episodes: 500, seasons: 1, rating: 8.2, colorA: "#180a00", colorB: "#6b2400", synopsis: "Naruto Uzumaki cresce e continua sua jornada para se tornar Hokage, enfrentando novas ameaças ao mundo ninja.", type: 'anime', dubbed: true, subbed: true },
  { id: 11, title: "Chainsaw Man", genre: ["Ação", "Horror", "Sobrenatural"], year: 2022, episodes: 12, seasons: 1, rating: 8.5, colorA: "#180000", colorB: "#780000", synopsis: "Um jovem endividado se funde com seu diabo-cachorrinho e se torna Homem-Motosserra para pagar suas dívidas.", type: 'anime', dubbed: true, subbed: true },
  { id: 12, title: "Spy x Family", genre: ["Comédia", "Ação", "Família"], year: 2022, episodes: 25, seasons: 2, rating: 8.3, colorA: "#001810", colorB: "#003d25", synopsis: "Um espião monta uma família falsa sem saber que sua filha é telepata e sua esposa é uma assassina.", type: 'anime', dubbed: true, subbed: true },
  { id: 13, title: "Neon Genesis Evangelion", genre: ["Mecha", "Psicológico", "Drama"], year: 1995, episodes: 26, seasons: 1, rating: 8.5, colorA: "#001018", colorB: "#003050", synopsis: "Adolescentes pilotam robôs gigantes para proteger a Terra de criaturas chamadas Anjos no ano 2015.", type: 'anime', dubbed: false, subbed: true },
  { id: 14, title: "Solo Leveling", genre: ["Ação", "Fantasia", "RPG"], year: 2024, episodes: 12, seasons: 1, rating: 8.4, colorA: "#0a001a", colorB: "#320065", synopsis: "O caçador mais fraco do mundo desperta poderes ocultos após sobreviver a um dungeon impossível.", type: 'anime', dubbed: true, subbed: true },
  { id: 15, title: "Kaiju No. 8", genre: ["Ação", "Sci-Fi", "Monstros"], year: 2024, episodes: 12, seasons: 1, rating: 7.9, colorA: "#001810", colorB: "#004a2d", synopsis: "Um homem que sempre sonhou em combater kaijus acaba se tornando um deles, unindo as duas naturezas.", type: 'anime', dubbed: true, subbed: true },
  { id: 16, title: "Dan Da Dan", genre: ["Ação", "Comédia", "Sobrenatural"], year: 2024, episodes: 12, seasons: 1, rating: 8.2, colorA: "#150018", colorB: "#4a0060", synopsis: "Um garoto e uma garota com crenças opostas se unem ao descobrir que alienígenas e fantasmas são reais.", type: 'anime', dubbed: true, subbed: true },
];

export const desenhos: MediaItem[] = [
  { id: 101, title: "Avatar: A Lenda de Aang", genre: ["Aventura", "Fantasia", "Ação"], year: 2005, episodes: 61, seasons: 3, rating: 9.2, colorA: "#001810", colorB: "#004d3d", synopsis: "Um menino mestre dos quatro elementos deve salvar o mundo do domínio da belicosa Nação do Fogo.", type: 'desenho' },
  { id: 102, title: "Batman: The Animated Series", genre: ["Ação", "Crime", "Super-herói"], year: 1992, episodes: 85, seasons: 4, rating: 8.7, colorA: "#050510", colorB: "#151535", synopsis: "As aventuras do Cavaleiro das Trevas em Gotham City, enfrentando seus mais icônicos vilões.", type: 'desenho' },
  { id: 103, title: "Teen Titans", genre: ["Ação", "Comédia", "Super-herói"], year: 2003, episodes: 65, seasons: 5, rating: 8.1, colorA: "#0a001a", colorB: "#2d0060", synopsis: "Cinco jovens super-heróis protegem a cidade e lidam com os dilemas típicos da adolescência.", type: 'desenho' },
  { id: 104, title: "Gravity Falls", genre: ["Mistério", "Comédia", "Aventura"], year: 2012, episodes: 40, seasons: 2, rating: 8.8, colorA: "#001218", colorB: "#004048", synopsis: "Gêmeos descobrem segredos paranormais em uma cidadezinha estranha durante o verão.", type: 'desenho' },
  { id: 105, title: "Samurai Jack", genre: ["Ação", "Aventura", "Fantasia"], year: 2001, episodes: 62, seasons: 5, rating: 8.5, colorA: "#100500", colorB: "#401a00", synopsis: "Um samurai enviado ao futuro distópico deve encontrar um portal para o passado e derrotar o mal.", type: 'desenho' },
  { id: 106, title: "Tartarugas Ninja", genre: ["Ação", "Comédia", "Aventura"], year: 1987, episodes: 193, seasons: 10, rating: 7.8, colorA: "#001500", colorB: "#004000", synopsis: "Quatro tartarugas mutantes treinadas em ninjutsu protegem Nova York contra o Clã do Pé.", type: 'desenho' },
];

export const filmes: MediaItem[] = [
  { id: 201, title: "Akira", genre: ["Sci-Fi", "Ação", "Distopia"], year: 1988, episodes: 1, seasons: 1, rating: 8.0, colorA: "#050010", colorB: "#1a003d", synopsis: "Em Neo-Tokyo 2019, um motoqueiro descobre poderes psíquicos devastadores após um acidente.", type: 'filme' },
  { id: 202, title: "A Viagem de Chihiro", genre: ["Aventura", "Fantasia", "Família"], year: 2001, episodes: 1, seasons: 1, rating: 8.6, colorA: "#001218", colorB: "#004d4d", synopsis: "Uma garota fica presa em um mundo de espíritos e deve trabalhar em uma casa de banhos para salvar seus pais.", type: 'filme' },
  { id: 203, title: "Your Name", genre: ["Romance", "Drama", "Sobrenatural"], year: 2016, episodes: 1, seasons: 1, rating: 8.4, colorA: "#0a001a", colorB: "#280060", synopsis: "Dois adolescentes descobrem que trocam de corpo enquanto dormem e tentam se encontrar.", type: 'filme' },
  { id: 204, title: "Perfect Blue", genre: ["Psicológico", "Thriller", "Drama"], year: 1997, episodes: 1, seasons: 1, rating: 8.0, colorA: "#00051a", colorB: "#00196b", synopsis: "Uma idol pop abandona a música para atuar e começa a perder a sanidade enquanto é perseguida.", type: 'filme' },
  { id: 205, title: "Princess Mononoke", genre: ["Aventura", "Fantasia", "Ação"], year: 1997, episodes: 1, seasons: 1, rating: 8.3, colorA: "#051005", colorB: "#153015", synopsis: "Um jovem príncipe busca a cura para uma maldição e se vê no meio do conflito entre humanos e a floresta.", type: 'filme' },
];

export interface ShopItem {
  id: number;
  name: string;
  category: ShopCategory;
  price: number;
  currency: Currency;
  rarity: Rarity;
  colorA: string;
  colorB: string;
  description: string;
  owned?: boolean;
  equipped?: boolean;
}

export const shopItems: ShopItem[] = [
  { id: 1, name: "Banner: Galáxia Neon", category: "banners", price: 500, currency: "ouro", rarity: "raro", colorA: "#0a0015", colorB: "#3d00a0", description: "Um banner cósmico com nebulosas vibrantes e estrelas neon.", owned: false },
  { id: 2, name: "Banner: Cidade Cyberpunk", category: "banners", price: 2, currency: "diamante", rarity: "épico", colorA: "#000a15", colorB: "#00304d", description: "Arranha-céus neon em uma noite de chuva futurista.", owned: false },
  { id: 3, name: "Banner: Oceano Profundo", category: "banners", price: 800, currency: "ouro", rarity: "comum", colorA: "#000518", colorB: "#001840", description: "Abismos azulados com bioluminescência suave.", owned: false },
  { id: 4, name: "Aura: Neon Cyan", category: "auras", price: 300, currency: "ouro", rarity: "comum", colorA: "#004040", colorB: "#00ffff", description: "Uma aura brilhante em ciano elétrico ao redor do seu avatar.", owned: true, equipped: true },
  { id: 5, name: "Aura: Chamas Violetas", category: "auras", price: 1, currency: "esmeralda", rarity: "lendário", colorA: "#1a0030", colorB: "#8000ff", description: "Labaredas místicas em tom violeta profundo.", owned: false },
  { id: 6, name: "Aura: Aurora Boreal", category: "auras", price: 1, currency: "diamante", rarity: "épico", colorA: "#001a10", colorB: "#00804d", description: "As luzes do norte dançam ao redor do seu perfil.", owned: false },
  { id: 7, name: "Título: Mestre das Listas", category: "titulos", price: 800, currency: "ouro", rarity: "épico", colorA: "#1a0a00", colorB: "#805000", description: "Para quem controlou cada lista, temporada e episódio.", owned: true, equipped: true },
  { id: 8, name: "Título: Maratonista VIP", category: "titulos", price: 1, currency: "diamante", rarity: "raro", colorA: "#0a001a", colorB: "#400080", description: "O reconhecimento supremo de quem nunca pausa.", owned: false },
  { id: 9, name: "Título: Imortal", category: "titulos", price: 2, currency: "esmeralda", rarity: "lendário", colorA: "#1a1000", colorB: "#806000", description: "Título reservado para os lendários da plataforma.", owned: false },
  { id: 10, name: "Tema: Dark Neon", category: "temas", price: 1500, currency: "ouro", rarity: "épico", colorA: "#001a1a", colorB: "#006060", description: "Interface completamente redesenhada com neons vibrantes.", owned: true, equipped: false },
  { id: 11, name: "Tema: Lava Profunda", category: "temas", price: 2, currency: "diamante", rarity: "lendário", colorA: "#1a0000", colorB: "#800000", description: "Tons escarlates e magma fundido em cada canto.", owned: false },
  { id: 12, name: "Cursor: Katana", category: "cursores", price: 200, currency: "ouro", rarity: "comum", colorA: "#0a0a0a", colorB: "#303030", description: "Seu cursor vira uma katana reluzente.", owned: false },
  { id: 13, name: "Cursor: Kunai", category: "cursores", price: 400, currency: "ouro", rarity: "raro", colorA: "#050508", colorB: "#15151f", description: "Velocidade ninja em cada movimento do mouse.", owned: false },
  { id: 14, name: "Badge: Zenkai Original", category: "exclusivos", price: 5, currency: "diamante", rarity: "lendário", colorA: "#100010", colorB: "#400040", description: "Concedida apenas aos membros fundadores da plataforma.", owned: false },
];

export interface CommunityUser {
  id: number;
  username: string;
  handle: string;
  level: number;
  xp: number;
  followers: number;
  banner: string | null;
  aura: string | null;
  title: string | null;
  isVip: boolean;
  isOnline: boolean;
  isMe: boolean;
  avatarColor: string;
}

export const communityUsers: CommunityUser[] = [
  { id: 1, username: "Visel e Davizera", handle: "@viseldavizera_", level: 9999, xp: 199999999946, followers: 4, banner: "galaxy", aura: "cyan", title: "Mestre das Listas", isVip: true, isOnline: true, isMe: true, avatarColor: "#2d0a6b" },
  { id: 2, username: "dvyeaeger", handle: "@dvyeaeger", level: 12, xp: 1240, followers: 3, banner: null, aura: null, title: null, isVip: false, isOnline: true, isMe: false, avatarColor: "#0a2d6b" },
  { id: 3, username: "bonolenov", handle: "@bonolenov", level: 8, xp: 820, followers: 2, banner: null, aura: null, title: null, isVip: false, isOnline: false, isMe: false, avatarColor: "#1a5c1a" },
  { id: 4, username: "davimoratorio7", handle: "@davimoratorio7", level: 5, xp: 450, followers: 1, banner: null, aura: null, title: null, isVip: false, isOnline: false, isMe: false, avatarColor: "#5c1a1a" },
  { id: 5, username: "semenssiedna", handle: "@semenssiedna", level: 1, xp: 0, followers: 0, banner: null, aura: null, title: null, isVip: false, isOnline: false, isMe: false, avatarColor: "#1a3a5c" },
  { id: 6, username: "Visel SKS", handle: "@sksvisel", level: 1, xp: 0, followers: 0, banner: null, aura: null, title: null, isVip: false, isOnline: false, isMe: false, avatarColor: "#3a1a5c" },
];

export const chatMessages = [
  { id: 1, from: "dvyeaeger", to: "Visel e Davizera", text: "eae coco", time: "11:32", date: "30/08" },
  { id: 2, from: "Visel e Davizera", to: "dvyeaeger", text: "oi davi vc vai na vo hoje", time: "11:33", date: "30/08" },
  { id: 3, from: "dvyeaeger", to: "Visel e Davizera", text: "sim, mais tarde", time: "11:35", date: "30/08" },
];

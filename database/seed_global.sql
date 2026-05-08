-- ==========================================================
-- 🟢 ANIME HOUSE - SCRIPT DE POPULAÇÃO GLOBAL (SQL)
-- ==========================================================
-- Este script popula o catálogo base do site como "Global" (user_id = NULL).
-- Rodar este script no SQL Editor do Supabase Dashboard.

-- 1. LIMPEZA (Opcional - Remova o comentário se quiser limpar o catálogo antes)
-- TRUNCATE TABLE episodes, anime_episodes, anime_movies, movies, cartoons, animes, mangas, hqs, filmes RESTART IDENTITY;

-- 2. CADASTRO DE DESENHOS (Cartoons)
INSERT INTO cartoons (id, nome, produtora, temporadas, user_id) VALUES
('c_1', 'Apenas um Show', 'Cartoon Network', 8, NULL),
('c_2', 'Hora de Aventura', 'Cartoon Network', 10, NULL),
('c_3', 'O Incrível Mundo de Gumball', 'Cartoon Network', 6, NULL),
('c_4', 'Steven Universe', 'Cartoon Network', 6, NULL),
('c_5', 'Jovens Titãs', 'Cartoon Network', 5, NULL),
('c_6', 'Ben 10', 'Cartoon Network', 4, NULL),
('c_7', 'As Meninas Superpoderosas', 'Cartoon Network', 6, NULL),
('c_8', 'O Laboratório de Dexter', 'Cartoon Network', 4, NULL),
('c_9', 'Samurai Jack', 'Cartoon Network', 5, NULL),
('c_10', 'Coragem, o Cão Covarde', 'Cartoon Network', 4, NULL),
('c_11', 'KND: A Turma do Bairro', 'Cartoon Network', 6, NULL),
('c_12', 'Du, Dudu e Edu', 'Cartoon Network', 6, NULL),
('c_13', 'Mutante Rex', 'Cartoon Network', 3, NULL),
('c_14', 'Mansão Foster para Amigos Imaginários', 'Cartoon Network', 6, NULL),
('c_15', 'As Terríveis Aventuras de Billy e Mandy', 'Cartoon Network', 6, NULL),
('c_16', 'Chowder', 'Cartoon Network', 3, NULL),
('c_17', 'Johnny Bravo', 'Cartoon Network', 4, NULL),
('c_18', 'A Vaca e o Frango', 'Cartoon Network', 4, NULL),
('c_19', 'O Segredo Além do Jardim', 'Cartoon Network', 1, NULL),
('c_20', 'Trem Infinito', 'Cartoon Network', 4, NULL),
('c_21', 'Acampamento de Verão', 'Cartoon Network', 6, NULL),
('c_22', 'Craig do Riacho', 'Cartoon Network', 5, NULL),
('c_23', 'Vilanesco', 'Cartoon Network', 1, NULL),
('c_24', 'As Trapalhadas de Flapjack', 'Cartoon Network', 3, NULL), -- Substituto
('c_25', 'Ursos sem Curso', 'Cartoon Network', 4, NULL),         -- Substituto
('c_26', 'Bob Esponja', 'Nickelodeon', 14, NULL),
('c_27', 'Avatar: A Lenda de Aang', 'Nickelodeon', 3, NULL),
('c_28', 'A Lenda de Korra', 'Nickelodeon', 4, NULL),
('c_29', 'Danny Phantom', 'Nickelodeon', 3, NULL),
('c_30', 'Invasor Zim', 'Nickelodeon', 2, NULL),
('c_31', 'A Vida Moderna de Rocko', 'Nickelodeon', 4, NULL),
('c_32', 'Tartarugas Ninja (2012)', 'Nickelodeon', 5, NULL),
('c_33', 'Invencível', 'Amazon Prime', 3, NULL),
('c_34', 'Lego Ninjago', 'Cartoon Network', 15, NULL),
('c_35', 'Ben 10: Força Alienígena', 'Cartoon Network', 3, NULL),
('c_36', 'Ben 10: Supremacia Alienígena', 'Cartoon Network', 3, NULL),
('c_37', 'Ben 10: Omniverse', 'Cartoon Network', 8, NULL),
('c_38', 'Batman: A Série Animada', 'Cartoon Network', 4, NULL),
('c_39', 'Liga da Justiça', 'Cartoon Network', 2, NULL),
('c_40', 'Liga da Justiça Sem Limites', 'Cartoon Network', 3, NULL),
('c_41', 'Super Choque', 'Cartoon Network', 4, NULL)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, produtora = EXCLUDED.produtora, temporadas = EXCLUDED.temporadas;

-- 3. CADASTRO DE ANIMES GLOBAIS
INSERT INTO animes (id, nome, estudio, genero, temporadas, capa, user_id) VALUES
('a_1', 'Fullmetal Alchemist: Brotherhood', 'Bones', 'Ação, Aventura', 1, 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg', NULL),
('a_2', 'Death Note', 'Madhouse', 'Suspense', 1, 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', NULL),
('a_3', 'Shingeki no Kyojin', 'Wit Studio', 'Ação, Drama', 4, 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', NULL),
('a_4', 'Hunter x Hunter', 'Madhouse', 'Ação, Aventura', 1, 'https://cdn.myanimelist.net/images/anime/1337/99013l.jpg', NULL),
('a_5', 'Naruto Shippuden', 'Pierrot', 'Ação, Aventura', 1, 'https://cdn.myanimelist.net/images/anime/5/17407l.jpg', NULL),
('a_6', 'Dragon Ball Super', 'Toei Animation', 'Ação, Aventura', 1, 'https://cdn.myanimelist.net/images/anime/7/74606l.jpg', NULL),
('a_7', 'One Punch Man', 'Madhouse', 'Ação, Comédia', 2, 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', NULL),
('a_8', 'Mob Psycho 100', 'Bones', 'Ação, Comédia', 3, 'https://cdn.myanimelist.net/images/anime/8/80356l.jpg', NULL),
('a_9', 'Vinland Saga', 'Wit Studio', 'Ação, Drama', 2, 'https://cdn.myanimelist.net/images/anime/1500/103005l.jpg', NULL),
('a_10', 'Jujutsu Kaisen', 'MAPPA', 'Ação, Sobrenatural', 2, 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg', NULL),
('a_11', 'Demon Slayer', 'ufotable', 'Ação, Sobrenatural', 4, 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', NULL),
('a_12', 'My Hero Academia', 'Bones', 'Ação, Super Poderes', 7, 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg', NULL),
('a_13', 'Bleach: Thousand-Year Blood War', 'Pierrot', 'Ação', 3, 'https://cdn.myanimelist.net/images/anime/1908/135431l.jpg', NULL),
('a_14', 'Chainsaw Man', 'MAPPA', 'Ação, Terror', 1, 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg', NULL),
('a_15', 'Oshi no Ko', 'Doga Kobo', 'Drama', 2, 'https://cdn.myanimelist.net/images/anime/1812/134736l.jpg', NULL),
('a_16', 'Blue Lock', '8bit', 'Esportes', 2, 'https://cdn.myanimelist.net/images/anime/1258/126929l.jpg', NULL),
('a_17', 'Solo Leveling', 'A-1 Pictures', 'Ação, Fantasia', 1, 'https://cdn.myanimelist.net/images/anime/1908/141575l.jpg', NULL)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, estudio = EXCLUDED.estudio, genero = EXCLUDED.genero, temporadas = EXCLUDED.temporadas, capa = EXCLUDED.capa;

-- 4. CADASTRO DE FILMES GLOBAIS
INSERT INTO filmes (id, nome, ano, genero, diretor, capa, iframe, user_id) VALUES
('f_1', 'A Viagem de Chihiro', 2001, 'Fantasia', 'Hayao Miyazaki', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', ' ', NULL),
('f_2', 'Your Name', 2016, 'Romance', 'Makoto Shinkai', 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', ' ', NULL),
('f_3', 'Batman: O Cavaleiro das Trevas', 2008, 'Ação', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', ' ', NULL),
('f_4', 'Interestelar', 2014, 'Ficção Científica', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/gEU2QniE77NI6lCU6MxlNBvIx.jpg', ' ', NULL),
('f_5', 'Duna: Parte Dois', 2024, 'Ficção Científica', 'Denis Villeneuve', 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', ' ', NULL),
('f_6', 'Vingadores: Ultimato', 2019, 'Ação', 'Russo Brothers', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', ' ', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. CADASTRO DE MANGÁS GLOBAIS
INSERT INTO mangas (id, nome, autor, capitulos, capa, user_id) VALUES
('m_1', 'Berserk', 'Kentaro Miura', 374, 'https://cdn.myanimelist.net/images/manga/1/157897l.jpg', NULL),
('m_2', 'Vagabond', 'Takehiko Inoue', 327, 'https://cdn.myanimelist.net/images/manga/2/181787l.jpg', NULL),
('m_3', 'Naruto', 'Masashi Kishimoto', 700, 'https://cdn.myanimelist.net/images/manga/3/249658l.jpg', NULL),
('m_4', 'Dragon Ball', 'Akira Toriyama', 520, 'https://cdn.myanimelist.net/images/manga/1/267793l.jpg', NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. CADASTRO DE HQS GLOBAIS
INSERT INTO hqs (id, nome, capa, user_id) VALUES
('hq_1', 'Batman: O Cavaleiro das Trevas', 'https://upload.wikimedia.org/wikipedia/en/8/8c/Dark_knight_returns.jpg', NULL),
('hq_2', 'Watchmen', 'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg', NULL),
('hq_3', 'Sandman', 'https://upload.wikimedia.org/wikipedia/en/f/f4/Sandman_1_-_comics.jpg', NULL),
('hq_4', 'Batman: A Piada Mortal', 'https://upload.wikimedia.org/wikipedia/en/a/a6/The_Killing_Joke.jpg', NULL)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 🔵 MEGA POPULAÇÃO DE EPISÓDIOS (AUTO-GERADO VIA LOOP SQL)
-- ==========================================================

DO $$
BEGIN
    -- ANIME: Hunter x Hunter (148 Episódios)
    FOR i IN 1..148 LOOP
        INSERT INTO anime_episodes (id, anime_id, idioma, temporada, ep_number, title, iframe, user_id)
        VALUES ('ae_hxh_' || i, 'a_4', 'dublado', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- ANIME: Naruto Shippuden (500 Episódios)
    FOR i IN 1..500 LOOP
        INSERT INTO anime_episodes (id, anime_id, idioma, temporada, ep_number, title, iframe, user_id)
        VALUES ('ae_naruto_' || i, 'a_5', 'dublado', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- ANIME: Dragon Ball Super (131 Episódios)
    FOR i IN 1..131 LOOP
        INSERT INTO anime_episodes (id, anime_id, idioma, temporada, ep_number, title, iframe, user_id)
        VALUES ('ae_dbs_' || i, 'a_6', 'dublado', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- ANIME: Demon Slayer (55 Episódios aprox)
    FOR i IN 1..55 LOOP
        INSERT INTO anime_episodes (id, anime_id, idioma, temporada, ep_number, title, iframe, user_id)
        VALUES ('ae_ds_' || i, 'a_11', 'dublado', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- DESENHO: Apenas um Show (261 Episódios)
    FOR i IN 1..261 LOOP
        INSERT INTO episodes (id, cartoon_id, temporada, ep_number, title, iframe, user_id)
        VALUES ('e_regshow_' || i, 'c_1', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- DESENHO: Hora de Aventura (283 Episódios)
    FOR i IN 1..283 LOOP
        INSERT INTO episodes (id, cartoon_id, temporada, ep_number, title, iframe, user_id)
        VALUES ('e_advtime_' || i, 'c_2', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- DESENHO: Ben 10 (52 Episódios aprox)
    FOR i IN 1..52 LOOP
        INSERT INTO episodes (id, cartoon_id, temporada, ep_number, title, iframe, user_id)
        VALUES ('e_ben10_' || i, 'c_6', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- DESENHO: Bob Esponja (300 Episódios aprox)
    FOR i IN 1..300 LOOP
        INSERT INTO episodes (id, cartoon_id, temporada, ep_number, title, iframe, user_id)
        VALUES ('e_spongebob_' || i, 'c_26', '1', i, 'Episódio ' || i, 'Pendente', NULL)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

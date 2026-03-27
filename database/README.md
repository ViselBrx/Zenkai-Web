# Database Guide

## Ordem Recomendada (Setup Completo)

1. `schema/01_core_schema.sql`
2. `schema/02_filmes_schema.sql`
3. `schema/03_profiles_schema.sql`
4. `storage/01_capas_bucket.sql`
5. `storage/02_avatars_bucket.sql`
6. `schema/04_manga_volumes_and_storage.sql`
7. `schema/05_manga_notes.sql`
8. `schema/06_watch_history.sql`
9. `schema/07_ai_chat_history.sql`
10. `migrations/01_user_isolation.sql` (recomendado para isolamento por usuário)

## Opcionais (Correções)

- `fixes/01_fix_localhost_capas.sql`
- `fixes/02_rls_ai_config.sql`

## Estrutura

- `schema/`: criação de tabelas e policies principais
- `storage/`: criação de buckets e policies de storage
- `migrations/`: mudanças estruturais evolutivas
- `fixes/`: ajustes pontuais de base já existente

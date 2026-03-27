# Scripts Guide

## migrations/

- `migrate_data_to_supabase.js`: migração inicial do `data/data.json` para Supabase
- `sync_missing_data.js`: sincroniza campos faltantes na base remota

## maintenance/

- `fix_data_json_domains.js`: corrige domínios antigos no `data/data.json`
- `fix_supabase_iframe_domains.js`: corrige domínios de iframe no Supabase
- `seed_ai_key_setting.js`: grava configuração inicial de IA na tabela `settings`
- `apply_watermark_to_pages.js`: aplica watermark em arquivos de `pages/`

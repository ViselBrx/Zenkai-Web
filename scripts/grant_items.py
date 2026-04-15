"""
grant_items.py
==============
Script para adicionar 1000 ouros, 1000 diamantes, 1000 esmeraldas
e desbloquear todas as patentes para a conta davizeravisel@gmail.com.

User ID identificado: 3c9d9fee-d39a-4e66-8e90-b232d9e74e0a
Username: Visel e Davizera (conta principal com XP 8500)
"""

import json
import requests

SUPABASE_URL = "https://bxifddhrbxbmimjkgwzr.supabase.co"
SUPABASE_SERVICE_KEY = "sb_secret_Cr0BzLecxWabufFasf0kQg_xJtI5VsM"

# User ID da conta davizeravisel@gmail.com
TARGET_USER_ID = "3c9d9fee-d39a-4e66-8e90-b232d9e74e0a"

# Todas as patentes disponíveis no sistema
ALL_RANKS = ["Bronze", "Prata", "Ouro", "Mestre", "Lenda", "Hokage", "Guardião", "Imortal"]

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get_profile(user_id):
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*"
    resp = requests.get(url, headers=HEADERS)
    data = resp.json()
    return data[0] if data else None

def update_store_data(user_id, new_store_data):
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
    payload = {"store_data": new_store_data}
    resp = requests.patch(url, headers=HEADERS, json=payload)
    return resp.json()

def main():
    print("🔗 Conectando ao Supabase (service role)...")
    
    print(f"📋 Buscando perfil do usuário {TARGET_USER_ID}...")
    profile = get_profile(TARGET_USER_ID)
    
    if not profile:
        print("❌ Perfil não encontrado!")
        return
    
    current_store = profile.get("store_data") or {}
    
    print(f"✅ Perfil encontrado: {profile.get('username', 'N/A')}")
    print(f"   Estado atual:")
    print(f"   - Ouro: {current_store.get('ouro', 0)}")
    print(f"   - Diamante: {current_store.get('diamante', 0)}")
    print(f"   - Esmeralda: {current_store.get('esmeralda', 0)}")
    print(f"   - XP: {current_store.get('xp', 0)}")
    print(f"   - Rank: {current_store.get('rank', 'N/A')}")
    print(f"   - Purchased: {current_store.get('purchased', [])}")
    print(f"   - Patentes desbloqueadas: {current_store.get('unlocked_ranks', [])}")
    
    # Construir o novo store_data preservando XP e itens existentes
    new_store = dict(current_store)
    
    # Adicionar 1000 de cada ficha (preservando o que já existe)
    current_ouro = int(current_store.get("ouro", 0) or 0)
    current_diamante = int(current_store.get("diamante", 0) or 0)
    current_esmeralda = int(current_store.get("esmeralda", 0) or 0)
    current_xp = current_store.get("xp", 0)  # XP não muda!
    
    new_store["ouro"] = current_ouro + 1000
    new_store["diamante"] = current_diamante + 1000
    new_store["esmeralda"] = current_esmeralda + 1000
    new_store["xp"] = current_xp  # XP permanece igual
    
    # Desbloquear todas as patentes via campo especial
    new_store["unlocked_ranks"] = ALL_RANKS
    
    # Preservar purchased e equipped existentes
    if "purchased" not in new_store:
        new_store["purchased"] = []
    if "equipped" not in new_store:
        new_store["equipped"] = {}
    
    print(f"\n🎁 Aplicando mudanças:")
    print(f"   - Ouro: {current_ouro} → {new_store['ouro']} (+1000)")
    print(f"   - Diamante: {current_diamante} → {new_store['diamante']} (+1000)")
    print(f"   - Esmeralda: {current_esmeralda} → {new_store['esmeralda']} (+1000)")
    print(f"   - XP: {current_xp} (sem alteração)")
    print(f"   - Patentes desbloqueadas: {ALL_RANKS}")
    
    # Atualizar no banco
    result = update_store_data(TARGET_USER_ID, new_store)
    
    if result and isinstance(result, list) and len(result) > 0:
        updated = result[0].get("store_data", {})
        print(f"\n✅ Dados atualizados com sucesso!")
        print(f"   Confirmação:")
        print(f"   - Ouro: {updated.get('ouro', 'N/A')}")
        print(f"   - Diamante: {updated.get('diamante', 'N/A')}")
        print(f"   - Esmeralda: {updated.get('esmeralda', 'N/A')}")
        print(f"   - XP: {updated.get('xp', 'N/A')}")
        print(f"   - Patentes: {updated.get('unlocked_ranks', [])}")
    else:
        print(f"\n⚠️ Resultado: {result}")
        # Verificar se foi salvo mesmo assim
        print("🔍 Verificando estado atual no banco...")
        profile_check = get_profile(TARGET_USER_ID)
        if profile_check:
            store_check = profile_check.get("store_data", {})
            print(f"   - Ouro atual: {store_check.get('ouro', 'N/A')}")
            print(f"   - Diamante atual: {store_check.get('diamante', 'N/A')}")
            print(f"   - Esmeralda atual: {store_check.get('esmeralda', 'N/A')}")
            print(f"   - XP atual: {store_check.get('xp', 'N/A')}")
            print(f"   - Patentes: {store_check.get('unlocked_ranks', [])}")

if __name__ == "__main__":
    main()

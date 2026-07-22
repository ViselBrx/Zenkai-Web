# 1. Replace emoji in perfil.html
$perfilPath = "c:\Users\enzot\Desktop\Anime-House-Web\perfil.html"
$perfilContent = [System.IO.File]::ReadAllText($perfilPath, [System.Text.Encoding]::UTF8)
$emojiStr = 'icon: "' + [char]0xD83C + [char]0xDF85 + '"'
$imgStr = 'icon: "<img src=''assets/gorrodenatal.png'' style=''width: 1em; height: 1em; object-fit: contain; vertical-align: text-bottom;''>"'

if ($perfilContent.Contains($emojiStr)) {
    $perfilContent = $perfilContent.Replace($emojiStr, $imgStr)
    Write-Host "Replaced emoji in perfil.html"
}

# 2. Add window.updateCursorEffect() inside toggleEquipItem in perfil.html
$oldToggleEnd = "            updateItemCardVisual(id, newState, type);`r`n            updateEquippedPanel();`r`n            if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`r`n          };"
$newToggleEnd = "            updateItemCardVisual(id, newState, type);`r`n            updateEquippedPanel();`r`n            if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`r`n            if (window.updateCursorEffect) window.updateCursorEffect();`r`n          };"

$oldToggleEnd2 = "            updateItemCardVisual(id, newState, type);`n            updateEquippedPanel();`n            if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`n          };"
$newToggleEnd2 = "            updateItemCardVisual(id, newState, type);`n            updateEquippedPanel();`n            if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`n            if (window.updateCursorEffect) window.updateCursorEffect();`n          };"

if ($perfilContent.Contains($oldToggleEnd)) {
    $perfilContent = $perfilContent.Replace($oldToggleEnd, $newToggleEnd)
    Write-Host "Injected updateCursorEffect in perfil.html (CRLF)"
} elseif ($perfilContent.Contains($oldToggleEnd2)) {
    $perfilContent = $perfilContent.Replace($oldToggleEnd2, $newToggleEnd2)
    Write-Host "Injected updateCursorEffect in perfil.html (LF)"
} else {
    Write-Host "Could not find toggle end in perfil.html!"
}
[System.IO.File]::WriteAllText($perfilPath, $perfilContent, [System.Text.Encoding]::UTF8)

# 3. Add window.updateCursorEffect() inside toggleEquip in compras.html
$comprasPath = "c:\Users\enzot\Desktop\Anime-House-Web\compras.html"
$comprasContent = [System.IO.File]::ReadAllText($comprasPath, [System.Text.Encoding]::UTF8)

$oldComprasEnd = "                updateItemUI(id, newState, type);`r`n                if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`r`n            };"
$newComprasEnd = "                updateItemUI(id, newState, type);`r`n                if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`r`n                if (window.updateCursorEffect) window.updateCursorEffect();`r`n            };"

$oldComprasEnd2 = "                updateItemUI(id, newState, type);`n                if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`n            };"
$newComprasEnd2 = "                updateItemUI(id, newState, type);`n                if (window.updateNavbarCosmetics) window.updateNavbarCosmetics();`n                if (window.updateCursorEffect) window.updateCursorEffect();`n            };"

if ($comprasContent.Contains($oldComprasEnd)) {
    $comprasContent = $comprasContent.Replace($oldComprasEnd, $newComprasEnd)
    Write-Host "Injected updateCursorEffect in compras.html (CRLF)"
} elseif ($comprasContent.Contains($oldComprasEnd2)) {
    $comprasContent = $comprasContent.Replace($oldComprasEnd2, $newComprasEnd2)
    Write-Host "Injected updateCursorEffect in compras.html (LF)"
} else {
    Write-Host "Could not find toggle end in compras.html!"
}
[System.IO.File]::WriteAllText($comprasPath, $comprasContent, [System.Text.Encoding]::UTF8)
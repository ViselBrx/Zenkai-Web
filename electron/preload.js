'use strict';

// preload.js — contexto isolado e seguro
// Expõe apenas o que for necessário para o renderer via contextBridge
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: process.versions.electron,
});

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabs = document.querySelectorAll('.ai-tab');
  const panels = document.querySelectorAll('.tool-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Config & API Keys
  const groqInp = document.getElementById('groqKey');
  const saveBtn = document.getElementById('saveApiKeys');

  function loadConfigs() {
    const config = DB.getAIConfig();
    if (config.groqKey) groqInp.value = config.groqKey;
  }
  loadConfigs();

  saveBtn.addEventListener('click', () => {
    DB.saveAIConfig({
      groqKey: groqInp.value.trim(),
      provider: 'groq'
    });
    showToast('Chave Groq salva com sucesso!');
  });

  // Chat UI Elements
  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChat');

  // Proxy Calls
  async function callAI(prompt) {
    const config = DB.getAIConfig();
    const target = 'groq'; 
    const model = "llama-3.3-70b-versatile";

    try {
      const GROQ_API_KEY = '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';
      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          apiKey: GROQ_API_KEY,
          body: {
            model: model,
            messages: [{ role: "user", content: prompt }],
            stream: false
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      console.error(e);
      return `⚠️ Falha: ${e.message}. Verifique o terminal do servidor para mais detalhes.`;
    }
  }

  function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  sendBtn.addEventListener('click', async () => {
    const val = chatInput.value.trim();
    if (!val) return;
    
    appendMsg(val, 'user');
    chatInput.value = '';
    
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'msg bot';
    loadingMsg.textContent = '🧠 Pensando...';
    chatWindow.appendChild(loadingMsg);
    
    const response = await callAI(val);
    loadingMsg.remove();
    appendMsg(response, 'bot');
  });

  // Vision (Tesseract.js)
  const visionUpload = document.getElementById('visionUpload');
  const visionOutput = document.getElementById('visionOutput');

  visionUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    visionOutput.textContent = '📸 Analisando imagem...';
    try {
      const result = await Tesseract.recognize(file, 'por+eng', {
        logger: m => console.log(m)
      });
      visionOutput.innerHTML = `<strong>Texto Extraído:</strong><br><br>${result.data.text.replace(/\n/g, '<br>')}`;
    } catch (err) {
      visionOutput.textContent = '❌ Erro no OCR: ' + err.message;
    }
  });

  // Compare Characters
  const char1Inp = document.getElementById('char1');
  const char2Inp = document.getElementById('char2');
  const compareBtn = document.getElementById('compareBtn');
  const compareResult = document.getElementById('compareResult');

  compareBtn.addEventListener('click', async () => {
    const c1 = char1Inp.value.trim();
    const c2 = char2Inp.value.trim();
    if (!c1 || !c2) return showToast('Digite dois nomes para comparar', 'error');

    compareResult.style.display = 'block';
    compareResult.innerHTML = '⚖️ Analisando poderes, história e habilidades...';
    
    const prompt = `Faça uma comparação detalhada entre os personagens de anime/desenho ${c1} e ${c2}. Analise Força, Inteligência, Habilidades Especiais e diga quem venceria em um duelo épico e por quê.`;
    const analysis = await callAI(prompt);
    compareResult.innerHTML = `<strong>Análise de Combate:</strong><br><br>${analysis.replace(/\n/g, '<br>')}`;
  });

});

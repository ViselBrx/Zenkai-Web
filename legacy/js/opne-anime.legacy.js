document.addEventListener('DOMContentLoaded', async () => {
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

  const groqInp = document.getElementById('groqKey');
  const saveBtn = document.getElementById('saveApiKeys');

  async function loadConfigs() {
    let isAdmin = false;
    if (window.supabaseClient) {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      isAdmin = user?.email === 'davizeravisel@gmail.com';
    }

    const apiKeyCard = document.getElementById('apiKeyCard');
    if (apiKeyCard && !isAdmin) {
      apiKeyCard.style.display = 'none';
    }

    const config = DB.getAIConfig();
    if (config.groqKey && groqInp) groqInp.value = config.groqKey;
  }

  loadConfigs();

  saveBtn.addEventListener('click', () => {
    DB.saveAIConfig({
      groqKey: groqInp.value.trim(),
      provider: 'groq'
    });
    showToast('Chave Groq salva com sucesso!');
  });

  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChat');

  async function callAI(prompt) {
    const target = 'groq';
    const model = 'llama-3.3-70b-versatile';

    try {
      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          body: {
            model,
            messages: [{ role: 'user', content: prompt }],
            stream: false
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
    } catch (e) {
      console.error(e);
      return `Falha: ${e.message}. Verifique o terminal do servidor para mais detalhes.`;
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
    loadingMsg.textContent = 'Pensando...';
    chatWindow.appendChild(loadingMsg);

    const response = await callAI(val);
    loadingMsg.remove();
    appendMsg(response, 'bot');
  });

  const visionUpload = document.getElementById('visionUpload');
  const visionOutput = document.getElementById('visionOutput');

  visionUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    visionOutput.textContent = 'Analisando imagem com Cloudflare AI...';

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Falha ao ler a imagem.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'cloudflare-vision',
          body: {
            image: base64Image,
            prompt: 'Descreva a imagem em portugues. Extraia todo o texto visivel. Se houver pistas sobre a origem da imagem, cite apenas pistas visuais ou textuais sem inventar.',
            max_tokens: 512
          }
        })
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || `Erro HTTP ${res.status}`);
      }

      const description = result?.result?.description || result?.description || 'Nenhuma descricao retornada.';
      visionOutput.innerHTML = `<strong>Analise da imagem:</strong><br><br>${description.replace(/\n/g, '<br>')}`;
    } catch (err) {
      visionOutput.textContent = 'Erro na analise da imagem: ' + err.message;
    }
  });

  const char1Inp = document.getElementById('char1');
  const char2Inp = document.getElementById('char2');
  const compareBtn = document.getElementById('compareBtn');
  const compareResult = document.getElementById('compareResult');

  compareBtn.addEventListener('click', async () => {
    const c1 = char1Inp.value.trim();
    const c2 = char2Inp.value.trim();
    if (!c1 || !c2) return showToast('Digite dois nomes para comparar', 'error');

    compareResult.style.display = 'block';
    compareResult.innerHTML = 'Analisando poderes, historia e habilidades...';

    const prompt = `Faca uma comparacao detalhada entre os personagens de anime/desenho ${c1} e ${c2}. Analise forca, inteligencia, habilidades especiais e diga quem venceria em um duelo epico e por que.`;
    const analysis = await callAI(prompt);
    compareResult.innerHTML = `<strong>Analise de combate:</strong><br><br>${analysis.replace(/\n/g, '<br>')}`;
  });
});

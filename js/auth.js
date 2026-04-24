/**
 * js/auth.js — Configuração e Lógica do Supabase (LIMPO E ORGANIZADO)
 */

// 1. CREDENCIAIS
const SUPABASE_URL =
  window.ENV?.SUPABASE_URL || "https://bxifddhrbxbmimjkgwzr.supabase.co";
const SUPABASE_ANON_KEY =
  window.ENV?.SUPABASE_ANON_KEY ||
  "sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol";

// 2. Inicializa o cliente
let supaClient;
let previousSessionId = null;

if (window.supabase) {
  try {
    supaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    window.supabaseClient = supaClient;

    // 🚀 Redirecionar se já estiver logado (evitar registro/login duplicado)
    (async () => {
      const isAuthPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("registro.html");
      if (isAuthPage) {
        const { data: { session } } = await supaClient.auth.getSession();
        if (session) {
          window.location.href = "perfil.html";
        }
      }
    })();

    supaClient.auth.onAuthStateChange((event, session) => {
      console.log("🔔 [Auth Event]:", event, session?.user?.email);
      const currentSessionId = session?.user?.id || null;

      if (event === 'PASSWORD_RECOVERY') {
        // ... (código do modal de senha que já estava aqui)
        const modalHtml = `
          <div id="recoveryModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:9999; backdrop-filter:blur(5px);">
            <div style="background:var(--bg-card); padding:2.5rem; border-radius:16px; border:1px solid rgba(var(--primary-rgb),0.3); width:100%; max-width:400px; text-align:center; box-shadow:0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(var(--primary-rgb),0.2); animation: fadeInUp 0.4s ease forwards;">
              <h2 style="color:var(--primary); margin-bottom:0.5rem; font-family:'Bangers', cursive; font-size:2.5rem; letter-spacing:2px;">Nova Senha</h2>
              <p style="color:var(--text-muted); margin-bottom:1.5rem; font-size:0.95rem;">Digite sua nova senha abaixo.</p>
              <input type="password" id="recoveryNewPassword" placeholder="Mínimo 6 caracteres" style="width:100%; padding:14px; margin-bottom:1rem; background:var(--bg-surface); border:1px solid var(--border); border-radius:8px; color:var(--text-main); outline:none; font-size:1rem;" />
              <div id="recoveryError" style="color:var(--danger); background:rgba(239,68,68,0.1); border:1px solid var(--danger); border-radius:8px; padding:10px; font-size:0.85rem; margin-bottom:1rem; display:none;"></div>
              <button id="recoveryBtn" class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;">💾 Atualizar Senha</button>
            </div>
          </div>
        `;
        if(!document.getElementById('recoveryModal')) document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('recoveryBtn').addEventListener('click', async () => {
           const newPassword = document.getElementById('recoveryNewPassword').value;
           const errorDiv = document.getElementById('recoveryError');
           if (!newPassword || newPassword.length < 6) {
             errorDiv.textContent = "A senha deve ter pelo menos 6 caracteres.";
             errorDiv.style.display = "block";
             return;
           }
           errorDiv.style.display = "none";
           const btn = document.getElementById('recoveryBtn');
           btn.textContent = "Atualizando...";
           btn.disabled = true;

           const { error } = await supaClient.auth.updateUser({ password: newPassword });
           if (error) {
             errorDiv.textContent = "Erro: " + error.message;
             errorDiv.style.display = "block";
             btn.textContent = "💾 Atualizar Senha";
             btn.disabled = false;
           } else {
             document.getElementById('recoveryModal').innerHTML = `
               <div style="background:var(--bg-card); padding:2.5rem; border-radius:16px; border:1px solid rgba(16,185,129,0.3); width:100%; max-width:400px; text-align:center; box-shadow:0 0 40px rgba(0,0,0,0.5);">
                 <h2 style="color:var(--success); margin-bottom:1rem; font-family:'Bangers', cursive; font-size:2rem; letter-spacing:1px;">✅ Sucesso!</h2>
                 <p style="color:var(--text-muted); margin-bottom:1.5rem; font-size:0.95rem;">Sua senha foi redefinida. Você já pode acessar sua conta.</p>
                 <button onclick="window.location.href='index.html'" class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;">Ir para o Painel</button>
               </div>
             `;
           }
        });
      }

      if (previousSessionId && currentSessionId && previousSessionId !== currentSessionId) {
        console.log("🔄 Usuário alterado. Atualizando dados locais...");
        try {
          // Limpar chaves genéricas para evitar vazamento
          localStorage.removeItem("animehouse_store");
          localStorage.removeItem("animehouse_customAura");
          localStorage.removeItem("animehouse_customBanner");
          localStorage.removeItem("animehouse_customTitle");
          localStorage.removeItem("animehouse_showCrown");
          localStorage.removeItem("animehouse_tema_cromatico");
          localStorage.removeItem("animehouse_userLevel");
          localStorage.removeItem("animehouse_userRank");
          localStorage.removeItem("animehouse_prevLevel");
          localStorage.removeItem("animehouse_prevRank");
          localStorage.removeItem("animehouse_test_granted_v3");

          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("equipped_") || key.startsWith("animehouse_store_"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch (e) {}
        window.location.reload();
      }
      previousSessionId = currentSessionId;
    });
  } catch (e) {
    console.error("Erro Supabase:", e);
  }
}

// 3. Lógica de Login e Toggles de Senha
function setupPasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  const iconEye = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const iconEyeOff = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

  if (input && toggle) {
    toggle.innerHTML = iconEye; // seta o inicial
    toggle.addEventListener('click', () => {
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      toggle.innerHTML = type === 'password' ? iconEye : iconEyeOff;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle('password', 'togglePassword');
  setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');
});

// Esqueci a senha
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const errorDiv = document.getElementById("loginError");
    const successDiv = document.getElementById("loginSuccess");
    
    if (!email) {
      errorDiv.textContent = "Por favor, digite seu e-mail antes de clicar em 'Esqueci a senha?'.";
      errorDiv.style.display = "block";
      if (successDiv) successDiv.style.display = "none";
      return;
    }
    errorDiv.style.display = "none";
    if (successDiv) successDiv.style.display = "none";
    
    try {
      const redirectUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/login.html');
      const { error } = await supaClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (error) {
        let msg = error.message;
        if (msg.includes("rate limit")) msg = "Limite de e-mails atingido. Por favor, aguarde alguns minutos.";
        errorDiv.textContent = "Erro: " + msg;
        errorDiv.style.display = "block";
      } else {
        if (successDiv) {
          successDiv.innerHTML = "✅ <strong>E-mail de redefinição enviado!</strong><br/>Verifique sua caixa de entrada (e spam).";
          successDiv.style.display = "block";
        }
      }
    } catch (err) {
      errorDiv.textContent = "Erro inesperado ao tentar redefinir a senha.";
      errorDiv.style.display = "block";
    }
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("email").value || "").trim().toLowerCase();
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorDiv.textContent = "❌ E-mail inválido ou mal formatado.";
      errorDiv.style.display = "block";
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = "Entrando...";
    errorDiv.style.display = "none";

    try {
      const { data, error } = await supaClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        let msg = error.message;
        if (msg === "Invalid login credentials") msg = "E-mail ou senha incorretos.";
        else if (msg.includes("rate limit")) msg = "Limite de tentativas atingido. Aguarde um pouco e tente novamente.";
        else if (msg.includes("Email not confirmed")) msg = "Por favor, confirme seu e-mail antes de entrar.";

        errorDiv.textContent = "Erro: " + msg;
        errorDiv.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar no Painel";
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        errorDiv.textContent = "⚠️ Confirme seu email antes de entrar.";
        errorDiv.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
        return;
      }

      window.location.href = "index.html";
    } catch (err) {
      errorDiv.textContent = "Erro inesperado.";
      errorDiv.style.display = "block";
      submitBtn.disabled = false;
    }
  });
}

// 4. Lógica de Registro
let lastEmailRegistered = sessionStorage.getItem("lastEmailRegistered") || ""; 

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("email").value || "").trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorDiv = document.getElementById("registerError");
    const successDiv = document.getElementById("registerSuccess");
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorDiv.textContent = "❌ Digite um e-mail válido (ex: seu@email.com).";
      errorDiv.style.display = "block";
      return;
    }

    if (password !== confirmPassword) {
      errorDiv.textContent = "As senhas não coincidem.";
      errorDiv.style.display = "block";
      return;
    }

    if (password.length < 6) {
      errorDiv.textContent = "A senha deve ter pelo menos 6 caracteres.";
      errorDiv.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando...";
    lastEmailRegistered = email;
    sessionStorage.setItem("lastEmailRegistered", email); // Persiste no navegador

    const { data, error } = await supaClient.auth.signUp({ email, password });
    
    // 💡 TRUQUE: Se não der erro mas a lista de identidades estiver vazia, significa que o e-mail já existe
    const alreadyExists = data?.user && data.user.identities && data.user.identities.length === 0;

    if (error || alreadyExists) {
      let msg = error ? error.message : "Este e-mail já está sendo usado por outra conta.";
      
      if (msg.includes("rate limit") || msg.includes("confirmation email")) {
        msg = "⚠️ Muitas tentativas ou erro no servidor de e-mail. Por favor, aguarde alguns minutos ou verifique o SMTP no Supabase.";
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists") || error?.status === 422 || alreadyExists) {
        msg = "❌ Alguém já está usando essa conta. Tente fazer login ou use outro e-mail.";
      }
      
      errorDiv.textContent = msg;
      errorDiv.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Criar Conta";
    } else {
      // Registro realmente novo
      successDiv.style.display = "block";
      registerForm.style.display = "none";

      const otpSection = document.getElementById("otpSection");
      if (otpSection) {
        otpSection.style.display = "block";
        // Mostrar qual email está sendo verificado
        const emailMsg = otpSection.querySelector("p");
        if (emailMsg) {
          emailMsg.innerHTML = `<strong>🔑 Digite o código de 6 dígitos</strong><br/><small style="color:var(--primary); opacity:0.8;">Enviado para: ${email}</small>`;
        }
      }

      // Mostrar seção de reenvio de e-mail após 3s
      const resendSection = document.getElementById("resendEmailSection");
      if (resendSection) {
        setTimeout(() => {
          resendSection.style.display = "block";
          const resendEmailInput = document.getElementById("resendEmail");
          if (resendEmailInput) resendEmailInput.value = email;
        }, 3000);
      }

      submitBtn.disabled = false;
      submitBtn.textContent = "Criar Conta";
    }
  });
}

const cancelOtpBtn = document.getElementById("cancelOtpBtn");
if (cancelOtpBtn) {
  cancelOtpBtn.addEventListener("click", () => {
    sessionStorage.removeItem("lastEmailRegistered");
    lastEmailRegistered = "";
    const otpSection = document.getElementById("otpSection");
    const registerForm = document.getElementById("registerForm");
    const registerSuccess = document.getElementById("registerSuccess");
    if (otpSection) otpSection.style.display = "none";
    if (registerSuccess) registerSuccess.style.display = "none";
    if (registerForm) registerForm.style.display = "block";
    window.location.reload(); // Recarregar para limpar estados internos se necessário
  });
}

const verifyOtpBtn = document.getElementById("verifyOtpBtn");
if (verifyOtpBtn) {
  // Se já temos um e-mail salvo, podemos mostrar a seção de OTP direto
  if (lastEmailRegistered && document.getElementById("otpSection")) {
     // document.getElementById("otpSection").style.display = "block"; 
     // (Opcional: descomente se quiser que apareça ao atualizar a página)
  }

  verifyOtpBtn.addEventListener("click", async () => {
    const email = (lastEmailRegistered || document.getElementById("email").value || "").trim().toLowerCase();
    const token = document.getElementById("otpToken").value.trim();
    const otpError = document.getElementById("otpError");
    
    if (!email) {
      otpError.textContent = "Erro: E-mail não identificado.";
      otpError.style.display = "block";
      return;
    }

    if (!token || token.length < 6) {
      otpError.textContent = "Digite o código completo recebido por e-mail.";
      otpError.style.display = "block";
      return;
    }
    
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "🔌 Verificando...";
    otpError.style.display = "none";
    
    console.log("🔍 [DEBUG] Iniciando Verificação OTP:");
    console.log("   > E-mail:", email);
    console.log("   > Token:", token);

    try {
      // 1. Tenta tipo 'signup'
      console.log("   > Tentando tipo: 'signup'...");
      let res = await supaClient.auth.verifyOtp({ email, token, type: 'signup' });
      
      if (res.error) {
        console.warn("   ⚠️ Falha 'signup':", res.error.message);
        // 2. Tenta tipo 'email'
        console.log("   > Tentando tipo: 'email'...");
        res = await supaClient.auth.verifyOtp({ email, token, type: 'email' });
      }

      if (res.error) {
        console.warn("   ⚠️ Falha 'email':", res.error.message);
        // 3. Tenta tipo 'magiclink'
        console.log("   > Tentando tipo: 'magiclink'...");
        res = await supaClient.auth.verifyOtp({ email, token, type: 'magiclink' });
      }

      const { data, error } = res;

      if (error) {
        console.error("❌ ERRO FINAL:", error);
        let userMsg = "Código inválido.";
        if (error.message.includes("expired")) userMsg = "O código expirou ou é antigo.";
        else if (error.message.includes("not found")) userMsg = "E-mail não encontrado.";
        
        otpError.textContent = `❌ ${userMsg} (${error.message})`;
        otpError.style.display = "block";
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "✅ Verificar e Entrar";
      } else {
        sessionStorage.removeItem("lastEmailRegistered");
        // Forçar o Supabase a atualizar a sessão internamente antes do redirect
        supaClient.auth.getSession().then(() => {
          setTimeout(() => {
            window.location.href = "perfil.html";
          }, 800);
        });
      }
    } catch (err) {
      otpError.textContent = "Erro inesperado na verificação.";
      otpError.style.display = "block";
      verifyOtpBtn.disabled = false;
    }
  });
}

const resendBtn = document.getElementById("resendBtn");
if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    const email = document.getElementById("resendEmail").value || document.getElementById("email").value;
    if (!email) return;
    
    resendBtn.disabled = true;
    resendBtn.textContent = "Reenviando...";
    
    const { data, error } = await supaClient.auth.resend({
      type: 'signup',
      email: email
    });
    
    let msgDiv = document.getElementById('resendMsg');
    if (!msgDiv) {
      msgDiv = document.createElement('div');
      msgDiv.id = 'resendMsg';
      msgDiv.style.marginTop = '10px';
      msgDiv.style.fontSize = '0.85rem';
      msgDiv.style.fontWeight = 'bold';
      resendBtn.parentNode.appendChild(msgDiv);
    }
    
    if (error) {
      msgDiv.style.color = 'var(--danger)';
      msgDiv.textContent = "Erro ao reenviar: " + error.message;
    } else {
      msgDiv.style.color = 'var(--success)';
      msgDiv.textContent = "✅ Novo código enviado! Verifique seu e-mail.";
    }
    resendBtn.disabled = false;
    resendBtn.textContent = "📧 Reenviar Código";
  });
}

// 5. Excluir Conta
window.deleteUserAccount = async function () {
  if (!supaClient) return { error: { message: 'Supabase não inicializado.' } };

  try {
    const { data: { user } } = await supaClient.auth.getUser();
    if (!user) return { error: { message: 'Usuário não autenticado.' } };

    // Chama a função de segurança (Postgres RPC) no Supabase
    const { error } = await supaClient.rpc('delete_user');

    if (error) {
      return { error: { message: error.message || 'Falha ao excluir conta nativamente.' } };
    }

    // Limpar dados locais
    try { localStorage.clear(); } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}

    await supaClient.auth.signOut();
    return { success: true };
  } catch (e) {
    return { error: { message: e.message || 'Erro inesperado.' } };
  }
};

window.loadBanners = async function () {
  window.BANNER_MAP = {};

  if (window.supabaseClient) {
    try {
      console.log("🛰️ Sincronizando com Storage do Supabase...");
      const { data: supaBanners, error } = await window.supabaseClient
        .from("store_banners")
        .select("id, image_url");

      if (error) {
        console.error("❌ Erro ao buscar banners do Supabase:", error);
        return;
      }

      console.log(
        `📦 Banners carregados do Supabase: ${supaBanners?.length || 0} itens`,
      );
      console.log("🔍 Raw data do Supabase:", supaBanners);

      if (supaBanners && supaBanners.length > 0) {
        supaBanners.forEach((b, index) => {
          const cleanId = b.id ? b.id.trim() : "sem-id";
          const hasUrl = !!b.image_url;

          console.log(`📝 [${index}] ID="${cleanId}" | hasURL=${hasUrl}`);

          if (b.image_url) {
            window.BANNER_MAP[cleanId] = b.image_url;

            // Extrair nome do arquivo da URL para mapeamento inteligente
            const urlLower = b.image_url.toLowerCase();
            const fileName = urlLower.split("/").pop().split("?")[0];

            // Mapeamentos baseados no nome do arquivo na URL
            if (fileName.includes("cosmos")) {
              window.BANNER_MAP["banner_cosmos"] = b.image_url;
              console.log(`✅ MAPEADO banner_cosmos via arquivo: ${fileName}`);
            }
            if (fileName.includes("guts") || fileName.includes("berserk")) {
              window.BANNER_MAP["banner_berserk"] = b.image_url;
            }
            if (fileName.includes("aurora")) {
              window.BANNER_MAP["banner_claro"] = b.image_url;
            }
            if (fileName.includes("shiganshina") || fileName.includes("aot")) {
              window.BANNER_MAP["banner_aot"] = b.image_url;
            }
            if (fileName.includes("vinland")) {
              window.BANNER_MAP["banner_vinland"] = b.image_url;
            }
            if (fileName.includes("cosmica")) {
              window.BANNER_MAP["banner_cosmica"] = b.image_url;
            }
            if (fileName.includes("oni")) {
              window.BANNER_MAP["banner_oni"] = b.image_url;
            }
            if (fileName.includes("shinobi")) {
              window.BANNER_MAP["banner_shinobi"] = b.image_url;
            }
            if (fileName.includes("ragnarok")) {
              window.BANNER_MAP["banner_ragnarok"] = b.image_url;
            }

            // Mapeamentos Inteligentes baseados no ID (fallback)
            if (cleanId.includes("cosmos")) {
              window.BANNER_MAP["banner_cosmos"] = b.image_url;
              console.log(`✅ MAPEADO banner_cosmos via ID: ${cleanId}`);
            }
            if (cleanId.includes("guts"))
              window.BANNER_MAP["banner_berserk"] = b.image_url;
            if (cleanId.includes("aurora"))
              window.BANNER_MAP["banner_claro"] = b.image_url;
            if (cleanId.includes("shiganshina"))
              window.BANNER_MAP["banner_aot"] = b.image_url;
            if (cleanId.includes("vinland"))
              window.BANNER_MAP["banner_vinland"] = b.image_url;
            if (cleanId.includes("cosmica"))
              window.BANNER_MAP["banner_cosmica"] = b.image_url;
            if (cleanId.includes("oni"))
              window.BANNER_MAP["banner_oni"] = b.image_url;
            if (cleanId.includes("shinobi"))
              window.BANNER_MAP["banner_shinobi"] = b.image_url;
            if (cleanId.includes("ragnarok"))
              window.BANNER_MAP["banner_ragnarok"] = b.image_url;

            // Se o usuário subir com extensão, mapeia também
            const idNoExt = cleanId.replace(/\.[^/.]+$/, "");
            window.BANNER_MAP[idNoExt] = b.image_url;
          }
        });

        console.log("� BANNER_MAP final:", Object.keys(window.BANNER_MAP));

        // Verifica especificamente o banner_cosmos
        if (window.BANNER_MAP["banner_cosmos"]) {
          console.log("✅ banner_cosmos está disponível!");
        } else {
          // Hard-fix para banner_cosmos
          window.BANNER_MAP["banner_cosmos"] = "https://bxifddhrbxbmimjkgwzr.supabase.co/storage/v1/object/public/banners/banner_cosmos.png";
          console.log("🛠️ banner_cosmos mapeado via HARD-FIX");
        }
      } else {
        console.warn("⚠️ Nenhum banner retornado do Supabase");
      }
      updateNavbarCosmetics();
    } catch (err) {
      console.error("❌ Erro Banners:", err);
      console.error(err.stack);
    }
  } else {
    console.warn("⚠️ supabaseClient não disponível");
  }
};

window.updateNavbarCosmetics = function () {
  const bannerBg = document.querySelector(".user-nav-banner-bg");
  const titleEl = document.querySelector(".user-nav-title");
  const avatarBox = document.querySelector(".user-nav-avatar-box");
  const navAvatar = document.getElementById("navAvatar");
  const burger = document.getElementById("navBurger");

  // 💡 Cursor fixes
  if (burger) burger.style.cursor = "pointer";
  document
    .querySelectorAll(".navbar-links a")
    .forEach((a) => (a.style.cursor = "pointer"));



  // Se o elemento ainda não existe (navbar carregando), tenta novamente em 100ms
  if (!bannerBg) {
    if (!window._navbarCosmeticsRetries) window._navbarCosmeticsRetries = 0;
    if (window._navbarCosmeticsRetries < 20) {
      window._navbarCosmeticsRetries++;
      setTimeout(updateNavbarCosmetics, 100);
    }
    return;
  }
  window._navbarCosmeticsRetries = 0; // reset ao ter sucesso

  // 💡 Se BANNER_MAP estiver vazio, tenta carregar banners primeiro
  if (!window.BANNER_MAP || Object.keys(window.BANNER_MAP).length === 0) {
    loadBanners().then(() => {
      // Recursively call after loading
      setTimeout(updateNavbarCosmetics, 50);
    });
    return;
  }

  // 💡 Dados do Banco (Preferencial)
  let sData = null;
  let userId = null;
  if (window.supabaseClient) {
      // Tenta pegar o user ID de forma síncrona se possível ou via cache
      userId = localStorage.getItem("sb-bxifddhrbxbmimjkgwzr-auth-token") ? 
               JSON.parse(localStorage.getItem("sb-bxifddhrbxbmimjkgwzr-auth-token")).user?.id : null;
  }

  if (window.DB && window.DB._store && window.DB._store.profile) {
    sData = window.DB._store.profile.store_data || {};
  } else if (userId) {
    // 💡 Tenta carregar da chave ISOLADA do usuário
    try {
      const localStr = localStorage.getItem(`animehouse_store_${userId}`);
      if (localStr) sData = JSON.parse(localStr);
    } catch (e) {}
  }

  // Chaves para cosméticos - agora SEMPRE priorizando o banco ou o userId
  const dbEquipped = sData?.equipped || {};

  const getCosmetic = (key, fallback = "none") => {
      // 1. Prioridade: Objeto do Banco (chave curta)
      if (dbEquipped[key] !== undefined) return dbEquipped[key];

      // 2. Fallback: LocalStorage (chave longa com prefixo)
      if (userId) {
          const mapping = {
              aura: "animehouse_customAura",
              banner: "animehouse_customBanner",
              titulo: "animehouse_customTitle",
              crown: "animehouse_showCrown",
              crownId: "animehouse_equippedCrownId",
              crownIcon: "animehouse_equippedCrownIcon",
              tema_cromatico: "animehouse_tema_cromatico",
              frame_dourado: "animehouse_frame_dourado"
          };
          const storageKey = mapping[key] || key;
          const userKey = `${storageKey}_${userId}`;
          const val = localStorage.getItem(userKey);
          if (val) return val;
      }
      return fallback;
  };

  const savedBanner = getCosmetic("banner", "none");
  const savedAura = getCosmetic("aura", "none");
  const savedTitle = getCosmetic("titulo", "");
  const savedCrown = getCosmetic("crown", false) === true || getCosmetic("crown", false) === "true";
  const hasFrame = getCosmetic("frame_dourado", false) === true || getCosmetic("frame_dourado", false) === "true";
  const hasTemaCromatico = getCosmetic("tema_cromatico", false) === true || getCosmetic("tema_cromatico", false) === "true";

  // 🌈 TEMA CROMÁTICO — restaurar se estava equipado
  if (hasTemaCromatico && window.setTheme) {
    window.setTheme("theme-cromatico");
  }

  // 📸 LÓGICA DE BANNER
  if (savedBanner !== "none" && window.BANNER_MAP) {
    const url = window.BANNER_MAP[savedBanner];
    if (url) {
      bannerBg.style.backgroundImage = `url('${url}')`;
      bannerBg.style.display = "block";
      bannerBg.style.opacity = "1";
    } else {
      console.warn(
        `⚠️ Link do banner '${savedBanner}' não encontrado no BANNER_MAP.`,
      );
      bannerBg.style.display = "none";
    }
  } else {
    bannerBg.style.display = "none";
  }

  // 🎓 TÍTULO
  if (titleEl) {
    titleEl.textContent = savedTitle;
    titleEl.style.display = savedTitle ? "block" : "none";
  }

  // ✨ AURA & FRAME
  const auraClasses = [
    "aura-common-chama",
    "aura_chama",
    "aura-common-naruto",
    "aura_chama_naruto",
    "aura-rare-ceifador",
    "aura_ceifador",
    "aura-rare-thunder",
    "aura_thunder",
    "aura-rare-susanoo",
    "aura_susanoo",
    "aura-rare-sakura",
    "aura_sakura",
    "aura-epic-gelo",
    "aura_gelo",
    "aura-epic-stands",
    "aura_stands",
    "avatar-aura-stands",
    "aura-epic-void",
    "aura_void_saitama",
    "aura-legendary-dragon",
    "aura_dragon",
    "avatar-aura-fire",
    "avatar-aura-guardian",
    "avatar-aura-immortal",
    "avatar-aura-bronze",
    "avatar-aura-prata",
    "avatar-aura-ouro",
    "avatar-aura-mestre",
    "avatar-aura-lenda",
    "frame-dourado",
  ];

  // — Navbar avatar —
  avatarBox.classList.remove(...auraClasses);
  if (savedAura !== "none") {
    avatarBox.classList.add(savedAura);
    if (savedAura === "aura_stands")
      avatarBox.classList.add("avatar-aura-stands");
  }
  if (hasFrame) {
    avatarBox.classList.add("frame-dourado");
  }

  // — Sidebar avatar (abaixo do histórico no perfil) —
  const displayAvatarBox = document.getElementById("displayAvatarBox");
  if (displayAvatarBox) {
    displayAvatarBox.classList.remove(...auraClasses);
    if (savedAura !== "none") {
      displayAvatarBox.classList.add(savedAura);
      if (savedAura === "aura_stands")
        displayAvatarBox.classList.add("avatar-aura-stands");
    }
    if (hasFrame) {
      displayAvatarBox.classList.add("frame-dourado");
    }
    // Coroa do sidebar
    const sbCrown = document.getElementById("sidebarCrown");
    if (sbCrown) {
      sbCrown.style.display = savedCrown ? "block" : "none";
      if (savedCrown) {
        const crownIcon = getCosmetic("crownIcon", "👑");
        sbCrown.textContent = crownIcon;
      }
    }
  }

  // Garantir que a <img> nunca tenha borda ou sombra amarela
  if (navAvatar) {
    navAvatar.style.border = "none";
    navAvatar.style.boxShadow = "none";
    navAvatar.style.outline = "none";
  }

  // 👑 COROA
  const existingCrown = avatarBox.querySelector(".crown-nav");
  if (existingCrown) existingCrown.remove();
  if (savedCrown) {
    const crown = document.createElement("div");
    crown.className = "crown-nav"; // Usar classe do style.css
    const crownIcon = getCosmetic("crownIcon", "👑");
    crown.innerHTML = crownIcon;
    avatarBox.appendChild(crown);
  }

  // 🏠 APLICAR EM PÁGINAS ESPECÍFICAS (PERFIL / HISTÓRICO)
  if (window.location.href.includes("perfil.html") && savedBanner !== "none") {
    const sidebar =
      document.querySelector(".history-sidebar") ||
      document.querySelector(".profile-sidebar");
    const bannerUrl = window.BANNER_MAP ? window.BANNER_MAP[savedBanner] : null;

    if (sidebar && bannerUrl) {
      sidebar.style.position = "relative";
      sidebar.style.overflow = "hidden";
      sidebar.style.zIndex = "1";

      let bgOverlay = sidebar.querySelector(".sidebar-banner-overlay");
      if (!bgOverlay) {
        bgOverlay = document.createElement("div");
        bgOverlay.className = "sidebar-banner-overlay";
        bgOverlay.style.cssText =
          "position:absolute; inset:0; z-index:-1; transition:0.5s; pointer-events:none;";
        sidebar.prepend(bgOverlay);
      }

      bgOverlay.style.backgroundImage = `linear-gradient(rgba(10, 25, 47, 0.6), rgba(10, 25, 47, 0.9)), url('${bannerUrl}')`;
      bgOverlay.style.backgroundSize = "cover";
      bgOverlay.style.backgroundPosition = "center";
      bgOverlay.style.opacity = "0.65"; // Opacidade alta como solicitado
    }
  }
};

window.addEventListener("profileUpdated", (event) => {
  const detail = event?.detail || {};
  const navAvatar = document.getElementById("navAvatar");
  const nextAvatar = String(detail.avatarUrl || detail.avatar_url || "").trim();

  if (navAvatar && nextAvatar) {
    navAvatar.src = nextAvatar;
  }

  if (typeof window.updateNavbarCosmetics === "function") {
    window.updateNavbarCosmetics();
  }
});

window.addEventListener("storage", (e) => {
  if (!e.key || !e.key.startsWith("animehouse_")) return;
  if (typeof window.updateNavbarCosmetics === "function") {
    window.updateNavbarCosmetics();
  }
});

// 🚀 Carregar banners automaticamente quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM pronto - Iniciando carregamento de banners...");

  const tryLoadBanners = (attempt = 1) => {
    if (window.supabaseClient && typeof window.loadBanners === "function") {
      window.loadBanners();
    } else if (attempt < 10) {
      setTimeout(() => tryLoadBanners(attempt + 1), 200);
    } else {
      console.warn("⚠️ Supabase não disponível após 10 tentativas");
    }
  };

  tryLoadBanners();
  
  // Mostrar email no OTP section se já estivermos no meio de um registro
  if (lastEmailRegistered) {
    const otpSection = document.getElementById("otpSection");
    if (otpSection) {
      const emailMsg = otpSection.querySelector("p");
      if (emailMsg) {
        emailMsg.innerHTML = `<strong>🔑 Digite o código de 6 dígitos</strong><br/><small style="color:var(--primary); opacity:0.8;">Enviado para: ${lastEmailRegistered}</small>`;
      }
    }
  }

  // Tratar erros vindos na URL...
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("error_code") === "otp_expired" || hashParams.get("error_description")) {
      console.warn("Autenticação Hash:", hashParams.get("error_description"));
      window.history.replaceState(null, null, window.location.pathname);
    }
  }
});

// 6. Auth Status & Navbar Injection
window.checkAuthStatus = async function () {
  if (!supaClient) return;
  const {
    data: { session },
  } = await supaClient.auth.getSession();
  const currentPage = window.location.pathname.split("/").pop();
  const nav = document.querySelector(".navbar");

  // Ocultar botões de login na home se estiver logado
  if ((currentPage === "index.html" || currentPage === "") && session) {
    const bannerActions =
      document.querySelector(".hero-buttons") ||
      document.getElementById("homeBannerActions");
    if (bannerActions) {
      const level = localStorage.getItem("animehouse_userLevel") || "1";
      const rank = localStorage.getItem("animehouse_userRank") || "Novato";

      bannerActions.innerHTML = `
                <div id="homeUserStatus" style="display: flex; align-items: center; justify-content: center; margin-top: 15px; animation: fadeIn 1.2s ease;">
                    <div style="display: flex; align-items: center; background: rgba(var(--primary-rgb), 0.15); padding: 6px 20px; border-radius: 50px; border: 1px solid var(--primary); box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.4); backdrop-filter: blur(8px);">
                        <span style="color: var(--primary); font-weight: 900; font-size: 0.85rem; margin-right: 12px; font-family: 'Fredoka', sans-serif; letter-spacing: 1px; text-transform: uppercase;">LVL ${level}</span>
                        <span style="color: #fff; font-family: 'Bangers', cursive; font-size: 1.4rem; letter-spacing: 2px; text-shadow: 0 0 10px var(--primary);">
                            ${rank}
                        </span>
                    </div>
                </div>
            `;
    }
  }

  if (nav) {
    const existing = document.getElementById("globalAuthContainer");
    if (existing) existing.remove();

    const authContainer = document.createElement("div");
    authContainer.id = "globalAuthContainer";
    authContainer.style.cssText =
      "display: flex; gap: 10px; margin-left: auto; align-items: center; z-index: 2000;";

    if (session) {
      const { data: profile } = await supaClient
        .from("profiles")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();
      const avatarUrl =
        profile?.avatar_url ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

      authContainer.innerHTML = `
                <a href="perfil.html" class="user-nav-link" style="text-decoration: none;">
                    <div class="user-nav-container">
                        <div class="user-nav-banner-bg"></div>
                        <span class="user-nav-title"></span>
                        <div class="user-nav-avatar-box">
                           <img id="navAvatar" src="${avatarUrl}" alt="Perfil" style="width:100%; height:100%; border-radius:50%; object-fit:cover; z-index: 5;">
                        </div>
                    </div>
                </a>
            `;
      nav.appendChild(authContainer);
      
      // Se estamos no perfil e não temos perfil no banco, não expulsar imediatamente
      if (!profile && currentPage === "perfil.html") {
         console.warn("Perfil ainda não criado no banco. Aguardando sincronização...");
      }

      if (!window.BANNER_MAP) await loadBanners();
      else updateNavbarCosmetics();
    } else {
      authContainer.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">👤 Entrar</a>`;
      nav.appendChild(authContainer);
    }
  }

  // Proteção de rotas
  const protected = [
    "cadastro.html",
    "cadastro-animes.html",
    "cadastro-filmes.html",
    "cadastro-youtube.html",
    "perfil.html"
  ];
  if (protected.includes(currentPage) && !session)
    window.location.href = "login.html";
};

document.addEventListener("DOMContentLoaded", () => {
  window.checkAuthStatus();
});

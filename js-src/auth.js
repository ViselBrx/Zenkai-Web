/**
 * js/auth.js â€” Configuração e Lógica do Supabase (LIMPO E ORGANIZADO)
 */

// 1. CREDENCIAIS
const SUPABASE_URL =
  window.ENV?.SUPABASE_URL || "https://bxifddhrbxbmimjkgwzr.supabase.co";
const SUPABASE_ANON_KEY =
  window.ENV?.SUPABASE_ANON_KEY ||
  "sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol";

// --- NOTIFICATION HUB STATE ---
const notificationState = {
  notificationCount: 0,
  isOpen: false,
  userId: null,
  isAdmin: false,
  logs: [],
  activeFilter: 'all',
  realtimeChannel: null,
  initializedForUserId: null,
  notifications: []
};

// 2. Inicializa o cliente
let supaClient;
let previousSessionId = null;

const initSupa = () => {
  if (supaClient) return true; // Já inicializado
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
      console.log("ðŸš€ Supabase Client inicializado com sucess✅");
      return true;
    } catch (e) {
      console.error("Erro ao inicializar Supabase:", e);
    }
  }
  return false;
};

// Tentar inicializar imediatamente ou aguardar se necessário
let isAuthLogicSetup = false;
function tryInit() {
  if (initSupa()) {
    if (!isAuthLogicSetup) {
      isAuthLogicSetup = true;
      setupAuthLogic();
    }
    return true;
  }
  return false;
}

if (!tryInit()) {
  const checkSupa = setInterval(() => {
    if (tryInit()) clearInterval(checkSupa);
  }, 100);
  setTimeout(() => clearInterval(checkSupa), 5000);
}

// ðŸš€ Lógica de Redirecionamento e Auth State
async function setupAuthLogic() {
  if (!supaClient) return;
  try {

  const isAuthPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("registr✅html");
  const isRecovery = window.location.hash.includes("type=recovery");

  if (isRecovery) {
    sessionStorage.setItem('is_recovering_password', 'true');
  }

  if (isAuthPage && !isRecovery) {
    if (sessionStorage.getItem('is_recovering_password') === 'true') {
      sessionStorage.removeItem('is_recovering_password');
      await supaClient.auth.signOut();
      return;
    }

    const { data: { session } } = await supaClient.auth.getSession();
    if (session) {
      window.location.href = "perfil.html";
    }
  }

  supaClient.auth.onAuthStateChange((event, session) => {
    console.log("ðŸ”” [Auth Event]:", event, session?.user?.email);
    const currentSessionId = session?.user?.id || null;

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
       // Opcional: sincronizar sessão
    }

    if (event === 'PASSWORD_RECOVERY') {
        const modalHtml = `
          <div id="recoveryModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,15,0.85); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); display:flex; justify-content:center; align-items:center; z-index:9999; opacity:0; transition:opacity 0.3s ease;">
            <div id="recoveryCard" style="background:var(--bg-card); padding:2.5rem; border-radius:20px; border:1px solid rgba(var(--primary-rgb),0.3); width:90%; max-width:420px; text-align:center; box-shadow:0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(var(--primary-rgb),0.2); transform:translateY(20px); transition:transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
              
              <div style="margin-bottom:1.5rem; display:flex; justify-content:center;">
                <div style="width:64px; height:64px; border-radius:50%; background:rgba(var(--primary-rgb),0.1); display:flex; align-items:center; justify-content:center;">
                  <svg style="width:32px; height:32px; color:var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
              </div>
              
              <h2 style="color:var(--primary); margin-bottom:0.5rem; font-family:'Bangers', cursive; font-size:2.5rem; letter-spacing:2px; text-shadow:0 0 10px rgba(var(--primary-rgb),0.3);">Nova Senha</h2>
              <p style="color:var(--text-muted); margin-bottom:2rem; font-size:0.95rem; line-height:1.5;">Defina uma nova senha forte para proteger sua conta e manter seus dados seguros.</p>
              
              <div style="text-align:left; margin-bottom:1rem;">
                <label style="display:block; margin-bottom:8px; color:var(--text-main); font-weight:600; font-size:0.9rem;">Nova Senha</label>
                <div style="position:relative;">
                  <input type="password" id="recoveryNewPassword" autocomplete="new-password" placeholder="Mínimo 6 caracteres" style="width:100%; padding:14px; padding-right:45px; background:var(--bg-surface); border:1px solid var(--border); border-radius:10px; color:var(--text-main); outline:none; font-size:1rem; transition:all 0.3s ease; box-sizing:border-box;" />
                  <button type="button" id="toggleRecPass" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
              </div>

              <div style="text-align:left; margin-bottom:1.5rem;">
                <label style="display:block; margin-bottom:8px; color:var(--text-main); font-weight:600; font-size:0.9rem;">Confirmar Nova Senha</label>
                <div style="position:relative;">
                  <input type="password" id="recoveryConfirmPassword" autocomplete="new-password" placeholder="Repita a nova senha" style="width:100%; padding:14px; padding-right:45px; background:var(--bg-surface); border:1px solid var(--border); border-radius:10px; color:var(--text-main); outline:none; font-size:1rem; transition:all 0.3s ease; box-sizing:border-box;" />
                  <button type="button" id="toggleRecConfPass" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
              </div>
              
              <div id="recoveryError" style="color:var(--danger); background:rgba(239,68,68,0.1); border:1px solid var(--danger); border-radius:8px; padding:12px; font-size:0.9rem; margin-bottom:1.5rem; display:none; font-weight:500;"></div>
              
              <button id="recoveryBtn" class="btn btn-primary" style="width:100%; padding:14px; font-size:1.1rem; border-radius:10px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; transition:all 0.3s ease;"><i class="fa-solid fa-floppy-disk"></i> Redefinir Senha</button>
            </div>
          </div>
        `;

        if (!document.getElementById('recoveryModal')) {
          document.body.insertAdjacentHTML('beforeend', modalHtml);
          // Animate In
          setTimeout(() => {
            const modal = document.getElementById('recoveryModal');
            const card = document.getElementById('recoveryCard');
            if (modal && card) {
              modal.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }
          }, 10);
        }

        // Toggle Password Visibility
        const iconEye = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        const iconEyeOff = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        document.getElementById('toggleRecPass').addEventListener('click', function () {
          const input = document.getElementById('recoveryNewPassword');
          const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
          input.setAttribute('type', type);
          this.innerHTML = type === 'password' ? iconEye : iconEyeOff;
        });

        document.getElementById('toggleRecConfPass').addEventListener('click', function () {
          const input = document.getElementById('recoveryConfirmPassword');
          const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
          input.setAttribute('type', type);
          this.innerHTML = type === 'password' ? iconEye : iconEyeOff;
        });

        // Input Focus Styles
        ['recoveryNewPassword', 'recoveryConfirmPassword'].forEach(id => {
          const el = document.getElementById(id);
          el.addEventListener('focus', () => el.style.borderColor = 'var(--primary)');
          el.addEventListener('blur', () => el.style.borderColor = 'var(--border)');
        });

        document.getElementById('recoveryBtn').addEventListener('click', async () => {
          const newPassword = document.getElementById('recoveryNewPassword').value;
          const confirmPassword = document.getElementById('recoveryConfirmPassword').value;
          const errorDiv = document.getElementById('recoveryError');

          if (!newPassword || newPassword.length < 6) {
            errorDiv.innerHTML = "â Œ A senha deve ter pelo menos 6 caracteres.";
            errorDiv.style.display = "block";
            return;
          }
          if (newPassword !== confirmPassword) {
            errorDiv.innerHTML = "â Œ As senhas não coincidem.";
            errorDiv.style.display = "block";
            return;
          }

          errorDiv.style.display = "none";
          const btn = document.getElementById('recoveryBtn');
          btn.innerHTML = `<span class="loader-ring" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></span> Atualizand✅..`;
          btn.disabled = true;

          const { error } = await supaClient.auth.updateUser({ password: newPassword });

          if (error) {
            let msg = error.message;
            if (msg.toLowerCase().includes("different from the old password")) {
              msg = "A nova senha deve ser diferente da antiga.";
            }
            errorDiv.innerHTML = "â Œ Erro: " + msg;
            errorDiv.style.display = "block";
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Redefinir Senha';
            btn.disabled = false;
          } else {
            sessionStorage.removeItem('is_recovering_password');
            // Deslogar imediatamente para forçar o login manual e impedir que "entre na conta sozinho"
            await supaClient.auth.signOut();

            const card = document.getElementById('recoveryCard');
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px)';

            setTimeout(() => {
              card.innerHTML = `
                 <div style="margin-bottom:1.5rem; display:flex; justify-content:center;">
                   <div style="width:80px; height:80px; border-radius:50%; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center; border:2px solid rgba(16,185,129,0.3);">
                     <svg style="width:40px; height:40px; color:#10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                 </div>
                 <h2 style="color:#10b981; margin-bottom:1rem; font-family:'Bangers', cursive; font-size:2.5rem; letter-spacing:2px; text-shadow:0 0 15px rgba(16,185,129,0.3);">Sucesso!</h2>
                 <p style="color:var(--text-muted); margin-bottom:2rem; font-size:1rem; line-height:1.6;">Sua senha foi redefinida com perfeiÃ§Ã£✅ Por segurança, você foi desconectad✅ Faça o login com sua nova senha.</p>
                 <button id="recoveryCloseBtn" class="btn btn-primary" style="width:100%; padding:14px; font-size:1.1rem; border-radius:10px; font-weight:bold; letter-spacing:1px; background:#10b981; border-color:#10b981; box-shadow:0 0 15px rgba(16,185,129,0.4);">Fazer Login</button>
               `;
              card.style.borderColor = 'rgba(16,185,129,0.4)';
              card.style.boxShadow = '0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.2)';

              card.style.transform = 'translateY(0)';
              card.style.opacity = '1';

              document.getElementById('recoveryCloseBtn').addEventListener('click', () => {
                const modal = document.getElementById('recoveryModal');
                modal.style.opacity = '0';
                setTimeout(() => {
                  modal.remove();
                  history.replaceState(null, '', window.location.pathname);
                  window.location.reload(); // Recarrega para mostrar a tela de login vazia e limpa
                }, 300);
              });
            }, 300);
          }
        });
      }

      if (previousSessionId && currentSessionId && previousSessionId !== currentSessionId) {
        console.log("ðŸ”„ Usuário alterad✅ Atualizando dados locais...");
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
          localStorage.removeItem("animehouse_xpOffset");
          localStorage.removeItem("animehouse_calculatedXP");
          localStorage.removeItem("xp_cache");
          localStorage.removeItem("currency_ouro");
          localStorage.removeItem("currency_diamante");
          localStorage.removeItem("currency_esmeralda");

          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("equipped_") || key.startsWith("animehouse_store_"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch (e) { }
        
        // Evita reload infinito se estivermos na página de login/registro
        if (!isAuthPage) {
          console.log("ðŸ”„ Recarregando para aplicar novos dados de usuári✅");
          window.location.reload();
        }
      }
      previousSessionId = currentSessionId;
    });
  } catch (e) {
    console.error("Erro setupAuthLogic:", e);
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
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supaClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (error) {
        let msg = error.message;
        if (msg.includes("rate limit")) msg = "Limite de e-mails atingid✅ Por favor, aguarde alguns minutos.";
        errorDiv.textContent = "Erro: " + msg;
        errorDiv.style.display = "block";
      } else {
        if (successDiv) {
          successDiv.innerHTML = "âœ… <strong>E-mail de redefinição enviado!</strong><br/>Verifique sua caixa de entrada.<br/><br/><span style='color:var(--warning); font-size:0.85rem;'>âš ï¸ <strong>Atenção:</strong> Não encontrou? Verifique sua pasta de <strong>Spam ou Lixo Eletrônico</strong>.</span>";
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
    // Limpar qualquer flag de recuperação de senha pendente
    sessionStorage.removeItem('is_recovering_password');

    const email = (document.getElementById("email").value || "").trim().toLowerCase();
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorDiv.textContent = "âŒ E-mail inválido ou mal formatad✅";
      errorDiv.style.display = "block";
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = "Entrand✅..";
    errorDiv.style.display = "none";

    try {
      const { data, error } = await supaClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Erro Login:", error.message);
        let msg = error.message;
        if (msg.includes("Invalid login credentials")) msg = "E-mail ou senha incorretos.";
        else if (msg.includes("Email not confirmed")) msg = "Por favor, confirme seu e-mail antes de entrar.";
        else if (msg.includes("rate limit")) msg = "Limite de tentativas atingid✅ Aguarde um pouco e tente novamente.";

        errorDiv.textContent = "Erro: " + msg;
        errorDiv.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
        return;
      }

      // Login bem sucedido
      console.log("âœ… Login realizado com sucess✅ Verificando sessÃ£✅..");
      const { data: sessData } = await supaClient.auth.getSession();
      
      if (sessData && sessData.session) {
        sessionStorage.setItem('freshLogin', 'true');
        console.log("ðŸš€ Redirecionando para perfil...");
        window.location.href = "perfil.html";
      } else {
        console.warn("âš ï¸ Sessão não encontrada após login. Tentando redirecionar mesmo assim...");
        window.location.href = "perfil.html";
      }
    } catch (err) {
      console.error("Crash Login:", err);
      errorDiv.textContent = "Erro inesperado ao processar login.";
      errorDiv.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Entrar";
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
      errorDiv.textContent = "âŒ Digite um e-mail válido (ex: seu@email.com).";
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
    submitBtn.textContent = "Registrand✅..";
    lastEmailRegistered = email;
    sessionStorage.setItem("lastEmailRegistered", email); // Persiste no navegador

    const { data, error } = await supaClient.auth.signUp({ email, password });

    if (error) {
      let msg = error.message;

      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
        msg = "âš ï¸ Limite de tentativas atingid✅ Por favor, aguarde alguns minutos.";
      } else if (msg.toLowerCase().includes("security purposes")) {
        msg = "âš ï¸ Você já solicitou um código para este e-mail. Aguarde 1 minuto para tentar novamente.";
      } else if (msg.toLowerCase().includes("confirmation email") || msg.toLowerCase().includes("email send failed")) {
        msg = "âš ï¸ Erro no servidor de e-mail (SMTP). Por favor, verifique as configurações de SMTP no painel do Supabase.";
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists") || error.status === 422) {
        msg = "âŒ Alguém já está usando essa conta. Tente fazer login ou use outro e-mail.";
      }

      errorDiv.textContent = msg;
      errorDiv.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Criar Conta";
    } else {
      // Registro realmente novo - Esconder form e mostrar container de verificação
      const otpSection = document.getElementById("otpSection");
      const resendSection = document.getElementById("resendEmailSection");
      if (otpSection) {
        registerForm.style.display = "none";
        otpSection.style.display = "block";
        if (resendSection) {
          resendSection.style.display = "block";
          // Pré-preencher o campo de reenvio com o e-mail já usado
          const resendEmailInput = document.getElementById("resendEmail");
          if (resendEmailInput) resendEmailInput.value = email;
        }

        // Atualizar texto do email na tela
        const emailDisplay = otpSection.querySelector("p");
        if (emailDisplay) {
          emailDisplay.innerHTML = `Quase lá! Enviamos um código de segurança de 6 dígitos para:<br/><strong style="color:var(--primary); font-size:1rem;">${email}</strong><br/><br/><span style="color:var(--warning); font-size:0.9rem;">⚠️ <strong>Atenção:</strong> O e-mail pode demorar 1 minuto para chegar. Se não encontrar, verifique sua caixa de <strong>Spam ou Lixo Eletrônico</strong>.</span>`;
        }
      } else {
        console.error("❌ otpSection NÃO encontrado no DOM!");
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
    const resendSection = document.getElementById("resendEmailSection");
    const registerForm = document.getElementById("registerForm");
    if (otpSection) otpSection.style.display = "none";
    if (resendSection) resendSection.style.display = "none";
    if (registerForm) registerForm.style.display = "block";
  });
}

// Lógica de reenvio de código
const resendBtn = document.getElementById("resendBtn");
if (resendBtn) {
  let resendCooldown = false;
  resendBtn.addEventListener("click", async () => {
    if (resendCooldown) return;
    const resendEmailInput = document.getElementById("resendEmail");
    const emailToResend = (resendEmailInput?.value || lastEmailRegistered || "").trim().toLowerCase();
    if (!emailToResend) {
      alert("Digite o e-mail para reenviar o códig✅");
      return;
    }
    resendBtn.disabled = true;
    resendBtn.textContent = "ðŸ“¨ Enviand✅..";
    const client = window.supabaseClient;
    if (!client) {
      resendBtn.textContent = "âŒ Erro ao reenviar. Tente novamente.";
      setTimeout(() => { resendBtn.textContent = "ðŸ“§ Reenviar Código"; resendBtn.disabled = false; }, 3000);
      return;
    }
    const { error } = await client.auth.resend({ type: "signup", email: emailToResend });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("security purposes") || msg.toLowerCase().includes("too many")) {
        msg = "Aguarde 1 minuto antes de reenviar.";
      }
      resendBtn.textContent = "âŒ " + msg;
      setTimeout(() => { resendBtn.textContent = "ðŸ“§ Reenviar Código"; resendBtn.disabled = false; }, 5000);
    } else {
      resendCooldown = true;
      let seconds = 60;
      resendBtn.textContent = `âœ… Código reenviado! Aguarde ${seconds}s`;
      const interval = setInterval(() => {
        seconds--;
        resendBtn.textContent = `⏳ Aguarde ${seconds}s para reenviar`;
        if (seconds <= 0) {
          clearInterval(interval);
          resendBtn.disabled = false;
          resendBtn.textContent = "ðŸ“§ Reenviar Código";
          resendCooldown = false;
        }
      }, 1000);
    }
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
      otpError.textContent = "Erro: E-mail não identificad✅";
      otpError.style.display = "block";
      return;
    }

    if (!token || token.length < 6) {
      otpError.textContent = "Digite o código completo recebido por e-mail.";
      otpError.style.display = "block";
      return;
    }

    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "ðŸ”Œ Verificand✅..";
    otpError.style.display = "none";

    console.log("ðŸ” [DEBUG] Iniciando Verificação OTP:");
    console.log("   > E-mail:", email);
    console.log("   > Token:", token);

    try {
      // 1. Tenta tipo 'signup'
      console.log("   > Tentando tipo: 'signup'...");
      let res = await supaClient.auth.verifyOtp({ email, token, type: 'signup' });

      if (res.error) {
        console.warn("   âš ï¸ Falha 'signup':", res.error.message);
        // 2. Tenta tipo 'email'
        console.log("   > Tentando tipo: 'email'...");
        res = await supaClient.auth.verifyOtp({ email, token, type: 'email' });
      }

      if (res.error) {
        console.warn("   âš ï¸  Falha 'email':", res.error.message);
        // 3. Tenta tipo 'magiclink'
        console.log("   > Tentando tipo: 'magiclink'...");
        res = await supaClient.auth.verifyOtp({ email, token, type: 'magiclink' });
      }

      const { data, error } = res;

      if (error) {
        console.error("❌ ERRO FINAL:", error);
        let userMsg = "Código inválid✅";
        if (error.message.includes("expired")) userMsg = "O código expirou ou é antig✅";
        else if (error.message.includes("not found")) userMsg = "E-mail não encontrad✅";

        otpError.textContent = `❌ ${userMsg} (${error.message})`;
        otpError.style.display = "block";
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "✅ Verificar e Entrar";
      } else {
        sessionStorage.removeItem("lastEmailRegistered");
        // Forçar o Supabase a atualizar a sessão internamente antes do redirect
        supaClient.auth.getSession().then(() => {
          setTimeout(() => {
            sessionStorage.setItem('freshLogin', 'true');
            window.location.href = "perfil.html";
          }, 800);
        });
      }
    } catch (err) {
      otpError.textContent = "Erro inesperado na verificaçã✅";
      otpError.style.display = "block";
      verifyOtpBtn.disabled = false;
    }
  });
}

// 5. Excluir Conta
window.deleteUserAccount = async function () {
  if (!supaClient) return { error: { message: 'Supabase não inicializad✅' } };

  try {
    const { data: { user } } = await supaClient.auth.getUser();
    if (!user) return { error: { message: 'Usuário não autenticad✅' } };

    // Chama a função de segurança (Postgres RPC) no Supabase
    const { error } = await supaClient.rpc('delete_user');

    if (error) {
      return { error: { message: error.message || 'Falha ao excluir conta nativamente.' } };
    }

    // Limpar dados locais
    try { localStorage.clear(); } catch (_) { }
    try { sessionStorage.clear(); } catch (_) { }

    await supaClient.auth.signOut();
    return { success: true };
  } catch (e) {
    return { error: { message: e.message || 'Erro inesperad✅' } };
  }
};

window.loadBanners = async function () {
  window.BANNER_MAP = {};

  if (window.supabaseClient) {
    try {
      console.log("🛡️ Sincronizando com Storage do Supabase...");
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
      console.log("⚡ Raw data do Supabase:", supaBanners);

      if (supaBanners && supaBanners.length > 0) {
        supaBanners.forEach((b, index) => {
          const cleanId = b.id ? b.id.trim() : "sem-id";
          const hasUrl = !!b.image_url;

          console.log(`📌 [${index}] ID="${cleanId}" | hasURL=${hasUrl}`);

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

        console.log("⚙ BANNER_MAP final:", Object.keys(window.BANNER_MAP));

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
    } catch (e) { }
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

  // 📸 LÓGICA DE BANNER DA NAVBAR
  if (bannerBg) {
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
  } else {
    // Só tenta novamente em páginas que realmente têm navbar de usuário (não login/registro)
    const isAuthPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("registr✅html");
    if (!isAuthPage) {
      if (!window._navbarCosmeticsRetries) window._navbarCosmeticsRetries = 0;
      if (window._navbarCosmeticsRetries < 20) {
        window._navbarCosmeticsRetries++;
        setTimeout(updateNavbarCosmetics, 100);
      }
    }
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
  if (avatarBox) {
    avatarBox.classList.remove(...auraClasses);
    if (savedAura !== "none") {
      avatarBox.classList.add(savedAura);
      if (savedAura === "aura_stands")
        avatarBox.classList.add("avatar-aura-stands");
    }
    if (hasFrame) {
      avatarBox.classList.add("frame-dourado");
    }
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
        let crownIcon = getCosmetic("crownIcon", "👑");
        if (crownIcon.includes("gorrodenatal.png") || crownIcon === "🎅" || crownIcon.includes("??")) {
          crownIcon = "<img src='assets/gorrodenatal.png' class='gorro-img-cosmetic'>";
        }
        sbCrown.innerHTML = crownIcon;
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
  if (avatarBox) {
    const existingCrown = avatarBox.querySelector(".crown-nav");
    if (existingCrown) existingCrown.remove();
    if (savedCrown) {
      const crown = document.createElement("div");
      crown.className = "crown-nav"; // Usar classe do style.css
      let crownIcon = getCosmetic("crownIcon", "👑");
      if (crownIcon.includes("gorrodenatal.png") || crownIcon === "🎅" || crownIcon.includes("??")) {
        crownIcon = "<img src='assets/gorrodenatal.png' class='gorro-img-cosmetic'>";
      }
      crown.innerHTML = crownIcon;
      avatarBox.appendChild(crown);
    }
  }

  // 🏠 APLICAR EM PÁGINAS ESPECÍFICAS (PERFIL / HISTÓRICO)
  const isProfilePage = window.location.href.includes("perfil.html") || window.location.pathname.endsWith("/perfil") || window.location.pathname === "/perfil/";
  if (isProfilePage) {
    const sidebar =
      document.querySelector(".history-sidebar") ||
      document.querySelector(".profile-sidebar");

    if (sidebar) {
      const bannerUrl = (savedBanner !== "none" && window.BANNER_MAP) ? window.BANNER_MAP[savedBanner] : null;

      // Remover overlay antigo se existir (abordagem antiga com z-index:-1 que não funcionava)
      const oldOverlay = sidebar.querySelector(".sidebar-banner-overlay");
      if (oldOverlay) oldOverlay.remove();

      if (bannerUrl) {
        // Remover estilo de bloqueio do ::before se existir
        const hideStyle = document.getElementById("hide-history-before");
        if (hideStyle) hideStyle.remove();
        
        // Limpar estilo direto para evitar duplicidade ou problemas de z-index
        sidebar.style.backgroundImage = "";
        sidebar.style.backgroundSize = "";
        sidebar.style.backgroundPosition = "";
        sidebar.style.backgroundRepeat = "";
        
        // Define a variável CSS que será usada pelo pseudo-elemento ::before (que tem inset: -12px para preencher as bordas)
        sidebar.style.setProperty("--history-sidebar-banner", `url('${bannerUrl}')`);
      } else {
        // Sem banner: restaurar background padrão do CSS
        const hideStyle = document.getElementById("hide-history-before");
        if (hideStyle) hideStyle.remove();
        
        sidebar.style.backgroundImage = "";
        sidebar.style.backgroundSize = "";
        sidebar.style.backgroundPosition = "";
        sidebar.style.backgroundRepeat = "";
        sidebar.style.removeProperty("--history-sidebar-banner");
      }
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
    
    // Iniciar rastreamento de status online
    window.startPresenceHeartbeat();
  }
});

// 🚀 Rastreamento de Presença (Online Status)
window.startPresenceHeartbeat = async function() {
  if (!supaClient || window.presenceStarted) return;
  window.presenceStarted = true;
  
  window.onlineUsersSet = new Set();
  
  try {
    const { data: { session } } = await supaClient.auth.getSession();
    if (!session) return;
    
    // Atualização de fallback no banco
    const updateStatus = async () => {
      try {
        await supaClient.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', session.user.id);
      } catch (e) {}
    };
    updateStatus();
    setInterval(updateStatus, 120000);

    // Canal global de presença em tempo real
    const globalPresenceChannel = supaClient.channel('global_presence', {
      config: { presence: { key: session.user.id } }
    });

    globalPresenceChannel
      .on('presence', { event: 'sync' }, () => {
        window.onlineUsersSet = new Set();
        const state = globalPresenceChannel.presenceState();
        for (const [key] of Object.entries(state)) {
           window.onlineUsersSet.add(key);
        }
        document.dispatchEvent(new Event('presence_updated'));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalPresenceChannel.track({ online_at: new Date().toISOString() });
        }
      });
      
    window.globalPresenceChannel = globalPresenceChannel;

    // 🚚 Marcar mensagens pendentes como entregues (Funciona em todas as páginas)
    const markAsDelivered = async () => {
      try {
        await supaClient
          .from('direct_messages')
          .update({ delivered_at: new Date().toISOString() })
          .eq('recipient_id', session.user.id)
          .is('delivered_at', null);
      } catch (err) {}
    };
    
    // Executa ao carregar qualquer página
    markAsDelivered();
    
    // Escuta novas mensagens para marcar como entregue em tempo real (mesmo fora da aba de chat)
    supaClient
      .channel('delivery-tracker')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages', 
        filter: `recipient_id=eq.${session.user.id}` 
      }, () => markAsDelivered())
      .subscribe();

  } catch (e) {
    console.error("Erro no heartbeat de presença:", e);
  }
};

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
                <div class="navbar-notification-wrapper">
                  <button class="navbar-bell-trigger" id="navbarBellTrigger" aria-label="Notificações">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <span class="navbar-badge-dot" id="navbarBellBadge" style="display: none;">0</span>
                  </button>
                </div>
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

      // Iniciar Hub de Notificações
      initializeNotificationHub(session.user.id);

      // Se estamos no perfil e não temos perfil no banco, não expulsar imediatamente
      if (!profile && currentPage === "perfil.html") {
        console.warn("Perfil ainda não criado no banc✅ Aguardando sincronizaçã✅..");
      }

      if (!window.BANNER_MAP) await loadBanners();
      else updateNavbarCosmetics();

      // Iniciar batimento cardíaco de presença
      if (typeof window.startPresenceHeartbeat === "function") {
        window.startPresenceHeartbeat();
      }
    } else {
      authContainer.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-right-to-bracket"></i> Entrar</a>`;
      nav.appendChild(authContainer);
    }
  }

  // Proteção de rotas
  const protectedRoutes = [
    "cadastr✅html",
    "cadastro-animes.html",
    "cadastro-filmes.html",
    "cadastro-youtube.html",
    "perfil.html"
  ];
  if (protectedRoutes.includes(currentPage) && !session)
    window.location.href = "login.html";
};

// 🚀 Preencher links da Navbar automaticamente
function populateNavbarLinks() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;

  // Define os links padrão do site
  const links = [
    { name: "<i class='fa-solid fa-house'></i> Início", url: "index.html" },
    { name: "<i class='fa-solid fa-torii-gate'></i> Animes", url: "animes.html" },
    { name: "<i class='fa-solid fa-tv'></i> Desenhos", url: "desenhos.html" },
    { name: "<i class='fa-solid fa-clapperboard'></i> Filmes", url: "filmes.html" },
    { name: "<i class='fa-solid fa-pen-to-square'></i> Painel de Cadastros", url: "painel-cadastros.html" },
    { name: "<i class='fa-solid fa-book'></i> Mangás", url: "mangas.html" },
    { name: "<i class='fa-regular fa-comment-dots'></i> HQs", url: "hq.html" },
    { name: "<i class='fa-solid fa-play'></i> YouTube", url: "youtube.html" },
    { name: "<i class='fa-solid fa-flag'></i> SenseiMod Store", url: "loja.html" },
    { name: "<i class='fa-solid fa-robot'></i> Open AnIme", url: "open-anime.html" },
    { name: "<i class='fa-solid fa-users'></i> Equipe", url: "sobre.html" },
    { name: "<i class='fa-solid fa-heart'></i> Agradecimento", url: "agradeciment✅html" }
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  navLinks.innerHTML = links.map(link => `
    <li>
      <a href="${link.url}" class="${currentPage === link.url ? 'active' : ''}">
        ${link.name}
      </a>
    </li>
  `).join('');
}

document.addEventListener("DOMContentLoaded", () => {
  populateNavbarLinks();
  window.checkAuthStatus();
});

async function ensureOAuthClientReady() {
  if (!supaClient && !tryInit()) {
    throw new Error("Supabase ainda não inicializou. Recarregue a página e tente novamente.");
  }
  return supaClient;
}

function showOAuthError(providerName, error) {
  const providerLabel = providerName || "provedor social";
  const message = error?.message || "Falha ao autenticar.";
  console.error(`Erro ${providerLabel}:`, message);
  if (typeof showToast === "function") {
    showToast(`❌ Erro ao entrar com ${providerLabel}: ${message}`, "danger");
  } else {
    alert(`Erro ao entrar com ${providerLabel}: ${message}`);
  }
}

// --- LOGIN COM GITHUB ---
async function signInWithGithub() {
  try {
    await ensureOAuthClientReady();
  } catch (error) {
    showOAuthError("GitHub", error);
    return;
  }

  const { data, error } = await supaClient.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin + '/perfil.html'
    }
  });

  if (error) showOAuthError("GitHub", error);
}

// --- LOGIN COM GOOGLE ---
async function signInWithGoogle() {
  try {
    await ensureOAuthClientReady();
  } catch (error) {
    showOAuthError("Google", error);
    return;
  }

  const { data, error } = await supaClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/perfil.html',
      queryParams: {
        prompt: 'select_account'
      }
    }
  });

  if (error) showOAuthError("Google", error);
}

// --- LOGIN COM DISCORD ---
async function signInWithDiscord() {
  try {
    await ensureOAuthClientReady();
  } catch (error) {
    showOAuthError("Discord", error);
    return;
  }

  const { data, error } = await supaClient.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin + '/perfil.html'
    }
  });

  if (error) showOAuthError("Discord", error);
}

// Expor para o HTML
window.signInWithGithub = signInWithGithub;
window.signInWithGoogle = signInWithGoogle;
window.signInWithDiscord = signInWithDiscord;

// Adicionar listeners para os botões social se existirem
document.addEventListener("click", (e) => {
  if (e.target.closest("#githubLoginBtn") || e.target.closest("#githubRegBtn")) {
    signInWithGithub();
  }
  if (e.target.closest("#googleLoginBtn") || e.target.closest("#googleRegBtn")) {
    signInWithGoogle();
  }
  if (e.target.closest("#discordLoginBtn") || e.target.closest("#discordRegBtn")) {
    signInWithDiscord();
  }
});

// â”€â”€â”€ Enter global para inputs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Permite concluir qualquer ação do site pressionando Enter em um campo de texto,
// exceto no campo de exclusão de conta (para evitar acidentes).
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const el = document.activeElement;
  if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) return;

  // Permitir Shift+Enter livremente em Textareas para quebra de linha
  if (e.shiftKey && el.tagName === "TEXTAREA") return;

  // Nunca ativar Enter em campos de exclusão de conta
  const dangerIds = ["deleteConfirmEmail", "deleteConfirmPassword"];
  if (dangerIds.includes(el.id)) return;

  // 1. Se já está dentro de um <form> com botão submit, deixar o comportamento nativo
  const parentForm = el.closest("form");
  if (parentForm) {
    const submitBtn = parentForm.querySelector('button[type="submit"]:not([disabled])');
    if (submitBtn) {
      e.preventDefault();
      submitBtn.click();
      return;
    }
  }

  // 2. Para inputs fora de forms (OTP, modal de senha, etc.):
  //    Procura o botão de ação primário mais próximo na mesma seção/container
  const EXCLUDED_BTN_IDS = ["deleteAccountBtn", "confirmDeleteBtn"];

  // Mapa de input â†’ botão de ação
  // op
  const inputToBtnMap = {
    "otpToken": "verifyOtpBtn",
    "recoveryNewPassword": "recoveryBtn",
    "recoveryConfirmPassword": "recoveryBtn",
    "resendEmail": "resendBtn",
    "phoneLoginOtpToken": "verifyPhoneLoginOtpBtn",
    "phoneRegOtpToken": "verifyPhoneRegOtpBtn",
  };

  if (inputToBtnMap[el.id]) {
    const targetBtn = document.getElementById(inputToBtnMap[el.id]);
    if (targetBtn && !targetBtn.disabled && !EXCLUDED_BTN_IDS.includes(targetBtn.id)) {
      e.preventDefault();
      targetBtn.click();
      return;
    }
  }

  // 3. Fallback: procura o primeiro botão primário visível no mesmo container pai
  const container = el.closest("section, .auth-card, .modal, [id$='Section'], [id$='Container'], [id$='Card'], form") || el.parentElement;
  if (container) {
    const btn = container.querySelector('button.btn-primary:not([disabled]), button[type="submit"]:not([disabled])');
    if (btn && !EXCLUDED_BTN_IDS.includes(btn.id)) {
      e.preventDefault();
      btn.click();
    }
  }
});

// ===== NOTIFICATION CENTER UI HELPERS =====

function updateNotificationBadge(count) {
  const badge = document.getElementById('navbarBellBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

async function fetchNotificationCount() {
  if (!supaClient || !notificationState.userId) return;
  try {
    const { count } = await supaClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', notificationState.userId)
      .eq('read', false);
    updateNotificationBadge(count || 0);
  } catch (e) {
    console.warn('[NotificationHub] Erro ao buscar contagem:', e);
  }
}

function createNotificationCenterUI() {
  const existingCenter = document.getElementById('notificationCenter');
  const existingOverlay = document.getElementById('notificationOverlay');
  if (existingCenter) existingCenter.remove();
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'notificationOverlay';
  overlay.className = 'notification-center-overlay';
  overlay.onclick = () => toggleNotificationCenter();

  const center = document.createElement('div');
  center.id = 'notificationCenter';
  center.className = 'notification-center';

  const adminPanelHtml = notificationState.isAdmin ? `
    <details class="notification-admin-panel" style="margin-bottom:1rem;">
      <summary style="cursor:pointer; font-weight:700; color:var(--primary); padding:8px 0;">
        <i class="fa-solid fa-shield-halved"></i> Painel Admin - Enviar Notificação
      </summary>
      <div style="margin-top:0.75rem; display:flex; flex-direction:column; gap:0.5rem;">
        <input id="adminNotifUserId" type="text" placeholder="User ID do destinatário (deixe vazio para todos)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem;"/>
        <input id="adminNotifTitle" type="text" placeholder="Título da notificação" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem;"/>
        <textarea id="adminNotifMessage" rows="2" placeholder="Mensagem..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem; resize:vertical;"></textarea>
        <input id="adminNotifLink" type="text" placeholder="Link (opcional)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem;"/>
        <button onclick="sendAdminNotification()" style="background:var(--primary); color:#fff; border:none; border-radius:8px; padding:8px 16px; cursor:pointer; font-weight:700;">
          <i class="fa-solid fa-paper-plane"></i> Enviar
        </button>
      </div>
    </details>
   ` : '';

  center.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
      <h3 style="font-family:'Bangers'; font-size:1.4rem; color:var(--primary); letter-spacing:1px; margin:0;">
        <i class="fa-solid fa-bell"></i> Notificações
      </h3>
      <button class="notification-center__close" onclick="toggleNotificationCenter()" title="Fechar">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    ${adminPanelHtml}
    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap;">
      <div style="display:flex; gap:0.5rem;">
        <button class="notif-tab active" data-tab="all" onclick="switchNotifTab('all', this)">Todas</button>
        <button class="notif-tab" data-tab="site" onclick="switchNotifTab('site', this)">Site</button>
        <button class="notif-tab" data-tab="chat" onclick="switchNotifTab('chat', this)">Chat</button>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; margin-left:auto;">
        <input type="checkbox" id="selectAllNotifs" title="Selecionar todas" style="cursor:pointer;">
        <span style="font-size:0.8rem; color:var(--text-muted);">Selecionar todas</span>
      </div>
    </div>
    <div id="notifCenterContent" class="notification-center__content">
      <div style="text-align:center; padding:20px;"><span class="loader-ring"></span> Carregando...</div>
    </div>
    <div class="notification-center__footer" style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:space-between; align-items:center;">
      <div style="display:flex; gap:0.5rem;">
        <button id="markSelectedReadBtn" class="btn-notif-action" onclick="handleBatchAction('read')" disabled>
          <i class="fa-solid fa-check-double"></i> Marcar lidas
        </button>
        <button id="deleteSelectedBtn" class="btn-notif-action danger" onclick="handleBatchAction('delete')" disabled>
          <i class="fa-solid fa-trash"></i> Excluir
        </button>
      </div>
      <button class="btn-notif-action" onclick="markAllAsRead()">
        <i class="fa-solid fa-envelope-open"></i> Marcar todas como lidas
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(center);

  const selectAll = document.getElementById('selectAllNotifs');
  if (selectAll) {
    selectAll.onchange = () => {
      const content = document.getElementById('notifCenterContent');
      const checkboxes = content?.querySelectorAll('.notification-item__checkbox') || [];
      checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
      syncNotificationSelectionState();
    };
  }
}
function attachNotificationListeners() {
  const bell = document.getElementById('navbarBellTrigger');
  if (bell && !bell._notifListenerAttached) {
    bell.onclick = (e) => {
      e.stopPropagation();
      toggleNotificationCenter();
    };
    bell._notifListenerAttached = true;
  }
  const selectAll = document.getElementById('selectAllNotifs');
  if (selectAll) {
    selectAll.onchange = () => {
      const content = document.getElementById('notifCenterContent');
      const checkboxes = content?.querySelectorAll('.notification-item__checkbox') || [];
      checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
      syncNotificationSelectionState();
    };
  }
}

window.switchNotifTab = function(tab, btnEl) {
  document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  notificationState.activeFilter = tab;
  notificationState.notifications = [];
  loadNotificationsList(tab);
};

window.sendAdminNotification = async function() {
  if (!supaClient) return;
  const userId = document.getElementById('adminNotifUserId')?.value.trim();
  const title = document.getElementById('adminNotifTitle')?.value.trim();
  const message = document.getElementById('adminNotifMessage')?.value.trim();
  const link = document.getElementById('adminNotifLink')?.value.trim();
  if (!title || !message) {
    if (window.showToast) showToast('Preencha título e mensagem.', 'error');
    return;
  }
  const payload = { title, message, link: link || null, type: 'site', read: false };
  if (userId) payload.user_id = userId;
  const { error } = await supaClient.from('notifications').insert([payload]);
  if (error) {
    if (window.showToast) showToast('Erro ao enviar notificação.', 'error');
  } else {
    if (window.showToast) showToast('Notificação enviada!', 'success');
    document.getElementById('adminNotifTitle').value = '';
    document.getElementById('adminNotifMessage').value = '';
    document.getElementById('adminNotifLink').value = '';
    document.getElementById('adminNotifUserId').value = '';
  }
};

// Notification hub overrides
async function initializeNotificationHub(userId) {
  if (!userId) return;

  const isSameUser = notificationState.initializedForUserId === userId;
  notificationState.userId = userId;
  if (!isSameUser) {
    notificationState.activeFilter = 'all';
    notificationState.notifications = [];
  }

  const { data: userData } = await supaClient.auth.getUser();
  const email = (userData?.user?.email || "").toLowerCase();
  notificationState.isAdmin = email === "davizeravisel@gmail.com";

  createNotificationCenterUI();
  await loadNotificationsList(notificationState.activeFilter);

  if (!isSameUser) {
    setupNotificationRealtime();
  }
  notificationState.initializedForUserId = userId;

  const bell = document.getElementById('navbarBellTrigger');
  if (bell) {
    bell.onclick = (e) => {
      e.stopPropagation();
      toggleNotificationCenter();
    };
  }
}

function syncNotificationBadgeFromState() {
  const unreadCount = notificationState.notifications.filter((item) => !item.read).length;
  updateNotificationBadge(unreadCount);
}

function getFilteredNotificationState(filter = notificationState.activeFilter) {
  if (filter === 'chat') {
    return notificationState.notifications.filter((item) => item.type === 'chat');
  }
  if (filter === 'site') {
    return notificationState.notifications.filter((item) => item.type !== 'chat');
  }
  return notificationState.notifications.slice();
}

function renderNotificationListFromState() {
  const content = document.getElementById('notifCenterContent');
  if (!content) return;

  const notifications = getFilteredNotificationState();
  if (!notifications.length) {
    content.innerHTML = `
      <div class="notif-empty-state">
        <div class="notif-empty-icon"><i class="fa-solid fa-envelope-open-text" style="font-size: 2.5rem; color: var(--primary);"></i></div>
        <p>${notificationState.activeFilter === 'chat' ? 'Nenhuma mensagem recente.' : 'Você não tem notificações.'}</p>
      </div>
    `;
    syncNotificationSelectionState();
    return;
  }

  content.innerHTML = notifications.map((notification) => {
    const isUnread = !notification.read;
    return `
      <div class="notification-item ${isUnread ? 'unread' : 'read'}" data-id="${notification.id}" onclick="handleNotificationClick('${notification.id}', '${notification.link || ''}')">
        <input type="checkbox" class="notification-item__checkbox" onclick="event.stopPropagation()">
        <div class="notification-item__icon">${getNotifIcon(notification.type)}</div>
        <div class="notification-item__main">
          <div class="notification-item__title">${notification.title}</div>
          <div class="notification-item__text">${notification.message}</div>
          <div class="notification-item__time">${formatNotifTime(notification.created_at)}</div>
        </div>
        ${isUnread ? '<div class="notification-item__dot"></div>' : ''}
        <button class="notification-item__delete" title="Excluir" onclick="event.stopPropagation(); deleteNotifications([\'${notification.id}\'])"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }).join('');

  content.querySelectorAll('.notification-item__checkbox').forEach((checkbox) => {
    checkbox.onchange = () => syncNotificationSelectionState();
  });
  syncNotificationSelectionState();
}

function clearNotificationBatchSelection() {
  const selectAll = document.getElementById('selectAllNotifs');
  if (selectAll) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  }
  syncNotificationSelectionState();
}

async function loadNotificationsList(filter = 'all') {
  const content = document.getElementById('notifCenterContent');
  if (!content) return;

  notificationState.activeFilter = filter || 'all';
  if (notificationState.notifications.length > 0) {
    renderNotificationListFromState();
    return;
  }

  content.innerHTML = '<div style="text-align:center; padding:20px;"><span class="loader-ring"></span> Carregand✅..</div>';
  syncNotificationSelectionState();

  try {
    let query = supaClient
      .from('notifications')
      .select('*')
      .eq('user_id', notificationState.userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (notificationState.activeFilter === 'chat') {
      query = query.eq('type', 'chat');
    } else if (notificationState.activeFilter === 'site') {
      query = query.neq('type', 'chat');
    }

    const { data: notifs, error } = await query;
    if (error) throw error;

    notificationState.notifications = Array.isArray(notifs) ? notifs : [];
    syncNotificationBadgeFromState();
    renderNotificationListFromState();
  } catch (err) {
    console.error("Erro ao carregar lista:", err);
    content.innerHTML = `<p style="color:var(--danger); padding:20px; text-align:center;">Erro ao carregar notificações.</p>`;
  }
}

async function handleBatchAction(action) {
  const content = document.getElementById('notifCenterContent');
  const selectedCheckboxes = content?.querySelectorAll('.notification-item__checkbox:checked') || [];
  const ids = Array.from(selectedCheckboxes)
    .map((checkbox) => checkbox.closest('.notification-item')?.dataset?.id)
    .filter(Boolean);
  const actionButton = action === 'delete'
    ? document.getElementById('deleteSelectedBtn')
    : document.getElementById('markSelectedReadBtn');
  const originalActionText = actionButton?.textContent || '';

  if (!ids.length) {
    alert("Selecione pelo menos uma notificação para realizar esta aÃ§Ã£✅");
    return;
  }

  if (actionButton) {
    actionButton.disabled = true;
    actionButton.textContent = action === 'delete' ? 'Excluind✅..' : 'Marcand✅..';
  }

  try {
    if (action === 'delete') {
      await deleteNotifications(ids);
    } else {
      await markNotificationsRead(ids);
    }
    clearNotificationBatchSelection();
  } finally {
    if (actionButton) {
      actionButton.textContent = originalActionText;
    }
  }
}

async function markNotificationsRead(ids) {
  if (!ids || !ids.length) return;

  try {
    const { error } = await supaClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', notificationState.userId)
      .in('id', ids);

    if (error) throw error;

    notificationState.notifications = notificationState.notifications.map((item) => (
      ids.includes(item.id) ? { ...item, read: true } : item
    ));
    syncNotificationBadgeFromState();
    renderNotificationListFromState();
  } catch (err) {
    console.error("Erro ao marcar como lidas:", err);
  }
}

async function deleteNotifications(ids) {
  if (!ids || !ids.length) return;

  try {
    const { error } = await supaClient
      .from('notifications')
      .delete()
      .eq('user_id', notificationState.userId)
      .in('id', ids);

    if (error) throw error;

    notificationState.notifications = notificationState.notifications.filter((item) => !ids.includes(item.id));
    syncNotificationBadgeFromState();
    renderNotificationListFromState();
  } catch (err) {
    console.error("Erro ao deletar notificações:", err);
    alert("Erro ao excluir: " + err.message);
  }
}

function setupNotificationRealtime() {
  if (!supaClient || !notificationState.userId) return;

  if (notificationState.realtimeChannel) {
    supaClient.removeChannel(notificationState.realtimeChannel);
    notificationState.realtimeChannel = null;
  }

  notificationState.realtimeChannel = supaClient.channel(`realtime_notifications_${notificationState.userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${notificationState.userId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        notificationState.notifications = notificationState.notifications
          .filter((item) => item.id !== payload.new.id);
        notificationState.notifications.unshift(payload.new);
        notificationState.notifications = notificationState.notifications
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 30);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const exists = notificationState.notifications.some((item) => item.id === payload.new.id);
        notificationState.notifications = exists
          ? notificationState.notifications.map((item) => (item.id === payload.new.id ? payload.new : item))
          : [payload.new, ...notificationState.notifications].slice(0, 30);
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        notificationState.notifications = notificationState.notifications.filter((item) => item.id !== payload.old.id);
      } else {
        return;
      }

      syncNotificationBadgeFromState();
      if (notificationState.isOpen) {
        renderNotificationListFromState();
      }

      if (payload.eventType === 'INSERT' && payload.new && window.showToast) {
        showToast(`ðŸ”” ${payload.new.title}`, "info");
        const bell = document.getElementById('navbarBellTrigger');
        if (bell) {
          bell.classList.remove('ringing');
          void bell.offsetWidth; // Trigger reflow
          bell.classList.add('ringing');
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("âœ… Escutando notificações em tempo real");
      }
    });
}

function syncNotificationSelectionState() {
  const content = document.getElementById('notifCenterContent');
  const selectAll = document.getElementById('selectAllNotifs');
  const actionButtons = [
    document.getElementById('markSelectedReadBtn'),
    document.getElementById('deleteSelectedBtn')
  ];

  const checkboxes = Array.from(content?.querySelectorAll('.notification-item__checkbox') || []);
  const checkedCount = checkboxes.filter(cb => cb.checked).length;
  const hasItems = checkboxes.length > 0;

  if (selectAll) {
    selectAll.disabled = !hasItems;
    selectAll.checked = hasItems && checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
  }

  actionButtons.forEach((button) => {
    if (button) button.disabled = !hasItems || checkedCount === 0;
  });
}

async function handleBatchActionLegacy(action) {
  const content = document.getElementById('notifCenterContent');
  const selectedCheckboxes = content?.querySelectorAll('.notification-item__checkbox:checked') || [];
  const ids = Array.from(selectedCheckboxes)
    .map(cb => cb.closest('.notification-item')?.dataset?.id)
    .filter(id => !!id);
  const actionButton = action === 'delete'
    ? document.getElementById('deleteSelectedBtn')
    : document.getElementById('markSelectedReadBtn');
  const originalActionText = actionButton?.textContent || '';

  if (ids.length === 0) {
    alert("Selecione pelo menos uma notificação para realizar esta aÃ§Ã£✅");
    return;
  }

  if (actionButton) {
    actionButton.disabled = true;
    actionButton.textContent = action === 'delete' ? 'Excluind✅..' : 'Marcand✅..';
  }

  try {
    if (action === 'delete') {
      await deleteNotifications(ids);
    } else {
      await markNotificationsRead(ids);
    }
  } finally {
    if (actionButton) {
      actionButton.textContent = originalActionText;
    }
  }

  // Limpar o estado do checkbox "Selecionar Tudo"
  const selectAllBatch = document.getElementById('selectAllNotifs');
  if (selectAllBatch) {
    selectAllBatch.checked = false;
    selectAllBatch.indeterminate = false;
  }
  syncNotificationSelectionState();
  return;
}

function toggleNotificationCenter() {
  const center = document.getElementById('notificationCenter');
  const overlay = document.getElementById('notificationOverlay');
  
  if (!center || !overlay) return;

  notificationState.isOpen = !notificationState.isOpen;
  
  if (notificationState.isOpen) {
    center.classList.add('active');
    overlay.classList.add('active');
    loadNotificationsList(notificationState.activeFilter);
    // Re-anexar listeners para garantir que funcionem
    attachNotificationListeners();
  } else {
    center.classList.remove('active');
    overlay.classList.remove('active');
  }
}

async function loadNotificationsListLegacy(filter = 'all') {
  const content = document.getElementById('notifCenterContent');
  if (!content) return;
  notificationState.activeFilter = filter || 'all';

  content.innerHTML = '<div style="text-align:center; padding:20px;"><span class="loader-ring"></span> Carregand✅..</div>';
  syncNotificationSelectionState();

  try {
    let query = supaClient
      .from('notifications')
      .select('*')
      .eq('user_id', notificationState.userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (filter === 'chat') {
      query = query.eq('type', 'chat');
    } else if (filter === 'site') {
      query = query.neq('type', 'chat');
    }

    const { data: notifs, error } = await query;

    if (error) throw error;
    notificationState.notifications = Array.isArray(notifs) ? notifs : [];
    syncNotificationBadgeFromState();
    renderNotificationListFromState();
    return;

  } catch (err) {
    console.error("Erro ao carregar lista:", err);
    content.innerHTML = `<p style="color:var(--danger); padding:20px; text-align:center;">Erro ao carregar notificações.</p>`;
  }
}

async function handleNotificationClick(id, link) {
  await markAsRead(id);
  if (link) {
    window.location.href = link;
  }
}

function getNotifIcon(type) {
  const icons = {
    'system': 'âš™ï¸',
    'social': 'ðŸ‘¥',
    'loja': 'ðŸŽŒ',
    'xp': 'âœ¨',
    'medalha': 'ðŸ…',
    'chat': 'ðŸ’¬'
  };
  return icons[type] || 'ðŸ””';
}

function formatNotifTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  
  return date.toLocaleDateString('pt-BR');
}

async function markNotificationsReadLegacy(ids) {
  if (!ids || ids.length === 0) return;
  try {
    const { error } = await supaClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', notificationState.userId)
      .in('id', ids);

    if (!error) {
      notificationState.notifications = notificationState.notifications.map((item) => (
        ids.includes(item.id) ? { ...item, read: true } : item
      ));
      syncNotificationBadgeFromState();
      renderNotificationListFromState();
      return;
    }
  } catch (err) {
    console.error("Erro ao marcar como lidas:", err);
  }
}

async function deleteNotificationsLegacy(ids) {
  if (!ids || ids.length === 0) return;
  
  try {
    console.log(`[NotificationHub] Excluindo ${ids.length} notificações...`);
    const { error } = await supaClient
      .from('notifications')
      .delete()
      .eq('user_id', notificationState.userId)
      .in('id', ids);
    if (error) throw error;
    notificationState.notifications = notificationState.notifications.filter((item) => !ids.includes(item.id));
    syncNotificationBadgeFromState();
    renderNotificationListFromState();
    return;
  } catch (err) {
    console.error("Erro ao deletar notificações:", err);
    alert("Erro ao excluir: " + err.message);
  }
}

async function markAsRead(id) {
  await markNotificationsRead([id]);
}

async function markAllAsRead() {
  // Mantendo para compatibilidade se necessário, mas agora usamos handleBatchAction
  const allIds = Array.from(document.querySelectorAll('.notification-item')).map(el => el.dataset.id);
  if (allIds.length > 0) await markNotificationsRead(allIds);
}

function setupNotificationRealtimeLegacy() {
  if (!supaClient || !notificationState.userId) return;

  if (notificationState.realtimeChannel) {
    supaClient.removeChannel(notificationState.realtimeChannel);
    notificationState.realtimeChannel = null;
  }

  // Canal para mudanças nas notificações do usuário
  notificationState.realtimeChannel = supaClient.channel(`realtime_notifications_${notificationState.userId}`)
    .on('postgres_changes', {
      event: '*', // Ouvir TUDO (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${notificationState.userId}`
    }, (payload) => {
      console.log("Evento de notificação:", payload.eventType, payload);
      
      // Atualizar contagem do badge sempre
      fetchNotificationCount();

      // Se o painel estiver aberto, recarregar a lista para refletir a mudança
      if (notificationState.isOpen) {
        const activeTab = document.querySelector('.notif-tab.active')?.dataset.tab || 'all';
        loadNotificationsList(activeTab);
      }
      
      // Se for uma inserção, mostrar um Toast
      if (payload.eventType === 'INSERT' && window.showToast) {
        showToast(`ðŸ”” ${payload.new.title}`, "info");
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("âœ… Escutando notificações em tempo real");
      }
    });
}
// Password Strength and Generator functions
window.updatePasswordStrength = function(password, fillId, textId) {
  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (!fill || !text) return;
  if (!password) {
    fill.style.width = '0%'; fill.style.backgroundColor = 'transparent';
    text.textContent = 'Força: Muito Fraca'; text.style.color = 'var(--text-muted)';
    return;
  }
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) {
    fill.style.width = '33%'; fill.style.backgroundColor = 'var(--danger)';
    text.textContent = 'Força: Fraca'; text.style.color = 'var(--danger)';
  } else if (score === 3 || score === 4) {
    fill.style.width = '66%'; fill.style.backgroundColor = '#facc15';
    text.textContent = 'Força: Média'; text.style.color = '#facc15';
  } else {
    fill.style.width = '100%'; fill.style.backgroundColor = 'var(--success)';
    text.textContent = 'Força: Forte'; text.style.color = 'var(--success)';
  }
};
window.generateMD5Password = function(pwdId, confirmId) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let hash = "A" + "a" + "1" + "@"; // Garante pelo menos um de cada tipo para força máxima
  const array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < 28; i++) {
    hash += chars[array[i] % chars.length];
  }
  hash = hash.split('').sort(() => 0.5 - Math.random()).join('');

  const pwdInput = document.getElementById(pwdId);
  const confirmInput = document.getElementById(confirmId);
  if (pwdInput) { pwdInput.value = hash; pwdInput.dispatchEvent(new Event('input')); }
  if (confirmInput) { confirmInput.value = hash; confirmInput.dispatchEvent(new Event('input')); }
  
  const container = document.getElementById('toast');
  if (container) {
    const el = document.createElement('div');
    el.className = 'undo-toast';
    el.innerHTML = `
      <div class="undo-content">
        <span>Senha ultra-segura gerada e preenchida!</span>
      </div>
      <div class="undo-progress" style="transition: width 4s linear;"></div>
    `;
    container.appendChild(el);
    
    setTimeout(() => {
      const progress = el.querySelector('.undo-progress');
      if (progress) progress.style.width = '0%';
    }, 50);

    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 300);
    }, 4000);
  } else {
    alert('Senha ultra-segura gerada e preenchida!');
  }
};


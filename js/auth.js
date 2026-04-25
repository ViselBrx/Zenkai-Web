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
      const isRecovery = window.location.hash.includes("type=recovery");

      if (isRecovery) {
        sessionStorage.setItem('is_recovering_password', 'true');
      }

      if (isAuthPage && !isRecovery) {
        // Se a pessoa atualizou a página no meio da recuperação (perdeu o hash), nós a desconectamos
        if (sessionStorage.getItem('is_recovering_password') === 'true') {
          sessionStorage.removeItem('is_recovering_password');
          await supaClient.auth.signOut();
          return; // Para aqui, forçando ela a ficar na página de login limpa
        }

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
              
              <button id="recoveryBtn" class="btn btn-primary" style="width:100%; padding:14px; font-size:1.1rem; border-radius:10px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; transition:all 0.3s ease;">💾 Redefinir Senha</button>
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
            errorDiv.innerHTML = "❌ A senha deve ter pelo menos 6 caracteres.";
            errorDiv.style.display = "block";
            return;
          }
          if (newPassword !== confirmPassword) {
            errorDiv.innerHTML = "❌ As senhas não coincidem.";
            errorDiv.style.display = "block";
            return;
          }

          errorDiv.style.display = "none";
          const btn = document.getElementById('recoveryBtn');
          btn.innerHTML = `<span class="loader-ring" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></span> Atualizando...`;
          btn.disabled = true;

          const { error } = await supaClient.auth.updateUser({ password: newPassword });

          if (error) {
            let msg = error.message;
            if (msg.toLowerCase().includes("different from the old password")) {
              msg = "A nova senha deve ser diferente da antiga.";
            }
            errorDiv.innerHTML = "❌ Erro: " + msg;
            errorDiv.style.display = "block";
            btn.innerHTML = "💾 Redefinir Senha";
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
                 <p style="color:var(--text-muted); margin-bottom:2rem; font-size:1rem; line-height:1.6;">Sua senha foi redefinida com perfeição. Por segurança, você foi desconectado. Faça o login com sua nova senha.</p>
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
      const redirectUrl = window.location.origin + window.location.pathname;
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
          successDiv.innerHTML = "✅ <strong>E-mail de redefinição enviado!</strong><br/>Verifique sua caixa de entrada.<br/><br/><span style='color:var(--warning); font-size:0.85rem;'>⚠️ <strong>Atenção:</strong> Não encontrou? Verifique sua pasta de <strong>Spam ou Lixo Eletrônico</strong>.</span>";
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

      sessionStorage.setItem('freshLogin', 'true');
      window.location.href = "perfil.html";
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

    if (error) {
      let msg = error.message;

      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
        msg = "⚠️ Limite de tentativas atingido. Por favor, aguarde alguns minutos.";
      } else if (msg.toLowerCase().includes("security purposes")) {
        msg = "⚠️ Você já solicitou um código para este e-mail. Aguarde 1 minuto para tentar novamente.";
      } else if (msg.toLowerCase().includes("confirmation email") || msg.toLowerCase().includes("email send failed")) {
        msg = "⚠️ Erro no servidor de e-mail (SMTP). Por favor, verifique as configurações de SMTP no painel do Supabase.";
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists") || error.status === 422) {
        msg = "❌ Alguém já está usando essa conta. Tente fazer login ou use outro e-mail.";
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
      alert("Digite o e-mail para reenviar o código.");
      return;
    }
    resendBtn.disabled = true;
    resendBtn.textContent = "📨 Enviando...";
    const client = window.supabaseClient;
    if (!client) {
      resendBtn.textContent = "❌ Erro ao reenviar. Tente novamente.";
      setTimeout(() => { resendBtn.textContent = "📧 Reenviar Código"; resendBtn.disabled = false; }, 3000);
      return;
    }
    const { error } = await client.auth.resend({ type: "signup", email: emailToResend });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("security purposes") || msg.toLowerCase().includes("too many")) {
        msg = "Aguarde 1 minuto antes de reenviar.";
      }
      resendBtn.textContent = "❌ " + msg;
      setTimeout(() => { resendBtn.textContent = "📧 Reenviar Código"; resendBtn.disabled = false; }, 5000);
    } else {
      resendCooldown = true;
      let seconds = 60;
      resendBtn.textContent = `✅ Código reenviado! Aguarde ${seconds}s`;
      const interval = setInterval(() => {
        seconds--;
        resendBtn.textContent = `⏳ Aguarde ${seconds}s para reenviar`;
        if (seconds <= 0) {
          clearInterval(interval);
          resendBtn.disabled = false;
          resendBtn.textContent = "📧 Reenviar Código";
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
            sessionStorage.setItem('freshLogin', 'true');
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
    try { localStorage.clear(); } catch (_) { }
    try { sessionStorage.clear(); } catch (_) { }

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
    const isAuthPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("registro.html");
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
  if (window.location.href.includes("perfil.html")) {
    const sidebar =
      document.querySelector(".history-sidebar") ||
      document.querySelector(".profile-sidebar");

    if (sidebar) {
      const bannerUrl = (savedBanner !== "none" && window.BANNER_MAP) ? window.BANNER_MAP[savedBanner] : null;

      // Remover overlay antigo se existir (abordagem antiga com z-index:-1 que não funcionava)
      const oldOverlay = sidebar.querySelector(".sidebar-banner-overlay");
      if (oldOverlay) oldOverlay.remove();

      if (bannerUrl) {
        // Aplicar banner DIRETAMENTE como background da sidebar (gradiente + imagem)
        // Isso evita o problema de z-index onde o overlay ficava atrás do fundo da página
        sidebar.style.backgroundImage = `linear-gradient(
          rgba(10, 25, 47, 0.72) 0%,
          rgba(10, 25, 47, 0.85) 60%,
          rgba(10, 25, 47, 0.95) 100%
        ), url('${bannerUrl}')`;
        sidebar.style.backgroundSize = "cover";
        sidebar.style.backgroundPosition = "center top";
        sidebar.style.backgroundRepeat = "no-repeat";
      } else {
        // Sem banner: restaurar background padrão do CSS
        sidebar.style.backgroundImage = "";
        sidebar.style.backgroundSize = "";
        sidebar.style.backgroundPosition = "";
        sidebar.style.backgroundRepeat = "";
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

// --- LOGIN COM GITHUB ---
async function signInWithGithub() {
  const { data, error } = await supaClient.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin + '/perfil.html'
    }
  });

  if (error) {
    console.error("Erro GitHub:", error.message);
    if (typeof showToast === "function") showToast("❌ Erro ao entrar com GitHub", "danger");
  }
}

// --- LOGIN COM GOOGLE ---
async function signInWithGoogle() {
  const { data, error } = await supaClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/perfil.html',
      queryParams: {
        prompt: 'select_account'
      }
    }
  });

  if (error) {
    console.error("Erro Google:", error.message);
    if (typeof showToast === "function") showToast("❌ Erro ao entrar com Google", "danger");
  }
}

// Expor para o HTML
window.signInWithGithub = signInWithGithub;
window.signInWithGoogle = signInWithGoogle;

// Adicionar listeners para os botões social se existirem
document.addEventListener("click", (e) => {
  if (e.target.closest("#githubLoginBtn") || e.target.closest("#githubRegBtn")) {
    signInWithGithub();
  }
  if (e.target.closest("#googleLoginBtn") || e.target.closest("#googleRegBtn")) {
    signInWithGoogle();
  }
});

// ─── Enter global para inputs ────────────────────────────────────────────────
// Permite concluir qualquer ação do site pressionando Enter em um campo de texto,
// exceto no campo de exclusão de conta (para evitar acidentes).
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const el = document.activeElement;
  if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) return;

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

  // Mapa de input → botão de ação
  const inputToBtnMap = {
    "otpToken": "verifyOtpBtn",
    "recoveryNewPassword": "recoveryBtn",
    "recoveryConfirmPassword": "recoveryBtn",
    "resendEmail": "resendBtn",
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

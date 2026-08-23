/**
 * Bezart ID - v2.1.8 (Email/Password Only Authentication Core)
 * Design Language: Music-Tech Minimalist (Light, Clean, Logo-Optimized)
 */

const CONFIG = {
  SUPABASE_URL: 'https://nxbcsexjwhohqginkxym.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YmNzZXhqd2hvaHFnaW5reHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNzc3NzAsImV4cCI6MjEwMjg1Mzc3MH0.KKigJuyuaRCKDr1WDQqH-tJUTgcjdpWQXikScYkGx2c',
  DEFAULT_REDIRECT: 'https://bezart.f5.si/',
  VERSION: '2.1.8',
  AUTH_TTL: 3600
};

function getConfig(env) {
  return {
    SUPABASE_URL: env.SUPABASE_URL || CONFIG.SUPABASE_URL,
    SUPABASE_KEY: env.SUPABASE_KEY || CONFIG.SUPABASE_KEY,
    DEFAULT_REDIRECT: env.DEFAULT_REDIRECT || CONFIG.DEFAULT_REDIRECT,
    VERSION: env.VERSION || CONFIG.VERSION,
    AUTH_TTL: env.AUTH_TTL || CONFIG.AUTH_TTL
  };
}

function getCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info',
    'Access-Control-Allow-Credentials': 'true',
  };
}

async function callSupabase(path, method, body = null, token = null, config) {
  const headers = new Headers({
    'apikey': config.SUPABASE_KEY,
    'Content-Type': 'application/json'
  });
  if (token) headers.append('Authorization', `Bearer ${token}`);
  return await fetch(`${config.SUPABASE_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : null
  });
}

function sanitizeRedirect(redirectUri, defaultRedirect) {
  if (!redirectUri) return defaultRedirect;
  try {
    const parsed = new URL(redirectUri);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return defaultRedirect;
    }
    return redirectUri;
  } catch {
    return defaultRedirect;
  }
}

async function checkRateLimit(env, identifier, limit = 30, window = 60) {
  if (!env.AUTH_TICKETS) return { allowed: true };
  const key = `ratelimit:${identifier}`;
  const current = await env.AUTH_TICKETS.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    return { allowed: false, remaining: 0, reset: window };
  }
  
  const newCount = count + 1;
  await env.AUTH_TICKETS.put(key, newCount.toString(), { expirationTtl: window });
  
  return { allowed: true, remaining: limit - newCount, reset: window };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";
    const config = getConfig(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
    }

    try {
      if (url.pathname === '/logout') {
        const ticket = url.searchParams.get('ticket');
        let redirect = sanitizeRedirect(url.searchParams.get('redirect'), config.DEFAULT_REDIRECT);
        
        if (ticket && env.AUTH_TICKETS) {
          await env.AUTH_TICKETS.delete(`ticket:${ticket}`);
        }
        
        return Response.redirect(decodeURIComponent(redirect), 302);
      }

      if (url.pathname === '/auth/v1/user') {
        const ticket = url.searchParams.get('ticket');
        const token = env.AUTH_TICKETS ? await env.AUTH_TICKETS.get(`ticket:${ticket}`) : null;
        if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: getCorsHeaders(origin) });
        
        const res = await callSupabase('/auth/v1/user', 'GET', null, token, config);
        const data = await res.json();
        
        if (!res.ok) {
          return new Response(JSON.stringify({
            error: true,
            message: data.message || "ユーザー情報の取得に失敗しました",
            code: data.code,
            status: res.status,
            timestamp: new Date().toISOString()
          }), { status: res.status, headers: getCorsHeaders(origin) });
        }
        
        return new Response(JSON.stringify({
          userId: data.user_metadata?.display_name || data.email?.split('@')[0] || "Bezart User",
          avatar: data.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${data.email}`,
          email: data.email,
          raw: data
        }), { status: res.status, headers: getCorsHeaders(origin) });
      }

      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const { action, email, password, isSignup, displayName, ticket, redirect } = body;

        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rateLimit = await checkRateLimit(env, `auth:${clientIP}`, 30, 60);
        
        if (!rateLimit.allowed) {
          return new Response(JSON.stringify({ 
            error: true, 
            message: "リクエストが多すぎます。しばらく待ってから再試行してください。",
            retryAfter: rateLimit.reset 
          }), { 
            status: 429, 
            headers: { ...getCorsHeaders(origin), 'Retry-After': rateLimit.reset.toString() } 
          });
        }

        const currentRedirect = sanitizeRedirect(redirect, config.DEFAULT_REDIRECT);

        if (action === 'update_profile') {
          const token = env.AUTH_TICKETS ? await env.AUTH_TICKETS.get(`ticket:${ticket}`) : null;
          const res = await callSupabase('/auth/v1/user', 'PUT', { 
            data: { display_name: displayName } 
          }, token, config);
          return new Response(JSON.stringify({ success: res.ok }), { status: 200, headers: getCorsHeaders(origin) });
        }

        if (isSignup) {
          const signupRes = await callSupabase('/auth/v1/signup', 'POST', { 
            email, 
            password, 
            data: { display_name: email.split('@')[0], avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}` } 
          }, null, config);
          const signupData = await signupRes.json();
          
          if (!signupRes.ok) {
            const errCode = signupData.code || signupData.error_code;
            const errMsg = signupData.message || signupData.msg || "";
            
            if (errMsg.includes('already registered') || errCode === 'user_already_exists' || signupRes.status === 422) {
              return new Response(JSON.stringify({
                error: true,
                code: 'USER_ALREADY_REGISTERED',
                message: "このメールアドレスは既に登録されています。ログインをお試しください。"
              }), { status: 400, headers: getCorsHeaders(origin) });
            }

            return new Response(JSON.stringify({
              error: true,
              message: errMsg || "アカウント作成に失敗しました",
              code: errCode,
              status: signupRes.status
            }), { status: signupRes.status, headers: getCorsHeaders(origin) });
          }

          const token = signupData.access_token || signupData.session?.access_token;
          const user = signupData.user || signupData.session?.user;
          const newTicket = crypto.randomUUID();

          if (token && env.AUTH_TICKETS) {
            await env.AUTH_TICKETS.put(`ticket:${newTicket}`, token, { expirationTtl: config.AUTH_TTL });
          } else {
            const loginRes = await callSupabase('/auth/v1/token?grant_type=password', 'POST', { email, password }, null, config);
            const loginData = await loginRes.json();
            if (loginRes.ok && loginData.access_token && env.AUTH_TICKETS) {
              await env.AUTH_TICKETS.put(`ticket:${newTicket}`, loginData.access_token, { expirationTtl: config.AUTH_TTL });
            }
          }

          return new Response(JSON.stringify({ 
            success: true, 
            ticket: newTicket,
            needsProfile: true,
            userData: { 
              email: user?.email || email, 
              name: user?.user_metadata?.display_name || email.split('@')[0], 
              avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
            }
          }), { status: 200, headers: getCorsHeaders(origin) });

        } else {
          const loginRes = await callSupabase('/auth/v1/token?grant_type=password', 'POST', { email, password }, null, config);
          const loginData = await loginRes.json();

          if (!loginRes.ok) {
            return new Response(JSON.stringify({
              error: true,
              message: loginData.error_description || loginData.message || "認証エラーが発生しました。",
              code: loginData.error,
              status: loginRes.status
            }), { status: loginRes.status, headers: getCorsHeaders(origin) });
          }

          const newTicket = crypto.randomUUID();
          const token = loginData.access_token;
          const user = loginData.user;
          
          if (env.AUTH_TICKETS && token) {
            await env.AUTH_TICKETS.put(`ticket:${newTicket}`, token, { expirationTtl: config.AUTH_TTL });
          }

          return new Response(JSON.stringify({ 
            success: true, 
            ticket: newTicket, 
            needsProfile: false,
            userData: { 
              email: user?.email || email, 
              name: user?.user_metadata?.display_name || email.split('@')[0], 
              avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
            }
          }), { status: 200, headers: getCorsHeaders(origin) });
        }
      }

      let initialRedirect = sanitizeRedirect(url.searchParams.get('redirect'), CONFIG.DEFAULT_REDIRECT);

      return new Response(generateBezartUI(initialRedirect), { 
        headers: { 'Content-Type': 'text/html;charset=UTF-8' } 
      });

    } catch (e) {
      console.error('Bezart ID Error:', e.message);
      return new Response(JSON.stringify({ error: true, message: "サーバーエラーが発生しました" }), { 
        status: 500, 
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } 
      });
    }
  }
};

function generateBezartUI(redirect) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Bezart ID</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Noto+Sans+JP:wght@500;700;900&display=swap" rel="stylesheet">
    <style>
        :root { 
            --bg-base: #f8fafc;
            --card-bg: #ffffff;
            --accent: #0284c7; 
            --accent-hover: #0369a1;
            --text-main: #0f172a;
            --text-sub: #64748b;
        }
        body { 
            background-color: var(--bg-base); 
            font-family: 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif;
            min-height: 100dvh; display: flex; align-items: center; justify-content: center; margin: 0;
            -webkit-font-smoothing: antialiased; overflow-x: hidden; color: var(--text-main);
        }
        .bg-mesh {
            position: fixed; inset: 0; z-index: -1;
            background: radial-gradient(circle at 20% 20%, rgba(2, 132, 199, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.04) 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, #f1f5f9 0%, #f8fafc 100%);
        }
        .card { 
            width: 100%; max-width: 440px; background: var(--card-bg);
            border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 32px; padding: 42px 36px;
            box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.08);
            position: relative; z-index: 10;
        }
        .bezart-logo-container { text-align: center; margin-bottom: 24px; }
        .bezart-logo-img { height: 72px; width: auto; object-fit: contain; margin: 0 auto 16px; display: block; filter: drop-shadow(0 4px 12px rgba(2, 132, 199, 0.2)); }
        .title { font-size: 24px; font-weight: 800; text-align: center; color: var(--text-main); letter-spacing: -0.02em; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: var(--text-sub); text-align: center; margin-bottom: 28px; font-weight: 600; }
        .input-group { margin-bottom: 16px; position: relative; }
        .input { width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; font-size: 15px; color: var(--text-main); transition: 0.25s; font-weight: 600; outline: none; box-sizing: border-box; }
        .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12); background: #ffffff; }
        .btn-primary { width: 100%; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 15px; border: none; cursor: pointer; transition: 0.25s; margin-top: 6px; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.25); }
        .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .history-item { display: flex; align-items: center; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; }
        .history-item:hover { border-color: var(--accent); background: #f0f9ff; }
        .history-avatar { width: 36px; height: 36px; border-radius: 10px; background: #cbd5e1; margin-right: 12px; object-fit: cover; }
        .tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 14px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
        .tab-btn { flex: 1; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; text-align: center; color: var(--text-sub); }
        .tab-btn.active { background: #ffffff; color: var(--text-main); box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08); }
        .view-step { display: none; }
        .view-step.active { display: block; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .footer { position: fixed; bottom: 20px; font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.1em; }
    </style>
</head>
<body>
    <div class="bg-mesh"></div>
    <div class="card">
        <!-- Step 1: Login / Signup -->
        <div id="step-auth" class="view-step active">
            <div class="bezart-logo-container">
                <img src="https://bezart.f5.si/Bezart.png" alt="Bezart Logo" class="bezart-logo-img">
                <h1 class="title" id="auth-title">Bezart ID</h1>
                <p class="subtitle" id="auth-subtitle">音楽とツールをつなぐ統一アカウント</p>
            </div>

            <div class="tab-switcher">
                <div id="tab-login" class="tab-btn active" onclick="setMode('login')">ログイン</div>
                <div id="tab-signup" class="tab-btn" onclick="setMode('signup')">新規登録</div>
            </div>

            <div id="login-history" class="mb-4"></div>

            <div class="input-group">
                <input type="email" id="email" class="input" placeholder="メールアドレス" required>
            </div>
            
            <button class="btn-primary" onclick="proceedToPass()">次へ進む</button>
        </div>

        <!-- Step 2: Password -->
        <div id="step-security" class="view-step">
            <button onclick="goBack()" class="mb-5 flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer border-none bg-transparent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="mr-1"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                戻る
            </button>
            <h1 class="title" id="sec-title">パスワード入力</h1>
            <p id="target-email" class="subtitle text-xs opacity-80"></p>

            <div class="input-group">
                <input type="password" id="password" class="input" placeholder="パスワードを入力（6文字以上）">
            </div>

            <div id="auth-error" class="text-rose-600 text-xs font-bold text-center mb-3 min-h-[1em]"></div>
            
            <button id="submit-btn" class="btn-primary" onclick="performAuth()">認証する</button>
        </div>

        <!-- Step 3: Profile Setup -->
        <div id="step-profile" class="view-step">
            <h1 class="title">プロフィール設定</h1>
            <p class="subtitle">Bezartでの表示名を設定してください</p>
            
            <div class="flex justify-center mb-6">
                <div class="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    <span id="user-initial">?</span>
                </div>
            </div>

            <div class="input-group">
                <input type="text" id="display-name" class="input" placeholder="ニックネーム">
            </div>

            <button class="btn-primary" onclick="completeSetup()">はじめる</button>
        </div>
    </div>

    <div class="footer">POWERED BY BEZART ECOSYSTEM</div>

    <script>
        let mode = 'login';
        let authTicket = '';
        const urlParams = new URLSearchParams(window.location.search);
        let redirectUrl = urlParams.get('redirect') || 'https://bezart.f5.si/';

        window.onload = () => loadHistory();

        function setMode(newMode) {
            mode = newMode;
            document.getElementById('tab-login').classList.toggle('active', mode === 'login');
            document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
            document.getElementById('auth-title').innerText = mode === 'login' ? 'Bezart ID' : 'アカウント作成';
            document.getElementById('auth-subtitle').innerText = mode === 'login' ? '音楽とツールをつなぐ統一アカウント' : 'Bezartエコシステムへの新規登録';
            loadHistory();
        }

        function loadHistory() {
            const history = JSON.parse(localStorage.getItem('bezart_auth_history') || '[]');
            const container = document.getElementById('login-history');
            container.innerHTML = '';
            
            if (mode === 'login' && history.length > 0) {
                history.forEach(u => {
                    const div = document.createElement('div');
                    div.className = 'history-item';
                    div.innerHTML = '<img src="' + u.avatar + '" class="history-avatar"><div style="overflow:hidden;"><div class="text-sm font-bold text-slate-800 truncate">' + u.name + '</div><div class="text-[11px] text-slate-500 truncate">' + u.email + '</div></div>';
                    div.onclick = function() { document.getElementById('email').value = u.email; proceedToPass(); };
                    container.appendChild(div);
                });
            }
        }

        function proceedToPass() {
            const email = document.getElementById('email').value;
            if (!email || !email.includes('@')) {
                alert('有効なメールアドレスを入力してください');
                return;
            }

            document.getElementById('target-email').innerText = email;
            document.getElementById('sec-title').innerText = mode === 'login' ? 'パスワード入力' : 'パスワード設定';
            document.getElementById('submit-btn').innerText = mode === 'login' ? 'ログインする' : 'アカウントを作成';
            document.getElementById('auth-error').innerText = '';
            document.getElementById('step-auth').classList.remove('active');
            document.getElementById('step-security').classList.add('active');
        }

        function goBack() {
            document.getElementById('step-security').classList.remove('active');
            document.getElementById('step-auth').classList.add('active');
        }

        async function performAuth() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('submit-btn');
            const err = document.getElementById('auth-error');

            if (!password || password.length < 6) {
                err.innerText = "パスワードは6文字以上で入力してください";
                return;
            }

            btn.disabled = true;
            btn.innerText = "処理中...";
            err.innerText = "";

            try {
                const res = await fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, isSignup: mode === 'signup', redirect: redirectUrl })
                });
                const data = await res.json();

                if (data.success) {
                    authTicket = data.ticket;
                    saveHistory(data.userData);
                    if (data.needsProfile) {
                        document.getElementById('step-security').classList.remove('active');
                        document.getElementById('step-profile').classList.add('active');
                        document.getElementById('user-initial').innerText = email[0].toUpperCase();
                    } else {
                        redirectFinal();
                    }
                } else {
                    btn.disabled = false;
                    btn.innerText = mode === 'login' ? 'ログインする' : 'アカウントを作成';
                    err.innerText = data.message || "認証に失敗しました";
                }
            } catch (e) {
                err.innerText = "通信エラーが発生しました";
                btn.disabled = false;
                btn.innerText = mode === 'login' ? 'ログインする' : 'アカウントを作成';
            }
        }

        async function completeSetup() {
            const name = document.getElementById('display-name').value || "Bezart User";
            await fetch(window.location.href, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_profile', ticket: authTicket, displayName: name })
            });
            redirectFinal();
        }

        function saveHistory(user) {
            let history = JSON.parse(localStorage.getItem('bezart_auth_history') || '[]');
            history = history.filter(function(u) { return u.email !== user.email; });
            history.unshift(user);
            localStorage.setItem('bezart_auth_history', JSON.stringify(history.slice(0, 5)));
        }

        function redirectFinal() {
            let base = decodeURIComponent(redirectUrl);
            location.href = base + (base.includes('?') ? '&' : '?') + "ticket=" + authTicket;
        }
    </script>
</body>
</html>`;
}
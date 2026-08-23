# **Bezart ID 認証連携マニュアル**

このマニュアルでは、**Bezart ID**（Cloudflare Workers 認証基盤）を任意のWebページやアプリケーションへ簡単に導入・連携するための手順を解説します。

* **認証ワーカーのベースURL**: https://bezart-auth.noppo5319.workers.dev

## **1\. 全体像（認証の仕組み）**

1. ユーザーが外部サイト（あなたのWebアプリなど）の「ログイン」ボタンを押す。  
2. 認証ワーカー（bezart-auth.noppo5319.workers.dev）へ、認証完了後のリダイレクト先（?redirect=...）を指定して遷移する。  
3. ユーザーがログインまたは新規登録を完了すると、ワーカーは一時的な認証チケット（ticket）を発行し、元のWebページへリダイレクトする。  
4. Webページ側でURLパラメータから ticket を受け取り、バックエンド（または直接フロントエンド）からユーザー情報取得APIを叩いてセッションを確立する。

## **2\. 実装手順（フロントエンド実装例）**

以下のサンプルコード（HTML / JavaScript）を、あなたのWebページにそのまま組み込むことでBezart ID連携を実現できます。

### **サンプルコード**

\<\!DOCTYPE html\>  
\<html lang="ja"\>  
\<head\>  
    \<meta charset="UTF-8"\>  
    \<title\>マイアプリ \- Bezart ID 連携テスト\</title\>  
    \<script src="https://cdn.tailwindcss.com"\>\</script\>  
\</head\>  
\<body class="bg-slate-50 flex items-center justify-center h-screen"\>

    \<div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"\>  
        \<h1 class="text-xl font-black text-slate-800 mb-2"\>マイアプリへようこそ\</h1\>  
        \<p id="status-text" class="text-xs text-slate-500 mb-6"\>ログインしていません\</p\>

        \<\!-- 未ログイン時に表示するエリア \--\>  
        \<div id="logged-out-view"\>  
            \<button onclick="loginWithBezart()" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl shadow transition"\>  
                Bezart ID でログイン / 新規登録  
            \</button\>  
        \</div\>

        \<\!-- ログイン済みに表示するエリア \--\>  
        \<div id="logged-in-view" class="hidden"\>  
            \<div class="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border"\>  
                \<img id="user-avatar" src="" alt="Avatar" class="w-12 h-12 rounded-lg object-cover"\>  
                \<div class="text-left"\>  
                    \<div id="user-name" class="font-bold text-sm text-slate-800"\>\</div\>  
                    \<div id="user-email" class="text-xs text-slate-500"\>\</div\>  
                \</div\>  
            \</div\>  
            \<button onclick="logout()" class="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 px-4 rounded-xl transition text-xs"\>  
                ログアウト  
            \</button\>  
        \</div\>  
    \</div\>

    \<script\>  
        const AUTH\_WORKER\_URL \= 'https://bezart-auth.noppo5319.workers.dev';

        window.addEventListener('DOMContentLoaded', async () \=\> {  
            const urlParams \= new URLSearchParams(window.location.search);  
            const ticket \= urlParams.get('ticket');

            if (ticket) {  
                // チケットがある場合、ストレージに保存してURLからキレイに消去する  
                localStorage.setItem('bezart\_ticket', ticket);  
                window.history.replaceState({}, document.title, window.location.pathname);  
                await fetchUserData(ticket);  
            } else {  
                // 保存済みのチケットがあるかチェック  
                const savedTicket \= localStorage.getItem('bezart\_ticket');  
                if (savedTicket) {  
                    await fetchUserData(savedTicket);  
                }  
            }  
        });

        // ログイン画面へリダイレクト  
        function loginWithBezart() {  
            const currentRedirectUrl \= window.location.href.split('?')\[0\];  
            window.location.href \= \`${AUTH\_WORKER\_URL}/?redirect=${encodeURIComponent(currentRedirectUrl)}\`;  
        }

        // ユーザー情報の取得  
        async function fetchUserData(ticket) {  
            try {  
                const res \= await fetch(\`${AUTH\_WORKER\_URL}/auth/v1/user?ticket=${ticket}\`);  
                const data \= await res.json();

                if (res.ok && \!data.error) {  
                    // ログイン成功時の表示切り替え  
                    document.getElementById('logged-out-view').classList.add('hidden');  
                    document.getElementById('logged-in-view').classList.remove('hidden');  
                    document.getElementById('status-text').innerText \= 'ログイン中';  
                      
                    document.getElementById('user-name').innerText \= data.userId;  
                    document.getElementById('user-email').innerText \= data.email;  
                    document.getElementById('user-avatar').src \= data.avatar;  
                } else {  
                    // チケットが無効または期限切れの場合  
                    logout();  
                }  
            } catch (e) {  
                console.error('Auth check error:', e);  
            }  
        }

        // ログアウト処理  
        function logout() {  
            const ticket \= localStorage.getItem('bezart\_ticket');  
            localStorage.removeItem('bezart\_ticket');  
              
            // ワーカー側のログアウトエンドポイントを経由してリダイレクト  
            const currentRedirectUrl \= window.location.href.split('?')\[0\];  
            window.location.href \= \`${AUTH\_WORKER\_URL}/logout?ticket=${ticket || ''}\&redirect=${encodeURIComponent(currentRedirectUrl)}\`;  
        }  
    \</script\>  
\</body\>  
\</html\>

## **3\. 主要なエンドポイント仕様**

### **1\. ログイン画面・認証トップ**

* **URL**: https://bezart-auth.noppo5319.workers.dev/  
* **メソッド**: GET  
* **クエリパラメータ**:  
  * redirect (任意): 認証成功後にチケットを付与して戻ってくるあなたのWebページのURL（URLエンコード推奨）。指定がない場合はデフォルトサイトへリダイレクトされます。

### **2\. ユーザー情報取得API**

* **URL**: https://bezart-auth.noppo5319.workers.dev/auth/v1/user  
* **メソッド**: GET  
* **クエリパラメータ**:  
  * ticket: リダイレクト時にURLパラメータで受け取った認証チケット。  
* **レスポンス例 (JSON)**:  
  {  
    "userId": "表示名 または ユーザー名",  
    "avatar": "https://api.dicebear.com/... または Googleアイコン等",  
    "email": "user@example.com",  
    "raw": { ...Supabaseの生データ... }  
  }

### **3\. ログアウト**

* **URL**: https://bezart-auth.noppo5319.workers.dev/logout  
* **メソッド**: GET  
* **クエリパラメータ**:  
  * ticket: 破棄する認証チケット  
  * redirect: ログアウト完了後に戻る遷移先URL

## **4\. セキュリティと運用のポイント**

* **CORS対応済み**: ワーカー側でクロスドメインのリクエスト（Access-Control-Allow-Origin）を適切にハンドリングしているため、外部のどこからでも安全にAPIを呼び出せます。  
* **チケットの有効期限**: 発行された ticket の有効期限はデフォルトで **3600秒（1時間）** です。ブラウザの localStorage やメモリ等に保持して利用してください。
/**
 * GitHub OAuth Access Token Proxy
 *
 * 代理 GitHub OAuth access_token 端点，解决 CORS 问题
 *
 * 部署到 Cloudflare Workers:
 * 1. 安装 Wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 部署: wrangler deploy cloudflare-worker.js --name github-oauth-proxy
 *
 * 部署后会获得一个 URL，例如:
 * https://github-oauth-proxy.your-subdomain.workers.dev
 *
 * 在项目中使用:
 * - 添加环境变量: VITE_OAUTH_PROXY_URL=https://github-oauth-proxy.your-subdomain.workers.dev
 * - auth.js 会自动使用代理
 */

export default {
  async fetch(request, env, ctx) {
    // CORS 预检请求处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept, User-Agent',
          'Access-Control-Max-Age': '86400'
        }
      })
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        message: 'Only POST requests are supported'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    try {
      // 解析请求体
      const body = await request.json()

      // 验证必需的参数
      if (!body.client_id || !body.code) {
        return new Response(JSON.stringify({
          error: 'invalid_request',
          error_description: 'Missing required parameters: client_id, code'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      console.log('[Proxy] Received OAuth request for client_id:', body.client_id.substring(0, 10) + '...')

      // 转发请求到 GitHub OAuth access_token 端点
      const githubResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'GitHub-OAuth-Proxy-Worker'
        },
        body: JSON.stringify({
          client_id: body.client_id,
          code: body.code,
          code_verifier: body.code_verifier,
          redirect_uri: body.redirect_uri
        })
      })

      const responseData = await githubResponse.text()

      // 记录响应状态
      console.log('[Proxy] GitHub response status:', githubResponse.status)
      console.log('[Proxy] GitHub response length:', responseData.length)

      // 返回 GitHub 的响应
      return new Response(responseData, {
        status: githubResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      })

    } catch (error) {
      console.error('[Proxy] Error:', error)

      return new Response(JSON.stringify({
        error: 'internal_server_error',
        error_description: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}

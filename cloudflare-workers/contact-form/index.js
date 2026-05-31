/**
 * Cloudflare Worker: Contact Form Handler
 * 
 * 功能：
 * 1. 接收联系表单提交
 * 2. 验证输入数据
 * 3. 发送邮件通知
 * 4. 返回 JSON 响应
 * 
 * 邮件服务支持：
 * - Resend API (推荐)
 * - Mailgun API
 * - SendGrid API
 */

// 邮件发送函数 - Resend API
async function sendEmailResend(data, env) {
  const { RESEND_API_KEY, TO_EMAIL, FROM_EMAIL, COMPANY_NAME } = env;
  
  if (!RESEND_API_KEY || !TO_EMAIL) {
    throw new Error('Missing email configuration');
  }

  const emailContent = `
New Contact Form Submission

========================================
Company: ${COMPANY_NAME || '山东钰弘源'}
========================================

Contact Information:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone || 'Not provided'}

Message:
${data.message}

========================================
Submission Time: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
Source: Contact Form (${data.lang || 'unknown'} version)
========================================
  `.trim();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL || 'contact@your-domain.com',
      to: [TO_EMAIL],
      subject: `[Website Contact] New inquiry from ${data.name} - ${data.email}`,
      text: emailContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
}

// 验证输入数据
function validateInput(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  // 可选：限制消息长度
  if (data.message && data.message.length > 5000) {
    errors.push('Message is too long (max 5000 characters)');
  }

  return errors;
}

// 速率限制（简单的内存存储，生产环境建议使用 KV）
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分钟窗口
  const maxRequests = 5; // 最多 5 次请求

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const record = rateLimitStore.get(ip);
  
  // 清理过期记录
  if (now - record.firstRequest > windowMs) {
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // 检查请求次数
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter: Math.ceil((record.firstRequest + windowMs - now) / 1000)
    };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 主处理函数
async function handleRequest(request, env, ctx) {
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // 只接受 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed',
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 获取客户端 IP（用于速率限制）
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';

  // 检查速率限制
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: rateLimit.retryAfter,
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': rateLimit.retryAfter.toString(),
      },
    });
  }

  try {
    // 解析请求体
    const data = await request.json();

    // 验证输入
    const errors = validateInput(data);
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: errors.join('; '),
        errors: errors,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 清理输入数据
    const cleanData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone ? data.phone.trim() : '',
      message: data.message.trim(),
      lang: data.lang || 'unknown',
      submittedAt: new Date().toISOString(),
    };

    // 检查是否配置了邮件服务
    if (env.RESEND_API_KEY || env.MAILGUN_API_KEY || env.SENDGRID_API_KEY) {
      // 发送邮件
      if (env.RESEND_API_KEY) {
        await sendEmailResend(cleanData, env);
      } else {
        throw new Error('No email service configured');
      }
    } else {
      // 开发模式：只记录到日志
      console.log('Contact form submission (dev mode):', JSON.stringify(cleanData, null, 2));
    }

    // 返回成功响应
    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'An error occurred. Please try again later.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Cloudflare Workers 入口点
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};

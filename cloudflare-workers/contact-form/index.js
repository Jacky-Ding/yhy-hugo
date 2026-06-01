/**
 * Contact Form Worker - Simple Version
 * Stores submissions in memory and provides JSON API for viewing
 */

// In-memory storage (persists per Worker instance)
let submissions = [];
const MAX_STORAGE = 100;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Admin password (should be set via secret in production)
const ADMIN_PASSWORD = 'yhytradehub2024';

// Success responses by language
const responses = {
  zh: '感谢您的留言！我们会尽快与您联系。',
  en: 'Thank you for your message! We will get back to you soon.',
  ru: 'Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.',
};

export default {
  async fetch(request, env, ctx) {
    console.log('=== Request:', request.method, request.url);

    // Handle OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Admin endpoint - GET submissions
    if (request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        count: submissions.length,
        data: submissions.reverse() // Newest first
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only accept POST for submissions
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      console.log('Received:', { name: data.name, email: data.email });

      // Basic validation
      if (!data.name || data.name.trim().length < 2) {
        return new Response(JSON.stringify({ success: false, message: '请填写姓名' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return new Response(JSON.stringify({ success: false, message: '请填写有效邮箱' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (!data.message || data.message.trim().length < 10) {
        return new Response(JSON.stringify({ success: false, message: '请填写留言内容（至少10个字符）' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create submission
      const submission = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : '',
        message: data.message.trim(),
        lang: data.lang || 'unknown',
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        timestamp: Date.now()
      };

      // Store submission
      submissions.unshift(submission);
      if (submissions.length > MAX_STORAGE) {
        submissions = submissions.slice(0, MAX_STORAGE);
      }

      console.log('Stored submission:', submission.id, submissions.length, 'total');

      return new Response(JSON.stringify({
        success: true,
        message: responses[data.lang] || responses.en,
        id: submission.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: '处理失败，请稍后再试。'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

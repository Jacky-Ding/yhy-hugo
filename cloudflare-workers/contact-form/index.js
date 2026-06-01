/**
 * Simple Contact Form Worker
 * Works reliably without any dependencies except Cloudflare Workers
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    console.log('=== Request received:', request.method, request.url);

    // Handle OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      console.log('Form data received:', { name: data.name, email: data.email, lang: data.lang });

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
        return new Response(JSON.stringify({ success: false, message: '请填写留言内容' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const submission = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : '',
        message: data.message.trim(),
        lang: data.lang || 'unknown',
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        time: new Date().toISOString()
      };

      // Log the submission
      console.log('Submission:', JSON.stringify(submission));

      // Try to send email if configured
      let emailSent = false;
      if (env.RESEND_API_KEY && env.TO_EMAIL) {
        try {
          const emailContent = `
New Contact Form Submission
============================
Name: ${submission.name}
Email: ${submission.email}
Phone: ${submission.phone}
Language: ${submission.lang}
IP: ${submission.ip}
Time: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

Message:
${submission.message}
============================
          `.trim();

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: env.FROM_EMAIL || 'contact@yhytradehub.com',
              to: [env.TO_EMAIL],
              subject: `[Website] New inquiry from ${submission.name}`,
              text: emailContent,
            }),
          });

          emailSent = resendResponse.ok;
          console.log('Email sent:', emailSent, resendResponse.status);
        } catch (e) {
          console.log('Email failed:', e);
        }
      }

      // Success responses by language
      const responses = {
        zh: '感谢您的留言！我们会尽快与您联系。',
        en: 'Thank you for your message! We will get back to you soon.',
        ru: 'Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.',
      };

      return new Response(JSON.stringify({
        success: true,
        message: responses[data.lang] || responses.en,
        emailSent: emailSent
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

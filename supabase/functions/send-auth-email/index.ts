import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { getEmailFrom, getEmailAddress } from '../_shared/env.ts'
import { renderConfirmSignupEmail } from './_templates/confirm-signup.tsx'
import { renderMagicLinkEmail } from './_templates/magic-link.tsx'
import { renderResetPasswordEmail } from './_templates/reset-password.tsx'
import { renderEmailChangeEmail } from './_templates/email-change.tsx'
import { renderInviteUserEmail } from './_templates/invite-user.tsx'
import { renderReauthenticationEmail } from './_templates/reauthentication.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_AUTH_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  try {
    let secret = (Deno.env.get('SEND_AUTH_EMAIL_HOOK_SECRET') as string) || ''
    if (!secret) {
      console.error('Missing SEND_AUTH_EMAIL_HOOK_SECRET')
      throw new Error('Missing hook secret')
    }
    
    // Normalize Svix secret format to base64 for standardwebhooks
    // Svix format: "v1,whsec_base64string" → extract just the base64 part
    if (secret.includes(',')) {
      secret = secret.split(',').pop() || secret
    }
    if (secret.startsWith('whsec_')) {
      secret = secret.substring(6)
    }
    
    const wh = new Webhook(secret)

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
        user_metadata?: {
          language?: string
        }
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    console.log(`Processing ${email_action_type} email for ${user.email}`)

    // Detect language (default to 'en', support 'zh-TW' for Traditional Chinese)
    const language = user.user_metadata?.language === 'zh-TW' ? 'zh-TW' : 'en'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Common props for all templates
    const commonProps = {
      language,
      supabaseUrl,
      token,
      tokenHash: token_hash,
      redirectTo: redirect_to,
    }

    let html: string
    let subject: string

    // Route to appropriate template based on email_action_type
    switch (email_action_type) {
      case 'signup':
        html = renderConfirmSignupEmail(commonProps)
        subject = language === 'zh-TW' ? '確認您的帳戶 - AutoPenguin' : 'Confirm Your Account - AutoPenguin'
        break
      
      case 'magiclink':
        html = renderMagicLinkEmail(commonProps)
        subject = language === 'zh-TW' ? '登入連結 - AutoPenguin' : 'Login Link - AutoPenguin'
        break
      
      case 'recovery':
        html = renderResetPasswordEmail(commonProps)
        subject = language === 'zh-TW' ? '重設密碼 - AutoPenguin' : 'Reset Password - AutoPenguin'
        break
      
      case 'email_change':
        html = renderEmailChangeEmail(commonProps)
        subject = language === 'zh-TW' ? '確認新電郵地址 - AutoPenguin' : 'Confirm New Email - AutoPenguin'
        break
      
      case 'invite':
        html = renderInviteUserEmail(commonProps)
        subject = language === 'zh-TW' ? '加入您的團隊 - AutoPenguin' : 'Join Your Team - AutoPenguin'
        break
      
      case 'reauthentication':
        html = renderReauthenticationEmail(commonProps)
        subject = language === 'zh-TW' ? '重新驗證 - AutoPenguin' : 'Reauthentication Required - AutoPenguin'
        break
      
      default:
        console.error(`Unknown email_action_type: ${email_action_type}`)
        throw new Error(`Unsupported email type: ${email_action_type}`)
    }

    const { error } = await resend.emails.send({
      from: getEmailFrom('notifications'),
      replyTo: getEmailAddress('info'),
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log(`Successfully sent ${email_action_type} email to ${user.email}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error sending auth email:', error)
    // Don't block signup/auth flow - return success but log the error
    // This allows users to sign up even if email sending fails
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error',
        note: 'User signup proceeded despite email error'
      }),
      {
        status: 200, // Changed from 500 to not block auth flow
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

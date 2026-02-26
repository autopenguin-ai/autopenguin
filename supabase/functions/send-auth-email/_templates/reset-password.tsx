interface ResetPasswordEmailProps {
  language: string
  supabaseUrl: string
  tokenHash: string
  redirectTo: string
}

export const renderResetPasswordEmail = ({
  language,
  supabaseUrl,
  tokenHash,
  redirectTo,
}: ResetPasswordEmailProps): string => {
  const isZh = language === 'zh-TW'
  const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${redirectTo}`
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px 20px; max-width: 600px;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${supabaseUrl}/storage/v1/object/public/property-photos/autopenguin-logo.png" width="150" alt="AutoPenguin" style="display: block;">
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #1f2937; font-size: 28px; font-weight: 700; line-height: 1.3; padding-bottom: 24px;">
              ${isZh ? '重設密碼' : 'Reset Your Password'}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh 
                ? '我們收到了您的密碼重設請求。點擊下方按鈕以設定新密碼：'
                : 'We received a request to reset your password. Click the button below to set a new password:'
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #0EA5E9; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                ${isZh ? '重設密碼' : 'Reset Password'}
              </a>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6; padding: 16px; background-color: #fef3c7; border-radius: 6px; border: 1px solid #fcd34d; margin-bottom: 24px;">
              ${isZh 
                ? '此連結將在 1 小時後失效。如果您沒有請求重設密碼，請忽略此郵件。您的帳戶仍然安全。'
                : 'This link will expire in 1 hour. If you didn\'t request a password reset, you can safely ignore this email. Your account remains secure.'
              }
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #9ca3af; font-size: 14px; line-height: 1.5; padding-top: 8px;">
              © 2025 AutoPenguin
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

interface ReauthenticationEmailProps {
  language: string
  supabaseUrl: string
  tokenHash: string
  redirectTo: string
}

export const renderReauthenticationEmail = ({
  language,
  supabaseUrl,
  tokenHash,
  redirectTo,
}: ReauthenticationEmailProps): string => {
  const isZh = language === 'zh-TW'
  const reauthUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=reauthentication&redirect_to=${redirectTo}`
  
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
              ${isZh ? '需要重新驗證' : 'Reauthentication Required'}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh 
                ? '為了保護您的帳戶安全，我們需要驗證您的身份。點擊下方按鈕繼續：'
                : 'To protect your account security, we need to verify your identity. Click the button below to continue:'
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${reauthUrl}" style="display: inline-block; background-color: #0EA5E9; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                ${isZh ? '驗證身份' : 'Verify Identity'}
              </a>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #991b1b; font-size: 14px; line-height: 1.6; padding: 16px; background-color: #fee2e2; border-radius: 6px; border: 1px solid #fca5a5; margin-bottom: 24px;">
              ${isZh 
                ? '這是一項安全檢查，確保是您本人正在執行敏感操作。如果您沒有嘗試執行任何操作，請立即更改您的密碼。'
                : 'This is a security check to ensure it\'s you performing sensitive operations. If you didn\'t attempt any actions, please change your password immediately.'
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

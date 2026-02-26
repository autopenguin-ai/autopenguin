interface EmailChangeEmailProps {
  language: string
  supabaseUrl: string
  tokenHash: string
  redirectTo: string
}

export const renderEmailChangeEmail = ({
  language,
  supabaseUrl,
  tokenHash,
  redirectTo,
}: EmailChangeEmailProps): string => {
  const isZh = language === 'zh-TW'
  const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=email_change&redirect_to=${redirectTo}`
  
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
              ${isZh ? '確認電郵變更' : 'Confirm Email Change'}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh 
                ? '您的 AutoPenguin 帳戶申請了變更電郵地址。點擊下方按鈕確認此新電郵地址：'
                : 'A request was made to change the email address for your AutoPenguin account. Click the button below to confirm this new email address:'
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${confirmUrl}" style="display: inline-block; background-color: #0EA5E9; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                ${isZh ? '確認新電郵地址' : 'Confirm New Email'}
              </a>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #991b1b; font-size: 14px; line-height: 1.6; padding: 16px; background-color: #fee2e2; border-radius: 6px; border: 1px solid #fca5a5; margin-bottom: 24px;">
              ${isZh 
                ? '如果您沒有申請變更電郵地址，請立即聯絡我們的支援團隊。'
                : "If you didn't request an email change, please contact our support team immediately."
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

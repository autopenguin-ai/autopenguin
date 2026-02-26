interface MagicLinkEmailProps {
  language: string
  supabaseUrl: string
  token: string
  tokenHash: string
  redirectTo: string
}

export const renderMagicLinkEmail = ({
  language,
  supabaseUrl,
  token,
  tokenHash,
  redirectTo,
}: MagicLinkEmailProps): string => {
  const isZh = language === 'zh-TW'
  const loginUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${redirectTo}`
  
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
              ${isZh ? '登入 AutoPenguin' : 'Log in to AutoPenguin'}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh 
                ? '點擊下方按鈕即可登入您的 AutoPenguin 帳戶：'
                : 'Click the button below to log in to your AutoPenguin account:'
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${loginUrl}" style="display: inline-block; background-color: #0EA5E9; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                ${isZh ? '立即登入' : 'Log In Now'}
              </a>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh ? '或複製並貼上此臨時登入碼：' : 'Or, copy and paste this temporary login code:'}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; padding: 16px; background-color: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb; color: #1f2937; font-size: 18px; font-family: monospace; letter-spacing: 2px; font-weight: 600;">
                ${token}
              </div>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #9ca3af; font-size: 14px; line-height: 1.5; padding-top: 24px;">
              ${isZh 
                ? '如果您沒有嘗試登入，請忽略此郵件。'
                : "If you didn't try to log in, you can safely ignore this email."
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

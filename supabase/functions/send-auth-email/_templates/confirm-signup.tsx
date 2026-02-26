interface ConfirmSignupEmailProps {
  language: string
  supabaseUrl: string
  tokenHash: string
  redirectTo: string
}

export const renderConfirmSignupEmail = ({
  language,
  supabaseUrl,
  tokenHash,
  redirectTo,
}: ConfirmSignupEmailProps): string => {
  const isZh = language === 'zh-TW'
  const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=signup&redirect_to=${redirectTo}`
  
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
              ${isZh ? '歡迎來到 AutoPenguin！' : 'Welcome to AutoPenguin!'}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh 
                ? '感謝您註冊！請點擊下方按鈕確認您的電郵地址並開始使用 AutoPenguin。'
                : 'Thank you for signing up! Click the button below to confirm your email address and start using AutoPenguin.'
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${confirmUrl}" style="display: inline-block; background-color: #0EA5E9; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                ${isZh ? '確認電郵地址' : 'Confirm Email Address'}
              </a>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #9ca3af; font-size: 14px; line-height: 1.5; padding-top: 24px;">
              ${isZh 
                ? '如果您沒有註冊 AutoPenguin，請忽略此郵件。'
                : "If you didn't sign up for AutoPenguin, you can safely ignore this email."
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

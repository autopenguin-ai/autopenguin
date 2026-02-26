interface InviteUserEmailProps {
  language: string
  supabaseUrl: string
  tokenHash: string
  redirectTo: string
}

export const renderInviteUserEmail = ({
  language,
  supabaseUrl,
  tokenHash,
  redirectTo,
}: InviteUserEmailProps): string => {
  const isZh = language === 'zh-TW'
  const inviteUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=invite&redirect_to=${redirectTo}`
  
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
              ${isZh ? '團隊邀請' : 'Team Invitation'}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
              ${isZh 
                ? '您被邀請加入 AutoPenguin 上的一個團隊！點擊下方按鈕接受邀請並建立您的帳戶：'
                : 'You\'ve been invited to join a team on AutoPenguin! Click the button below to accept the invitation and create your account:'
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${inviteUrl}" style="display: inline-block; background-color: #0EA5E9; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                ${isZh ? '接受邀請' : 'Accept Invitation'}
              </a>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; color: #4b5563; font-size: 14px; line-height: 1.6; padding: 16px; background-color: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe; margin-bottom: 24px;">
              ${isZh 
                ? '此邀請將在 24 小時後失效。加入團隊後，您將可以存取共享專案、工作流程和協作工具。'
                : 'This invitation will expire in 24 hours. Once you join, you\'ll have access to shared projects, workflows, and collaboration tools.'
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

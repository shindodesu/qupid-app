"""
メールテンプレート
HTMLとプレーンテキストの両方のフォーマットを提供
"""

def get_verification_email_html(verification_code: str, app_name: str = "Qupid") -> str:
    """認証コードのHTMLメールテンプレート"""
    return f"""
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name} メール認証</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- ヘッダー -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: #667eea; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                💌 {app_name}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- メインコンテンツ -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                メール認証コード
                            </h2>
                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                                {app_name}へようこそ！以下の認証コードを入力してメールアドレスの確認を完了してください。
                            </p>
                            
                            <!-- 認証コード -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 30px; background-color: #f8f9fa; border-radius: 8px;">
                                        <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            {verification_code}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- 注意事項 -->
                            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                                    ⚠️ <strong>重要:</strong><br>
                                    • この認証コードは<strong>10分間</strong>有効です<br>
                                    • 他の人と共有しないでください<br>
                                    • 心当たりがない場合は、このメールを無視してください
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                このメールに覚えがない場合は、誰かが誤ってあなたのメールアドレスを入力した可能性があります。その場合は、このメールを無視しても問題ありません。
                            </p>
                        </td>
                    </tr>
                    
                    <!-- フッター -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                © 2025 {app_name}. All rights reserved.<br>
                                このメールは自動送信されています。返信しないでください。
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

def get_verification_email_text(verification_code: str, app_name: str = "Qupid") -> str:
    """認証コードのプレーンテキストメールテンプレート"""
    return f"""
{app_name}へようこそ！

以下の認証コードを入力してメールアドレスの確認を完了してください。

認証コード: {verification_code}

【重要】
• この認証コードは10分間有効です
• 他の人と共有しないでください
• 心当たりがない場合は、このメールを無視してください

このメールに覚えがない場合は、誰かが誤ってあなたのメールアドレスを入力した可能性があります。
その場合は、このメールを無視しても問題ありません。

---
© 2025 {app_name}. All rights reserved.
このメールは自動送信されています。返信しないでください。
"""

def get_welcome_email_html(display_name: str, app_name: str = "Qupid") -> str:
    """ウェルカムメールのHTMLテンプレート"""
    return f"""
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name}へようこそ</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- ヘッダー -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: #667eea; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                                🎉 ようこそ {app_name} へ！
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- メインコンテンツ -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                {display_name}さん、こんにちは！
                            </h2>
                            <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                                アカウントの作成が完了しました。{app_name}へようこそ！
                            </p>
                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                                素敵な出会いと楽しいマッチング体験をお楽しみください。
                            </p>
                            
                            <!-- 次のステップ -->
                            <div style="margin: 30px 0; padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
                                <h3 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">
                                    🚀 次のステップ
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                                    <li>プロフィールを完成させる</li>
                                    <li>興味のあるタグを追加する</li>
                                    <li>素敵な人を探してマッチングする</li>
                                </ul>
                            </div>
                            
                            <!-- セキュリティヒント -->
                            <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                                <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.5;">
                                    🔒 <strong>セキュリティヒント:</strong><br>
                                    アカウントを安全に保つため、パスワードは誰とも共有せず、定期的に変更することをお勧めします。
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- フッター -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                                質問がある場合は、お気軽にお問い合わせください。
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                © 2025 {app_name}. All rights reserved.<br>
                                このメールは自動送信されています。返信しないでください。
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

def get_welcome_email_text(display_name: str, app_name: str = "Qupid") -> str:
    """ウェルカムメールのプレーンテキストテンプレート"""
    return f"""
{display_name}さん、{app_name}へようこそ！

アカウントの作成が完了しました。
素敵な出会いと楽しいマッチング体験をお楽しみください。

【次のステップ】
• プロフィールを完成させる
• 興味のあるタグを追加する
• 素敵な人を探してマッチングする

【セキュリティヒント】
アカウントを安全に保つため、パスワードは誰とも共有せず、定期的に変更することをお勧めします。

質問がある場合は、お気軽にお問い合わせください。

---
© 2025 {app_name}. All rights reserved.
このメールは自動送信されています。返信しないでください。
"""

def get_password_reset_email_html(verification_code: str, app_name: str = "Qupid") -> str:
    """パスワードリセットのHTMLメールテンプレート"""
    return f"""
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>パスワードリセット - {app_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- ヘッダー -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: #667eea; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                🔐 {app_name}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- メインコンテンツ -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                パスワードリセット
                            </h2>
                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                                パスワードのリセットをリクエストされました。以下の認証コードを使用して、新しいパスワードを設定してください。
                            </p>
                            
                            <!-- 認証コード -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 30px; background-color: #f8f9fa; border-radius: 8px;">
                                        <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            {verification_code}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- 警告 -->
                            <div style="margin-top: 30px; padding: 20px; background-color: #ffe6e6; border-left: 4px solid #dc3545; border-radius: 4px;">
                                <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.5;">
                                    ⚠️ <strong>セキュリティ警告:</strong><br>
                                    • この認証コードは<strong>10分間</strong>有効です<br>
                                    • パスワードリセットをリクエストしていない場合は、すぐにアカウントを確認してください<br>
                                    • 認証コードは誰とも共有しないでください
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                このリクエストに覚えがない場合は、アカウントが不正にアクセスされている可能性があります。すぐにパスワードを変更してください。
                            </p>
                        </td>
                    </tr>
                    
                    <!-- フッター -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                © 2025 {app_name}. All rights reserved.<br>
                                このメールは自動送信されています。返信しないでください。
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

def get_password_reset_email_text(verification_code: str, app_name: str = "Qupid") -> str:
    """パスワードリセットのプレーンテキストメールテンプレート"""
    return f"""
{app_name} パスワードリセット

パスワードのリセットをリクエストされました。
以下の認証コードを使用して、新しいパスワードを設定してください。

認証コード: {verification_code}

【セキュリティ警告】
• この認証コードは10分間有効です
• パスワードリセットをリクエストしていない場合は、すぐにアカウントを確認してください
• 認証コードは誰とも共有しないでください

このリクエストに覚えがない場合は、アカウントが不正にアクセスされている可能性があります。
すぐにパスワードを変更してください。

---
© 2025 {app_name}. All rights reserved.
このメールは自動送信されています。返信しないでください。
"""


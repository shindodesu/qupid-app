import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

class EmailService:
    def __init__(self):
        # 開発環境では実際のメール送信は無効化
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@qupid.com')
        self.enable_email = getattr(settings, 'ENABLE_EMAIL', False)

    def generate_verification_code(self) -> str:
        """6桁の認証コードを生成"""
        return ''.join(random.choices(string.digits, k=6))

    async def send_verification_email(self, email: str, verification_code: str) -> bool:
        """認証コードをメールで送信"""
        if not self.enable_email:
            # 開発環境ではコンソールに出力
            print(f"=== メール認証コード ===")
            print(f"宛先: {email}")
            print(f"認証コード: {verification_code}")
            print(f"======================")
            return True

        try:
            # メール本文を作成
            subject = "Qupid メール認証コード"
            body = f"""
Qupidへようこそ！

以下の認証コードを入力してください：

認証コード: {verification_code}

この認証コードは10分間有効です。
もしこのメールに心当たりがない場合は、このメールを無視してください。

Qupidチーム
            """

            # メール送信
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"メール送信エラー: {e}")
            return False

    async def send_welcome_email(self, email: str, display_name: str) -> bool:
        """ウェルカムメールを送信"""
        if not self.enable_email:
            print(f"=== ウェルカムメール ===")
            print(f"宛先: {email}")
            print(f"名前: {display_name}")
            print(f"======================")
            return True

        try:
            subject = "Qupidへようこそ！"
            body = f"""
{display_name}さん、Qupidへようこそ！

アカウントの作成が完了しました。
安全で楽しいマッチング体験をお楽しみください。

Qupidチーム
            """

            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"ウェルカムメール送信エラー: {e}")
            return False

# シングルトンインスタンス
email_service = EmailService()

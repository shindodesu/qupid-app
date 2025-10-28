import smtplib
import random
import string
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
from app.templates.email_templates import (
    get_verification_email_html,
    get_verification_email_text,
    get_welcome_email_html,
    get_welcome_email_text,
    get_password_reset_email_html,
    get_password_reset_email_text
)

# ロガーの設定
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # SMTP設定
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@qupid.com')
        self.enable_email = getattr(settings, 'ENABLE_EMAIL', False)
        
        # リトライ設定
        self.max_retries = getattr(settings, 'EMAIL_MAX_RETRIES', 3)
        self.retry_delay = getattr(settings, 'EMAIL_RETRY_DELAY', 2)  # 秒
        
        # アプリケーション名
        self.app_name = getattr(settings, 'APP_NAME', 'Qupid')

    def generate_verification_code(self) -> str:
        """6桁の認証コードを生成"""
        return ''.join(random.choices(string.digits, k=6))

    async def _send_email_with_retry(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        """
        リトライロジック付きでメールを送信
        
        Args:
            to_email: 送信先メールアドレス
            subject: 件名
            html_body: HTML形式の本文
            text_body: プレーンテキスト形式の本文
            
        Returns:
            送信成功したかどうか
        """
        for attempt in range(self.max_retries):
            try:
                # メッセージを作成
                msg = MIMEMultipart('alternative')
                msg['From'] = self.from_email
                msg['To'] = to_email
                msg['Subject'] = subject
                
                # プレーンテキストとHTMLの両方を追加
                part1 = MIMEText(text_body, 'plain', 'utf-8')
                part2 = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(part1)
                msg.attach(part2)
                
                # SMTP経由で送信
                with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                    server.starttls()
                    if self.smtp_username and self.smtp_password:
                        server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                
                logger.info(f"メール送信成功: {to_email} (件名: {subject})")
                return True
                
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"SMTP認証エラー: {e}")
                # 認証エラーはリトライしても無駄なので即座に失敗
                return False
                
            except smtplib.SMTPException as e:
                logger.warning(f"メール送信失敗 (試行 {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))  # 指数バックオフ
                    
            except Exception as e:
                logger.error(f"予期しないエラー (試行 {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
        
        logger.error(f"メール送信失敗（最大リトライ回数超過）: {to_email}")
        return False

    async def send_verification_email(self, email: str, verification_code: str) -> bool:
        """
        認証コードをメールで送信
        
        Args:
            email: 送信先メールアドレス
            verification_code: 6桁の認証コード
            
        Returns:
            送信成功したかどうか
        """
        if not self.enable_email:
            # 開発環境ではコンソールに出力
            logger.info("=== メール認証コード ===")
            logger.info(f"宛先: {email}")
            logger.info(f"認証コード: {verification_code}")
            logger.info("======================")
            return True

        try:
            subject = f"{self.app_name} メール認証コード"
            html_body = get_verification_email_html(verification_code, self.app_name)
            text_body = get_verification_email_text(verification_code, self.app_name)
            
            return await self._send_email_with_retry(email, subject, html_body, text_body)
            
        except Exception as e:
            logger.error(f"認証メール送信エラー: {e}")
            return False

    async def send_welcome_email(self, email: str, display_name: str) -> bool:
        """
        ウェルカムメールを送信
        
        Args:
            email: 送信先メールアドレス
            display_name: ユーザーの表示名
            
        Returns:
            送信成功したかどうか
        """
        if not self.enable_email:
            logger.info("=== ウェルカムメール ===")
            logger.info(f"宛先: {email}")
            logger.info(f"名前: {display_name}")
            logger.info("======================")
            return True

        try:
            subject = f"{self.app_name}へようこそ！"
            html_body = get_welcome_email_html(display_name, self.app_name)
            text_body = get_welcome_email_text(display_name, self.app_name)
            
            return await self._send_email_with_retry(email, subject, html_body, text_body)
            
        except Exception as e:
            logger.error(f"ウェルカムメール送信エラー: {e}")
            return False
    
    async def send_password_reset_email(self, email: str, verification_code: str) -> bool:
        """
        パスワードリセットの認証コードをメールで送信
        
        Args:
            email: 送信先メールアドレス
            verification_code: 6桁の認証コード
            
        Returns:
            送信成功したかどうか
        """
        if not self.enable_email:
            logger.info("=== パスワードリセット認証コード ===")
            logger.info(f"宛先: {email}")
            logger.info(f"認証コード: {verification_code}")
            logger.info("=================================")
            return True

        try:
            subject = f"{self.app_name} パスワードリセット"
            html_body = get_password_reset_email_html(verification_code, self.app_name)
            text_body = get_password_reset_email_text(verification_code, self.app_name)
            
            return await self._send_email_with_retry(email, subject, html_body, text_body)
            
        except Exception as e:
            logger.error(f"パスワードリセットメール送信エラー: {e}")
            return False

# シングルトンインスタンス
email_service = EmailService()

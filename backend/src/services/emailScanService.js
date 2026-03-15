"""
Real Email Scanner - Scans Gmail and Outlook for PII
Supports OAuth2 authentication for secure access
"""
import imaplib
import email
from email.header import decode_header
import re
from typing import List, Dict
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import base64
import os
import pickle

class EmailScanner:
    """Real email scanner with OAuth2 support"""
    
    GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
    
    def __init__(self):
        self.gmail_service = None
        self.imap_conn = None
    
    async def scan_gmail_oauth(self, credentials_json: str, max_emails: int = 100) -> List[Dict]:
        """
        Scan Gmail using OAuth2
        
        Args:
            credentials_json: Path to OAuth2 credentials JSON from Google Cloud Console
            max_emails: Maximum number of emails to scan
            
        Returns:
            List of detected PII findings
        """
        findings = []
        
        try:
            creds = None
            token_path = '/tmp/gmail_token.pickle'
            
            # Load existing token
            if os.path.exists(token_path):
                with open(token_path, 'rb') as token:
                    creds = pickle.load(token)
            
            # Refresh or get new token
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        credentials_json, self.GMAIL_SCOPES)
                    creds = flow.run_local_server(port=0)
                
                with open(token_path, 'wb') as token:
                    pickle.dump(creds, token)
            
            # Build Gmail service
            service = build('gmail', 'v1', credentials=creds)
            
            # Get messages
            results = service.users().messages().list(
                userId='me', 
                maxResults=max_emails,
                q='has:attachment OR in:inbox'  # Focus on attachments and inbox
            ).execute()
            
            messages = results.get('messages', [])
            
            for msg_ref in messages:
                msg = service.users().messages().get(
                    userId='me', 
                    id=msg_ref['id'],
                    format='full'
                ).execute()
                
                # Extract email content
                email_data = self._extract_gmail_content(msg)
                
                # Scan for PII
                pii_found = await self._detect_pii_in_text(email_data['body'])
                
                if pii_found:
                    findings.append({
                        'source': 'Gmail',
                        'email_id': msg['id'],
                        'subject': email_data['subject'],
                        'from': email_data['from'],
                        'date': email_data['date'],
                        'pii_detected': pii_found,
                        'has_attachments': email_data['has_attachments']
                    })
                
                # Scan attachments
                if email_data['has_attachments']:
                    attachment_findings = await self._scan_gmail_attachments(
                        service, msg['id'], msg
                    )
                    findings.extend(attachment_findings)
            
            return findings
            
        except Exception as e:
            raise Exception(f"Gmail scan failed: {str(e)}")
    
    async def scan_outlook_imap(self, email_address: str, password: str, 
                                 imap_server: str = 'outlook.office365.com',
                                 max_emails: int = 100) -> List[Dict]:
        """
        Scan Outlook/Exchange using IMAP
        
        Args:
            email_address: Outlook email address
            password: App password (not regular password)
            imap_server: IMAP server address
            max_emails: Maximum emails to scan
        """
        findings = []
        
        try:
            # Connect to IMAP
            mail = imaplib.IMAP4_SSL(imap_server, 993)
            mail.login(email_address, password)
            mail.select('INBOX')
            
            # Search for emails
            status, messages = mail.search(None, 'ALL')
            email_ids = messages[0].split()
            
            # Scan recent emails
            for email_id in email_ids[-max_emails:]:
                status, msg_data = mail.fetch(email_id, '(RFC822)')
                
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        # Extract content
                        subject = self._decode_header(msg['Subject'])
                        from_addr = msg['From']
                        date = msg['Date']
                        
                        # Get email body
                        body = self._get_email_body(msg)
                        
                        # Scan for PII
                        pii_found = await self._detect_pii_in_text(body)
                        
                        if pii_found:
                            findings.append({
                                'source': 'Outlook',
                                'email_id': email_id.decode(),
                                'subject': subject,
                                'from': from_addr,
                                'date': date,
                                'pii_detected': pii_found
                            })
            
            mail.close()
            mail.logout()
            
            return findings
            
        except Exception as e:
            raise Exception(f"Outlook scan failed: {str(e)}")
    
    def _extract_gmail_content(self, msg: Dict) -> Dict:
        """Extract content from Gmail message"""
        headers = msg['payload']['headers']
        
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
        from_addr = next((h['value'] for h in headers if h['name'] == 'From'), '')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
        
        # Get body
        body = ''
        if 'parts' in msg['payload']:
            for part in msg['payload']['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode()
        elif 'body' in msg['payload'] and 'data' in msg['payload']['body']:
            body = base64.urlsafe_b64decode(msg['payload']['body']['data']).decode()
        
        has_attachments = any(
            part.get('filename') for part in msg['payload'].get('parts', [])
        )
        
        return {
            'subject': subject,
            'from': from_addr,
            'date': date,
            'body': body,
            'has_attachments': has_attachments
        }
    
    async def _scan_gmail_attachments(self, service, msg_id: str, msg: Dict) -> List[Dict]:
        """Scan Gmail attachments for PII"""
        findings = []
        
        if 'parts' not in msg['payload']:
            return findings
        
        for part in msg['payload']['parts']:
            if part.get('filename'):
                attachment_id = part['body'].get('attachmentId')
                if attachment_id:
                    attachment = service.users().messages().attachments().get(
                        userId='me',
                        messageId=msg_id,
                        id=attachment_id
                    ).execute()
                    
                    # Decode attachment
                    file_data = base64.urlsafe_b64decode(attachment['data'])
                    
                    # Scan based on file type
                    filename = part['filename']
                    if filename.endswith(('.txt', '.csv', '.json')):
                        text = file_data.decode('utf-8', errors='ignore')
                        pii_found = await self._detect_pii_in_text(text)
                        
                        if pii_found:
                            findings.append({
                                'source': 'Gmail Attachment',
                                'filename': filename,
                                'email_id': msg_id,
                                'pii_detected': pii_found
                            })
        
        return findings
    
    def _decode_header(self, header_value):
        """Decode email header"""
        if header_value is None:
            return ''
        decoded = decode_header(header_value)
        return ''.join([
            text.decode(encoding or 'utf-8') if isinstance(text, bytes) else text
            for text, encoding in decoded
        ])
    
    def _get_email_body(self, msg):
        """Extract email body from message"""
        body = ''
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == 'text/plain':
                    try:
                        body += part.get_payload(decode=True).decode()
                    except:
                        pass
        else:
            try:
                body = msg.get_payload(decode=True).decode()
            except:
                pass
        
        return body
    
    async def _detect_pii_in_text(self, text: str) -> List[Dict]:
        """Detect PII in text using regex patterns"""
        findings = []
        
        # Indian PII patterns
        patterns = {
            'AADHAAR': r'\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b',
            'PAN': r'\b[A-Z]{5}[0-9]{4}[A-Z]\b',
            'MOBILE': r'\b[6-9]\d{9}\b',
            'EMAIL': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'CREDIT_CARD': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            'PASSPORT': r'\b[A-Z]\d{7}\b',
            'VOTER_ID': r'\b[A-Z]{3}\d{7}\b',
            'UPI': r'\b[\w.-]+@[a-z]+\b',
            'IFSC': r'\b[A-Z]{4}0[A-Z0-9]{6}\b',
            'GSTIN': r'\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b'
        }
        
        for pii_type, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Mask the value
                if len(match) > 8:
                    masked = match[:4] + '*' * (len(match) - 8) + match[-4:]
                else:
                    masked = '*' * len(match)
                
                findings.append({
                    'pii_type': pii_type,
                    'masked_value': masked,
                    'confidence': 0.95
                })
        
        return findings

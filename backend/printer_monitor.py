"""
HiTi P525 Printer Monitor Script
Monitors printer supplies and sends email alerts when levels are low.

Requirements:
    pip install pysnmp pywin32

For Gmail, you need to:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Use that app password in EMAIL_PASSWORD below
"""

import time
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

# Try importing Windows-specific and SNMP libraries
try:
    import win32print
    WIN32_AVAILABLE = True
except ImportError:
    WIN32_AVAILABLE = False
    print("Warning: pywin32 not installed. Install with: pip install pywin32")

try:
    from pysnmp.hlapi import (
        getCmd, SnmpEngine, CommunityData, UdpTransportTarget,
        ContextData, ObjectType, ObjectIdentity
    )
    SNMP_AVAILABLE = True
except ImportError:
    SNMP_AVAILABLE = False
    print("Warning: pysnmp not installed. Install with: pip install pysnmp")


# =============================================================================
# CONFIGURATION - EDIT THESE VALUES
# =============================================================================

# Email Settings
EMAIL_SENDER = "your-gmail@gmail.com"  # Your Gmail address
EMAIL_PASSWORD = "your-app-password"    # Gmail App Password (NOT your regular password)
EMAIL_RECIPIENT = "khalid@enigma-ai.co"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Printer Settings
PRINTER_NAME = "HiTi P525"  # Name as it appears in Windows
PRINTER_IP = "192.168.1.100"  # If using network connection, set the IP
SNMP_COMMUNITY = "public"  # Default SNMP community string

# Alert Thresholds
PAPER_THRESHOLD = 50  # Alert when paper/prints remaining <= this value
INK_THRESHOLD = 50    # Alert when ink remaining <= this value (percentage)

# Monitoring Settings
CHECK_INTERVAL_SECONDS = 300  # Check every 5 minutes
ALERT_COOLDOWN_HOURS = 24     # Don't send same alert more than once per day

# =============================================================================
# LOGGING SETUP
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('printer_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# PRINTER STATUS CLASSES
# =============================================================================

class PrinterStatus:
    def __init__(self):
        self.paper_remaining: Optional[int] = None
        self.ink_remaining: Optional[int] = None
        self.prints_remaining: Optional[int] = None
        self.status: str = "Unknown"
        self.error: Optional[str] = None


# =============================================================================
# PRINTER MONITORING FUNCTIONS
# =============================================================================

def get_printer_status_win32(printer_name: str) -> PrinterStatus:
    """Get printer status using Windows API (for USB-connected printers)."""
    status = PrinterStatus()

    if not WIN32_AVAILABLE:
        status.error = "pywin32 not installed"
        return status

    try:
        # Get list of printers
        printers = win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        )

        printer_found = False
        for printer in printers:
            if printer_name.lower() in printer[2].lower():
                printer_found = True
                printer_name = printer[2]
                break

        if not printer_found:
            status.error = f"Printer '{printer_name}' not found"
            return status

        # Open printer and get info
        handle = win32print.OpenPrinter(printer_name)
        try:
            info = win32print.GetPrinter(handle, 2)

            # Check printer status
            printer_status = info.get('Status', 0)
            if printer_status == 0:
                status.status = "Ready"
            elif printer_status & 0x00000008:  # PRINTER_STATUS_PAPER_OUT
                status.status = "Paper Out"
                status.paper_remaining = 0
            elif printer_status & 0x00010000:  # PRINTER_STATUS_TONER_LOW
                status.status = "Ink/Toner Low"
            else:
                status.status = f"Status Code: {printer_status}"

            # Note: Windows API doesn't provide exact supply levels
            # The HiTi P525 may report this via its own driver/software
            logger.info(f"Printer '{printer_name}' status: {status.status}")

        finally:
            win32print.ClosePrinter(handle)

    except Exception as e:
        status.error = str(e)
        logger.error(f"Error getting printer status via Win32: {e}")

    return status


def get_printer_status_snmp(printer_ip: str, community: str = "public") -> PrinterStatus:
    """Get printer status using SNMP (for network-connected printers)."""
    status = PrinterStatus()

    if not SNMP_AVAILABLE:
        status.error = "pysnmp not installed"
        return status

    # Standard Printer MIB OIDs
    oids = {
        'printer_status': '1.3.6.1.2.1.25.3.5.1.1.1',
        'marker_supplies_level': '1.3.6.1.2.1.43.11.1.1.9.1.1',  # Current level
        'marker_supplies_max': '1.3.6.1.2.1.43.11.1.1.8.1.1',    # Max capacity
        'input_tray_current': '1.3.6.1.2.1.43.8.2.1.10.1.1',     # Paper current
        'input_tray_max': '1.3.6.1.2.1.43.8.2.1.9.1.1',          # Paper max
    }

    try:
        def snmp_get(oid: str) -> Optional[str]:
            iterator = getCmd(
                SnmpEngine(),
                CommunityData(community),
                UdpTransportTarget((printer_ip, 161), timeout=5, retries=1),
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )

            error_indication, error_status, error_index, var_binds = next(iterator)

            if error_indication or error_status:
                return None

            for var_bind in var_binds:
                return str(var_bind[1])
            return None

        # Get ink/ribbon level
        ink_current = snmp_get(oids['marker_supplies_level'])
        ink_max = snmp_get(oids['marker_supplies_max'])
        if ink_current and ink_max:
            try:
                status.ink_remaining = int((int(ink_current) / int(ink_max)) * 100)
            except (ValueError, ZeroDivisionError):
                pass

        # Get paper level
        paper_current = snmp_get(oids['input_tray_current'])
        paper_max = snmp_get(oids['input_tray_max'])
        if paper_current:
            try:
                status.paper_remaining = int(paper_current)
            except ValueError:
                pass

        # Get printer status
        printer_state = snmp_get(oids['printer_status'])
        if printer_state:
            states = {
                '1': 'Other', '2': 'Unknown', '3': 'Idle',
                '4': 'Printing', '5': 'Warmup'
            }
            status.status = states.get(printer_state, f"State {printer_state}")

        logger.info(f"SNMP status - Paper: {status.paper_remaining}, Ink: {status.ink_remaining}%")

    except Exception as e:
        status.error = str(e)
        logger.error(f"Error getting printer status via SNMP: {e}")

    return status


# =============================================================================
# EMAIL FUNCTIONS
# =============================================================================

def send_email_alert(subject: str, body: str) -> bool:
    """Send an email alert via Gmail SMTP."""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = EMAIL_RECIPIENT
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email alert sent: {subject}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


# =============================================================================
# MAIN MONITORING LOOP
# =============================================================================

class PrinterMonitor:
    def __init__(self):
        self.last_paper_alert: Optional[datetime] = None
        self.last_ink_alert: Optional[datetime] = None

    def should_send_alert(self, last_alert: Optional[datetime]) -> bool:
        """Check if enough time has passed since the last alert."""
        if last_alert is None:
            return True
        hours_since = (datetime.now() - last_alert).total_seconds() / 3600
        return hours_since >= ALERT_COOLDOWN_HOURS

    def check_and_alert(self, status: PrinterStatus):
        """Check printer status and send alerts if needed."""
        alerts = []

        # Check paper/prints remaining
        remaining = status.paper_remaining or status.prints_remaining
        if remaining is not None and remaining <= PAPER_THRESHOLD:
            if self.should_send_alert(self.last_paper_alert):
                alerts.append(f"Paper/Prints remaining: {remaining}")
                self.last_paper_alert = datetime.now()

        # Check ink remaining
        if status.ink_remaining is not None and status.ink_remaining <= INK_THRESHOLD:
            if self.should_send_alert(self.last_ink_alert):
                alerts.append(f"Ink/Ribbon remaining: {status.ink_remaining}%")
                self.last_ink_alert = datetime.now()

        # Send combined alert if any issues found
        if alerts:
            subject = f"[ALERT] HiTi P525 Printer - Low Supplies"
            body = f"""
Printer Supply Alert
=====================
Printer: {PRINTER_NAME}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Status: {status.status}

Alerts:
{chr(10).join('- ' + a for a in alerts)}

Current Levels:
- Paper/Prints Remaining: {status.paper_remaining or 'N/A'}
- Ink/Ribbon Remaining: {status.ink_remaining or 'N/A'}%

This is an automated alert from your printer monitoring script.
"""
            send_email_alert(subject, body)

    def run(self):
        """Main monitoring loop."""
        logger.info("=" * 50)
        logger.info("HiTi P525 Printer Monitor Started")
        logger.info(f"Checking every {CHECK_INTERVAL_SECONDS} seconds")
        logger.info(f"Paper threshold: {PAPER_THRESHOLD}")
        logger.info(f"Ink threshold: {INK_THRESHOLD}%")
        logger.info("=" * 50)

        while True:
            try:
                # Try SNMP first (for network printers)
                if SNMP_AVAILABLE and PRINTER_IP:
                    status = get_printer_status_snmp(PRINTER_IP, SNMP_COMMUNITY)
                    if status.error:
                        logger.warning(f"SNMP failed: {status.error}")

                # Fall back to Windows API
                if WIN32_AVAILABLE and (not SNMP_AVAILABLE or status.error):
                    status = get_printer_status_win32(PRINTER_NAME)

                if status.error:
                    logger.error(f"Could not get printer status: {status.error}")
                else:
                    self.check_and_alert(status)

            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")

            time.sleep(CHECK_INTERVAL_SECONDS)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    print("""
    ============================================
    HiTi P525 Printer Monitor
    ============================================

    Before running, please configure:
    1. EMAIL_SENDER - Your Gmail address
    2. EMAIL_PASSWORD - Your Gmail App Password
    3. PRINTER_NAME - Printer name in Windows
    4. PRINTER_IP - If network connected

    Required packages:
        pip install pysnmp pywin32

    Press Ctrl+C to stop monitoring.
    ============================================
    """)

    monitor = PrinterMonitor()

    try:
        monitor.run()
    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")

import ctypes
import os
import sys
from typing import Optional
import threading
from dotenv import load_dotenv

load_dotenv()

_DEFAULT_COM_PORT = os.getenv("EFTPOS_COM_PORT", "COM3")
_DEFAULT_TIMEOUT_SEC = int(os.getenv("EFTPOS_TIMEOUT_SEC", "240"))
_DEFAULT_CHARSET = os.getenv("EFTPOS_CHARSET", "MULTI")

_DEFAULT_DLL_PATH = os.getenv(
    "EFTPOS_DLL_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "EFTPOSLib.dll"),
)

_client = None
_client_lock = threading.Lock()


def _to_bytes(value: str) -> bytes:
    return value.encode("ascii", errors="ignore")


class EFTPOSClient:
    def __init__(self, dll_path: str = _DEFAULT_DLL_PATH) -> None:
        if sys.platform != "win32":
            raise RuntimeError("EFTPOS DLL is only supported on Windows")

        if not os.path.exists(dll_path):
            raise FileNotFoundError(f"EFTPOS DLL not found at: {dll_path}")

        dll_dir = os.path.dirname(dll_path)
        if hasattr(os, "add_dll_directory"):
            os.add_dll_directory(dll_dir)

        self._dll = ctypes.WinDLL(dll_path)

        self._dll.API_CheckConnection.argtypes = [
            ctypes.c_char_p,
            ctypes.c_int,
            ctypes.c_char_p,
        ]
        self._dll.API_CheckConnection.restype = ctypes.c_wchar_p

        self._dll.API_PerformPurchase.argtypes = [
            ctypes.c_char_p,
            ctypes.c_int,
            ctypes.c_int,
            ctypes.c_char_p,
        ]
        self._dll.API_PerformPurchase.restype = ctypes.c_wchar_p

    def check_connection(
        self,
        com_port: Optional[str] = None,
        timeout_sec: Optional[int] = None,
        charset: Optional[str] = None,
    ) -> str:
        com = _to_bytes(com_port or _DEFAULT_COM_PORT)
        timeout = int(timeout_sec or _DEFAULT_TIMEOUT_SEC)
        char = _to_bytes(charset or _DEFAULT_CHARSET)
        return self._dll.API_CheckConnection(com, timeout, char)

    def perform_purchase(
        self,
        amount_halalah: int,
        com_port: Optional[str] = None,
        timeout_sec: Optional[int] = None,
        charset: Optional[str] = None,
    ) -> str:
        if amount_halalah <= 0:
            raise ValueError("Amount must be positive")
        
        com = _to_bytes(com_port or _DEFAULT_COM_PORT)
        timeout = int(timeout_sec or _DEFAULT_TIMEOUT_SEC)
        char = _to_bytes(charset or _DEFAULT_CHARSET)
        amount = int(amount_halalah)
        
        result = self._dll.API_PerformPurchase(com, timeout, amount, char)
        if result is None:
            raise RuntimeError("EFTPOS DLL returned no response")
        return result

def get_client() -> EFTPOSClient:
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:  # Double-check
                _client = EFTPOSClient()
    return _client

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // This effect should only run once to initialize the scanner
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          qrbox: { width: 250, height: 250 },
          fps: 10,
        },
        /* verbose= */ false
      );

      const handleSuccess = (decodedText, decodedResult) => {
        // Stop scanning after a successful scan
        if (scannerRef.current) {
          scannerRef.current.clear().then(() => {
            onScanSuccess(decodedText);
          }).catch(err => {
            console.error("Failed to clear scanner after success", err);
            // Still call success callback even if clearing fails
            onScanSuccess(decodedText);
          });
        }
      };

      const handleError = (errorMessage) => {
        if (onScanFailure) {
          onScanFailure(errorMessage);
        }
      };

      scanner.render(handleSuccess, handleError);
      scannerRef.current = scanner;
    }

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scannerRef.current && scannerRef.current.getState() === 2) { // 2 = SCANNING state
        scannerRef.current.clear().catch(error => {
          // This can happen if the scanner is already cleared, which is fine.
          console.warn("Error during scanner cleanup:", error);
        });
      }
    };
    // The dependency array is empty to ensure this effect runs only once on mount.
  }, [onScanSuccess, onScanFailure]);

  return <div id="qr-reader" style={{ border: 'none' }} />;
};

export default QrScanner;
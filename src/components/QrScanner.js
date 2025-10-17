import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Ensure the scanner is only initialized once.
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 10,
        },
        false // verbose
      );

      const handleSuccess = async (decodedText, decodedResult) => {
        // --- THIS IS THE CRITICAL FIX ---
        // Do not immediately call the parent. First, stop the scanner.
        if (scannerRef.current) {
          try {
            // The stop() method is asynchronous and returns a promise.
            await scanner.stop();
            // Once stopped successfully, THEN call the parent's success handler.
            onScanSuccess(decodedText);
          } catch (err) {
            console.error("Failed to stop the scanner.", err);
            // Still try to call the parent handler even if stopping fails.
            onScanSuccess(decodedText);
          }
        }
      };

      const handleError = (errorMessage) => {
        // This function is required, but we can call a parent handler if provided.
        if (onScanFailure) {
          onScanFailure(errorMessage);
        }
      };

      // Start rendering the scanner
      scanner.render(handleSuccess, handleError);
      scannerRef.current = scanner;
    }

    // This cleanup function handles the case where the user closes the modal manually.
    return () => {
      if (scannerRef.current && scannerRef.current.getState() === 2) { // 2 is SCANNING state
        scannerRef.current.clear().catch(error => {
          console.error("Cleanup failed. This can happen on success.", error);
        });
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id="qr-reader" style={{ border: 'none' }} />;
};

export default QrScanner;
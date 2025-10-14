import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess }) => {
  // Use a ref to keep a stable reference to the scanner instance
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader', // The ID of the div element below
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10,
      },
      false // verbose
    );

    const handleSuccess = (decodedText, decodedResult) => {
      // When a scan is successful, call the parent's handler
      onScanSuccess(decodedText);
    };

    const handleError = (errorMessage) => {
      // This function is required, but we can leave it empty
      // console.error("QR Scan Error:", errorMessage);
    };

    // Start scanning
    scannerRef.current.render(handleSuccess, handleError);

    // --- This is the cleanup function that runs when the component unmounts ---
    return () => {
      if (scannerRef.current) {
        // Stop scanning and clean up the camera feed
        scannerRef.current.clear().catch(error => {
          // This catch block is the key fix.
          // It silently handles the "NotFoundError" if React has already removed the element.
          console.error("Failed to clear html5QrcodeScanner. This is expected on success.", error);
        });
      }
    };
  }, [onScanSuccess]);

  return <div id="qr-reader" style={{ border: 'none' }} />;
};

export default QrScanner;
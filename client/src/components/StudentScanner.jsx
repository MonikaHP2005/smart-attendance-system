import React, { useState, useRef } from 'react';
import { Scanner } from "@yudiel/react-qr-scanner";
import toast from "react-hot-toast";

const StudentScanner = ({ onBack, onScanSuccess, studentId }) => {
  const [cameraMode, setCameraMode] = useState("environment");
  const instantLock = useRef(false);

  const handleScan = async (result) => {
    if (!result || instantLock.current) return;

    try {
      instantLock.current = true;
      
      let qrText = "";
      if (typeof result === "string") qrText = result; 
      else if (Array.isArray(result) && result[0]?.rawValue) qrText = result[0].rawValue; 
      else if (result?.text) qrText = result.text; 
      else throw new Error("Could not extract text from scan result");

      toast.loading("Verifying Location...", { id: "scan-toast" });

      const qrData = JSON.parse(qrText);
      const { eventId, qrToken } = qrData; 

      if (!eventId || !qrToken) throw new Error("Invalid QR Format");

      if (!navigator.geolocation) {
        toast.dismiss("scan-toast");
        onScanSuccess({ title: "Location Error", message: "Geolocation not supported.", type: "error" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const studentLat = position.coords.latitude;
          const studentLon = position.coords.longitude;

          try {
            const response = await fetch("http://localhost:5000/api/events/attend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventId, qrToken, studentLat, studentLon, studentId }),
            });

            const data = await response.json();
            toast.dismiss("scan-toast"); 

            if (response.ok) {
              const isCheckIn = data.action === "CHECK_IN";
              onScanSuccess({
                title: isCheckIn ? "Checked In Successfully" : "Checked Out Successfully",
                message: data.message,
                type: "success"
              });
            } else {
              onScanSuccess({ title: "Verification Failed", message: data.message, type: "error" });
            }
          } catch (err) {
            toast.dismiss("scan-toast");
            onScanSuccess({ title: "Connection Error", message: "Could not reach the server.", type: "error" });
          }
        },
        (error) => {
          toast.dismiss("scan-toast");
          onScanSuccess({ title: "GPS Required", message: "Please allow location access.", type: "error" });
        },
        { enableHighAccuracy: true } 
      );
    } catch (error) {
      toast.dismiss("scan-toast");
      onScanSuccess({ title: "Invalid QR Code", message: "The scanned code is not recognized.", type: "error" });
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl animate-fade-in border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 mb-2 transition-colors"
          >
            <span>←</span> Back
          </button>
          <h3 className="font-bold text-white text-xl tracking-tight">Camera Active</h3>
          <p className="text-slate-400 text-xs mt-0.5">Align the QR code within the frame</p>
        </div>
      </div>
      
      <div className="rounded-xl overflow-hidden border border-slate-700 relative bg-black">
          <Scanner onScan={handleScan} constraints={{ facingMode: cameraMode }} />
      </div>
      
      <div className="mt-6 text-center">
        <button 
          onClick={() => setCameraMode(prev => prev === "environment" ? "user" : "environment")} 
          className="text-slate-300 hover:text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 mx-auto bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg"
        >
          🔄 Flip Camera
        </button>
      </div>
    </div>
  );
};

export default StudentScanner;
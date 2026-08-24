import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react';

// Free public STUN server (Google's) — enough for most home/office networks.
// No TURN server, so calls may fail on strict NATs/mobile carrier networks;
// a paid TURN service would be needed for guaranteed reliability everywhere.
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function CallButton({ orderId }) {
  const [callState, setCallState] = useState('idle'); // idle | calling | incoming | active
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const incomingOfferRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('servora_token');
    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.emit('call:join', orderId);

    socket.on('call:offer', ({ offer }) => {
      incomingOfferRef.current = offer;
      setCallState('incoming');
    });

    socket.on('call:answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('call:ice-candidate', ({ candidate }) => {
      if (pcRef.current && candidate) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });

    socket.on('call:end', () => {
      cleanup();
      setCallState('idle');
    });

    return () => {
      socket.disconnect();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('call:ice-candidate', { orderId, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0];
    };
    pcRef.current = pc;
    return pc;
  }

  function cleanup() {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    incomingOfferRef.current = null;
  }

  async function startCall() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('call:offer', { orderId, offer });
      setCallState('calling');
    } catch {
      setError('Microphone access is needed to make a call.');
    }
  }

  async function acceptCall() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('call:answer', { orderId, answer });
      setCallState('active');
    } catch {
      setError('Microphone access is needed to accept the call.');
    }
  }

  function endCall() {
    socketRef.current?.emit('call:end', { orderId });
    cleanup();
    setCallState('idle');
  }

  return (
    <div className="mb-4">
      <audio ref={remoteAudioRef} autoPlay />

      {callState === 'idle' && (
        <button
          onClick={startCall}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <Phone className="w-4 h-4" /> Voice call
        </button>
      )}

      {callState === 'calling' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 animate-pulse" /> Calling…
          <button onClick={endCall} className="text-red-600 hover:underline text-xs">
            Cancel
          </button>
        </div>
      )}

      {callState === 'incoming' && (
        <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          <PhoneIncoming className="w-4 h-4" /> Incoming call
          <button onClick={acceptCall} className="text-brand-700 font-medium hover:underline text-xs">
            Accept
          </button>
          <button onClick={endCall} className="text-red-600 hover:underline text-xs">
            Decline
          </button>
        </div>
      )}

      {callState === 'active' && (
        <div className="flex items-center gap-2 text-sm text-brand-700">
          <Phone className="w-4 h-4" /> On call
          <button onClick={endCall} className="text-red-600 hover:underline text-xs flex items-center gap-1">
            <PhoneOff className="w-3.5 h-3.5" /> End
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

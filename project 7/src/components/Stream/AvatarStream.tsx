import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SimliClient } from 'simli-client';
import { v4 as uuidv4 } from 'uuid';
import StreamControls from './StreamControls';

interface AvatarStreamProps {
  isLive: boolean;
  streamStatus: 'connecting' | 'live' | 'ended' | 'idle';
}

const simliClient = new SimliClient();

const AvatarStream: React.FC<AvatarStreamProps> = ({ isLive, streamStatus }) => {
  const [error, setError] = useState('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [roomID, setRoomID] = useState('');
  const [userUUID, setUserUUID] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize room and user IDs
  useEffect(() => {
    const storedRoomID = localStorage.getItem('roomID');
    const storedUserUUID = localStorage.getItem('userUUID');
    if (storedRoomID && storedUserUUID) {
      setRoomID(storedRoomID);
      setUserUUID(storedUserUUID);
    } else {
      const newRoomID = uuidv4();
      const newUserUUID = uuidv4();
      setRoomID(newRoomID);
      setUserUUID(newUserUUID);
      localStorage.setItem('roomID', newRoomID);
      localStorage.setItem('userUUID', newUserUUID);
    }
  }, []);

  const initializeSimliClient = useCallback(() => {
    if (videoRef.current && audioRef.current) {
      simliClient.Initialize({
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY || '',
        faceID: process.env.VITE_SIMLI_FACE_ID || '370b1e0f-86b9-4040-aaba-dab636f11f53',
        handleSilence: true,
        maxSessionLength: Number(process.env.VITE_SIMLI_MAX_SESSION_LENGTH) || 3600,
        maxIdleTime: Number(process.env.VITE_SIMLI_MAX_IDLE_TIME) || 600,
        videoRef: videoRef,
        audioRef: audioRef,
      });
      console.log('Simli Client initialized');
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // Initialize audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;

      // Connect microphone to analyser
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Start audio level monitoring
      startAudioLevelMonitoring();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Error accessing microphone. Please check your permissions.');
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const initializeWebSocket = useCallback((connectionId: string) => {
    socketRef.current = new WebSocket(`ws://localhost:8080/ws?connectionId=${connectionId}`);

    socketRef.current.onopen = () => {
      console.log('Connected to server');
    };

    socketRef.current.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((arrayBuffer) => {
          const uint8Array = new Uint8Array(arrayBuffer);
          simliClient.sendAudioData(uint8Array);
        });
      } else {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'interrupt') {
            console.log('Interrupting current response');
            simliClient.ClearBuffer();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error. Please check if the server is running.');
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      handleStop();
    };
  }, []);

  const startConversation = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/start-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "You are a jazz instructor at the Modern Jazz Institute, helping students learn and improve their jazz skills. You're knowledgeable about jazz theory, history, and performance techniques.",
          voiceId: "cgSgspJ2msm6clMCkdW9", // Default ElevenLabs voice
          roomId: roomID,
          userId: userUUID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      initializeWebSocket(data.connectionId);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation. Please try again.');
    }
  }, [initializeWebSocket, roomID, userUUID]);

  const handleStart = useCallback(async () => {
    setError('');
    await startConversation();
    simliClient.start();
    startRecording();
    setIsAvatarVisible(true);
  }, [startConversation]);

  const handleStop = useCallback(() => {
    setError('');
    setIsAvatarVisible(false);
    setAudioLevel(0);
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    stopAudioLevelMonitoring();
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    simliClient.close();
    socketRef.current?.close();
    setAudioStream(null);
  }, [audioStream]);

  useEffect(() => {
    if (simliClient) {
      const handleConnected = () => {
        console.log('SimliClient connected');
        setIsAvatarVisible(true);
        const audioData = new Uint8Array(6000).fill(0);
        simliClient.sendAudioData(audioData);
      };

      const handleDisconnected = () => {
        console.log('SimliClient disconnected');
        handleStop();
      };

      const handleFailed = () => {
        console.log('SimliClient failed');
        setError('Failed to connect to Simli. Please try again.');
        handleStop();
      };

      simliClient.on('connected', handleConnected);
      simliClient.on('disconnected', handleDisconnected);
      simliClient.on('failed', handleFailed);

      return () => {
        simliClient.off('connected', handleConnected);
        simliClient.off('disconnected', handleDisconnected);
        simliClient.off('failed', handleFailed);
      };
    }
  }, [handleStop]);

  useEffect(() => {
    initializeSimliClient();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      simliClient.close();
      handleStop();
    };
  }, [initializeSimliClient, handleStop]);

  useEffect(() => {
    if (audioStream && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const mediaRecorder = new MediaRecorder(audioStream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socketRef.current?.send(event.data);
        }
      };

      mediaRecorder.start(100);

      return () => {
        mediaRecorder.stop();
      };
    }
  }, [audioStream]);

  return (
    <div className="h-full rounded-lg overflow-hidden bg-gray-900 relative">
      {isAvatarVisible ? (
        <div className="relative w-full h-full">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <audio ref={audioRef} autoPlay />
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${(audioLevel / 255) * 100}%` }}
            />
          </div>
          <StreamControls
            isLive={isLive}
            onVolumeChange={(vol) => {
              if (audioRef.current) {
                audioRef.current.volume = vol / 100;
              }
            }}
            onToggleMic={() => {
              if (audioStream) {
                const tracks = audioStream.getAudioTracks();
                tracks.forEach(track => {
                  track.enabled = !track.enabled;
                });
              }
            }}
            onOpenSettings={() => {
              // TODO: Implement settings
              console.log('Open settings');
            }}
            onShare={() => {
              navigator.clipboard.writeText(`Room ID: ${roomID}`);
              console.log('Room ID copied to clipboard');
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              {streamStatus === 'connecting' ? 'Connecting...' : 
               streamStatus === 'ended' ? 'Stream Ended' : 
               'Start a stream to begin'}
            </p>
            {streamStatus === 'connecting' && (
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
            {streamStatus === 'idle' && (
              <button
                onClick={handleStart}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Stream
              </button>
            )}
            {streamStatus === 'live' && (
              <button
                onClick={handleStop}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                End Stream
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default AvatarStream;
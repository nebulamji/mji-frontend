import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SimliClient } from 'simli-client';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const initializeSimliClient = useCallback(() => {
    if (videoRef.current && audioRef.current) {
      simliClient.Initialize({
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY || '',
        faceID: 'b7da5ed1-2abc-47c8-b7a6-0b018e031a26', // Default Chrystal avatar
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 600,
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
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Error accessing microphone. Please check your permissions.');
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
          voiceId: "cgSgspJ2msm6clMCkdW9" // Default ElevenLabs voice
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
  }, [initializeWebSocket]);

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
    setAudioStream(null);
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    simliClient.close();
    socketRef.current?.close();
  }, [audioStream]);

  useEffect(() => {
    if (simliClient) {
      simliClient.on('connected', () => {
        console.log('SimliClient connected');
        setIsAvatarVisible(true);
        const audioData = new Uint8Array(6000).fill(0);
        simliClient.sendAudioData(audioData);
      });
    }
  }, []);

  useEffect(() => {
    initializeSimliClient();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      simliClient.close();
    };
  }, [initializeSimliClient]);

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
              // TODO: Implement share functionality
              console.log('Share stream');
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
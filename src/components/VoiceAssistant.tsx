import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, AlertCircle } from 'lucide-react';

interface VoiceAssistantProps {
    onCommand: (command: string) => void;
    isListening?: boolean;
}

// Add TypeScript support for the Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('Say "Avoid Highway" or "Eco Mode"');
    const [supported, setSupported] = useState(true);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setSupported(false);
            setFeedback('Voice recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setListening(true);
            setFeedback('Listening...');
        };

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const result = event.results[current][0].transcript;
            setTranscript(result);

            if (event.results[current].isFinal) {
                setFeedback(`Processing: "${result}"`);
                // Add a slight delay so user can read what was recognized before it executes
                setTimeout(() => {
                    onCommand(result.toLowerCase());
                    setTranscript('');
                    setFeedback('Say "Avoid Highway" or "Critical Mode"');
                }, 800);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setListening(false);

            if (event.error === 'not-allowed') {
                setFeedback('Microphone access denied. Please allow permissions.');
            } else {
                setFeedback(`Error: ${event.error}. Try again.`);
            }
        };

        recognition.onend = () => {
            setListening(false);
            if (transcript === '') {
                setFeedback('Say "Avoid Highway" or "Critical Mode"');
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onCommand]);

    const toggleListening = () => {
        if (!supported) return;

        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            setFeedback('Say "Avoid Highway" or "Critical Mode"');
        } else {
            setTranscript('');
            try {
                recognitionRef.current?.start();
            } catch (e) {
                // Handle case where it might already be started
                console.error(e);
            }
        }
    };

    if (!supported) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-4 mt-6 border border-gray-200 opacity-75">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-bold">Voice Assistant Unavailable</h3>
                </div>
                <p className="text-xs text-gray-400">Your browser does not support the Web Speech API (try Chrome or Edge).</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 mt-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    AI Voice Command
                </h3>
                <span className={`text-xs font-mono px-2 py-1 rounded ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    {listening ? '● LIVE' : 'IDLE'}
                </span>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
                <button
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${listening
                        ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200'
                        : 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-100'
                        }`}
                >
                    {listening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                </button>

                <div className="text-center h-12 flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-700">{feedback}</p>
                    {transcript && listening && (
                        <p className="text-xs text-blue-600 mt-1 italic">"{transcript}..."</p>
                    )}
                </div>
            </div>
        </div>
    );
}

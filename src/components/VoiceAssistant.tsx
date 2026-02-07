import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageSquare } from 'lucide-react';

interface VoiceAssistantProps {
    onCommand: (command: string) => void;
    isListening?: boolean;
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('Say "Avoid Highway" or "Critical Mode"');

    // Mock recognition for demo purposes since browser SpeechRecognition is tricky in some envs
    // In a real app, use window.SpeechRecognition
    const startListening = () => {
        if (listening) return;
        setListening(true);
        setFeedback('Listening...');

        // Simulate voice command for demo after 2 seconds
        setTimeout(() => {
            const commands = [
                "reroute due to storm",
                "prioritize speed",
                "avoid accident area",
                "switch to eco mode"
            ];
            const randomCommand = commands[Math.floor(Math.random() * commands.length)];
            setTranscript(randomCommand);
            setFeedback(`Recognized: "${randomCommand}"`);

            setTimeout(() => {
                onCommand(randomCommand);
                setListening(false);
                setTranscript('');
                setFeedback('Say "Avoid Highway" or "Critical Mode"');
            }, 1000);
        }, 1500);
    };

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
                    onClick={listening ? () => setListening(false) : startListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${listening
                        ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200'
                        : 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-100'
                        }`}
                >
                    {listening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                </button>

                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 h-6">{feedback}</p>
                    {transcript && (
                        <p className="text-xs text-blue-600 mt-1 italic">"{transcript}"</p>
                    )}
                </div>
            </div>
        </div>
    );
}

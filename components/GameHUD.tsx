
import React, { useState, useEffect, useRef } from 'react';
import { GameState, ProductMode, ChatMessage, PipelineLog } from '../types';
import { IconBrain, IconMic, IconActivity } from './Icons';
import { MOCK_GUIDED_QUERIES, AI_NAME } from '../constants';

interface GameHUDProps {
  mode: ProductMode;
  gameState: GameState;
  onGameStateChange: (state: GameState) => void;
  messages: ChatMessage[];
  pipelineLogs: PipelineLog[];
  onSendMessage: (text: string) => void;
  aiState: {
    isListening: boolean;
    isSpeaking: boolean;
    response: string | null;
    timer: number;
    isThinking: boolean;
  };
  onTriggerVoice: (start: boolean) => void;
  onToggleDuplex: () => void;
  isDuplexActive: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({
  mode,
  gameState,
  messages,
  pipelineLogs,
  onSendMessage,
  aiState,
  onTriggerVoice,
  onToggleDuplex,
  isDuplexActive
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pipelineLogs]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const renderPipelineConsole = () => {
    const isVisible = [ProductMode.SINGLE_TURN_VOICE, ProductMode.MULTI_TURN_VOICE, ProductMode.FULL_DUPLEX].includes(mode);
    if (!isVisible) return null;
    
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[550px] bg-black/95 border border-gray-800 rounded-lg font-mono p-5 overflow-hidden flex flex-col shadow-2xl z-20 pointer-events-none border-t-4 border-t-green-600">
        <div className="text-[10px] text-green-500 mb-4 border-b border-gray-800 pb-2 flex justify-between font-bold">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>HEX_CORE_AI_PIPELINE v2.0</span>
          </div>
          <span className="opacity-50">THREAD_ID: {Math.floor(Math.random()*10000)}</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 text-[12px]">
          {pipelineLogs.map((log) => (
            <div key={log.id} className="flex gap-3 leading-relaxed border-l border-gray-800 pl-3">
              <span className="text-gray-600 shrink-0">[{log.timestamp.split(':').slice(-2).join(':')}]</span>
              <div className="flex flex-col">
                <span className={`font-bold tracking-tighter ${
                  log.role === 'SYSTEM' ? 'text-cyan-400' : 
                  log.role === 'ASR' ? 'text-blue-400' :
                  log.role === 'LLM' ? 'text-green-400' :
                  log.role === 'TTS' ? 'text-yellow-400' : 
                  log.role === 'USER_ACTION' ? 'text-red-400' : 'text-purple-400'
                }`}>{log.role}:</span>
                <span className="text-green-500 opacity-90">{log.content}</span>
              </div>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    );
  };

  const renderAIResponseBubble = () => {
    if (!aiState.isSpeaking || mode !== ProductMode.GUIDED_QUERY) return null;

    return (
      <div className="w-80 bg-slate-900/95 border-l-4 border-l-gold-500 border border-gray-800 text-gold-100 p-5 rounded shadow-2xl backdrop-blur-md animate-in slide-in-from-right-full duration-500">
        <div className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 text-gold-500 mb-3">
          <IconBrain className="w-4 h-4" /> {AI_NAME} 分析
        </div>
        <p className="text-sm leading-relaxed font-game">{aiState.response || '计算中...'}</p>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 font-game">
      {renderPipelineConsole()}

      <div className="absolute top-0 w-full h-12 flex justify-between px-6 pt-2 z-10 bg-gradient-to-b from-black/90 to-transparent">
        <div className="text-gold-400 font-bold text-xs tracking-wider">12 <span className="text-gray-600 px-1">vs</span> 15 | 14:30 | 5.4k GOLD</div>
        <div className="flex gap-4">
           {mode === ProductMode.MULTI_TURN_VOICE && aiState.isListening && (
             <div className="bg-red-900/40 border border-red-500 px-3 py-1 rounded-full text-red-500 text-[10px] font-bold animate-pulse">
               实时聆听窗口: {aiState.timer}S
             </div>
           )}
           <div className="text-white/40 text-[10px] font-mono border border-white/10 px-2 py-1 rounded">MODE: {ProductMode[mode]}</div>
        </div>
      </div>

      <div className="absolute bottom-12 left-6 w-80 flex flex-col gap-3 z-30">
        <div className="h-72 overflow-y-auto scrollbar-hide flex flex-col gap-2 pointer-events-none">
           {messages.map((msg) => (
             <div key={msg.id} className={`text-[13px] px-3 py-2 rounded border-l-2 ${
               msg.sender === 'ai' ? 'text-green-100 bg-green-950/40 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
               msg.sender === 'system' ? 'text-gray-400 bg-transparent border-gray-700 italic' :
               'text-white bg-black/50 border-gray-600'
             }`}>
               {msg.sender === 'ai' && <span className="font-bold text-green-400 mr-2">[{AI_NAME}]:</span>}
               {msg.text}
             </div>
           ))}
           <div ref={chatEndRef} />
        </div>
        
        <div className={`pointer-events-auto transition-all duration-300 ${mode === ProductMode.TEXT_CHAT ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center bg-black/80 border border-gray-700 rounded p-1 shadow-lg">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入 @ai 咨询攻略..."
              className="bg-transparent border-none outline-none text-white text-xs py-2 px-3 flex-1 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="absolute top-24 right-0 flex flex-col items-end gap-6 z-50">
        {renderAIResponseBubble()}

        {mode === ProductMode.GUIDED_QUERY && !aiState.isSpeaking && (
          <div className="flex flex-col gap-2 items-end">
            {MOCK_GUIDED_QUERIES[gameState].map((q, idx) => (
              <button key={idx} onClick={() => onSendMessage(q)} className="bg-slate-900/90 border-r-4 border-r-hextech-500 border border-gray-800 text-white px-6 py-3 rounded-l-md text-xs hover:bg-hextech-900 transition-all shadow-xl font-bold">
                💡 {q}
              </button>
            ))}
          </div>
        )}

        {(mode === ProductMode.SINGLE_TURN_VOICE || mode === ProductMode.MULTI_TURN_VOICE) && (
          <div className="mr-6 flex flex-col items-center gap-3">
            <button
              onClick={() => onTriggerVoice(true)}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all shadow-2xl ${
                aiState.isListening ? 'bg-red-600 border-red-400 scale-110' : 'bg-gray-800 border-gray-700 hover:border-hextech-500'
              }`}
            >
              <IconMic className={`w-8 h-8 ${aiState.isListening ? 'text-white' : 'text-gray-400'}`} />
            </button>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${aiState.isListening ? 'text-red-500' : 'text-gray-500'}`}>
              {mode === ProductMode.MULTI_TURN_VOICE ? (aiState.isListening ? `正在聆听(${aiState.timer}s)` : '点击开启聆听窗口') : '按住录音'}
            </span>
          </div>
        )}

        {mode === ProductMode.FULL_DUPLEX && (
          <div className="mr-8 flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-full border-4 p-1.5 transition-all relative ${isDuplexActive ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-gray-800 grayscale opacity-50'}`}>
               <img src="https://picsum.photos/100/100?random=hex" className="w-full h-full rounded-full object-cover" alt="AI Agent" />
               {isDuplexActive && <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-950 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
               </div>}
            </div>
            <button onClick={onToggleDuplex} className={`px-5 py-2 rounded text-[11px] font-bold uppercase tracking-widest shadow-lg transition-all ${isDuplexActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {isDuplexActive ? '通话进行中' : '开启全双工模式'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHUD;

import React, { useState, useEffect, useRef } from 'react';
import GameHUD from './components/GameHUD';
import ControlPanel from './components/ControlPanel';
import { ProductMode, GameState, ChatMessage, PipelineLog } from './types';
import { INITIAL_CHAT_HISTORY, AI_NAME, AI_RESPONSES } from './constants';
import { getAIResponse } from './services/aiService';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ProductMode>(ProductMode.GUIDED_QUERY);
  const [gameState, setGameState] = useState<GameState>(GameState.NORMAL);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_HISTORY);
  const [pipelineLogs, setPipelineLogs] = useState<PipelineLog[]>([]);
  const [isDuplexActive, setIsDuplexActive] = useState(false);

  const [aiState, setAiState] = useState({
    isListening: false,
    isSpeaking: false,
    response: null as string | null,
    timer: 0,
    isThinking: false
  });

  const timerIntervalRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  const addPipelineLog = (role: PipelineLog['role'], content: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setPipelineLogs(prev => [...prev.slice(-40), { id: Math.random().toString(), role, content, timestamp: time }]);
  };

  const addChatMessage = (sender: ChatMessage['sender'], text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
    }]);
  };

  /**
   * Pipeline Logic visualization (ASR -> VAD -> NLP -> LLM -> TTS)
   * Deliberately slowed down for demonstration purposes.
   */
  const runPipelineFlow = async (query: string): Promise<string> => {
    addPipelineLog('ASR', `正在捕捉语音信号...`);
    await new Promise(r => setTimeout(r, 1000));
    addPipelineLog('ASR', `转义完成: "${query}"`);
    await new Promise(r => setTimeout(r, 800));
    
    addPipelineLog('VAD', 'VAD状态: 沉默检测通过，流结束');
    await new Promise(r => setTimeout(r, 600));
    
    addPipelineLog('NLP', '意图识别: 正在匹配局势分析库...');
    await new Promise(r => setTimeout(r, 1200));
    
    addPipelineLog('LLM', '正在向 Gemini 云端请求实时策略分析...');
    
    const startTime = Date.now();
    const result = await getAIResponse(query, gameState);
    const duration = Date.now() - startTime;
    
    // Ensure LLM step stays long enough to be readable
    if (duration < 1500) await new Promise(r => setTimeout(r, 1500 - duration));
    
    addPipelineLog('LLM', `推理成功 (接口延时: ${duration}ms)`);
    await new Promise(r => setTimeout(r, 800));
    
    addPipelineLog('TTS', '海克斯流式语音引擎合成中...');
    await new Promise(r => setTimeout(r, 1000));
    addPipelineLog('TTS', '语音包就绪，已通过小队频道下发');
    
    return result;
  };

  const handleAIInteraction = async (query: string, isAuto: boolean = false) => {
    const isVoiceMode = [ProductMode.SINGLE_TURN_VOICE, ProductMode.MULTI_TURN_VOICE, ProductMode.FULL_DUPLEX].includes(currentMode);

    // Mode 2: Immediate text response (No visual delay/thinking status in HUD)
    if (currentMode === ProductMode.TEXT_CHAT) {
      const response = await getAIResponse(query, gameState);
      addChatMessage('ai', response);
      return;
    }

    // Voice/Guided modes
    let finalResponse = "";
    if (isVoiceMode) {
      finalResponse = await runPipelineFlow(query);
    } else {
      // Mode 1: Guided Query (Shows bubble on the right)
      setAiState(prev => ({ ...prev, isSpeaking: true, isThinking: true }));
      finalResponse = await getAIResponse(query, gameState);
    }

    setAiState(prev => ({ ...prev, isThinking: false, response: finalResponse, isSpeaking: true }));

    // Reset voice playback state after a simulated duration
    const playDuration = 5000;
    speechTimeoutRef.current = window.setTimeout(() => {
      if (isVoiceMode) addPipelineLog('TTS', '音频播放完成，进入待命状态');
      setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));
    }, playDuration);
  };

  const handleSendMessage = (text: string) => {
    if (currentMode === ProductMode.TEXT_CHAT) {
      addChatMessage('player', text);
      if (text.toLowerCase().includes('@ai')) {
        handleAIInteraction(text.replace(/@ai/gi, '').trim() || "正在聆听，召唤师。");
      }
    } else {
      handleAIInteraction(text);
    }
  };

  // Mode 4: 30S Window Logic
  useEffect(() => {
    if (currentMode === ProductMode.MULTI_TURN_VOICE && aiState.isListening) {
      setAiState(prev => ({ ...prev, timer: 30 }));
      timerIntervalRef.current = window.setInterval(() => {
        setAiState(prev => {
          if (prev.timer <= 1) {
            clearInterval(timerIntervalRef.current!);
            addPipelineLog('SYSTEM', '30s 持续监听窗口已关闭');
            return { ...prev, isListening: false, timer: 0 };
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [aiState.isListening, currentMode]);

  const handleVoiceTrigger = (start: boolean) => {
    if (currentMode === ProductMode.MULTI_TURN_VOICE) {
      if (!aiState.isListening) {
        setAiState(prev => ({ ...prev, isListening: true }));
        addPipelineLog('SYSTEM', '多轮对话模式已激活');
      } else {
        addPipelineLog('USER_ACTION', '捕捉到后续询问语音...');
        handleAIInteraction("这局我该针对对面哪个英雄？");
      }
    } else if (currentMode === ProductMode.SINGLE_TURN_VOICE) {
      if (start) {
        setAiState(prev => ({ ...prev, isListening: true }));
        addPipelineLog('SYSTEM', '录音中...');
      } else {
        setAiState(prev => ({ ...prev, isListening: false }));
        handleAIInteraction("中路 Miss 了，我需要去支援吗？");
      }
    }
  };

  const toggleDuplex = () => {
    const active = !isDuplexActive;
    setIsDuplexActive(active);
    if (active) {
      addPipelineLog('SYSTEM', '全双工 (Full-Duplex) 陪伴模式上线');
      addPipelineLog('ASR', '实时监听激活：采样率 16kHz...');
      
      // AI Proactive query simulation
      setTimeout(async () => {
        if (isDuplexActive) {
          addPipelineLog('SYSTEM', '策略模块触发：检测到对方野区视野盲区');
          addPipelineLog('LLM', '正在为您生成主动安全提醒...');
          const proactiveMsg = await getAIResponse("根据当前局势给我一个关于生存的主动提醒", gameState);
          handleAIInteraction(proactiveMsg, true);
        }
      }, 7000);
    } else {
      addPipelineLog('SYSTEM', '全双工陪伴已退出');
    }
  };

  const simulateInterrupt = () => {
    if (isDuplexActive && aiState.isSpeaking) {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      addPipelineLog('USER_ACTION', '!!! 用户实时打断 (Barge-in) !!!');
      addPipelineLog('SYSTEM', '中止当前音频流，优先响应新指令');
      setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));
      
      setTimeout(() => {
        addPipelineLog('ASR', '识别打断内容: "停停停，先分析一下这波越塔能不能杀！"');
        handleAIInteraction("这波越塔能杀吗？");
      }, 1200);
    }
  };

  return (
    <div className="flex w-screen h-screen bg-black overflow-hidden text-white font-game" onContextMenu={(e) => {
      e.preventDefault();
      simulateInterrupt();
    }}>
      <div className="flex-1 relative">
        <GameHUD 
          mode={currentMode}
          gameState={gameState}
          onGameStateChange={setGameState}
          messages={messages}
          pipelineLogs={pipelineLogs}
          onSendMessage={handleSendMessage}
          aiState={aiState}
          onTriggerVoice={handleVoiceTrigger}
          onToggleDuplex={toggleDuplex}
          isDuplexActive={isDuplexActive}
        />
        {isDuplexActive && aiState.isSpeaking && (
          <div className="absolute bottom-10 right-10 bg-red-600/80 px-6 py-2 rounded-full animate-pulse text-xs font-bold border border-white/20 shadow-lg">
            右键屏幕 模拟打断 AI 说话 (Barge-in)
          </div>
        )}
      </div>

      <ControlPanel 
        currentMode={currentMode}
        onModeChange={(m) => {
          setCurrentMode(m);
          setPipelineLogs([{ id: 'init', role: 'SYSTEM', content: `形态已更新: ${ProductMode[m]}`, timestamp: '--:--:--' }]);
          setAiState({ isListening: false, isSpeaking: false, response: null, timer: 0, isThinking: false });
          setIsDuplexActive(false);
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        }}
        currentState={gameState}
        onStateChange={setGameState}
      />
    </div>
  );
};

export default App;
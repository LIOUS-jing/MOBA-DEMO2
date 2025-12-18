
import React, { useState, useEffect, useRef } from 'react';
import GameHUD from './components/GameHUD';
import ControlPanel from './components/ControlPanel';
import { ProductMode, GameState, ChatMessage, PipelineLog } from './types';
import { INITIAL_CHAT_HISTORY, AI_NAME, AI_RESPONSES, DUPLEX_SCENARIOS } from './constants';
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
  const duplexScenarioIdxRef = useRef(0);

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

  const runPipelineFlow = async (query: string): Promise<string> => {
    addPipelineLog('ASR', `捕捉音频流中...`);
    await new Promise(r => setTimeout(r, 800));
    addPipelineLog('ASR', `识别结果 [QUERY]: "${query}"`);
    await new Promise(r => setTimeout(r, 600));
    
    addPipelineLog('VAD', 'VAD状态: 语音结束 (Speech Stop)');
    await new Promise(r => setTimeout(r, 400));
    
    addPipelineLog('NLP', '语义提取: 关键词 [打野, 入侵, 策略]');
    await new Promise(r => setTimeout(r, 800));
    
    addPipelineLog('LLM', 'Gemini 云端决策中...');
    const startTime = Date.now();
    const result = await getAIResponse(query, gameState);
    const duration = Date.now() - startTime;
    
    if (duration < 1200) await new Promise(r => setTimeout(r, 1200 - duration));
    
    addPipelineLog('LLM', `结果下发 [AI_TEXT]: "${result}"`);
    await new Promise(r => setTimeout(r, 600));
    
    addPipelineLog('TTS', '流式 TTS 合成 [Voice: Hextech-Male]...');
    await new Promise(r => setTimeout(r, 1000));
    addPipelineLog('TTS', '音频播放开始');
    
    return result;
  };

  const handleAIInteraction = async (query: string, isAuto: boolean = false) => {
    const isVoiceMode = [ProductMode.SINGLE_TURN_VOICE, ProductMode.MULTI_TURN_VOICE, ProductMode.FULL_DUPLEX].includes(currentMode);

    if (currentMode === ProductMode.TEXT_CHAT) {
      const response = await getAIResponse(query, gameState);
      addChatMessage('ai', response);
      return;
    }

    let finalResponse = "";
    if (isVoiceMode) {
      finalResponse = await runPipelineFlow(query);
    } else {
      setAiState(prev => ({ ...prev, isSpeaking: true, isThinking: true }));
      finalResponse = await getAIResponse(query, gameState);
    }

    setAiState(prev => ({ ...prev, isThinking: false, response: finalResponse, isSpeaking: true }));

    const playDuration = 5000;
    speechTimeoutRef.current = window.setTimeout(() => {
      if (isVoiceMode) addPipelineLog('TTS', '播放链路释放');
      setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));
    }, playDuration);
  };

  const handleSendMessage = (text: string) => {
    if (currentMode === ProductMode.TEXT_CHAT) {
      addChatMessage('player', text);
      if (text.toLowerCase().includes('@ai')) {
        handleAIInteraction(text.replace(/@ai/gi, '').trim() || "在的。");
      }
    } else {
      handleAIInteraction(text);
    }
  };

  // 全双工模式：模拟真实多场景对话循环
  useEffect(() => {
    let scenarioTimer: number | null = null;

    if (currentMode === ProductMode.FULL_DUPLEX && isDuplexActive) {
      const runScenario = async () => {
        const scenario = DUPLEX_SCENARIOS[duplexScenarioIdxRef.current % DUPLEX_SCENARIOS.length];
        duplexScenarioIdxRef.current++;

        addPipelineLog('SYSTEM', `[主动触发] 场景探测: ${scenario.trigger}`);
        await new Promise(r => setTimeout(r, 1000));
        
        // AI 先主动说话
        addPipelineLog('LLM', `生成主动话术: "${scenario.ai}"`);
        setAiState(prev => ({ ...prev, isSpeaking: true, response: scenario.ai }));
        await new Promise(r => setTimeout(r, 4000));
        setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));

        // 模拟用户语音回应
        await new Promise(r => setTimeout(r, 1500));
        addPipelineLog('ASR', `实时转义用户回复: "${scenario.user}"`);
        await new Promise(r => setTimeout(r, 1000));

        // AI 再次快速响应
        addPipelineLog('LLM', `全双工快速响应: "${scenario.reply}"`);
        setAiState(prev => ({ ...prev, isSpeaking: true, response: scenario.reply }));
        await new Promise(r => setTimeout(r, 4000));
        setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));

        // 间隔后进行下一个场景
        scenarioTimer = window.setTimeout(runScenario, 8000);
      };

      scenarioTimer = window.setTimeout(runScenario, 2000);
    }

    return () => { if (scenarioTimer) clearTimeout(scenarioTimer); };
  }, [currentMode, isDuplexActive]);

  // 形态4的 30s 窗口
  useEffect(() => {
    if (currentMode === ProductMode.MULTI_TURN_VOICE && aiState.isListening) {
      setAiState(prev => ({ ...prev, timer: 30 }));
      timerIntervalRef.current = window.setInterval(() => {
        setAiState(prev => {
          if (prev.timer <= 1) {
            clearInterval(timerIntervalRef.current!);
            addPipelineLog('SYSTEM', '30s 聆听窗已超时关闭');
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

  const handleVoiceTrigger = (active: boolean) => {
    // 形态3：按住说话 (Push-to-Talk)
    if (currentMode === ProductMode.SINGLE_TURN_VOICE) {
      if (active) {
        setAiState(prev => ({ ...prev, isListening: true }));
        addPipelineLog('SYSTEM', '用户按下录音 [Start Capture]');
      } else {
        setAiState(prev => ({ ...prev, isListening: false }));
        addPipelineLog('SYSTEM', '用户松开录音 [Trigger AI Inference]');
        handleAIInteraction("这波小龙团我该怎么切入？");
      }
    } 
    // 形态4：点击切换 30s 窗口
    else if (currentMode === ProductMode.MULTI_TURN_VOICE) {
      if (!aiState.isListening) {
        setAiState(prev => ({ ...prev, isListening: true }));
        addPipelineLog('SYSTEM', '开启 30s 全力监听模式');
      } else {
        addPipelineLog('USER_ACTION', '多轮窗口内捕捉到后续追问');
        handleAIInteraction("对面辅助不见了，是不是去排眼了？");
      }
    }
  };

  const toggleDuplex = () => {
    const active = !isDuplexActive;
    setIsDuplexActive(active);
    if (active) {
      addPipelineLog('SYSTEM', '全双工实时陪伴链路已连接 [Latency < 150ms]');
      addPipelineLog('ASR', '实时语音特征监听启动...');
    } else {
      addPipelineLog('SYSTEM', '链路正常断开');
      setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));
    }
  };

  const simulateInterrupt = () => {
    if (isDuplexActive && aiState.isSpeaking) {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      addPipelineLog('USER_ACTION', '!!! 用户实时抢占打断 (Barge-in Detected) !!!');
      addPipelineLog('SYSTEM', '立即执行中断协议：停止当前音频播报');
      setAiState(prev => ({ ...prev, isSpeaking: false, response: null }));
      
      setTimeout(() => {
        addPipelineLog('ASR', '抢断话术识别: "别说了，先看大龙，对面开开了！"');
        handleAIInteraction("对面在偷大龙吗？");
      }, 1000);
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
          <div className="absolute bottom-10 right-10 bg-cyan-600/90 px-6 py-2 rounded-full animate-pulse text-xs font-bold border border-white/20 shadow-[0_0_20px_rgba(6,182,212,0.5)] z-50">
            右键点击 模拟实时打断 AI 说话
          </div>
        )}
      </div>

      <ControlPanel 
        currentMode={currentMode}
        onModeChange={(m) => {
          setCurrentMode(m);
          setPipelineLogs([{ id: 'init', role: 'SYSTEM', content: `交互形态切换: ${ProductMode[m]}`, timestamp: '--:--:--' }]);
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

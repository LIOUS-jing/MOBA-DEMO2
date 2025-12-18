
import React from 'react';
import { ProductMode, GameState } from '../types';
import { IconBrain, IconChat, IconMic, IconZap, IconActivity } from './Icons';

interface ControlPanelProps {
  currentMode: ProductMode;
  onModeChange: (mode: ProductMode) => void;
  currentState: GameState;
  onStateChange: (state: GameState) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentMode,
  onModeChange,
  currentState,
  onStateChange
}) => {
  const modes = [
    { id: ProductMode.GUIDED_QUERY, label: '形态 1: 智能推荐', icon: IconBrain, desc: '右侧气泡侧吸，回复左滑出现' },
    { id: ProductMode.TEXT_CHAT, label: '形态 2: 文本交互', icon: IconChat, desc: '直接输入 @AI 触发对话' },
    { id: ProductMode.SINGLE_TURN_VOICE, label: '形态 3: 唤醒对话(单次)', icon: IconMic, desc: '右侧麦克风，点击交互' },
    { id: ProductMode.MULTI_TURN_VOICE, label: '形态 4: 实时聆听(多轮)', icon: IconZap, desc: '30s窗口期，连续追问' },
    { id: ProductMode.FULL_DUPLEX, label: '形态 5: 全双工陪伴', icon: IconActivity, desc: '右侧头像+麦克风角标常驻' },
  ];

  const states = [
    { id: GameState.NORMAL, label: '对线期' },
    { id: GameState.DEAD, label: '玩家死亡' },
    { id: GameState.SHOPPING, label: '访问商店' },
    { id: GameState.OBJECTIVE_SPAWN, label: '资源刷新' },
  ];

  return (
    <div className="w-80 bg-slate-950 border-l border-gray-800 flex flex-col shadow-2xl z-50">
      <div className="p-4 bg-slate-900 border-b border-gray-800">
        <h1 className="text-lg font-bold text-hextech-300">形态演示面板</h1>
        <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-widest">Interaction Design Prototype</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h2 className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-widest border-b border-gray-800 pb-1">交互形态</h2>
          <div className="space-y-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`w-full flex items-center p-3 rounded border text-left transition-all ${
                  currentMode === mode.id ? 'bg-hextech-900/40 border-hextech-500' : 'bg-slate-900/50 border-gray-800'
                }`}
              >
                <mode.icon className={`w-4 h-4 mr-3 ${currentMode === mode.id ? 'text-hextech-400' : 'text-gray-600'}`} />
                <div>
                  <div className="font-bold text-xs">{mode.label}</div>
                  <div className="text-[9px] opacity-60">{mode.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-widest border-b border-gray-800 pb-1">游戏状态模拟</h2>
          <div className="grid grid-cols-2 gap-2">
            {states.map((state) => (
              <button
                key={state.id}
                onClick={() => onStateChange(state.id)}
                className={`text-[10px] p-2 rounded border ${currentState === state.id ? 'bg-red-900/40 border-red-500' : 'bg-slate-900/50'}`}
              >
                {state.label}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-900/80 p-3 rounded border border-gray-800">
           <h2 className="text-[10px] uppercase font-bold text-gray-500 mb-2">交互逻辑</h2>
           <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-1.5">
             {currentMode === ProductMode.GUIDED_QUERY && <li>点击右侧气泡，内容不进聊天框，回复从最右侧侧滑切入。</li>}
             {currentMode === ProductMode.TEXT_CHAT && <li>聊天框输入 "@AI" 触发，对话保留在左侧。</li>}
             {currentMode === ProductMode.SINGLE_TURN_VOICE && <li>右侧点击录制，结束后回复从右侧切入。</li>}
             {currentMode === ProductMode.FULL_DUPLEX && <li>右侧出现助手头像，点击右上角麦克风开启/关闭陪伴。</li>}
           </ul>
        </section>
      </div>
    </div>
  );
};

export default ControlPanel;

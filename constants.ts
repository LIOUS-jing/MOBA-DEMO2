
import { GameState, ChatMessage } from './types';

export const AI_NAME = "海克斯助手";

export const MOCK_GUIDED_QUERIES: Record<GameState, string[]> = {
  [GameState.NORMAL]: ["现在该去哪发育？", "队友在干嘛", "帮我分析对线策略"],
  [GameState.DEAD]: [
    "复盘死亡原因",
    "查看伤害来源",
    "下一波团战怎么打"
  ],
  [GameState.SHOPPING]: [
    "比较1100金币的两种小件策略",
    "对面刺客肥了出什么",
    "推荐核心三件套"
  ],
  [GameState.OBJECTIVE_SPAWN]: [
    "小龙1分钟刷新规划任务",
    "对面打野大概率在哪",
    "这波团战站位建议"
  ]
};

// 形态5：全双工场景模拟剧本
export const DUPLEX_SCENARIOS = [
  {
    trigger: "视野检测",
    ai: "注意，敌方打野在刚才在河道露头了，正在往你这边走。建议后撤。",
    user: "我知道了，但我能反杀吗？",
    reply: "你的闪现还有30秒。建议稳住，等辅助支援。"
  },
  {
    trigger: "资源倒计时",
    ai: "大龙还有20秒刷新，我看你身上有2000金币。不考虑回城补个大件？",
    user: "不用，这波先抢视野。",
    reply: "收到。已标记河道草丛，那里可能是敌方埋伏点。"
  },
  {
    trigger: "经济优势",
    ai: "你已经超神了！目前的经济领先对面中单2500。可以考虑带起推塔节奏。",
    user: "来中路集合推塔。",
    reply: "正在发送全队集结信号。正在分析最佳破塔路径..."
  }
];

export const AI_RESPONSES = {
  DEFAULT: "收到，正在分析局势...",
  DEATH_ANALYSIS: "检测到你受到敌方卡特琳娜 800点魔法伤害。建议下一件装备优先合成【饮魔刀】以提升生存率。",
  SHOP_ADVICE: "考虑到敌方阵容法伤较多，推荐购买【水银之靴】。如果是顺风局，直接出【无尽之刃】。",
  JUNGLE_TRACKING: "敌方打野30秒前出现在上路。由于目前下路兵线过深，建议撤退，以免被包夹。",
  PROACTIVE_Q: "注意，大龙将在30秒后刷新，我看你身上还有1500金币，不先回城补给一下吗？",
  INTERRUPTED: "（收到打断）好的，优先为你处理当前紧急询问：...",
  ENCOURAGEMENT: "稳住，我们能赢！专注对线和补刀，后期团战我们阵容更有优势。"
};

export const INITIAL_CHAT_HISTORY: ChatMessage[] = [
  { id: '1', sender: 'system', text: '欢迎来到召唤师峡谷！AI实时语音助手已就绪。', timestamp: '00:00' },
];

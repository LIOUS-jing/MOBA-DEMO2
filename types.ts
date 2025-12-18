export enum ProductMode {
  GUIDED_QUERY = 1,
  TEXT_CHAT = 2,
  SINGLE_TURN_VOICE = 3,
  MULTI_TURN_VOICE = 4,
  FULL_DUPLEX = 5,
}

export enum GameState {
  NORMAL = 'NORMAL',
  DEAD = 'DEAD',
  SHOPPING = 'SHOPPING',
  OBJECTIVE_SPAWN = 'OBJECTIVE_SPAWN',
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'system' | 'ally' | 'ai';
  text: string;
  timestamp: string;
}

export interface PipelineLog {
  id: string;
  role: 'SYSTEM' | 'ASR' | 'VAD' | 'NLP' | 'LLM' | 'TTS' | 'USER_ACTION';
  content: string;
  timestamp: string;
  color?: string;
}
import React from 'react';
import { Mic, MicOff, MessageSquare, Zap, Headphones, X, Send, Activity, BrainCircuit } from 'lucide-react';

export const IconMic = ({ className }: { className?: string }) => <Mic className={className} />;
export const IconMicOff = ({ className }: { className?: string }) => <MicOff className={className} />;
export const IconChat = ({ className }: { className?: string }) => <MessageSquare className={className} />;
export const IconZap = ({ className }: { className?: string }) => <Zap className={className} />;
export const IconHeadphones = ({ className }: { className?: string }) => <Headphones className={className} />;
export const IconClose = ({ className }: { className?: string }) => <X className={className} />;
export const IconSend = ({ className }: { className?: string }) => <Send className={className} />;
export const IconActivity = ({ className }: { className?: string }) => <Activity className={className} />;
export const IconBrain = ({ className }: { className?: string }) => <BrainCircuit className={className} />;
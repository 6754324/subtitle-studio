import type { Cue } from '../types'

export const LANGUAGES = ['英语', '日语', '韩语', '法语', '西班牙语', '简体中文'] as const
export type TargetLang = (typeof LANGUAGES)[number]

/** A short demo subtitle track (a slice of a news interview). */
export const DEMO_CUES: Cue[] = [
  { id: 'd1', start: 1000, end: 3400, text: '各位观众晚上好，欢迎收看今天的节目。' },
  { id: 'd2', start: 4000, end: 7200, text: '今天我们聊聊城市里的夜间经济。' },
  { id: 'd3', start: 7600, end: 11800, text: '凌晨的街头，有哪些人在为这座城市守夜？' },
  { id: 'd4', start: 12300, end: 15600, text: '我们跟随镜头，走进一家深夜食堂。' },
  { id: 'd5', start: 16100, end: 19800, text: '店主说，开店十年，他见过太多晚归的人。' },
  { id: 'd6', start: 20300, end: 24000, text: '一碗热汤，往往比什么都更能暖人心。' },
  { id: 'd7', start: 24500, end: 27900, text: '感谢收看，我们下期再见。' },
]

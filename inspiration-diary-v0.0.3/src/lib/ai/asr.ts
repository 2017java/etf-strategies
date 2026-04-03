export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    console.warn('语音识别功能暂未实现，请在火山引擎控制台配置豆包语音识别 API')
    return ''
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return ''
  }
}

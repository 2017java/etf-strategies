const DASHSCOPE_ASR_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription'

interface ASRResponse {
  output: {
    results: Array<{
      transcription_text: string
    }>
  }
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    const response = await fetch(DASHSCOPE_ASR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'paraformer-realtime-v2',
        input: {
          audio_url: audioUrl
        },
        parameters: {
          language_hints: ['zh', 'en']
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: ASRResponse = await response.json()
    return data.output.results[0]?.transcription_text || ''
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return ''
  }
}

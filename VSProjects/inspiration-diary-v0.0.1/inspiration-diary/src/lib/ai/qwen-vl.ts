const DASHSCOPE_VL_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

interface VLResponse {
  output: {
    results: Array<{
      text: string
    }>
  }
}

export async function analyzeImage(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(DASHSCOPE_VL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: imageUrl
                },
                {
                  text: '请详细描述这张图片的内容，包括主要元素、场景、氛围等。如果图片中有文字，请识别出来。'
                }
              ]
            }
          ]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: VLResponse = await response.json()
    return data.output.results[0]?.text || '无法识别图片内容'
  } catch (error) {
    console.error('Error analyzing image:', error)
    return '图片识别失败'
  }
}

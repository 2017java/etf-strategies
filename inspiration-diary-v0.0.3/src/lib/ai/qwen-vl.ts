const DOUBAO_VL_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

interface VLResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function analyzeImage(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(DOUBAO_VL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DOUBAO_VISION_MODEL || 'doubao-seed-1-6-vision-251015',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请详细描述这张图片的内容，包括主要元素、场景、氛围等。如果图片中有文字，请识别出来。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: VLResponse = await response.json()
    return data.choices[0]?.message?.content || '无法识别图片内容'
  } catch (error) {
    console.error('Error analyzing image:', error)
    return '图片识别失败'
  }
}

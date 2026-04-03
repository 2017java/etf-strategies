const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

interface QwenResponse {
  output: {
    text: string
    finish_reason: string
  }
  usage: {
    total_tokens: number
  }
}

export async function analyzeInspiration(content: string): Promise<{
  keywords: string[]
  emotion: string
  suggestions: string[]
}> {
  const prompt = `请分析以下灵感内容，提取关键词、判断情感倾向，并给出完善建议。

灵感内容：
${content}

请以JSON格式返回结果，格式如下：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "emotion": "情感类型（兴奋/平静/困惑/焦虑/期待/其他）",
  "suggestions": ["建议1", "建议2", "建议3"]
}

只返回JSON，不要有其他内容。`

  try {
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          result_format: 'text'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: QwenResponse = await response.json()
    const result = JSON.parse(data.output.text)
    
    return result
  } catch (error) {
    console.error('Error analyzing inspiration:', error)
    return {
      keywords: [],
      emotion: '其他',
      suggestions: []
    }
  }
}

export async function expandInspiration(content: string): Promise<string> {
  const prompt = `请扩展以下灵感内容，提供更详细的描述和可能的行动方向。

灵感内容：
${content}

请直接返回扩展后的内容，不要有其他说明。`

  try {
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: QwenResponse = await response.json()
    return data.output.text
  } catch (error) {
    console.error('Error expanding inspiration:', error)
    return content
  }
}

export async function generateTodoFromInspiration(content: string): Promise<{
  title: string
  description: string
  subTasks: string[]
}> {
  const prompt = `请根据以下灵感内容，生成一个待办事项，包括标题、描述和子任务。

灵感内容：
${content}

请以JSON格式返回结果，格式如下：
{
  "title": "待办事项标题",
  "description": "详细描述",
  "subTasks": ["子任务1", "子任务2", "子任务3"]
}

只返回JSON，不要有其他内容。`

  try {
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: QwenResponse = await response.json()
    return JSON.parse(data.output.text)
  } catch (error) {
    console.error('Error generating todo:', error)
    return {
      title: content.slice(0, 50),
      description: content,
      subTasks: []
    }
  }
}

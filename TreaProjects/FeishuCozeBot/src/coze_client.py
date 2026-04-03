"""
Coze API 客户端
调用 Coze 编程智能体 API
"""
import json
import time
import requests
from typing import Optional, Dict, Any, Generator
from dataclasses import dataclass


@dataclass
class CozeResponse:
    success: bool
    content: str
    raw_response: Dict[str, Any]
    error: Optional[str] = None


class CozeClient:
    def __init__(
        self,
        api_url: str,
        api_token: str,
        bot_id: str,
        timeout: int = 120
    ):
        self.api_url = api_url
        self.api_token = api_token
        self.bot_id = bot_id
        self.timeout = timeout
    
    def _build_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    def _build_payload(
        self,
        query: str,
        user_id: str,
        additional_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        payload = {
            "bot_id": self.bot_id,
            "user_id": user_id,
            "query": query,
            "stream": False
        }
        if additional_params:
            payload.update(additional_params)
        return payload
    
    def chat(
        self,
        query: str,
        user_id: str = "default_user",
        additional_params: Optional[Dict[str, Any]] = None
    ) -> CozeResponse:
        print(f"\n[Coze API] 调用中...")
        print(f"[Coze API] query: {query[:100]}...")
        
        headers = self._build_headers()
        payload = self._build_payload(query, user_id, additional_params)
        
        try:
            start_time = time.time()
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=self.timeout
            )
            elapsed_time = time.time() - start_time
            
            print(f"[Coze API] 响应状态: {response.status_code}")
            print(f"[Coze API] 耗时: {elapsed_time:.2f}秒")
            
            if response.status_code != 200:
                return CozeResponse(
                    success=False,
                    content="",
                    raw_response={},
                    error=f"HTTP错误: {response.status_code}"
                )
            
            result = response.json()
            
            content = self._extract_content(result)
            
            if content:
                print(f"[Coze API] 返回内容长度: {len(content)} 字符")
                return CozeResponse(
                    success=True,
                    content=content,
                    raw_response=result
                )
            else:
                return CozeResponse(
                    success=False,
                    content="",
                    raw_response=result,
                    error="无法提取回复内容"
                )
                
        except requests.exceptions.Timeout:
            return CozeResponse(
                success=False,
                content="",
                raw_response={},
                error="API请求超时"
            )
        except requests.exceptions.RequestException as e:
            return CozeResponse(
                success=False,
                content="",
                raw_response={},
                error=f"网络请求错误: {str(e)}"
            )
        except Exception as e:
            return CozeResponse(
                success=False,
                content="",
                raw_response={},
                error=f"未知错误: {str(e)}"
            )
    
    def _extract_content(self, response: Dict[str, Any]) -> str:
        if "content" in response:
            return response["content"]
        
        if "data" in response:
            data = response["data"]
            if isinstance(data, str):
                return data
            if isinstance(data, dict):
                if "content" in data:
                    return data["content"]
                if "answer" in data:
                    return data["answer"]
                if "output" in data:
                    return data["output"]
        
        if "choices" in response:
            choices = response["choices"]
            if choices and len(choices) > 0:
                choice = choices[0]
                if "message" in choice:
                    return choice["message"].get("content", "")
                if "text" in choice:
                    return choice["text"]
        
        if "answer" in response:
            return response["answer"]
        
        if "output" in response:
            return response["output"]
        
        if "messages" in response:
            messages = response["messages"]
            if isinstance(messages, list):
                contents = []
                for msg in messages:
                    if isinstance(msg, dict):
                        if msg.get("type") == "answer":
                            contents.append(msg.get("content", ""))
                        elif "content" in msg:
                            contents.append(msg["content"])
                if contents:
                    return "\n".join(contents)
        
        print(f"[Coze API] 未知响应格式: {json.dumps(response, ensure_ascii=False)[:500]}")
        return ""
    
    def chat_stream(
        self,
        query: str,
        user_id: str = "default_user",
        additional_params: Optional[Dict[str, Any]] = None
    ) -> Generator[str, None, None]:
        headers = self._build_headers()
        payload = self._build_payload(query, user_id, additional_params)
        payload["stream"] = True
        
        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
                stream=True
            )
            
            for line in response.iter_lines():
                if line:
                    line_text = line.decode("utf-8")
                    if line_text.startswith("data:"):
                        data_str = line_text[5:].strip()
                        if data_str:
                            try:
                                data = json.loads(data_str)
                                content = self._extract_content(data)
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            yield f"[错误] {str(e)}"

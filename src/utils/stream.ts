import * as cryptoJs from "crypto-js";
const baseURL = import.meta.env.VITE_BASE_URL;
interface sFetchOptions {
  url: string;
  method?: string;
  body?: any;
  headers?: object;
  query: object | null;
  needToken?: boolean;
}

// 辅助函数：带过期时间的 localStorage 操作
function _setWithExpiry(key: string, value: boolean, ttlMs: number): void {
  const item = { value, expiry: Date.now() + ttlMs };
  localStorage.setItem(key, JSON.stringify(item));
}
function _getWithExpiry(key: string): boolean {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return false; // 如果没有找到键，表示是第一次请求
  const item = JSON.parse(itemStr);
  if (Date.now() > item.expiry) {
    // 检查是否过期，过期移出该项
    localStorage.removeItem(key);
    return false;
  }
  return item.value; // 否则表示重复提交
}

/**
 * 二次封装fetch请求
 * @param {Object} options 请求配置
 * @returns Promise<Response>
 */
export const sFetch = (options: sFetchOptions) => {
  let {
    url,
    method = "get",
    body = {},
    headers = {},
    query = null,
    needToken = false,
  } = options;
  // 构建完整的URL，包括查询参数
  if (query) {
    url +=
      "?" +
      Object.keys(query)
        .map((it) => `${it}=${query[it]}`)
        .join("&");
  }
  // 设置请求头Authorization
  if (needToken) {
    headers["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
  }
  // 是否是文件上传请求
  let isFileUpload = body instanceof FormData; // FormData 对象表示文件上传

  //防止重复提交数据
  const blackList = ["post", "put", "delete", "patch"];
  if (blackList.includes(method.toLowerCase()) && body && !isFileUpload) {
    const requestBodyHash = cryptoJs.SHA256(JSON.stringify(body)).toString(); // 计算请求体的哈希值
    const cacheKey = `request_cache_${url}_${requestBodyHash}`; // 使用URL和请求体哈希作为缓存键
    const lastRequest = _getWithExpiry(cacheKey); // 检查是否有相同的请求
    if (lastRequest) {
      console.log("请求重复提交，请求已拦截");
      return Promise.reject(new Error("请求重复提交，请求已拦截"));
    }
    _setWithExpiry(cacheKey, true, 500); // 缓存请求，500ms内视为重复提交
  }
  // 发送请求
  return fetch(baseURL + url, {
    method,
    body,
    headers: {
      ...headers,
      ...(!isFileUpload && { "Content-Type": "application/json" }),
    },
  });
};

/**
 * 解析流式数据
 * @param {Object} options 请求配置
 * @param {Function} onListen 回调函数，用于处理流式数据
 * @returns Promise
 */
export const streamSSE = (
  options: sFetchOptions,
  onListen: (content: string) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = (await sFetch(options)) as any; // 使用自定义fetch
      const reader = response.body.getReader(); // 获取流式数据的读取器
      const decoder = new TextDecoder();
      let buffer = "";
      // 处理流式数据
      const processChunk = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const lastData = buffer.trim();
              if (lastData.startsWith("data:")) {
                const data = lastData.replace(/^data:\s*/, "");
                if (data === "[DONE]") {
                  reader.cancel(); // 可选：提前终止流
                } else {
                  const resData = JSON.parse(data);
                  const { content } = resData.choices[0].delta;
                  content && onListen(content);
                }
              }
            }
            resolve("[DONE]");
            return;
          }
          buffer += decoder.decode(value, { stream: true }); // 数据解码并追加到缓冲区
          // 处理 SSE 消息（以 "\n\n" 分隔）
          const lines = buffer.split("\n\n");
          buffer = lines.pop() as string; // 数据可能会分块到达，并且不是按照完整的消息边界分割的，保留未处理的部分
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.replace(/^data:\s*/, "");
              if (data === "[DONE]") {
                reader.cancel(); // 可选：提前终止流
                resolve("[DONE]");
                return;
              }
              const resData = JSON.parse(data);
              const { content } = resData.choices[0].delta;
              content && onListen(content);
            }
          }
          processChunk(); // 继续读取
        } catch (err) {
          reject(err);
        }
      };
      processChunk();
    } catch (err) {
      reject(err);
    }
  });
};

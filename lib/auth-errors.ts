"use client";

export function describeAuthError(error: unknown, action: "login" | "signup") {
  const actionText = action === "signup" ? "注册" : "登录";

  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return `${actionText}失败：无法连接本站 API。请检查当前网络、域名解析或部署平台状态。`;
  }

  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return `${actionText}失败：本站 API 请求失败。请确认网站域名可以正常访问。`;
    }
    return `${actionText}失败：${error.message}`;
  }

  return `${actionText}失败：未知错误。`;
}

export function getAuthErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : error.constructor?.name || "UnknownError",
    message: typeof record.message === "string" ? record.message : "",
    status: typeof record.status === "number" || typeof record.status === "string" ? String(record.status) : null
  };
}

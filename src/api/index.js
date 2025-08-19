import http from "@/utils/http";

export const test = (ask) => {
  return http.post(
    "/chat/completions",
    {
      model: "THUDM/GLM-4-9B-0414",
      stream: true,
      messages: [
        {
          content: ask,
          role: "user",
        },
      ],
    },
    {
      needToken: true,
      responseType: "stream",
    }
  );
};

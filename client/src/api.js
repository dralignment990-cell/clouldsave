// 백엔드 API 래퍼
const json = (r) => {
  if (!r.ok) return r.json().then((e) => Promise.reject(e));
  return r.json();
};

export const api = {
  plan: (body) =>
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json),

  example: () => fetch("/api/example/longing").then(json),

  send: (body) =>
    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json),
};

// ───────────────────────────────────────────────────────────────
// data.go.kr CORS 프록시 — Cloudflare Worker
// 브라우저가 apis.data.go.kr 를 직접 못 부르는 문제(CORS)를 우회합니다.
//
// 배포 방법 (무료, 약 3분):
//   1) https://dash.cloudflare.com → 좌측 "Workers & Pages" → "Create" → "Create Worker"
//   2) 이름 짓고 "Deploy" → "Edit code" 클릭
//   3) 기본 코드를 모두 지우고 이 파일 내용을 붙여넣기 → "Deploy"
//   4) 발급된 주소 복사  예) https://traffic-proxy.<계정>.workers.dev
//   5) signal_api.jsx 의 PROXY 값에 다음 형태로 넣기:
//        PROXY: "https://traffic-proxy.<계정>.workers.dev/?url="
//
// 동작: /?url=<인코딩된 대상URL> 로 들어오면, apis.data.go.kr 만 허용해
//       서버측에서 대신 호출하고 CORS 헤더를 붙여 응답을 돌려줍니다.
// ───────────────────────────────────────────────────────────────

const ALLOW_HOST = "apis.data.go.kr"; // 이 호스트만 프록시 (오남용 방지)

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url");
    if (!target) {
      return new Response("missing ?url=", { status: 400, headers: cors });
    }

    let t;
    try {
      t = new URL(target);
    } catch (e) {
      return new Response("bad url", { status: 400, headers: cors });
    }
    if (t.hostname !== ALLOW_HOST) {
      return new Response("host not allowed", { status: 403, headers: cors });
    }

    try {
      const upstream = await fetch(target, { headers: { Accept: "application/json" } });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...cors,
          "Content-Type":
            upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        },
      });
    } catch (e) {
      return new Response("upstream error: " + e.message, { status: 502, headers: cors });
    }
  },
};

import { loadEnv, type Plugin } from "vite";
import { normalizeApiBase } from "./src/lib/api-base.ts";

// 빌드 때 API 서버 주소(VITE_API_BASE)를 host_permissions에 넣어 manifest.json을 만든다.
// 확장 프로그램 페이지는 host_permissions에 있는 서버를 CORS 없이 호출할 수 있다.
export function manifestPlugin(mode: string): Plugin {
  return {
    name: "guestbook-manifest",
    generateBundle() {
      const env = loadEnv(mode, import.meta.dirname, "VITE_");
      const apiBase = normalizeApiBase(env.VITE_API_BASE);
      const manifest = {
        manifest_version: 3,
        name: "방명록",
        description: "로그인 없이 한마디를 남기는 방명록",
        version: "0.1.0",
        action: {
          default_title: "방명록",
          default_popup: "popup.html",
          default_icon: { 16: "icons/icon16.png", 48: "icons/icon48.png" },
        },
        icons: { 16: "icons/icon16.png", 48: "icons/icon48.png", 128: "icons/icon128.png" },
        host_permissions: [`${new URL(apiBase).origin}/*`],
      };
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

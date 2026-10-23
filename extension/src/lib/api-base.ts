export function normalizeApiBase(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!/^https?:\/\/[^/]/.test(value)) {
    throw new Error(
      "VITE_API_BASE에 방명록 API 서버 주소(예: https://내프로젝트.vercel.app)를 설정해야 합니다.",
    );
  }
  return value.replace(/\/+$/, "");
}

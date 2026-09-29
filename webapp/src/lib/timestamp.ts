// uploads.uploadedAt에 쓰는 "지금" 타임스탬프. Date.toISOString()은 UTC로 바꿔서 찍기 때문에
// (KST는 UTC+9) 화면에 그대로 슬라이스해서 보여주면(예: upload/page.tsx) 실제 시각보다
// 9시간 이른 시각이 찍힌다 — 실제로 오전 9시대에 올린 업로드가 "00:07:35"로 보인 적이 있다.
// 서버가 Asia/Seoul(KST)에서 돈다는 전제로 로컬 getFullYear/getHours 등을 직접 포맷해
// "YYYY-MM-DDTHH:mm:ss"(Z 없음)를 만든다 — 표시 쪽의 slice(0,19).replace("T"," ")와 그대로
// 맞물리게 T 구분자는 유지한다.
export function nowLocalTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day}T${h}:${min}:${s}`;
}

// admin.ts의 백업 파일명(agm_oee_<stamp>.sqlite)용 — 같은 이유로 UTC 대신 로컬(KST) 시각을
// 쓴다. 예전엔 new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")였는데 그것도 UTC라
// 백업 파일명이 실제 백업 시각보다 9시간 이르게 찍혔다.
export function nowLocalFilenameStamp(): string {
  return nowLocalTimestamp().replace(/[:T]/g, "-");
}

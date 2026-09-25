// 검증 보고서 PPT 생성 (수치는 2026-07 검증 결과를 직접 입력한 정적 보고서)
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
const FONT = 'Malgun Gothic';
const C = { dark: '1B2A34', ink: '23313B', mute: '5F6B73', line: 'D5DCE1', tint: 'F2F5F7', amber: 'E8A33D', amberT: 'FBEBD2', green: '2E8B57', greenT: 'DDF0E4', red: 'C0392B', redT: 'F8DEDA', white: 'FFFFFF', blueT: 'E3ECF3' };

function header(s, title, sub, n) {
  s.background = { color: C.white };
  s.addText(title, { x: 0.6, y: 0.35, w: 12.1, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: C.dark, margin: 0, isTextBox: true });
  if (sub) s.addText(sub, { x: 0.6, y: 1.02, w: 12.1, h: 0.4, fontFace: FONT, fontSize: 14, color: C.mute, margin: 0, isTextBox: true });
  s.addText(String(n), { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 10, color: C.mute, align: 'right', margin: 0, isTextBox: true });
  s.addText('AGM 조립 1~4라인 가동율 산출방식 검증', { x: 0.6, y: 7.0, w: 6, h: 0.3, fontFace: FONT, fontSize: 10, color: C.mute, margin: 0, isTextBox: true });
}
function cell(t, o = {}) { return { text: String(t), options: Object.assign({ fontFace: FONT, fontSize: 11, color: C.ink, valign: 'middle', margin: [3, 5, 3, 5] }, o) }; }
function hrow(arr) { return arr.map(t => cell(t, { bold: true, color: C.white, fill: { color: C.dark }, align: 'center' })); }
function table(s, head, rows, opt) {
  const data = [hrow(head)];
  rows.forEach((r, i) => data.push(r.map((v, j) => {
    if (v && typeof v === 'object' && v.text !== undefined) { v.options = Object.assign({ fontFace: FONT, fontSize: opt.fs || 11, color: C.ink, valign: 'middle', margin: [3, 5, 3, 5], fill: { color: i % 2 ? C.tint : C.white } }, v.options); return v; }
    return cell(v, { fontSize: opt.fs || 11, fill: { color: i % 2 ? C.tint : C.white }, align: (opt.align && opt.align[j]) || 'left' });
  })));
  s.addTable(data, { x: opt.x, y: opt.y, w: opt.w, colW: opt.colW, border: { type: 'solid', pt: 0.5, color: C.line }, rowH: opt.rowH || 0.32, autoPage: false });
}
const ok = (t = '일치') => ({ text: '● ' + t, options: { color: C.green, bold: true, align: 'center' } });
const warn = (t) => ({ text: '▲ ' + t, options: { color: 'B7791F', bold: true, align: 'center' } });
const ng = (t) => ({ text: '■ ' + t, options: { color: C.red, bold: true, align: 'center' } });
const R_ = (t) => ({ text: t, options: { bold: true, color: '1B2A34', align: 'right' } });
const hl = (t, col) => ({ text: t, options: { bold: true, color: col || C.dark } });
function card(s, x, y, w, h, big, label, body, color, tint) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: tint }, line: { color: tint }, rectRadius: 0.08 });
  s.addText(big, { x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.75, fontFace: FONT, fontSize: 30, bold: true, color, margin: 0, isTextBox: true });
  s.addText(label, { x: x + 0.25, y: y + 0.95, w: w - 0.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: C.dark, margin: 0, isTextBox: true });
  s.addText(body, { x: x + 0.25, y: y + 1.4, w: w - 0.5, h: h - 1.55, fontFace: FONT, fontSize: 12, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
}
function note(s, t, y) { s.addText(t, { x: 0.6, y: y, w: 12.1, h: 0.45, fontFace: FONT, fontSize: 11, color: C.mute, margin: 0, valign: 'top', isTextBox: true }); }

// 1. Title
let s = pres.addSlide(); s.background = { color: C.dark };
s.addText('AGM 조립 1~4라인 가동율', { x: 0.8, y: 2.0, w: 11.5, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: C.white, margin: 0, isTextBox: true });
s.addText('산출방식 검증 보고', { x: 0.8, y: 2.9, w: 11.5, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: C.amber, margin: 0, isTextBox: true });
s.addText('기존 「26년 7월 총시간생산성」 엑셀 vs SMES 원본 기반 신규 산출 (EBGC조립 P51, 2026년 7월)', { x: 0.8, y: 4.1, w: 11.5, h: 0.5, fontFace: FONT, fontSize: 16, color: 'C9D3DA', margin: 0, isTextBox: true });
s.addText('비교 자료: ① 26년 7월 총시간생산성.xlsx (월마감 시점 스냅샷)   ② SMES 작업공수관리일자·부동공수상세 7월 (9/23 추출)', { x: 0.8, y: 6.3, w: 11.8, h: 0.4, fontFace: FONT, fontSize: 12, color: '9FB0BC', margin: 0, isTextBox: true });

// 2. 결론 요약
s = pres.addSlide(); header(s, '검증 결론 요약', '산식은 같고, 숫자 차이는 데이터 추출 시점 차이로 모두 설명됩니다', 2);
card(s, 0.6, 1.65, 3.9, 2.55, '산식 동일', '공수 흐름·부동률 정의', '투입시간·순투입시간·임금시간·부동률 산식이 우리 산출식과 1:1로 대응합니다.\n우리 공수가동율 = 1 − 기존 6대부동률', C.green, C.greenT);
card(s, 4.72, 1.65, 3.9, 2.55, '차이 100% 설명', '원인 = 추출 시점', '기존 파일은 7/31 미반영 + 7/23~30 설비부동 수정 전 데이터입니다. 이 차이를 반영하면 모든 항목의 차이가 0이 됩니다.', C.amber, C.amberT);
card(s, 8.84, 1.65, 3.9, 2.55, '라인 지표 신규', '기존 파일에 없음', '기존 파일은 공정(EB/GC 전체) 단위 공수 지표입니다. 라인별로는 설비부동 공수만 집계합니다. AGM 1~4라인 시간가동율은 신규 지표입니다.', '2F5D8A', C.blueT);
table(s, ['구분', '기존 (총시간생산성)', '신규 (우리 산출)', '판정'], [
  ['6대부동률 (공정, 7월)', '10.13%  (953.88 ÷ 9,412.82)', '9.27%  (883.72 ÷ 9,532.83)', ok('산식 일치')],
  ['공수가동율 (= 1 − 6대부동률)', '89.87%', '90.73%', ok('산식 일치')],
  ['차이 −0.86%p 원인', '7/31 누락, 설비부동 수정 전', '9/23 확정 데이터', warn('데이터 시점')],
  ['AGM 1~4라인 가동율', '없음 (설비부동 공수만 라인 구분)', '1라인 90.2% / 2라인 91.4% / 3라인 90.0% / 4라인 88.5%', warn('신규')],
], { x: 0.6, y: 4.45, w: 12.1, colW: [3.0, 3.6, 3.9, 1.6], fs: 12, rowH: 0.4 });

// 3. 두 자료 구조 비교
s = pres.addSlide(); header(s, '두 자료의 목적과 구조 비교', '기존 엑셀은 공장 전체 "총시간 생산성"을, 우리 산출은 AGM 라인 "가동율"을 목표로 합니다', 3);
table(s, ['항목', '기존: 26년 7월 총시간생산성.xlsx', '신규: SMES 기반 AGM 라인 가동율'], [
  [hl('핵심 지표'), '총시간 생산성 = 표준생산시간 ÷ 임금시간, 원단위 = 표준생산시간 ÷ 투입시간 (전년 대비 향상율)', '시간가동율 = (계획가동시간 − 6대부동시간) ÷ 계획가동시간, 공수가동율 = 순작업공수 ÷ 순투입공수'],
  [hl('분석 범위'), '창원공장 전 공정(13개) → 파트 → 팀', 'EBGC조립(P51) 중 AGM 조립 1~4라인 (GC·반자동 제외)'],
  [hl('집계 단위'), '공정 × 월 (당월·누계)', '라인 × 일 (월 합계 포함)'],
  [hl('시간 단위'), '공수(인·시) — 인원 × 시간', '라인 가동율: 시간(분) — 사건 지속시간 / 공정 지표: 공수'],
  [hl('원천 데이터'), 'POP 공수관리(월합) · 부동누계(1~7월) · 생산실적 · 25년 라우팅 · 파견 · 목표 시트', 'SMES 작업공수관리일자(일별) · 부동공수상세(7월)'],
  [hl('라인 구분'), '설비부동만 세부내역 앞 3글자(LEFT 3)로 구분, 공수 기준', '6대부동 전체를 정규식으로 구분, 복수라인·공통부동 배분, 수동작업 분리'],
  [hl('실동부동'), '임금시간에 포함 → 14개 항목 분류, 13·14항목 제외 공수 별도 관리', '분류만 하고 가동율 계산에서 제외 (동일 개념)'],
  [hl('목표 관리'), '25년 실적 · 26년 상/하반기 목표 대비 달성률, 손실비용(표준임률)', '미반영 (목표 데이터 없음)'],
], { x: 0.6, y: 1.6, w: 12.1, colW: [1.7, 5.2, 5.2], fs: 12, rowH: 0.58 });

// 4. 용어·산식 매핑
s = pres.addSlide(); header(s, '용어·산식 매핑 검증', '기존 파일 용어를 SMES 컬럼과 우리 산출식에 대응시킨 결과, 산식이 모두 1:1로 일치합니다', 4);
table(s, ['기존 파일 용어', '기존 산식 (시트)', 'SMES 컬럼 / 우리 용어', '우리 산식', '판정'], [
  ['투입시간', '순투입시간 + 부동시간 (총시간생산성당월 AU)', 'SMES 순투입공수 / 우리 순투입공수', '공정공수 − 실동부동', ok()],
  ['부동시간', 'Σ 6대부동 (POP당월 C = S:X)', '생산·설비·자재·라인언밸런스·부자재·관리부동', 'Σ 6대부동', ok()],
  ['순투입시간', '순투입공수 − 부동 (POP당월 B)', '우리 순작업공수', '순투입공수 − Σ 6대부동', ok('일치 *')],
  ['간접부서파견', 'POP당월 P (파견 중 간접부서)', 'SMES 파견공수 (직접/간접 구분 없음)', '— (미사용)', warn('구분 필요')],
  ['실동부동', 'POP당월 Y', 'SMES 실동부동', '분류만, 부동 아님', ok()],
  ['임금시간', '투입 + 간접파견 + 실동부동', '공정공수 + 간접파견 과 동일', '— (공정공수 사용)', warn('파견만큼 차이')],
  ['부동률 (설비부동 등)', '부동공수 ÷ 투입시간 (설비부동 AD)', '우리 설비부동률', '설비부동 ÷ 순투입공수', ok()],
  ['6대부동률', 'Σ6대부동 ÷ 투입시간 (6대부동계)', '1 − 공수가동율', '1 − 순작업 ÷ 순투입', ok()],
  ['원단위 / 총시간 원단위', '표준생산시간 ÷ 투입 / ÷ 임금', '—', '미산출 (생산실적·라우팅 없음)', ng('데이터 없음')],
], { x: 0.6, y: 1.5, w: 12.1, colW: [2.0, 3.2, 3.2, 2.2, 1.5], fs: 10.5, rowH: 0.44 });
note(s, '* 기존 파일의 "순투입시간"은 우리의 "순작업공수", 기존 "투입시간"은 SMES의 "순투입공수"와 같습니다. 이름만 다르고 내용은 같으니 보고 시 명칭 혼동에 주의해야 합니다.', 6.5);

// 5. 수치 대사
s = pres.addSlide(); header(s, 'EBGC조립 직접공수 7월 수치 대사', '기존 POP당월 값 vs SMES 9/23 추출값 — 차이는 모두 7/31 반영 여부와 사후 수정에서 발생', 5);
table(s, ['항목 (공수)', '기존 (POP당월)', '신규 7/1~30', '신규 7/31', '신규 합계', '차이 (신규−기존)', '차이 원인'], [
  ['보유공수', '6,552.0', '6,552.0', '376.0', '6,928.0', '+376.0', '7/31 미반영'],
  ['사고공수', '388.0', '388.0', '76.0', '464.0', '+76.0', '7/31 미반영'],
  ['연장근무', '4,828.0', '4,828.0', '2.0', '4,830.0', '+2.0', '7/31 미반영'],
  ['출근공수', '10,992.0', '10,992.0', '302.0', '11,294.0', '+302.0', '7/31 미반영'],
  ['파견공수', '44.5', '56.5', '0.0', '56.5', '+12.0', '파견 사후 수정'],
  ['공정공수', '11,061.5', '11,049.5', '302.0', '11,351.5', '+290.0', '7/31 + 파견 수정'],
  ['6대부동 합계', '953.88', '819.27', '64.45', '883.72', '−70.16', '설비·언밸런스 수정 + 7/31'],
  ['실동부동', '1,648.68', '1,648.68', '169.99', '1,818.67', '+169.99', '7/31 미반영'],
  [hl('투입시간 (=SMES 순투입공수)'), '9,412.82', '9,400.82', '132.01', '9,532.83', '+120.01', '7/31 + 파견 수정'],
  [hl('순투입시간 (=순작업공수)'), '8,458.94', '8,581.55', '67.56', '8,649.11', '+190.17', '위 항목 합산'],
  [hl('임금시간'), '11,106.0', '11,106.0', '302.0', '11,408.0', '+302.0', '7/31 미반영'],
], { x: 0.6, y: 1.55, w: 12.1, colW: [2.6, 1.5, 1.45, 1.3, 1.45, 1.6, 2.2], fs: 11, rowH: 0.36, align: [0, 'right', 'right', 'right', 'right', 'right', 'left'] });
note(s, '※ 임금시간(신규) = 순투입공수 9,532.83 + 파견 56.5 + 실동부동 1,818.67. SMES 파견공수 전체를 간접부서파견으로 가정했습니다(기존 7월 P51 직접 파견은 모두 간접부서).', 6.5);

// 6. 6대부동 차이 분해
s = pres.addSlide(); header(s, '6대부동 차이 분해 (953.88 → 883.72)', '방식 차이는 없고, 부동공수상세의 수정·추가 입력만 반영된 결과입니다', 6);
s.addChart(pres.charts.BAR, [
  { name: '기존 (월마감 시점)', labels: ['생산', '설비', '자재', '관리', '라인언밸런스', '부자재교체'], values: [103.0, 335.67, 14.0, 249.0, 126.68, 125.53] },
  { name: '신규 (9/23 추출)', labels: ['생산', '설비', '자재', '관리', '라인언밸런스', '부자재교체'], values: [167.0, 209.56, 14.0, 249.0, 118.18, 125.98] },
], { x: 0.6, y: 1.5, w: 6.4, h: 4.2, barDir: 'col', barGrouping: 'clustered', chartColors: ['9AA7B0', C.dark], showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 11,
  showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 9, dataLabelFormatCode: '#,##0.0', catAxisLabelFontFace: FONT, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, valAxisLabelColor: C.mute, catAxisLabelColor: C.ink,
  valGridLine: { color: 'E5E9EC', size: 0.5 }, catGridLine: { style: 'none' }, showTitle: true, title: '6대부동 유형별 공수 (EBGC 직접, 7월)', titleFontFace: FONT, titleFontSize: 13, titleColor: C.dark });
table(s, ['요인', '공수', '내용'], [
  ['기존 6대부동', '953.88', '월마감 시점 SMES 값 (부동누계 7월 P51)'],
  ['① 7/31 입력 추가', { text: '+64.45', options: { color: C.red, bold: true, align: 'right' } }, '생산부동 64.0 (야간계약직 수동적재 등 2건) + 격리판 0.45'],
  ['② 설비부동 사후 수정', { text: '−126.11', options: { color: C.green, bold: true, align: 'right' } }, '7/23~30 설비부동 시간 하향 수정 (예: 150분 → 1분)'],
  ['③ 라인언밸런스 수정', { text: '−8.50', options: { color: C.green, bold: true, align: 'right' } }, '7/26·27 수동적재 인원 수정'],
  [hl('신규 6대부동'), { text: '883.72', options: { bold: true, align: 'right' } }, '953.88 + 64.45 − 126.11 − 8.50 = 883.72 ✔'],
], { x: 7.3, y: 1.7, w: 5.4, colW: [1.65, 0.9, 2.85], fs: 11, rowH: 0.62, align: [0, 'right', 0] });
note(s, '▶ 건별 대사 결과: 신규 577건 중 544건이 일자·세부내역·시간 기준으로 일치합니다(이 중 2건은 인원만 수정). 나머지 33건은 7/31 입력분 10건과 설비부동 시간 수정 23건입니다.', 6.0);

// 7. KPI 재계산
s = pres.addSlide(); header(s, '같은 산식을 두 데이터에 적용한 KPI 비교', '산식이 같으므로 데이터만 바꾸면 기존 파일 지표를 그대로 재현할 수 있습니다', 7);
table(s, ['KPI (EBGC조립 직접, 7월)', '산식', '기존 데이터', '신규 데이터', '차이'], [
  ['6대부동률', 'Σ6대부동 ÷ 투입시간', '10.13%', '9.27%', '−0.86%p'],
  ['공수가동율 (우리 지표)', '순투입시간 ÷ 투입시간 = 1 − 6대부동률', '89.87%', '90.73%', '+0.86%p'],
  ['설비부동률', '설비부동 ÷ 투입시간', '3.57%', '2.20%', '−1.37%p'],
  ['실동률', '투입시간 ÷ 공정공수', '85.10%', '83.98%', '−1.12%p'],
  ['원단위', '표준생산시간 9,493.03 ÷ 투입시간', '1.0085', '0.9958 *', '−0.0127'],
  ['총시간 원단위', '표준생산시간 ÷ 임금시간', '0.8548', '0.8321 *', '−0.0227'],
], { x: 0.6, y: 1.55, w: 12.1, colW: [3.0, 4.3, 1.6, 1.6, 1.6], fs: 12, rowH: 0.42, align: [0, 0, 'right', 'right', 'right'] });
card(s, 0.6, 4.85, 5.9, 2.0, '*', '표준생산시간은 기존 값 사용', '신규 원단위는 기존 파일의 표준생산시간(생산실적 × 25년 라우팅)을 그대로 쓴 참고값입니다. 생산실적도 7/31분이 빠졌을 수 있습니다.', 'B7791F', C.amberT);
card(s, 6.8, 4.85, 5.9, 2.0, '→', '보고 기준 데이터 시점 확정 필요', '월마감 스냅샷(기존)과 사후 확정본(신규) 중 보고 기준을 정해야 합니다. 설비부동 수정이 크면 월 부동률이 1%p 이상 달라집니다.', '2F5D8A', C.blueT);

// 8. 라인 구분 방식 비교
s = pres.addSlide(); header(s, '라인 구분 방식 비교 — 설비부동 공수 (7월)', '기존은 설비부동만, 세부내역 앞 3글자로 라인을 나눕니다 → 일부 누락과 배분 미처리가 있습니다', 8);
table(s, ['라인', '기존 (LEFT 3, 월마감)', '신규 데이터 (같은 방식)', '차이'], [
  ['1라인', '87.05', '42.65', '−44.40'],
  ['2라인', '53.97', '41.84', '−12.13'],
  ['3라인', '69.69', '45.64', '−24.05'],
  ['4라인', '79.15', '56.56', '−22.59'],
  ['GC', '34.31', '12.35', '−21.96'],
  ['반자동', '8.50', '7.50', '−1.00'],
  [{ text: '" GC" (앞 공백)', options: { color: C.red } }, { text: '3.00 → 집계 누락', options: { color: C.red, align: 'right' } }, '3.00', '—'],
  [{ text: '"1,2" (1,2,3라인)', options: { color: C.red } }, '—', { text: '0.02 → 라인 미배분', options: { color: C.red, align: 'right' } }, '—'],
], { x: 0.6, y: 1.6, w: 6.2, colW: [1.7, 1.7, 1.8, 1.0], fs: 11, rowH: 0.42, align: [0, 'right', 'right', 'right'] });
table(s, ['비교 항목', '기존 방식', '신규 방식'], [
  ['대상 부동', '설비부동만', '6대부동 전체'],
  ['라인 추출', 'LEFT(세부내역,3)', '정규식 "N라인", "N,M라인"'],
  ['집계 단위', '공수 (인원×시간)', '시간(분) = 라인 정지시간'],
  ['복수 라인', '"1,2" 버킷, 미배분', '해당 라인 각각 전액 반영'],
  ['라인 미표기', '집계 제외', 'AGM 공통 → 1~4라인 ¼ 배분'],
  ['수동작업', '구분 없음', '분리 후 가동율에서 제외'],
  ['표기 오류', '"인3라인", " GC" 누락', '정규식으로 공백 허용 (오타는 확인 필요)'],
], { x: 7.1, y: 1.6, w: 5.6, colW: [1.4, 2.0, 2.2], fs: 11, rowH: 0.47 });
note(s, '※ 기존 1라인 87.05 → 신규 42.65처럼 차이가 큰 원인은 7/24~30 설비부동 시간 수정입니다. 라인 단위로 보면 데이터 시점 영향이 공정 단위보다 더 큽니다.', 6.1);

// 9. 신규 라인 가동율
s = pres.addSlide(); header(s, '신규 지표: AGM 조립 1~4라인 시간가동율 (7월)', '6대부동만 반영 · 실동부동/수동작업 제외 · 계획가동 1,320분/일 (11h × 2교대, 주말 동일)', 9);
s.addChart(pres.charts.BAR, [{ name: '월 시간가동율', labels: ['AGM 1라인', 'AGM 2라인', 'AGM 3라인', 'AGM 4라인', '4개 라인 종합'], values: [0.9016, 0.9143, 0.8999, 0.8854, 0.9003] }],
  { x: 0.6, y: 1.6, w: 6.6, h: 5.0, barDir: 'col', chartColors: [C.dark], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0%', dataLabelFontSize: 12, dataLabelFontBold: true,
    valAxisMinVal: 0, valAxisMaxVal: 1, valAxisLabelFormatCode: '0%', valAxisLabelFontSize: 10, valAxisLabelColor: C.mute, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 11, showLegend: false,
    valGridLine: { color: 'E5E9EC', size: 0.5 }, catGridLine: { style: 'none' }, barGapWidthPct: 70 });
table(s, ['구분 (분)', '1라인', '2라인', '3라인', '4라인'], [
  ['6대부동 합계', '4,026', '3,509', '4,098', '4,688'],
  ['  └ 부자재교체', '1,890', '1,890', '1,890', '1,890'],
  ['  └ 설비부동', '1,006', '1,109', '1,133', '1,708'],
  ['수동작업 (제외)', '1,878', '2,398', '2,898', '1,478'],
  ['계획가동 (31일)', '40,920', '40,920', '40,920', '40,920'],
], { x: 7.5, y: 1.7, w: 5.2, colW: [1.6, 0.9, 0.9, 0.9, 0.9], fs: 11, rowH: 0.42, align: [0, 'right', 'right', 'right', 'right'] });
table(s, ['계획시간 가정 근거', '내용'], [
  ['기존 파일 「미반영공수」', '"3조 근무 · 11h 근무공수" 기준 사용 → 우리 가정 11h/교대와 일치'],
  ['검증 한계', '라인 가동율은 기존 파일에 대응 지표가 없어 수치 대사 불가 (신규 지표)'],
], { x: 7.5, y: 4.45, w: 5.2, colW: [1.7, 3.5], fs: 10.5, rowH: 0.55 });

// 10. 추가 원본 데이터 (기존 수준)
s = pres.addSlide(); header(s, '기존 엑셀 수준까지 끌어올리기 위한 추가 원본 데이터', '공수관리·부동상세 2종 외에 아래 데이터가 있어야 원단위·총시간 생산성·목표 달성률까지 재현할 수 있습니다', 10);
table(s, ['우선', '추가 원본 데이터', '기존 파일 시트', '추출 원천 (예상)', '가능해지는 산출'], [
  [ng('필수'), '생산실적 (W/C·제품별 실적·불량수량)', '제품생산성당월 / 누계', 'MES 생산실적 조회', '표준생산시간, AGM 라인별 생산량'],
  [ng('필수'), '25년 라우팅 (W/C·제품별 표준시간)', '25년라우팅', '기준정보 (ST)', '원단위, 총시간 생산성'],
  [ng('필수'), '파견공수 상세 (직접/간접부서 구분)', '간접파견List · 파견', 'SMES 파견 상세', '임금시간, 간접파견률'],
  [warn('권장'), '1~6월 공수관리·부동상세 (월별)', 'POP누계 · 부동누계', 'SMES 월별 추출', '누계 실적, 월별 추이'],
  [warn('권장'), '실동부동 14항목 분류표', '목표▶ · 실동부동List', '생산기획 기준표', '제외공수(13 다기능·14 기타) 조정 생산성'],
  [warn('권장'), '25년 실적 · 26년 목표 (6대부동·실동·파견)', '6대부동목표 · 실동부동목표 · 간접파견목표', '생산기획 목표 시트', '목표 대비 달성률, 향상율'],
  [{ text: '○ 선택', options: { color: C.mute, bold: true, align: 'center' } }, '목표 미반영 공수 (채용·CAPA 증대)', '미반영공수', '인사·생산기획', '조정 후 생산성'],
  [{ text: '○ 선택', options: { color: C.mute, bold: true, align: 'center' } }, '표준 임률', '설비부동 AK열', '원가', '부동 손실비용 (백만원)'],
], { x: 0.6, y: 1.6, w: 12.1, colW: [1.0, 3.4, 2.9, 2.2, 2.6], fs: 11, rowH: 0.52 });
note(s, '※ 생산실적·라우팅은 기존 파일에 7월분이 이미 들어 있습니다. AGM COS 1~4라인 W/C(P5114A01~A04)별 실적이 분리돼 있어 라인 분석에 바로 쓸 수 있습니다.', 6.35);

// 11. 라인 단위 확장 데이터
s = pres.addSlide(); header(s, 'AGM 라인 단위 분석을 위한 추가 데이터 (기존 파일에도 없음)', '라인별 OEE(시간가동율 × 성능가동율 × 양품률)까지 가려면 필요한 데이터', 11);
table(s, ['W/C (기존 파일 7월)', '실적수량', '표준생산시간', '실가동시간', '불량수량'], [
  ['AGM COS 1라인 (P5114A01)', '73,021', '1,827.2', '1,320.1', '0'],
  ['AGM COS 2라인 (P5114A02)', '80,876', '1,932.0', '2,686.3', '0'],
  ['AGM COS 3라인 (P5114A03)', '84,045', '2,477.1', '660.6', '0'],
  ['AGM COS 4라인 (P5114A04)', '75,235', '1,884.1', '1,994.8', '0'],
  [hl('AGM 합계 (EBGC 표준생산시간의 85.5%)'), R_('313,177'), R_('8,120.5'), R_('6,661.7'), R_('0')],
], { x: 0.6, y: 1.6, w: 6.3, colW: [2.5, 0.95, 1.05, 1.0, 0.8], fs: 10.5, rowH: 0.42, align: [0, 'right', 'right', 'right', 'right'] });
s.addText('※ 실가동시간은 라인별 편차가 크고(3라인 661 vs 2라인 2,686), 1라인은 월 최대 682h(22h×31일)를 넘어 정의 확인이 필요합니다. 불량수량은 전부 0이라 양품률 산출이 불가합니다.', { x: 0.6, y: 4.5, w: 6.3, h: 0.9, fontFace: FONT, fontSize: 11, color: C.mute, margin: 0, valign: 'top', isTextBox: true });
table(s, ['필요 데이터', '용도', '확인처'], [
  ['라인별 투입 인원·공수 (W/C별 작업공수)', '라인별 원단위·공수가동율', 'SMES 작업자 배치'],
  ['라인·제품별 설비 C/T (사이클타임)', '성능가동율 = 실적 × C/T ÷ 가동시간', '생산기술 / 라우팅'],
  ['라인 가동계획 캘린더 (계획정지·휴무)', '계획가동시간 일자별 보정', '생산계획'],
  ['라인별 불량·재작업 수량', '양품률', '품질 / MES 불량'],
  ['부동 입력 시 "라인" 코드 필수화', '텍스트 추출 오류 제거', 'SMES 입력 양식 개선'],
  ['POP 실가동시간 정의서', '실측 가동시간으로 검증', 'MES 관리자'],
], { x: 7.2, y: 1.6, w: 5.5, colW: [2.2, 1.9, 1.4], fs: 10.5, rowH: 0.62 });

// 12. 다음 단계
s = pres.addSlide(); s.background = { color: C.dark };
s.addText('결론 및 다음 단계', { x: 0.8, y: 0.6, w: 11.5, h: 0.8, fontFace: FONT, fontSize: 32, bold: true, color: C.white, margin: 0, isTextBox: true });
const steps = [
  ['1', '산식 동일성 확인 완료', '공수 흐름과 부동률 산식이 기존 파일과 같습니다. 7월 수치 차이는 추출 시점(7/31, 사후 수정)으로 전부 설명됩니다.'],
  ['2', '보고 기준 데이터 시점 확정', '월마감 스냅샷과 사후 확정본 중 하나로 정하고, 추출일을 파일에 기록합니다.'],
  ['3', '필수 데이터 3종 추가', '생산실적, 25년 라우팅, 파견 상세를 추가하면 원단위와 총시간 생산성을 같은 방식으로 재현할 수 있습니다.'],
  ['4', 'AGM 라인 지표 고도화', '라인별 투입공수, 설비 C/T, 불량수량을 확보하면 라인별 원단위와 OEE로 확장할 수 있습니다.'],
];
steps.forEach((t, i) => {
  const y = 1.75 + i * 1.3;
  s.addShape(pres.shapes.OVAL, { x: 0.8, y: y, w: 0.7, h: 0.7, fill: { color: C.amber }, line: { color: C.amber } });
  s.addText(t[0], { x: 0.8, y: y, w: 0.7, h: 0.7, fontFace: FONT, fontSize: 20, bold: true, color: C.dark, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  s.addText(t[1], { x: 1.8, y: y - 0.05, w: 10.6, h: 0.45, fontFace: FONT, fontSize: 18, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText(t[2], { x: 1.8, y: y + 0.4, w: 10.6, h: 0.5, fontFace: FONT, fontSize: 13, color: 'C9D3DA', margin: 0, isTextBox: true });
});

pres.writeFile({ fileName: require('path').join(__dirname, '..', '..', 'output', 'AGM라인_가동율_산출방식_검증.pptx') }).then(f => console.log('written', f));

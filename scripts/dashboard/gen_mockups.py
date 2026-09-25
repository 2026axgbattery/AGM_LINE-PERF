"""대시보드 UI 참고 이미지 5종 HTML 생성 (먼저 scripts/export_data.py 실행)"""
import json, math, random
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'src'))
from agm import config as CFG
MOCK = CFG.OUT_DIR / 'mockups'; MOCK.mkdir(parents=True, exist_ok=True)
D = json.load(open(CFG.OUT_DIR / 'dashboard_data.json', encoding='utf-8'))
LN = ['AGM조립1라인', 'AGM조립2라인', 'AGM조립3라인', 'AGM조립4라인']
SHORT = ['1라인', '2라인', '3라인', '4라인']
CATS = ['부자재교체', '설비부동', '관리부동', '생산부동', '자재부동', '라인언밸런스']
CATL = {'부자재교체': '부자재교체', '설비부동': '설비', '관리부동': '관리(형명·금형)', '생산부동': '생산', '자재부동': '자재', '라인언밸런스': '라인언밸런스'}
PLAN = 1320
DAYS = list(range(1, 32))
DOW = ['수', '목', '금', '토', '일', '월', '화']  # 7/1 = 수
def dow(d): return DOW[(d - 1) % 7]
L_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100']
L_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500']
C_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']
C_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300']
GOOD, WARN, CRIT = '#0ca30c', '#fab219', '#d03b3b'
TARGET = 0.90

def status(r):
    if r >= TARGET: return (GOOD, '●', '정상')
    if r >= 0.85: return (WARN, '▲', '주의')
    return (CRIT, '■', '경고')

def month_rate(l):
    loss = sum(sum(D['lines'][l][c]) for c in CATS)
    return 1 - loss / (PLAN * 31), loss

FONT = '"Noto Sans CJK KR","Malgun Gothic",system-ui,sans-serif'
def page(body, dark, w=1600, h=1000):
    bg, card, ink, ink2, mute, grid = (('#0d0d0d', '#1a1a19', '#ffffff', '#c3c2b7', '#898781', '#2c2c2a') if dark else ('#f4f5f3', '#fcfcfb', '#0b0b0b', '#52514e', '#898781', '#e1e0d9'))
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:{w}px;min-height:200px;background:{bg};color:{ink};font-family:{FONT};padding:28px 34px 56px;overflow:hidden}}
.card{{background:{card};border-radius:12px;padding:18px 20px;border:1px solid {'rgba(255,255,255,.08)' if dark else 'rgba(11,11,11,.08)'}}}
.t1{{font-size:26px;font-weight:700}} .t2{{font-size:15px;color:{ink2}}} .mute{{color:{mute}}} .ink2{{color:{ink2}}}
.h{{font-size:16px;font-weight:700;margin-bottom:10px}}
.num{{font-variant-numeric:tabular-nums}}
.tag{{display:inline-block;font-size:12px;padding:3px 10px;border-radius:99px;border:1px solid {grid};color:{ink2};margin-left:8px}}
.badge{{display:inline-flex;gap:6px;align-items:center;font-size:13px;font-weight:700;padding:3px 10px;border-radius:99px}}
.ex{{position:absolute;right:34px;bottom:14px;font-size:12px;color:{mute}}}
</style></head><body style="position:relative">{body}
<div class="ex">대시보드 UI 참고용 예시 이미지 · 데이터: SMES 2026년 7월 AGM 조립 1~4라인 (계획 1,320분/일, 6대부동 기준)</div></body></html>'''

def header(title, sub, dark, extra=''):
    return f'''<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px">
<div><div class="t1">{title}</div><div class="t2" style="margin-top:4px">{sub}</div></div>
<div class="t2">{extra}<span class="tag">2026년 7월</span><span class="tag">AGM 조립 1~4라인</span><span class="tag">목표 90% (예시)</span></div></div>'''

# ---------------- 1. Andon 현황판 ----------------
def ring(r, color, size=150, dark=True):
    rr = size / 2 - 12; c = 2 * math.pi * rr; cx = size / 2
    track = '#2c2c2a' if dark else '#e1e0d9'
    t = TARGET * 2 * math.pi - math.pi / 2
    tx1, ty1 = cx + (rr - 12) * math.cos(t), cx + (rr - 12) * math.sin(t)
    tx2, ty2 = cx + (rr + 12) * math.cos(t), cx + (rr + 12) * math.sin(t)
    return f'''<svg width="{size}" height="{size}"><circle cx="{cx}" cy="{cx}" r="{rr}" fill="none" stroke="{track}" stroke-width="14"/>
<circle cx="{cx}" cy="{cx}" r="{rr}" fill="none" stroke="{color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="{c*r:.1f} {c:.1f}" transform="rotate(-90 {cx} {cx})"/>
<line x1="{tx1:.1f}" y1="{ty1:.1f}" x2="{tx2:.1f}" y2="{ty2:.1f}" stroke="#ffffff" stroke-width="2.5"/>
<text x="{cx}" y="{cx+4}" text-anchor="middle" font-size="34" font-weight="700" fill="#fff">{r*100:.1f}%</text>
<text x="{cx}" y="{cx+26}" text-anchor="middle" font-size="12" fill="#898781">목표 90% ▏</text></svg>'''

def spark(vals, color, w=300, h=56, lo=0.6):
    bw = w / len(vals); out = []
    for i, v in enumerate(vals):
        hh = max(2, (v - lo) / (1 - lo) * h); col = '#5f6b73' if v >= TARGET else (WARN if v >= .85 else CRIT)
        out.append(f'<rect x="{i*bw+1:.1f}" y="{h-hh:.1f}" width="{bw-2:.1f}" height="{hh:.1f}" rx="2" fill="{col}"/>')
    ty = h - (TARGET - lo) / (1 - lo) * h
    out.append(f'<line x1="0" x2="{w}" y1="{ty:.1f}" y2="{ty:.1f}" stroke="#c3c2b7" stroke-dasharray="4 3" stroke-width="1"/>')
    return f'<svg width="{w}" height="{h}">{"".join(out)}</svg>'

def p1():
    tot_loss = sum(month_rate(l)[1] for l in LN); tot = 1 - tot_loss / (PLAN * 31 * 4)
    kpis = [('4개 라인 종합 가동율', f'{tot*100:.1f}%', '목표 90% 대비 +0.0%p', GOOD), ('6대부동 합계', f'{tot_loss:,.0f}분', '계획 163,680분 중 10.0%', '#c3c2b7'),
            ('최저 라인', '4라인 88.5%', '설비부동 1,708분 (최다)', WARN), ('목표 미달 일수', f"{sum(1 for l in LN for v in D['lines'][l]['rate'] if v < TARGET)}건 / 124", '라인×일 기준', CRIT)]
    kh = ''.join(f'<div class="card" style="flex:1"><div class="t2">{a}</div><div style="font-size:34px;font-weight:700;margin:6px 0 2px">{b}</div><div style="font-size:13px;color:{col}">{c}</div></div>' for a, b, c, col in kpis)
    cards = ''
    for i, l in enumerate(LN):
        r, loss = month_rate(l); col, ic, lab = status(r)
        tops = sorted(((sum(D['lines'][l][c]), c) for c in CATS), reverse=True)[:3]
        mx = tops[0][0]
        bars = ''.join(f'<div style="display:flex;align-items:center;gap:8px;margin:5px 0;font-size:13px"><span style="width:92px" class="ink2">{CATL[c]}</span><div style="flex:1;height:10px;background:#2c2c2a;border-radius:3px"><div style="width:{v/mx*100:.0f}%;height:10px;background:#898781;border-radius:3px"></div></div><span class="num" style="width:62px;text-align:right">{v:,.0f}분</span></div>' for v, c in tops)
        last = D['lines'][l]['rate'][-1]
        cards += f'''<div class="card" style="flex:1;padding:18px 18px">
<div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:10px"><span style="width:12px;height:12px;border-radius:3px;background:{L_DARK[i]}"></span><span style="font-size:20px;font-weight:700">AGM 조립 {SHORT[i]}</span></div>
<span class="badge" style="background:{col}22;color:{col}">{ic} {lab}</span></div>
<div style="display:flex;align-items:center;gap:14px;margin:10px 0 6px">{ring(r, L_DARK[i])}
<div style="font-size:13px;line-height:1.9"><div class="ink2">월 부동 <b class="num" style="color:#fff">{loss:,.0f}분</b></div><div class="ink2">월 가동 <b class="num" style="color:#fff">{PLAN*31-loss:,.0f}분</b></div><div class="ink2">7/31 <b class="num" style="color:#fff">{last*100:.1f}%</b></div></div></div>
<div class="t2" style="font-size:12px;margin-top:4px">일자별 가동율 (점선 = 목표 90%, 색 = 미달일)</div>{spark(D['lines'][l]['rate'], L_DARK[i])}
<div class="t2" style="font-size:12px;margin-top:10px">부동 TOP 3</div>{bars}</div>'''
    body = header('① 라인 현황판형 (Andon / 상황실 모니터)', '라인별 링 게이지 + 상태 신호등 + 미니 추이 — 현장 대형 모니터·상황실에서 가장 많이 쓰는 형태', True)
    body += f'<div style="display:flex;gap:16px;margin-bottom:16px">{kh}</div><div style="display:flex;gap:16px">{cards}</div>'
    body += '<div style="margin-top:14px;font-size:13px" class="ink2">상태 기준: <span style="color:#0ca30c">● 정상 ≥ 90%</span> · <span style="color:#fab219">▲ 주의 85~90%</span> · <span style="color:#d03b3b">■ 경고 &lt; 85%</span>  |  활용: 교대 시작 미팅, 상황실 상시 표시</div>'
    return page(body, True)

# ---------------- 2. 설비 상태 타임라인 ----------------
def p2():
    day = 27; W = 1180; x0 = 150
    random.seed(7)
    shifts = [(8 * 60, 19 * 60), (20 * 60, 31 * 60)]  # 08-19, 20-07(+1)
    def X(m): return x0 + (m - 8 * 60) / (24 * 60) * W
    rows = ''; y = 70
    for i, l in enumerate(LN):
        segs = [(CATS.index(c), D['lines'][l][c][day - 1]) for c in CATS if D['lines'][l][c][day - 1] > 0.5]
        # place events: split each loss into chunks, random positions in shifts without overlap
        occupied = []
        blocks = []
        for ci, mins in segs:
            chunks = [mins] if mins < 90 else [mins * 0.6, mins * 0.4]
            for ch in chunks:
                for _ in range(200):
                    sh = random.choice(shifts); st = random.uniform(sh[0] + 10, sh[1] - ch - 10)
                    if all(st + ch < a or st > b for a, b in occupied):
                        occupied.append((st - 5, st + ch + 5)); blocks.append((st, ch, ci)); break
        rows += f'<text x="{x0-16}" y="{y+24}" text-anchor="end" font-size="15" font-weight="700" fill="#fff">{SHORT[i]}</text>'
        rate = D['lines'][l]['rate'][day - 1]; col, ic, lab = status(rate)
        rows += f'<text x="{x0+W+16}" y="{y+18}" font-size="17" font-weight="700" fill="#fff" class="num">{rate*100:.1f}%</text><text x="{x0+W+16}" y="{y+36}" font-size="12" fill="{col}">{ic} {lab}</text>'
        rows += f'<rect x="{X(0*60+8*60)}" y="{y}" width="{W}" height="38" rx="4" fill="url(#hatch)"/>'
        for a, b in shifts:
            rows += f'<rect x="{X(a):.1f}" y="{y}" width="{X(b)-X(a):.1f}" height="38" rx="4" fill="#4b5a64"/>'
        for st, ch, ci in blocks:
            rows += f'<rect x="{X(st):.1f}" y="{y}" width="{max(2,X(st+ch)-X(st)):.1f}" height="38" fill="{C_DARK[ci]}" stroke="#1a1a19" stroke-width="1.5"/>'
        y += 62
    ticks = ''
    for hh in range(8, 33, 2):
        xx = X(hh * 60); ticks += f'<line x1="{xx:.1f}" x2="{xx:.1f}" y1="56" y2="{y-12}" stroke="#2c2c2a"/><text x="{xx:.1f}" y="44" text-anchor="middle" font-size="12" fill="#898781">{hh%24:02d}:00</text>'
    ticks += f'<text x="{X(13*60+30):.1f}" y="22" text-anchor="middle" font-size="13" fill="#c3c2b7">주간 08:00~19:00 (11h)</text><text x="{X(25*60+30):.1f}" y="22" text-anchor="middle" font-size="13" fill="#c3c2b7">야간 20:00~07:00 (11h)</text>'
    svg = f'<svg width="1480" height="{y+10}"><defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#262624"/><line x1="0" y1="0" x2="0" y2="8" stroke="#44443f" stroke-width="3"/></pattern></defs>{ticks}{rows}</svg>'
    leg = '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px"><i style="width:14px;height:14px;background:#4b5a64;border-radius:3px;display:inline-block"></i>가동 (정상 운전)</span>'
    leg += ''.join(f'<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px"><i style="width:14px;height:14px;background:{C_DARK[k]};border-radius:3px;display:inline-block"></i>{CATL[c]}</span>' for k, c in enumerate(CATS))
    leg += '<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:14px;height:14px;background:repeating-linear-gradient(45deg,#262624 0 3px,#44443f 3px 6px);border-radius:3px;display:inline-block"></i>비근무(교대 교체)</span>'
    # table
    th = ''.join(f'<th style="padding:8px 10px;text-align:right">{CATL[c]}</th>' for c in CATS)
    tr = ''
    for i, l in enumerate(LN):
        v = [D['lines'][l][c][day - 1] for c in CATS]
        tr += f'<tr style="border-top:1px solid #2c2c2a"><td style="padding:8px 10px;font-weight:700">{SHORT[i]}</td>' + ''.join(f'<td class="num" style="padding:8px 10px;text-align:right">{x:,.0f}</td>' for x in v) + f'<td class="num" style="padding:8px 10px;text-align:right;font-weight:700">{sum(v):,.0f}</td></tr>'
    tbl = f'<table style="width:100%;border-collapse:collapse;font-size:14px"><tr class="mute" style="font-size:13px"><th style="padding:8px 10px;text-align:left">라인 (분)</th>{th}<th style="padding:8px 10px;text-align:right">합계</th></tr>{tr}</table>'
    body = header('② 설비 상태 타임라인형 (Machine State Gantt)', '하루 24시간을 가로축으로 가동/부동 구간을 색으로 표시 — MES·POP 모니터링 화면의 표준 형태', True, '<span class="tag">조회일 7/27(월)</span>')
    body += f'<div class="card" style="margin-bottom:16px"><div class="h">7/27(월) 라인별 가동 상태</div>{svg}<div class="ink2" style="font-size:13px;margin-top:6px">{leg}</div></div>'
    body += f'<div style="display:flex;gap:16px"><div class="card" style="flex:1.6"><div class="h">7/27 부동 유형별 시간</div>{tbl}</div>'
    body += '<div class="card" style="flex:1;border:1px dashed #fab219"><div class="h" style="color:#fab219">▲ 구현 전제 조건</div><div class="ink2" style="font-size:14px;line-height:1.8">현재 SMES 부동 데이터에는 <b style="color:#fff">발생 시각</b>이 없습니다. 이 그림의 부동 위치는 7/27 실제 부동시간(분)을 <b style="color:#fff">임의 시각에 배치한 예시</b>입니다.<br>실제로 구현하려면 부동 입력에 <b style="color:#fff">시작·종료 시각</b>이 필요하고, POP 설비 신호를 쓰는 방법도 있습니다.</div></div></div>'
    return page(body, True)

# ---------------- 3. 히트맵 ----------------
SEQ = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b']
def seq(v, lo, hi):
    t = min(1, max(0, (v - lo) / (hi - lo))); return SEQ[round(t * (len(SEQ) - 1))]
def p3():
    cw, ch = 42, 44; x0 = 90
    s = ''
    for j, d in enumerate(DAYS):
        wk = dow(d) in ('토', '일')
        s += f'<text x="{x0+j*cw+cw/2}" y="18" text-anchor="middle" font-size="12" fill="{"#d03b3b" if wk else "#52514e"}">{d}</text><text x="{x0+j*cw+cw/2}" y="34" text-anchor="middle" font-size="11" fill="#898781">{dow(d)}</text>'
    for i, l in enumerate(LN):
        y = 44 + i * ch
        s += f'<text x="{x0-12}" y="{y+ch/2+5}" text-anchor="end" font-size="14" font-weight="700" fill="#0b0b0b">{SHORT[i]}</text>'
        for j, v in enumerate(D['lines'][l]['rate']):
            f = seq(1 - v, 0.0, 0.25); txt = '#ffffff' if (1 - v) > 0.11 else '#0b0b0b'
            s += f'<rect x="{x0+j*cw+1}" y="{y+1}" width="{cw-2}" height="{ch-2}" rx="4" fill="{f}"/><text x="{x0+j*cw+cw/2}" y="{y+ch/2+4}" text-anchor="middle" font-size="11" fill="{txt}" class="num">{v*100:.0f}</text>'
        r, _ = month_rate(l); col, ic, lab = status(r)
        s += f'<text x="{x0+31*cw+16}" y="{y+ch/2-1}" font-size="15" font-weight="700" fill="#0b0b0b">{r*100:.1f}%</text><text x="{x0+31*cw+16}" y="{y+ch/2+15}" font-size="11" fill="{col}">{ic} {lab}</text>'
    y = 44 + 4 * ch + 8
    s += f'<text x="{x0-12}" y="{y+ch/2+5}" text-anchor="end" font-size="13" fill="#52514e">종합</text>'
    for j in range(31):
        v = 1 - sum(sum(D['lines'][l][c][j] for c in CATS) for l in LN) / (PLAN * 4)
        s += f'<rect x="{x0+j*cw+1}" y="{y+1}" width="{cw-2}" height="{ch-2}" rx="4" fill="#fcfcfb" stroke="#c3c2b7"/><text x="{x0+j*cw+cw/2}" y="{y+ch/2+4}" text-anchor="middle" font-size="11" fill="#0b0b0b">{v*100:.0f}</text>'
    s += f'<text x="{x0+31*cw+16}" y="18" font-size="12" fill="#52514e">월 가동율</text>'
    leg = ''.join(f'<rect x="{x0+k*34}" y="{y+ch+30}" width="32" height="12" fill="{SEQ[round(k/6*(len(SEQ)-1))]}"/>' for k in range(7))
    leg += f'<text x="{x0}" y="{y+ch+60}" font-size="12" fill="#52514e">부동률 낮음 (가동율 높음)</text><text x="{x0+7*34}" y="{y+ch+60}" text-anchor="end" font-size="12" fill="#52514e">부동률 높음 25%+</text>'
    svg = f'<svg width="1500" height="{y+ch+70}">{s}{leg}</svg>'
    # loss type x line heatmap
    mx = max(sum(D['lines'][l][c]) for l in LN for c in CATS)
    hm = '<table style="border-collapse:separate;border-spacing:3px;font-size:13px;width:100%"><tr><td></td>' + ''.join(f'<td style="text-align:center;font-weight:700;padding:4px">{s_}</td>' for s_ in SHORT) + '</tr>'
    for c in CATS:
        hm += f'<tr><td style="padding:4px 8px 4px 0;color:#52514e;white-space:nowrap">{CATL[c]}</td>'
        for l in LN:
            v = sum(D['lines'][l][c]); f = seq(v, 0, mx); t = '#fff' if v / mx > 0.45 else '#0b0b0b'
            hm += f'<td class="num" style="background:{f};color:{t};text-align:center;padding:9px 4px;border-radius:4px">{v:,.0f}</td>'
        hm += '</tr>'
    hm += '</table>'
    body = header('③ 히트맵 캘린더형 (Line × Day Heatmap)', '라인×일자 격자에 색 농도로 부동 정도를 표시 — 한 화면에서 "언제, 어느 라인"이 나빴는지 바로 찾는 형태', False)
    body += f'<div class="card" style="margin-bottom:16px"><div class="h">일자별 라인 가동율 (%) — 진할수록 부동 많음</div>{svg}</div><div style="display:flex;gap:16px">'
    body += f'<div class="card" style="flex:1.3"><div class="h">부동 유형 × 라인 (월 합계, 분)</div>{hm}</div><div class="card" style="flex:1"><div class="h">읽는 법</div><div class="ink2" style="font-size:14px;line-height:1.9">· <b style="color:#0b0b0b">세로 줄</b>이 함께 진하면(예: 7/15, 7/27) 공정 공통 원인입니다.<br>· <b style="color:#0b0b0b">가로 줄</b>이 전반적으로 진하면(예: 4라인) 특정 라인의 만성 문제입니다.<br>· 칸을 누르면 그날 부동 상세로 들어가는 방식이 일반적입니다.<br>· 왼쪽 표는 어떤 유형이 어느 라인에 몰려 있는지 보여줍니다(4라인 설비 1,708분).</div></div></div>'
    return page(body, False)

# ---------------- 4. 로스 워터폴 + 파레토 ----------------
def p4():
    tot = {c: sum(sum(D['lines'][l][c]) for l in LN) for c in CATS}
    order = sorted(CATS, key=lambda c: -tot[c]); total = sum(tot.values()); plan = PLAN * 31 * 4
    # stacked 100% bar
    W = 1440; run = plan - total
    bar = f'<svg width="{W}" height="86"><rect x="0" y="10" width="{W*run/plan:.1f}" height="44" rx="4" fill="#6b7a84"/>'
    x = W * run / plan
    for c in order:
        w = W * tot[c] / plan; bar += f'<rect x="{x+1:.1f}" y="10" width="{max(1,w-2):.1f}" height="44" fill="{C_LIGHT[CATS.index(c)]}"/>'; x += w
    bar += f'<text x="16" y="38" font-size="18" font-weight="700" fill="#fff">가동 {run:,.0f}분 · {run/plan*100:.1f}%</text>'
    bar += f'<text x="{W}" y="76" text-anchor="end" font-size="13" fill="#52514e">6대부동 {total:,.0f}분 · {total/plan*100:.1f}%  ▶ 오른쪽 확대</text><text x="0" y="76" font-size="13" fill="#52514e">계획가동시간 {plan:,.0f}분 (4개 라인 × 1,320분 × 31일)</text></svg>'
    # waterfall of losses
    Wf, Hf = 820, 380; bw = Wf / (len(order) + 1) - 18; sc = (Hf - 40) / total
    s = f'<line x1="40" x2="{Wf+40}" y1="{Hf}" y2="{Hf}" stroke="#c3c2b7"/>'
    for k in range(0, 18001, 3000):
        yy = Hf - k * sc
        if k <= total * 1.05: s += f'<line x1="40" x2="{Wf+40}" y1="{yy:.1f}" y2="{yy:.1f}" stroke="#e1e0d9"/><text x="34" y="{yy+4:.1f}" text-anchor="end" font-size="11" fill="#898781">{k:,}</text>'
    acc = 0
    for k, c in enumerate(order):
        xx = 50 + k * (bw + 18); y1 = Hf - (acc + tot[c]) * sc; hh = tot[c] * sc
        s += f'<rect x="{xx:.1f}" y="{y1:.1f}" width="{bw:.1f}" height="{max(hh,2):.1f}" rx="4" fill="{C_LIGHT[CATS.index(c)]}"/>'
        s += f'<text x="{xx+bw/2:.1f}" y="{y1-8:.1f}" text-anchor="middle" font-size="13" font-weight="700" fill="#0b0b0b">{tot[c]:,.0f}</text><text x="{xx+bw/2:.1f}" y="{Hf+20}" text-anchor="middle" font-size="12" fill="#52514e">{CATL[c]}</text>'
        if k < len(order) - 1: s += f'<line x1="{xx+bw:.1f}" x2="{xx+bw+18:.1f}" y1="{y1:.1f}" y2="{y1:.1f}" stroke="#898781" stroke-dasharray="3 2"/>'
        acc += tot[c]
    xx = 50 + len(order) * (bw + 18)
    s += f'<rect x="{xx:.1f}" y="{Hf-total*sc:.1f}" width="{bw:.1f}" height="{total*sc:.1f}" rx="4" fill="#52514e"/><text x="{xx+bw/2:.1f}" y="{Hf-total*sc-8:.1f}" text-anchor="middle" font-size="13" font-weight="700">{total:,.0f}</text><text x="{xx+bw/2:.1f}" y="{Hf+20}" text-anchor="middle" font-size="12" fill="#52514e">합계</text>'
    wf = f'<svg width="{Wf+60}" height="{Hf+30}">{s}</svg>'
    # pareto
    P = D['pareto']; ptot = D['pareto_total']; mx = P[0][1]; cum = 0; rows = ''
    for name, v in P:
        cum += v
        rows += f'<div style="display:flex;align-items:center;gap:10px;margin:7px 0;font-size:13px"><span style="width:170px;white-space:nowrap;overflow:hidden">{name}</span><div style="flex:1;height:16px"><div style="width:{v/mx*100:.1f}%;height:16px;background:#2a78d6;border-radius:0 4px 4px 0"></div></div><span class="num" style="width:58px;text-align:right">{v:,.0f}</span><span class="num mute" style="width:52px;text-align:right">{cum/ptot*100:.0f}%</span></div>'
    par = f'<div style="display:flex;font-size:12px" class="mute"><span style="flex:1">부동내역 (4개 라인, 분)</span><span style="width:58px;text-align:right">분</span><span style="width:52px;text-align:right">누적</span></div>{rows}'
    body = header('④ 로스 분석형 (Loss Waterfall + Pareto)', '계획시간이 어떤 부동으로 얼마나 깎였는지 쌓아 보여주고, 원인 TOP 10을 파레토로 정렬 — 개선 과제 선정·월간 보고용', False)
    body += f'<div class="card" style="margin-bottom:16px"><div class="h">계획가동시간 구성 (7월, 4개 라인 합계)</div>{bar}</div>'
    body += f'<div style="display:flex;gap:16px"><div class="card" style="flex:1.15"><div class="h">6대부동 누적 (워터폴, 분)</div>{wf}</div><div class="card" style="flex:1"><div class="h">부동 원인 파레토 TOP 10</div>{par}<div class="ink2" style="font-size:13px;margin-top:10px">부자재교체(격리판) 1건이 전체 부동의 {P[0][1]/ptot*100:.0f}%를 차지합니다 → 개선 1순위</div></div></div>'
    return page(body, False)

# ---------------- 5. 추이 small multiples ----------------
def p5():
    lo = 0.6; W, H = 700, 250; x0 = 44
    panels = ''
    for i, l in enumerate(LN):
        v = D['lines'][l]['rate']; r, _ = month_rate(l); col, ic, lab = status(r)
        X = lambda j: x0 + j * (W - x0 - 10) / 30; Y = lambda y: 10 + (1 - (y - lo) / (1 - lo)) * (H - 40)
        s = ''
        for g in (0.6, 0.7, 0.8, 0.9, 1.0):
            s += f'<line x1="{x0}" x2="{W-10}" y1="{Y(g):.1f}" y2="{Y(g):.1f}" stroke="#e1e0d9"/><text x="{x0-6}" y="{Y(g)+4:.1f}" text-anchor="end" font-size="11" fill="#898781">{g*100:.0f}%</text>'
        for j, d in enumerate(DAYS):
            if dow(d) in ('토', '일'): s += f'<rect x="{X(j)-9:.1f}" y="10" width="18" height="{H-40}" fill="#f0efec"/>'
            if d % 5 == 1 or d == 31: s += f'<text x="{X(j):.1f}" y="{H-12}" text-anchor="middle" font-size="11" fill="#898781">7/{d}</text>'
        s += f'<line x1="{x0}" x2="{W-10}" y1="{Y(TARGET):.1f}" y2="{Y(TARGET):.1f}" stroke="#52514e" stroke-dasharray="6 4" stroke-width="1.5"/><text x="{x0+4}" y="{Y(TARGET)+14:.1f}" font-size="11" fill="#52514e">목표 90%</text>'
        # 7-day moving avg
        ma = [sum(v[max(0, j-6):j+1]) / len(v[max(0, j-6):j+1]) for j in range(31)]
        s += '<polyline fill="none" stroke="#c3c2b7" stroke-width="2" points="' + ' '.join(f'{X(j):.1f},{Y(m):.1f}' for j, m in enumerate(ma)) + '"/>'
        s += f'<polyline fill="none" stroke="{L_LIGHT[i]}" stroke-width="2" points="' + ' '.join(f'{X(j):.1f},{Y(max(lo,y)):.1f}' for j, y in enumerate(v)) + '"/>'
        for j, y in enumerate(v):
            if y < TARGET:
                c2, _, _ = status(y); s += f'<circle cx="{X(j):.1f}" cy="{Y(max(lo,y)):.1f}" r="4.5" fill="{c2}" stroke="#fcfcfb" stroke-width="2"/>'
        jmin = min(range(31), key=lambda j: v[j])
        anc = 'end' if jmin > 26 else ('start' if jmin < 3 else 'middle'); s += f'<text x="{X(jmin):.1f}" y="{Y(max(lo,v[jmin]))+18:.1f}" text-anchor="{anc}" font-size="11" font-weight="700" fill="#0b0b0b">최저 {v[jmin]*100:.1f}% (7/{jmin+1})</text>'
        under = sum(1 for y in v if y < TARGET)
        panels += f'''<div class="card" style="width:calc(50% - 8px)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
<div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;border-radius:3px;background:{L_LIGHT[i]}"></span><span style="font-size:17px;font-weight:700">AGM 조립 {SHORT[i]}</span></div>
<div style="font-size:13px"><span class="ink2">월 </span><b style="font-size:18px">{r*100:.1f}%</b> <span class="badge" style="background:{col}22;color:{'#8a5a00' if col==WARN else col}">{ic} {lab}</span> <span class="ink2">미달 {under}일</span></div></div>
<svg width="{W}" height="{H}">{s}</svg></div>'''
    leg = '<div class="ink2" style="font-size:13px;margin-bottom:12px">— 라인 색 실선: 일 가동율  ·  <span style="color:#898781">회색 실선: 7일 이동평균</span>  ·  - - 목표 90%  ·  점: 목표 미달일 (<span style="color:#fab219">▲ 85~90%</span>, <span style="color:#d03b3b">■ &lt;85%</span>)  ·  회색 띠: 주말</div>'
    body = header('⑤ 추이·목표 관리형 (Trend Small Multiples)', '라인별 같은 축의 작은 차트를 나란히 놓고 목표선·이동평균·미달일을 표시 — 주간/월간 회의에서 추세 판단용', False)
    body += leg + f'<div style="display:flex;flex-wrap:wrap;gap:16px">{panels}</div>'
    return page(body, False)

for n, f in enumerate([p1, p2, p3, p4, p5], 1):
    open(MOCK / f'p{n}.html', 'w', encoding='utf-8').write(f())
print('ok')

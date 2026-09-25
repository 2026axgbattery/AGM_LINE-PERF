"""1단계: 원본 2개 → 기본 시트(컬럼정의·일자별_가동율·부동대사·라인별_부동·원본) 생성"""
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'src'))
from agm import config as CFG
CFG.OUT_DIR.mkdir(exist_ok=True)
import pandas as pd, re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L
a=pd.read_excel(CFG.SUMMARY_FILE,header=0); a=a[a['일자별'].notna()].copy()
a['일자']=pd.to_datetime('20'+a['일자별'].str.replace('/','-')).dt.date
d=pd.read_excel(CFG.DETAIL_FILE,header=0); d=d[d['공정']!='총계'].copy()
d['일자']=pd.to_datetime(d['일자']).dt.date
def line(s):
    s=str(s)
    if re.match(r'^\s*(GC|반자동)',s): return '제외(GC·반자동)'
    m=re.match(r'^\s*([\d,]+)라인',s)
    if m:
        g=m.group(1)
        return f'AGM조립{g}라인' if ',' not in g else f'AGM조립{g}라인(복수)'
    return '(미표기)'
d['라인(추출)']=d['세부내역'].apply(line)
MANUAL=r'수동\s*적재|적재제품\s*투입|제품\s*투입|제품\s*적재|긴급\s*출하|긴급\s*제품|주액\s*투입|샘플\s*작업|계약직'
def kind(r):
    if r['대분류명']=='[FA4]실동부동': return '실동부동(분류만)'
    if r['라인(추출)'].startswith('제외'): return '제외(GC·반자동)'
    if r['대분류명'] in ('[FA1]생산부동','[FA6]라인 언발란스 부동') and re.search(MANUAL,str(r['세부내역'])): return '수동작업(분류·가동율 제외)'
    if r['라인(추출)']=='(미표기)': return '6대부동-AGM공통(균등배분)'
    return '6대부동-AGM라인'
d['관리구분']=d.apply(kind,axis=1)
F='Arial'; H=Font(name=F,bold=True,color='FFFFFF'); HF=PatternFill('solid',fgColor='1F4E78')
B=Font(name=F); BB=Font(name=F,bold=True); thin=Side(style='thin',color='BFBFBF'); bd=Border(left=thin,right=thin,top=thin,bottom=thin)
KF=PatternFill('solid',fgColor='FFF2CC')
wb=Workbook()
def hdr(ws,r,vals):
    for i,v in enumerate(vals,1):
        c=ws.cell(r,i,v); c.font=H; c.fill=HF; c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True); c.border=bd
def fmt(ws,r1,r2,c1,c2,nf=None):
    for r in range(r1,r2+1):
        for c in range(c1,c2+1):
            x=ws.cell(r,c); x.font=BB if x.font.bold else B; x.border=bd
            if nf and isinstance(x.value,(int,float,str)) and c>=nf[0]: x.number_format=nf[1]
# 1 컬럼정의
ws=wb.active; ws.title='컬럼정의'
hdr(ws,1,['파일','컬럼','의미(해석)','산식/검증 결과','연결키'])
rows=[
('작업공수관리','No.','행 번호 (1~2행은 월 합계: 직접/간접)','',''),
('작업공수관리','일자별','작업일자 (YY/MM/DD)','','일자 ↔ 상세.일자'),
('작업공수관리','공정','공정코드 (P51 = EBGC조립)','','공정'),
('작업공수관리','구분','직접(생산 작업자)/간접(지원·관리 인원)','','구분'),
('작업공수관리','보유공수','재적 인원 × 정규근무시간(인·시). 휴일은 0','',''),
('작업공수관리','사고공수','휴가·결근·조퇴 등 근무 못 한 시간','',''),
('작업공수관리','연장근무','잔업·특근(휴일근무) 시간','',''),
('작업공수관리','출근공수','실제 근무한 총 공수','산식: 보유 − 사고 + 연장 (31일 전부 일치)',''),
('작업공수관리','파견공수','타 공정으로 지원 나간 공수','',''),
('작업공수관리','보충공수','타 공정에서 지원 받은 공수','',''),
('작업공수관리','공정공수','해당 공정에 실제 투입 가능한 공수','산식: 출근 − 파견 + 보충 (전부 일치)',''),
('작업공수관리','생산부동~관리부동','작업 중 발생한 손실시간 6종 (생산/설비/자재/라인언밸런스/부자재교체/생산관리)','상세 FA1·FA2·FA3·FA6·FA7·FA5와 일자·구분별 100% 일치','대분류명'),
('작업공수관리','실동부동','교육·노조·행사·휴식연장 등 작업 외 인정시간','상세 FA4와 100% 일치',''),
('작업공수관리','순투입공수','실제 라인(작업)에 투입된 공수','산식: 공정공수 − 실동부동 (다른 부동은 차감 안 됨 → 순투입 안의 손실)',''),
('부동공수상세','No.','행 번호 (1행 = 총계 2,762.39)','',''),
('부동공수상세','공정 / 공정명','P51 / EBGC조립','','공정'),
('부동공수상세','구분','직접/간접','','구분'),
('부동공수상세','일자','부동 발생일','','일자'),
('부동공수상세','대분류명','부동 유형 FA1~FA7 → 요약 파일의 부동 컬럼 7개와 1:1 대응','',''),
('부동공수상세','중분류명','세부 유형 (설비부동은 설비명: COS, COMBI M/C, 스테커 등)','',''),
('부동공수상세','부동내역','부동 사유 (예: 차입 호퍼 이상, 형명 교체, 숙련도향상교육)','',''),
('부동공수상세','세부내역','자유 서술. "4라인=..." 처럼 라인이 텍스트로만 기재됨','라인 정보는 이 칸에서만 추출 가능',''),
('부동공수상세','인원 / 시간(분)','부동에 관련된 인원수, 부동 지속시간(분)','',''),
('부동공수상세','공수','부동 공수(인·시)','산식: 인원 × 시간(분) ÷ 60 (반올림 오차 ±0.003)',''),
]
for r,v in enumerate(rows,2):
    for c,x in enumerate(v,1): ws.cell(r,c,x)
fmt(ws,2,len(rows)+1,1,5)
for c,w in zip('ABCDE',[14,18,55,55,18]): ws.column_dimensions[c].width=w
for r in range(2,len(rows)+2):
    for c in range(1,6): ws.cell(r,c).alignment=Alignment(wrap_text=True,vertical='top')

# 4 원본 상세 (write first for reference)
wd=wb.create_sheet('부동상세_원본')
dc=['일자','구분','대분류명','중분류명','부동내역','세부내역','라인(추출)','인   원','시간(분)','공수','관리구분']
hdr(wd,1,[c.strip() if c!='인   원' else '인원' for c in dc])
for i,row in enumerate(d[dc].itertuples(index=False),2):
    for j,v in enumerate(row,1): wd.cell(i,j,v)
nd=len(d)+1
fmt(wd,2,nd,1,11)
for r in range(2,nd+1): wd.cell(r,1).number_format='yyyy-mm-dd'; wd.cell(r,10).number_format='#,##0.00'
for c,w in zip('ABCDEFGHIJK',[12,6,18,30,22,40,20,6,9,9,24]): wd.column_dimensions[c].width=w
wd.freeze_panes='A2'; wd.auto_filter.ref=f'A1:K{nd}'
R=lambda col: f"부동상세_원본!${col}$2:${col}${nd}"

# 3 원본 요약
wa=wb.create_sheet('공수관리_원본')
ac=['일자','구분','보유공수','사고공수','연장근무','출근공수','파견공수','보충공수','공정공수','생산부동','설비부동','자재부동','라인언발라스부동','부자재교체부동','관리부동','실동부동','순투입공수']
hdr(wa,1,ac)
for i,row in enumerate(a[ac].itertuples(index=False),2):
    for j,v in enumerate(row,1): wa.cell(i,j,v)
na=len(a)+1
fmt(wa,2,na,1,17)
for r in range(2,na+1):
    wa.cell(r,1).number_format='yyyy-mm-dd'
    for c in range(3,18): wa.cell(r,c).number_format='#,##0.00'
for c in range(1,18): wa.column_dimensions[L(c)].width=11
wa.freeze_panes='C2'

# 2 부동대사
wr=wb.create_sheet('부동대사',1)
wr['A1']='두 파일 연결 검증: 요약 파일 부동 컬럼 vs 상세 파일 대분류 합계 (월 합계, 구분별)'; wr['A1'].font=Font(name=F,bold=True,size=12)
hdr(wr,3,['요약 컬럼','상세 대분류','직접-요약','직접-상세','간접-요약','간접-상세','차이'])
mp=[('생산부동','[FA1]생산부동','J'),('설비부동','[FA2]설비부동','K'),('자재부동','[FA3]자재부동','L'),('실동부동','[FA4]실동부동','P'),('관리부동','[FA5]생산관리부동','O'),('라인언발라스부동','[FA6]라인 언발란스 부동','M'),('부자재교체부동','[FA7]부자재 교체','N')]
for i,(s,t,col) in enumerate(mp,4):
    wr.cell(i,1,s); wr.cell(i,2,t)
    wr.cell(i,3,f'=SUMIFS(공수관리_원본!{col}$2:{col}${na},공수관리_원본!$B$2:$B${na},"직접")')
    wr.cell(i,4,f'=SUMIFS({R("J")},{R("C")},B{i},{R("B")},"직접")')
    wr.cell(i,5,f'=SUMIFS(공수관리_원본!{col}$2:{col}${na},공수관리_원본!$B$2:$B${na},"간접")')
    wr.cell(i,6,f'=SUMIFS({R("J")},{R("C")},B{i},{R("B")},"간접")')
    wr.cell(i,7,f'=ROUND(C{i}-D{i}+E{i}-F{i},2)')
t=4+len(mp); wr.cell(t,1,'합계').font=BB
for c in 'CDEFG': wr[f'{c}{t}']=f'=SUM({c}4:{c}{t-1})'; wr[f'{c}{t}'].font=BB
fmt(wr,4,t,1,7)
for r in range(4,t+1):
    for c in range(3,8): wr.cell(r,c).number_format='#,##0.00'
wr.cell(t+2,1,'※ 일자×구분 단위로도 전 31일 차이 0 확인 (분석 스크립트 검증). 연결키 = 공정 + 일자 + 구분 + 대분류.').font=Font(name=F,italic=True)
for c,w in zip('ABCDEFG',[18,24,12,12,12,12,10]): wr.column_dimensions[c].width=w

# 5 일자별 가동율 (직접)
wg=wb.create_sheet('일자별_가동율',1)
wg['A1']='P51 EBGC조립 직접공수 기준 공수가동율 (단위: 인·시)'; wg['A1'].font=Font(name=F,bold=True,size=12)
wg['A2']='공수가동율 = 순작업공수 ÷ 순투입공수 | 종합효율 = 순작업공수 ÷ 공정공수 | 순작업공수 = 순투입 − 작업중 손실(생산·설비·자재·라인언밸런스·부자재·관리부동)'; wg['A2'].font=Font(name=F,italic=True)
hh=['일자','근무형태','공정공수','실동부동','순투입공수','작업중 손실부동','(그중) 설비부동','순작업공수','실동률\n(순투입/공정)','공수가동율\n(순작업/순투입)','종합효율\n(순작업/공정)','설비부동률\n(설비/순투입)']
hdr(wg,4,hh)
dd=a[a.구분=='직접'].reset_index(drop=True)
for i,row in dd.iterrows():
    r=5+i; ar=2+a.index.get_loc(a[(a.일자==row.일자)&(a.구분=='직접')].index[0])
    wg.cell(r,1,f'=공수관리_원본!A{ar}'); wg.cell(r,1).number_format='mm-dd(aaa)'
    wg.cell(r,2,f'=IF(공수관리_원본!C{ar}=0,"휴무일특근","정상")')
    wg.cell(r,3,f'=공수관리_원본!I{ar}'); wg.cell(r,4,f'=공수관리_원본!P{ar}'); wg.cell(r,5,f'=공수관리_원본!Q{ar}')
    wg.cell(r,6,f'=SUM(공수관리_원본!J{ar}:O{ar})'); wg.cell(r,7,f'=공수관리_원본!K{ar}')
    wg.cell(r,8,f'=E{r}-F{r}')
    wg.cell(r,9,f'=IFERROR(E{r}/C{r},0)'); wg.cell(r,10,f'=IFERROR(H{r}/E{r},0)'); wg.cell(r,11,f'=IFERROR(H{r}/C{r},0)'); wg.cell(r,12,f'=IFERROR(G{r}/E{r},0)')
e=5+len(dd)-1; t=e+1
wg.cell(t,1,'7월 합계'); wg.cell(t,2,'')
for c in 'CDEFGH': wg[f'{c}{t}']=f'=SUM({c}5:{c}{e})'
wg[f'I{t}']=f'=E{t}/C{t}'; wg[f'J{t}']=f'=H{t}/E{t}'; wg[f'K{t}']=f'=H{t}/C{t}'; wg[f'L{t}']=f'=G{t}/E{t}'
fmt(wg,5,t,1,12)
for r in range(5,t+1):
    for c in range(3,9): wg.cell(r,c).number_format='#,##0.0'
    for c in range(9,13): wg.cell(r,c).number_format='0.0%'
for c in range(1,13): wg.cell(t,c).font=BB; wg.cell(t,c).fill=KF
for c,w in zip('ABCDEFGHIJKL',[11,10,10,10,10,12,11,11,12,13,12,12]): wg.column_dimensions[c].width=w
wg.row_dimensions[4].height=32; wg.freeze_panes='C5'

# 6 라인별
wl=wb.create_sheet('라인별_부동',3)
wl['A1']='라인별 부동공수 (세부내역 텍스트에서 라인명 추출 — 참고용)'; wl['A1'].font=Font(name=F,bold=True,size=12)
lines=sorted(d['라인(추출)'].unique(),key=lambda x:(0 if x.startswith('AGM') and '복수' not in x else 1 if '복수' in x else 2 if x=='(미표기)' else 3, x))
cats=[t for _,t,_ in mp]
hdr(wl,3,['라인(추출)']+[c.split(']')[1] for c in cats]+['합계','건수'])
for i,ln in enumerate(lines,4):
    wl.cell(i,1,ln)
    for j,ct in enumerate(cats,2):
        wl.cell(i,j,f'=SUMIFS({R("J")},{R("G")},$A{i},{R("C")},"{ct}")')
    wl.cell(i,9,f'=SUM(B{i}:H{i})'); wl.cell(i,10,f'=COUNTIFS({R("G")},$A{i})')
t=4+len(lines); wl.cell(t,1,'합계')
for c in range(2,11): wl.cell(t,c,f'=SUM({L(c)}4:{L(c)}{t-1})')
fmt(wl,4,t,1,10)
for r in range(4,t+1):
    for c in range(2,10): wl.cell(r,c).number_format='#,##0.0;-#,##0.0;-'
for c in range(1,11): wl.cell(t,c).font=BB
wl.cell(t+2,1,'※ 라인은 세부내역 텍스트("4라인=...")에서 추출. 분석 대상은 AGM조립1~4라인. GC·반자동라인은 제외. (미표기) = 실동부동(분류만) + AGM 공통 6대부동(격리판 교체, 긴급제품 투입 → 1~4라인 균등배분).').font=Font(name=F,italic=True)
wl.column_dimensions['A'].width=14
for c in range(2,11): wl.column_dimensions[L(c)].width=12
wb.save(CFG.EXCEL_OUT)

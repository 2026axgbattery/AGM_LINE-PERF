"""3단계: AGM 1~4라인 시간가동율 시트(배분·일자별·가동율·그래프) 추가"""
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'src'))
from agm import config as CFG
CFG.OUT_DIR.mkdir(exist_ok=True)
import re, datetime
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties
from openpyxl.formatting.rule import ColorScaleRule, CellIsRule
from openpyxl.utils import get_column_letter as L
from openpyxl.comments import Comment
p=CFG.EXCEL_OUT
wb=load_workbook(p)
F='Arial'; H=Font(name=F,bold=True,color='FFFFFF'); HF=PatternFill('solid',fgColor='1F4E78')
B=Font(name=F); BB=Font(name=F,bold=True); KF=PatternFill('solid',fgColor='FFF2CC'); INF=PatternFill('solid',fgColor='FFFF00')
t=Side(style='thin',color='BFBFBF'); bd=Border(left=t,right=t,top=t,bottom=t)
def hdr(ws,r,vals,c0=1):
    for i,v in enumerate(vals,c0):
        c=ws.cell(r,i,v); c.font=H; c.fill=HF; c.border=bd; c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True)
def box(ws,r1,r2,c1,c2):
    for r in range(r1,r2+1):
        for c in range(c1,c2+1):
            x=ws.cell(r,c); x.border=bd
            if not x.font.bold: x.font=B
LINES=['AGM조립1라인','AGM조립2라인','AGM조립3라인','AGM조립4라인']
CATS=[('[FA1]생산부동','생산부동'),('[FA2]설비부동','설비부동'),('[FA3]자재부동','자재부동'),('[FA5]생산관리부동','관리부동'),('[FA6]라인 언발란스 부동','라인언밸런스'),('[FA7]부자재 교체','부자재교체')]
DAYS=[datetime.date(2026,7,k) for k in range(1,32)]
src=wb['부동상세_원본']; nd=src.max_row
# ---------- 배분 시트 ----------
wa=wb.create_sheet('AGM라인_배분')
wa['A1']='AGM조립1~4라인 6대부동 배분 내역 (부동상세_원본 → 라인별 시간(분) 배분)'; wa['A1'].font=Font(name=F,bold=True,size=12)
wa['A2']='배분 규칙: 단일 라인 표기 = 100% / 복수 라인 표기(예: 2,4라인) = 각 라인 100% / 라인 미표기 AGM 공통 = 1~4라인 각 25%. 실동부동·GC·반자동은 제외. 수동작업(수동적재·긴급투입 등)은 반영구분=수동작업(제외)로 분류만 하고 가동율에서 뺌.'; wa['A2'].font=Font(name=F,italic=True,color='595959')
hdr(wa,4,['원본행','일자','라인','대분류','부동내역','세부내역','원본시간(분)','배분율','배분시간(분)','반영구분'])
r=5
for sr in range(2,nd+1):
    kind=src.cell(sr,11).value; ln=src.cell(sr,7).value
    if kind not in ('6대부동-AGM라인','6대부동-AGM공통(균등배분)','수동작업(분류·가동율 제외)'): continue
    mm=re.match(r'AGM조립([\d,]+)라인',ln)
    tg=[(f'AGM조립{x}라인',1.0) for x in mm.group(1).split(',')] if mm else [(l,0.25) for l in LINES]
    flag='수동작업(제외)' if kind.startswith('수동') else '가동율반영'
    for l,f in tg:
        wa.cell(r,1,sr); wa.cell(r,2,f'=부동상세_원본!A{sr}').number_format='yyyy-mm-dd'
        wa.cell(r,3,l); wa.cell(r,4,f'=부동상세_원본!C{sr}'); wa.cell(r,5,f'=부동상세_원본!E{sr}'); wa.cell(r,6,f'=부동상세_원본!F{sr}')
        wa.cell(r,7,f'=부동상세_원본!I{sr}'); wa.cell(r,8,f).number_format='0%'; wa.cell(r,9,f'=G{r}*H{r}').number_format='#,##0.0'; wa.cell(r,10,flag)
        if flag!='가동율반영':
            for c in range(1,11): wa.cell(r,c).fill=PatternFill('solid',fgColor='EDEDED')
        r+=1
na=r-1; box(wa,5,na,1,10)
for c,w in zip('ABCDEFGHIJ',[7,11,14,20,20,44,11,8,11,15]): wa.column_dimensions[c].width=w
wa.freeze_panes='A5'; wa.auto_filter.ref=f'A4:J{na}'
AR=lambda c: f"AGM라인_배분!${c}$5:${c}${na}"
# ---------- 라인×일자 상세 ----------
wd=wb.create_sheet('AGM라인_일자별')
wd['A1']='AGM조립1~4라인 일자별 6대부동 시간(분)과 시간가동율'; wd['A1'].font=Font(name=F,bold=True,size=12)
wd['A2']='시간가동율 = (계획가동시간 − 6대부동 시간) ÷ 계획가동시간. 계획가동시간은 AGM라인_가동율 시트의 입력칸에서 가져옴.'; wd['A2'].font=Font(name=F,italic=True,color='595959')
hdr(wd,4,['라인','일자']+[n for _,n in CATS]+['6대부동 합계(분)','계획가동시간(분)','가동시간(분)','시간가동율','확인'])
r=5; rowmap={}
for li,l in enumerate(LINES):
    for dt in DAYS:
        wd.cell(r,1,l); wd.cell(r,2,dt).number_format='mm/dd'
        for j,(code,_) in enumerate(CATS,3):
            wd.cell(r,j,f'=SUMIFS({AR("I")},{AR("C")},$A{r},{AR("B")},$B{r},{AR("D")},"{code}",{AR("J")},"가동율반영")')
        wd.cell(r,9,f'=SUM(C{r}:H{r})')
        wd.cell(r,10,f'=AGM라인_가동율!{L(2+li)}$5')
        wd.cell(r,11,f'=MAX(0,J{r}-I{r})')
        wd.cell(r,12,f'=IFERROR(K{r}/J{r},0)')
        wd.cell(r,13,f'=IF(I{r}>J{r},"부동>계획 확인","")')
        rowmap[(l,dt)]=r; r+=1
ndd=r-1; box(wd,5,ndd,1,13)
for rr in range(5,ndd+1):
    for c in range(3,12): wd.cell(rr,c).number_format='#,##0.0;-#,##0.0;-'
    wd.cell(rr,12).number_format='0.0%'
for c,w in zip('ABCDEFGHIJKLM',[14,8,9,9,9,9,11,11,12,12,11,11,14]): wd.column_dimensions[c].width=w
wd.freeze_panes='C5'; wd.auto_filter.ref=f'A4:M{ndd}'
# ---------- 메인 가동율 시트 ----------
if 'AGM라인_가동율' in wb.sheetnames: del wb['AGM라인_가동율']
ws=wb.create_sheet('AGM라인_가동율',1)
ws['A1']='AGM조립1~4라인 일자별 시간가동율 (6대부동 기준)'; ws['A1'].font=Font(name=F,bold=True,size=14)
ws['A2']='시간가동율 = (계획가동시간 − 6대부동 시간) ÷ 계획가동시간 | 실동부동·수동작업은 분류만 하고 부동으로 보지 않음 | GC·반자동라인 제외'; ws['A2'].font=Font(name=F,italic=True,color='595959')
hdr(ws,4,['설정(입력)']+LINES)
ws['A5']='계획가동시간(분/일)'; ws['A5'].font=BB
for i in range(4):
    c=ws.cell(5,2+i,1320); c.font=Font(name=F,color='0000FF',bold=True); c.fill=INF; c.number_format='#,##0'; c.border=bd
ws['B5'].comment=Comment('사용자 제공: 3조2교대, 교대당 정상 8h + 잔업 3h = 11h × 2교대 = 1,320분. 휴식·식사 미차감, 주말·휴무일 동일 적용. 노란 칸을 고치면 전체 재계산.','분석')
ws['F5']='← 노란 칸 수정 시 전 시트 자동 재계산 (11h×2교대, 휴식 미차감, 주말 동일)'; ws['F5'].font=Font(name=F,italic=True,color='595959')
# 월간 요약
ws['A7']='1. 7월 라인별 요약'; ws['A7'].font=Font(name=F,bold=True,size=12)
hdr(ws,8,['항목']+LINES+['4개 라인 합계'])
items=[(n,code) for code,n in CATS]
r=9
for n,code in items:
    ws.cell(r,1,n+' (분)')
    for i,l in enumerate(LINES):
        ws.cell(r,2+i,f'=SUMIFS({AR("I")},{AR("C")},"{l}",{AR("D")},"{code}",{AR("J")},"가동율반영")')
    ws.cell(r,6,f'=SUM(B{r}:E{r})'); r+=1
r_sum=r; ws.cell(r,1,'6대부동 합계 (분)').font=BB
for c in range(2,7): ws.cell(r,c,f'=SUM({L(c)}9:{L(c)}{r-1})').font=BB
r+=1; r_plan=r; ws.cell(r,1,'계획가동시간 (분, 31일)')
for i in range(4): ws.cell(r,2+i,f'={L(2+i)}$5*31')
ws.cell(r,6,f'=SUM(B{r}:E{r})')
r+=1; r_run=r; ws.cell(r,1,'가동시간 (분)')
for c in range(2,7): ws.cell(r,c,f'={L(c)}{r_plan}-{L(c)}{r_sum}')
r+=1; r_rate=r; ws.cell(r,1,'월 시간가동율').font=BB
for c in range(2,7):
    x=ws.cell(r,c,f'=IFERROR({L(c)}{r_run}/{L(c)}{r_plan},0)'); x.number_format='0.0%'; x.font=BB; x.fill=KF
ws.cell(r,1).fill=KF
r+=1; r_top=r; ws.cell(r,1,'최대 부동 유형')
for c in range(2,7):
    ws.cell(r,c,f'=INDEX($A$9:$A${r_sum-1},MATCH(MAX({L(c)}9:{L(c)}{r_sum-1}),{L(c)}9:{L(c)}{r_sum-1},0))')
r+=1; ws.cell(r,1,'(참고) 수동작업 분류 (분, 제외)').font=Font(name=F,italic=True,color='595959')
for i,l in enumerate(LINES): ws.cell(r,2+i,f'=SUMIFS({AR("I")},{AR("C")},"{l}",{AR("J")},"수동작업(제외)")')
ws.cell(r,6,f'=SUM(B{r}:E{r})')
for c in range(2,7): ws.cell(r,c).number_format='#,##0.0'; ws.cell(r,c).font=Font(name=F,italic=True,color='595959')
r_man=r
box(ws,9,r,1,6)
for rr in range(9,r_rate):
    for c in range(2,7): ws.cell(rr,c).number_format='#,##0.0;-#,##0.0;-'
# 일자별 매트릭스
r0=r+2
ws.cell(r0,1,'2. 일자별 라인 시간가동율').font=Font(name=F,bold=True,size=12)
hdr(ws,r0+1,['일자']+LINES+['4개 라인 종합'])
first=r0+2
for k,dt in enumerate(DAYS):
    rr=first+k
    ws.cell(rr,1,dt.strftime('%m/%d')+'('+'월화수목금토일'[dt.weekday()]+')')
    for i,l in enumerate(LINES):
        ws.cell(rr,2+i,f'=AGM라인_일자별!L{rowmap[(l,dt)]}')
    refs_i='+'.join(f'AGM라인_일자별!I{rowmap[(l,dt)]}' for l in LINES)
    refs_j='+'.join(f'AGM라인_일자별!J{rowmap[(l,dt)]}' for l in LINES)
    ws.cell(rr,6,f'=IFERROR(MAX(0,({refs_j})-({refs_i}))/({refs_j}),0)')
last=first+30
for j,(lab,fn) in enumerate([('7월 누계',None),('일평균','AVERAGE'),('최고','MAX'),('최저','MIN')],1):
    rr=last+j; ws.cell(rr,1,lab).font=BB; ws.cell(rr,1).fill=KF
    for c in range(2,7):
        v=f'={L(c)}{r_rate}' if fn is None else f'={fn}({L(c)}{first}:{L(c)}{last})'
        x=ws.cell(rr,c,v); x.font=BB; x.fill=KF
for rr in range(first,last+5):
    for c in range(2,7): ws.cell(rr,c).number_format='0.0%'
box(ws,first,last+4,1,6)
ws.conditional_formatting.add(f'B{first}:F{last}',ColorScaleRule(start_type='min',start_color='F8696B',mid_type='percentile',mid_value=50,mid_color='FFEB84',end_type='max',end_color='63BE7B'))
# 일자별 부동분 매트릭스
q0=last+7
ws.cell(q0,1,'3. 일자별 라인 6대부동 시간(분)').font=Font(name=F,bold=True,size=12)
hdr(ws,q0+1,['일자']+LINES+['4개 라인 합계'])
qf=q0+2
for k,dt in enumerate(DAYS):
    rr=qf+k
    ws.cell(rr,1,dt.strftime('%m/%d')+'('+'월화수목금토일'[dt.weekday()]+')')
    for i,l in enumerate(LINES):
        ws.cell(rr,2+i,f'=AGM라인_일자별!I{rowmap[(l,dt)]}')
    ws.cell(rr,6,f'=SUM(B{rr}:E{rr})')
ql=qf+30; ws.cell(ql+1,1,'합계').font=BB
for c in range(2,7): ws.cell(ql+1,c,f'=SUM({L(c)}{qf}:{L(c)}{ql})').font=BB
for rr in range(qf,ql+2):
    for c in range(2,7): ws.cell(rr,c).number_format='#,##0;-#,##0;-'
box(ws,qf,ql+1,1,6)
ws.conditional_formatting.add(f'B{qf}:E{ql}',CellIsRule(operator='greaterThan',formula=['B$5'],fill=PatternFill('solid',fgColor='F8696B')))
ws.cell(ql+3,1,'※ 부동 사건이 겹치면 같은 시간이 중복 합산될 수 있음. 부동분 > 계획가동시간인 칸은 빨강 표시, 가동율은 0% 하한 적용.').font=Font(name=F,italic=True,color='595959')
ws.cell(ql+4,1,'※ 라인 미표기 AGM 공통 부동(격리판 교체, 긴급제품 투입)은 1~4라인 균등 배분, 복수 라인 표기는 각 라인 전액 반영 (AGM라인_배분 시트 참조).').font=Font(name=F,italic=True,color='595959')
# charts
COLS=['1F4E78','ED7D31','70AD47','7030A0']
ch=BarChart(); ch.type='col'; ch.grouping='clustered'; ch.gapWidth=50; ch.overlap=0
ch.title='AGM조립 라인별 일자 시간가동율'; ch.height=11; ch.width=34
ch.y_axis.number_format='0%'; ch.y_axis.scaling.min=0; ch.y_axis.scaling.max=1
ch.add_data(Reference(ws,min_col=2,max_col=5,min_row=r0+1,max_row=last),titles_from_data=True)
ch.set_categories(Reference(ws,min_col=1,min_row=first,max_row=last))
for s_,col in zip(ch.series,COLS):
    s_.graphicalProperties=GraphicalProperties(solidFill=col,ln=LineProperties(solidFill=col))
ch.legend.position='b'; ch.x_axis.delete=False; ch.y_axis.delete=False
ws.add_chart(ch,f'H{r0}')
c2=BarChart(); c2.type='col'; c2.title='7월 라인별 시간가동율'; c2.height=8; c2.width=16; c2.gapWidth=80
c2.y_axis.number_format='0%'; c2.y_axis.scaling.min=0; c2.y_axis.scaling.max=1
c2.add_data(Reference(ws,min_col=2,max_col=6,min_row=r_rate,max_row=r_rate),from_rows=True,titles_from_data=False)
c2.set_categories(Reference(ws,min_col=2,max_col=6,min_row=8,max_row=8))
c2.series[0].graphicalProperties=GraphicalProperties(solidFill='1F4E78',ln=LineProperties(solidFill='1F4E78'))
c2.dataLabels=DataLabelList(); c2.dataLabels.showVal=True; c2.dataLabels.showSerName=False; c2.dataLabels.showCatName=False; c2.dataLabels.showLegendKey=False; c2.dataLabels.showPercent=False; c2.dataLabels.numFmt='0.0%'
from openpyxl.chart.series import SeriesLabel
c2.series[0].tx=SeriesLabel(v='월 시간가동율')
c2.legend=None; c2.x_axis.delete=False; c2.y_axis.delete=False
ws.add_chart(c2,'H4')
ws.column_dimensions['A'].width=22
for c in 'BCDEF': ws.column_dimensions[c].width=15
ws.freeze_panes='B5'
# 가동율_요약 시트에 범위 주석
s0=wb['가동율_요약']
s0['A3']='※ 이 시트는 요약 파일 기준 P51 공정 전체 공수(GC·반자동 인원 포함, 라인 분리 불가)임. AGM조립1~4라인 가동율은 AGM라인_가동율 시트 참조.'
s0['A3'].font=Font(name=F,italic=True,color='C00000')
wb.active=1
wb.calculation.fullCalcOnLoad = True  # 엑셀에서 열 때 수식 자동 재계산
wb.save(p)
print('rows alloc',na-4,'rowmap',len(rowmap),'r_rate',r_rate,'first',first,'qf',qf)

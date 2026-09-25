"""2단계: 가동율_요약 시트(월간 KPI·일자별 4개 항목·막대그래프) 추가"""
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'src'))
from agm import config as CFG
CFG.OUT_DIR.mkdir(exist_ok=True)
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import ColorScaleRule
p=CFG.EXCEL_OUT
wb=load_workbook(p)
if '가동율_요약' in wb.sheetnames: del wb['가동율_요약']
ws=wb.create_sheet('가동율_요약',0)
F='Arial'; H=Font(name=F,bold=True,color='FFFFFF'); HF=PatternFill('solid',fgColor='1F4E78')
B=Font(name=F); BB=Font(name=F,bold=True); KF=PatternFill('solid',fgColor='FFF2CC')
t=Side(style='thin',color='BFBFBF'); bd=Border(left=t,right=t,top=t,bottom=t)
S="일자별_가동율"
def hdr(r,vals):
    for i,v in enumerate(vals,1):
        c=ws.cell(r,i,v); c.font=H; c.fill=HF; c.border=bd; c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True)
def box(r1,r2,c1,c2):
    for r in range(r1,r2+1):
        for c in range(c1,c2+1):
            x=ws.cell(r,c); x.border=bd
            if not x.font.bold: x.font=B
ws['A1']='P51 EBGC조립 7월 가동율 (직접공수 기준, 단위: 인·시)'; ws['A1'].font=Font(name=F,bold=True,size=14)
ws['A2']='순작업공수 = 순투입공수 − 작업중 손실부동(생산·설비·자재·라인언밸런스·부자재교체·관리부동)'; ws['A2'].font=Font(name=F,italic=True,color='595959')
# 1. 월간 요약
ws['A4']='1. 7월 월간 가동율'; ws['A4'].font=Font(name=F,bold=True,size=12)
hdr(5,['지표','산식','분자','분모','결과','의미'])
T='$36'
m=[('실동률','순투입 ÷ 공정공수',f"={S}!E{T}",f"={S}!C{T}",'투입 가능 공수 중 교육·노조 등 작업 외 시간을 뺀 실제 투입 비율'),
   ('공수가동율','순작업 ÷ 순투입',f"={S}!H{T}",f"={S}!E{T}",'라인 투입 공수 중 부동 없이 실제 작업한 비율'),
   ('종합효율','순작업 ÷ 공정공수',f"={S}!H{T}",f"={S}!C{T}",'실동률 × 공수가동율 (전체 공수 활용도)'),
   ('설비부동률','설비부동 ÷ 순투입',f"={S}!G{T}",f"={S}!E{T}",'순투입 공수 중 설비 고장·이상으로 손실된 비율')]
for i,(a,b,c,d,e) in enumerate(m,6):
    ws.cell(i,1,a).font=BB; ws.cell(i,2,b); ws.cell(i,3,c); ws.cell(i,4,d)
    ws.cell(i,5,f'=IFERROR(C{i}/D{i},0)'); ws.cell(i,6,e)
    ws.cell(i,3).number_format=ws.cell(i,4).number_format='#,##0.0'
    ws.cell(i,5).number_format='0.0%'; ws.cell(i,5).font=BB; ws.cell(i,5).fill=KF
box(6,9,1,6)
# 공수 흐름
ws['A11']='공수 흐름 (7월 직접 합계)'; ws['A11'].font=Font(name=F,bold=True)
hdr(12,['항목','공수','비고'])
fl=[('공정공수',f"={S}!C{T}",'투입 가능 공수'),('(−) 실동부동',f"={S}!D{T}",'교육·노조·행사 등'),('순투입공수',f"={S}!E{T}",''),
    ('(−) 작업중 손실부동',f"={S}!F{T}",'그중 설비부동 '),('순작업공수',f"={S}!H{T}",'')]
for i,(a,b,c) in enumerate(fl,13):
    ws.cell(i,1,a); ws.cell(i,2,b).number_format='#,##0.0'; ws.cell(i,3,c)
    if a in('순투입공수','순작업공수'): ws.cell(i,1).font=BB; ws.cell(i,2).font=BB
ws['C16']=f'="그중 설비부동 "&TEXT({S}!G{T},"#,##0.0")'
box(13,17,1,3)
# 2. 일자별
r0=20
ws.cell(r0,1,'2. 일자별 가동율 4개 항목').font=Font(name=F,bold=True,size=12)
hdr(r0+1,['일자','근무형태','실동률\n(순투입/공정)','공수가동율\n(순작업/순투입)','종합효율\n(순작업/공정)','설비부동률\n(설비/순투입)'])
ws.row_dimensions[r0+1].height=32
first=r0+2
for k in range(31):
    r=first+k; sr=5+k
    import datetime; dt=datetime.date(2026,7,1+k); ws.cell(r,1,dt.strftime('%m/%d')+'('+'월화수목금토일'[dt.weekday()]+')')
    ws.cell(r,2,f'={S}!B{sr}')
    ws.cell(r,3,f'=IFERROR({S}!E{sr}/{S}!C{sr},0)')
    ws.cell(r,4,f'=IFERROR({S}!H{sr}/{S}!E{sr},0)')
    ws.cell(r,5,f'=IFERROR({S}!H{sr}/{S}!C{sr},0)')
    ws.cell(r,6,f'=IFERROR({S}!G{sr}/{S}!E{sr},0)')
last=first+30
stats=[('7월 누계(가중)',None),('일평균(단순)','AVERAGE'),('최고','MAX'),('최저','MIN')]
for j,(lab,fn) in enumerate(stats,1):
    r=last+j; ws.cell(r,1,lab).font=BB; ws.cell(r,1).fill=KF; ws.cell(r,2).fill=KF
    for c,col in zip(range(3,7),'CDEF'):
        v=f'=E{6+c-3}' if fn is None else f'={fn}({col}{first}:{col}{last})'
        x=ws.cell(r,c,v); x.font=BB; x.fill=KF
for r in range(first,last+5):
    for c in range(3,7): ws.cell(r,c).number_format='0.0%'
box(first,last+4,1,6)
for col in 'CDE':
    ws.conditional_formatting.add(f'{col}{first}:{col}{last}',ColorScaleRule(start_type='min',start_color='F8696B',mid_type='percentile',mid_value=50,mid_color='FFEB84',end_type='max',end_color='63BE7B'))
ws.conditional_formatting.add(f'F{first}:F{last}',ColorScaleRule(start_type='min',start_color='63BE7B',mid_type='percentile',mid_value=50,mid_color='FFEB84',end_type='max',end_color='F8696B'))
ws.cell(last+6,1,'※ 누계(가중)는 공수 합계로 계산한 월 값이며 1번 표와 같음. 일평균(단순)은 일별 비율의 산술평균. 7/31 저조: 임금협상 투표(실동부동) + 생산부동 64.').font=Font(name=F,italic=True,color='595959')
# chart
ch=BarChart(); ch.type='col'; ch.grouping='clustered'; ch.gapWidth=60; ch.overlap=0; ch.title='일자별 가동율'; ch.height=10; ch.width=30
ch.y_axis.number_format='0%'; ch.y_axis.scaling.min=0; ch.y_axis.scaling.max=1
ch.add_data(Reference(ws,min_col=3,max_col=5,min_row=r0+1,max_row=last),titles_from_data=True)
ch.set_categories(Reference(ws,min_col=1,min_row=first,max_row=last))
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties
for sr,col in zip(ch.series,['1F4E78','ED7D31','70AD47']):
    sr.graphicalProperties=GraphicalProperties(solidFill=col,ln=LineProperties(solidFill=col))
ch.legend.position='b'; ch.x_axis.tickLblSkip=2; ch.x_axis.delete=False; ch.y_axis.delete=False
ch.y_axis.majorGridlines=ch.y_axis.majorGridlines
ws.add_chart(ch,'H20')
for c,w in zip('ABCDEF',[16,20,14,15,14,48]): ws.column_dimensions[c].width=w
ws.freeze_panes='A4'
wb.active=0
wb.save(p)

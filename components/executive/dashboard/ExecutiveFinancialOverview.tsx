"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, FileCheck2, WalletCards } from "lucide-react";
import { getMockExecutiveFinancialOverview } from "@/lib/mock-data/executive-financial-overview";

type Period = "monthly" | "quarterly";
type Overview = ReturnType<typeof getMockExecutiveFinancialOverview>;
type Point = Overview["monthly"][number];

const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2 }).format(value);
const compact = (value: number) => new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function Metric({ title, amount, percent, color, icon: Icon }: { title: string; amount: number; percent: string; color: string; icon: typeof WalletCards }) {
  return <article className="relative overflow-hidden rounded-2xl border border-[#e9e3dc] bg-[#fffefd] px-5 py-3 pl-6 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:px-6 sm:py-4 sm:pl-7"><div className="flex items-center gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-full text-white sm:size-14" style={{ backgroundColor: color }}><Icon size={27} strokeWidth={1.7} /></span><div className="min-w-0 space-y-1"><p className="text-base font-medium leading-tight text-slate-700">{title}</p><p className="truncate text-[20px] font-semibold leading-tight text-slate-800">{money(amount)}</p><p className="text-sm leading-tight text-slate-500"><span className="mr-2 text-xl font-semibold" style={{ color }}>{percent}</span>ของเงินทั้งหมดในระบบ</p></div></div><span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} /></article>;
}

export default function ExecutiveFinancialOverview() {
  const [data, setData] = useState<Overview>(() => getMockExecutiveFinancialOverview());
  const [period, setPeriod] = useState<Period>("monthly");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/executive/financial-overview", { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load financial overview"); return response.json() as Promise<{ data: Overview }>; })
      .then(({ data: overview }) => setData(overview))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) console.error(error); });
    return () => controller.abort();
  }, []);

  const points = useMemo<Point[]>(() => {
    if (period === "monthly") return data.monthly;
    return [0, 1, 2, 3].map((quarter) => data.monthly.slice(quarter * 3, quarter * 3 + 3).reduce<Point>((total, point) => ({ label: `ไตรมาส ${quarter + 1}`, loans: total.loans + point.loans, repayments: total.repayments + point.repayments, loanCount: total.loanCount + point.loanCount, repaymentCount: total.repaymentCount + point.repaymentCount }), { label: `ไตรมาส ${quarter + 1}`, loans: 0, repayments: 0, loanCount: 0, repaymentCount: 0 }));
  }, [data, period]);

  const balancePercent = data.fundBalance / data.totalSystem * 100;
  const approvedPercent = data.approvedAmount / data.totalSystem * 100;
  const max = Math.max(1, ...points.flatMap((point) => [point.loans, point.repayments]));
  const active = hoveredIndex === null ? null : points[hoveredIndex];
  const tooltipLeft = `${((hoveredIndex ?? 0) + .5) / points.length * 100}%`;

  return <section aria-label="รายงานและสถิติทางการเงิน" className="space-y-6 font-[family-name:var(--font-kanit)]">
    <div className="grid gap-5 lg:grid-cols-3"><Metric title="เงินทั้งหมดในระบบ" amount={data.totalSystem} percent="100%" color="#f75c12" icon={WalletCards} /><Metric title="เงินคงเหลือในระบบ" amount={data.fundBalance} percent={`${balancePercent.toFixed(2)}%`} color="#3f8a58" icon={CircleDollarSign} /><Metric title="เงินที่อนุมัติไป" amount={data.approvedAmount} percent={`${approvedPercent.toFixed(2)}%`} color="#ffad16" icon={FileCheck2} /></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(290px,.78fr)_minmax(0,1.65fr)]">
      <article className="rounded-2xl border border-[#e9e3dc] bg-[#fffefd] p-5 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold text-slate-800">สัดส่วนเงินในระบบ</h3><UpdatedAt value={data.updatedAt} /></div><div className="mx-auto mt-7 grid max-w-[290px] place-items-center"><div className="relative grid size-56 place-items-center rounded-full" style={{ background: `conic-gradient(#3f8a58 0 ${balancePercent}%, #ffad16 ${balancePercent}% 100%)` }}><span className="absolute left-[17%] top-[31%] text-sm font-semibold text-white drop-shadow-sm">{balancePercent.toFixed(1)}%</span><span className="absolute bottom-[25%] right-[13%] text-sm font-semibold text-white drop-shadow-sm">{approvedPercent.toFixed(1)}%</span><div className="flex size-28 flex-col items-center justify-center rounded-full bg-[#fffefd] text-center shadow-inner"><span className="text-sm font-semibold text-slate-700">ภาพรวมเงินทุน</span><span className="text-xs text-slate-500">ปี {data.year}</span></div></div></div><div className="mt-7 space-y-3 border-t border-[#eee8e2] pt-5 text-sm"><Legend color="#3f8a58" label="เงินคงเหลือในระบบ" amount={data.fundBalance} /><Legend color="#ffad16" label="เงินที่อนุมัติไป" amount={data.approvedAmount} /></div></article>
      <article className="rounded-2xl border border-[#e9e3dc] bg-[#fffefd] p-5 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-800">ยอดการกู้ยืมและการคืนเงิน</h3><UpdatedAt value={data.updatedAt} /></div><div className="flex rounded-lg bg-[#f4f0ec] p-1 text-sm font-medium"><button type="button" onClick={() => setPeriod("monthly")} className={`rounded-md px-3 py-1.5 ${period === "monthly" ? "bg-[#f75c12] text-white shadow-sm" : "text-slate-600"}`}>รายเดือน</button><button type="button" onClick={() => setPeriod("quarterly")} className={`rounded-md px-3 py-1.5 ${period === "quarterly" ? "bg-[#f75c12] text-white shadow-sm" : "text-slate-600"}`}>รายไตรมาส</button></div></div><div className="mt-5 flex gap-5 text-sm text-slate-600"><span><i className="mr-2 inline-block size-3 rounded-sm bg-[#f75c12]" />ยอดการกู้ยืม</span><span><i className="mr-2 inline-block size-3 rounded-sm bg-[#ffad16]" />ยอดการคืนเงิน</span></div><div className="mt-5 grid h-64 grid-cols-[auto_1fr] gap-3 sm:h-72"><div className="flex flex-col justify-between pb-7 text-xs text-slate-500"><span>{compact(max)}</span><span>{compact(max * .75)}</span><span>{compact(max * .5)}</span><span>{compact(max * .25)}</span><span>0</span></div><div className="relative grid grid-rows-[1fr_auto]"><div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">{[0, 1, 2, 3].map((line) => <span key={line} className="border-t border-[#eee8e2]" />)}</div><div className="relative flex items-end justify-around gap-1 border-b border-[#e5ddd5] px-1 pt-3">{points.map((point, index) => <div key={point.label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-1.5"><Pole color="#f75c12" height={point.loans / max * 100} label={`${point.label}: ยอดการกู้ยืม ${money(point.loans)}`} onEnter={() => setHoveredIndex(index)} onLeave={() => setHoveredIndex(null)} /><Pole color="#ffad16" height={point.repayments / max * 100} label={`${point.label}: ยอดการคืนเงิน ${money(point.repayments)}`} onEnter={() => setHoveredIndex(index)} onLeave={() => setHoveredIndex(null)} /></div>)}</div><div className="grid" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>{points.map((point) => <span key={point.label} className="mt-2 text-center text-[10px] text-slate-600 sm:text-xs">{point.label}</span>)}</div>{active && <div className="pointer-events-none absolute top-3 z-10 w-52 -translate-x-1/2 rounded-xl border border-[#e5ddd5] bg-white p-4 shadow-lg" style={{ left: tooltipLeft }}><p className="font-semibold text-slate-800">{active.label} {data.year}</p><Tooltip color="#f75c12" label="ยอดการกู้ยืม" amount={active.loans} count={active.loanCount} /><Tooltip color="#ffad16" label="ยอดการคืนเงิน" amount={active.repayments} count={active.repaymentCount} /></div>}</div></div><div className="mt-6 grid gap-3 border-t border-[#eee8e2] pt-5 text-center sm:grid-cols-3"><Summary label="รวมยอดการกู้ยืมทั้งปี" value={money(data.totalLoans)} detail={`จำนวนรายการ ${data.totalLoanCount} รายการ`} /><Summary label="รวมยอดการคืนเงินทั้งปี" value={money(data.totalRepayments)} detail={`จำนวนรายการ ${data.totalRepaymentCount} รายการ`} /><Summary label="อัตราการคืนเงินเฉลี่ยทั้งปี" value={`${(data.totalRepayments / data.totalLoans * 100).toFixed(2)}%`} detail="ของยอดการกู้ยืม" orange /></div></article>
    </div>
  </section>;
}

function UpdatedAt({ value }: { value: string }) { return <p className="text-xs text-slate-400">อัปเดตล่าสุด {value}</p>; }
function Pole({ color, height, label, onEnter, onLeave }: { color: string; height: number; label: string; onEnter: () => void; onLeave: () => void }) { return <button type="button" aria-label={label} onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave} className="w-2 rounded-t outline-none focus-visible:ring-2 focus-visible:ring-[#3f8a58] sm:w-3" style={{ height: `${height}%`, backgroundColor: color }} />; }
function Legend({ color, label, amount }: { color: string; label: string; amount: number }) { return <div className="grid grid-cols-[10px_1fr_auto] items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-slate-600">{label}</span><span className="font-medium text-slate-800">{money(amount)}</span></div>; }
function Tooltip({ color, label, amount, count }: { color: string; label: string; amount: number; count: number }) { return <div className="mt-3 border-l-4 pl-3" style={{ borderColor: color }}><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-semibold text-slate-800">{money(amount)}</p><p className="text-xs text-slate-500">จำนวนรายการ {count} รายการ</p></div>; }
function Summary({ label, value, detail, orange = false }: { label: string; value: string; detail: string; orange?: boolean }) { return <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-base font-semibold ${orange ? "text-[#f75c12]" : "text-slate-800"}`}>{value}</p><p className="text-xs text-slate-500">{detail}</p></div>; }

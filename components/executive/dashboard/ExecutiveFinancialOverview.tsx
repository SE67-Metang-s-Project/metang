"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleDollarSign, FileCheck2, WalletCards } from "lucide-react";
import type { ExecutiveFinancialOverviewData } from "@/lib/financial-overview-types";

type Period = "monthly" | "quarterly";
type Overview = ExecutiveFinancialOverviewData;

type Point = Overview["monthly"][number];

const money = (value: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  );
const compact = (value: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function Metric({
  title,
  amount,
  percent,
  color,
  icon: Icon,
}: {
  title: string;
  amount: number;
  percent: string;
  color: string;
  icon: typeof WalletCards;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#e9e3dc] bg-[#fffefd] px-5 py-3 pl-6 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:px-6 sm:py-4 sm:pl-7">
      <div className="flex items-center gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-white sm:size-14"
          style={{ backgroundColor: color }}
        >
          <Icon size={27} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-base font-medium leading-tight text-slate-700">{title}</p>
          <p className="truncate text-[20px] font-semibold leading-tight text-slate-800">
            {money(amount)}
          </p>
          <p className="text-sm leading-tight text-slate-500">
            <span
              className="block text-xl font-semibold min-[1333px]:inline min-[1333px]:mr-2"
              style={{ color }}
            >
              {percent}
            </span>
            ของเงินทั้งหมดในระบบ
          </p>
        </div>
      </div>
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
    </article>
  );
}

type ExecutiveFinancialOverviewProps = {
  initialData?: Overview;
};

export default function ExecutiveFinancialOverview({
  initialData,
}: ExecutiveFinancialOverviewProps = {}) {
  const [data, setData] = useState<Overview | null>(initialData ?? null);

  const [period, setPeriod] = useState<Period>("monthly");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [pieTooltipPosition, setPieTooltipPosition] = useState({ x: 150, y: 150 });
  const pieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) return;

    const controller = new AbortController();
    fetch("/api/executive/financial-overview", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load financial overview");
        return response.json() as Promise<{ data: Overview }>;
      })
      .then(({ data: overview }) => setData(overview))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Failed to load financial overview from API", error);
        }
      });
    return () => controller.abort();
  }, [initialData]);

  const points = useMemo<Point[]>(() => {
    if (!data) return [];
    if (period === "monthly") return data.monthly;
    if (data.quarterly && data.quarterly.length === 4) return data.quarterly;
    return [0, 1, 2, 3].map((quarter) =>
      data.monthly.slice(quarter * 3, quarter * 3 + 3).reduce<Point>(
        (total, point) => ({
          label: `ไตรมาส ${quarter + 1}`,
          loans: total.loans + point.loans,
          repayments: total.repayments + point.repayments,
          loanCount: total.loanCount + point.loanCount,
          repaymentCount: total.repaymentCount + point.repaymentCount,
          transferredCount: total.transferredCount + point.transferredCount,
          rejectedCount: total.rejectedCount + point.rejectedCount,
          cancelledCount: total.cancelledCount + point.cancelledCount,
        }),
        {
          label: `ไตรมาส ${quarter + 1}`,
          loans: 0,
          repayments: 0,
          loanCount: 0,
          repaymentCount: 0,
          transferredCount: 0,
          rejectedCount: 0,
          cancelledCount: 0,
        },
      ),
    );
  }, [data, period]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-[#e9e3dc] bg-white p-8 text-center text-slate-500 font-[family-name:var(--font-kanit)]">
        กำลังโหลดข้อมูลรายงานและสถิติทางการเงิน...
      </div>
    );
  }

  const balancePercent = data.totalSystem > 0 ? (data.fundBalance / data.totalSystem) * 100 : 0;
  const approvedPercent =
    data.totalSystem > 0 ? (data.approvedAmount / data.totalSystem) * 100 : 0;

  const pieDetails = [
    {
      label: "เงินคงเหลือในระบบ",
      amount: data.fundBalance,
      percent: balancePercent,
      color: "#3f8a58",
    },
    {
      label: "เงินที่อนุมัติไป",
      amount: data.approvedAmount,
      percent: approvedPercent,
      color: "#ffad16",
    },
  ];
  const max = Math.max(1, ...points.flatMap((point) => [point.loans, point.repayments]));
  const active = hoveredIndex === null ? null : points[hoveredIndex];
  const tooltipLeft = `${(((hoveredIndex ?? 0) + 0.5) / points.length) * 100}%`;

  return (
    <section
      aria-label="รายงานและสถิติทางการเงิน"
      className="financial-overview space-y-6 font-[family-name:var(--font-kanit)]"
    >
      <style>{`.financial-overview .text-xs, .financial-overview [class~="text-[10px]"] { font-size: 0.875rem; line-height: 1.25rem; }
      .financial-overview > div:nth-of-type(2) > article:first-child > div:nth-child(2) > div > span:nth-child(1) { transform: translateX(6px); font-size: 1rem; }
      .financial-overview > div:nth-of-type(2) > article:first-child > div:nth-child(2) > div > span:nth-child(2) { transform: translateX(-6px); font-size: 1rem; }`}</style>
      <div className="grid gap-5 lg:grid-cols-3">
        <Metric
          title="เงินทั้งหมดในระบบ"
          amount={data.totalSystem}
          percent="100%"
          color="#f75c12"
          icon={WalletCards}
        />
        <Metric
          title="เงินคงเหลือในระบบ"
          amount={data.fundBalance}
          percent={`${balancePercent.toFixed(2)}%`}
          color="#3f8a58"
          icon={CircleDollarSign}
        />
        <Metric
          title="เงินที่อนุมัติไป"
          amount={data.approvedAmount}
          percent={`${approvedPercent.toFixed(2)}%`}
          color="#ffad16"
          icon={FileCheck2}
        />
      </div>
      <div className="grid gap-5 min-[1363px]:grid-cols-[minmax(290px,.78fr)_minmax(0,1.65fr)]">
        <article className="flex flex-col rounded-2xl border border-[#e9e3dc] bg-[#fffefd] p-5 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">สัดส่วนเงินในระบบ</h3>
            <UpdatedAt value={data.updatedAt} />
          </div>
          <div className="mx-auto mt-7 w-full max-w-[360px]">
            <div
              ref={pieRef}
              className="relative grid aspect-square w-full max-w-[300px] place-items-center mx-auto rounded-full"
              style={{
                background: `conic-gradient(#3f8a58 0 ${balancePercent}%, #ffad16 ${balancePercent}% 100%)`,
              }}
            >
              <span className="absolute bottom-[22%] right-[10%] text-lg font-semibold text-white drop-shadow-sm">
                {balancePercent.toFixed(2)}%
              </span>
              <span className="absolute left-[8%] top-[30%] text-lg font-semibold text-white drop-shadow-sm">
                {approvedPercent.toFixed(2)}%
              </span>
              <div className="pointer-events-none flex size-[60%] flex-col items-center justify-center rounded-full bg-[#fffefd] text-center shadow-inner">
                <span className="text-sm font-semibold text-slate-700 sm:text-base">
                  ภาพรวมเงินทุน
                </span>
                <span className="text-xs text-slate-500 sm:text-sm">ปี {data.year}</span>
              </div>
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 size-full outline-none"
                aria-label="สัดส่วนเงินในระบบ"
                onMouseMove={(event) => {
                  const rect = pieRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = ((event.clientX - rect.left) / rect.width) * 100;
                  const y = ((event.clientY - rect.top) / rect.height) * 100;
                  const radius = Math.hypot(x - 50, y - 50);
                  if (radius < 30.5 || radius > 50) {
                    setHoveredPieIndex(null);
                    return;
                  }
                  const percentage =
                    (((Math.atan2(y - 50, x - 50) * 180) / Math.PI + 450) % 360) / 3.6;
                  const detailWidth = Math.min(256, rect.width - 16);
                  const tooltipX = Math.min(
                    Math.max(event.clientX - rect.left, detailWidth / 2 + 8),
                    rect.width - detailWidth / 2 - 8,
                  );
                  setHoveredPieIndex(percentage < balancePercent ? 0 : 1);
                  setPieTooltipPosition({ x: tooltipX, y: event.clientY - rect.top });
                }}
                onMouseLeave={() => setHoveredPieIndex(null)}
              />
              {hoveredPieIndex !== null && (
                <div
                  className="pointer-events-none absolute z-10 w-64 max-w-[calc(100vw-3rem)] rounded-xl bg-white p-4 shadow-lg"
                  style={{
                    left: pieTooltipPosition.x,
                    top: pieTooltipPosition.y,
                    transform: "translate(-50%, -110%)",
                  }}
                >
                  <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                    {pieDetails[hoveredPieIndex].label}
                  </p>
                  <p
                    className="mt-1 text-base font-semibold"
                    style={{ color: pieDetails[hoveredPieIndex].color }}
                  >
                    {money(pieDetails[hoveredPieIndex].amount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    คิดเป็น {pieDetails[hoveredPieIndex].percent.toFixed(2)}% ของเงินทั้งหมดในระบบ
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-auto space-y-3 border-t border-[#eee8e2] pt-5 text-sm">
            <Legend
              color="#f75c12"
              label="เงินทั้งหมดในระบบ"
              amount={data.totalSystem}
              percent={100}
            />
            <Legend
              color="#3f8a58"
              label="เงินคงเหลือในระบบ"
              amount={data.fundBalance}
              percent={balancePercent}
            />
            <Legend
              color="#ffad16"
              label="เงินที่อนุมัติไป"
              amount={data.approvedAmount}
              percent={approvedPercent}
            />
          </div>
        </article>
        <article className="rounded-2xl border border-[#e9e3dc] bg-[#fffefd] p-5 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                ยอดการกู้ยืมและการคืนเงินประจำปี {data.year}
              </h3>
              <UpdatedAt value={data.updatedAt} />
            </div>
            <div className="flex rounded-lg bg-[#f4f0ec] p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`rounded-md px-3 py-1.5 ${period === "monthly" ? "bg-[#f75c12] text-white shadow-sm" : "text-slate-600"}`}
              >
                รายเดือน
              </button>
              <button
                type="button"
                onClick={() => setPeriod("quarterly")}
                className={`rounded-md px-3 py-1.5 ${period === "quarterly" ? "bg-[#f75c12] text-white shadow-sm" : "text-slate-600"}`}
              >
                รายไตรมาส
              </button>
            </div>
          </div>
          <div className="mt-5 flex gap-5 text-sm text-slate-600">
            <span>
              <i className="mr-2 inline-block size-3 rounded-sm bg-[#3f8a58]" />
              ยอดการกู้ยืม
            </span>
            <span>
              <i className="mr-2 inline-block size-3 rounded-sm bg-[#1e5484]" />
              ยอดการคืนเงิน
            </span>
          </div>
          <div className="mt-5 grid h-64 grid-cols-[auto_1fr] gap-3 sm:h-72">
            <div className="flex flex-col justify-between pb-7 text-xs text-slate-500">
              <span>{compact(max)}</span>
              <span>{compact(max * 0.75)}</span>
              <span>{compact(max * 0.5)}</span>
              <span>{compact(max * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="relative grid grid-rows-[1fr_auto]">
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
                {[0, 1, 2, 3].map((line) => (
                  <span key={line} className="border-t border-[#eee8e2]" />
                ))}
              </div>
              <div className="relative flex items-end justify-around gap-1 border-b border-[#e5ddd5] px-1 pt-3">
                {points.map((point, index) => (
                  <div
                    key={point.label}
                    className="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-1.5"
                  >
                    <Pole
                      color="#3f8a58"
                      height={(point.loans / max) * 100}
                      label={`${point.label}: ยอดการกู้ยืม ${money(point.loans)}`}
                      onEnter={() => setHoveredIndex(index)}
                      onLeave={() => setHoveredIndex(null)}
                    />
                    <Pole
                      color="#1e5484"
                      height={(point.repayments / max) * 100}
                      label={`${point.label}: ยอดการคืนเงิน ${money(point.repayments)}`}
                      onEnter={() => setHoveredIndex(index)}
                      onLeave={() => setHoveredIndex(null)}
                    />
                  </div>
                ))}
              </div>
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
              >
                {points.map((point) => (
                  <span
                    key={point.label}
                    className="mt-2 text-center text-[10px] text-slate-600 sm:text-xs"
                  >
                    {point.label}
                  </span>
                ))}
              </div>
              {active && (
                <div
                  className="pointer-events-none absolute top-3 z-10 w-52 -translate-x-1/2 rounded-xl border border-[#e5ddd5] bg-white p-4 shadow-lg"
                  style={{ left: tooltipLeft }}
                >
                  <p className="font-semibold text-slate-800">
                    {active.label} {data.year}
                  </p>
                  <Tooltip
                    color="#3f8a58"
                    label="ยอดการกู้ยืม"
                    amount={active.loans}
                    count={active.loanCount}
                  />
                  <Tooltip
                    color="#0e2a6e"
                    label="ยอดการคืนเงิน"
                    amount={active.repayments}
                    count={active.repaymentCount}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-[#eee8e2] pt-5 text-center sm:grid-cols-3">
            <Summary
              label="รวมยอดการกู้ยืมทั้งปี"
              value={money(data.totalLoans)}
              detail={`จำนวนรายการ ${data.totalLoanCount} รายการ`}
            />
            <Summary
              label="รวมยอดการคืนเงินทั้งปี"
              value={money(data.totalRepayments)}
              detail={`จำนวนรายการ ${data.totalRepaymentCount} รายการ`}
            />
            <Summary
              label="อัตราการคืนเงินเฉลี่ยทั้งปี"
              value={`${data.totalLoans > 0 ? ((data.totalRepayments / data.totalLoans) * 100).toFixed(2) : "0.00"}%`}
              detail="ของยอดการกู้ยืม"
              green
            />
          </div>
        </article>
      </div>
      <TransferredRequestsChart
        year={data.year}
        updatedAt={data.updatedAt}
        requests={data.monthly.map(
          ({ label, transferredCount, rejectedCount, cancelledCount }) => ({
            label,
            transferredCount,
            rejectedCount,
            cancelledCount,
          }),
        )}
      />
    </section>
  );
}

function TransferredRequestsChart({
  year,
  updatedAt,
  requests,
}: {
  year: number;
  updatedAt: string;
  requests: Array<{
    label: string;
    transferredCount: number;
    rejectedCount: number;
    cancelledCount: number;
  }>;
}) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const points = useMemo(() => {
    if (period === "monthly") return requests;

    return [0, 1, 2, 3].map((quarter) =>
      requests.slice(quarter * 3, quarter * 3 + 3).reduce(
        (total, request) => ({
          label: `ไตรมาส ${quarter + 1}`,
          transferredCount: total.transferredCount + request.transferredCount,
          rejectedCount: total.rejectedCount + request.rejectedCount,
          cancelledCount: total.cancelledCount + request.cancelledCount,
        }),
        {
          label: `ไตรมาส ${quarter + 1}`,
          transferredCount: 0,
          rejectedCount: 0,
          cancelledCount: 0,
        },
      ),
    );
  }, [period, requests]);
  const max = Math.max(
    1,
    ...points.flatMap((request) => [
      request.transferredCount,
      request.rejectedCount,
      request.cancelledCount,
    ]),
  );
  const totals = points.reduce(
    (sum, request) => ({
      transferredCount: sum.transferredCount + request.transferredCount,
      rejectedCount: sum.rejectedCount + request.rejectedCount,
      cancelledCount: sum.cancelledCount + request.cancelledCount,
    }),
    { transferredCount: 0, rejectedCount: 0, cancelledCount: 0 },
  );
  const active = hoveredIndex === null ? null : points[hoveredIndex];
  const tooltipLeft = `${(((hoveredIndex ?? 0) + 0.5) / points.length) * 100}%`;

  return (
    <article className="rounded-2xl border border-[#e9e3dc] bg-[#fffefd] p-5 shadow-[0_3px_14px_rgba(69,51,39,0.06)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">จำนวนคำร้องประจำปี {year}</h3>
          <UpdatedAt value={updatedAt} />
        </div>
        <div className="flex rounded-lg bg-[#f4f0ec] p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setPeriod("monthly");
              setHoveredIndex(null);
            }}
            className={`rounded-md px-3 py-1.5 ${period === "monthly" ? "bg-[#f75c12] text-white shadow-sm" : "text-slate-600"}`}
          >
            รายเดือน
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod("quarterly");
              setHoveredIndex(null);
            }}
            className={`rounded-md px-3 py-1.5 ${period === "quarterly" ? "bg-[#f75c12] text-white shadow-sm" : "text-slate-600"}`}
          >
            รายไตรมาส
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <span>
          <i className="mr-2 inline-block size-3 rounded-sm bg-[#ffad16]" />
          คำร้องที่โอนเงินแล้ว
        </span>
        <span>
          <i className="mr-2 inline-block size-3 rounded-sm bg-[#f75c12]" />
          คำร้องที่ไม่ผ่านการอนุมัติ
        </span>
        <span>
          <i className="mr-2 inline-block size-3 rounded-sm bg-[#dc2626]" />
          คำร้องที่ถูกยกเลิกโดยนักศึกษา
        </span>
      </div>

      <div className="mt-5 grid h-64 grid-cols-[auto_1fr] gap-3 sm:h-72">
        <div className="flex flex-col justify-between pb-7 text-xs text-slate-500">
          <span>{max}</span>
          <span>{Math.ceil(max * 0.75)}</span>
          <span>{Math.ceil(max * 0.5)}</span>
          <span>{Math.ceil(max * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="relative grid grid-rows-[1fr_auto]">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="border-t border-[#eee8e2]" />
            ))}
          </div>
          <div className="relative flex items-end justify-around gap-1 border-b border-[#e5ddd5] px-1 pt-3">
            {points.map((request, index) => (
              <div
                key={request.label}
                className="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-1.5"
              >
                <Pole
                  color="#ffad16"
                  height={(request.transferredCount / max) * 100}
                  label={`${request.label}: โอนเงินแล้ว ${request.transferredCount} คำร้อง`}
                  onEnter={() => setHoveredIndex(index)}
                  onLeave={() => setHoveredIndex(null)}
                />
                <Pole
                  color="#f75c12"
                  height={(request.rejectedCount / max) * 100}
                  label={`${request.label}: ไม่ผ่านการอนุมัติ ${request.rejectedCount} คำร้อง`}
                  onEnter={() => setHoveredIndex(index)}
                  onLeave={() => setHoveredIndex(null)}
                />
                <Pole
                  color="#dc2626"
                  height={(request.cancelledCount / max) * 100}
                  label={`${request.label}: ยกเลิกโดยนักศึกษา ${request.cancelledCount} คำร้อง`}
                  onEnter={() => setHoveredIndex(index)}
                  onLeave={() => setHoveredIndex(null)}
                />
              </div>
            ))}
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          >
            {points.map((request) => (
              <span
                key={request.label}
                className="mt-2 text-center text-[10px] text-slate-600 sm:text-xs"
              >
                {request.label}
              </span>
            ))}
          </div>
          {active && (
            <div
              className="pointer-events-none absolute top-3 z-10 w-[264px] -translate-x-1/2 rounded-xl border border-[#e5ddd5] bg-white p-4 shadow-lg"
              style={{ left: tooltipLeft }}
            >
              <p className="font-semibold text-slate-800">
                {active.label} {year}
              </p>
              <RequestTooltip
                color="#ffad16"
                label="คำร้องที่โอนเงินแล้ว"
                count={active.transferredCount}
              />
              <RequestTooltip
                color="#f75c12"
                label="คำร้องที่ไม่ผ่านการอนุมัติ"
                count={active.rejectedCount}
              />
              <RequestTooltip
                color="#dc2626"
                label="คำร้องที่ถูกยกเลิกโดยนักศึกษา"
                count={active.cancelledCount}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-t border-[#eee8e2] pt-5 text-center sm:grid-cols-3">
        <Summary label="รวมคำร้องที่โอนเงินแล้ว" value={`${totals.transferredCount} คำร้อง`} />
        <Summary label="รวมคำร้องที่ไม่ผ่านการอนุมัติ" value={`${totals.rejectedCount} คำร้อง`} />
        <Summary
          label="รวมคำร้องที่ถูกยกเลิกโดยนักศึกษา"
          value={`${totals.cancelledCount} คำร้อง`}
        />
      </div>
    </article>
  );
}

function UpdatedAt({ value }: { value: string }) {
  return <p className="text-xs text-slate-400">อัปเดตล่าสุด {value}</p>;
}
function Pole({
  color,
  height,
  label,
  onEnter,
  onLeave,
}: {
  color: string;
  height: number;
  label: string;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="w-2 rounded-t outline-none focus-visible:ring-2 focus-visible:ring-[#3f8a58] sm:w-3"
      style={{ height: `${height}%`, backgroundColor: color }}
    />
  );
}
function Legend({
  color,
  label,
  amount,
  percent,
}: {
  color: string;
  label: string;
  amount: number;
  percent?: number;
}) {
  return (
    <div className="grid grid-cols-[10px_1fr_auto] items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-800">
        {money(amount)}
        {percent !== undefined && ` (${percent.toFixed(2)}%)`}
      </span>
    </div>
  );
}
function Tooltip({
  color,
  label,
  amount,
  count,
}: {
  color: string;
  label: string;
  amount: number;
  count: number;
}) {
  return (
    <div className="mt-3 border-l-4 pl-3" style={{ borderColor: color }}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{money(amount)}</p>
      <p className="text-xs text-slate-500">จำนวนรายการ {count} รายการ</p>
    </div>
  );
}

function RequestTooltip({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <p className="mt-2 border-l-4 pl-3 text-sm text-slate-500" style={{ borderColor: color }}>
      <span className="block">{label}</span>
      <span className="mt-1 block font-semibold text-slate-800">{count} คำร้อง</span>
    </p>
  );
}

function Summary({
  label,
  value,
  detail,
  orange = false,
  green = false,
}: {
  label: string;
  value: string;
  detail?: string;
  orange?: boolean;
  green?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-base font-semibold ${green ? "text-[#3f8a58]" : orange ? "text-[#f75c12]" : "text-slate-800"}`}
      >
        {value}
      </p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Landmark, ReceiptText, UploadCloud, X } from "lucide-react";
import type { InstallmentPayment, PaymentAccount } from "@/app/student/studentMockData";

type PaymentModalProps = {
  installment: InstallmentPayment;
  account: PaymentAccount;
  onClose: () => void;
  onConfirm: () => void;
};

type PaymentFormField = "receipt" | "transferDate" | "transferTime" | "transferAmount";
type PaymentFormErrors = Partial<Record<PaymentFormField, string>>;

const thaiWeekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const requiredFieldMessage = "โปรดระบุข้อมูลในช่องนี้";
const requiredPaymentFields: PaymentFormField[] = ["receipt", "transferDate", "transferTime", "transferAmount"];
const maxReceiptFileSize = 500 * 1024;

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function PaymentModal({ installment, account, onClose, onConfirm }: PaymentModalProps) {
  const [isQrSaveNoticeOpen, setIsQrSaveNoticeOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [receiptPreview, setReceiptPreview] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => String(new Date().getHours()).padStart(2, "0"));
  const [selectedMinute, setSelectedMinute] = useState(() => String(new Date().getMinutes()).padStart(2, "0"));
  const [hasSelectedTime, setHasSelectedTime] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [formErrors, setFormErrors] = useState<PaymentFormErrors>({});
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Partial<Record<PaymentFormField, HTMLElement | null>>>({});
  const calendarPickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const closePickersOnOutsidePress = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!calendarPickerRef.current?.contains(target)) setIsCalendarOpen(false);
      if (!timePickerRef.current?.contains(target)) setIsTimePickerOpen(false);
    };

    document.addEventListener("mousedown", closePickersOnOutsidePress);
    return () => document.removeEventListener("mousedown", closePickersOnOutsidePress);
  }, []);

  useEffect(() => {
    if (!isTimePickerOpen) return;

    const scrollSelectedOptionIntoView = (list: HTMLDivElement | null, value: string) => {
      const option = list?.querySelector<HTMLElement>(`[data-time-value="${value}"]`);

      if (!list || !option) return;

      list.scrollTo({
        top: option.offsetTop - (list.clientHeight - option.offsetHeight) / 2,
      });
    };

    scrollSelectedOptionIntoView(hourListRef.current, selectedHour);
    scrollSelectedOptionIntoView(minuteListRef.current, selectedMinute);
  }, [isTimePickerOpen, selectedHour, selectedMinute]);

  const formatThaiDate = (value: string) => {
    if (!value) return "เลือกวันที่";

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parseDateInputValue(value));
  };

  const formatThaiMonth = (date: Date) =>
    new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(date);

  const calendarFirstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const calendarDayCount = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: calendarFirstDay + calendarDayCount }, (_, index) => {
    const day = index - calendarFirstDay + 1;
    return day > 0 ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) : null;
  });

  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth(
      (currentMonth) => {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        return nextMonth > currentMonthStart ? currentMonthStart : nextMonth;
      },
    );
  };

  const selectTransferDate = (date: Date) => {
    if (toDateInputValue(date) > toDateInputValue(new Date())) return;

    setTransferDate(toDateInputValue(date));
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setIsCalendarOpen(false);
    setFormErrors((current) => ({ ...current, transferDate: "" }));
  };

  const validatePaymentForm = () => {
    const errors: PaymentFormErrors = {};

    if (!fileName) errors.receipt = requiredFieldMessage;
    if (!transferDate) errors.transferDate = requiredFieldMessage;
    if (!hasSelectedTime) errors.transferTime = requiredFieldMessage;
    if (!transferAmount || Number(transferAmount) <= 0) errors.transferAmount = requiredFieldMessage;

    return errors;
  };

  const handleConfirm = () => {
    const errors = validatePaymentForm();
    setFormErrors(errors);
    const firstInvalidField = requiredPaymentFields.find((field) => errors[field]);

    if (!firstInvalidField) {
      onConfirm();
      return;
    }

    window.requestAnimationFrame(() => {
      const field = fieldRefs.current[firstInvalidField];
      const modalBody = modalBodyRef.current;

      if (field && modalBody) {
        const fieldTop = field.getBoundingClientRect().top;
        const modalTop = modalBody.getBoundingClientRect().top;
        modalBody.scrollTo({
          top: modalBody.scrollTop + fieldTop - modalTop - 16,
          behavior: "smooth",
        });
      }

      field?.querySelector<HTMLElement>("input, button")?.focus();
    });
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      aria-label="หน้าต่างชำระเงิน"
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        aria-labelledby="payment-modal-title"
        aria-modal="true"
        className="relative flex h-[calc(100dvh-2rem)] min-h-0 w-full max-w-[500px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <button
          aria-label="ยกเลิกและปิดหน้าต่างชำระเงิน"
          className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:right-6"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>

        <header className="shrink-0 border-b border-gray-100 px-14 py-4 text-center sm:px-16">
          <h2 className="text-xl font-bold leading-tight text-gray-900" id="payment-modal-title">
            ชำระงวดที่ {installment.installmentNumber}
          </h2>
          <p className="mt-1 text-sm font-bold text-gray-600">ครบกำหนด {installment.dueDateLabel}</p>
        </header>

        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-5 sm:p-6"
          ref={modalBodyRef}
        >
          <section className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-black">ค้างชำระ</p>
            <strong className="text-2xl font-bold text-black">{installment.outstandingAmount} บาท</strong>
          </section>

          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-0 flex items-center gap-2 border-b border-gray-200 pb-3 text-lg font-bold text-gray-900">
              <Landmark aria-hidden="true" className="text-gray-400" size={21} />
              ข้อมูลบัญชีสำหรับชำระเงิน
            </h3>
            <dl className="text-sm">
              <div className="flex items-start justify-between gap-5 border-b border-gray-200 py-2.5">
                <dt className="shrink-0 text-gray-500">{account.bankLabel}</dt>
                <dd className="text-right font-medium text-gray-900">{account.bankName}</dd>
              </div>
              <div className="flex items-start justify-between gap-5 border-b border-gray-200 py-2.5">
                <dt className="shrink-0 text-gray-500">{account.accountNameLabel}</dt>
                <dd className="text-right font-medium text-gray-900">{account.accountName}</dd>
              </div>
              <div className="flex items-start justify-between gap-5 py-2.5">
                <dt className="shrink-0 text-gray-500">{account.accountNumberLabel}</dt>
                <dd className="break-all text-right font-medium text-gray-900">{account.accountNumber}</dd>
              </div>
            </dl>

            <div className="mt-4 text-center">
              <Image
                alt="QR Code สำหรับชำระเงิน"
                className="mx-auto h-auto w-full rounded-lg"
                height={300}
                src={account.qrImageSrc}
                width={300}
              />
              <a
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-orange-300 hover:bg-orange-50 active:border-orange-400 active:bg-orange-100"
                download="payment-qr-code"
                href={account.qrImageSrc}
                onClick={() => setIsQrSaveNoticeOpen(true)}
              >
                <Download
                  aria-hidden="true"
                  className="text-gray-400 transition-colors group-hover:text-orange-300 group-active:text-orange-400"
                  size={18}
                />
                บันทึกรูปภาพ
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              <ReceiptText aria-hidden="true" className="text-gray-400" size={21} />
              หลักฐานการโอนเงิน
            </h3>
            <div
              className={`group rounded-xl border-2 border-dashed text-center transition-colors ${
                formErrors.receipt
                  ? "border-red-400 bg-red-50 hover:border-orange-300 hover:bg-orange-50 active:border-orange-400 active:bg-orange-100"
                  : "border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 active:border-orange-400 active:bg-orange-100"
              }`}
              ref={(node) => {
                fieldRefs.current.receipt = node;
              }}
            >
              <button
                className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center p-5"
                onClick={() => receiptInputRef.current?.click()}
                type="button"
              >
                {receiptPreview ? (
                  <Image
                    alt="ตัวอย่างหลักฐานการโอนเงิน"
                    className="h-auto w-full rounded-lg object-contain"
                    height={160}
                    src={receiptPreview}
                    width={240}
                  />
                ) : (
                  <UploadCloud
                    aria-hidden="true"
                    className="text-gray-400 transition-colors group-hover:text-orange-300 group-active:text-orange-400"
                    size={32}
                  />
                )}
                <strong className={`${receiptPreview ? "mt-3" : "mt-2"} text-sm text-gray-800`}>
                  {receiptPreview ? "แตะเพื่ออัปโหลดรูปภาพใหม่" : "แตะเพื่ออัปโหลดหลักฐานการโอน"}
                </strong>
                <span className="mt-1 text-sm text-gray-500">
                  {receiptPreview ? fileName : "รองรับ JPG, PNG (สูงสุด 500 KB)"}
                </span>
              </button>
              <input
                accept=".jpg,.jpeg,.png"
                className="sr-only"
                id="payment-receipt-upload"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file && !["image/jpeg", "image/png"].includes(file.type)) {
                    setFormErrors((current) => ({ ...current, receipt: "กรุณาอัปโหลดไฟล์ JPG หรือ PNG" }));
                    event.target.value = "";
                    return;
                  }

                  if (file && file.size > maxReceiptFileSize) {
                    setFormErrors((current) => ({
                      ...current,
                      receipt: "ไฟล์รูปภาพต้องมีขนาดไม่เกิน 500 KB",
                    }));
                    event.target.value = "";
                    return;
                  }

                  setFileName(file?.name ?? "");
                  setFormErrors((current) => ({ ...current, receipt: "" }));

                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setReceiptPreview(String(reader.result));
                    reader.readAsDataURL(file);
                  } else {
                    setReceiptPreview("");
                  }
                }}
                ref={receiptInputRef}
                type="file"
              />
            </div>
            {formErrors.receipt ? <p className="mt-1.5 text-sm text-red-600">{formErrors.receipt}</p> : null}
          </section>

          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm mt-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <ReceiptText aria-hidden="true" className="text-gray-400" size={21} />
              รายละเอียดการโอนเงิน
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className="relative"
                ref={(node) => {
                  calendarPickerRef.current = node;
                  fieldRefs.current.transferDate = node;
                }}
              >
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  วันที่โอน
                </span>
                <button
                  aria-expanded={isCalendarOpen}
                  className={`flex h-11 w-full items-center justify-between rounded-lg border bg-white px-3 text-left text-sm transition-colors focus:outline-none ${
                    formErrors.transferDate
                      ? "border-red-400 text-red-700 focus:border-red-500"
                      : "border-gray-300 text-gray-800 hover:border-orange-300 focus:border-orange-400"
                  }`}
                  onClick={() => {
                    setIsCalendarOpen((open) => !open);
                    setIsTimePickerOpen(false);
                  }}
                  type="button"
                >
                  {formatThaiDate(transferDate)}
                  <ChevronDown aria-hidden="true" className="text-gray-400" size={18} />
                </button>
                {isCalendarOpen ? (
                  <div className="absolute bottom-full left-0 z-30 mb-2 w-[300px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        aria-label="เดือนก่อนหน้า"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                        onClick={() => changeCalendarMonth(-1)}
                        type="button"
                      >
                        <ChevronLeft aria-hidden="true" size={18} />
                      </button>
                      <strong className="text-sm text-gray-800">{formatThaiMonth(calendarMonth)}</strong>
                      <button
                        aria-label="เดือนถัดไป"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                        disabled={
                          calendarMonth.getFullYear() === new Date().getFullYear() &&
                          calendarMonth.getMonth() === new Date().getMonth()
                        }
                        onClick={() => changeCalendarMonth(1)}
                        type="button"
                      >
                        <ChevronRight aria-hidden="true" size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {thaiWeekdays.map((weekday) => (
                        <span className="py-1 font-medium text-gray-400" key={weekday}>
                          {weekday}
                        </span>
                      ))}
                      {calendarDays.map((date, index) => {
                        if (!date) return <span key={`empty-${index}`} />;

                        const value = toDateInputValue(date);
                        const isSelected = value === transferDate;
                        const isToday = value === toDateInputValue(new Date());
                        const isFuture = value > toDateInputValue(new Date());

                        return (
                          <button
                            aria-disabled={isFuture}
                            className={`rounded-lg py-1.5 transition-colors disabled:cursor-not-allowed disabled:text-gray-300 ${
                              isSelected
                                ? "border border-orange-300 bg-orange-50 font-bold text-orange-700"
                                : isToday
                                  ? "bg-gray-100 font-semibold text-gray-800 hover:bg-orange-50"
                                  : "text-gray-700 hover:bg-orange-50"
                            }`}
                            disabled={isFuture}
                            key={value}
                            onClick={() => selectTransferDate(date)}
                            type="button"
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {formErrors.transferDate ? (
                  <p className="mt-1.5 text-sm text-red-600">{formErrors.transferDate}</p>
                ) : null}
              </div>

              <div
                className="relative"
                ref={(node) => {
                  timePickerRef.current = node;
                  fieldRefs.current.transferTime = node;
                }}
              >
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  เวลาที่โอน
                </span>
                <button
                  aria-expanded={isTimePickerOpen}
                  className={`flex h-11 w-full items-center justify-between rounded-lg border bg-white px-3 text-left text-sm transition-colors focus:outline-none ${
                    formErrors.transferTime
                      ? "border-red-400 text-red-700 focus:border-red-500"
                      : "border-gray-300 text-gray-800 hover:border-orange-300 focus:border-orange-400"
                  }`}
                  onClick={() => {
                    setIsTimePickerOpen((open) => !open);
                    setIsCalendarOpen(false);
                  }}
                  type="button"
                >
                  {hasSelectedTime ? `${selectedHour}:${selectedMinute} น.` : "เลือกเวลา"}
                  <ChevronDown aria-hidden="true" className="text-gray-400" size={18} />
                </button>
                {isTimePickerOpen ? (
                  <div className="absolute bottom-full left-0 z-30 mb-2 grid w-[200px] grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="border-r border-gray-100">
                      <p className="border-b border-gray-100 bg-gray-50 px-2 py-2 text-center text-sm font-semibold text-gray-500">
                        ชั่วโมง
                      </p>
                      <div
                        className="max-h-44 touch-pan-y overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-1.5"
                        ref={hourListRef}
                        role="listbox"
                      >
                        <div className="py-16">
                          {Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0")).map((hour) => (
                            <button
                              aria-selected={selectedHour === hour}
                              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                selectedHour === hour
                                  ? "border border-orange-300 bg-orange-50 font-bold text-orange-700"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                              data-time-value={hour}
                              key={hour}
                            onClick={() => {
                              setSelectedHour(hour);
                              setHasSelectedTime(true);
                              setFormErrors((current) => ({ ...current, transferTime: "" }));
                              }}
                              role="option"
                              type="button"
                            >
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="border-b border-gray-100 bg-gray-50 px-2 py-2 text-center text-sm font-semibold text-gray-500">
                        นาที
                      </p>
                      <div
                        className="max-h-44 touch-pan-y overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-1.5"
                        ref={minuteListRef}
                        role="listbox"
                      >
                        <div className="py-16">
                          {Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0")).map((minute) => (
                            <button
                              aria-selected={selectedMinute === minute}
                              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                selectedMinute === minute
                                  ? "border border-orange-300 bg-orange-50 font-bold text-orange-700"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                              data-time-value={minute}
                              key={minute}
                            onClick={() => {
                              setSelectedMinute(minute);
                              setHasSelectedTime(true);
                              setFormErrors((current) => ({ ...current, transferTime: "" }));
                              }}
                              role="option"
                              type="button"
                            >
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {formErrors.transferTime ? (
                  <p className="mt-1.5 text-sm text-red-600">{formErrors.transferTime}</p>
                ) : null}
              </div>

              <label
                className="block sm:col-span-2"
                ref={(node) => {
                  fieldRefs.current.transferAmount = node;
                }}
              >
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  จำนวนเงินที่โอน
                </span>
                <span className="relative block">
                  <input
                    aria-invalid={Boolean(formErrors.transferAmount)}
                    className={`h-11 w-full rounded-lg border bg-white px-3 pr-12 text-sm outline-none transition-colors placeholder:text-gray-400 ${
                      formErrors.transferAmount
                        ? "border-red-400 text-red-700 focus:border-red-500"
                        : "border-gray-300 text-gray-800 focus:border-orange-400"
                    }`}
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => {
                      setTransferAmount(event.target.value);
                      setFormErrors((current) => ({ ...current, transferAmount: "" }));
                    }}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={transferAmount}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    บาท
                  </span>
                </span>
                {formErrors.transferAmount ? (
                  <span className="mt-1.5 block text-sm text-red-600">{formErrors.transferAmount}</span>
                ) : null}
              </label>
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700"
            onClick={handleConfirm}
            type="button"
          >
            ยืนยัน
          </button>
        </footer>
      </section>
      {isQrSaveNoticeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="qr-save-notice-title"
            aria-modal="true"
            className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl"
            role="alertdialog"
          >
            <h2 className="text-xl font-bold text-gray-900" id="qr-save-notice-title">
              บันทึกรูปภาพแล้ว
            </h2>
            <p className="mt-2 text-sm text-gray-600">ดาวน์โหลด QR Code สำหรับชำระงเงินสำเร็จ</p>
            <button
              className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => setIsQrSaveNoticeOpen(false)}
              type="button"
            >
              ตกลง
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

const thaiNumberWords = [
  "ศูนย์",
  "หนึ่ง",
  "สอง",
  "สาม",
  "สี่",
  "ห้า",
  "หก",
  "เจ็ด",
  "แปด",
  "เก้า",
];

function formatThaiInteger(value: number): string {
  if (value === 0) {
    return thaiNumberWords[0];
  }

  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  const digits = String(value).split("").map(Number);

  return digits
    .map((digit, index) => {
      if (digit === 0) {
        return "";
      }

      const position = digits.length - index - 1;
      if (position === 1 && digit === 1) {
        return "สิบ";
      }
      if (position === 1 && digit === 2) {
        return "ยี่สิบ";
      }
      if (position === 0 && digit === 1 && digits.length > 1) {
        return "เอ็ด";
      }

      return `${thaiNumberWords[digit]}${positions[position]}`;
    })
    .join("");
}

export function formatThaiBahtText(amount: string): string {
  const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numericAmount)) {
    return amount;
  }

  const baht = Math.floor(numericAmount);
  return `${formatThaiInteger(baht)}บาทไทยถ้วน`;
}

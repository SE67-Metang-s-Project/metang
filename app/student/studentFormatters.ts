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

const englishOnes = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const englishTens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function formatEnglishUnderThousand(value: number): string {
  const words: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds) words.push(englishOnes[hundreds], "hundred");
  if (remainder >= 20) {
    words.push(`${englishTens[Math.floor(remainder / 10)]}${remainder % 10 ? `-${englishOnes[remainder % 10]}` : ""}`);
  } else if (remainder) {
    words.push(englishOnes[remainder]);
  }

  return words.join(" ");
}

export function formatEnglishBahtText(amount: string): string {
  const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numericAmount)) return amount;

  const baht = Math.floor(numericAmount);
  if (baht === 0) return "zero baht only";

  const thousands = Math.floor(baht / 1000);
  const remainder = baht % 1000;
  const words = [
    thousands ? `${formatEnglishUnderThousand(thousands)} thousand` : "",
    remainder ? formatEnglishUnderThousand(remainder) : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `${words} baht only`;
}

export function formatLoanAmountInput(amount: string): string {
  const numericValue = amount.replace(/\D/g, "");
  return numericValue ? Number(numericValue).toLocaleString("en-US") : "";
}

export function parseLoanAmount(amount: string): number {
  return Number(amount.replace(/,/g, "")) || 0;
}

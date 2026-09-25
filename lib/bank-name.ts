const baacBankName = "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร";
const baacNameWithAbbreviation = /^ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร\s*\(ธ\.ก\.ส\.\)$/;

export function normalizeBankName(bankName: string) {
  const normalized = bankName.trim();

  return baacNameWithAbbreviation.test(normalized) ? baacBankName : normalized;
}

const bankLogoEntries = [
  ["BAAC", ["ธนาคารเพื่อการเกษตร", "Bank for Agriculture"]],
  ["BBL", ["ธนาคารกรุงเทพ", "Bangkok Bank"]],
  ["BAY", ["ธนาคารกรุงศรี", "Krungsri Bank"]],
  ["CIMB", ["ธนาคารซีไอเอ็มบี", "CIMB Thai Bank"]],
  ["GHB", ["ธนาคารอาคารสงเคราะห์", "Government Housing Bank"]],
  ["GSB", ["ธนาคารออมสิน", "Government Savings Bank"]],
  ["KBANK", ["ธนาคารกสิกรไทย", "Kasikornbank"]],
  ["KKP", ["ธนาคารเกียรตินาคินภัทร", "Kiatnakin Phatra Bank"]],
  ["KTB", ["ธนาคารกรุงไทย", "Krungthai Bank"]],
  ["SCB", ["ธนาคารไทยพาณิชย์", "Siam Commercial Bank"]],
  ["TISCO", ["ธนาคารทิสโก้", "TISCO Bank"]],
  ["TTB", ["ธนาคารทหารไทยธนชาต", "TMBThanachart Bank"]],
  ["UOB", ["ธนาคารยูโอบี", "United Overseas Bank"]],
] as const;

export function getBankLogoSrc(bankName: string) {
  const normalized = bankName.trim().toLowerCase();
  const match = bankLogoEntries.find(([, names]) =>
    names.some((name) => normalized.includes(name.toLowerCase())),
  );

  return match ? `/bank-logos/${match[0]}.png` : undefined;
}

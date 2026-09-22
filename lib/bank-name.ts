const baacBankName = "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร";
const baacNameWithAbbreviation = /^ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร\s*\(ธ\.ก\.ส\.\)$/;

export function normalizeBankName(bankName: string) {
  const normalized = bankName.trim();

  return baacNameWithAbbreviation.test(normalized) ? baacBankName : normalized;
}

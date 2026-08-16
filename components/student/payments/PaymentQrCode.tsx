import styles from "@/app/student/student.module.css";

type PaymentQrCodeProps = {
  value: string;
};

function createQrPattern(value: string) {
  return Array.from({ length: 21 }, (_, row) =>
    Array.from({ length: 21 }, (_, column) => {
      const isFinder =
        (row < 7 && column < 7) ||
        (row < 7 && column > 13) ||
        (row > 13 && column < 7);

      if (isFinder) {
        const finderRow = row < 7 ? row : row - 14;
        const finderColumn = column < 7 ? column : column - 14;
        return finderRow === 0 || finderRow === 6 || finderColumn === 0 || finderColumn === 6 ||
          (finderRow >= 2 && finderRow <= 4 && finderColumn >= 2 && finderColumn <= 4);
      }

      const seed = value.charCodeAt((row * 21 + column) % value.length);
      return (seed + row * 11 + column * 7 + row * column) % 5 < 2;
    }),
  );
}

export default function PaymentQrCode({ value }: PaymentQrCodeProps) {
  const pattern = createQrPattern(value);

  return (
    <div aria-label="QR Code สำหรับชำระเงิน" className={styles.paymentQrCode} role="img">
      {pattern.flatMap((row, rowIndex) =>
        row.map((isFilled, columnIndex) => (
          <span
            className={isFilled ? styles.paymentQrCellFilled : styles.paymentQrCell}
            key={`${rowIndex}-${columnIndex}`}
          />
        )),
      )}
    </div>
  );
}

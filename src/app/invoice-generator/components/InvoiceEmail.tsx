interface InvoiceEmailProps {
  invoiceNumber: string;
  invoiceType: string;
  billingName: string;
  billingAddress: string;
  bankName: string;
  bankAddress?: string;
  accountNumber: string;
  routingNumber: string;
  silveredCourse?: string;
  silveredAmount?: string;
}

export function InvoiceEmail({
  invoiceNumber,
  invoiceType,
  billingName,
  billingAddress,
  bankName,
  bankAddress,
  accountNumber,
  routingNumber,
  silveredCourse,
  silveredAmount,
}: InvoiceEmailProps) {
  return (
    <div>
      <h1>Invoice #{invoiceNumber}</h1>

      <h2>BILLING INFORMATION:</h2>
      <p>{billingName}</p>
      <p>{billingAddress}</p>

      <h2>BANK INFORMATION:</h2>
      <p>
        <strong>Bank:</strong> {bankName}
      </p>
      {bankAddress && (
        <p>
          <strong>Bank Address:</strong> {bankAddress}
        </p>
      )}
      <p>
        <strong>Account Number:</strong> {accountNumber}
      </p>
      <p>
        <strong>Routing Number:</strong> {routingNumber}
      </p>

      <p>Please find the invoice attached.</p>

      {invoiceType === "silvered" && (
        <>
          <h2>COURSE INFORMATION:</h2>
          <p>
            <strong>Course:</strong> {silveredCourse}
          </p>
          <p>
            <strong>Amount Paid:</strong> ${silveredAmount}
          </p>
        </>
      )}
    </div>
  );
}

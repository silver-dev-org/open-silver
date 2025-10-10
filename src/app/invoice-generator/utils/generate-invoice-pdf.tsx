import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

function getLocale() {
  return enUS;
}

function getDateFormat() {
  return "MM/dd/yy";
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 5,
  },
  invoiceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  invoiceSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
  },
  bold: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1, textAlign: "center" },
  summary: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
    width: 200,
  },
  summaryLabel: {
    flex: 1,
    textAlign: "right",
    marginRight: 10,
  },
  summaryValue: {
    width: 80,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#000",
    width: 200,
    fontWeight: "bold",
    fontSize: 12,
  },
  bonifiedBadge: {
    color: "#22c55e",
    fontSize: 8,
  },
  strikethrough: {
    textDecoration: "line-through",
    color: "#999",
  },
});

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  isBonified: boolean;
  bonifiedReason?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceName: string;
  invoiceSubtitle: string;
  billingName: string;
  billingAddress: string;
  bankName: string;
  bankAddress?: string;
  accountNumber: string;
  routingNumber: string;
  items: InvoiceItem[];
  dueDate: Date;
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const currentDate = format(new Date(), getDateFormat(), {
    locale: getLocale(),
  });
  const formattedDueDate = format(data.dueDate, getDateFormat(), {
    locale: getLocale(),
  });

  const subtotal = data.items.reduce(
    (sum, item) => sum + (item.isBonified ? 0 : item.price),
    0,
  );
  const bonifiedTotal = data.items.reduce(
    (sum, item) => sum + (item.isBonified ? item.price : 0),
    0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subtitle}>Invoice #: {data.invoiceNumber}</Text>
            <Text style={styles.subtitle}>Date: {currentDate}</Text>
            <Text style={styles.subtitle}>Due Date: {formattedDueDate}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceName}>{data.invoiceName}</Text>
            <Text style={styles.invoiceSubtitle}>{data.invoiceSubtitle}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.text}>{data.billingName}</Text>
          <Text style={styles.text}>{data.billingAddress}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Item</Text>
            <Text style={styles.col2}>Price</Text>
            <Text style={styles.col3}>Status</Text>
          </View>

          {data.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={item.isBonified ? styles.strikethrough : {}}>
                  {item.name}
                </Text>
                {item.isBonified && item.bonifiedReason && (
                  <Text style={{ fontSize: 8, color: "#22c55e", marginTop: 2 }}>
                    Reason: {item.bonifiedReason}
                  </Text>
                )}
              </View>
              <View style={styles.col2}>
                <Text style={item.isBonified ? styles.strikethrough : {}}>
                  ${item.price.toFixed(2)}
                </Text>
                {item.isBonified && (
                  <Text style={{ color: "#22c55e", fontWeight: "bold" }}>
                    FREE
                  </Text>
                )}
              </View>
              <Text style={styles.col3}>
                {item.isBonified ? "Bonified" : "Regular"}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {bonifiedTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#22c55e" }]}>
                Bonified Items (Discount):
              </Text>
              <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
                -${bonifiedTotal.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {bonifiedTotal > 0 && (
            <Text style={{ fontSize: 8, color: "#666", marginTop: 5 }}>
              Original total: ${(subtotal + bonifiedTotal).toFixed(2)}
            </Text>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Bank:</Text> {data.bankName}
          </Text>
          {data.bankAddress && (
            <Text style={styles.text}>
              <Text style={styles.bold}>Bank Address:</Text> {data.bankAddress}
            </Text>
          )}
          <Text style={styles.text}>
            <Text style={styles.bold}>Account Number:</Text>{" "}
            {data.accountNumber}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Routing Number:</Text>{" "}
            {data.routingNumber}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

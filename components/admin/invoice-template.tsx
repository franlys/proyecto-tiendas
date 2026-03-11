import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import type { SalesOrder } from "@/components/shared/sales-orders-context";
import type { ManagedShop } from "@/components/shared/shops-context";

// Register fonts
Font.register({
    family: "Inter",
    src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff",
});

Font.register({
    family: "Inter-Bold",
    src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff",
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Inter",
        fontSize: 10,
        color: "#333",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 10,
    },
    shopInfo: {
        width: "60%",
    },
    shopName: {
        fontSize: 18,
        fontFamily: "Inter-Bold",
        marginBottom: 4,
    },
    shopDetail: {
        fontSize: 9,
        color: "#666",
        marginBottom: 2,
    },
    invoiceInfo: {
        width: "40%",
        alignItems: "flex-end",
    },
    invoiceTitle: {
        fontSize: 14,
        fontFamily: "Inter-Bold",
        marginBottom: 4,
    },
    invoiceDetail: {
        fontSize: 9,
        marginBottom: 2,
    },
    billTo: {
        marginTop: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: "Inter-Bold",
        textTransform: "uppercase",
        marginBottom: 5,
        color: "#888",
    },
    table: {
        marginTop: 20,
        flexDirection: "column",
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        paddingBottom: 5,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingVertical: 8,
    },
    colDesc: { width: "50%" },
    colQty: { width: "15%", textAlign: "center" },
    colPrice: { width: "15%", textAlign: "right" },
    colTotal: { width: "20%", textAlign: "right" },

    bold: { fontFamily: "Inter-Bold" },

    totals: {
        marginTop: 20,
        alignItems: "flex-end",
    },
    totalRow: {
        flexDirection: "row",
        marginBottom: 5,
        width: "40%",
        justifyContent: "space-between",
    },
    grandTotal: {
        flexDirection: "row",
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#000",
        paddingTop: 5,
        width: "40%",
        justifyContent: "space-between",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 8,
        color: "#999",
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 10,
    },
});

interface InvoiceTemplateProps {
    order: SalesOrder;
    shop: ManagedShop;
}

export function InvoiceTemplate({ order, shop }: InvoiceTemplateProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{shop.name}</Text>
                        <Text style={styles.shopDetail}>RFC: XAXX010101000</Text>
                        <Text style={styles.shopDetail}>{shop.description}</Text>
                        <Text style={styles.shopDetail}>Tel: {shop.contact.phone}</Text>
                    </View>
                    <View style={styles.invoiceInfo}>
                        <Text style={styles.invoiceTitle}>FACTURA</Text>
                        <Text style={styles.invoiceDetail}>Folio: {order.orderNumber}</Text>
                        <Text style={styles.invoiceDetail}>
                            Fecha: {new Date(order.createdAt).toLocaleDateString("es-MX")}
                        </Text>
                        <Text style={styles.invoiceDetail}>
                            Estado: {order.paymentStatus === "paid" ? "Pagado" : "Pendiente"}
                        </Text>
                    </View>
                </View>

                {/* Bill To */}
                <View style={styles.billTo}>
                    <Text style={styles.sectionTitle}>Facturar a:</Text>
                    <Text style={styles.bold}>{order.customerName}</Text>
                    <Text>{order.customerPhone}</Text>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colDesc, styles.bold]}>Descripción</Text>
                        <Text style={[styles.colQty, styles.bold]}>Cant.</Text>
                        <Text style={[styles.colPrice, styles.bold]}>Precio</Text>
                        <Text style={[styles.colTotal, styles.bold]}>Importe</Text>
                    </View>

                    {order.items.map((item, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{item.productName}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>${item.unitPrice.toFixed(2)}</Text>
                            <Text style={styles.colTotal}>${item.total.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text>Subtotal:</Text>
                        <Text>${order.subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>IVA (16%):</Text>
                        <Text>${order.tax.toFixed(2)}</Text>
                    </View>
                    <View style={styles.grandTotal}>
                        <Text style={styles.bold}>TOTAL:</Text>
                        <Text style={styles.bold}>${order.total.toFixed(2)}</Text>
                    </View>

                    {(order.upfrontAmount ?? 0) > 0 && (
                        <>
                            <View style={[styles.totalRow, { marginTop: 10 }]}>
                                <Text style={{ color: "green" }}>Adelanto Pagado:</Text>
                                <Text style={{ color: "green" }}>-${(order.upfrontAmount ?? 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.grandTotal}>
                                <Text style={styles.bold}>SALDO PENDIENTE:</Text>
                                <Text style={styles.bold}>${(order.remainingBalance || (order.total - (order.upfrontAmount ?? 0))).toFixed(2)}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Gracias por su compra en {shop.name}. Este documento es una representación impresa de un CFDI.</Text>
                </View>
            </Page>
        </Document>
    );
}

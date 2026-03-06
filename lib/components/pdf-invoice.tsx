import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Register fonts if needed (using default for now)

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        color: "#1e293b",
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        borderBottom: 1,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 20,
    },
    shopInfo: {
        flexDirection: "column",
    },
    shopLogo: {
        width: 80,
        height: "auto",
        marginBottom: 8,
        borderRadius: 4,
    },
    shopName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 4,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0f172a",
        textAlign: "right",
        textTransform: "uppercase",
    },
    orderNumber: {
        fontSize: 12,
        color: "#64748b",
        textAlign: "right",
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
        borderBottom: 1,
        borderBottomColor: "#f1f5f9",
        paddingBottom: 4,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    label: {
        color: "#64748b",
        width: 80,
    },
    value: {
        fontWeight: "bold",
        color: "#0f172a",
        flex: 1,
    },
    table: {
        marginTop: 10,
        borderWidth: 0,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    tableCol: {
        flex: 1,
        fontSize: 9,
        fontWeight: "bold",
        color: "#475569",
    },
    tableColRight: {
        width: 60,
        textAlign: "right",
        fontSize: 9,
        fontWeight: "bold",
        color: "#475569",
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    tableCell: {
        flex: 1,
        fontSize: 9,
    },
    tableCellRight: {
        width: 60,
        textAlign: "right",
        fontSize: 9,
    },
    totalsSection: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },
    totalsBox: {
        width: 150,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: "#64748b",
    },
    totalValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
    },
    grandTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#0f172a",
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#09090b", // Custom primary color if possible
    },
    footer: {
        position: "absolute",
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: "center",
        color: "#94a3b8",
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 10,
    }
});

interface PDFInvoiceProps {
    order: {
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        customerAddress?: string;
        items: any[];
        total: number;
        createdAt: string;
        deliveryType?: string;
        paymentMethod?: string;
    };
    shop: {
        name: string;
        logo?: string;
        primaryColor?: string;
        ownerNotificationEmail?: string;
    };
}

export const PDFInvoice = ({ order, shop }: PDFInvoiceProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.shopInfo}>
                    {shop.logo && <Image src={shop.logo} style={styles.shopLogo} />}
                    <Text style={styles.shopName}>{shop.name}</Text>
                    <Text style={{ color: "#64748b", fontSize: 8 }}>{shop.ownerNotificationEmail || ""}</Text>
                </View>
                <View>
                    <Text style={styles.invoiceTitle}>Factura</Text>
                    <Text style={styles.orderNumber}>Pedido #{order.orderNumber}</Text>
                    <Text style={{ textAlign: "right", color: "#64748b", fontSize: 8, marginTop: 2 }}>
                        Fecha: {new Date(order.createdAt).toLocaleDateString('es-ES')}
                    </Text>
                </View>
            </View>

            {/* Customer & Delivery */}
            <View style={{ flexDirection: "row", gap: 40, marginBottom: 30 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Cliente</Text>
                    <Text style={{ fontSize: 11, fontWeight: "bold", marginBottom: 2 }}>{order.customerName}</Text>
                    <Text style={{ color: "#64748b", marginBottom: 2 }}>{order.customerPhone}</Text>
                    {order.customerEmail && <Text style={{ color: "#64748b" }}>{order.customerEmail}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Envío y Pago</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Método:</Text>
                        <Text style={styles.value}>{order.deliveryType === "recogida" ? "Recoger en tienda" : "Entrega a domicilio"}</Text>
                    </View>
                    {order.customerAddress && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Dirección:</Text>
                            <Text style={styles.value}>{order.customerAddress}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.label}>Pago:</Text>
                        <Text style={styles.value}>{order.paymentMethod || "Por confirmar"}</Text>
                    </View>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalle del Pedido</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol, { flex: 3 }]}>Descripción</Text>
                        <Text style={styles.tableColRight}>Canti.</Text>
                        <Text style={styles.tableColRight}>P. Unit</Text>
                        <Text style={styles.tableColRight}>Total</Text>
                    </View>
                    {order.items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 3, fontSize: 9, lineHeight: 1.2 }]}>
                                {item.productName || item.name}
                                {item.notes ? `\nNota: ${item.notes}` : ""}
                            </Text>
                            <Text style={styles.tableCellRight}>{item.quantity || 1}</Text>
                            <Text style={styles.tableCellRight}>${(item.unitPrice || item.price || 0).toLocaleString()}</Text>
                            <Text style={styles.tableCellRight}>${((item.unitPrice || item.price || 0) * (item.quantity || 1)).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>${order.total.toLocaleString()}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Impuestos</Text>
                        <Text style={styles.totalValue}>$0</Text>
                    </View>
                    <View style={[styles.grandTotalRow, shop.primaryColor ? { borderTopColor: shop.primaryColor } : {}]}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={[styles.grandTotalValue, shop.primaryColor ? { color: shop.primaryColor } : {}]}>
                            ${order.total.toLocaleString()} MXN
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Gracias por tu preferencia en {shop.name}</Text>
                <Text style={{ marginTop: 4 }}>Esta es una factura generada automáticamente por Linko App</Text>
            </View>
        </Page>
    </Document>
);

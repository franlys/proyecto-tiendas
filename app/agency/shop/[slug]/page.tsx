"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    ArrowLeft,
    Store,
    Shield,
    Users,
    Key,
    Save,
    Loader2,
    CheckCircle,
    AlertTriangle,
    MessageCircle,
    Puzzle,
    Package,
    ShoppingCart,
    UserCheck,
    Megaphone,
    BarChart3,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    UserPlus,
    X,
    Palette,
    Image,
    Instagram,
    Globe,
    MapPin,
    Mail,
    Type,
    Video,
    Layers,
    MonitorPlay,
} from "lucide-react";
import {
    AuthProvider,
    useAuth,
    ShopsProvider,
    useShops,
    ManagedShop,
    ShopCategory,
    AgencyProvider,
    DEFAULT_FEATURES,
    StaffRole,
    STAFF_ROLES,
} from "@/components/shared";
import { Button } from "@/components/ui";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { WhatsAppAutomationPanel } from "@/components/shared/whatsapp-automation";

// Mapeo de categorías para mostrar labels correctos
const CATEGORY_OPTIONS: { value: ShopCategory; label: string }[] = [
    { value: "retail", label: "Retail / Tienda / Tecnología" },
    { value: "repair", label: "Servicio Técnico & Ventas" },
    { value: "beauty", label: "Belleza / Spa / Citas" },
    { value: "restaurant", label: "Restaurante / Bar" },
    { value: "rentcar", label: "Rent-a-Car / Alquiler" },
];

// Mapeo de roles de staff
const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
    { value: "owner", label: "Dueño" },
    { value: "manager", label: "Gerente" },
    { value: "sales", label: "Vendedor" },
    { value: "warehouse", label: "Almacén" },
];

// Interfaz para empleados de tienda (almacenados en localStorage)
interface ShopStaffMember {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: StaffRole;
    password: string;
    isActive: boolean;
    createdAt: string;
}

// Helper para obtener la key de almacenamiento de staff
const getStaffStorageKey = (shopSlug: string) => `nexo-shop-staff-${shopSlug}`;

// Componente para toggle de feature
function FeatureToggle({
    label,
    description,
    enabled,
    onToggle,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div
            className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            onClick={onToggle}
        >
            <div>
                <p className="font-medium text-white">{label}</p>
                <p className="text-xs text-slate-400">{description}</p>
            </div>
            <div
                className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? "bg-cyan-500" : "bg-slate-600"
                    }`}
            >
                <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-7" : "translate-x-1"
                        }`}
                />
            </div>
        </div>
    );
}

function ShopDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { shops, getShop, updateShop, updateShopCredentials, toggleFeature, registerPayment } = useShops();
    const { isSuperAdmin, isLoading: authLoading } = useAuth();

    const [shop, setShop] = useState<ManagedShop | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<"overview" | "config" | "appearance" | "features" | "staff" | "whatsapp" | "security">("overview");
    const [loading, setLoading] = useState(true);

    // Form States
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ShopCategory>("beauty");
    const [phone, setPhone] = useState("");

    // Visual Customization States
    const [logo, setLogo] = useState("");
    const [banner, setBanner] = useState("");
    const [slogan, setSlogan] = useState("");
    const [description, setDescription] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#22D3EE");
    const [accentColor, setAccentColor] = useState("#3B82F6");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [tiktok, setTiktok] = useState("");
    const [website, setWebsite] = useState("");
    const [savingAppearance, setSavingAppearance] = useState(false);
    const [appearanceSaveSuccess, setAppearanceSaveSuccess] = useState(false);

    // Background Configuration States
    const [backgroundType, setBackgroundType] = useState<"solid" | "image" | "video">("solid");
    const [backgroundColor, setBackgroundColor] = useState("#0F172A");
    const [backgroundImage, setBackgroundImage] = useState("");
    const [backgroundVideo, setBackgroundVideo] = useState("");
    const [heroBackground, setHeroBackground] = useState("");
    const [servicesBackground, setServicesBackground] = useState("");
    const [productsBackground, setProductsBackground] = useState("");
    const [contactBackground, setContactBackground] = useState("");

    // Security State
    const [newPassword, setNewPassword] = useState("");

    // Save States
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

    // Staff Management States
    const [staffMembers, setStaffMembers] = useState<ShopStaffMember[]>([]);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<ShopStaffMember | null>(null);
    const [newStaffName, setNewStaffName] = useState("");
    const [newStaffEmail, setNewStaffEmail] = useState("");
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [newStaffRole, setNewStaffRole] = useState<StaffRole>("sales");
    const [newStaffPassword, setNewStaffPassword] = useState("");
    const [showStaffPassword, setShowStaffPassword] = useState(false);

    // Load staff from Firestore (Real-time)
    useEffect(() => {
        if (!shop?.id) return;

        const staffRef = collection(db, "shops", shop.id, "staff");
        const unsubscribe = onSnapshot(staffRef, (snapshot) => {
            const staff = snapshot.docs.map(doc => doc.data() as ShopStaffMember);
            setStaffMembers(staff);
        });

        return () => unsubscribe();
    }, [shop?.id]);

    // Staff CRUD functions
    const handleAddStaff = async () => {
        if (!newStaffName || !newStaffEmail || !newStaffPassword || !shop?.id) return;

        const newMember: ShopStaffMember = {
            id: `staff-${Date.now()}`,
            name: newStaffName,
            email: newStaffEmail.toLowerCase(),
            phone: newStaffPhone || undefined,
            role: newStaffRole,
            password: newStaffPassword,
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        try {
            await setDoc(doc(db, "shops", shop.id, "staff", newMember.id), newMember);
            resetStaffForm();
            setShowAddStaffModal(false);
        } catch (error) {
            console.error("Error creating staff:", error);
        }
    };

    const handleUpdateStaff = async () => {
        if (!editingStaff || !newStaffName || !newStaffEmail || !shop?.id) return;

        const updatedMember = {
            ...editingStaff,
            name: newStaffName,
            email: newStaffEmail.toLowerCase(),
            phone: newStaffPhone || undefined,
            role: newStaffRole,
            password: newStaffPassword || editingStaff.password,
        };

        try {
            await setDoc(doc(db, "shops", shop.id, "staff", editingStaff.id), updatedMember, { merge: true });
            resetStaffForm();
            setEditingStaff(null);
            setShowAddStaffModal(false);
        } catch (error) {
            console.error("Error updating staff:", error);
        }
    };

    const handleDeleteStaff = async (staffId: string) => {
        if (!shop?.id) return;
        try {
            await deleteDoc(doc(db, "shops", shop.id, "staff", staffId));
        } catch (error) {
            console.error("Error deleting staff:", error);
        }
    };

    const handleToggleStaffStatus = async (staffId: string) => {
        if (!shop?.id) return;
        const member = staffMembers.find(s => s.id === staffId);
        if (!member) return;

        try {
            await setDoc(doc(db, "shops", shop.id, "staff", staffId), { isActive: !member.isActive }, { merge: true });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const openEditStaffModal = (staff: ShopStaffMember) => {
        setEditingStaff(staff);
        setNewStaffName(staff.name);
        setNewStaffEmail(staff.email);
        setNewStaffPhone(staff.phone || "");
        setNewStaffRole(staff.role);
        setNewStaffPassword("");
        setShowAddStaffModal(true);
    };

    const resetStaffForm = () => {
        setNewStaffName("");
        setNewStaffEmail("");
        setNewStaffPhone("");
        setNewStaffRole("sales");
        setNewStaffPassword("");
        setShowStaffPassword(false);
    };

    // WhatsApp Configuration States
    interface WhatsAppNumber {
        id: string;
        number: string;
        label: string;
        isDefault: boolean;
    }

    // Cliente registrado en WhatsApp
    interface RegisteredClient {
        id: string;
        phone: string;
        name: string;
        registeredAt: string;
    }

    // Configuración del flujo de bienvenida/registro
    interface WhatsAppFlowConfig {
        welcomeMessage: string;
        registrationPrompt: string;
        successMessage: string;
        catalogUrl: string;
        isEnabled: boolean;
    }

    const [whatsappNumbers, setWhatsappNumbers] = useState<WhatsAppNumber[]>([]);
    const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
    const [flowConfig, setFlowConfig] = useState<WhatsAppFlowConfig>({
        welcomeMessage: "¡Hola! 👋 Bienvenido a {shopName}. Para brindarte una mejor atención, necesitamos registrar tus datos.",
        registrationPrompt: "Por favor, envíame tu nombre completo para continuar:",
        successMessage: "¡Gracias {clientName}! Ya estás registrado. Aquí tienes nuestro catálogo: {catalogUrl}",
        catalogUrl: "",
        isEnabled: true,
    });
    const [newWaNumber, setNewWaNumber] = useState("");
    const [newWaLabel, setNewWaLabel] = useState("");
    const [clientSearch, setClientSearch] = useState("");
    const [savingWhatsapp, setSavingWhatsapp] = useState(false);
    const [whatsappSaveSuccess, setWhatsappSaveSuccess] = useState(false);

    // Load WhatsApp config from Firestore (Real-time)
    useEffect(() => {
        if (!shop?.id) return;

        const waRef = doc(db, "shops", shop.id, "whatsapp_bot", "settings");

        const unsubscribe = onSnapshot(waRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setWhatsappNumbers(data.numbers || []);
                setRegisteredClients(data.registeredClients || []);
                if (data.flowConfig) {
                    setFlowConfig(data.flowConfig);
                }
            }

            // Default catalog URL if empty
            if ((!doc.exists() || !doc.data()?.flowConfig?.catalogUrl) && shop) {
                setFlowConfig(prev => ({
                    ...prev,
                    catalogUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/${shop.slug}`
                }));
            }
        });

        return () => unsubscribe();
    }, [shop?.id, shop?.slug]);

    // Save WhatsApp config (Firestore)
    const saveWhatsappConfig = async () => {
        if (!shop?.id) return;
        setSavingWhatsapp(true);

        try {
            const waRef = doc(db, "shops", shop.id, "whatsapp_bot", "settings");
            await setDoc(waRef, {
                numbers: whatsappNumbers,
                registeredClients: registeredClients,
                flowConfig: flowConfig,
            }, { merge: true });

            setWhatsappSaveSuccess(true);
            setTimeout(() => setWhatsappSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving WA config:", error);
        } finally {
            setSavingWhatsapp(false);
        }
    };

    // Add registered client manually
    const addRegisteredClient = async (phone: string, name: string) => {
        if (!shop?.id) return;
        const newClient: RegisteredClient = {
            id: `client-${Date.now()}`,
            phone,
            name,
            registeredAt: new Date().toISOString(),
        };
        const updatedList = [...registeredClients, newClient];
        setRegisteredClients(updatedList); // Optimistic update

        try {
            await setDoc(doc(db, "shops", shop.id, "whatsapp_bot", "settings"), {
                registeredClients: updatedList
            }, { merge: true });
        } catch (error) {
            console.error("Error adding client:", error);
        }
    };

    // Remove registered client
    const removeRegisteredClient = async (id: string) => {
        if (!shop?.id) return;
        const updatedList = registeredClients.filter(c => c.id !== id);
        setRegisteredClients(updatedList);

        try {
            await setDoc(doc(db, "shops", shop.id, "whatsapp_bot", "settings"), {
                registeredClients: updatedList
            }, { merge: true });
        } catch (error) {
            console.error("Error removing client:", error);
        }
    };

    // Filter registered clients by search
    const filteredClients = registeredClients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.phone.includes(clientSearch)
    );

    const addWhatsappNumber = async () => {
        if (!newWaNumber || !shop?.id) return;
        const newNum: WhatsAppNumber = {
            id: `wa-${Date.now()}`,
            number: newWaNumber,
            label: newWaLabel || "Principal",
            isDefault: whatsappNumbers.length === 0,
        };

        const updatedList = [...whatsappNumbers, newNum];
        setWhatsappNumbers(updatedList);
        setNewWaNumber("");
        setNewWaLabel("");

        try {
            await setDoc(doc(db, "shops", shop.id, "whatsapp_bot", "settings"), {
                numbers: updatedList
            }, { merge: true });
        } catch (error) {
            console.error("Error adding number:", error);
        }
    };

    const removeWhatsappNumber = async (id: string) => {
        if (!shop?.id) return;
        let updatedList = whatsappNumbers.filter(n => n.id !== id);
        // If we removed the default, make the first one default
        if (updatedList.length > 0 && !updatedList.some(n => n.isDefault)) {
            updatedList[0].isDefault = true;
        }
        setWhatsappNumbers(updatedList);

        try {
            await setDoc(doc(db, "shops", shop.id, "whatsapp_bot", "settings"), {
                numbers: updatedList
            }, { merge: true });
        } catch (error) {
            console.error("Error removing number:", error);
        }
    };

    const setDefaultWhatsappNumber = async (id: string) => {
        if (!shop?.id) return;
        const updatedList = whatsappNumbers.map(n => ({
            ...n,
            isDefault: n.id === id,
        }));
        setWhatsappNumbers(updatedList);

        try {
            await setDoc(doc(db, "shops", shop.id, "whatsapp_bot", "settings"), {
                numbers: updatedList
            }, { merge: true });
        } catch (error) {
            console.error("Error setting default:", error);
        }
    };


    useEffect(() => {
        // DEBUG: Log state for troubleshooting
        console.log("🔧 [SHOP-CONFIG]", {
            authLoading,
            isSuperAdmin,
            shopsCount: shops.length,
            slug: params.slug,
        });

        // Wait for auth to finish loading before making any decisions
        if (authLoading) {
            console.log("🔧 [SHOP-CONFIG] Waiting for auth to load...");
            return;
        }

        // Only redirect to login if auth is definitely loaded and user is not super admin
        if (!isSuperAdmin) {
            console.log("🔧 [SHOP-CONFIG] Not super admin, redirecting to login");
            router.push("/login");
            return;
        }

        // Wait for shops to be loaded before checking if shop exists
        if (shops.length === 0) {
            console.log("🔧 [SHOP-CONFIG] Waiting for shops to load...");
            return;
        }

        if (params.slug) {
            const foundShop = getShop(params.slug as string);
            if (foundShop) {
                console.log("🔧 [SHOP-CONFIG] Shop found ✅", foundShop.slug);
                setShop(foundShop);
                setName(foundShop.name);
                setCategory(foundShop.category || "beauty");
                setPhone(foundShop.contact?.phone || "");
                // Load visual customization data
                setLogo(foundShop.logo || "");
                setBanner(foundShop.banner || "");
                setSlogan(foundShop.slogan || "");
                setDescription(foundShop.description || "");
                setPrimaryColor(foundShop.theme?.primaryColor || "#22D3EE");
                setAccentColor(foundShop.theme?.accentColor || "#3B82F6");
                setEmail(foundShop.contact?.email || "");
                setAddress(foundShop.contact?.address || "");
                setCity(foundShop.contact?.city || "");
                setInstagram(foundShop.social?.instagram || "");
                setFacebook(foundShop.social?.facebook || "");
                setTiktok(foundShop.social?.tiktok || "");
                setWebsite(foundShop.social?.website || "");
                // Load background configuration
                setBackgroundType(foundShop.background?.type || "solid");
                setBackgroundColor(foundShop.background?.color || "#0F172A");
                setBackgroundImage(foundShop.background?.image || "");
                setBackgroundVideo(foundShop.background?.video || "");
                setHeroBackground(foundShop.background?.hero || "");
                setServicesBackground(foundShop.background?.services || "");
                setProductsBackground(foundShop.background?.products || "");
                setContactBackground(foundShop.background?.contact || "");
                setLoading(false);
            } else {
                console.log("🔧 [SHOP-CONFIG] Shop not found, redirecting to agency", { slug: params.slug });
                router.push("/agency");
            }
        }
    }, [shops, params.slug, isSuperAdmin, authLoading, getShop, router]);

    if (loading || !shop) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/agency">
                            <Button variant="ghost" size="sm" className="!px-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Store className="w-5 h-5 text-cyan-400" />
                                {shop.name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>/{shop.slug}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span className="uppercase text-xs tracking-wider">{shop.category || "beauty"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "overview"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4" />
                                <span>Vista General</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("config")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "config"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Store className="w-4 h-4" />
                                <span>Configuración</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("appearance")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "appearance"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Palette className="w-4 h-4" />
                                <span>Apariencia</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("features")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "features"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Puzzle className="w-4 h-4" />
                                <span>Features</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("staff")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "staff"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4" />
                                <span>Empleados</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("whatsapp")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "whatsapp"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-4 h-4" />
                                <span>WhatsApp</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "security"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Key className="w-4 h-4" />
                                <span>Seguridad</span>
                            </div>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        Estado de la Cuenta
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-black/20">
                                            <p className="text-sm text-slate-400 mb-1">Suscripción</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold capitalize text-green-400">
                                                    {shop.subscriptionStatus}
                                                </p>
                                                {shop.subscriptionStatus === "active" && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/20">
                                                        Al día
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3 w-full border-green-500/30 hover:bg-green-500/10 text-green-400"
                                                onClick={() => {
                                                    if (confirm("¿Confirmar pago mensual de " + (shop.monthlyPrice || 0) + " DOP?")) {
                                                        registerPayment(shop.id);
                                                    }
                                                }}
                                            >
                                                <CheckCircle className="w-3 h-3 mr-2" />
                                                Confirmar Pago
                                            </Button>
                                        </div>
                                        <div className="p-4 rounded-xl bg-black/20">
                                            <p className="text-sm text-slate-400 mb-1">Plan Mensual (DOP)</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="number"
                                                    defaultValue={shop.monthlyPrice || 0}
                                                    className="w-full bg-transparent border-b border-white/10 focus:border-cyan-500 outline-none text-white font-semibold"
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (val !== shop.monthlyPrice) {
                                                            updateShop(shop.id, { monthlyPrice: val });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={shop.invoiceReminders || false}
                                                        onChange={(e) => updateShop(shop.id, { invoiceReminders: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:bg-cyan-500 transition-colors"></div>
                                                    <div className="absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-full"></div>
                                                </div>
                                                <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                                                    Recordatorios Mensuales
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-400" />
                                        Monitoreo de Personal
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Visualiza el uso de asientos. No se muestra información personal.
                                    </p>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Usuarios Activos (Staff)</p>
                                            <p className="text-sm text-slate-400">Owner + 2 Empleados</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-amber-400 text-sm">Privacidad Activada</h4>
                                        <p className="text-xs text-amber-300/80 mt-1">
                                            Como Super Admin, no tienes acceso a ver Inventario, Ventas ni Clientes de esta tienda.
                                            Solo el propietario ({shop.ownerUsername}) puede gestionar esos datos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "config" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4">Configuración Pública</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Comercial</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as ShopCategory)}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                        >
                                            {CATEGORY_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp de Contacto</label>
                                        <div className="flex gap-2">
                                            <div className="px-3 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-400">
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="809-555-1234"
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        {saveSuccess && (
                                            <span className="flex items-center gap-2 text-green-400 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                Guardado correctamente
                                            </span>
                                        )}
                                        <Button
                                            onClick={() => {
                                                setSaving(true);
                                                updateShop(shop.slug, {
                                                    name,
                                                    category,
                                                    businessType: category, // Sync business logic type
                                                    contact: { ...shop.contact, phone }
                                                });
                                                // Actualizar el shop local
                                                setShop(prev => prev ? { ...prev, name, category, businessType: category, contact: { ...prev.contact, phone } } : prev);
                                                setTimeout(() => {
                                                    setSaving(false);
                                                    setSaveSuccess(true);
                                                    setTimeout(() => setSaveSuccess(false), 3000);
                                                }, 500);
                                            }}
                                            disabled={saving}
                                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            {saving ? "Guardando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "appearance" && (
                            <div className="space-y-6">
                                {/* Logo y Banner */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Image className="w-5 h-5 text-pink-400" />
                                        Imágenes de la Tienda
                                    </h3>

                                    {/* Logo */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FirebaseImageUpload
                                            value={logo}
                                            onChange={setLogo}
                                            folder="shops/logos"
                                            shopId={shop?.slug || "temp"}
                                            label="Logo de la Tienda"
                                            aspectRatio="square"
                                            maxSizeMB={2}
                                        />

                                        {/* Banner */}
                                        <FirebaseImageUpload
                                            value={banner}
                                            onChange={setBanner}
                                            folder="shops/banners"
                                            shopId={shop?.slug || "temp"}
                                            label="Imagen de Portada / Banner"
                                            aspectRatio="banner"
                                            maxSizeMB={50}
                                        />
                                    </div>
                                </div>

                                {/* Información de Marca */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Type className="w-5 h-5 text-cyan-400" />
                                        Información de Marca
                                    </h3>

                                    {/* Slogan */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-300">
                                            Slogan / Frase Corta
                                        </label>
                                        <input
                                            type="text"
                                            value={slogan}
                                            onChange={(e) => setSlogan(e.target.value)}
                                            placeholder="Ej: Tu belleza, nuestra pasión"
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-300">
                                            Descripción del Negocio
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe tu negocio en unas pocas líneas..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Colores */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-purple-400" />
                                        Colores de la Tienda
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Color Primario */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Color Primario
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="w-12 h-12 rounded-xl border-2 border-white/20 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Color Secundario */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Color Secundario
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={accentColor}
                                                    onChange={(e) => setAccentColor(e.target.value)}
                                                    className="w-12 h-12 rounded-xl border-2 border-white/20 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={accentColor}
                                                    onChange={(e) => setAccentColor(e.target.value)}
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview de colores */}
                                    <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-3">Vista previa:</p>
                                        <div className="flex gap-3">
                                            <div
                                                className="flex-1 h-12 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                Botón Primario
                                            </div>
                                            <div
                                                className="flex-1 h-12 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                                                style={{ backgroundColor: accentColor }}
                                            >
                                                Botón Secundario
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contacto Extendido */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-green-400" />
                                        Información de Contacto
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">Email</label>
                                            <div className="flex gap-2">
                                                <div className="px-3 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-400">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="contacto@tienda.com"
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">Ciudad</label>
                                            <input
                                                type="text"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="Ej: Santo Domingo"
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-300">Dirección</label>
                                        <div className="flex gap-2">
                                            <div className="px-3 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-400">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Calle Principal #123, Local 4"
                                                className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Redes Sociales */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Instagram className="w-5 h-5 text-pink-400" />
                                        Redes Sociales
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">Instagram</label>
                                            <div className="flex gap-2">
                                                <div className="px-3 py-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                                                    <Instagram className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={instagram}
                                                    onChange={(e) => setInstagram(e.target.value)}
                                                    placeholder="@tutienda"
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">Facebook</label>
                                            <div className="flex gap-2">
                                                <div className="px-3 py-3 bg-blue-600 rounded-xl text-white">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={facebook}
                                                    onChange={(e) => setFacebook(e.target.value)}
                                                    placeholder="facebook.com/tutienda"
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">TikTok</label>
                                            <div className="flex gap-2">
                                                <div className="px-3 py-3 bg-black border border-white/20 rounded-xl text-white">
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={tiktok}
                                                    onChange={(e) => setTiktok(e.target.value)}
                                                    placeholder="@tutienda"
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-300">Sitio Web</label>
                                            <div className="flex gap-2">
                                                <div className="px-3 py-3 bg-cyan-500 rounded-xl text-white">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={website}
                                                    onChange={(e) => setWebsite(e.target.value)}
                                                    placeholder="https://tutienda.com"
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuración de Fondos */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-400" />
                                        Fondos de la Página
                                    </h3>

                                    {/* Tipo de Fondo Principal */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-slate-300">
                                            Tipo de Fondo Principal
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setBackgroundType("solid")}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${backgroundType === "solid"
                                                    ? "border-cyan-500 bg-cyan-500/10"
                                                    : "border-white/10 bg-black/20 hover:border-white/20"
                                                    }`}
                                            >
                                                <Palette className="w-6 h-6 text-cyan-400" />
                                                <span className="text-sm text-white">Color Sólido</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBackgroundType("image")}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${backgroundType === "image"
                                                    ? "border-pink-500 bg-pink-500/10"
                                                    : "border-white/10 bg-black/20 hover:border-white/20"
                                                    }`}
                                            >
                                                <Image className="w-6 h-6 text-pink-400" />
                                                <span className="text-sm text-white">Imagen</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBackgroundType("video")}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${backgroundType === "video"
                                                    ? "border-purple-500 bg-purple-500/10"
                                                    : "border-white/10 bg-black/20 hover:border-white/20"
                                                    }`}
                                            >
                                                <Video className="w-6 h-6 text-purple-400" />
                                                <span className="text-sm text-white">Video</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Configuración según tipo */}
                                    {backgroundType === "solid" && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-300">
                                                Color de Fondo
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={backgroundColor}
                                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                                    className="w-12 h-12 rounded-xl border-2 border-white/20 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={backgroundColor}
                                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {backgroundType === "image" && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-300">
                                                URL de Imagen de Fondo
                                            </label>
                                            <div className="space-y-2">
                                                <div className="w-full h-24 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {backgroundImage ? (
                                                        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Image className="w-8 h-8 text-slate-600" />
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={backgroundImage}
                                                    onChange={(e) => setBackgroundImage(e.target.value)}
                                                    placeholder="https://ejemplo.com/fondo.jpg"
                                                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {backgroundType === "video" && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-slate-300">
                                                URL del Video de Fondo
                                            </label>
                                            <div className="flex gap-2">
                                                <div className="px-3 py-3 bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-400">
                                                    <MonitorPlay className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={backgroundVideo}
                                                    onChange={(e) => setBackgroundVideo(e.target.value)}
                                                    placeholder="https://ejemplo.com/video.mp4"
                                                    className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Formatos soportados: MP4, WebM. El video se reproducirá en loop sin sonido.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Fondos por Sección */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-amber-400" />
                                        Fondos por Sección
                                        <span className="text-xs font-normal text-slate-400 ml-2">(Opcional)</span>
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Personaliza el fondo de cada sección individualmente. Deja vacío para usar el fondo principal.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Hero */}
                                        <div className="space-y-2">
                                            <FirebaseImageUpload
                                                value={heroBackground}
                                                onChange={setHeroBackground}
                                                folder={`shops/${shop?.slug || "temp"}/backgrounds`}
                                                shopId={shop?.slug || "temp"}
                                                label="Sección Hero / Portada"
                                                aspectRatio="video"
                                                maxSizeMB={50}
                                            />
                                        </div>

                                        {/* Servicios */}
                                        <div className="space-y-2">
                                            <FirebaseImageUpload
                                                value={servicesBackground}
                                                onChange={setServicesBackground}
                                                folder={`shops/${shop?.slug || "temp"}/backgrounds`}
                                                shopId={shop?.slug || "temp"}
                                                label="Sección Servicios"
                                                aspectRatio="video"
                                                maxSizeMB={50}
                                            />
                                        </div>

                                        {/* Productos */}
                                        <div className="space-y-2">
                                            <FirebaseImageUpload
                                                value={productsBackground}
                                                onChange={setProductsBackground}
                                                folder={`shops/${shop?.slug || "temp"}/backgrounds`}
                                                shopId={shop?.slug || "temp"}
                                                label="Sección Productos"
                                                aspectRatio="video"
                                                maxSizeMB={50}
                                            />
                                        </div>

                                        {/* Contacto */}
                                        <div className="space-y-2">
                                            <FirebaseImageUpload
                                                value={contactBackground}
                                                onChange={setContactBackground}
                                                folder={`shops/${shop?.slug || "temp"}/backgrounds`}
                                                shopId={shop?.slug || "temp"}
                                                label="Sección Contacto"
                                                aspectRatio="video"
                                                maxSizeMB={50}
                                            />
                                        </div>
                                    </div>

                                    {/* Tip */}
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-xs text-amber-300">
                                            <strong>Tip:</strong> Usa imágenes optimizadas (menos de 500KB) para mejor rendimiento.
                                            Para videos, usa formatos comprimidos MP4 con resolución 720p o menor.
                                        </p>
                                    </div>
                                </div>

                                {/* Botón Guardar */}
                                <div className="flex justify-end gap-3">
                                    {appearanceSaveSuccess && (
                                        <span className="flex items-center gap-2 text-green-400 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            Apariencia guardada correctamente
                                        </span>
                                    )}
                                    <Button
                                        onClick={() => {
                                            setSavingAppearance(true);
                                            updateShop(shop.slug, {
                                                logo,
                                                banner,
                                                slogan,
                                                description,
                                                theme: {
                                                    ...shop.theme,
                                                    primaryColor,
                                                    accentColor,
                                                },
                                                background: {
                                                    type: backgroundType,
                                                    color: backgroundColor,
                                                    image: backgroundImage,
                                                    video: backgroundVideo,
                                                    hero: heroBackground,
                                                    services: servicesBackground,
                                                    products: productsBackground,
                                                    contact: contactBackground,
                                                },
                                                contact: {
                                                    ...shop.contact,
                                                    email,
                                                    address,
                                                    city,
                                                },
                                                social: {
                                                    instagram,
                                                    facebook,
                                                    tiktok,
                                                    website,
                                                },
                                            });
                                            // Actualizar shop local
                                            setShop(prev => prev ? {
                                                ...prev,
                                                logo,
                                                banner,
                                                slogan,
                                                description,
                                                theme: { ...prev.theme, primaryColor, accentColor },
                                                background: {
                                                    type: backgroundType,
                                                    color: backgroundColor,
                                                    image: backgroundImage,
                                                    video: backgroundVideo,
                                                    hero: heroBackground,
                                                    services: servicesBackground,
                                                    products: productsBackground,
                                                    contact: contactBackground,
                                                },
                                                contact: { ...prev.contact, email, address, city },
                                                social: { instagram, facebook, tiktok, website },
                                            } : prev);
                                            setTimeout(() => {
                                                setSavingAppearance(false);
                                                setAppearanceSaveSuccess(true);
                                                setTimeout(() => setAppearanceSaveSuccess(false), 3000);
                                            }, 500);
                                        }}
                                        disabled={savingAppearance}
                                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500"
                                    >
                                        {savingAppearance ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        {savingAppearance ? "Guardando..." : "Guardar Apariencia"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === "features" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Puzzle className="w-5 h-5 text-purple-400" />
                                    Funcionalidades Activas
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Activa o desactiva módulos para esta tienda. Los cambios se aplican inmediatamente.
                                </p>

                                {/* Inventory Features */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Inventario
                                    </h4>
                                    <FeatureToggle
                                        label="Inventario"
                                        description="Gestión de productos y stock"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("inventory")}
                                        onToggle={() => toggleFeature(shop.slug, "inventory")}
                                    />
                                    <FeatureToggle
                                        label="Variantes"
                                        description="Tallas, colores, opciones de producto"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("variants")}
                                        onToggle={() => toggleFeature(shop.slug, "variants")}
                                    />
                                    <FeatureToggle
                                        label="Alertas de Stock Bajo"
                                        description="Notificaciones cuando hay poco inventario"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("lowStockAlerts")}
                                        onToggle={() => toggleFeature(shop.slug, "lowStockAlerts")}
                                    />
                                </div>

                                {/* Orders Features */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        Pedidos
                                    </h4>
                                    <FeatureToggle
                                        label="Pedidos"
                                        description="Recepción y gestión de pedidos"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("orders")}
                                        onToggle={() => toggleFeature(shop.slug, "orders")}
                                    />
                                    <FeatureToggle
                                        label="Tablero Kanban"
                                        description="Vista visual de estados de pedidos"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("kanban")}
                                        onToggle={() => toggleFeature(shop.slug, "kanban")}
                                    />
                                    <FeatureToggle
                                        label="Integración WhatsApp"
                                        description="Mensajes automáticos por WhatsApp"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("whatsappIntegration")}
                                        onToggle={() => toggleFeature(shop.slug, "whatsappIntegration")}
                                    />
                                </div>

                                {/* CRM Features */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" />
                                        CRM / Clientes
                                    </h4>
                                    <FeatureToggle
                                        label="CRM"
                                        description="Base de datos de clientes"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("crm")}
                                        onToggle={() => toggleFeature(shop.slug, "crm")}
                                    />
                                    <FeatureToggle
                                        label="Historial de Cliente"
                                        description="Ver compras anteriores por cliente"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("clientHistory")}
                                        onToggle={() => toggleFeature(shop.slug, "clientHistory")}
                                    />
                                    <FeatureToggle
                                        label="Programa de Lealtad"
                                        description="Puntos y recompensas para clientes"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("loyalty")}
                                        onToggle={() => toggleFeature(shop.slug, "loyalty")}
                                    />
                                </div>

                                {/* Marketing Features */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Megaphone className="w-4 h-4" />
                                        Marketing
                                    </h4>
                                    <FeatureToggle
                                        label="Campañas"
                                        description="Email y WhatsApp marketing"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("campaigns")}
                                        onToggle={() => toggleFeature(shop.slug, "campaigns")}
                                    />
                                    <FeatureToggle
                                        label="Generador de Promos"
                                        description="Crear stories y gráficos promocionales"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("promoGenerator")}
                                        onToggle={() => toggleFeature(shop.slug, "promoGenerator")}
                                    />
                                    <FeatureToggle
                                        label="Email Marketing"
                                        description="Envío masivo de correos"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("emailMarketing")}
                                        onToggle={() => toggleFeature(shop.slug, "emailMarketing")}
                                    />
                                </div>

                                {/* Staff Features */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Personal
                                    </h4>
                                    <FeatureToggle
                                        label="Gestión de Staff"
                                        description="Usuarios y roles de empleados"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("staffManagement")}
                                        onToggle={() => toggleFeature(shop.slug, "staffManagement")}
                                    />
                                    <FeatureToggle
                                        label="Comisiones"
                                        description="Cálculo de comisiones por ventas"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("staffCommissions")}
                                        onToggle={() => toggleFeature(shop.slug, "staffCommissions")}
                                    />
                                </div>

                                {/* Advanced Features */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Avanzado
                                    </h4>
                                    <FeatureToggle
                                        label="Analytics"
                                        description="Reportes y estadísticas avanzadas"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("analytics")}
                                        onToggle={() => toggleFeature(shop.slug, "analytics")}
                                    />
                                    <FeatureToggle
                                        label="Multi-Ubicación"
                                        description="Gestionar múltiples sucursales"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("multiLocation")}
                                        onToggle={() => toggleFeature(shop.slug, "multiLocation")}
                                    />
                                    <FeatureToggle
                                        label="API"
                                        description="Acceso a API para integraciones"
                                        enabled={(shop.enabledFeatures || DEFAULT_FEATURES).includes("api")}
                                        onToggle={() => toggleFeature(shop.slug, "api")}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "staff" && (
                            <div className="space-y-6">
                                {/* Header con botón de agregar */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-400" />
                                            Empleados de la Tienda
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Gestiona los usuarios que pueden acceder al panel de esta tienda
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            resetStaffForm();
                                            setEditingStaff(null);
                                            setShowAddStaffModal(true);
                                        }}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Agregar Empleado
                                    </Button>
                                </div>

                                {/* Lista de empleados */}
                                <div className="space-y-3">
                                    {staffMembers.length === 0 ? (
                                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-400">No hay empleados registrados</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Agrega empleados para que puedan acceder al panel de la tienda
                                            </p>
                                        </div>
                                    ) : (
                                        staffMembers.map((staff) => (
                                            <div
                                                key={staff.id}
                                                className={`p-4 rounded-xl bg-white/5 border transition-all ${staff.isActive
                                                    ? "border-white/10 hover:border-white/20"
                                                    : "border-red-500/20 bg-red-500/5 opacity-60"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${staff.role === "owner" ? "bg-yellow-500" :
                                                            staff.role === "manager" ? "bg-purple-500" :
                                                                staff.role === "sales" ? "bg-blue-500" :
                                                                    "bg-orange-500"
                                                            }`}>
                                                            {staff.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-white">{staff.name}</p>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${staff.role === "owner" ? "bg-yellow-500/20 text-yellow-400" :
                                                                    staff.role === "manager" ? "bg-purple-500/20 text-purple-400" :
                                                                        staff.role === "sales" ? "bg-blue-500/20 text-blue-400" :
                                                                            "bg-orange-500/20 text-orange-400"
                                                                    }`}>
                                                                    {STAFF_ROLES[staff.role].label}
                                                                </span>
                                                                {!staff.isActive && (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                                                        Inactivo
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-400">{staff.email}</p>
                                                            {staff.phone && (
                                                                <p className="text-xs text-slate-500">{staff.phone}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStaffStatus(staff.id)}
                                                            className={staff.isActive ? "text-slate-400 hover:text-red-400" : "text-green-400 hover:text-green-300"}
                                                        >
                                                            {staff.isActive ? (
                                                                <EyeOff className="w-4 h-4" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditStaffModal(staff)}
                                                            className="text-slate-400 hover:text-cyan-400"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteStaff(staff.id)}
                                                            className="text-slate-400 hover:text-red-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Info de acceso */}
                                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                    <h4 className="font-medium text-cyan-400 text-sm mb-2">¿Cómo acceden los empleados?</h4>
                                    <p className="text-xs text-cyan-300/80">
                                        Los empleados pueden iniciar sesión en <code className="bg-black/20 px-1 rounded">/staff/login</code> usando
                                        su email y contraseña. El acceso está limitado según su rol asignado.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Modal para agregar/editar empleado */}
                        {showAddStaffModal && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[#1E293B] rounded-2xl border border-white/10 w-full max-w-md p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white">
                                            {editingStaff ? "Editar Empleado" : "Nuevo Empleado"}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowAddStaffModal(false);
                                                resetStaffForm();
                                                setEditingStaff(null);
                                            }}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                value={newStaffName}
                                                onChange={(e) => setNewStaffName(e.target.value)}
                                                placeholder="Ej: María García"
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Email (usuario de login) *
                                            </label>
                                            <input
                                                type="email"
                                                value={newStaffEmail}
                                                onChange={(e) => setNewStaffEmail(e.target.value)}
                                                placeholder="maria@tienda.com"
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Teléfono (opcional)
                                            </label>
                                            <input
                                                type="tel"
                                                value={newStaffPhone}
                                                onChange={(e) => setNewStaffPhone(e.target.value)}
                                                placeholder="555-123-4567"
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Rol
                                            </label>
                                            <select
                                                value={newStaffRole}
                                                onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                            >
                                                {ROLE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label} - {STAFF_ROLES[opt.value].description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                {editingStaff ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña *"}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showStaffPassword ? "text" : "password"}
                                                    value={newStaffPassword}
                                                    onChange={(e) => setNewStaffPassword(e.target.value)}
                                                    placeholder={editingStaff ? "••••••••" : "Mínimo 4 caracteres"}
                                                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    {showStaffPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="ghost"
                                            className="flex-1"
                                            onClick={() => {
                                                setShowAddStaffModal(false);
                                                resetStaffForm();
                                                setEditingStaff(null);
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                                            onClick={editingStaff ? handleUpdateStaff : handleAddStaff}
                                            disabled={!newStaffName || !newStaffEmail || (!editingStaff && !newStaffPassword)}
                                        >
                                            {editingStaff ? "Guardar Cambios" : "Crear Empleado"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "whatsapp" && (
                            <div className="space-y-6">
                                {/* Shared WhatsApp Component */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-green-400" />
                                        Bot de WhatsApp - {shop.name}
                                    </h3>
                                    <WhatsAppAutomationPanel
                                        shopSlug={shop.slug}
                                        title={`Configuración para ${shop.name}`}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Key className="w-5 h-5 text-red-400" />
                                    Credenciales de Acceso
                                </h3>

                                <div className="p-4 rounded-xl bg-black/20 border border-white/5 mb-6">
                                    <p className="text-sm text-slate-400 mb-2">Usuario Principal (Owner)</p>
                                    <code className="text-lg font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                                        {shop.ownerUsername}
                                    </code>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-white">Resetear Contraseña</h4>
                                    <p className="text-sm text-slate-400">
                                        Si el cliente olvidó su contraseña, puedes establecer una nueva aquí.
                                    </p>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="text"
                                            placeholder="Nueva contraseña temporal"
                                            className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <Button
                                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20"
                                            disabled={!newPassword}
                                            onClick={() => {
                                                if (newPassword && shop.ownerUsername) {
                                                    updateShopCredentials(shop.slug, shop.ownerUsername, newPassword);
                                                    setPasswordResetSuccess(true);
                                                    setNewPassword("");
                                                    setTimeout(() => setPasswordResetSuccess(false), 3000);
                                                }
                                            }}
                                        >
                                            Resetear
                                        </Button>
                                    </div>
                                    {passwordResetSuccess && (
                                        <p className="text-green-400 text-sm flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Contraseña actualizada correctamente
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ShopDetailPage() {
    return (
        <AuthProvider>
            <AgencyProvider>
                <ShopsProvider>
                    <ShopDetailContent />
                </ShopsProvider>
            </AgencyProvider>
        </AuthProvider>
    );
}

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, Trash2, ChevronUp, Sparkles, Rocket, Star, Package } from "lucide-react";
import { useCart } from "@/components/shared";
import Image from "next/image";
import { cn } from "@/lib/utils";

// GPU acceleration styles
const GPU_STYLE: React.CSSProperties = {
    willChange: "transform, opacity",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
};

// Spring configs
const SPRING_CONFIG = {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
};

const WARP_SPRING = {
    type: "spring" as const,
    stiffness: 400,
    damping: 20,
    mass: 0.6,
};

// Cosmic particle emojis
interface CosmicParticle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    rotation: number;
    scale: number;
}

const COSMIC_EMOJIS = ["✨", "⭐", "🌟", "💫", "🚀", "🌙", "☄️", "🪐"];

// Mini starfield for cart background
function MiniStarfield({ color = "#8B5CF6" }: { color?: string }) {
    const stars = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 3,
            duration: Math.random() * 2 + 2,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                        backgroundColor: color,
                        boxShadow: `0 0 ${star.size * 2}px ${color}`,
                    }}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: star.duration,
                        delay: star.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

// Nebula glow effect for cart
function NebulaGlow() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute -top-20 -left-20 w-40 h-40 rounded-full opacity-20"
                style={{
                    background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
                    filter: "blur(40px)",
                }}
                animate={{
                    x: [0, 20, 0],
                    y: [0, 10, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-20"
                style={{
                    background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
                    filter: "blur(40px)",
                }}
                animate={{
                    x: [0, -20, 0],
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}

export interface CosmicCartProps {
    primaryColor?: string;
    secondaryColor?: string;
}

export function CosmicCart({
    primaryColor = "#8B5CF6",
    secondaryColor = "#06B6D4",
}: CosmicCartProps) {
    const {
        products,
        totalItems,
        totalPrice,
        clearCart,
        updateProductQuantity,
        removeItem
    } = useCart();

    const [isExpanded, setIsExpanded] = useState(false);
    const [particles, setParticles] = useState<CosmicParticle[]>([]);
    const [isWarp, setIsWarp] = useState(false);
    const particleIdRef = useRef(0);

    // Track last totalItems to detect additions
    const lastTotalItems = useRef(totalItems);

    // Warp effect when item is added
    useEffect(() => {
        if (totalItems > lastTotalItems.current) {
            // Trigger warp animation
            setIsWarp(true);
            setTimeout(() => setIsWarp(false), 400);

            // Create cosmic particles
            const newParticles: CosmicParticle[] = Array.from({ length: 6 }, () => ({
                id: particleIdRef.current++,
                x: Math.random() * 120 - 60,
                y: Math.random() * -100 - 30,
                emoji: COSMIC_EMOJIS[Math.floor(Math.random() * COSMIC_EMOJIS.length)],
                rotation: Math.random() * 720 - 360,
                scale: Math.random() * 0.5 + 0.8,
            }));

            setParticles(prev => [...prev, ...newParticles]);

            // Clean up particles
            setTimeout(() => {
                setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
            }, 1200);
        }
        lastTotalItems.current = totalItems;
    }, [totalItems]);

    // Motion values for hover effects
    const scale = useMotionValue(1);
    const springScale = useSpring(scale, SPRING_CONFIG);

    if (totalItems === 0) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={cn(
                "fixed bottom-4 left-2 right-2 z-[70]",
                "sm:left-4 sm:right-4",
                "md:left-auto md:right-6 md:max-w-lg"
            )}
            style={GPU_STYLE}
        >
            {/* Cosmic particles */}
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                        animate={{
                            x: particle.x,
                            y: particle.y,
                            scale: particle.scale,
                            opacity: 0,
                            rotate: particle.rotation,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute bottom-full left-1/2 text-2xl pointer-events-none z-50"
                        style={GPU_STYLE}
                    >
                        {particle.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Main Cart Container */}
            <motion.div
                animate={isWarp ? {
                    scale: [1, 1.08, 0.95, 1.02, 1],
                    rotate: [0, -1, 1, -0.5, 0],
                } : {}}
                transition={WARP_SPRING}
                className={cn(
                    "relative overflow-hidden rounded-2xl",
                    "bg-gradient-to-br from-violet-950/95 via-slate-900/95 to-cyan-950/95",
                    "border border-violet-500/30",
                    "shadow-[0_0_30px_rgba(139,92,246,0.3),0_0_60px_rgba(6,182,212,0.15)]",
                    "backdrop-blur-xl"
                )}
                style={GPU_STYLE}
                onHoverStart={() => scale.set(1.01)}
                onHoverEnd={() => scale.set(1)}
            >
                {/* Background effects */}
                <MiniStarfield color={primaryColor} />
                <NebulaGlow />

                {/* Top gradient line */}
                <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${primaryColor}, ${secondaryColor}, transparent)`,
                    }}
                />

                {/* Cart Summary Bar */}
                <div className="relative z-10 p-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Icon + Count */}
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={isWarp ? {
                                    rotate: [0, 360],
                                    scale: [1, 1.2, 1],
                                } : {}}
                                transition={{ duration: 0.5 }}
                                className="relative"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}20)`,
                                        border: `1px solid ${primaryColor}50`,
                                        boxShadow: `0 0 20px ${primaryColor}30`,
                                    }}
                                >
                                    <ShoppingBag className="w-6 h-6" style={{ color: primaryColor }} />
                                </div>
                                {/* Badge */}
                                <motion.div
                                    key={totalItems}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                        boxShadow: `0 0 10px ${primaryColor}`,
                                    }}
                                >
                                    {totalItems}
                                </motion.div>
                            </motion.div>

                            <div>
                                <p className="text-white font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" style={{ color: secondaryColor }} />
                                    CARRITO
                                </p>
                                <p className="text-violet-300/70 text-xs tracking-widest">
                                    {totalItems} {totalItems === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Total + Actions */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] text-violet-400/60 uppercase tracking-widest">TOTAL</p>
                                <motion.p
                                    key={totalPrice}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                    className="text-xl font-black text-transparent bg-clip-text"
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                    }}
                                >
                                    ${totalPrice.toLocaleString()}
                                </motion.p>
                            </div>

                            {/* Checkout Button */}
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${primaryColor}60` }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-white font-bold uppercase tracking-wider text-sm",
                                    "border border-transparent",
                                    "transition-all duration-300"
                                )}
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                    boxShadow: `0 0 20px ${primaryColor}40`,
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <Rocket className="w-4 h-4" />
                                    PAGAR
                                </span>
                            </motion.button>

                            {/* Clear Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={clearCart}
                                className="p-2 text-violet-400/50 hover:text-cyan-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Expand Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-4 pt-3 border-t border-violet-500/20 flex items-center justify-center gap-2 text-xs text-violet-300/60 hover:text-cyan-400 transition-colors uppercase tracking-[0.3em]"
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronUp className="w-4 h-4" />
                        </motion.div>
                        <span>{isExpanded ? 'OCULTAR' : 'VER ARTÍCULOS'}</span>
                    </button>
                </div>

                {/* Expanded Cart Items */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden relative z-10"
                        >
                            <div
                                className="border-t max-h-[50vh] overflow-y-auto"
                                style={{ borderColor: `${primaryColor}30` }}
                            >
                                {products.map((product, idx) => (
                                    <CosmicCartItem
                                        key={`${product.id}-${product.variantId || ""}-${idx}`}
                                        product={product}
                                        index={idx}
                                        primaryColor={primaryColor}
                                        secondaryColor={secondaryColor}
                                        onUpdateQuantity={(qty) =>
                                            updateProductQuantity(product.id, qty, product.variantId)
                                        }
                                        onRemove={() => removeItem(product.id, product.variantId)}
                                    />
                                ))}

                                {/* Cosmic message */}
                                <div
                                    className="p-4 border-t"
                                    style={{
                                        borderColor: `${primaryColor}20`,
                                        background: `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)`,
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Star className="w-4 h-4" style={{ color: secondaryColor }} />
                                        </motion.div>
                                        <span className="text-violet-300/70">
                                            Envío a cualquier galaxia disponible
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom gradient line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${secondaryColor}, ${primaryColor}, transparent)`,
                    }}
                />
            </motion.div>
        </motion.div>
    );
}

// Individual Cart Item Component
interface CosmicCartItemProps {
    product: {
        id: string;
        name: string;
        price: number;
        promoPrice?: number;
        quantity: number;
        image?: string;
        variantId?: string;
        variantName?: string;
        selectedExtras?: Array<{ extraId: string; name: string; price: number }>;
        extrasTotal?: number;
    };
    index: number;
    primaryColor: string;
    secondaryColor: string;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

function CosmicCartItem({
    product,
    index,
    primaryColor,
    secondaryColor,
    onUpdateQuantity,
    onRemove
}: CosmicCartItemProps) {
    const itemPrice = (product.promoPrice || product.price) + (product.extrasTotal || 0);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = () => {
        setIsRemoving(true);
        setTimeout(onRemove, 300);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
                opacity: isRemoving ? 0 : 1,
                x: isRemoving ? -100 : 0,
                height: isRemoving ? 0 : "auto",
                scale: isRemoving ? 0.8 : 1,
            }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center gap-4 p-4 border-b transition-colors"
            style={{
                borderColor: `${primaryColor}15`,
            }}
        >
            {/* Product Image */}
            <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                    border: `1px solid ${primaryColor}30`,
                }}
            >
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8" style={{ color: `${primaryColor}60` }} />
                    </div>
                )}

                {/* Cosmic overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(180deg, transparent 50%, ${primaryColor}30 100%)`,
                    }}
                />
            </motion.div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold uppercase tracking-wider text-sm truncate">
                    {product.name}
                </h4>
                {product.variantName && (
                    <p className="text-xs tracking-wider" style={{ color: secondaryColor }}>
                        {product.variantName}
                    </p>
                )}
                {product.selectedExtras && product.selectedExtras.length > 0 && (
                    <p className="text-violet-400/50 text-xs truncate">
                        +{product.selectedExtras.map(e => e.name).join(", ")}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <span
                        className="font-black text-transparent bg-clip-text"
                        style={{
                            backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                    >
                        ${(itemPrice * product.quantity).toLocaleString()}
                    </span>
                    {product.quantity > 1 && (
                        <span className="text-violet-400/40 text-xs">
                            (${itemPrice.toLocaleString()} c/u)
                        </span>
                    )}
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                        if (product.quantity > 1) {
                            onUpdateQuantity(product.quantity - 1);
                        } else {
                            handleRemove();
                        }
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg",
                        "transition-all duration-200"
                    )}
                    style={{
                        border: `1px solid ${primaryColor}40`,
                        color: primaryColor,
                    }}
                >
                    {product.quantity === 1 ? (
                        <Trash2 className="w-4 h-4" />
                    ) : (
                        <Minus className="w-4 h-4" />
                    )}
                </motion.button>

                <motion.span
                    key={product.quantity}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-10 text-center text-white font-bold"
                >
                    {product.quantity}
                </motion.span>

                <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => onUpdateQuantity(product.quantity + 1)}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg",
                        "transition-all duration-200"
                    )}
                    style={{
                        border: `1px solid ${primaryColor}40`,
                        color: primaryColor,
                    }}
                >
                    <Plus className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}

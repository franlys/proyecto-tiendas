"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, Trash2, ChevronUp, Flame, Zap, Star, Package } from "lucide-react";
import { useCart } from "@/components/shared";
import Image from "next/image";
import { cn } from "@/lib/utils";

// GPU acceleration styles
const GPU_STYLE: React.CSSProperties = {
    willChange: "transform, opacity",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
};

// Premium spring configs
const SPRING_CONFIG = {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
};

const SLAM_SPRING = {
    type: "spring" as const,
    stiffness: 600,
    damping: 25,
    mass: 0.8,
};

// Add to cart animation particles
interface Particle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    rotation: number;
}

const SLAM_EMOJIS = ["🔥", "💯", "⚡", "🖤", "💀", "⭐"];

export function StreetCart() {
    const {
        products,
        totalItems,
        totalPrice,
        clearCart,
        updateProductQuantity,
        removeItem
    } = useCart();

    const [isExpanded, setIsExpanded] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isSlam, setIsSlam] = useState(false);
    const particleIdRef = useRef(0);

    // Track last totalItems to detect additions
    const lastTotalItems = useRef(totalItems);

    // Slam effect when item is added
    useEffect(() => {
        if (totalItems > lastTotalItems.current) {
            // Trigger slam animation
            setIsSlam(true);
            setTimeout(() => setIsSlam(false), 300);

            // Create particles
            const newParticles: Particle[] = Array.from({ length: 5 }, () => ({
                id: particleIdRef.current++,
                x: Math.random() * 100 - 50,
                y: Math.random() * -80 - 20,
                emoji: SLAM_EMOJIS[Math.floor(Math.random() * SLAM_EMOJIS.length)],
                rotation: Math.random() * 360,
            }));

            setParticles(prev => [...prev, ...newParticles]);

            // Clean up particles
            setTimeout(() => {
                setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
            }, 1000);
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
            {/* Slam particles */}
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                        animate={{
                            x: particle.x,
                            y: particle.y,
                            scale: 1,
                            opacity: 0,
                            rotate: particle.rotation,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute bottom-full left-1/2 text-2xl pointer-events-none z-50"
                        style={GPU_STYLE}
                    >
                        {particle.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Main Cart Container */}
            <motion.div
                animate={isSlam ? {
                    scale: [1, 1.05, 0.98, 1],
                    rotate: [0, -2, 2, 0],
                } : {}}
                transition={SLAM_SPRING}
                className={cn(
                    "relative overflow-hidden",
                    "bg-black/95 border-2 border-red-500",
                    "shadow-[5px_5px_0px_rgba(255,0,51,1),10px_10px_0px_rgba(0,0,0,1)]",
                    "backdrop-blur-xl"
                )}
                style={GPU_STYLE}
                onHoverStart={() => scale.set(1.02)}
                onHoverEnd={() => scale.set(1)}
            >
                {/* Glitch line effect */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 animate-pulse" />

                {/* Cart Summary Bar */}
                <div className="p-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Icon + Count */}
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={isSlam ? { rotate: [0, -10, 10, 0] } : {}}
                                className="relative"
                            >
                                <div className="w-12 h-12 bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-red-500" />
                                </div>
                                {/* Badge */}
                                <motion.div
                                    key={totalItems}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-black flex items-center justify-center"
                                >
                                    {totalItems}
                                </motion.div>
                            </motion.div>

                            <div>
                                <p className="text-white font-black uppercase tracking-widest text-sm">
                                    YOUR CART
                                </p>
                                <p className="text-slate-400 text-xs font-mono">
                                    {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'} SECURED
                                </p>
                            </div>
                        </div>

                        {/* Right: Total + Actions */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">TOTAL</p>
                                <motion.p
                                    key={totalPrice}
                                    initial={{ scale: 1.2, color: "#FF0033" }}
                                    animate={{ scale: 1, color: "#ffffff" }}
                                    className="text-xl font-black text-white"
                                >
                                    ${totalPrice.toLocaleString()}
                                </motion.p>
                            </div>

                            {/* Checkout Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "px-6 py-3 bg-red-500 text-white font-black uppercase tracking-widest text-sm",
                                    "border-2 border-red-500",
                                    "hover:bg-black hover:text-red-500 transition-colors",
                                    "shadow-[3px_3px_0px_rgba(0,0,0,1)]",
                                    "active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    CHECKOUT
                                </span>
                            </motion.button>

                            {/* Clear Button */}
                            <button
                                onClick={clearCart}
                                className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Expand Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-4 pt-3 border-t border-red-500/30 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronUp className="w-4 h-4" />
                        </motion.div>
                        <span>{isExpanded ? 'HIDE ITEMS' : 'VIEW ITEMS'}</span>
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
                            className="overflow-hidden"
                        >
                            <div className="border-t-2 border-red-500/30 max-h-[50vh] overflow-y-auto">
                                {products.map((product, idx) => (
                                    <CartItem
                                        key={`${product.id}-${product.variantId || ""}-${idx}`}
                                        product={product}
                                        index={idx}
                                        onUpdateQuantity={(qty) =>
                                            updateProductQuantity(product.id, qty, product.variantId)
                                        }
                                        onRemove={() => removeItem(product.id, product.variantId)}
                                    />
                                ))}

                                {/* Urgency Message */}
                                <div className="p-4 bg-red-500/10 border-t border-red-500/30">
                                    <div className="flex items-center gap-2 text-red-400 text-xs font-mono uppercase">
                                        <Flame className="w-4 h-4 animate-pulse" />
                                        <span>Limited stock - Items may sell out</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

// Individual Cart Item Component
interface CartItemProps {
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
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

function CartItem({ product, index, onUpdateQuantity, onRemove }: CartItemProps) {
    const itemPrice = (product.promoPrice || product.price) + (product.extrasTotal || 0);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = () => {
        setIsRemoving(true);
        setTimeout(onRemove, 200);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
                opacity: isRemoving ? 0 : 1,
                x: isRemoving ? -50 : 0,
                height: isRemoving ? 0 : "auto",
            }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 border-b border-red-500/20 hover:bg-red-500/5 transition-colors"
            style={GPU_STYLE}
        >
            {/* Product Image */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-20 h-20 bg-black border border-red-500/30 overflow-hidden flex-shrink-0"
            >
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-red-500/50" />
                    </div>
                )}

                {/* VHS scanlines effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/30 opacity-50" />
            </motion.div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-black uppercase tracking-wider text-sm truncate">
                    {product.name}
                </h4>
                {product.variantName && (
                    <p className="text-red-400 text-xs font-mono uppercase">
                        {product.variantName}
                    </p>
                )}
                {product.selectedExtras && product.selectedExtras.length > 0 && (
                    <p className="text-slate-500 text-xs truncate">
                        +{product.selectedExtras.map(e => e.name).join(", ")}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-red-500 font-black">
                        ${(itemPrice * product.quantity).toLocaleString()}
                    </span>
                    {product.quantity > 1 && (
                        <span className="text-slate-500 text-xs">
                            (${itemPrice.toLocaleString()} c/u)
                        </span>
                    )}
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (product.quantity > 1) {
                            onUpdateQuantity(product.quantity - 1);
                        } else {
                            handleRemove();
                        }
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center",
                        "border border-red-500/30 text-red-400",
                        "hover:bg-red-500/20 transition-colors"
                    )}
                >
                    {product.quantity === 1 ? (
                        <Trash2 className="w-4 h-4" />
                    ) : (
                        <Minus className="w-4 h-4" />
                    )}
                </motion.button>

                <motion.span
                    key={product.quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-10 text-center text-white font-black"
                >
                    {product.quantity}
                </motion.span>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onUpdateQuantity(product.quantity + 1)}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center",
                        "border border-red-500/30 text-red-400",
                        "hover:bg-red-500/20 transition-colors"
                    )}
                >
                    <Plus className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  useSearchParams,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import API from "../services/api";
import axios from "axios";
import { io } from "socket.io-client";
import { gooeyToast } from "goey-toast";
import {
  Sparkles,
  ShoppingBag,
  Utensils,
  Flame,
  Search,
  ChevronRight,
  Wallet,
  QrCode,
  Tag,
  X,
  Check,
  Clock,
  Package,
  Star,
  Coffee,
  Cookie,
  IceCream,
  Percent,
  Zap,
} from "lucide-react";

export default function ClientOrderPage() {
  const { tableNumber: paramTableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tableNumber = paramTableNumber || searchParams.get("table") || "1";

  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);

  // State untuk Modal Add-On (Multi-select)
  const [selectedBundleModal, setSelectedBundleModal] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({});

  const [paymentMethod, setPaymentMethod] = useState("qris");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [customerInfo, setCustomerInfo] = useState(() => {
    const saved = localStorage.getItem("swift_customer_info");
    return saved ? JSON.parse(saved) : { name: "", email: "", phone: "" };
  });

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(() => {
    const saved = localStorage.getItem("swift_customer_info");
    const parsed = saved ? JSON.parse(saved) : {};
    return !parsed.name || !parsed.phone;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchMenus();

    const midtransUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = "Mid-client-Wc7y3D9VmGino8oi";

    const scriptTag = document.createElement("script");
    scriptTag.src = midtransUrl;
    scriptTag.setAttribute("data-client-key", clientKey);
    scriptTag.async = true;
    document.body.appendChild(scriptTag);

    const socket = io("https://api.swiftorder.space", {
      transports: ["websocket", "polling"],
    });

    socket.on("menu-status-updated", (updatedMenu) => {
      setMenus((prevMenus) =>
        prevMenus.map((menu) =>
          menu._id === updatedMenu._id ? updatedMenu : menu,
        ),
      );
    });

    socket.on("menu-updated", (updatedMenu) => {
      setMenus((prevMenus) => {
        const exists = prevMenus.some((m) => m._id === updatedMenu._id);
        if (exists) {
          return prevMenus.map((menu) =>
            menu._id === updatedMenu._id ? updatedMenu : menu,
          );
        } else {
          return [updatedMenu, ...prevMenus];
        }
      });
    });

    return () => {
      socket.disconnect();
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await API.get("/menus");
      setMenus(res.data);
    } catch (err) {
      console.error("Gagal memuat menu", err);
    }
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!customerInfo.name.trim()) return alert("Silakan masukkan nama Anda!");
    if (!customerInfo.phone.trim())
      return alert("Silakan masukkan nomor HP Anda!");

    localStorage.setItem("swift_customer_info", JSON.stringify(customerInfo));
    setIsCustomerModalOpen(false);
  };

  const handleCardClick = (menu) => {
    if (!menu.isAvailable) return;

    if (menu.isBundle && menu.bundleOptions && menu.bundleOptions.length > 0) {
      setSelectedBundleModal(menu);
      setSelectedAddons({});
    } else {
      addToCart(menu, null, {});
    }
  };

  const toggleAddonSelection = (optionTitle, choiceObj) => {
    setSelectedAddons((prev) => {
      const currentList = prev[optionTitle] || [];
      const exists = currentList.some((item) => item.name === choiceObj.name);

      let updatedList;
      if (exists) {
        updatedList = currentList.filter(
          (item) => item.name !== choiceObj.name,
        );
      } else {
        updatedList = [...currentList, choiceObj];
      }

      return {
        ...prev,
        [optionTitle]: updatedList,
      };
    });
  };

  const addToCart = (menu, e, chosenAddons = {}) => {
    if (e) e.stopPropagation();
    if (!menu.isAvailable) return;

    let addonTotalPrice = 0;
    Object.values(chosenAddons).forEach((addonArray) => {
      if (Array.isArray(addonArray)) {
        addonArray.forEach((addon) => {
          addonTotalPrice += Number(addon.price || 0);
        });
      }
    });

    const baseMenuPrice = menu.price;
    const finalItemPrice = baseMenuPrice + addonTotalPrice;

    const existingIndex = cart.findIndex((item) => {
      if (item.menuId !== menu._id) return false;
      return (
        JSON.stringify(item.selectedBundleChoices || {}) ===
        JSON.stringify(chosenAddons || {})
      );
    });

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          menuId: menu._id,
          name: menu.name,
          price: finalItemPrice,
          basePrice: baseMenuPrice,
          originalPrice: menu.originalPrice || 0,
          image: menu.image,
          quantity: 1,
          selectedBundleChoices: chosenAddons,
        },
      ]);
    }
    gooeyToast.info(`${menu.name} ditambahkan ke keranjang`, {
      displayDuration: 1200,
    });
  };

  const updateQuantity = (menuId, bundleChoicesObj, delta, e) => {
    if (e) e.stopPropagation();
    const updatedCart = cart
      .map((item) => {
        const isSameMenu = item.menuId === menuId;
        const isSameChoices =
          JSON.stringify(item.selectedBundleChoices || {}) ===
          JSON.stringify(bundleChoicesObj || {});

        if (isSameMenu && isSameChoices) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    setCart(updatedCart);

    if (updatedCart.length === 0) {
      removeCoupon();
    }
  };

  const getCartQuantity = (menuId) => {
    return cart
      .filter((i) => i.menuId === menuId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchesSearch =
        menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (menu.description &&
          menu.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = true;
      if (selectedCategory === "Semua") {
        matchesCategory = true;
      } else if (selectedCategory === "Promo") {
        matchesCategory =
          menu.isBundle === true ||
          (menu.originalPrice && menu.originalPrice > menu.price);
      } else if (selectedCategory === "Terpopuler") {
        matchesCategory = true;
      } else {
        matchesCategory =
          menu.category?.toLowerCase() === selectedCategory.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [menus, searchQuery, selectedCategory]);

  const groupedMenus = useMemo(() => {
    if (selectedCategory !== "Semua") return null;

    const promoItems = filteredMenus.filter(
      (menu) =>
        menu.isBundle === true ||
        (menu.originalPrice && menu.originalPrice > menu.price),
    );

    const groups = {};
    if (promoItems.length > 0) {
      groups["🔥 Promo & Penawaran Spesial"] = promoItems;
    }

    filteredMenus.forEach((menu) => {
      const cat = menu.category || "Lainnya";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      if (!groups[cat].some((m) => m._id === menu._id)) {
        groups[cat].push(menu);
      }
    });

    return groups;
  }, [filteredMenus, selectedCategory]);

  const subtotalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const subtotalOriginalPrice = cart.reduce((sum, item) => {
    const itemPrice = item.price || 0;
    const origItemPrice = item.originalPrice || item.basePrice || itemPrice;

    let itemAddonSubtotal = 0;
    if (
      item.selectedBundleChoices &&
      typeof item.selectedBundleChoices === "object"
    ) {
      Object.entries(item.selectedBundleChoices).forEach(([title, addons]) => {
        if (Array.isArray(addons)) {
          addons.forEach((addon) => {
            itemAddonSubtotal += Number(addon.price || 0);
          });
        }
      });
    }

    const origTotalItemPriceWithAddon =
      (origItemPrice + itemAddonSubtotal) * item.quantity;
    return sum + origTotalItemPriceWithAddon;
  }, 0);

  const totalMenuSavings = cart.reduce((sum, item) => {
    const orig = item.originalPrice || 0;
    const base = item.basePrice !== undefined ? item.basePrice : item.price;
    if (orig > base) {
      return sum + (orig - base) * item.quantity;
    }
    return sum;
  }, 0);

  const priceAfterDiscount = Math.max(0, subtotalPrice - discountAmount);
  const serviceFee = priceAfterDiscount * 0.05;
  const finalTotalPrice = priceAfterDiscount + serviceFee;

  const originalServiceFee = Math.round(
    (subtotalOriginalPrice - totalMenuSavings - discountAmount) * 0.05,
  );
  const originalTotalBeforeDiscount =
    subtotalOriginalPrice + originalServiceFee;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const res = await API.post("/coupons/validate", {
        code: couponInput,
        subtotal: subtotalPrice,
      });

      setAppliedCoupon(res.data.code);
      setDiscountAmount(res.data.discountAmount);
      gooeyToast.success(`Kupon ${res.data.code} berhasil diterapkan!`);
    } catch (err) {
      console.error("Gagal memvalidasi kupon", err);
      gooeyToast.error(err.response?.data?.error || "Kode kupon tidak valid.");
      removeCoupon();
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponInput("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    if (!customerInfo.name.trim()) {
      setIsCustomerModalOpen(true);
      return alert("Silakan lengkapi informasi customer terlebih dahulu.");
    }

    setIsSubmitting(true);
    try {
      const response = await API.post("/orders", {
        tableNumber: Number(tableNumber),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        subtotal: subtotalPrice,
        discountAmount: discountAmount,
        couponCode: appliedCoupon,
        serviceFee: serviceFee,
        totalAmount: finalTotalPrice,
        paymentMethod: paymentMethod,
        items: cart.map((item) => ({
          menu: item.menuId,
          menuId: item.menuId,
          quantity: item.quantity,
          selectedBundleChoices: item.selectedBundleChoices || {},
        })),
      });

      const newOrder = response.data.order || response.data;

      if (paymentMethod === "cash") {
        gooeyToast.success(
          "Pesanan berhasil dibuat! Silakan lakukan pembayaran tunai di kasir.",
        );
        setCart([]);
        removeCoupon();
        setIsCartOpen(false);
        navigate(`/waiting/${newOrder._id}`, {
          state: { order: newOrder },
          replace: true,
        });
      } else {
        if (!window.snap) {
          alert(
            "Gerbang pembayaran Midtrans belum siap. Coba muat ulang halaman.",
          );
          setIsSubmitting(false);
          return;
        }

        const paymentRes = await API.post("/payments/create-transaction", {
          orderId: newOrder._id,
          totalAmount: newOrder.totalAmount,
          customerName: newOrder.customerName,
          items: newOrder.items,
          couponCode: appliedCoupon,
          discountAmount: discountAmount,
        });

        const snapToken = paymentRes.data.token;

        window.snap.pay(snapToken, {
          onSuccess: async function (result) {
            gooeyToast.success(
              "Pembayaran Berhasil! Pesanan diproses ke dapur.",
            );
            try {
              await API.patch(`/orders/${newOrder._id}/status`, {
                status: "processing",
                isPaid: true,
              });
            } catch (updateErr) {
              console.error(
                "Gagal memperbarui status setelah bayar",
                updateErr,
              );
            }
            setCart([]);
            removeCoupon();
            setIsCartOpen(false);
            navigate(`/waiting/${newOrder._id}`, {
              state: {
                order: { ...newOrder, orderStatus: "processing", isPaid: true },
              },
              replace: true,
            });
          },
          onPending: function (result) {
            gooeyToast.warning("Menunggu penyelesaian pembayaran.");
            setCart([]);
            removeCoupon();
            setIsCartOpen(false);
            navigate(`/waiting/${newOrder._id}`, {
              state: { order: newOrder },
              replace: true,
            });
          },
          onError: function (result) {
            gooeyToast.error("Pembayaran gagal.");
          },
          onClose: function () {
            gooeyToast.info(
              "Jendela pembayaran ditutup. Anda dapat melanjutkan pembayaran dari status pesanan.",
            );
          },
        });
      }
    } catch (err) {
      console.error("Gagal memproses pesanan dan pembayaran", err);
      const errorMessage =
        err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Gagal memproses pesanan: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-28">
      {/* MODAL CUSTOMER INFO */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/80 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div>
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shadow-md mb-4">
                <Utensils className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-neutral-900">
                Selamat Datang di Swift Ordering 👋
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Silakan isi data diri Anda untuk meja{" "}
                <span className="text-neutral-900 font-extrabold">
                  #{tableNumber}
                </span>{" "}
                sebelum mulai memesan.
              </p>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 uppercase mb-1.5 tracking-wider">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, name: e.target.value })
                  }
                  placeholder="Masukkan nama Anda..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 uppercase mb-1.5 tracking-wider">
                  Nomor HP / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 uppercase mb-1.5 tracking-wider">
                  Email{" "}
                  <span className="text-neutral-400 font-normal">
                    (Opsional)
                  </span>
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  placeholder="email@domain.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-900 text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-neutral-800 transition shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Mulai Pesan Menu</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PILIHAN ADD-ON BERBAYAR (MULTI-SELECT & TOMBOL LEWATI) */}
      {selectedBundleModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900">
                Pilih Add-On: {selectedBundleModal.name}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pilih beberapa tambahan add-on sesuai selera Anda, atau lewati
                jika tidak ingin menambah.
              </p>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {selectedBundleModal.bundleOptions?.map((opt, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider block">
                    {opt.title || "ADD ON"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {opt.choices.map((choice, cIdx) => {
                      const choiceObj =
                        typeof choice === "string"
                          ? { name: choice, price: 0 }
                          : choice;
                      const isSelected = (
                        selectedAddons[opt.title || "ADD ON"] || []
                      ).some((item) => item.name === choiceObj.name);

                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() =>
                            toggleAddonSelection(
                              opt.title || "ADD ON",
                              choiceObj,
                            )
                          }
                          className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <span>{choiceObj.name}</span>
                          {choiceObj.price > 0 && (
                            <span
                              className={`text-[10px] font-mono ${
                                isSelected
                                  ? "text-amber-300"
                                  : "text-emerald-600"
                              }`}
                            >
                              +Rp {choiceObj.price.toLocaleString("id-ID")}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  addToCart(selectedBundleModal, null, {});
                  setSelectedBundleModal(null);
                }}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Tanpa Add-On
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart(selectedBundleModal, null, selectedAddons);
                  setSelectedBundleModal(null);
                }}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER ATTRACTION */}
      <div className="relative bg-neutral-900 text-white py-12 px-6 md:px-12 overflow-hidden mb-8 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Self-Ordering Digital Experience</span>
              </div>
              <Link
                to={`/order-history?table=${tableNumber}`}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white border border-white/20 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Riwayat Pesanan</span>
              </Link>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Nikmati Hidangan Terbaik Kami
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Pesan makanan dan minuman favorit langsung dari meja Anda dengan
              mudah, cepat, dan transparan.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white text-neutral-900 flex items-center justify-center font-black text-lg shadow-inner">
              #{tableNumber}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                Status Meja
              </p>
              <p className="text-sm font-extrabold text-white">
                {customerInfo.name
                  ? `Halo, ${customerInfo.name}`
                  : "Tamu Terhormat"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6">
        {/* SEARCH & CATEGORY BAR */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari makanan atau minuman favorit..."
              className="w-full bg-white border border-neutral-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm text-neutral-900 focus:outline-none focus:border-neutral-400 shadow-2xs font-medium"
            />
          </div>

          {/* SUB-KATEGORI / FILTER PILIHAN */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { name: "Semua", icon: Utensils },
              { name: "Promo", icon: Percent },
              { name: "Terpopuler", icon: Star },
              { name: "Makanan", icon: Flame },
              { name: "Minuman", icon: Coffee },
              { name: "Snack", icon: Cookie },
              { name: "Dessert", icon: IceCream },
            ].map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-2xs flex items-center gap-2 ${
                    selectedCategory === cat.name
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-white text-neutral-600 border border-neutral-200/80 hover:text-neutral-900 hover:border-neutral-300"
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MENU LIST */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Katalog Menu: {selectedCategory}
            </h2>
            <span className="text-xs font-bold text-neutral-400 font-mono">
              {filteredMenus.length} Menu Tersedia
            </span>
          </div>

          {filteredMenus.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl shadow-2xs space-y-2">
              <p className="text-xs font-bold text-neutral-700">
                Menu tidak ditemukan untuk kategori "{selectedCategory}"
              </p>
              <p className="text-[11px] text-neutral-400">
                Coba kata kunci atau pilih kategori lain.
              </p>
            </div>
          ) : selectedCategory === "Semua" && groupedMenus ? (
            Object.entries(groupedMenus).map(
              ([categoryName, menusInCategory]) => (
                <div key={categoryName} className="space-y-3">
                  <div
                    className={`flex items-center gap-3 pt-4 pb-1 border-b ${
                      categoryName.includes("Promo")
                        ? "border-amber-300 bg-amber-50/50 px-4 py-3 rounded-2xl mb-2"
                        : "border-neutral-200/60"
                    }`}
                  >
                    <h3
                      className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
                        categoryName.includes("Promo")
                          ? "text-amber-900"
                          : "text-neutral-900"
                      }`}
                    >
                      {categoryName.includes("Promo") ? (
                        <Zap className="w-4 h-4 text-amber-600 animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
                      )}
                      {categoryName}
                    </h3>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        categoryName.includes("Promo")
                          ? "bg-amber-200 text-amber-900"
                          : "bg-neutral-200/60 text-neutral-400"
                      }`}
                    >
                      {menusInCategory.length} Item
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {menusInCategory.map((menu) => {
                      const qty = getCartQuantity(menu._id);
                      const isPromoItem =
                        menu.isBundle ||
                        (menu.originalPrice && menu.originalPrice > menu.price);
                      const discountPercentage =
                        menu.originalPrice > menu.price
                          ? Math.round(
                              ((menu.originalPrice - menu.price) /
                                menu.originalPrice) *
                                100,
                            )
                          : 0;

                      return (
                        <div
                          key={menu._id}
                          onClick={() => handleCardClick(menu)}
                          className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between transition group relative shadow-2xs hover:shadow-md ${
                            menu.isAvailable
                              ? isPromoItem
                                ? "border-amber-300 ring-1 ring-amber-200 hover:border-amber-400 cursor-pointer bg-gradient-to-b from-amber-50/20 to-white"
                                : "border-neutral-200/80 hover:border-neutral-400 cursor-pointer"
                              : "border-neutral-200/50 opacity-60 cursor-not-allowed bg-neutral-100/50"
                          }`}
                        >
                          <div>
                            <div className="relative h-32 w-full bg-neutral-100 overflow-hidden">
                              {menu.image ? (
                                <img
                                  src={menu.image}
                                  alt={menu.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px] font-medium">
                                  Tidak ada foto
                                </div>
                              )}
                              <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                                <span
                                  className={`px-2.5 py-1 text-[9px] rounded-full font-extrabold shadow-sm backdrop-blur-md ${
                                    menu.isAvailable
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-neutral-200 text-neutral-600 border border-neutral-300"
                                  }`}
                                >
                                  {menu.isAvailable ? "Tersedia" : "Habis"}
                                </span>
                                {menu.isBundle && (
                                  <span className="px-2 py-0.5 text-[8px] rounded-full font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                                    <Package className="w-3 h-3" /> Add-On
                                  </span>
                                )}
                              </div>

                              {qty > 0 && (
                                <div className="absolute top-2.5 left-2.5 bg-neutral-900 text-white font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
                                  {qty}
                                </div>
                              )}
                            </div>

                            <div className="p-3.5 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                                {menu.category}
                              </span>
                              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                                {menu.name}
                              </h3>
                              {menu.description ? (
                                <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                                  {menu.description}
                                </p>
                              ) : (
                                <p className="text-[11px] text-neutral-300 italic">
                                  Tanpa deskripsi
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="p-3.5 pt-0 flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-black text-emerald-600">
                                Rp {menu.price.toLocaleString("id-ID")}
                              </span>
                              {menu.originalPrice > menu.price && (
                                <span className="text-[9px] font-mono text-neutral-400 line-through">
                                  Rp{" "}
                                  {menu.originalPrice.toLocaleString("id-ID")}
                                </span>
                              )}
                            </div>

                            {menu.isAvailable ? (
                              <span
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition shadow-2xs ${
                                  menu.isBundle
                                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200"
                                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-900 hover:text-white"
                                }`}
                              >
                                {menu.isBundle ? "+ Pilih Add-On" : "+ Tambah"}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-neutral-400">
                                Habis
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMenus.map((menu) => {
                const qty = getCartQuantity(menu._id);
                return (
                  <div
                    key={menu._id}
                    onClick={() => handleCardClick(menu)}
                    className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between transition group relative shadow-2xs hover:shadow-md ${
                      menu.isAvailable
                        ? "border-neutral-200/80 hover:border-neutral-400 cursor-pointer"
                        : "border-neutral-200/50 opacity-60 cursor-not-allowed bg-neutral-100/50"
                    }`}
                  >
                    <div>
                      <div className="relative h-32 w-full bg-neutral-100 overflow-hidden">
                        {menu.image ? (
                          <img
                            src={menu.image}
                            alt={menu.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px] font-medium">
                            Tidak ada foto
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                          <span
                            className={`px-2.5 py-1 text-[9px] rounded-full font-extrabold shadow-sm backdrop-blur-md ${
                              menu.isAvailable
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-neutral-200 text-neutral-600 border border-neutral-300"
                            }`}
                          >
                            {menu.isAvailable ? "Tersedia" : "Habis"}
                          </span>
                          {menu.isBundle && (
                            <span className="px-2 py-0.5 text-[8px] rounded-full font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                              <Package className="w-3 h-3" /> Add-On
                            </span>
                          )}
                        </div>

                        {qty > 0 && (
                          <div className="absolute top-2.5 left-2.5 bg-neutral-900 text-white font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
                            {qty}
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                          {menu.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                          {menu.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-3.5 pt-0 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-black text-emerald-600">
                          Rp {menu.price.toLocaleString("id-ID")}
                        </span>
                        {menu.originalPrice > menu.price && (
                          <span className="text-[9px] font-mono text-neutral-400 line-through">
                            Rp {menu.originalPrice.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>

                      {menu.isAvailable ? (
                        <span className="text-[10px] font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-900 hover:text-white px-3 py-1.5 rounded-xl transition shadow-2xs">
                          {menu.isBundle ? "+ Pilih Add-On" : "+ Tambah"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-400">
                          Habis
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING CART BAR */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-neutral-200 p-4 flex justify-between items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] max-w-2xl mx-auto md:rounded-t-3xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                {totalItemsCount} Menu Dipilih
              </p>
              <p className="text-sm md:text-base font-mono font-black text-neutral-900">
                Rp {subtotalPrice.toLocaleString("id-ID")}
                {totalMenuSavings > 0 && (
                  <span className="text-[10px] text-amber-600 font-bold ml-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Hemat Rp {totalMenuSavings.toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-7 py-3 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <span>Lihat Keranjang</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CART DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-white border border-neutral-200 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Rincian Keranjang Pesanan
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Periksa kembali pesanan Anda sebelum dikirim ke dapur.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* INFORMASI PEMESAN & MEJA */}
            <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-neutral-200/60 pb-2">
                <span className="text-neutral-400 font-semibold uppercase text-[10px]">
                  Nama Pemesan
                </span>
                <span className="font-extrabold text-neutral-900">
                  {customerInfo.name || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-200/60 pb-2">
                <span className="text-neutral-400 font-semibold uppercase text-[10px]">
                  No. Telepon
                </span>
                <span className="font-mono font-bold text-neutral-800">
                  {customerInfo.phone || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-200/60 pb-2">
                <span className="text-neutral-400 font-semibold uppercase text-[10px]">
                  Email
                </span>
                <span className="font-mono font-medium text-neutral-800 truncate max-w-[200px]">
                  {customerInfo.email || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-neutral-400 font-semibold uppercase text-[10px]">
                  Nomor Meja
                </span>
                <span className="font-extrabold text-neutral-900 bg-white px-2.5 py-0.5 rounded-lg border border-neutral-200/80">
                  #{tableNumber}
                </span>
              </div>
            </div>

            {/* BANNER PROMO HEMAT DI KERANJANG */}
            {totalMenuSavings > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Wah, Anda Berhasil Hemat Rp{" "}
                    {totalMenuSavings.toLocaleString("id-ID")}!
                  </p>
                  <p className="text-[10px] text-amber-700">
                    Nikmati penawaran promo & harga diskon spesial pada pesanan
                    ini.
                  </p>
                </div>
              </div>
            )}

            {/* FORM KUPON DISKON */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 block">
                Kode Kupon Diskon
              </label>
              {appliedCoupon ? (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-purple-900 font-bold">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span>Kupon {appliedCoupon} diterapkan</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-purple-600 hover:text-purple-900 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <X className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleApplyCoupon}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder="Masukkan kode promo (misal: HEMAT50)"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold uppercase text-neutral-900 focus:outline-none focus:border-neutral-400"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {isValidatingCoupon ? "Mengecek..." : "Gunakan"}
                  </button>
                </form>
              )}
            </div>

            {/* PILIHAN METODE PEMBAYARAN */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 block">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod("qris")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === "qris"
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <QrCode className="w-4 h-4" />
                    <span>QRIS (Midtrans)</span>
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${
                      paymentMethod === "qris"
                        ? "text-neutral-300"
                        : "text-neutral-500"
                    }`}
                  >
                    Scan & bayar instan via e-wallet / m-banking
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === "cash"
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Wallet className="w-4 h-4" />
                    <span>Konfirmasi Bayar Di Kasir (Cash)</span>
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${
                      paymentMethod === "cash"
                        ? "text-neutral-300"
                        : "text-neutral-500"
                    }`}
                  >
                    Bayar langsung secara tunai ke kasir
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const itemPrice = item.price || 0;
                const origItemPrice =
                  item.originalPrice || item.basePrice || itemPrice;
                const itemName = item.name || "Menu";
                const hasPromo = origItemPrice > item.basePrice;

                let itemAddonSubtotal = 0;
                let origItemAddonSubtotal = 0;
                if (
                  item.selectedBundleChoices &&
                  typeof item.selectedBundleChoices === "object"
                ) {
                  Object.entries(item.selectedBundleChoices).forEach(
                    ([title, addons]) => {
                      if (Array.isArray(addons)) {
                        addons.forEach((addon) => {
                          const addonP = Number(addon.price || 0);
                          itemAddonSubtotal += addonP;
                          origItemAddonSubtotal += addonP;
                        });
                      }
                    },
                  );
                }

                const totalItemPriceWithAddon =
                  (item.basePrice + itemAddonSubtotal) * item.quantity;
                const origTotalItemPriceWithAddon =
                  (origItemPrice + origItemAddonSubtotal) * item.quantity;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs border-b border-neutral-100 pb-3.5 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200/80">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                          {itemName}
                          {hasPromo && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 fill-current" /> Promo
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          {hasPromo && (
                            <span className="font-mono text-neutral-400 line-through text-[11px]">
                              Rp{" "}
                              {origTotalItemPriceWithAddon.toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          )}
                          <span className="text-xs text-neutral-900 font-mono font-bold">
                            Rp {totalItemPriceWithAddon.toLocaleString("id-ID")}
                          </span>
                        </div>
                        {item.selectedBundleChoices &&
                          Object.entries(item.selectedBundleChoices).map(
                            ([title, addons], aIdx) => (
                              <div
                                key={aIdx}
                                className="text-[10px] text-neutral-500 space-y-0.5 pt-1"
                              >
                                {Array.isArray(addons) &&
                                  addons.map((addon, adIdx) => (
                                    <p key={adIdx}>
                                      • + {addon.name}{" "}
                                      {addon.price > 0 &&
                                        `(+Rp ${addon.price.toLocaleString("id-ID")})`}
                                    </p>
                                  ))}
                              </div>
                            ),
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-xl border border-neutral-200/60">
                      <button
                        onClick={(e) =>
                          updateQuantity(
                            item.menuId,
                            item.selectedBundleChoices,
                            -1,
                            e,
                          )
                        }
                        className="w-6 h-6 bg-white text-neutral-700 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-neutral-200 transition shadow-2xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-black text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) =>
                          updateQuantity(
                            item.menuId,
                            item.selectedBundleChoices,
                            1,
                            e,
                          )
                        }
                        className="w-6 h-6 bg-white text-neutral-700 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-neutral-200 transition shadow-2xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <div className="flex justify-between items-center text-xs text-neutral-500">
                <span>Subtotal Menu</span>
                <span className="font-mono font-bold text-neutral-900">
                  Rp {subtotalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              {totalMenuSavings > 0 && (
                <div className="flex justify-between items-center text-xs text-amber-700 font-bold">
                  <span>Diskon Menu</span>
                  <span className="font-mono">
                    - Rp {totalMenuSavings.toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-purple-700 font-bold">
                  <span>Potongan Kupon ({appliedCoupon})</span>
                  <span className="font-mono">
                    - Rp {discountAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-neutral-500">
                <span>Biaya Layanan (Service 5%)</span>
                <span className="font-mono font-bold text-neutral-900">
                  Rp {serviceFee.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center text-base font-extrabold text-neutral-900 pt-2 border-t border-dashed border-neutral-200">
                <span>Total Pembayaran</span>
                <div className="flex items-center gap-2.5">
                  {(totalMenuSavings > 0 || discountAmount > 0) &&
                    originalTotalBeforeDiscount > finalTotalPrice && (
                      <span className="font-mono text-neutral-400 line-through text-xs font-normal">
                        Rp {originalTotalBeforeDiscount.toLocaleString("id-ID")}
                      </span>
                    )}
                  <span className="font-mono text-emerald-600 font-black text-base">
                    Rp {finalTotalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  handleSubmitOrder(e);
                }}
                disabled={isSubmitting || cart.length === 0}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>
                  {isSubmitting
                    ? "Memproses Pesanan..."
                    : paymentMethod === "cash"
                      ? "Kirim Pesanan Tunai"
                      : "Kirim Pesanan & Bayar QRIS"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

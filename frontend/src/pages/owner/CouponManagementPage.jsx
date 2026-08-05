import React, { useState, useEffect } from "react";
import { gooeyToast } from "goey-toast";
import API from "../../services/api";
import { Tag, Trash2, Sparkles, Percent, Save, Settings } from "lucide-react";

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [expiredAt, setExpiredAt] = useState("");
  const [loading, setLoading] = useState(true);

  // State untuk Manajemen Fee Layanan (Service Fee)
  const [serviceFeePercentage, setServiceFeePercentage] = useState("5");
  const [savingServiceFee, setSavingServiceFee] = useState(false);

  useEffect(() => {
    fetchCoupons();
    fetchSettings();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await API.get("/coupons");
      setCoupons(res.data);
    } catch (err) {
      console.error("Gagal memuat data kupon", err);
      gooeyToast.error("Gagal memuat data kupon.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await API.get("/settings/service-fee");
      if (res.data && res.data.serviceFeePercentage !== undefined) {
        setServiceFeePercentage(res.data.serviceFeePercentage.toString());
      }
    } catch (err) {
      console.log("Menggunakan pengaturan fee layanan default lokal.");
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: newCouponCode,
        discountType,
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase) || 0,
        expiredAt,
      };
      await API.post("/coupons", payload);
      gooeyToast.success("Kupon diskon berhasil dibuat!");
      setNewCouponCode("");
      setDiscountValue("");
      setMinPurchase("");
      setExpiredAt("");
      fetchCoupons();
    } catch (err) {
      gooeyToast.error(err.response?.data?.error || "Gagal membuat kupon.");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Yakin ingin menghapus kupon ini?")) return;
    try {
      await API.delete(`/coupons/${id}`);
      gooeyToast.success("Kupon berhasil dihapus.");
      fetchCoupons();
    } catch (err) {
      gooeyToast.error("Gagal menghapus kupon.");
    }
  };

  const handleSaveServiceFee = async (e) => {
    e.preventDefault();
    setSavingServiceFee(true);
    try {
      await API.put("/settings/service-fee", {
        serviceFeePercentage: Number(serviceFeePercentage),
      });
      gooeyToast.success("Pengaturan fee layanan berhasil diperbarui! 🚀");
    } catch (err) {
      console.error("Gagal menyimpan fee layanan", err);
      gooeyToast.error(
        err.response?.data?.error || "Gagal menyimpan fee layanan.",
      );
    } finally {
      setSavingServiceFee(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-900 pb-20">
      {/* HERO BANNER - Disesuaikan persis dengan gaya visual biru terang */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl overflow-hidden border border-blue-600/40 mb-8 mx-6 lg:mx-10 mt-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 rounded-full text-[11px] font-black text-sky-100 tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-sky-200" />
              <span>SWIFT ORDERING ENTERPRISE PROMO</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
              Kelola Kupon Diskon & Fee Layanan
            </h1>
            <p className="text-xs lg:text-sm text-sky-100 font-medium max-w-2xl leading-relaxed">
              Terbitkan kode promo diskon aktif serta atur persentase biaya
              layanan (service fee) restoran Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">
              Memuat data sistem...
            </p>
          </div>
        ) : (
          <>
            {/* PENGATURAN FEE LAYANAN (SERVICE FEE) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20">
                    <Settings className="w-4 h-4 text-sky-200" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Pengaturan Biaya Layanan (Service Fee)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tentukan persentase biaya layanan otomatis yang dikenakan
                      pada setiap transaksi pesanan.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSaveServiceFee}
                className="flex flex-col sm:flex-row items-end sm:items-center gap-4 text-xs"
              >
                <div className="flex-1 w-full space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Persentase Biaya Layanan (%)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <Percent className="w-4 h-4 text-blue-600" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={serviceFeePercentage}
                      onChange={(e) => setServiceFeePercentage(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                      placeholder="5"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingServiceFee}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3.5 rounded-2xl font-bold transition cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 shrink-0"
                >
                  <Save className="w-4 h-4 text-sky-200" />
                  <span>
                    {savingServiceFee ? "Menyimpan..." : "Simpan Fee Layanan"}
                  </span>
                </button>
              </form>
            </div>

            {/* GRID UTAMA: BUAT KUPON & DAFTAR KUPON */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FORM BUAT KUPON */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6 self-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Buat Kupon Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isi detail kupon diskon baru di bawah ini.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateCoupon}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                      Kode Kupon
                    </label>
                    <input
                      type="text"
                      placeholder="CONTOH: HEMAT50"
                      value={newCouponCode}
                      onChange={(e) =>
                        setNewCouponCode(e.target.value.toUpperCase())
                      }
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold uppercase text-slate-900 focus:outline-none focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                      Tipe Diskon
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition cursor-pointer"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed">Nominal Tetap (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                      {discountType === "percentage"
                        ? "Besaran Persen (1-100)"
                        : "Nominal Potongan (Rp)"}
                    </label>
                    <input
                      type="number"
                      placeholder={
                        discountType === "percentage" ? "15" : "10000"
                      }
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                      Minimal Belanja (Opsional)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                      Berlaku Sampai (Kedaluwarsa)
                    </label>
                    <input
                      type="date"
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 transition cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold transition cursor-pointer shadow-lg shadow-blue-600/20 mt-2"
                  >
                    Simpan & Terbitkan Kupon 🚀
                  </button>
                </form>
              </div>

              {/* DAFTAR KUPON */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Daftar Kupon Tersedia
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kelola seluruh kupon aktif yang dapat digunakan pelanggan
                      saat checkout.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono font-bold text-xs">
                    {coupons.length} Aktif
                  </span>
                </div>

                {coupons.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">
                      Belum ada kupon diskon aktif
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan form di sebelah kiri untuk menerbitkan kupon
                      pertama Anda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon._id}
                        className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-mono font-black text-xs tracking-wider shadow-2xs">
                              {coupon.code}
                            </span>
                            <span className="text-emerald-600 font-black text-xs bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}% OFF`
                                : `Rp ${coupon.discountValue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium space-y-0.5 pt-1">
                            <p>
                              Min. Belanja:{" "}
                              <strong className="text-slate-900 font-mono">
                                Rp {coupon.minPurchase.toLocaleString("id-ID")}
                              </strong>
                            </p>
                            <p>
                              Kedaluwarsa:{" "}
                              <strong className="text-slate-900 font-mono">
                                {new Date(coupon.expiredAt).toLocaleDateString(
                                  "id-ID",
                                )}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border border-red-200 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Kupon
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

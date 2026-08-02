const mongoose = require("mongoose");
require("dotenv").config();

// Import Model
const Inventory = require("./models/Inventory");
const Menu = require("./models/Menu");

async function seedMenus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Terhubung ke database MongoDB untuk seeding Menu...");

    // Ambil referensi bahan baku dari database inventory
    const getInv = async (name) => {
      const item = await Inventory.findOne({ itemName: name });
      return item ? item._id : null;
    };

    // ID Bahan Baku
    const beras = await getInv("Beras Premium");
    const ayam = await getInv("Daging Ayam Fillet");
    const minyak = await getInv("Minyak Goreng");
    const bihun = await getInv("Bihun Jagung");
    const telur = await getInv("Telur Ayam Negeri");
    const bakso = await getInv("Bakso Sapi Instant");
    const sosis = await getInv("Sosis Sapi Cocktail");
    const dagingSapi = await getInv("Daging Sapi Slice (Shortplate)");
    const kopi = await getInv("Biji Kopi Arabica Blend");
    const matcha = await getInv("Bubuk Matcha Premium");
    const susu = await getInv("Susu UHT Full Cream");
    const sirupRedVelvet = await getInv("Sirup Red Velvet 1L");
    const sirupHazelnut = await getInv("Sirup Hazelnut 1L");
    const teh = await getInv("Teh Celup Hitam");
    const gula = await getInv("Gula Pasir Putih");
    const kentang = await getInv("French Fries (Kentang Beku)");
    const roti = await getInv("Roti Burger / Bun");
    const keju = await getInv("Keju Slice Melt");
    const saus = await getInv("Saus Sambal Botol");
    const cup = await getInv("Cup Plastik 16 oz + Tutup");
    const sedotan = await getInv("Sedotan Plastik Steril");

    // Bersihkan menu lama (Opsional)
    await Menu.deleteMany({});
    console.log("Katalog menu lama dibersihkan.");

    const dummyMenus = [
      // --- KATEGORI: MAKANAN ---
      {
        name: "Nasi Goreng Spesial",
        sku: "MKN-NSG-SPC",
        description:
          "Nasi goreng gurih disajikan dengan suwiran ayam pilihan dan bumbu rempah khas kafe.",
        price: 25000,
        originalPrice: 30000,
        category: "Makanan",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "LEVEL KEPEDASAN",
            choices: [
              { name: "Tidak Pedas", price: 0 },
              { name: "Level 1", price: 0 },
              { name: "Level 2", price: 0 },
              { name: "Level 3", price: 0 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: beras, qtyNeeded: 0.2 },
          { inventoryItem: ayam, qtyNeeded: 0.1 },
          { inventoryItem: minyak, qtyNeeded: 0.05 },
        ],
      },
      {
        name: "Mie Goreng Spesial Nusantara",
        sku: "MKN-MIG-NSP",
        description:
          "Mie kenyal dimasak dengan bumbu rahasia, potongan bakso, sosis, dan telur orak-arik.",
        price: 23000,
        originalPrice: 28000,
        category: "Makanan",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "LEVEL KEPEDASAN",
            choices: [
              { name: "Tidak Pedas", price: 0 },
              { name: "Level 1", price: 0 },
              { name: "Level 2", price: 0 },
              { name: "Level 3", price: 0 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: bihun, qtyNeeded: 0.15 },
          { inventoryItem: telur, qtyNeeded: 0.05 },
          { inventoryItem: bakso, qtyNeeded: 0.05 },
          { inventoryItem: sosis, qtyNeeded: 0.05 },
          { inventoryItem: minyak, qtyNeeded: 0.03 },
        ],
      },
      {
        name: "Beef Blackpepper Rice Bowl",
        sku: "MKN-BEE-BLP",
        description:
          "Irisan daging sapi lembut dengan siraman saus lada hitam khas oriental di atas nasi hangat.",
        price: 35000,
        originalPrice: 42000,
        category: "Makanan",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "ADD ON",
            choices: [
              { name: "Extra Telur Mata Sapi", price: 5000 },
              { name: "Extra Daging Sapi", price: 15000 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: beras, qtyNeeded: 0.2 },
          { inventoryItem: dagingSapi, qtyNeeded: 0.15 },
        ],
      },

      // --- KATEGORI: MINUMAN ---
      {
        name: "Kopi Susu Gula Aren",
        sku: "MNM-KPS-ARN",
        description:
          "Perpaduan espresso dari biji kopi arabica, susu segar UHT, dan manisnya gula aren murni.",
        price: 18000,
        originalPrice: 22000,
        category: "Minuman",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "ADD ON",
            choices: [
              { name: "Extra Shot Espresso", price: 5000 },
              { name: "Less Ice", price: 0 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: kopi, qtyNeeded: 0.02 },
          { inventoryItem: susu, qtyNeeded: 0.15 },
          { inventoryItem: cup, qtyNeeded: 1 },
          { inventoryItem: sedotan, qtyNeeded: 1 },
        ],
      },
      {
        name: "Matcha Latte Creamy",
        sku: "MNM-MCH-LAT",
        description:
          "Serbuk matcha Jepang berpadu dengan susu UHT creamy dan manis yang pas.",
        price: 22000,
        originalPrice: 26000,
        category: "Minuman",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "ADD ON",
            choices: [
              { name: "Less Sugar", price: 0 },
              { name: "Extra Whip Cream", price: 4000 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: matcha, qtyNeeded: 0.02 },
          { inventoryItem: susu, qtyNeeded: 0.2 },
          { inventoryItem: gula, qtyNeeded: 0.02 },
          { inventoryItem: cup, qtyNeeded: 1 },
          { inventoryItem: sedotan, qtyNeeded: 1 },
        ],
      },
      {
        name: "Es Kopi Susu Hazelnut",
        sku: "MNM-KPS-HZL",
        description:
          "Kopi susu kekinian dengan sentuhan aroma kacang hazelnut yang harum.",
        price: 20000,
        originalPrice: 25000,
        category: "Minuman",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "ADD ON",
            choices: [
              { name: "Less Sugar", price: 0 },
              { name: "Extra Shot Espresso", price: 5000 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: kopi, qtyNeeded: 0.02 },
          { inventoryItem: susu, qtyNeeded: 0.15 },
          { inventoryItem: sirupHazelnut, qtyNeeded: 0.03 },
          { inventoryItem: cup, qtyNeeded: 1 },
          { inventoryItem: sedotan, qtyNeeded: 1 },
        ],
      },
      {
        name: "Es Teh Manis Melati Klasik",
        sku: "MNM-ETH-MLT",
        description: "Teh hitam melati seduhan segar penyegar hari Anda.",
        price: 8000,
        originalPrice: 10000,
        category: "Minuman",
        isAvailable: true,
        isBundle: false,
        ingredients: [
          { inventoryItem: teh, qtyNeeded: 1 },
          { inventoryItem: gula, qtyNeeded: 0.03 },
          { inventoryItem: cup, qtyNeeded: 1 },
          { inventoryItem: sedotan, qtyNeeded: 1 },
        ],
      },

      // --- KATEGORI: SNACK ---
      {
        name: "French Fries Premium",
        sku: "SNK-FFR-PRM",
        description:
          "Kentang goreng renyah luar dalam ditaburi bumbu gurih pilihan.",
        price: 18000,
        originalPrice: 22000,
        category: "Snack",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "BUMBU TABUR",
            choices: [
              { name: "Original Asin", price: 0 },
              { name: "Balado Pedas", price: 0 },
              { name: "Keju Gurih", price: 0 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: kentang, qtyNeeded: 0.2 },
          { inventoryItem: minyak, qtyNeeded: 0.1 },
          { inventoryItem: saus, qtyNeeded: 0.03 },
        ],
      },
      {
        name: "Beef Cheese Burger Kafe",
        sku: "SNK-BCB-KFE",
        description:
          "Burger empuk dengan patty daging pilihan, selada segar, tomat, dan lelehan keju slice melt.",
        price: 30000,
        originalPrice: 38000,
        category: "Snack",
        isAvailable: true,
        isBundle: true,
        bundleOptions: [
          {
            title: "ADD ON",
            choices: [
              { name: "Extra Keju Melt", price: 5000 },
              { name: "Extra Patty Daging", price: 12000 },
            ],
          },
        ],
        ingredients: [
          { inventoryItem: roti, qtyNeeded: 1 },
          { inventoryItem: dagingSapi, qtyNeeded: 0.1 },
          { inventoryItem: keju, qtyNeeded: 1 },
          { inventoryItem: saus, qtyNeeded: 0.02 },
        ],
      },
    ];

    await Menu.insertMany(dummyMenus);
    console.log(
      `Sukses! ${dummyMenus.length} data menu lengkap dengan Resep BOM berhasil dimasukkan ke database. 🎉`,
    );

    process.exit(0);
  } catch (err) {
    console.error("Gagal melakukan seeding menu:", err);
    process.exit(1);
  }
}

seedMenus();

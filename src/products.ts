import type { Product } from './types';

// Fiyatlar 24-25.10.2026'da Akakçe'deki en ucuz satış fiyatlarına göre güncellendi;
// piyasadan kalkan ürünler güncel muadilleriyle (ör. RTX 40 → RTX 50) değiştirildi.
// stock: 0 → piyasada artık bulunamayan ürün; yapay zekâya önerilmez.

export const products: Product[] = [
    // --- İŞLEMCİLER (CPU) - 10 ADET ---
    { id: 1, category: "CPU", brand: "AMD", model: "Ryzen 5 5600", price: 5957, stock: 15, specs: { socket: "AM4", ram_type: "DDR4", power: "65W" } },
    { id: 2, category: "CPU", brand: "Intel", model: "Core i5-12400F", price: 6453, stock: 12, specs: { socket: "LGA1700", ram_type: "DDR4", power: "65W" } },
    { id: 3, category: "CPU", brand: "Intel", model: "Core i5-13400F", price: 10999, stock: 10, specs: { socket: "LGA1700", ram_type: "DDR4/DDR5", power: "65W" } },
    { id: 4, category: "CPU", brand: "AMD", model: "Ryzen 5 7500F", price: 6845, stock: 18, specs: { socket: "AM5", ram_type: "DDR5", power: "65W" } },
    { id: 5, category: "CPU", brand: "AMD", model: "Ryzen 7 5700X", price: 8575, stock: 8, specs: { socket: "AM4", ram_type: "DDR4", power: "65W" } },
    { id: 6, category: "CPU", brand: "Intel", model: "Core i5-14600K", price: 13565, stock: 6, specs: { socket: "LGA1700", ram_type: "DDR5", power: "125W" } },
    { id: 7, category: "CPU", brand: "AMD", model: "Ryzen 7 7700X", price: 11466, stock: 7, specs: { socket: "AM5", ram_type: "DDR5", power: "105W" } },
    { id: 8, category: "CPU", brand: "AMD", model: "Ryzen 7 7800X3D", price: 15981, stock: 5, specs: { socket: "AM5", ram_type: "DDR5", power: "120W" } },
    { id: 9, category: "CPU", brand: "Intel", model: "Core i7-14700K", price: 19019, stock: 4, specs: { socket: "LGA1700", ram_type: "DDR5", power: "125W" } },
    { id: 10, category: "CPU", brand: "Intel", model: "Core i9-14900K", price: 22999, stock: 3, specs: { socket: "LGA1700", ram_type: "DDR5", power: "125W" } },

    // --- EKRAN KARTLARI (GPU) - 10 ADET ---
    { id: 11, category: "GPU", brand: "AMD", model: "Radeon RX 6600", price: 25275, stock: 14, specs: { vram: "8GB", power_recommendation: "500W" } },
    { id: 12, category: "GPU", brand: "NVIDIA", model: "RTX 3060", price: 28419, stock: 11, specs: { vram: "12GB", power_recommendation: "550W" } },
    { id: 13, category: "GPU", brand: "AMD", model: "Radeon RX 7600", price: 20459, stock: 20, specs: { vram: "8GB", power_recommendation: "550W" } },
    { id: 14, category: "GPU", brand: "NVIDIA", model: "RTX 4060", price: 37849, stock: 25, specs: { vram: "8GB", power_recommendation: "550W" } },
    { id: 15, category: "GPU", brand: "NVIDIA", model: "RTX 4060 Ti", price: 30659, stock: 15, specs: { vram: "8GB", power_recommendation: "600W" } },
    { id: 16, category: "GPU", brand: "AMD", model: "Radeon RX 7700 XT", price: 37199, stock: 9, specs: { vram: "12GB", power_recommendation: "700W" } },
    { id: 17, category: "GPU", brand: "Asus", model: "RTX 5070 Dual OC 12GB", price: 60231, stock: 10, specs: { vram: "12GB", power_recommendation: "650W" } },
    { id: 18, category: "GPU", brand: "AMD", model: "Radeon RX 7800 XT", price: 56784, stock: 10, specs: { vram: "16GB", power_recommendation: "700W" } },
    { id: 19, category: "GPU", brand: "MSI", model: "RTX 5070 Ti Shadow 3X OC 16GB", price: 89950, stock: 8, specs: { vram: "16GB", power_recommendation: "750W" } },
    { id: 20, category: "GPU", brand: "MSI", model: "RTX 5080 Shadow 3X OC 16GB", price: 111707, stock: 5, specs: { vram: "16GB", power_recommendation: "850W" } },

    // --- ANAKARTLAR (Motherboard) - 10 ADET ---
    { id: 21, category: "Motherboard", brand: "Gigabyte", model: "H610M H", price: 3928, stock: 16, specs: { socket: "LGA1700", ram_type: "DDR4" } },
    { id: 22, category: "Motherboard", brand: "MSI", model: "A520M-A Pro", price: 3022, stock: 15, specs: { socket: "AM4", ram_type: "DDR4" } },
    { id: 23, category: "Motherboard", brand: "Asus", model: "Prime B550M-K", price: 5049, stock: 12, specs: { socket: "AM4", ram_type: "DDR4" } },
    { id: 24, category: "Motherboard", brand: "MSI", model: "PRO B760M-P DDR4", price: 6199, stock: 10, specs: { socket: "LGA1700", ram_type: "DDR4" } },
    { id: 25, category: "Motherboard", brand: "Gigabyte", model: "B650M DS3H", price: 42800, stock: 14, specs: { socket: "AM5", ram_type: "DDR5" } },
    { id: 26, category: "Motherboard", brand: "Asus", model: "PRIME B760-PLUS DDR5", price: 17031, stock: 8, specs: { socket: "LGA1700", ram_type: "DDR5" } },
    { id: 27, category: "Motherboard", brand: "MSI", model: "MAG B650 Tomahawk Wi-Fi", price: 26603, stock: 7, specs: { socket: "AM5", ram_type: "DDR5" } },
    { id: 28, category: "Motherboard", brand: "Asus", model: "TUF Gaming Z790-Plus Wi-Fi", price: 12835, stock: 5, specs: { socket: "LGA1700", ram_type: "DDR5" } },
    { id: 29, category: "Motherboard", brand: "MSI", model: "X870 Gaming Plus Wi-Fi", price: 14694, stock: 8, specs: { socket: "AM5", ram_type: "DDR5" } },
    { id: 30, category: "Motherboard", brand: "MSI", model: "MAG Z790 Tomahawk Wi-Fi", price: 13560, stock: 6, specs: { socket: "LGA1700", ram_type: "DDR5" } },

    // --- BELLEKLER (RAM) - 10 ADET ---
    { id: 31, category: "RAM", brand: "Kingston", model: "8GB Fury Beast 3200MHz DDR4", price: 3607, stock: 25, specs: { ram_type: "DDR4" } },
    { id: 32, category: "RAM", brand: "Corsair", model: "16GB (2x8) Vengeance 3200MHz", price: 6649, stock: 40, specs: { ram_type: "DDR4" } },
    { id: 33, category: "RAM", brand: "Kingston", model: "16GB Fury Beast 3600MHz DDR4", price: 7399, stock: 25, specs: { ram_type: "DDR4" } },
    { id: 34, category: "RAM", brand: "XPG", model: "16GB Gammix D30 3200MHz DDR4", price: 9200, stock: 22, specs: { ram_type: "DDR4" } },
    { id: 35, category: "RAM", brand: "Crucial", model: "32GB (2x16) Pro 3200MHz DDR4", price: 14560, stock: 15, specs: { ram_type: "DDR4" } },
    { id: 36, category: "RAM", brand: "Crucial", model: "16GB Classic 4800MHz DDR5", price: 15500, stock: 20, specs: { ram_type: "DDR5" } },
    { id: 37, category: "RAM", brand: "Kingston", model: "16GB Fury Beast 5600MHz DDR5", price: 17018, stock: 18, specs: { ram_type: "DDR5" } },
    { id: 38, category: "RAM", brand: "Corsair", model: "32GB (2x16) Vengeance 5200MHz DDR5", price: 33852, stock: 17, specs: { ram_type: "DDR5" } },
    { id: 39, category: "RAM", brand: "Kingston", model: "32GB (2x16) Fury Beast 6000MHz DDR5", price: 35999, stock: 12, specs: { ram_type: "DDR5" } },
    { id: 40, category: "RAM", brand: "G.Skill", model: "32GB (2x16) Trident Z5 RGB 6400MHz", price: 49800, stock: 10, specs: { ram_type: "DDR5" } },

    // --- GÜÇ KAYNAKLARI (PSU) - 10 ADET ---
    { id: 41, category: "Power", brand: "Frisby", model: "500W FR-PS5080P", price: 2036, stock: 25, specs: { wattage: 500 } },
    { id: 42, category: "Power", brand: "Frisby", model: "600W FR-PS6080P", price: 2036, stock: 30, specs: { wattage: 600 } },
    { id: 43, category: "Power", brand: "DeepCool", model: "550W PK550D 80+", price: 4799, stock: 20, specs: { wattage: 550 } },
    { id: 44, category: "Power", brand: "Corsair", model: "650W CV650 80+ Bronze", price: 9999, stock: 15, specs: { wattage: 650 } },
    { id: 45, category: "Power", brand: "NZXT", model: "C750 Bronze 750W", price: 3998, stock: 15, specs: { wattage: 750 } },
    { id: 46, category: "Power", brand: "MSI", model: "MAG A650BN 650W 80+", price: 2999, stock: 14, specs: { wattage: 650 } },
    { id: 47, category: "Power", brand: "Corsair", model: "750W RM750e Modüler Gold", price: 6524, stock: 12, specs: { wattage: 750 } },
    { id: 48, category: "Power", brand: "Asus", model: "TUF Gaming 750B 750W Bronze", price: 4390, stock: 10, specs: { wattage: 750 } },
    { id: 49, category: "Power", brand: "MSI", model: "MAG A850GL Gen5 850W Gold", price: 6999, stock: 10, specs: { wattage: 850 } },
    { id: 50, category: "Power", brand: "Asus", model: "ROG Thor 1000W Platinum II", price: 17107, stock: 3, specs: { wattage: 1000 } },

    // --- DEPOLAMA (SSD) - 5 ADET ---
    { id: 51, category: "SSD", brand: "Crucial", model: "500GB P3 Plus NVMe M.2", price: 7487, stock: 20, specs: { capacity: "500GB", read_speed: "4700MB/s" } },
    { id: 52, category: "SSD", brand: "Samsung", model: "1TB 980 NVMe M.2", price: 11949, stock: 15, specs: { capacity: "1TB", read_speed: "3500MB/s" } },
    { id: 53, category: "SSD", brand: "Kingston", model: "1TB NV2 NVMe M.2", price: 8799, stock: 25, specs: { capacity: "1TB", read_speed: "3500MB/s" } },
    { id: 54, category: "SSD", brand: "Samsung", model: "2TB 990 Pro NVMe M.2", price: 23279, stock: 8, specs: { capacity: "2TB", read_speed: "7450MB/s" } },
    { id: 55, category: "SSD", brand: "Kingston", model: "2TB KC3000 NVMe M.2", price: 20899, stock: 10, specs: { capacity: "2TB", read_speed: "7000MB/s" } },

    // --- KASALAR (Case) - 5 ADET ---
    { id: 56, category: "Case", brand: "NZXT", model: "H7 Flow 2024", price: 3579, stock: 12, specs: { form_factor: "ATX Mid Tower", fans: "Fanlı" } },
    { id: 57, category: "Case", brand: "MSI", model: "MAG Forge 100M Mesh", price: 2021, stock: 18, specs: { form_factor: "ATX Mid Tower", fans: "3x120mm RGB" } },
    { id: 58, category: "Case", brand: "Corsair", model: "4000D Airflow Tempered Glass", price: 6638, stock: 15, specs: { form_factor: "ATX Mid Tower", fans: "2x120mm" } },
    { id: 59, category: "Case", brand: "Asus", model: "TUF Gaming GT301 ARGB Mesh", price: 4399, stock: 10, specs: { form_factor: "ATX Mid Tower", fans: "4x120mm ARGB" } },
    { id: 60, category: "Case", brand: "Lian Li", model: "Lancool III RGB Black", price: 9999, stock: 5, specs: { form_factor: "ATX Mid Tower", fans: "4x140mm ARGB" } },

    // --- İŞLEMCİ SOĞUTUCULARI (Cooler) - 7 ADET ---
    // Katalogdaki işlemciler kutusuz (tray) fiyatlıdır ve soğutucuyla gelmez.
    { id: 61, category: "Cooler", brand: "MSI", model: "MAG CoreFrozr AA13 ARGB", price: 1399, stock: 30, specs: { type: "Hava - tek kule", sockets: "AM4/AM5/LGA1700" } },
    { id: 62, category: "Cooler", brand: "DeepCool", model: "AK400 G2", price: 2204, stock: 20, specs: { type: "Hava - tek kule", sockets: "AM4/AM5/LGA1700" } },
    { id: 63, category: "Cooler", brand: "Thermalright", model: "Peerless Assassin 120 SE", price: 2282, stock: 15, specs: { type: "Hava - çift kule", sockets: "AM4/AM5/LGA1700" } },
    { id: 64, category: "Cooler", brand: "DeepCool", model: "AK620 G2", price: 3772, stock: 12, specs: { type: "Hava - çift kule", sockets: "AM4/AM5/LGA1700" } },
    { id: 65, category: "Cooler", brand: "DeepCool", model: "LE360 V2 RGB 360mm", price: 3723, stock: 15, specs: { type: "Sıvı 360mm", sockets: "AM4/AM5/LGA1700" } },
    { id: 66, category: "Cooler", brand: "Arctic", model: "Liquid Freezer III Pro 240 ARGB", price: 6300, stock: 8, specs: { type: "Sıvı 240mm", sockets: "AM4/AM5/LGA1700" } },
    { id: 67, category: "Cooler", brand: "Arctic", model: "Liquid Freezer III Pro 360 ARGB", price: 6449, stock: 10, specs: { type: "Sıvı 360mm", sockets: "AM4/AM5/LGA1700" } }
];

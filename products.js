const products = [
    // --- İŞLEMCİLER (CPU) - 10 ADET ---
    { id: 1, category: "CPU", brand: "AMD", model: "Ryzen 5 5600", price: 4200, stock: 15, specs: { socket: "AM4", ram_type: "DDR4", power: "65W" } },
    { id: 2, category: "CPU", brand: "Intel", model: "Core i5-12400F", price: 3900, stock: 12, specs: { socket: "LGA1700", ram_type: "DDR4", power: "65W" } },
    { id: 3, category: "CPU", brand: "Intel", model: "Core i5-13400F", price: 6800, stock: 10, specs: { socket: "LGA1700", ram_type: "DDR4/DDR5", power: "65W" } },
    { id: 4, category: "CPU", brand: "AMD", model: "Ryzen 5 7500F", price: 6200, stock: 18, specs: { socket: "AM5", ram_type: "DDR5", power: "65W" } },
    { id: 5, category: "CPU", brand: "AMD", model: "Ryzen 7 5700X", price: 6900, stock: 8, specs: { socket: "AM4", ram_type: "DDR4", power: "65W" } },
    { id: 6, category: "CPU", brand: "Intel", model: "Core i5-14600K", price: 11200, stock: 6, specs: { socket: "LGA1700", ram_type: "DDR5", power: "125W" } },
    { id: 7, category: "CPU", brand: "AMD", model: "Ryzen 7 7700X", price: 11900, stock: 7, specs: { socket: "AM5", ram_type: "DDR5", power: "105W" } },
    { id: 8, category: "CPU", brand: "AMD", model: "Ryzen 7 7800X3D", price: 14500, stock: 5, specs: { socket: "AM5", ram_type: "DDR5", power: "120W" } },
    { id: 9, category: "CPU", brand: "Intel", model: "Core i7-14700K", price: 15400, stock: 4, specs: { socket: "LGA1700", ram_type: "DDR5", power: "125W" } },
    { id: 10, category: "CPU", brand: "Intel", model: "Core i9-14900K", price: 22500, stock: 3, specs: { socket: "LGA1700", ram_type: "DDR5", power: "125W" } },

    // --- EKRAN KARTLARI (GPU) - 10 ADET ---
    { id: 11, category: "GPU", brand: "AMD", model: "Radeon RX 6600", price: 7200, stock: 14, specs: { vram: "8GB", power_recommendation: "500W" } },
    { id: 12, category: "GPU", brand: "NVIDIA", model: "RTX 3060", price: 9200, stock: 11, specs: { vram: "12GB", power_recommendation: "550W" } },
    { id: 13, category: "GPU", brand: "AMD", model: "Radeon RX 7600", price: 9500, stock: 20, specs: { vram: "8GB", power_recommendation: "550W" } },
    { id: 14, category: "GPU", brand: "NVIDIA", model: "RTX 4060", price: 11500, stock: 25, specs: { vram: "8GB", power_recommendation: "550W" } },
    { id: 15, category: "GPU", brand: "NVIDIA", model: "RTX 4060 Ti", price: 15200, stock: 15, specs: { vram: "8GB", power_recommendation: "600W" } },
    { id: 16, category: "GPU", brand: "AMD", model: "Radeon RX 7700 XT", price: 16800, stock: 9, specs: { vram: "12GB", power_recommendation: "700W" } },
    { id: 17, category: "GPU", brand: "NVIDIA", model: "RTX 4070 Super", price: 24000, stock: 8, specs: { vram: "12GB", power_recommendation: "650W" } },
    { id: 18, category: "GPU", brand: "AMD", model: "Radeon RX 7800 XT", price: 21500, stock: 10, specs: { vram: "16GB", power_recommendation: "700W" } },
    { id: 19, category: "GPU", brand: "NVIDIA", model: "RTX 4070 Ti Super", price: 34500, stock: 6, specs: { vram: "16GB", power_recommendation: "750W" } },
    { id: 20, category: "GPU", brand: "NVIDIA", model: "RTX 4080 Super", price: 44000, stock: 4, specs: { vram: "16GB", power_recommendation: "750W" } },

    // --- ANAKARTLAR (Motherboard) - 10 ADET ---
    { id: 21, category: "Motherboard", brand: "Gigabyte", model: "H610M H", price: 2700, stock: 16, specs: { socket: "LGA1700", ram_type: "DDR4" } },
    { id: 22, category: "Motherboard", brand: "MSI", model: "A520M-A Pro", price: 2400, stock: 15, specs: { socket: "AM4", ram_type: "DDR4" } },
    { id: 23, category: "Motherboard", brand: "Asus", model: "Prime B550M-K", price: 3200, stock: 12, specs: { socket: "AM4", ram_type: "DDR4" } },
    { id: 24, category: "Motherboard", brand: "MSI", model: "PRO B760M-P DDR4", price: 3900, stock: 10, specs: { socket: "LGA1700", ram_type: "DDR4" } },
    { id: 25, category: "Motherboard", brand: "Gigabyte", model: "B650M DS3H", price: 5400, stock: 14, specs: { socket: "AM5", ram_type: "DDR5" } },
    { id: 26, category: "Motherboard", brand: "Asus", model: "PRIME B760-PLUS DDR5", price: 5900, stock: 8, specs: { socket: "LGA1700", ram_type: "DDR5" } },
    { id: 27, category: "Motherboard", brand: "MSI", model: "MAG B650 Tomahawk Wi-Fi", price: 8100, stock: 7, specs: { socket: "AM5", ram_type: "DDR5" } },
    { id: 28, category: "Motherboard", brand: "Asus", model: "TUF Gaming Z790-Plus Wi-Fi", price: 9400, stock: 5, specs: { socket: "LGA1700", ram_type: "DDR5" } },
    { id: 29, category: "Motherboard", brand: "MSI", model: "MPG X670E Carbon Wi-Fi", price: 13500, stock: 3, specs: { socket: "AM5", ram_type: "DDR5" } },
    { id: 30, category: "Motherboard", brand: "Asus", model: "ROG Maximus Z790 Hero", price: 23000, stock: 2, specs: { socket: "LGA1700", ram_type: "DDR5" } },

    // --- BELLEKLER (RAM) - 10 ADET ---
    { id: 31, category: "RAM", brand: "G.Skill", model: "8GB Ripjaws V 3200MHz", price: 850, stock: 30, specs: { ram_type: "DDR4" } },
    { id: 32, category: "RAM", brand: "Corsair", model: "16GB (2x8) Vengeance 3200MHz", price: 1600, stock: 40, specs: { ram_type: "DDR4" } },
    { id: 33, category: "RAM", brand: "Kingston", model: "16GB Fury Beast 3600MHz DDR4", price: 1750, stock: 25, specs: { ram_type: "DDR4" } },
    { id: 34, category: "RAM", brand: "XPG", model: "16GB Gammix D30 3200MHz DDR4", price: 1500, stock: 22, specs: { ram_type: "DDR4" } },
    { id: 35, category: "RAM", brand: "Crucial", model: "32GB (2x16) Pro 3200MHz DDR4", price: 2900, stock: 15, specs: { ram_type: "DDR4" } },
    { id: 36, category: "RAM", brand: "Crucial", model: "16GB Classic 4800MHz DDR5", price: 1950, stock: 20, specs: { ram_type: "DDR5" } },
    { id: 37, category: "RAM", brand: "Kingston", model: "16GB Fury Beast 5600MHz DDR5", price: 2200, stock: 18, specs: { ram_type: "DDR5" } },
    { id: 38, category: "RAM", brand: "Corsair", model: "32GB (2x16) Vengeance 5200MHz DDR5", price: 3600, stock: 17, specs: { ram_type: "DDR5" } },
    { id: 39, category: "RAM", brand: "Kingston", model: "32GB (2x16) Fury Beast 6000MHz DDR5", price: 4100, stock: 12, specs: { ram_type: "DDR5" } },
    { id: 40, category: "RAM", brand: "G.Skill", model: "32GB (2x16) Trident Z5 RGB 6400MHz", price: 4900, stock: 10, specs: { ram_type: "DDR5" } },

    // --- GÜÇ KAYNAKLARI (PSU) - 10 ADET ---
    { id: 41, category: "Power", brand: "Frisby", model: "500W FR-PS5080P", price: 1200, stock: 25, specs: { wattage: 500 } },
    { id: 42, category: "Power", brand: "Zalman", model: "600W Megamax v2", price: 1900, stock: 30, specs: { wattage: 600 } },
    { id: 43, category: "Power", brand: "DeepCool", model: "550W PK550D 80+", price: 1750, stock: 20, specs: { wattage: 550 } },
    { id: 44, category: "Power", brand: "Corsair", model: "650W CV650 80+ Bronze", price: 2400, stock: 15, specs: { wattage: 650 } },
    { id: 45, category: "Power", brand: "High Power", model: "700W Element BR 80+", price: 2200, stock: 18, specs: { wattage: 700 } },
    { id: 46, category: "Power", brand: "MSI", model: "MAG A650BN 650W 80+", price: 2550, stock: 14, specs: { wattage: 650 } },
    { id: 47, category: "Power", brand: "Corsair", model: "750W RM750e Modüler Gold", price: 4200, stock: 12, specs: { wattage: 750 } },
    { id: 48, category: "Power", brand: "Asus", model: "TUF Gaming 750B 750W Bronze", price: 3800, stock: 10, specs: { wattage: 750 } },
    { id: 49, category: "Power", brand: "FSP", model: "Hydro G Pro 850W Gold Modüler", price: 5400, stock: 8, specs: { wattage: 850 } },
    { id: 50, category: "Power", brand: "Asus", model: "ROG Thor 1000W Platinum II", price: 12800, stock: 3, specs: { wattage: 1000 } },

    // --- DEPOLAMA (SSD) - 5 ADET ---
    { id: 51, category: "SSD", brand: "Crucial", model: "500GB P3 Plus NVMe M.2", price: 1600, stock: 20, specs: { capacity: "500GB", read_speed: "4700MB/s" } },
    { id: 52, category: "SSD", brand: "Samsung", model: "1TB 980 NVMe M.2", price: 2800, stock: 15, specs: { capacity: "1TB", read_speed: "3500MB/s" } },
    { id: 53, category: "SSD", brand: "Kingston", model: "1TB NV2 NVMe M.2", price: 2200, stock: 25, specs: { capacity: "1TB", read_speed: "3500MB/s" } },
    { id: 54, category: "SSD", brand: "Samsung", model: "2TB 990 Pro NVMe M.2", price: 6200, stock: 8, specs: { capacity: "2TB", read_speed: "7450MB/s" } },
    { id: 55, category: "SSD", brand: "Kingston", model: "2TB KC3000 NVMe M.2", price: 5400, stock: 10, specs: { capacity: "2TB", read_speed: "7000MB/s" } },

    // --- KASALAR (Case) - 5 ADET ---
    { id: 56, category: "Case", brand: "Frisby", model: "FC-9320G 600W Mesh Dual Ring", price: 2600, stock: 12, specs: { form_factor: "ATX Mid Tower", fans: "4x120mm RGB" } },
    { id: 57, category: "Case", brand: "MSI", model: "MAG Forge 100M Mesh", price: 2100, stock: 18, specs: { form_factor: "ATX Mid Tower", fans: "3x120mm RGB" } },
    { id: 58, category: "Case", brand: "Corsair", model: "4000D Airflow Tempered Glass", price: 3400, stock: 15, specs: { form_factor: "ATX Mid Tower", fans: "2x120mm" } },
    { id: 59, category: "Case", brand: "Asus", model: "TUF Gaming GT301 ARGB Mesh", price: 3800, stock: 10, specs: { form_factor: "ATX Mid Tower", fans: "4x120mm ARGB" } },
    { id: 60, category: "Case", brand: "Lian Li", model: "Lancool III RGB Black", price: 5900, stock: 5, specs: { form_factor: "ATX Mid Tower", fans: "4x140mm ARGB" } }
];

module.exports = products;
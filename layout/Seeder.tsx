import { addProduct } from "../lib/firebase";
import { Product } from "../lib/types";


const leafProducts = [
  { name: "Daun Mint", unit: "kg", price: 54900, img: "m_22_07_2022_03_31_04_daun_mint.jpg" },
  { name: "Daun Mint 250 Gr", unit: "pack", price: 16700, img: "m_22_07_2022_05_21_32_daun_mint250gr.jpg" },
  { name: "Daun Pandan", unit: "kg", price: 19900, img: "m_22_07_2022_05_27_57_daun_pandan_kg.jpg" },
  { name: "Daun Pandan 250 Gr", unit: "pack", price: 6200, img: "m_13_02_2024_10_46_46_22_07_2022_05_29_51_daun_pandan_250_gr.jpg" },
  { name: "Daun Parsley", unit: "kg", price: 91600, img: "m_10_04_2025_05_56_54_ps_PARSLEY.png" },
  { name: "Daun Parsley 250 Gr", unit: "pack", price: 27700, img: "m_10_04_2025_05_56_17_ps_PARSLEY.png" },
  { name: "Daun Pepaya Jepang", unit: "kg", price: 11800, img: "m_16_11_2020_06_10_44_daun_PEPAYA_JEPANG.jpg" },
  { name: "Daun Pepaya Jepang 250 Gr", unit: "pack", price: 3800, img: "m_19_01_2021_03_23_43_daun_PEPAYA_JEPANG.jpg" },
  { name: "Daun Salam", unit: "kg", price: 10100, img: "m_16_11_2020_06_07_14_Daun_Salam.jpg" },
  { name: "Daun Salam 250 Gr", unit: "pack", price: 3300, img: "m_19_01_2021_03_18_31_Daun_Salam.jpg" },
  { name: "Daun Salam Petik", unit: "kg", price: 14700, img: "m_12_04_2025_02_27_37_DAUN_SALAM_PETIK_NEW.png" },
  { name: "Daun Salam Petik 250 Gr", unit: "pack", price: 4700, img: "m_12_04_2025_02_28_01_DAUN_SALAM_PETIK_NEW.png" },
  { name: "Daun Seledri", unit: "kg", price: 31100, img: "m_08_12_2018_02_56_55_DAUN_SELEDRI.jpg" },
  { name: "Daun Seledri 250 Gr", unit: "pack", price: 9600, img: "m_30_11_2020_03_41_55_DAUN_SELEDRI.jpg" },
  { name: "Daun Seledri Tanpa Akar", unit: "kg", price: 35100, img: "m_03_11_2020_12_23_23_m_2017_10_13_daun_sledri_tanpa.jpg" },
  { name: "Daun Seledri Tanpa Akar 250 Gr", unit: "pack", price: 10800, img: "m_25_07_2022_02_55_14_seledri.jpg" },
  { name: "Daun Singkong", unit: "kg", price: 11600, img: "m_08_12_2018_02_54_35_DAUN_SINGKONG.jpg" },
  { name: "Daun Singkong 250 Gr", unit: "pack", price: 3700, img: "m_10_04_2025_04_40_15_pas_DAUN_SINGKONG.png" },
  { name: "Edamame", unit: "kg", price: 44400, img: "m_12_04_2025_01_55_12_NEW_EDAMAME.png" },
  { name: "Edamame 500 Gr", unit: "pack", price: 26600, img: "m_12_04_2025_01_53_44_NEW_EDAMAME.png" },
];

export const seedLeafProducts = async () => {
  const baseUrl = "https://d27xm72ryhvga.cloudfront.net/product/thumbnail/";
  
  for (const item of leafProducts) {
    const productData: Omit<Product, "id"> = {
      name: item.name,
      category: "sayur", // Semuanya masuk kategori sayuran
      price: item.price,
      unit: item.unit,
      image: baseUrl + item.img,
      description: `${item.name} segar berkualitas, dipetik langsung dari kebun untuk menjaga kesegarannya.`,
      stock: 1000,
      isAvailable: true,
    };

    await addProduct(productData);
    console.log(`Berhasil menambahkan: ${item.name}`);
  }
  alert("Data dedaunan berhasil ditambahkan!");
};
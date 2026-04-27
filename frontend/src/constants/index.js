// ─── DESIGN TOKENS ───────────────────────────────────────────────
export const C = {
  bg:           "#F8F9FA",
  card:         "#FFFFFF",
  primary:      "#FFB380",
  primaryDark:  "#F4894A",
  primaryLight: "#FFF0E8",
  primaryBorder:"#FFD4B8",
  accent:       "#5BA4CF",
  text:         "#1C1C1E",
  textSub:      "#6B7280",
  textMuted:    "#A1A1AA",
  border:       "#EAEAEA",
  danger:       "#FF4D4F",
  dangerLight:  "#FFF1F0",
  shadow:       "0 2px 12px rgba(0,0,0,0.07)",
  shadowMd:     "0 4px 22px rgba(0,0,0,0.10)",
};

export const COND = {
  "A'lo":   { bg:"#E8F8F0", text:"#28A869" },
  "Yaxshi": { bg:"#E8F2FD", text:"#3A85C8" },
  "O'rta":  { bg:"#FFF8E6", text:"#D4920A" },
};

// ─── UZBEKISTON ───────────────────────────────────────────────────
export const UZ = {
  "Toshkent sh.":    ["Yunusobod","Chilonzor","Sergeli","Mirzo Ulug'bek","Yakkasaroy","Bektemir","Yashnobod","Shayxontohur","Olmazor","Uchtepa","Mirobod","Hamza"],
  "Toshkent vil.":   ["Zangiota","Qibray","Ohangaron","Chirchiq","Angren","Bekabad","Bo'ka","Yuqorichirchiq","Quyi Chirchiq","O'rta Chirchiq"],
  "Samarqand":       ["Samarqand sh.","Kattaqo'rg'on","Ishtixon","Jomboy","Nurota","Oqdaryo","Pastdarg'om","Toyloq","Urgut"],
  "Andijon":         ["Andijon sh.","Asaka","Xo'jaobod","Jalolquduq","Marhamat","Oltinkol","Paxtaobod","Shahrixon","Ulug'nor"],
  "Farg'ona":        ["Farg'ona sh.","Marg'ilon","Qo'qon","Buvayda","Dang'ara","Furqat","Qo'shtepa","Rishton","Uchko'prik"],
  "Namangan":        ["Namangan sh.","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To'raqo'rg'on","Uychi"],
  "Buxoro":          ["Buxoro sh.","G'ijduvon","Jondor","Kogon","Peshku","Qorovulbozor","Romitan","Shofirkon","Vobkent"],
  "Xorazm":          ["Urganch sh.","Xiva","Bog'ot","Gurlan","Qo'shko'pir","Shovot","Yangiariq","Yangibozor"],
  "Qashqadaryo":     ["Qarshi sh.","Shahrisabz","Chiroqchi","G'uzor","Kamashi","Kitob","Koson","Muborak","Nishon"],
  "Surxondaryo":     ["Termiz sh.","Angor","Denov","Jarqo'rg'on","Muzrabot","Oltinsoy","Qumqo'rg'on","Sho'rchi"],
  "Sirdaryo":        ["Guliston sh.","Shirin","Boyovut","Mirzaobod","Oqoltin","Sardoba","Sayxunobod","Xovos"],
  "Jizzax":          ["Jizzax sh.","Arnasoy","Baxmal","Do'stlik","Forish","G'allaorol","Mirzacho'l","Paxtakor","Yangiobod","Zarbdor","Zafarobod","Zomin"],
  "Navoiy":          ["Navoiy sh.","Nurota","Tomdi","Uchquduq","Xatirchi","Karmana","Konimex","Qiziltepa"],
  "Qoraqalpog'iston":["Nukus sh.","Beruniy","Chimboy","Ellikkala","Kegeyli","Mo'ynoq","Qonliko'l","Qo'ng'irot","Shumanay","Taxtako'pir","To'rtko'l","Xo'jayli"],
};

// demo rasmlar uchun placeholder — real app da haqiqiy rasm URL lari
export const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
];

export const CATS    = ["Barchasi","g'isht","metall","yog'och","beton","boshqa"];
export const CAT_ICO = { "Barchasi":"🏗","g'isht":"🧱","metall":"🔩","yog'och":"🪵","beton":"⬜","boshqa":"🔧" };

export const INIT_PRODUCTS = [
  { id:1, name:"Eski g'isht",      category:"g'isht",  price:450,    unit:"dona", qty:2000, viloyat:"Toshkent sh.", tuman:"Yunusobod",      photo:DEMO_PHOTOS[0], condition:"A'lo",   ownerId:1 },
  { id:2, name:"Temir profil",     category:"metall",  price:12000,  unit:"kg",   qty:500,  viloyat:"Toshkent sh.", tuman:"Chilonzor",       photo:DEMO_PHOTOS[1], condition:"Yaxshi", ownerId:2 },
  { id:3, name:"Yog'och taxta",    category:"yog'och", price:25000,  unit:"m²",   qty:80,   viloyat:"Samarqand",    tuman:"Samarqand sh.",   photo:DEMO_PHOTOS[2], condition:"A'lo",   ownerId:1 },
  { id:4, name:"Beton plita",      category:"beton",   price:85000,  unit:"dona", qty:30,   viloyat:"Toshkent sh.", tuman:"Sergeli",          photo:DEMO_PHOTOS[3], condition:"O'rta",  ownerId:2 },
  { id:5, name:"Plastik quvur",    category:"boshqa",  price:8500,   unit:"m",    qty:200,  viloyat:"Andijon",      tuman:"Andijon sh.",      photo:DEMO_PHOTOS[4], condition:"Yaxshi", ownerId:1 },
  { id:6, name:"Shifer",           category:"boshqa",  price:35000,  unit:"dona", qty:45,   viloyat:"Namangan",     tuman:"Namangan sh.",     photo:DEMO_PHOTOS[5], condition:"Yaxshi", ownerId:2 },
  { id:7, name:"Alyuminiy deraza", category:"metall",  price:320000, unit:"dona", qty:12,   viloyat:"Toshkent sh.", tuman:"Mirzo Ulug'bek",   photo:DEMO_PHOTOS[6], condition:"A'lo",   ownerId:1 },
  { id:8, name:"Parket taxta",     category:"yog'och", price:65000,  unit:"m²",   qty:60,   viloyat:"Toshkent sh.", tuman:"Yakkasaroy",       photo:DEMO_PHOTOS[7], condition:"A'lo",   ownerId:2 },
];

export const INIT_USER = { id:1, name:"Abdulloh Karimov", phone:"+998 90 123 45 67", telegram:"@abdulloh_k", avatar:null, joined:"2024-03-15" };
export const EMPTY_FORM = { name:"", category:"g'isht", price:"", unit:"dona", qty:"", viloyat:"", tuman:"", condition:"A'lo", photos:[], mahalla:"" };

export const APP_NAME = "ReQurilish";

export const STATUS_LABELS = {
  active:           "Faol",
  pending_approval: "Tekshiruvda",
  pending_payment:  "To'lov kutmoqda",
  hidden:           "Yashirilgan",
  deleted:          "O'chirilgan",
};

export const STATUS_COLORS = {
  active:           { bg:"#E8F8F0", color:"#28A869" },
  pending_approval: { bg:"#FFFBEB", color:"#D97706" },
  pending_payment:  { bg:"#EFF6FF", color:"#2563EB" },
  hidden:           { bg:"#F3F4F6", color:"#6B7280" },
  deleted:          { bg:"#FFF1F0", color:"#EF4444" },
};

// Operator ma'lumotlari (real app da backenddan keladi)
export const OPERATOR = {
  telegram: "@Requrilish_admin",
  card:     "9860 1606 1973 1286",
  name:     "Mustafo Ismoiljonov",
};

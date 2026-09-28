// Real Mardin menu, transcribed from the paper menu photos (2026-09-24).
// Edit here or later in the admin panel. Import: `pnpm db:import-menu` (skips dishes that already exist).

export interface MenuItem {
  ru: string;
  uz: string;
  price: number;
  ingRu?: string;
  ingUz?: string;
  descRu?: string;
  descUz?: string;
  /** Two-size items (e.g. glass / jug) become separate dishes: [labelRu, labelUz, price]. */
  sizes?: [string, string, number][];
}

export interface MenuCategory {
  ru: string;
  uz: string;
  /** Imported but hidden from the mini app (can be switched on in the admin panel). */
  hidden?: boolean;
  /** All dishes of the category can be ordered for pickup only. */
  pickupOnly?: boolean;
  items: MenuItem[];
}

const GRILL_RU = 'Подаётся с картофелем фри, лавашом, луком, томатом и перцем на гриле и соусом.';
const GRILL_UZ = 'Kartoshka fri, lavash, piyoz, grilda pishirilgan pomidor, qalampir va sous bilan tortiladi.';
const grill = { descRu: GRILL_RU, descUz: GRILL_UZ };

const GLASS_JUG: [string, string][] = [
  ['стакан', 'stakan'],
  ['кувшин', 'ko‘za'],
];
const pair = (a: number, b: number, labels = GLASS_JUG): [string, string, number][] => [
  [labels[0]![0], labels[0]![1], a],
  [labels[1]![0], labels[1]![1], b],
];

export const MENU: MenuCategory[] = [
  {
    ru: 'Завтраки',
    uz: 'Nonushta',
    items: [
      { ru: 'Завтрак «Сет»', uz: 'Nonushta «Set»', price: 50000 },
      { ru: 'Менемен', uz: 'Menemen', price: 36000 },
      { ru: 'Омлет с сыром', uz: 'Pishloqli omlet', price: 32000 },
      { ru: 'Сучук', uz: 'Sujuk', price: 29000 },
      { ru: 'Глазунья', uz: 'Qovurilgan tuxum', price: 15000 },
    ],
  },
  {
    ru: 'Мезе и закуски',
    uz: 'Meze va gazaklar',
    items: [
      { ru: 'Мезе сет', uz: 'Meze set', price: 50000, ingRu: 'Эзме, баклажан эзме, хайдари, хумус', ingUz: 'Ezme, baqlajon ezme, haydari, humus' },
      { ru: 'Жульен', uz: 'Julyen', price: 55000, ingRu: 'Грибы, куриное филе, сливки, тесто', ingUz: 'Qo‘ziqorin, tovuq filesi, qaymoq, xamir' },
      { ru: 'Шницель', uz: 'Shnitsel', price: 61000, ingRu: 'Куриное филе, сыр моцарелла, грибной соус', ingUz: 'Tovuq filesi, motsarella pishlog‘i, qo‘ziqorinli sous' },
      { ru: 'Сигара бурек', uz: 'Sigara burek', price: 26000, ingRu: 'Брынза, сыр, петрушка, лаваш', ingUz: 'Brinza, pishloq, petrushka, lavash' },
    ],
  },
  {
    ru: 'Салаты',
    uz: 'Salatlar',
    items: [
      { ru: 'Салат «Мардин»', uz: '«Mardin» salati', price: 69000, ingRu: 'Ананас, куриное бедро, айсберг, фирменный соус', ingUz: 'Ananas, tovuq soni, aysberg, maxsus sous' },
      { ru: 'Салат «Цезарь»', uz: '«Sezar» salati', price: 50000, ingRu: 'Куриное филе, айсберг, помидоры черри, перепелиные яйца, сухарики, фирменный соус, сыр пармезан', ingUz: 'Tovuq filesi, aysberg, cherri pomidor, bedana tuxumi, suxariklar, maxsus sous, parmezan pishlog‘i' },
      { ru: 'Салат «Тайский»', uz: '«Tay» salati', price: 75000, ingRu: 'Бон-филе, руккола, грибы, молодая кукуруза, соус Киккоман', ingUz: 'Mol go‘shti bon-filesi, rukola, qo‘ziqorin, yosh makkajo‘xori, Kikkoman sousi' },
      { ru: 'Салат «Тосканский»', uz: '«Toskana» salati', price: 75000, ingRu: 'Бон-филе, руккола, помидоры, болгарский перец, баклажаны, сыр пармезан', ingUz: 'Mol go‘shti bon-filesi, rukola, pomidor, bulg‘or qalampiri, baqlajon, parmezan pishlog‘i' },
      { ru: 'Салат «Хрустящие баклажаны»', uz: '«Qarsildoq baqlajon» salati', price: 49000, ingRu: 'Баклажаны, помидоры, сыр фетакс, соус свит чили', ingUz: 'Baqlajon, pomidor, fetaks pishlog‘i, shirin chili sousi' },
      { ru: 'Салат «Греческий»', uz: '«Grek» salati', price: 45000, ingRu: 'Фетакс, помидоры, огурцы, оливки, лук шалот', ingUz: 'Fetaks, pomidor, bodring, zaytun, shalot piyozi' },
      { ru: 'Салат «Гавурдаги»', uz: '«Gavurdag‘i» salati', price: 39000, ingRu: 'Помидоры, огурцы, лук шалот, грецкий орех', ingUz: 'Pomidor, bodring, shalot piyozi, yong‘oq' },
    ],
  },
  {
    ru: 'Супы',
    uz: 'Sho‘rvalar',
    items: [
      { ru: 'Мерджимек', uz: 'Merjimek', price: 26000, ingRu: 'Чечевица, лук, морковь, чеснок', ingUz: 'Yasmiq, piyoz, sabzi, sarimsoq' },
      { ru: 'Эзогелин', uz: 'Ezogelin', price: 26000, ingRu: 'Чечевица, лук, морковь, томаты', ingUz: 'Yasmiq, piyoz, sabzi, pomidor' },
      { ru: 'Куриный суп', uz: 'Tovuq sho‘rva', price: 30000, ingRu: 'Куриное филе, лапша, морковь, лук', ingUz: 'Tovuq filesi, ugra, sabzi, piyoz' },
      { ru: 'Тыквенный суп', uz: 'Qovoq sho‘rva', price: 35000, ingRu: 'Тыква, сливки, лук', ingUz: 'Qovoq, qaymoq, piyoz' },
      { ru: 'Харчо', uz: 'Xarcho', price: 38000, ingRu: 'Говядина, рис, грецкий орех, томаты, болгарский перец', ingUz: 'Mol go‘shti, guruch, yong‘oq, pomidor, bulg‘or qalampiri' },
    ],
  },
  {
    ru: 'Кебабы',
    uz: 'Kaboblar',
    items: [
      { ru: 'Адана кебаб', uz: 'Adana kabob', price: 80000, ...grill },
      { ru: 'Урфа кебаб', uz: 'Urfa kabob', price: 80000, ...grill },
      { ru: 'Шиш кебаб', uz: 'Shish kabob', price: 90000, ...grill },
      { ru: 'Дана кебаб', uz: 'Dana kabob', price: 90000, ...grill },
      { ru: 'Кофте', uz: 'Ko‘fta', price: 65000, ...grill },
      { ru: 'Печень шиш', uz: 'Jigar shish', price: 80000, ...grill },
      { ru: 'Куриный кофте', uz: 'Tovuq ko‘fta', price: 55000, ...grill },
      { ru: 'Куриная пирзола', uz: 'Tovuq pirzola', price: 65000, ...grill },
      { ru: 'Куриные крылышки', uz: 'Tovuq qanotlari', price: 65000, ...grill },
    ],
  },
  {
    ru: 'Стейки',
    uz: 'Steyklar',
    items: [
      { ru: 'Стейк Т-бон', uz: 'T-bon steyk', price: 190000 },
      { ru: 'Медальоны', uz: 'Medalyonlar', price: 180000, ...grill },
      { ru: 'Баранья пирзола', uz: 'Qo‘y pirzolasi', price: 170000, ...grill },
    ],
  },
  {
    ru: 'Турецкая кухня',
    uz: 'Turk taomlari',
    items: [
      { ru: 'Искандер кебаб', uz: 'Iskandar kabob', price: 85000, ingRu: 'Говядина, бараний курдюк, томатный соус, хлеб, сливочное масло, сузьма', ingUz: 'Mol go‘shti, qo‘y dumbasi, pomidor sousi, non, sariyog‘, suzma' },
      { ru: 'Донер бейти', uz: 'Doner beyti', price: 85000, ingRu: 'Говядина, бараний курдюк, томатный соус, сыр моцарелла, лаваш', ingUz: 'Mol go‘shti, qo‘y dumbasi, pomidor sousi, motsarella pishlog‘i, lavash' },
      { ru: 'Порционный донер', uz: 'Porsiya doner', price: 70000, ingRu: 'Говядина, бараний курдюк, лаваш, картофель фри', ingUz: 'Mol go‘shti, qo‘y dumbasi, lavash, kartoshka fri' },
      { ru: 'Бейти сарма', uz: 'Beyti sarma', price: 91000, ingRu: 'Урфа кебаб, сыр, сузьма, томатный соус, тесто', ingUz: 'Urfa kabob, pishloq, suzma, pomidor sousi, xamir' },
      { ru: 'Кайлалы кофте', uz: 'Kaylali ko‘fta', price: 76000, ingRu: 'Кофте, томатный соус, сыр моцарелла', ingUz: 'Ko‘fta, pomidor sousi, motsarella pishlog‘i' },
      { ru: 'Али-Назик', uz: 'Ali-Nazik', price: 83000, ingRu: 'Кебаб, баклажан, сузьма, томатный соус', ingUz: 'Kabob, baqlajon, suzma, pomidor sousi' },
      { ru: 'Чёкертме', uz: 'Chokertme', price: 92000, ingRu: 'Говядина, сузьма, картофель пай, томатный соус', ingUz: 'Mol go‘shti, suzma, kartoshka pay, pomidor sousi' },
      { ru: 'Говяжий сач-тава', uz: 'Mol go‘shtli sach-tava', price: 87000, ingRu: 'Говядина, болгарский перец, помидоры', ingUz: 'Mol go‘shti, bulg‘or qalampiri, pomidor' },
      { ru: 'Куриный сач-тава', uz: 'Tovuqli sach-tava', price: 71000, ingRu: 'Куриное филе, болгарский перец, помидоры', ingUz: 'Tovuq filesi, bulg‘or qalampiri, pomidor' },
    ],
  },
  {
    ru: 'Основные блюда',
    uz: 'Asosiy taomlar',
    items: [
      { ru: 'Бон-филе с соусом чимичурри', uz: 'Chimichurri sousli bon-file', price: 129000, ingRu: 'Бон-филе, болгарский перец, помидоры, соус чимичурри, турецкий соус', ingUz: 'Bon-file, bulg‘or qalampiri, pomidor, chimichurri sousi, turk sousi' },
      { ru: 'Бон-филе с молодой картошкой', uz: 'Yosh kartoshkali bon-file', price: 119000, ingRu: 'Бон-филе, картофель, сахарная кость, соус деми-глас', ingUz: 'Bon-file, kartoshka, ilik suyak, demi-glas sousi' },
      { ru: 'Как-мач по-туркменски', uz: 'Turkmancha kak-mach', price: 103000, ingRu: 'Бон-филе, картофель, сливки, лук', ingUz: 'Bon-file, kartoshka, qaymoq, piyoz' },
      { ru: 'Картошка по-домашнему', uz: 'Uy usulida kartoshka', price: 99000, ingRu: 'Бон-филе, картофель, сливки, грибы, лук', ingUz: 'Bon-file, kartoshka, qaymoq, qo‘ziqorin, piyoz' },
      { ru: 'Курица по-французски', uz: 'Fransuzcha tovuq', price: 76000, ingRu: 'Куриное бедро, картофель, сливки, оливки', ingUz: 'Tovuq soni, kartoshka, qaymoq, zaytun' },
      { ru: 'Долма', uz: 'Do‘lma', price: 73000, ingRu: 'Говяжий фарш, рис, виноградные листья, помидоры, болгарский перец', ingUz: 'Mol go‘shti qiymasi, guruch, uzum barglari, pomidor, bulg‘or qalampiri' },
      { ru: 'Курица на мангале в томатном соусе', uz: 'Pomidor sousida mangalda tovuq', price: 72000, ingRu: 'Куриное филе, болгарский перец, помидоры, турецкий соус, фетакс', ingUz: 'Tovuq filesi, bulg‘or qalampiri, pomidor, turk sousi, fetaks' },
      { ru: 'Спагетти болоньезе', uz: 'Spagetti bolonyeze', price: 73000, ingRu: 'Говяжий фарш, помидоры, болгарский перец, лук, чеснок, морковь, макароны, сыр пармезан', ingUz: 'Mol go‘shti qiymasi, pomidor, bulg‘or qalampiri, piyoz, sarimsoq, sabzi, makaron, parmezan pishlog‘i' },
      { ru: 'Феттучини альфредо', uz: 'Fettuchini alfredo', price: 71000, ingRu: 'Куриное филе, грибы, сливки, лук, макароны, сыр пармезан', ingUz: 'Tovuq filesi, qo‘ziqorin, qaymoq, piyoz, makaron, parmezan pishlog‘i' },
    ],
  },
  {
    ru: 'Пиде и пицца',
    uz: 'Pide va pitsa',
    items: [
      { ru: 'Лахмаджун', uz: 'Lahmajun', price: 40000, ingRu: 'Говяжий фарш, помидоры, болгарский перец, лук, петрушка, тесто', ingUz: 'Mol go‘shti qiymasi, pomidor, bulg‘or qalampiri, piyoz, petrushka, xamir' },
      { ru: 'Пиде «Киймали»', uz: '«Qiymali» pide', price: 72000, ingRu: 'Говяжий фарш, помидоры, болгарский перец, лук, петрушка, тесто', ingUz: 'Mol go‘shti qiymasi, pomidor, bulg‘or qalampiri, piyoz, petrushka, xamir' },
      { ru: 'Пиде «Кушбаши»', uz: '«Kushbashi» pide', price: 81000, ingRu: 'Говядина, помидоры, болгарский перец, лук, петрушка, тесто', ingUz: 'Mol go‘shti, pomidor, bulg‘or qalampiri, piyoz, petrushka, xamir' },
      { ru: 'Пиде «Кавурмали»', uz: '«Qovurmali» pide', price: 83000, ingRu: 'Говядина, сыр моцарелла, тесто', ingUz: 'Mol go‘shti, motsarella pishlog‘i, xamir' },
      { ru: 'Пиде «Сырой»', uz: '«Siroy» pide', price: 52000, ingRu: 'Сыр, яйцо, тесто', ingUz: 'Pishloq, tuxum, xamir' },
      { ru: 'Пиде «Мардин»', uz: '«Mardin» pide', price: 80000, ingRu: 'Шоколадная паста, банан, грецкий орех, тесто', ingUz: 'Shokolad pastasi, banan, yong‘oq, xamir' },
      { ru: 'Пицца «Маргарита»', uz: '«Margarita» pitsa', price: 75000 },
      { ru: 'Пицца «Пепперони»', uz: '«Pepperoni» pitsa', price: 80000 },
      { ru: 'Пицца «Комбо»', uz: '«Kombo» pitsa', price: 95000 },
    ],
  },
  {
    ru: 'Донеры и бургеры',
    uz: 'Doner va burgerlar',
    items: [
      { ru: 'Дурум донер', uz: 'Durum doner', price: 60000 },
      { ru: 'Томбик донер', uz: 'Tombik doner', price: 60000 },
      { ru: 'Бургер «Классический»', uz: '«Klassik» burger', price: 50000 },
      { ru: 'Бургер «Чиз»', uz: '«Chiz» burger', price: 60000 },
    ],
  },
  {
    ru: 'Хлеб и гарниры',
    uz: 'Non va garnirlar',
    items: [
      { ru: 'Картофель фри', uz: 'Kartoshka fri', price: 20000 },
      { ru: 'Рис', uz: 'Guruch', price: 15000 },
      { ru: 'Кукуруза на мангале', uz: 'Mangalda makkajo‘xori', price: 20000 },
      { ru: 'Хлебное ассорти', uz: 'Non assorti', price: 24000 },
      { ru: 'Афган хлеб', uz: 'Afg‘on non', price: 10000 },
      { ru: 'Пуф хлеб', uz: 'Puf non', price: 10000 },
      { ru: 'Пиде хлеб', uz: 'Pide non', price: 6000 },
    ],
  },
  {
    ru: 'Напитки',
    uz: 'Ichimliklar',
    items: [
      { ru: 'Кока-кола', uz: 'Koka-kola', price: 0, sizes: pair(10000, 20000, [['0,5 л', '0,5 l'], ['1 л', '1 l']]) },
      { ru: 'Фанта', uz: 'Fanta', price: 0, sizes: pair(10000, 20000, [['0,5 л', '0,5 l'], ['1 л', '1 l']]) },
      { ru: 'Вода', uz: 'Suv', price: 0, sizes: pair(5000, 8000, [['0,5 л', '0,5 l'], ['1,5 л', '1,5 l']]) },
      { ru: 'Айран', uz: 'Ayron', price: 0, sizes: pair(10000, 25000) },
      { ru: 'Сок', uz: 'Sharbat', price: 0, sizes: pair(5000, 20000, [['стакан', 'stakan'], ['1 л', '1 l']]) },
      { ru: 'Натахтари', uz: 'Natahtari', price: 20000 },
      { ru: 'Фреш яблочный', uz: 'Olma fresh', price: 25000 },
      { ru: 'Фреш морковный', uz: 'Sabzi fresh', price: 20000 },
      { ru: 'Фреш апельсиновый', uz: 'Apelsin fresh', price: 38000 },
      { ru: 'Фреш яблочно-морковный', uz: 'Olma-sabzi fresh', price: 33000 },
    ],
  },
  {
    ru: 'Мохито и лимонады',
    uz: 'Mojito va limonadlar',
    items: [
      { ru: 'Мохито «Классический»', uz: '«Klassik» mojito', price: 0, sizes: pair(25000, 50000) },
      { ru: 'Мохито «Манго-маракуйя»', uz: '«Mango-marakuyya» mojito', price: 0, sizes: pair(25000, 50000) },
      { ru: 'Мохито «Киви»', uz: '«Kivi» mojito', price: 0, sizes: pair(25000, 50000) },
      { ru: 'Мохито «Океан»', uz: '«Okean» mojito', price: 0, sizes: pair(25000, 50000) },
      { ru: 'Мохито «Лесные ягоды»', uz: '«O‘rmon mevalari» mojito', price: 0, sizes: pair(25000, 50000) },
      { ru: 'Айс ти', uz: 'Ays ti', price: 0, sizes: pair(25000, 40000) },
      { ru: 'Турецкий лимонад', uz: 'Turk limonadi', price: 0, sizes: pair(30000, 60000) },
      { ru: 'Лимонад «Мардин»', uz: '«Mardin» limonadi', price: 0, sizes: pair(35000, 65000) },
      { ru: 'Бамблби', uz: 'Bambl-bi', price: 35000 },
    ],
  },
  {
    ru: 'Чай и кофе',
    uz: 'Choy va qahva',
    pickupOnly: true, // shown in the menu, but hot drinks are not delivered
    items: [
      { ru: 'Чай «Мардин»', uz: '«Mardin» choyi', price: 49000 },
      { ru: 'Чай чёрный / зелёный', uz: 'Qora / ko‘k choy', price: 15000 },
      { ru: 'Чай с лимоном', uz: 'Limonli choy', price: 25000 },
      { ru: 'Чай фруктовый', uz: 'Mevali choy', price: 35000 },
      { ru: 'Чай имбирный', uz: 'Zanjabilli choy', price: 35000 },
      { ru: 'Бардак', uz: 'Bardak', price: 0, sizes: pair(5000, 20000, [['стакан', 'stakan'], ['чайник', 'choynak']]) },
      { ru: 'Турецкий кофе', uz: 'Turk qahvasi', price: 28000 },
      { ru: 'Эспрессо', uz: 'Espresso', price: 0, sizes: pair(22000, 35000, [['одинарный', 'yakka'], ['двойной', 'ikki barobar']]) },
      { ru: 'Американо', uz: 'Amerikano', price: 0, sizes: pair(22000, 35000, [['одинарный', 'yakka'], ['двойной', 'ikki barobar']]) },
      { ru: 'Капучино', uz: 'Kapuchino', price: 25000 },
      { ru: 'Латте', uz: 'Latte', price: 28000 },
      { ru: 'Флэт уайт', uz: 'Flet uayt', price: 35000 },
    ],
  },
];

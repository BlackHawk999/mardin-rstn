import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Unsplash photos (free to use). Replace with the restaurant's own photos from the admin panel later.
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=75&auto=format&fit=crop`;
const IMG = {
  adana: photo('1599487488170-d11ec9c172f0'),
  mardin: photo('1555939594-58d7cb561ad1'),
  lokum: photo('1603360946369-dc9bb6258143'),
  doner: photo('1529006557810-274b9b2fc783'),
  kofte: photo('1529042410759-befb1204b468'),
  plov: photo('1603133872878-684f208fb84b'),
  samsa: photo('1601050690597-df0568f70950'),
  dimlama: photo('1541518763669-27fef04b14ea'),
  ribs: photo('1544025162-d76694265947'),
  fish: photo('1633436375153-d7045cb93e38'),
  pizza: photo('1590947132387-155cc02f3212'),
  pasta: photo('1551183053-bf91a1d81141'),
  salad: photo('1540189549336-e6e99c3679fe'),
  bowl: photo('1546069901-ba9599a7e63c'),
  cake: photo('1565958011703-44f9829ba187'),
  crepes: photo('1587314168485-3236d6710814'),
  tea: photo('1544787219-7f47ccb76574'),
  cola: photo('1554866585-cd94860890b7'),
  lemonade: photo('1556679343-c7306c1976bc'),
};

const settings: Record<string, unknown> = {
  restaurantName: 'Mardin',
  restaurantPhone: '+998 90 000 00 00',
  restaurantAddress: "Toshkent, Chilonzor tumani, Bunyodkor ko'chasi, 12",
  restaurantLat: 41.2856,
  restaurantLng: 69.2034,
  openTime: '10:00',
  closeTime: '23:00',
  deliveryFee: 0,
  deliveryByTaxi: true,
  minOrderAmount: 50000,
};

async function main() {
  // Never overwrite settings or the menu the restaurant has entered in the admin panel.
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: JSON.stringify(value) } });
  }

  if ((await prisma.category.count()) > 0) {
    console.log('Menu already exists, demo data not added.');
    return;
  }

  const cat = async (nameUz: string, nameRu: string, imageUrl: string, sortOrder: number) =>
    prisma.category.create({ data: { nameUz, nameRu, imageUrl, sortOrder } });

  const kabob = await cat('Kaboblar', 'Кебабы', IMG.adana, 1);
  const milliy = await cat('Milliy taomlar', 'Национальные блюда', IMG.plov, 2);
  const pizza = await cat('Pitsa va pasta', 'Пицца и паста', IMG.pizza, 3);
  const salad = await cat('Salatlar', 'Салаты', IMG.salad, 4);
  const sweet = await cat('Shirinliklar', 'Десерты', IMG.cake, 5);
  const drink = await cat('Ichimliklar', 'Напитки', IMG.tea, 6);

  type DishSeed = {
    c: number; nameUz: string; nameRu: string; dUz: string; dRu: string; iUz: string; iRu: string;
    price: number; weight: string; img: string; hit?: boolean; isNew?: boolean; off?: boolean;
  };
  const dishes: DishSeed[] = [
    { c: kabob.id, nameUz: 'Adana kabob', nameRu: 'Адана кебаб', dUz: "Achchiq qizil qalampir bilan qo'lda maydalangan mol go'shti, ko'mirda pishirilgan.", dRu: 'Рубленая говядина с острым красным перцем, приготовленная на углях.', iUz: "Mol go'shti, qizil qalampir, piyoz, ziravorlar", iRu: 'Говядина, красный перец, лук, специи', price: 60000, weight: '250 г', img: IMG.adana, hit: true },
    { c: kabob.id, nameUz: 'Mardin (dilimdon) kabob', nameRu: 'Мардин кебаб', dUz: "Mol go'shti, tovuq, sabzavotlar, maxsus ziravorlar bilan tayyorlanadi. An'anaviy Mardin ta'mi.", dRu: 'Говядина, курица и овощи с фирменными специями. Традиционный вкус Мардина.', iUz: "Mol go'shti, tovuq, pomidor, bulgar qalampiri, piyoz, maxsus ziravorlar", iRu: 'Говядина, курица, помидор, болгарский перец, лук, фирменные специи', price: 75000, weight: '300 г', img: IMG.mardin, hit: true },
    { c: kabob.id, nameUz: 'Lokum kabob', nameRu: 'Локум кебаб', dUz: "Yumshoq qo'y go'shti bo'laklari, kartoshka fri va pomidor bilan.", dRu: 'Нежные кусочки баранины с картофелем фри и помидорами.', iUz: "Qo'y go'shti, kartoshka, pomidor, ziravorlar", iRu: 'Баранина, картофель, помидор, специи', price: 85000, weight: '300 г', img: IMG.lokum, isNew: true },
    { c: kabob.id, nameUz: "Tovuq do'ner", nameRu: 'Куриный дёнер', dUz: "Ko'mirda pishirilgan tovuq go'shti, kartoshka fri va sabzavotlar bilan.", dRu: 'Куриное мясо на углях с картофелем фри и овощами.', iUz: "Tovuq go'shti, kartoshka, pomidor, piyoz, sous", iRu: 'Курица, картофель, помидор, лук, соус', price: 45000, weight: '280 г', img: IMG.doner },
    { c: kabob.id, nameUz: "Ko'fta", nameRu: 'Кюфта', dUz: "Mol go'shtidan tayyorlangan kichik kotletlar, yashil salat bilan.", dRu: 'Небольшие котлеты из говядины с зелёным салатом.', iUz: "Mol go'shti, piyoz, non, ziravorlar", iRu: 'Говядина, лук, хлеб, специи', price: 58000, weight: '250 г', img: IMG.kofte },

    { c: milliy.id, nameUz: 'Osh', nameRu: 'Плов', dUz: "Qo'y go'shti, sabzi va no'xat bilan qozonda pishirilgan an'anaviy palov.", dRu: 'Традиционный плов с бараниной, морковью и нутом, приготовленный в казане.', iUz: "Guruch, qo'y go'shti, sabzi, no'xat, piyoz", iRu: 'Рис, баранина, морковь, нут, лук', price: 45000, weight: '400 г', img: IMG.plov, hit: true },
    { c: milliy.id, nameUz: 'Samsa (2 dona)', nameRu: 'Самса (2 шт)', dUz: "Tandirda pishirilgan go'shtli samsa.", dRu: 'Самса с мясом из тандыра.', iUz: "Xamir, mol go'shti, piyoz, ziravorlar", iRu: 'Тесто, говядина, лук, специи', price: 20000, weight: '2 × 120 г', img: IMG.samsa },
    { c: milliy.id, nameUz: 'Dimlama', nameRu: 'Димлама', dUz: "Go'sht va mavsumiy sabzavotlar o'z sharbatida dimlangan.", dRu: 'Мясо с сезонными овощами, томлёное в собственном соку.', iUz: "Mol go'shti, kartoshka, sabzi, karam, pomidor", iRu: 'Говядина, картофель, морковь, капуста, помидор', price: 52000, weight: '400 г', img: IMG.dimlama },
    { c: milliy.id, nameUz: "Qovurg'a", nameRu: 'Рёбрышки', dUz: "Maxsus marinadda ko'mirda pishirilgan mol qovurg'asi.", dRu: 'Говяжьи рёбрышки в фирменном маринаде, приготовленные на углях.', iUz: "Mol qovurg'asi, sous, pomidor, bodring", iRu: 'Говяжьи рёбра, соус, помидор, огурец', price: 95000, weight: '450 г', img: IMG.ribs, isNew: true },
    { c: milliy.id, nameUz: 'Baliq pyure bilan', nameRu: 'Рыба с пюре', dUz: "Qovurilgan baliq filesi, kartoshka pyuresi va sous bilan.", dRu: 'Жареное филе рыбы с картофельным пюре и соусом.', iUz: 'Baliq, kartoshka, sut, sariyog’, rayhon', iRu: 'Рыба, картофель, молоко, масло, базилик', price: 65000, weight: '350 г', img: IMG.fish },

    { c: pizza.id, nameUz: "Go'shtli pitsa", nameRu: 'Пицца с мясом', dUz: "Mol go'shti, pomidor va rayhon bilan yupqa xamirli pitsa.", dRu: 'Пицца на тонком тесте с говядиной, томатами и базиликом.', iUz: "Xamir, mol go'shti, pomidor, motsarella, rayhon", iRu: 'Тесто, говядина, томаты, моцарелла, базилик', price: 70000, weight: '30 см', img: IMG.pizza },
    { c: pizza.id, nameUz: "Go'shtli pasta", nameRu: 'Паста с говядиной', dUz: "Tagliatelle, mol go'shti va qo'ziqorin bilan qaymoqli sousda.", dRu: 'Тальятелле с говядиной и грибами в сливочном соусе.', iUz: "Makaron, mol go'shti, qo'ziqorin, qaymoq", iRu: 'Паста, говядина, грибы, сливки', price: 48000, weight: '320 г', img: IMG.pasta },

    { c: salad.id, nameUz: 'Sabzavotli salat', nameRu: 'Овощной салат', dUz: 'Yangi sabzavotlar, zaytun va brinza zaytun moyi bilan.', dRu: 'Свежие овощи, оливки и брынза с оливковым маслом.', iUz: 'Pomidor, bodring, zaytun, brinza, ko’katlar', iRu: 'Помидор, огурец, оливки, брынза, зелень', price: 28000, weight: '250 г', img: IMG.salad },
    { c: salad.id, nameUz: 'Tovuqli salat', nameRu: 'Салат с курицей', dUz: "Grilda pishirilgan tovuq, tuxum, makkajo'xori va sabzavotlar.", dRu: 'Курица гриль, яйцо, кукуруза и свежие овощи.', iUz: "Tovuq, tuxum, makkajo'xori, bodring, pomidor", iRu: 'Курица, яйцо, кукуруза, огурец, помидор', price: 35000, weight: '280 г', img: IMG.bowl },

    { c: sweet.id, nameUz: 'Malinali tort', nameRu: 'Малиновый торт', dUz: 'Yengil biskvit, qaymoqli krem va yangi malina.', dRu: 'Лёгкий бисквит, сливочный крем и свежая малина.', iUz: 'Biskvit, qaymoq, malina', iRu: 'Бисквит, сливки, малина', price: 30000, weight: '150 г', img: IMG.cake },
    { c: sweet.id, nameUz: 'Blinchik qulupnay bilan', nameRu: 'Блинчики с клубникой', dUz: 'Yupqa blinchiklar, qulupnay va qaymoq bilan.', dRu: 'Тонкие блинчики с клубникой и взбитыми сливками.', iUz: 'Xamir, qulupnay, qaymoq', iRu: 'Тесто, клубника, сливки', price: 25000, weight: '200 г', img: IMG.crepes, off: true },

    { c: drink.id, nameUz: 'Choy', nameRu: 'Чай', dUz: 'Qora yoki ko’k choy, pechenye bilan.', dRu: 'Чёрный или зелёный чай с печеньем.', iUz: 'Choy, pechenye', iRu: 'Чай, печенье', price: 8000, weight: '400 мл', img: IMG.tea },
    { c: drink.id, nameUz: 'Kola 0.33', nameRu: 'Кола 0.33', dUz: 'Sovuq Coca-Cola.', dRu: 'Холодная Coca-Cola.', iUz: '', iRu: '', price: 12000, weight: '330 мл', img: IMG.cola },
    { c: drink.id, nameUz: 'Limonad', nameRu: 'Лимонад', dUz: 'Uy sharoitida tayyorlangan limonad, laym va yalpiz bilan.', dRu: 'Домашний лимонад с лаймом и мятой.', iUz: 'Laym, yalpiz, shakar, gazli suv', iRu: 'Лайм, мята, сахар, газированная вода', price: 15000, weight: '400 мл', img: IMG.lemonade },
  ];

  let i = 0;
  for (const d of dishes) {
    await prisma.dish.create({
      data: {
        categoryId: d.c,
        nameUz: d.nameUz,
        nameRu: d.nameRu,
        descriptionUz: d.dUz,
        descriptionRu: d.dRu,
        ingredientsUz: d.iUz || null,
        ingredientsRu: d.iRu || null,
        price: d.price,
        weight: d.weight,
        imageUrl: d.img,
        isHit: d.hit ?? false,
        isNew: d.isNew ?? false,
        isAvailable: !d.off,
        sortOrder: ++i,
      },
    });
  }

  await prisma.banner.createMany({
    data: [
      { imageUrl: IMG.mardin, titleUz: 'MAXSUS TAKLIF!', titleRu: 'СПЕЦПРЕДЛОЖЕНИЕ!', subtitleUz: "Mardin kabob va choy — 80 000 so'm", subtitleRu: 'Мардин кебаб и чай за 80 000 сум', categoryId: kabob.id, sortOrder: 1 },
      { imageUrl: IMG.plov, titleUz: 'Payshanba — osh kuni', titleRu: 'Четверг — день плова', subtitleUz: "Har bir oshga choy sovg'a", subtitleRu: 'Чай в подарок к каждому плову', categoryId: milliy.id, sortOrder: 2 },
      { imageUrl: IMG.cake, titleUz: 'Shirin yakun', titleRu: 'Сладкий финал', subtitleUz: 'Desertlar 20% chegirma bilan', subtitleRu: 'Десерты со скидкой 20%', categoryId: sweet.id, sortOrder: 3 },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

export function transliterateLatinToArmenian(text: string): string {
  if (!text) return text;
  if (/[\u0530-\u058F]/.test(text)) {
    return text;
  }

  const exactMap: Record<string, string> = {
    "ARAM": "Արամ",
    "ARMEN": "Արմեն",
    "TIGRAN": "Տիգրան",
    "ANNA": "Աննա",
    "SARGIS": "Սարգիս",
    "SARGSYAN": "Սարգսյան",
    "PETROSYAN": "Պետրոսյան",
    "HARUTYUNYAN": "Հարությունյան",
    "KHACHATRYAN": "Խաչատրյան",
    "GHAZARYAN": "Ղազարյան",
    "VARDANYAN": "Վարդանյան",
    "GRIGORYAN": "Գրիգորյան",
    "HAKOBYAN": "Հակոբյան",
    "KARAPETYAN": "Կարապետյան",
    "HOVHANNISYAN": "Հովհաննիսյան",
    "MINASYAN": "Մինասյան",
    "STEPANYAN": "Ստեփանյան",
    "VOSKANYAN": "Ոսկանյան",
    "DAVTYAN": "Դավթյան",
    "AVETISYAN": "Ավետիսյան",
    "MELKONYAN": "Մելքոնյան",
    "SOGHOMONYAN": "Սողոմոնյան",
    "GEVORKYAN": "Գևորգյան",
    "LLC": "ՍՊԸ",
    "CJSC": "ԱՓԲԸ",
    "OJSC": "ԲՓԲԸ",
    "LTD": "ՍՊԸ",
    "INC": "Ընկերություն",
    "GROUP": "Գրուպ",
    "COMPANY": "Ընկերություն",
    "INVESTMENT": "Ինվեսթմենթ",
  };

  const words = text.split(/\s+/);
  const translatedWords = words.map(word => {
    const cleanWord = word.replace(/[^A-Za-z]/g, "").toUpperCase();
    if (exactMap[cleanWord]) {
      return exactMap[cleanWord];
    }

    let w = word
      .toLowerCase()
      .replace(/sh/g, "շ")
      .replace(/ch/g, "չ")
      .replace(/zh/g, "ժ")
      .replace(/gh/g, "ղ")
      .replace(/kh/g, "խ")
      .replace(/ts/g, "ց")
      .replace(/dz/g, "ձ")
      .replace(/tch/g, "ճ")
      .replace(/dj/g, "ջ")
      .replace(/a/g, "ա")
      .replace(/b/g, "բ")
      .replace(/v/g, "վ")
      .replace(/g/g, "գ")
      .replace(/d/g, "դ")
      .replace(/e/g, "ե")
      .replace(/z/g, "զ")
      .replace(/i/g, "ի")
      .replace(/l/g, "լ")
      .replace(/k/g, "կ")
      .replace(/h/g, "հ")
      .replace(/m/g, "մ")
      .replace(/y/g, "յ")
      .replace(/n/g, "ն")
      .replace(/s/g, "ս")
      .replace(/p/g, "պ")
      .replace(/r/g, "ր")
      .replace(/u/g, "ու")
      .replace(/f/g, "ֆ")
      .replace(/o/g, "ո")
      .replace(/t/g, "տ")
      .replace(/c/g, "ց")
      .replace(/w/g, "վ")
      .replace(/j/g, "ջ")
      .replace(/x/g, "ք")
      .replace(/q/g, "ք");

    // Capitalize first letter of the Armenian word
    if (w.length > 0) {
      w = w.charAt(0).toUpperCase() + w.slice(1);
    }

    return w;
  });

  return translatedWords.join(" ");
}

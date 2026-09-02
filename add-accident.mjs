import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function add() {
  const docRef = doc(db, "knowledge_base_docs", "accident");
  await setDoc(docRef, {
    productId: "accident",
    sourceFile: "Դժբախտ Պատահարներ Պայմաններ.docx",
    textFile: "text/djbakht_pataharner.docx.txt",
    text: `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԴԺԲԱԽՏ ՊԱՏԱՀԱՐՆԵՐԻՑ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրական օբյեկտ՝ անձի կյանք և առողջություն։
2. Հիմնական ռիսկեր (ներառված)՝ Դժբախտ պատահարի հետևանքով մահ, մշտական կամ ժամանակավոր անաշխատունակություն (հաշմանդամություն), բժշկական ծախսեր։
3. Բացառություններ՝ մասնագիտական սպորտ, ալկոհոլի կամ թմրանյութի ազդեցության տակ տեղի ունեցած պատահարներ, ինքնասպանություն կամ դիտավորյալ վնաս։`
  });
  console.log("Accident KB added to Firestore.");
  process.exit(0);
}
add();

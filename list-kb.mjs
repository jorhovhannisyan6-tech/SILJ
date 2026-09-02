import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const querySnapshot = await getDocs(collection(db, "knowledge_base_docs"));
  const docs = querySnapshot.docs.map(doc => doc.data());
  console.log("Docs in Firestore:", docs.map(d => d.productId));
  process.exit(0);
}
check();

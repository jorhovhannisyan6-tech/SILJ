import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { QuotationProposal } from "../types";

export interface CloudSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  activeItemsCount: number;
  error: string | null;
}

const QUOTES_COLLECTION = "quotations";
const CONTRACTS_COLLECTION = "contracts";
const CLIENTS_COLLECTION = "clients";
const LOCAL_STORAGE_QUOTES_KEY = "sil-quote-history";
const LOCAL_STORAGE_CONTRACTS_KEY = "sil-issued-contracts-v1";
const LOCAL_STORAGE_CLIENTS_KEY = "sil-crm-clients-v1";

/**
 * Save / Update Quotation Proposal to Cloud Firestore and LocalStorage
 */
export async function syncQuotationToCloud(quote: QuotationProposal): Promise<void> {
  if (!quote || !quote.id) return;

  // 1. Immediately cache locally
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
    const existing: QuotationProposal[] = raw ? JSON.parse(raw) : [];
    const updated = [quote, ...existing.filter((q) => q.id !== quote.id)].slice(0, 300);
    localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Local storage cache error:", err);
  }

  // 2. Persist to Cloud Firestore
  try {
    const cleanQuote = JSON.parse(JSON.stringify(quote));
    const docRef = doc(db, QUOTES_COLLECTION, String(quote.id));
    await setDoc(
      docRef,
      {
        ...cleanQuote,
        _syncedAt: serverTimestamp(),
        _lastModifiedClient: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore sync quotation error (offline-first preserved):", err);
  }
}

/**
 * Delete Quotation Proposal from Cloud Firestore and LocalStorage
 */
export async function deleteQuotationFromCloud(quoteId: string): Promise<void> {
  if (!quoteId) return;

  // 1. Update local cache
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
    if (raw) {
      const existing: QuotationProposal[] = JSON.parse(raw);
      const updated = existing.filter((q) => q.id !== quoteId);
      localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("Local storage delete error:", err);
  }

  // 2. Delete from Cloud Firestore
  try {
    const docRef = doc(db, QUOTES_COLLECTION, String(quoteId));
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete quotation error:", err);
  }
}

/**
 * Real-time listener for Quotations across all users and devices
 */
export function listenToCloudQuotations(
  onUpdate: (quotes: QuotationProposal[]) => void,
  onError?: (error: any) => void
): () => void {
  try {
    const q = query(collection(db, QUOTES_COLLECTION), limit(300));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudQuotes: QuotationProposal[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as QuotationProposal;
          if (data && data.id) {
            cloudQuotes.push(data);
          }
        });

        // Merge with local storage to ensure no offline quotes are lost
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
          const localQuotes: QuotationProposal[] = raw ? JSON.parse(raw) : [];
          
          const map = new Map<string, QuotationProposal>();
          // Cloud quotes take precedence
          localQuotes.forEach((q) => map.set(q.id, q));
          cloudQuotes.forEach((q) => map.set(q.id, q));

          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(merged));
          onUpdate(merged);
        } catch {
          onUpdate(cloudQuotes);
        }
      },
      (err) => {
        console.warn("Firestore Quotations live stream warning:", err);
        if (onError) onError(err);
        // Fallback to local storage
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
          if (raw) onUpdate(JSON.parse(raw));
        } catch {
          // Ignore
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not attach Firestore listener:", err);
    return () => {};
  }
}

/**
 * Save Issued Contract / Policy to Cloud Firestore
 */
export async function syncContractToCloud(contract: any): Promise<void> {
  if (!contract || (!contract.id && !contract.contractNumber)) return;
  const docId = contract.id || contract.contractNumber;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONTRACTS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [contract, ...existing.filter((c: any) => (c.id || c.contractNumber) !== docId)].slice(0, 300);
    localStorage.setItem(LOCAL_STORAGE_CONTRACTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Local contract cache error:", err);
  }

  try {
    const cleanContract = JSON.parse(JSON.stringify(contract));
    const docRef = doc(db, CONTRACTS_COLLECTION, String(docId));
    await setDoc(
      docRef,
      {
        ...cleanContract,
        _syncedAt: serverTimestamp(),
        _lastModifiedClient: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore sync contract error:", err);
  }
}

/**
 * Real-time listener for Issued Contracts
 */
export function listenToCloudContracts(
  onUpdate: (contracts: any[]) => void,
  onError?: (error: any) => void
): () => void {
  try {
    const q = query(collection(db, CONTRACTS_COLLECTION), limit(300));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudContracts: any[] = [];
        snapshot.forEach((docSnap) => {
          cloudContracts.push(docSnap.data());
        });

        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_CONTRACTS_KEY);
          const localContracts = raw ? JSON.parse(raw) : [];
          const map = new Map<string, any>();
          localContracts.forEach((c: any) => map.set(c.id || c.contractNumber, c));
          cloudContracts.forEach((c: any) => map.set(c.id || c.contractNumber, c));
          const merged = Array.from(map.values());
          localStorage.setItem(LOCAL_STORAGE_CONTRACTS_KEY, JSON.stringify(merged));
          onUpdate(merged);
        } catch {
          onUpdate(cloudContracts);
        }
      },
      (err) => {
        if (onError) onError(err);
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_CONTRACTS_KEY);
          if (raw) onUpdate(JSON.parse(raw));
        } catch {
          // Ignore
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

/**
 * Full Database 1-Click Backup (JSON Snapshot)
 */
export async function exportFullDatabaseBackup(): Promise<string> {
  const backupPayload: Record<string, any> = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    company: "SIL INSURANCE CJSC",
    quotations: [],
    contracts: [],
    clients: [],
    localDraftRules: localStorage.getItem("sil-quotation-rules-draft-v3") || null,
  };

  try {
    // 1. Fetch Cloud Quotations
    const quotesSnap = await getDocs(collection(db, QUOTES_COLLECTION));
    quotesSnap.forEach((docSnap) => {
      backupPayload.quotations.push(docSnap.data());
    });
  } catch {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
    if (raw) backupPayload.quotations = JSON.parse(raw);
  }

  try {
    // 2. Fetch Cloud Contracts
    const contractsSnap = await getDocs(collection(db, CONTRACTS_COLLECTION));
    contractsSnap.forEach((docSnap) => {
      backupPayload.contracts.push(docSnap.data());
    });
  } catch {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONTRACTS_KEY);
    if (raw) backupPayload.contracts = JSON.parse(raw);
  }

  return JSON.stringify(backupPayload, null, 2);
}

/**
 * Restore Full Database from JSON Snapshot
 */
export async function restoreFullDatabaseBackup(jsonString: string): Promise<{ success: boolean; importedQuotes: number; importedContracts: number }> {
  try {
    const data = JSON.parse(jsonString);
    let importedQuotes = 0;
    let importedContracts = 0;

    if (Array.isArray(data.quotations)) {
      for (const quote of data.quotations) {
        if (quote && quote.id) {
          await syncQuotationToCloud(quote);
          importedQuotes++;
        }
      }
    }

    if (Array.isArray(data.contracts)) {
      for (const contract of data.contracts) {
        if (contract) {
          await syncContractToCloud(contract);
          importedContracts++;
        }
      }
    }

    if (data.localDraftRules) {
      localStorage.setItem("sil-quotation-rules-draft-v3", data.localDraftRules);
    }

    return { success: true, importedQuotes, importedContracts };
  } catch (err: any) {
    console.error("Restore failed:", err);
    throw new Error(`Տվյալների վերականգնումը ձախողվեց: ${err?.message || "Անվավեր ֆայլ"}`);
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface LineItem {
  id: string;
  type: "material" | "labor";
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  markupPercent: number;
  store?: string | null;
  sku?: string | null;
}

export interface Quote {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  jobAddress?: string;
  jobDescription: string;
  lineItems: LineItem[];
  photos: string[];
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface ContractorSettings {
  businessName: string;
  name: string;
  phone: string;
  email: string;
  license: string;
  zipCode: string;
  defaultMarkup: number;
}

export interface QuoteTotals {
  materialSubtotal: number;
  laborSubtotal: number;
  markupAmount: number;
  total: number;
}

interface QuoteContextType {
  quotes: Quote[];
  settings: ContractorSettings;
  isLoaded: boolean;
  createQuote: (data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    jobAddress?: string;
    jobDescription: string;
  }) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  addLineItem: (quoteId: string, item: Omit<LineItem, "id">) => void;
  updateLineItem: (quoteId: string, itemId: string, data: Partial<LineItem>) => void;
  deleteLineItem: (quoteId: string, itemId: string) => void;
  addPhoto: (quoteId: string, uri: string) => void;
  removePhoto: (quoteId: string, uri: string) => void;
  updateSettings: (data: Partial<ContractorSettings>) => void;
  calculateTotals: (items: LineItem[], defaultMarkup?: number) => QuoteTotals;
}

const defaultSettings: ContractorSettings = {
  businessName: "",
  name: "",
  phone: "",
  email: "",
  license: "",
  zipCode: "",
  defaultMarkup: 20,
};

const QUOTES_KEY = "@quickquote/quotes";
const SETTINGS_KEY = "@quickquote/settings";

const QuoteContext = createContext<QuoteContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [settings, setSettings] = useState<ContractorSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [quotesStr, settingsStr] = await Promise.all([
          AsyncStorage.getItem(QUOTES_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (quotesStr) setQuotes(JSON.parse(quotesStr));
        if (settingsStr) setSettings(JSON.parse(settingsStr));
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  const saveQuotes = useCallback(async (updated: Quote[]) => {
    try {
      await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const saveSettings = useCallback(async (updated: ContractorSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const createQuote = useCallback(
    (data: {
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      jobAddress?: string;
      jobDescription: string;
    }): Quote => {
      const quote: Quote = {
        id: generateId(),
        ...data,
        lineItems: [],
        photos: [],
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [quote, ...quotes];
      setQuotes(updated);
      saveQuotes(updated);
      return quote;
    },
    [quotes, saveQuotes]
  );

  const updateQuote = useCallback(
    (id: string, data: Partial<Quote>) => {
      const updated = quotes.map((q) =>
        q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q
      );
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const deleteQuote = useCallback(
    (id: string) => {
      const updated = quotes.filter((q) => q.id !== id);
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const addLineItem = useCallback(
    (quoteId: string, item: Omit<LineItem, "id">) => {
      const newItem: LineItem = { ...item, id: generateId() };
      const updated = quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              lineItems: [...q.lineItems, newItem],
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const updateLineItem = useCallback(
    (quoteId: string, itemId: string, data: Partial<LineItem>) => {
      const updated = quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              lineItems: q.lineItems.map((item) =>
                item.id === itemId ? { ...item, ...data } : item
              ),
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const deleteLineItem = useCallback(
    (quoteId: string, itemId: string) => {
      const updated = quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              lineItems: q.lineItems.filter((item) => item.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const addPhoto = useCallback(
    (quoteId: string, uri: string) => {
      const updated = quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              photos: [...(q.photos ?? []), uri],
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const removePhoto = useCallback(
    (quoteId: string, uri: string) => {
      const updated = quotes.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              photos: (q.photos ?? []).filter((p) => p !== uri),
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      setQuotes(updated);
      saveQuotes(updated);
    },
    [quotes, saveQuotes]
  );

  const updateSettings = useCallback(
    (data: Partial<ContractorSettings>) => {
      const updated = { ...settings, ...data };
      setSettings(updated);
      saveSettings(updated);
    },
    [settings, saveSettings]
  );

  const calculateTotals = useCallback(
    (items: LineItem[], defaultMarkup?: number): QuoteTotals => {
      const markup = defaultMarkup ?? settings.defaultMarkup;
      let materialBase = 0;
      let laborBase = 0;

      for (const item of items) {
        const base = item.quantity * item.unitPrice;
        if (item.type === "material") materialBase += base;
        else laborBase += base;
      }

      const markupAmount = (materialBase + laborBase) * (markup / 100);
      const total = materialBase + laborBase + markupAmount;

      return {
        materialSubtotal: materialBase,
        laborSubtotal: laborBase,
        markupAmount,
        total,
      };
    },
    [settings.defaultMarkup]
  );

  return (
    <QuoteContext.Provider
      value={{
        quotes,
        settings,
        isLoaded,
        createQuote,
        updateQuote,
        deleteQuote,
        addLineItem,
        updateLineItem,
        deleteLineItem,
        addPhoto,
        removePhoto,
        updateSettings,
        calculateTotals,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuotes(): QuoteContextType {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
}

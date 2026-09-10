import { useState, useEffect, useCallback } from "react";

const DB_NAME = "travela-images";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("store")) {
        db.createObjectStore("store");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readonly");
    const req = tx.objectStore("store").get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readwrite");
    tx.objectStore("store").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export type RegionName = "Miền Bắc" | "Miền Trung" | "Miền Nam";
export type RegionItem = { name: string; image: string };

const SLIDER_KEY = "slider_images";
const REGION_KEY = "region_images";

const DEFAULT_SLIDER = [
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=500&fit=crop",
];

const DEFAULT_REGIONS: Record<RegionName, RegionItem[]> = {
  "Miền Bắc": [
    { name: "Quảng Ninh", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop" },
    { name: "Hà Giang", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop" },
    { name: "Lào Cai", image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=400&fit=crop" },
    { name: "Ninh Bình", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop&q=80" },
    { name: "Yên Bái", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" },
    { name: "Sơn La", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop" },
    { name: "Cao Bằng", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop" },
    { name: "Hà Nội", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop&q=90" },
    { name: "Hải Phòng", image: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=400&fit=crop" },
  ],
  "Miền Trung": [
    { name: "Đà Nẵng", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop" },
    { name: "Nha Trang", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop" },
    { name: "Lâm Đồng", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=400&fit=crop" },
    { name: "Hội An", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop&q=85" },
    { name: "Huế", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop&q=75" },
    { name: "Phú Yên", image: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=400&fit=crop&q=85" },
    { name: "Quy Nhơn", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=85" },
    { name: "Phan Thiết", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&q=80" },
    { name: "Quảng Bình", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop&q=80" },
  ],
  "Miền Nam": [
    { name: "Bà Rịa - Vũng Tàu", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=90" },
    { name: "Tây Ninh", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop&q=80" },
    { name: "Tp. Hồ Chí Minh", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop&q=95" },
    { name: "Phước Hải", image: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=400&fit=crop&q=90" },
    { name: "Đồng Nai", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=400&fit=crop&q=85" },
    { name: "Côn Đảo", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&q=90" },
    { name: "Bình Phước", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop&q=85" },
  ],
};

// ── Slider hook ──
export function useSliderImages() {
  const [images, setImages] = useState<string[]>(DEFAULT_SLIDER);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    idbGet<string[]>(SLIDER_KEY).then((v) => {
      if (v && Array.isArray(v)) setImages(v);
      setReady(true);
    });
  }, []);

  const update = useCallback((next: string[]) => {
    setImages(next);
    idbSet(SLIDER_KEY, next);
  }, []);

  return { images, update, ready };
}

// ── Region hook ──
export function useRegionImages() {
  const [regions, setRegions] = useState<Record<RegionName, RegionItem[]>>(DEFAULT_REGIONS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    idbGet<Record<RegionName, RegionItem[]>>(REGION_KEY).then((v) => {
      if (v && typeof v === "object") setRegions(v);
      setReady(true);
    });
  }, []);

  const updateItem = useCallback((region: RegionName, index: number, imageUrl: string) => {
    setRegions((prev) => {
      const next = { ...prev, [region]: [...prev[region]] };
      next[region][index] = { ...next[region][index], image: imageUrl };
      idbSet(REGION_KEY, next);
      return next;
    });
  }, []);

  const addItem = useCallback((region: RegionName, name: string, imageUrl: string) => {
    setRegions((prev) => {
      const next = { ...prev, [region]: [...prev[region], { name, image: imageUrl }] };
      idbSet(REGION_KEY, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((region: RegionName, index: number) => {
    setRegions((prev) => {
      const next = { ...prev, [region]: prev[region].filter((_, i) => i !== index) };
      idbSet(REGION_KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setRegions(DEFAULT_REGIONS);
    idbSet(REGION_KEY, DEFAULT_REGIONS);
  }, []);

  return { regions, updateItem, addItem, removeItem, reset, ready };
}

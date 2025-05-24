/**
 * NOT: Bu dosya artık kullanılmıyor.
 * Uygulama RORK API'den Firebase'e geçiş yaptı.
 * Bu dosya yalnızca geriye dönük uyumluluk için korunuyor.
 * 
 * Yeni Firebase bağlantıları için lib/firebase.ts dosyasını kullanın.
 */

// Boş API istemcisi tanımları (hataları önlemek için)
export const trpc = {
  // @ts-ignore
  createClient: () => ({}),
  // @ts-ignore
  useQuery: () => ({}),
  // @ts-ignore
  useMutation: () => ({})
};

export const trpcClient = {};
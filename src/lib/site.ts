/** Канонический адрес сайта без завершающего слэша. Пустое или отсутствующее значение env даёт боевой домен. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://madelarme.kz").replace(/\/+$/, "");

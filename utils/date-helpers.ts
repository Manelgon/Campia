import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha de forma segura.
 * Si la fecha es nula, indefinida o inválida, devuelve un valor de respaldo (por defecto "-").
 * 
 * @param date - La fecha a formatear (Date, string, number o null/undefined)
 * @param formatStr - El string de formato para date-fns
 * @param fallback - El valor a devolver si la fecha no es válida (por defecto "-")
 * @returns La fecha formateada o el fallback
 */
export function safeFormat(
    date: Date | string | number | null | undefined,
    formatStr: string,
    fallback: string = "-"
): string {
    if (!date) return fallback;

    const d = new Date(date);
    if (!isValid(d)) return fallback;

    try {
        return format(d, formatStr, { locale: es });
    } catch (error) {
        console.error("Error formatting date:", date, error);
        return fallback;
    }
}

/**
 * Parsea una fecha de forma segura a objeto Date.
 * Devuelve null si la entrada no es válida.
 */
export function safeDate(date: Date | string | number | null | undefined): Date | null {
    if (!date) return null;
    const d = new Date(date);
    return isValid(d) ? d : null;
}

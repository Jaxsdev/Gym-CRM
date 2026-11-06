/**
 * Utilidades para procesamiento y formateo de mensajes de WhatsApp
 * y generación de enlaces directos a wa.me
 */

/**
 * Limpia y formatea un número telefónico para la API de WhatsApp en Perú (código 51).
 * @param {string} phone 
 * @returns {string} Número limpio con prefijo de país (ej. 51999888777)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Remover caracteres no numéricos
  const digits = phone.toString().replace(/\D/g, '');
  
  // Si ya tiene el 51 y tiene 11 dígitos
  if (digits.startsWith('51') && digits.length === 11) {
    return digits;
  }
  
  // Si es un celular peruano estándar de 9 dígitos (inicia en 9)
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }
  
  // Si tiene 9 dígitos cualquiera
  if (digits.length === 9) {
    return `51${digits}`;
  }

  return digits;
}

/**
 * Reemplaza las variables dinámicas de una plantilla con los datos provistos.
 * Variables soportadas:
 * - {nombre}
 * - {dni}
 * - {plan}
 * - {precio}
 * - {servicios}
 * - {fecha_inicio}
 * - {fecha_fin}
 * - {dias_restantes}
 * - {dias_sin_asistir}
 * - {promo_nombre}
 * - {promo_precio}
 * - {gym_nombre}
 * 
 * @param {string} templateTexto 
 * @param {object} variables 
 * @returns {string} Mensaje procesado
 */
export function parseWhatsAppTemplate(templateTexto, variables = {}) {
  if (!templateTexto) return '';

  let resultado = templateTexto;

  // Formatear servicios si viene como array
  let serviciosTexto = '';
  if (Array.isArray(variables.servicios)) {
    serviciosTexto = variables.servicios.map(s => `\n• ${s}`).join('');
  } else if (typeof variables.servicios === 'string') {
    serviciosTexto = variables.servicios;
  }

  const replacements = {
    '{nombre}': variables.nombre || variables.nombre_completo || 'Estimada socia',
    '{dni}': variables.dni || '',
    '{plan}': variables.plan || variables.plan_nombre || 'Membresía',
    '{precio}': variables.precio ? `S/ ${Number(variables.precio).toFixed(2)}` : '',
    '{servicios}': serviciosTexto || 'Acceso a instalaciones y máquinas',
    '{fecha_inicio}': variables.fecha_inicio || '',
    '{fecha_fin}': variables.fecha_fin || '',
    '{dias_restantes}': variables.dias_restantes !== undefined ? variables.dias_restantes : '0',
    '{dias_sin_asistir}': variables.dias_sin_asistir !== undefined ? variables.dias_sin_asistir : '3',
    '{promo_nombre}': variables.promo_nombre || variables.nombre_promocion || 'Promoción Especial',
    '{promo_precio}': variables.promo_precio ? `${Number(variables.promo_precio).toFixed(2)}` : '50.00',
    '{gym_nombre}': variables.gym_nombre || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GYM_NAME) || (typeof process !== 'undefined' && process.env?.VITE_GYM_NAME) || 'VitalFit Gym',
  };

  for (const [key, value] of Object.entries(replacements)) {
    resultado = resultado.split(key).join(value);
  }

  return resultado;
}

/**
 * Genera el enlace directo a WhatsApp (wa.me)
 * @param {string} phone 
 * @param {string} message 
 * @returns {string} URL formateada
 */
export function generateWhatsAppLink(phone, message) {
  const cleanPhone = formatPhoneNumber(phone);
  const encodedText = encodeURIComponent(message || '');
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Dispara la apertura de WhatsApp en una pestaña nueva
 * @param {string} phone 
 * @param {string} message 
 */
export function openWhatsApp(phone, message) {
  const url = generateWhatsAppLink(phone, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Copia el mensaje al portapapeles del navegador
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback para entornos donde el clipboard API no esté disponible
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}


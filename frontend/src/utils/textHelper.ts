const CONECTORES_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'san']);

export const capitalizarNombrePropio = (texto: string): string => {
  if (!texto) return '';

  return texto
    .trim()
    .toLocaleLowerCase('es')
    .split(/\s+/)
    .map((palabra, index) => {
      if (index > 0 && CONECTORES_MENORES.has(palabra)) {
        return palabra;
      }
      return palabra.charAt(0).toLocaleUpperCase('es') + palabra.slice(1);
    })
    .join(' ');
};

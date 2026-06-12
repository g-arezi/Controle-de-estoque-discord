export function formatMoney(value: number | string | { toString(): string }): string {
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    numValue = parseFloat(value.toString());
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function formatMoneyNoSymbol(value: number | string | { toString(): string }): string {
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    numValue = parseFloat(value.toString());
  }
  
  return numValue.toFixed(2).replace('.', ',');
}

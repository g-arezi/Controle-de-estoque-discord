"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMoney = formatMoney;
exports.formatMoneyNoSymbol = formatMoneyNoSymbol;
function formatMoney(value) {
    let numValue;
    if (typeof value === 'number') {
        numValue = value;
    }
    else if (typeof value === 'string') {
        numValue = parseFloat(value);
    }
    else {
        numValue = parseFloat(value.toString());
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
}
function formatMoneyNoSymbol(value) {
    let numValue;
    if (typeof value === 'number') {
        numValue = value;
    }
    else if (typeof value === 'string') {
        numValue = parseFloat(value);
    }
    else {
        numValue = parseFloat(value.toString());
    }
    return numValue.toFixed(2).replace('.', ',');
}
//# sourceMappingURL=money.js.map
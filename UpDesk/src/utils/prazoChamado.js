function adicionarDiasUteis(dataInicial, dias) {
  const prazo = new Date(dataInicial);
  while (dias > 0) {
    prazo.setDate(prazo.getDate() + 1);
    if (prazo.getDay() !== 0 && prazo.getDay() !== 6) {
      dias -= 1;
    }
  }
  prazo.setHours(23, 59, 59, 999);
  return prazo;
}

function calcularPrazo(prioridade, dataInicial = new Date()) {
  const diasPorPrioridade = { alta: 1, media: 3, baixa: 5 };
  if (!Object.prototype.hasOwnProperty.call(diasPorPrioridade, prioridade)) {
    throw new Error('Prioridade inválida para cálculo de prazo.');
  }
  return adicionarDiasUteis(dataInicial, diasPorPrioridade[prioridade]);
}

module.exports = { calcularPrazo };

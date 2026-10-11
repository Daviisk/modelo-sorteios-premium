export const errorCatalog = {
  "400": { title: "Não conseguimos entender a solicitação", message: "Confira os dados enviados e tente novamente." },
  "401": { title: "Sua sessão terminou", message: "Entre novamente para continuar com segurança." },
  "403": { title: "Este acesso é protegido", message: "Para consultar um pedido, use o navegador em que ele foi criado. O administrador também pode ajudar." },
  "404": { title: "Página não encontrada", message: "O endereço pode ter mudado ou a rifa não está disponível." },
  "405": { title: "Esta ação não está disponível", message: "Use os botões da página para realizar a operação desejada." },
  "408": { title: "A solicitação demorou demais", message: "Confira sua conexão e seu pedido antes de repetir a operação." },
  "413": { title: "Os dados enviados são muito grandes", message: "Reduza o tamanho dos dados ou da imagem e tente novamente." },
  "415": { title: "Formato não aceito", message: "Confira o tipo do arquivo ou os dados enviados e tente novamente." },
  "431": { title: "Precisamos renovar o acesso", message: "Há dados de navegação demais nesta solicitação. Fale com o organizador antes de apagar cookies de pedidos que deseja acompanhar." },
  "409": { title: "Alguns números ficaram indisponíveis", message: "Outra pessoa reservou esses números. Volte à rifa e escolha entre os disponíveis." },
  "410": { title: "A reserva expirou", message: "Confira o pagamento com o organizador antes de criar outro pedido. Se você ainda não pagou, escolha os números novamente." },
  "422": { title: "Confira seus dados", message: "Preencha nome completo, celular com DDD e um e-mail válido para gerar o PIX." },
  "429": { title: "Vamos aguardar um instante", message: "Houve muitas tentativas em pouco tempo. Aguarde um minuto antes de tentar novamente." },
  "500": { title: "Algo não saiu como esperado", message: "Não conseguimos concluir esta ação. Se tentou pagar, confira seu pedido antes de repetir a compra." },
  "502": { title: "O pagamento está indisponível", message: "Não recebemos uma resposta válida do serviço de pagamento. Confira seu pedido antes de tentar novamente." },
  "503": { title: "Serviço temporariamente indisponível", message: "Estamos com uma dificuldade temporária. Aguarde e tente novamente; se já pagou, fale com o organizador." },
  "504": { title: "A resposta demorou mais que o esperado", message: "Confira seu pedido antes de repetir a operação. A cobrança pode ter sido criada." },
  conexao: { title: "Não conseguimos conectar", message: "Confira sua conexão e tente novamente. Se estava gerando o PIX, consulte seu pedido antes de repetir." },
  pagamento: { title: "Não foi possível gerar o PIX", message: "A cobrança não pôde ser concluída. Fale com o organizador e confira se já existe um pedido antes de repetir." },
} as const;
export type ErrorKind = keyof typeof errorCatalog;
export function isErrorKind(value: string): value is ErrorKind { return Object.prototype.hasOwnProperty.call(errorCatalog, value); }
export function safeCheckoutError(error: unknown): { code: ErrorKind; status: number; message: string } {
  const message = error instanceof Error ? error.message : "";
  const kind: ErrorKind = message === "NUMBERS_UNAVAILABLE" ? "409" :
    message === "Rifa não encontrada ou não está ativa." ? "404" :
    message === "Número inválido para esta rifa." || message === "Selecione ao menos um número." ? "422" :
    /Mercado Pago|PIX|Gateway|Configure|webhook|ORDER_ACCESS_UNAVAILABLE/.test(message) ? "pagamento" :
    error instanceof Error && error.name === "TimeoutError" ? "504" : "500";
  return { code: kind, status: kind === "pagamento" ? 502 : Number(kind), message: errorCatalog[kind].message };
}


import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Política de cookies" };
export default function CookiesPage() { return <LegalPage title="Política de cookies">
  <p>Utilizamos cookies necessários para proteger acessos. O Meta Pixel, quando configurado pelo organizador, é uma ferramenta opcional de publicidade, ativada somente após sua autorização. Ele envia visitas às páginas públicas para a Meta, que pode processar dados técnicos, como IP, navegador e identificadores, inclusive em outros países. Não enviamos nome, telefone, números comprados ou informações de pagamento por esta integração.</p>
  <p>Também utilizamos o Google Tag Manager, quando configurado pelo organizador, para gerenciar tags de medição e publicidade. As integrações opcionais precisam ser configuradas pelo organizador. O responsável deve configurar as tags opcionais no Google Tag Manager para respeitar a preferência de cookies antes de ativá-las.</p>
  <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Cookie</th><th className="p-2">Finalidade</th><th className="p-2">Duração</th></tr></thead><tbody>
    <tr><td className="p-2">rifa_admin_session</td><td className="p-2">Autenticar o administrador</td><td className="p-2">7 dias por padrão; pode ser ajustado pelo responsável</td></tr>
    <tr><td className="p-2">rifa_order_*</td><td className="p-2">Permitir a consulta do pedido no navegador que o criou</td><td className="p-2">30 dias</td></tr>
  <tr><td className="p-2">_fbp / _fbc</td><td className="p-2">Publicidade e medição de anúncios da Meta, mediante consentimento</td><td className="p-2">Até 90 dias</td></tr></tbody></table></div>
  <p>Esses cookies são HttpOnly, usam SameSite e têm o atributo Secure em produção. Você pode excluí-los nas configurações do navegador, mas perderá a sessão e o acesso direto aos pedidos. Nesse caso, solicite atendimento ao organizador.</p>
  <p>Os serviços de hospedagem e pagamento podem processar registros técnicos próprios. Você pode aceitar, recusar ou retirar sua autorização pelo botão Preferências de cookies. A escolha é guardada neste navegador. Recusar não impede participar do sorteio.</p>
</LegalPage>; }


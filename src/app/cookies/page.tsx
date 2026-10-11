import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Política de cookies" };
export default function CookiesPage() { return <LegalPage title="Política de cookies">
  <p>Utilizamos apenas cookies necessários para autenticação administrativa e proteção do acesso aos pedidos. Não utilizamos cookies de publicidade ou ferramentas de rastreamento de visitas.</p>
  <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Cookie</th><th className="p-2">Finalidade</th><th className="p-2">Duração</th></tr></thead><tbody>
    <tr><td className="p-2">rifa_admin_session</td><td className="p-2">Autenticar o administrador</td><td className="p-2">7 dias por padrão; pode ser ajustado pelo responsável</td></tr>
    <tr><td className="p-2">rifa_order_*</td><td className="p-2">Permitir a consulta do pedido no navegador que o criou</td><td className="p-2">30 dias</td></tr>
</tbody></table></div>
  <p>Esses cookies são HttpOnly, usam SameSite e têm o atributo Secure em produção. Você pode excluí-los nas configurações do navegador, mas perderá a sessão e o acesso direto aos pedidos. Nesse caso, solicite atendimento ao organizador.</p>
  <p>Os serviços de hospedagem e pagamento podem processar registros técnicos necessários para oferecer seus serviços.</p>
</LegalPage>; }


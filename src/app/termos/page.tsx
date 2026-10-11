import Link from "next/link";
import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Termos de uso" };
export default function TermsPage() { return <LegalPage title="Termos de uso">
  <p>Antes de participar, leia o regulamento específico da rifa, a descrição do prêmio, preço, critérios de participação, datas e contatos do organizador. O organizador responde pelas informações, entrega e autorizações aplicáveis à sua atividade.</p>
  <p>A seleção de números gera uma reserva temporária. A participação é confirmada após a aprovação do pagamento pelo Mercado Pago. O tempo de reserva e o vencimento do PIX aparecem no checkout. Se houver pagamento após perda da reserva, procure o organizador para análise e solução; o sistema não transfere números de outro participante.</p>
  <p>Use informações corretas de contato. Não compartilhe credenciais, cookies ou dados de outros participantes. A consulta de pedidos depende do navegador autorizado ou do atendimento do administrador.</p>
  <p>Cancelamentos, devoluções, sorteio e entrega devem seguir o regulamento e a legislação aplicável. Estes termos não afastam direitos previstos em lei nem substituem autorizações necessárias à realização da rifa.</p>
  <Link className="underline" href="/privacidade">Como tratamos seus dados</Link>
</LegalPage>; }


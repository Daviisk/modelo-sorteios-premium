import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { getPrivacyContact, PRIVACY_VERSION } from "@/lib/privacy";
export const dynamic = "force-dynamic";
export const metadata = { title: "Política de Privacidade" };
export default async function PrivacyPage() {
  const contact = await getPrivacyContact();
  return <LegalPage title="Política de Privacidade">
    <p className="text-sm text-gray-500">Versão {PRIVACY_VERSION}</p>
    <section><h2 className="font-bold mb-2">Responsável pelos dados</h2><p>Plataforma: {contact.platform}. Controlador: {contact.controller}.</p>
      <p>O canal para assuntos de privacidade está disponível na <Link className="underline" href="/privacidade/direitos">página de direitos e contato</Link>.</p></section>
    <section><h2 className="font-bold mb-2">Dados, finalidades e bases legais</h2>
      <p>Usamos nome completo para identificar a participação e entrega do prêmio, celular para contato sobre o pedido e e-mail para criar o PIX no Mercado Pago. O checkout não solicita CPF. Registros antigos podem conter CPF, sujeito à revisão de necessidade pelo responsável.</p>
      <p>Também registramos números escolhidos, valor, datas, identificação e status do pagamento para executar o pedido, confirmar a participação e prestar atendimento. O tratamento necessário ao pedido está relacionado à execução de contrato ou de procedimentos preliminares solicitados pelo titular (art. 7º, V, da LGPD). Registros exigidos por lei seguem a base de obrigação legal (art. 7º, II); a base e o prazo aplicáveis devem ser documentados pelo controlador.</p>
      <p>Cookies de acesso e registros técnicos são usados para segurança. Eventual uso de legítimo interesse exige avaliação de necessidade e dos direitos do titular pelo controlador. Não há inscrição automática em publicidade ou autorização de marketing ao comprar.</p></section>
    <section><h2 className="font-bold mb-2">Compartilhamento e infraestrutura</h2>
      <p>O e-mail, valor e referência do pedido são enviados ao Mercado Pago para processar o PIX. Nome e celular ficam na plataforma para atendimento. A aplicação é hospedada na Vercel e usa o banco PostgreSQL configurado pelo responsável. O acesso administrativo é restrito à organização responsável.</p>
      <p>Os fornecedores podem tratar dados em diferentes países. O controlador deve verificar os contratos, regiões de hospedagem e mecanismos de transferência internacional aplicáveis antes de concluir a adequação. Não comercializamos dados pelo fluxo implementado.</p></section>
    <section><h2 className="font-bold mb-2">Retenção, exclusão e segurança</h2>
      <p>A expiração de uma reserva libera os números e não elimina automaticamente o histórico. Dados não devem ser mantidos por tempo indeterminado sem justificativa: o responsável deve definir e documentar os prazos por finalidade, obrigações legais e exercício de direitos.</p>
      <p>Pedidos de eliminação são analisados após verificar a identidade, considerando registros que devam ser conservados. O administrador pode exportar dados e remover identificadores diretos quando cabível. A remoção desses identificadores não garante, por si só, anonimização irreversível de todo o histórico. Cópias de segurança, documentos exportados e registros dos fornecedores também precisam ser avaliados.</p>
      <p>A plataforma protege o acesso aos pedidos com cookies de autorização, usa conexão HTTPS em produção e restringe dados administrativos. Incidentes precisam ser avaliados e comunicados aos titulares e à ANPD quando exigido pela legislação.</p></section>
    <section><h2 className="font-bold mb-2">Seus direitos</h2>
      <p>Você pode solicitar confirmação e acesso ao tratamento, correção, informações sobre compartilhamento, portabilidade quando aplicável, revisão de decisões automatizadas e eliminação, bloqueio ou anonimização nas hipóteses legais. Se houver tratamento baseado em consentimento, poderá revogá-lo. Não há decisão automatizada de perfilamento no checkout; o processamento do pagamento é realizado pelo Mercado Pago.</p>
      <Link className="underline" href="/privacidade/direitos">Como exercer seus direitos</Link></section>
    <section><h2 className="font-bold mb-2">Cookies e menores de idade</h2><p>O fluxo atual usa somente cookies necessários para sessão administrativa e acesso aos pedidos; consulte a <Link className="underline" href="/cookies">política de cookies</Link>. A plataforma não é dirigida a crianças. Não envie dados de crianças; questões sobre dados de menores devem ser avaliadas pelo responsável conforme o art. 14 da LGPD.</p></section>
    <p className="text-sm">Referências: <a className="underline" href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares" rel="noreferrer" target="_blank">Direitos dos titulares — ANPD</a> e <a className="underline" href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" rel="noreferrer" target="_blank">Lei nº 13.709/2018</a>.</p>
  </LegalPage>;
}


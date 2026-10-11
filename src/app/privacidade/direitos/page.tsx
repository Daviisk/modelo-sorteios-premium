import LegalPage from "@/components/LegalPage";
import { getPrivacyContact } from "@/lib/privacy";
export const dynamic = "force-dynamic";
export const metadata = { title: "Seus direitos e contato" };
export default async function RightsPage() {
  const contact = await getPrivacyContact();
  const text = "Olá, quero exercer um direito sobre meus dados pessoais na plataforma. Direito solicitado: [acesso, correção, eliminação ou outro]. Referência do pedido, se disponível: [preencher].";
  return <LegalPage title="Seus direitos e contato">
    <p>Responsável: {contact.controller}.</p>
    <p>Informe o direito que deseja exercer e, se disponível, a referência do pedido. Para sua segurança, a equipe precisa verificar sua identidade antes de entregar, alterar ou remover dados. Não envie senha, token de pagamento ou cópia de documento na primeira mensagem.</p>
    <div className="flex flex-wrap gap-3">
      {contact.email && <a className="btn-primary" href={`mailto:${contact.email}?subject=${encodeURIComponent("Solicitação de privacidade")}&body=${encodeURIComponent(text)}`}>Solicitar por e-mail</a>}
      {contact.phone && <a className="border rounded-xl px-4 py-3" rel="noreferrer" target="_blank" href={`https://wa.me/${contact.phone.length <= 11 ? "55" : ""}${contact.phone}?text=${encodeURIComponent(text)}`}>Falar pelo WhatsApp</a>}
    </div>
    {contact.email && <p>E-mail: {contact.email}</p>}
    {!contact.email && !contact.phone && <p className="p-4 rounded-xl bg-amber-50">O canal de atendimento ainda não foi preenchido pelo responsável. Use o contato do organizador informado no regulamento da rifa. O administrador precisa cadastrar um e-mail ou WhatsApp em Configurações.</p>}
    <p>Pedidos de eliminação podem ter limites quando a conservação de registros é exigida por lei ou necessária ao exercício de direitos. A equipe deve informar a justificativa e atender nos prazos legais aplicáveis.</p>
    <a className="underline" href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados" target="_blank" rel="noreferrer">Orientações e petições de titulares na ANPD</a>
  </LegalPage>;
}


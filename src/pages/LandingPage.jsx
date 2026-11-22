import { useRef, useState } from "react";
import {
  MdArrowForward,
  MdCheckCircle,
  MdDashboard,
  MdEmail,
  MdExpandLess,
  MdExpandMore,
  MdGroups,
  MdInventory,
  MdLocationOn,
  MdLogin,
  MdNotifications,
  MdPhone,
  MdQrCode2,
  MdRestaurantMenu,
  MdSecurity,
  MdSend,
  MdSpeed,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  StatusBadge,
  Textarea,
} from "../components/ui";

const faqData = [
  {
    question: "O que é o FastCooking?",
    answer:
      "O FastCooking é uma plataforma web integrada de gestão de pedidos para restaurantes. Ele substitui comandas em papel por um sistema digital que conecta clientes, garçons, cozinha e gerente em tempo real, aumentando a agilidade, reduzindo erros e melhorando a experiência de todos.",
  },
  {
    question: "Como funciona o autoatendimento pelo QR Code?",
    answer:
      "Cada mesa possui um QR Code exclusivo. Ao escaneá-lo com o celular, o cliente abre a mesa automaticamente e inicia uma sessão de atendimento. A partir daí, ele pode fazer pedidos, acompanhar o status de preparo em tempo real e solicitar o fechamento da conta — tudo sem precisar chamar o garçom.",
  },
  {
    question: "O cliente precisa criar uma conta ou fazer login?",
    answer:
      "Não! O módulo de autoatendimento do cliente não exige nenhum cadastro ou login. Basta escanear o QR Code da mesa para começar a usar. As ações ficam restritas à sessão daquela mesa específica.",
  },
  {
    question: "Como os garçons recebem os pedidos prontos?",
    answer:
      'Quando a cozinha marca um item como "pronto" no KDS (Kitchen Display System), todos os garçons em serviço recebem uma notificação sonora e visual em seus dispositivos móveis instantaneamente. Qualquer garçom que esteja disponível pode assumir a entrega, garantindo agilidade e distribuição equilibrada do trabalho.',
  },
  {
    question: "O sistema funciona apenas para restaurantes de que porte?",
    answer:
      "O FastCooking foi projetado para atender estabelecimentos gastronômicos de pequeno e médio porte, com foco em restaurantes que fazem atendimento presencial e possuem produção própria. É ideal para quem quer modernizar o processo de pedidos sem grandes investimentos em infraestrutura.",
  },
  {
    question: "Qual é o custo para aderir ao FastCooking?",
    answer:
      "Os planos e condições comerciais são personalizados de acordo com o perfil do seu estabelecimento. Preencha o formulário de contato nesta página e nossa equipe comercial entrará em contato com uma proposta sob medida para você.",
  },
  {
    question: "O gerente consegue controlar o estoque pelo sistema?",
    answer:
      "Sim. O módulo administrativo permite ao gerente realizar a gestão de cardápio, controle de estoque por prato, cadastro de funcionários e acompanhamento operacional de forma simples e direta.",
  },
  {
    question: "O sistema precisa de internet para funcionar?",
    answer:
      "Sim, o FastCooking é uma aplicação web e necessita de conexão com a internet. Recomendamos uma rede Wi-Fi estável no estabelecimento para garantir o funcionamento em tempo real entre todos os módulos.",
  },
];

const features = [
  {
    icon: MdQrCode2,
    title: "Autoatendimento via QR Code",
    description:
      "O cliente escaneia o QR Code da mesa, faz pedidos e acompanha o preparo em tempo real — sem precisar chamar o garçom.",
  },
  {
    icon: MdNotifications,
    title: "Notificações Inteligentes",
    description:
      "Garçons recebem alertas sonoros e visuais em tempo real quando um pedido fica pronto, garantindo entregas rápidas.",
  },
  {
    icon: MdRestaurantMenu,
    title: "KDS — Kitchen Display System",
    description:
      "Monitor de pedidos para a cozinha com priorização dinâmica, agrupamento por categoria e eliminação da comunicação verbal.",
  },
  {
    icon: MdDashboard,
    title: "Painel Administrativo",
    description:
      "Gestão completa do cardápio, controle de estoque por prato, cadastro de funcionários e controle de acesso.",
  },
  {
    icon: MdGroups,
    title: "Atendimento Compartilhado",
    description:
      "Qualquer garçom disponível pode atender qualquer mesa. Sem zoneamento fixo, o trabalho é distribuído de forma equilibrada.",
  },
  {
    icon: MdInventory,
    title: "Controle de Estoque",
    description:
      "Gerenciamento de estoque por prato com definição e ajuste pelo gerente, evitando vendas de itens indisponíveis.",
  },
];

const steps = [
  {
    number: "01",
    title: "Escaneia o QR Code",
    description:
      "O cliente aponta a câmera para o QR Code da mesa. A mesa é aberta automaticamente e uma sessão de atendimento é iniciada.",
  },
  {
    number: "02",
    title: "Faz o Pedido",
    description:
      "Pelo celular, o cliente navega pelo cardápio e confirma seus itens. O garçom também pode adicionar itens à mesma comanda.",
  },
  {
    number: "03",
    title: "Cozinha Produz",
    description:
      "O pedido chega ao KDS da cozinha com prioridade dinâmica. A equipe prepara os pratos na ordem mais eficiente.",
  },
  {
    number: "04",
    title: "Entrega Instantânea",
    description:
      "Quando o prato fica pronto, todos os garçons são notificados. O primeiro disponível assume e entrega à mesa.",
  },
];

const benefits = [
  {
    icon: MdSpeed,
    title: "Mais Agilidade",
    description: "Redução do tempo entre pedido e entrega",
  },
  {
    icon: MdCheckCircle,
    title: "Menos Erros",
    description: "Eliminação de comandas em papel",
  },
  {
    icon: MdGroups,
    title: "Equipe Equilibrada",
    description: "Distribuição justa de trabalho",
  },
  {
    icon: MdSecurity,
    title: "Controle Total",
    description: "Gestão e rastreabilidade completa",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-3 text-left cursor-pointer group"
      >
        <span className="text-sm sm:text-base font-bold text-gray-800 group-hover:text-brand transition-colors">
          {item.question}
        </span>
        {isOpen ? (
          <MdExpandLess className="text-brand text-2xl shrink-0 ml-4" />
        ) : (
          <MdExpandMore className="text-gray-400 group-hover:text-brand text-2xl shrink-0 ml-4" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 px-3 text-xs sm:text-sm text-gray-600 leading-relaxed animate-fade-in">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    nomeRestaurante: "",
    nomeResponsavel: "",
    email: "",
    telefone: "",
    cidade: "",
    mensagem: "",
  });
  const [formEnviado, setFormEnviado] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const subject = encodeURIComponent(
      `Novo restaurante interessado: ${formData.nomeRestaurante}`
    );
    const body = encodeURIComponent(
      `Nome do Restaurante: ${formData.nomeRestaurante}\n` +
        `Nome do Responsável: ${formData.nomeResponsavel}\n` +
        `E-mail: ${formData.email}\n` +
        `Telefone: ${formData.telefone}\n` +
        `Cidade: ${formData.cidade}\n\n` +
        `Mensagem:\n${formData.mensagem}`
    );

    window.location.href = `mailto:fastcooking@comercial.com.br?subject=${subject}&body=${body}`;
    setFormEnviado(true);
    setTimeout(() => setFormEnviado(false), 5000);
  };

  return (
    <div className="min-h-screen bg-surface text-gray-800">
      {/* Header Sticky padrão Autoatendimento */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <a href="#hero" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/fast cooking logo.svg"
              alt="Fast Cooking"
              className="h-9 w-auto"
            />
            <span className="font-black text-base sm:text-lg text-brand tracking-tight">
              Fast Cooking
            </span>
          </a>

          {/* Navegação em Pills (mesmo estilo do FiltroCategorias) */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { href: "#features", label: "Funcionalidades" },
              { href: "#how-it-works", label: "Como Funciona" },
              { href: "#contact", label: "Parceria" },
              { href: "#faq", label: "FAQ" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-700 hover:bg-brand-soft hover:text-brand border border-gray-200 transition-colors shadow-xs"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="soft"
              size="sm"
              onClick={scrollToForm}
              className="hidden xs:inline-flex"
            >
              Quero Aderir
            </Button>
            <Button
              size="sm"
              icon={MdLogin}
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Badge tone="gold" icon={MdSpeed} className="px-3.5 py-1 text-xs">
                Gestão inteligente para restaurantes
              </Badge>

              <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Transforme a operação do seu{" "}
                <span className="text-brand">restaurante</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-lg">
                O FastCooking digitaliza e automatiza todo o processo de gestão
                de pedidos — do QR Code na mesa até a entrega do prato —
                eliminando comandas em papel, reduzindo erros e elevando a
                experiência do cliente.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  icon={MdArrowForward}
                  onClick={scrollToForm}
                >
                  Quero Aderir
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-gray-700 hover:bg-brand-soft hover:text-brand border border-gray-200 shadow-xs transition-colors"
                >
                  Saiba Mais
                </a>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <Card padding="p-3.5" className="text-center">
                  <p className="text-xl sm:text-2xl font-black text-brand">4</p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Módulos Integrados
                  </p>
                </Card>
                <Card padding="p-3.5" className="text-center">
                  <p className="text-xl sm:text-2xl font-black text-gold">
                    100%
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Digital
                  </p>
                </Card>
                <Card padding="p-3.5" className="text-center">
                  <p className="text-lg sm:text-xl font-black text-brand">
                    Tempo Real
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Sincronização
                  </p>
                </Card>
              </div>
            </div>

            {/* Hero Preview Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-md space-y-3">
                <Card padding="p-6" className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-brand-soft text-brand rounded-2xl flex items-center justify-center">
                        <MdRestaurantMenu size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          Pedido #142
                        </p>
                        <p className="text-xs text-gray-500">
                          Mesa 7 • Há 3 min
                        </p>
                      </div>
                    </div>
                    <Badge tone="gold">Autoatendimento</Badge>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-surface rounded-xl px-3.5 py-2.5 border border-gray-200/80">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">
                        1x Filé Mignon à Grelha
                      </span>
                      <StatusBadge status="Pronto" />
                    </div>
                    <div className="flex items-center justify-between bg-surface rounded-xl px-3.5 py-2.5 border border-gray-200/80">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">
                        1x Risoto de Camarão
                      </span>
                      <StatusBadge status="Em preparo" />
                    </div>
                    <div className="flex items-center justify-between bg-surface rounded-xl px-3.5 py-2.5 border border-gray-200/80">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">
                        2x Suco Natural
                      </span>
                      <StatusBadge status="Pendente" />
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Card padding="p-3.5" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-amber-50 text-gold rounded-xl flex items-center justify-center shrink-0">
                      <MdNotifications size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        Alerta ao Garçom
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        Prato liberado no KDS
                      </p>
                    </div>
                  </Card>

                  <Card padding="p-3.5" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-brand-soft text-brand rounded-xl flex items-center justify-center shrink-0">
                      <MdQrCode2 size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        QR Code na Mesa
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        Sem login necessário
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge tone="brand">Funcionalidades</Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Tudo que seu restaurante precisa em um só lugar
            </h2>
            <p className="mt-2 text-gray-600 text-xs sm:text-sm">
              Quatro módulos integrados — Cliente, Garçom, Cozinha e
              Administrativo — para digitalizar toda a operação.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} hover padding="p-6">
                  <div className="w-12 h-12 bg-brand-soft text-brand rounded-2xl flex items-center justify-center mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {f.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge tone="gold">Como Funciona</Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Simples, rápido e integrado
            </h2>
            <p className="mt-2 text-gray-600 text-xs sm:text-sm">
              Do QR Code na mesa até a entrega do prato, tudo acontece em tempo
              real.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <Card key={s.number} hover className="text-center">
                <div className="w-12 h-12 mx-auto bg-brand-soft text-brand rounded-2xl flex items-center justify-center mb-4 font-black text-base">
                  {s.number}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  {s.title}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {s.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand rounded-3xl p-6 sm:p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title}>
                  <Icon className="text-3xl mx-auto mb-2 text-amber-300" />
                  <h3 className="text-base font-bold mb-0.5">{b.title}</h3>
                  <p className="text-xs text-white/80">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" ref={formRef} className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <div>
                <Badge tone="gold">Seja um Parceiro</Badge>
                <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Leve o FastCooking para o seu restaurante
                </h2>
                <p className="mt-2 text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Preencha o formulário ao lado e nossa equipe comercial entrará
                  em contato com uma proposta personalizada para o seu
                  estabelecimento.
                </p>
              </div>

              <div className="space-y-3">
                <Card padding="p-4" className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-brand-soft text-brand rounded-xl flex items-center justify-center shrink-0">
                    <MdEmail size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">E-mail Comercial</p>
                    <p className="text-sm font-bold text-gray-800">
                      fastcooking@comercial.com.br
                    </p>
                  </div>
                </Card>

                <Card padding="p-4" className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-brand-soft text-brand rounded-xl flex items-center justify-center shrink-0">
                    <MdPhone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-sm font-bold text-gray-800">
                      (11) 9 0000-0000
                    </p>
                  </div>
                </Card>

                <Card padding="p-4" className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-brand-soft text-brand rounded-xl flex items-center justify-center shrink-0">
                    <MdLocationOn size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Localização</p>
                    <p className="text-sm font-bold text-gray-800">
                      Barueri, SP — Brasil
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            <Card padding="p-6 sm:p-8">
              {formEnviado ? (
                <div className="text-center py-10 space-y-3">
                  <MdCheckCircle className="text-5xl text-emerald-600 mx-auto" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Formulário Enviado!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Em breve nossa equipe entrará em contato com você.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Formulário de Adesão
                  </h3>

                  <Field label="Nome do Restaurante" required>
                    <Input
                      type="text"
                      name="nomeRestaurante"
                      value={formData.nomeRestaurante}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: Restaurante Sabor Caseiro"
                    />
                  </Field>

                  <Field label="Nome do Responsável" required>
                    <Input
                      type="text"
                      name="nomeResponsavel"
                      value={formData.nomeResponsavel}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome completo"
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="E-mail" required>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="seu@email.com"
                      />
                    </Field>
                    <Field label="Telefone" required>
                      <Input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        required
                        placeholder="(11) 9 0000-0000"
                      />
                    </Field>
                  </div>

                  <Field label="Cidade / Estado" required>
                    <Input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: Barueri, SP"
                    />
                  </Field>

                  <Field label="Mensagem (opcional)">
                    <Textarea
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Conte um pouco sobre seu restaurante..."
                    />
                  </Field>

                  <Button
                    type="submit"
                    size="lg"
                    icon={MdSend}
                    className="w-full"
                  >
                    Enviar Formulário
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge tone="brand">Dúvidas Frequentes</Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Perguntas Frequentes
            </h2>
          </div>

          <Card padding="p-3 sm:p-4">
            {faqData.map((item, i) => (
              <FaqItem
                key={item.question}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200/80 py-10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-gray-600">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src="/fast cooking logo.svg"
                  alt="Fast Cooking"
                  className="h-8 w-auto"
                />
                <span className="font-black text-sm text-brand">
                  Fast Cooking
                </span>
              </div>
              <p className="leading-relaxed">
                Sistema inteligente de gestão de pedidos para restaurantes de
                pequeno e médio porte.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Navegação</h4>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="#features"
                    className="hover:text-brand transition-colors"
                  >
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-brand transition-colors"
                  >
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-brand transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-brand transition-colors"
                  >
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Módulos</h4>
              <ul className="space-y-1.5">
                <li>Autoatendimento (Cliente)</li>
                <li>Operacional (Garçom)</li>
                <li>KDS (Cozinha)</li>
                <li>Administrativo (Gerente)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Contato</h4>
              <ul className="space-y-1.5">
                <li>fastcooking@comercial.com.br</li>
                <li>(11) 9 0000-0000</li>
                <li>Barueri, SP — Brasil</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            <p>
              © {new Date().getFullYear()} FastCooking. Desenvolvido por alunos
              da FATEC Osasco.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/fast cooking logo.png';
import {
    MdRestaurantMenu,
    MdNotifications,
    MdQrCode2,
    MdDashboard,
    MdSpeed,
    MdSecurity,
    MdExpandMore,
    MdExpandLess,
    MdSend,
    MdPhone,
    MdEmail,
    MdLocationOn,
    MdCheckCircle,
    MdArrowForward,
    MdGroups,
    MdInventory,
} from 'react-icons/md';

/* ─── FAQ data ─────────────────────────────────────────── */
const faqData = [
    {
        question: 'O que é o FastCooking?',
        answer:
            'O FastCooking é uma plataforma web integrada de gestão de pedidos para restaurantes. Ele substitui comandas em papel por um sistema digital que conecta clientes, garçons, cozinha e gerente em tempo real, aumentando a agilidade, reduzindo erros e melhorando a experiência de todos.',
    },
    {
        question: 'Como funciona o autoatendimento pelo QR Code?',
        answer:
            'Cada mesa possui um QR Code exclusivo. Ao escaneá-lo com o celular, o cliente abre a mesa automaticamente e inicia uma sessão de atendimento. A partir daí, ele pode fazer pedidos, acompanhar o status de preparo em tempo real e solicitar o fechamento da conta — tudo sem precisar chamar o garçom.',
    },
    {
        question: 'O cliente precisa criar uma conta ou fazer login?',
        answer:
            'Não! O módulo de autoatendimento do cliente não exige nenhum cadastro ou login. Basta escanear o QR Code da mesa para começar a usar. As ações ficam restritas à sessão daquela mesa específica.',
    },
    {
        question: 'Como os garçons recebem os pedidos prontos?',
        answer:
            'Quando a cozinha marca um item como "pronto" no KDS (Kitchen Display System), todos os garçons em serviço recebem uma notificação sonora e visual em seus dispositivos móveis instantaneamente. Qualquer garçom que esteja disponível (sem entregas pendentes) pode assumir a entrega, garantindo agilidade e distribuição equilibrada do trabalho.',
    },
    {
        question: 'O sistema funciona apenas para restaurantes de que porte?',
        answer:
            'O FastCooking foi projetado para atender estabelecimentos gastronômicos de pequeno e médio porte, com foco em restaurantes que fazem atendimento presencial e possuem produção própria. É ideal para quem quer modernizar o processo de pedidos sem grandes investimentos em infraestrutura.',
    },
    {
        question: 'Qual é o custo para aderir ao FastCooking?',
        answer:
            'Os planos e condições comerciais são personalizados de acordo com o perfil do seu estabelecimento. Preencha o formulário de contato nesta página e nossa equipe comercial entrará em contato com uma proposta sob medida para você.',
    },
    {
        question: 'O gerente consegue controlar o estoque pelo sistema?',
        answer:
            'Sim. O módulo administrativo permite ao gerente realizar a gestão de cardápio, controle de estoque por prato, cadastro de funcionários e acompanhamento operacional de forma simples e direta.',
    },
    {
        question: 'O sistema precisa de internet para funcionar?',
        answer:
            'Sim, o FastCooking é uma aplicação web e necessita de conexão com a internet. Recomendamos uma rede Wi-Fi estável no estabelecimento para garantir o funcionamento em tempo real entre todos os módulos.',
    },
];

/* ─── Features data ────────────────────────────────────── */
const features = [
    {
        icon: MdQrCode2,
        title: 'Autoatendimento via QR Code',
        description:
            'O cliente escaneia o QR Code da mesa, faz pedidos e acompanha o preparo em tempo real — sem precisar chamar o garçom.',
    },
    {
        icon: MdNotifications,
        title: 'Notificações Inteligentes',
        description:
            'Garçons recebem alertas sonoros e visuais em tempo real quando um pedido fica pronto, garantindo entregas rápidas.',
    },
    {
        icon: MdRestaurantMenu,
        title: 'KDS — Kitchen Display System',
        description:
            'Monitor de pedidos para a cozinha com priorização dinâmica, agrupamento por categoria e eliminação da comunicação verbal.',
    },
    {
        icon: MdDashboard,
        title: 'Painel Administrativo',
        description:
            'Gestão completa do cardápio, controle de estoque por prato, cadastro de funcionários e controle de acesso.',
    },
    {
        icon: MdGroups,
        title: 'Atendimento Compartilhado',
        description:
            'Qualquer garçom disponível pode atender qualquer mesa. Sem zoneamento fixo, o trabalho é distribuído de forma equilibrada.',
    },
    {
        icon: MdInventory,
        title: 'Controle de Estoque',
        description:
            'Gerenciamento de estoque por prato com definição e ajuste manual pelo gerente, evitando vendas de itens indisponíveis.',
    },
];

/* ─── How it works data ────────────────────────────────── */
const steps = [
    {
        number: '01',
        title: 'Escaneia o QR Code',
        description:
            'O cliente aponta a câmera para o QR Code da mesa. A mesa é aberta automaticamente e uma sessão de atendimento é iniciada.',
    },
    {
        number: '02',
        title: 'Faz o Pedido',
        description:
            'Pelo celular, o cliente navega pelo cardápio e confirma seus itens. O garçom também pode adicionar itens à mesma comanda.',
    },
    {
        number: '03',
        title: 'Cozinha Produz',
        description:
            'O pedido chega ao KDS da cozinha com prioridade dinâmica. A equipe prepara os pratos na ordem mais eficiente.',
    },
    {
        number: '04',
        title: 'Entrega Instantânea',
        description:
            'Quando o prato fica pronto, todos os garçons são notificados. O primeiro disponível assume e entrega à mesa.',
    },
];

/* ─── FAQ Item Component ───────────────────────────────── */
function FaqItem({ item, isOpen, onToggle }) {
    return (
        <div className="border-b border-[#B78A10]/20 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-5 px-2 text-left cursor-pointer group"
            >
                <span className="text-lg font-medium text-gray-800 group-hover:text-[#9C1C0E] transition-colors">
                    {item.question}
                </span>
                {isOpen ? (
                    <MdExpandLess className="text-[#B78A10] text-2xl flex-shrink-0 ml-4" />
                ) : (
                    <MdExpandMore className="text-[#B78A10] text-2xl flex-shrink-0 ml-4" />
                )}
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-5 px-2' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
            </div>
        </div>
    );
}

/* ─── Main LandingPage ─────────────────────────────────── */
export default function LandingPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);

    const [openFaq, setOpenFaq] = useState(null);
    const [formData, setFormData] = useState({
        nomeRestaurante: '',
        nomeResponsavel: '',
        email: '',
        telefone: '',
        cidade: '',
        mensagem: '',
    });
    const [formEnviado, setFormEnviado] = useState(false);

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        <div className="min-h-screen bg-white font-[Poppins]">
            {/* ─── Top Bar / Navbar ───────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <a href="#hero" className="flex items-center gap-2">
                        <img src={logo} alt="Fast Cooking" className="h-10" />
                    </a>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
                        <a href="#features" className="hover:text-[#9C1C0E] transition-colors">
                            Funcionalidades
                        </a>
                        <a href="#how-it-works" className="hover:text-[#9C1C0E] transition-colors">
                            Como Funciona
                        </a>
                        <a href="#faq" className="hover:text-[#9C1C0E] transition-colors">
                            FAQ
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={scrollToForm}
                            className="px-4 py-2 text-sm font-semibold text-[#B78A10] border-2 border-[#B78A10] rounded-lg hover:bg-[#B78A10] hover:text-white transition-all cursor-pointer"
                        >
                            Quero Aderir
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-sm font-semibold text-white bg-[#9C1C0E] rounded-lg hover:bg-[#7a160b] transition-all cursor-pointer"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ───────────────────────────────── */}
            <section
                id="hero"
                className="relative pt-28 pb-20 md:pt-40 md:pb-32 bg-gradient-to-br from-[#F9ECE5] via-white to-[#F9ECE5] overflow-hidden"
            >
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#B78A10]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-32 w-80 h-80 bg-[#9C1C0E]/5 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 bg-[#B78A10]/10 text-[#B78A10] text-sm font-semibold px-4 py-2 rounded-full">
                                <MdSpeed className="text-lg" />
                                Gestão inteligente para restaurantes
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Transforme a operação do seu{' '}
                                <span className="text-[#9C1C0E]">restaurante</span>
                            </h1>

                            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                                O FastCooking digitaliza e automatiza todo o processo de gestão de pedidos
                                — do QR Code na mesa até a entrega do prato — eliminando comandas em
                                papel, reduzindo erros e elevando a experiência do cliente.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={scrollToForm}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#9C1C0E] text-white font-semibold rounded-xl hover:bg-[#7a160b] shadow-lg shadow-[#9C1C0E]/20 transition-all cursor-pointer text-lg"
                                >
                                    Quero Aderir
                                    <MdArrowForward className="text-xl" />
                                </button>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-[#B78A10] hover:text-[#B78A10] transition-all text-lg"
                                >
                                    Saiba Mais
                                </a>
                            </div>

                            {/* Quick stats */}
                            <div className="grid grid-cols-3 gap-6 pt-4">
                                <div>
                                    <p className="text-2xl font-bold text-[#9C1C0E]">4</p>
                                    <p className="text-sm text-gray-500">Módulos Integrados</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-[#B78A10]">100%</p>
                                    <p className="text-sm text-gray-500">Digital</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-[#9C1C0E]">Tempo Real</p>
                                    <p className="text-sm text-gray-500">Sincronização</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero visual — abstract illustration */}
                        <div className="hidden md:flex justify-center items-center">
                            <div className="relative w-full max-w-md">
                                {/* Main card */}
                                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-[#9C1C0E]/10 rounded-2xl flex items-center justify-center">
                                            <MdRestaurantMenu className="text-[#9C1C0E] text-2xl" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">Pedido #142</p>
                                            <p className="text-sm text-gray-500">Mesa 7 • Há 3 min</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Filé Mignon
                                            </span>
                                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                Pronto
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-yellow-50 rounded-xl px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Risoto de Camarão
                                            </span>
                                            <span className="text-xs font-semibold text-[#B78A10] bg-yellow-100 px-2 py-1 rounded-full">
                                                Em preparo
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Suco Natural
                                            </span>
                                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                Pendente
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating notification card */}
                                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-bounce-slow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#B78A10]/10 rounded-full flex items-center justify-center">
                                            <MdNotifications className="text-[#B78A10] text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">
                                                Pedido pronto!
                                            </p>
                                            <p className="text-xs text-gray-500">Mesa 7 — Filé Mignon</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating QR card */}
                                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#9C1C0E]/10 rounded-full flex items-center justify-center">
                                            <MdQrCode2 className="text-[#9C1C0E] text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">
                                                Autoatendimento
                                            </p>
                                            <p className="text-xs text-gray-500">Sem login necessário</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ───────────────────────────── */}
            <section id="features" className="py-20 md:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-[#B78A10] font-semibold text-sm uppercase tracking-widest">
                            Funcionalidades
                        </span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                            Tudo que seu restaurante precisa em um só lugar
                        </h2>
                        <p className="mt-4 text-gray-600 text-lg">
                            O FastCooking integra quatro módulos — Cliente, Garçom, Cozinha e
                            Administrativo — para digitalizar toda a operação do seu estabelecimento.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="group relative bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:border-[#B78A10]/30 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-[#F9ECE5] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#9C1C0E]/10 transition-colors">
                                    <f.icon className="text-[#9C1C0E] text-2xl" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How it Works Section ───────────────────────── */}
            <section
                id="how-it-works"
                className="py-20 md:py-28 bg-gradient-to-b from-[#F9ECE5]/50 to-white"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-[#9C1C0E] font-semibold text-sm uppercase tracking-widest">
                            Como Funciona
                        </span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                            Simples, rápido e integrado
                        </h2>
                        <p className="mt-4 text-gray-600 text-lg">
                            Do QR Code na mesa até a entrega do prato, tudo acontece de forma digital e
                            em tempo real.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((s, i) => (
                            <div key={i} className="relative text-center group">
                                {/* Connector line */}
                                {i < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-0.5 bg-gradient-to-r from-[#B78A10]/30 to-[#9C1C0E]/30" />
                                )}
                                <div className="relative z-10 w-20 h-20 mx-auto bg-white border-2 border-[#B78A10] rounded-full flex items-center justify-center mb-6 shadow-md group-hover:bg-[#B78A10] group-hover:border-[#B78A10] transition-all">
                                    <span className="text-2xl font-bold text-[#B78A10] group-hover:text-white transition-colors">
                                        {s.number}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Benefits Banner ────────────────────────────── */}
            <section className="py-16 bg-[#9C1C0E]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
                        <div>
                            <MdSpeed className="text-4xl mx-auto mb-3 text-[#B78A10]" />
                            <h3 className="text-xl font-bold mb-1">Mais Agilidade</h3>
                            <p className="text-sm text-white/80">Redução do tempo entre pedido e entrega</p>
                        </div>
                        <div>
                            <MdCheckCircle className="text-4xl mx-auto mb-3 text-[#B78A10]" />
                            <h3 className="text-xl font-bold mb-1">Menos Erros</h3>
                            <p className="text-sm text-white/80">Eliminação de comandas em papel</p>
                        </div>
                        <div>
                            <MdGroups className="text-4xl mx-auto mb-3 text-[#B78A10]" />
                            <h3 className="text-xl font-bold mb-1">Equipe Equilibrada</h3>
                            <p className="text-sm text-white/80">Distribuição justa de trabalho</p>
                        </div>
                        <div>
                            <MdSecurity className="text-4xl mx-auto mb-3 text-[#B78A10]" />
                            <h3 className="text-xl font-bold mb-1">Controle Total</h3>
                            <p className="text-sm text-white/80">Gestão e rastreabilidade completa</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Contact Form Section ───────────────────────── */}
            <section
                id="contact"
                ref={formRef}
                className="py-20 md:py-28 bg-gradient-to-b from-white to-[#F9ECE5]/30"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        {/* Left info */}
                        <div className="space-y-8">
                            <div>
                                <span className="text-[#B78A10] font-semibold text-sm uppercase tracking-widest">
                                    Seja um Parceiro
                                </span>
                                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                                    Leve o FastCooking para o seu restaurante
                                </h2>
                                <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                                    Preencha o formulário ao lado e nossa equipe comercial entrará em contato
                                    com uma proposta personalizada para o seu estabelecimento.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#9C1C0E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MdEmail className="text-[#9C1C0E] text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">E-mail Comercial</p>
                                        <p className="font-semibold text-gray-800">
                                            fastcooking@comercial.com.br
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#9C1C0E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MdPhone className="text-[#9C1C0E] text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Telefone</p>
                                        <p className="font-semibold text-gray-800">(11) 9 0000-0000</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#9C1C0E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MdLocationOn className="text-[#9C1C0E] text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Localização</p>
                                        <p className="font-semibold text-gray-800">Barueri, SP — Brasil</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right form */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
                            {formEnviado ? (
                                <div className="text-center py-12 space-y-4">
                                    <MdCheckCircle className="text-6xl text-green-500 mx-auto" />
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Formulário Enviado!
                                    </h3>
                                    <p className="text-gray-600">
                                        Em breve nossa equipe entrará em contato com você.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Formulário de Adesão
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome do Restaurante *
                                        </label>
                                        <input
                                            type="text"
                                            name="nomeRestaurante"
                                            value={formData.nomeRestaurante}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B78A10] focus:border-transparent outline-none transition-all"
                                            placeholder="Ex: Restaurante Sabor Caseiro"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome do Responsável *
                                        </label>
                                        <input
                                            type="text"
                                            name="nomeResponsavel"
                                            value={formData.nomeResponsavel}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B78A10] focus:border-transparent outline-none transition-all"
                                            placeholder="Seu nome completo"
                                        />
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                E-mail *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B78A10] focus:border-transparent outline-none transition-all"
                                                placeholder="seu@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Telefone *
                                            </label>
                                            <input
                                                type="tel"
                                                name="telefone"
                                                value={formData.telefone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B78A10] focus:border-transparent outline-none transition-all"
                                                placeholder="(11) 9 0000-0000"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cidade / Estado *
                                        </label>
                                        <input
                                            type="text"
                                            name="cidade"
                                            value={formData.cidade}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B78A10] focus:border-transparent outline-none transition-all"
                                            placeholder="Ex: Barueri, SP"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mensagem (opcional)
                                        </label>
                                        <textarea
                                            name="mensagem"
                                            value={formData.mensagem}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B78A10] focus:border-transparent outline-none transition-all resize-none"
                                            placeholder="Conte um pouco sobre seu restaurante..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#9C1C0E] text-white font-semibold rounded-xl hover:bg-[#7a160b] shadow-lg shadow-[#9C1C0E]/20 transition-all cursor-pointer text-lg"
                                    >
                                        <MdSend className="text-xl" />
                                        Enviar Formulário
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FAQ Section ────────────────────────────────── */}
            <section id="faq" className="py-20 md:py-28 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <span className="text-[#B78A10] font-semibold text-sm uppercase tracking-widest">
                            Dúvidas Frequentes
                        </span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                            Perguntas Frequentes
                        </h2>
                        <p className="mt-4 text-gray-600 text-lg">
                            Encontre respostas para as dúvidas mais comuns sobre o FastCooking.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y-0 p-2">
                        {faqData.map((item, i) => (
                            <FaqItem
                                key={i}
                                item={item}
                                isOpen={openFaq === i}
                                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Footer ─────────────────────────────────────── */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div className="space-y-4">
                            <img
                                src={logo}
                                alt="Fast Cooking"
                                className="h-12 brightness-0 invert"
                            />
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Sistema inteligente de gestão de pedidos para restaurantes de pequeno e
                                médio porte.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[#B78A10]">Navegação</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>
                                    <a href="#features" className="hover:text-white transition-colors">
                                        Funcionalidades
                                    </a>
                                </li>
                                <li>
                                    <a href="#how-it-works" className="hover:text-white transition-colors">
                                        Como Funciona
                                    </a>
                                </li>
                                <li>
                                    <a href="#faq" className="hover:text-white transition-colors">
                                        FAQ
                                    </a>
                                </li>
                                <li>
                                    <a href="#contact" className="hover:text-white transition-colors">
                                        Contato
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[#B78A10]">Módulos</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>Autoatendimento (Cliente)</li>
                                <li>Operacional (Garçom)</li>
                                <li>KDS (Cozinha)</li>
                                <li>Administrativo (Gerente)</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[#B78A10]">Contato</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>fastcooking@comercial.com.br</li>
                                <li>(11) 9 0000-0000</li>
                                <li>Barueri, SP — Brasil</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                        <p>
                            © {new Date().getFullYear()} FastCooking. Desenvolvido por alunos da FATEC
                            Osasco.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

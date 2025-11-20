import React, { useState } from 'react';
import { CheckIcon, LogOutIcon } from './icons/Icons';

// --- Configuration Checks ---
const checkoutUrlMonthly = process.env.VITE_CHECKOUT_URL_MONTHLY;
const checkoutUrlQuarterly = process.env.VITE_CHECKOUT_URL_QUARTERLY;
const checkoutUrlAnnual = process.env.VITE_CHECKOUT_URL_ANNUAL;

const plans = [
  {
    name: 'Mensal',
    oldPrice: 'R$39,90',
    price: 'R$34,90',
    priceSuffix: '/mês',
    billingInfo: null,
    description: 'Acesso completo, pague mês a mês.',
    checkoutUrl: checkoutUrlMonthly,
    envVar: 'CHECKOUT_URL_MONTHLY',
    features: [
      '5 Planos + Cronograma de Estudo IA / Mês',
      '5 Raio-x do Edital e das provas anteriores',
      'Tutor Gemini Pro Ilimitado',
      'Métricas de Desempenho',
      'Banco de Questões',
      '100 pedidos de provas anteriores',
      'Flashcards com IA',
    ],
    highlight: false,
  },
  {
    name: 'Trimestral',
    oldPrice: 'R$27,90',
    price: 'R$19,90',
    priceSuffix: '/mês',
    billingInfo: 'ou à vista por apenas R$ 51,00',
    description: 'Economize 2 meses e acelere seus estudos.',
    checkoutUrl: checkoutUrlQuarterly,
    envVar: 'CHECKOUT_URL_QUARTERLY',
    features: [
      '10 Planos + Cronograma de Estudo IA / Mês',
      '10 Raio-x do Edital e das provas anteriores',
      'Tutor Gemini Pro Ilimitado',
      'Métricas de Desempenho',
      'Banco de Questões',
      '1000 pedidos de provas anteriores',
      'Flashcards com IA',
    ],
    highlight: true,
  },
  {
    name: 'Anual',
    oldPrice: 'R$16,90',
    price: 'R$11,90',
    priceSuffix: '/mês',
    billingInfo: 'ou à vista por apenas R$ 97,00',
    description: 'Melhor custo-benefício para aprovação.',
    checkoutUrl: checkoutUrlAnnual,
    envVar: 'CHECKOUT_URL_ANNUAL',
    features: [
      'Planos + Cronograma de Estudo IA - Ilimitado',
      'Raio-x do Edital e das provas anteriores - Ilimitado',
      'Tutor Gemini Pro Ilimitado',
      'Métricas de Desempenho',
      'Banco de Questões',
      'Pedidos de provas anteriores - Ilimitados',
      'Flashcards com IA - Ilimitado',
    ],
    highlight: false,
  },
];

interface PlanosAssinaturaPageProps {
  isBlockedMode?: boolean;
  onLogout?: () => void;
}

export const PlanosAssinaturaPage: React.FC<PlanosAssinaturaPageProps> = ({ isBlockedMode = false, onLogout }) => {
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = (checkoutUrl: string | undefined, planName: string, envVar: string) => {
        setError(null);

        if (!checkoutUrl || checkoutUrl === 'undefined') {
             const errorMessage = `O link de checkout para o plano ${planName} não foi encontrado. Por favor, adicione a variável de ambiente abaixo no seu arquivo .env.local e reinicie o servidor de desenvolvimento.\n\n${envVar}=seu_link_de_checkout_aqui`;
             setError(errorMessage);
             return;
        }
        
        window.open(checkoutUrl, '_blank');
    };

    const renderPlansGrid = () => (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">Acelere sua Aprovação</h2>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Escolha o plano que melhor se adapta à sua jornada de estudos e tenha acesso a todas as ferramentas para conquistar seu cargo.
                </p>
            </div>

             {error && (
                <div className="mb-6 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-lg text-center whitespace-pre-wrap">
                    <p className="font-semibold mb-2">Erro de Configuração</p>
                    <code className="text-sm">{error}</code>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {plans.map((plan) => (
                    <div key={plan.name} className={`relative bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border-2 transition-all duration-300 ${plan.highlight ? 'border-green-500 dark:border-green-400 scale-105' : 'border-transparent dark:border-slate-700'}`}>
                        {plan.highlight && (
                            <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">Mais Popular</span>
                        )}
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 text-center">{plan.name}</h3>
                        <div className="mt-4 text-center min-h-[100px]">
                            {plan.oldPrice && <p className="text-base text-red-500 line-through">de {plan.oldPrice} por</p>}
                            <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">{plan.price}</span>
                            {plan.priceSuffix && <span className="text-lg font-medium text-slate-500 dark:text-slate-400">{plan.priceSuffix}</span>}
                            {plan.billingInfo && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.billingInfo}</p>}
                        </div>
                        <p className="text-center text-slate-500 dark:text-slate-400 mt-2 h-12">{plan.description}</p>
                        
                        <ul className="mt-8 space-y-4 min-h-[280px]">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mr-3 mt-1" />
                                    <span className="text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: feature.replace(/ - /g, ' <span class="font-bold text-green-500 dark:text-green-400">-</span> ') }}></span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan.checkoutUrl, plan.name, plan.envVar)}
                            className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold text-lg transition-colors ${
                                plan.highlight 
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white'
                            }`}
                        >
                            Assinar Agora
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    if (isBlockedMode) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                         <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">DeepStudy.AI Premium</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Uma assinatura ativa é necessária para acessar a plataforma.</p>
                         </div>
                         {onLogout && (
                            <button onClick={onLogout} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg transition-colors">
                                <LogOutIcon className="w-4 h-4" />
                                <span>Sair da Conta</span>
                            </button>
                        )}
                    </div>
                    
                    {/* Modal Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#F7F9FC] dark:bg-slate-900">
                         {renderPlansGrid()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F7F9FC] dark:bg-slate-900">
            <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Planos e Assinatura</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-6">
                {renderPlansGrid()}
            </main>
        </div>
    );
};
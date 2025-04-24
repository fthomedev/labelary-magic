
import { SEO } from "@/components/SEO";

const Documentation = () => {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <SEO 
        title="Documentação da API ZPL Easy"
        description="Guia completo de endpoints e exemplos de integração para devs."
      />
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Documentação da API
        </h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mt-8">Introdução à API</h2>
          <p>
            A API ZPL Easy permite que você integre recursos de conversão ZPL para PDF diretamente em seu sistema.
            Aqui você encontrará guias detalhados, exemplos de código e referências de endpoint.
          </p>
          
          <h2 className="text-2xl font-bold mt-8">Autenticação</h2>
          <p>
            Todas as solicitações de API devem ser autenticadas usando sua chave de API.
            Para obter sua chave, acesse seu painel e navegue até a seção de Configurações de API.
          </p>
          
          <h2 className="text-2xl font-bold mt-8">Endpoints Disponíveis</h2>
          
          <h3 className="text-xl font-bold mt-6">Converter ZPL para PDF</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>POST https://api.zpleasy.com/convert</code>
          </pre>
          <p>
            Este endpoint recebe código ZPL e retorna um arquivo PDF. Suporta conteúdo raw ou base64.
          </p>
          
          <h3 className="text-xl font-bold mt-6">Status da Conversão</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>GET https://api.zpleasy.com/status/{"job_id"}</code>
          </pre>
          <p>
            Verifique o status de uma conversão em andamento utilizando o ID de referência.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Documentation;

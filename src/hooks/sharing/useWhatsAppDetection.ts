
export const useWhatsAppDetection = () => {
  const detectWhatsApp = (): 'native' | 'web' | 'none' => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);

    // Se estiver em dispositivo móvel, tentar o WhatsApp nativo primeiro
    if (isMobile) {
      return 'native';
    }

    // Se estiver em desktop, usar WhatsApp Web
    return 'web';
  };

  const openWhatsApp = (message: string, preferNative: boolean = true) => {
    const encodedMessage = encodeURIComponent(message);
    const detection = detectWhatsApp();

    if (detection === 'native' && preferNative) {
      // Tentar abrir WhatsApp nativo primeiro
      const nativeUrl = `whatsapp://send?text=${encodedMessage}`;
      
      // Criar um link temporário para testar se o WhatsApp está instalado
      const tempLink = document.createElement('a');
      tempLink.href = nativeUrl;
      
      // Definir um timeout para fallback ao WhatsApp Web
      const fallbackTimeout = setTimeout(() => {
        // Se após 2 segundos não abriu o WhatsApp nativo, usar o Web
        const webUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
        window.open(webUrl, '_blank');
      }, 2000);

      // Tentar abrir o WhatsApp nativo
      try {
        window.location.href = nativeUrl;
        // Se conseguiu abrir, limpar o timeout
        setTimeout(() => clearTimeout(fallbackTimeout), 1000);
      } catch (error) {
        // Se falhou, limpar timeout e abrir Web imediatamente
        clearTimeout(fallbackTimeout);
        const webUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
        window.open(webUrl, '_blank');
      }
    } else {
      // Usar WhatsApp Web diretamente
      const webUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
      window.open(webUrl, '_blank');
    }
  };

  return {
    detectWhatsApp,
    openWhatsApp,
  };
};

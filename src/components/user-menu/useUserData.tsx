
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserData() {
  const [userData, setUserData] = useState<{
    name: string | null;
    email: string | null;
  } | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Primeiro, tente obter o perfil do banco de dados
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.name) {
          // Se o perfil existir e tiver um nome, use-o
          setUserData(profile);
        } else {
          // Se não houver perfil ou o nome estiver vazio, use os dados do usuário autenticado
          const userData = {
            name: user.user_metadata?.name || null,
            email: user.email
          };
          
          // Atualizar o perfil com os dados do usuário se necessário
          if (!profile || !profile.name) {
            await supabase.from('profiles')
              .update({ name: userData.name })
              .eq('id', user.id);
          }
          
          setUserData(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Carregar os dados do usuário ao inicializar o hook
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return { userData, loadUserData };
}

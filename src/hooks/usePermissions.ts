import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

export const usePermissions = () => {
  const { user, profile } = useAuth();
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      const { data } = await supabase
        .from('buyer_authorizations')
        .select('permissions')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setPermissions(data.permissions);
      } else {
        // Default based on role
        const role = profile?.role;
        if (role === 'buyer') {
          setPermissions({ show_photos: true, show_price: false, show_plate: false, show_details: false, show_client_data: false, send_whatsapp: false, send_chat: true, send_fipe: false, send_banco: false });
        } else if (role === 'buyer_premium') {
          setPermissions({ show_photos: true, show_price: true, show_plate: true, show_details: true, show_client_data: false, send_whatsapp: false, send_chat: true, send_fipe: true, send_banco: true });
        } else if (role === 'buyer_master') {
          setPermissions({ show_photos: true, show_price: true, show_plate: true, show_details: true, show_client_data: true, send_whatsapp: true, send_chat: true, send_fipe: true, send_banco: true });
        } else {
          setPermissions({ show_photos: true, show_price: true, show_plate: false, show_details: true, show_client_data: false, send_whatsapp: false, send_chat: false, send_fipe: false, send_banco: false });
        }
      }
      setLoading(false);
    };
    fetchPermissions();
  }, [user, profile]);

  return { permissions, loading };
};

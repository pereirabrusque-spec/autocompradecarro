import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/authContext';

export const NotificationSettings = () => {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(profile?.notification_enabled ?? true);

  const toggleNotifications = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    await supabase
      .from('profiles')
      .update({ notification_enabled: newValue })
      .eq('id', profile?.id);
  };

  return (
    <div className="notification-settings">
      <label>
        <input type="checkbox" checked={enabled} onChange={toggleNotifications} />
        Ativar notificações (mesmo offline)
      </label>
    </div>
  );
};

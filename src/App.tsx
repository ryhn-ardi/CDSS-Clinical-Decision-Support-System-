/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const theme = useAppStore(state => state.theme);

  useEffect(() => {
    document.body.classList.remove('theme-light', 'dark', 'theme-pink');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else if (theme === 'pink') {
      document.body.classList.add('theme-pink');
    } else {
      document.body.classList.add('theme-light');
    }
  }, [theme]);

  return <Dashboard />;
}
